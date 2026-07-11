# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class CircuitGate(gl.Contract):
    # --- config ---
    owner: str

    # --- verdict storage, keyed by case_id ---
    verdict_counter: u256
    case_ids: DynArray[str]
    g_action_id: TreeMap[str, str]
    g_kind: TreeMap[str, str]
    g_outcome: TreeMap[str, str]
    g_match_status: TreeMap[str, str]
    g_threshold_status: TreeMap[str, str]
    g_approved_status: TreeMap[str, str]
    g_policy_status: TreeMap[str, str]
    g_reasoning: TreeMap[str, str]
    g_minority_note: TreeMap[str, str]
    g_proposal_url: TreeMap[str, str]
    g_amount: TreeMap[str, u256]
    g_cap: TreeMap[str, u256]
    g_recipient: TreeMap[str, str]
    g_param_value: TreeMap[str, u256]
    g_param_cap: TreeMap[str, u256]
    g_treasury_balance: TreeMap[str, u256]

    def __init__(self, owner_address: str):
        self.owner = owner_address.lower()
        self.verdict_counter = u256(0)

    # ---------- the gate: decode action, fetch evidence, run four breakers ----------
    @gl.public.write
    def run_gate(
        self,
        action_id: str,
        kind: str,
        recipient: str,
        amount: int,
        param_name: str,
        param_value: int,
        proposal_url: str,
        treasury_balance: int,
        max_transfer_bps: int,
        param_fee_cap_bps: int,
        approved_destinations_json: str,
    ) -> str:
        if proposal_url.strip() == "":
            raise gl.UserError("proposal_url required for the calldata-vs-proposal check")
        if kind != "transfer" and kind != "param_change":
            raise gl.UserError("kind must be transfer or param_change")

        case_id = "circuit_" + str(int(self.verdict_counter))

        # --- copy inputs to locals (self is not accessible inside nondet blocks) ---
        local_kind = kind
        local_recipient = recipient.lower()
        local_amount = int(amount) if amount > 0 else 0
        local_param_name = param_name
        local_param_value = int(param_value) if param_value > 0 else 0
        local_proposal_url = proposal_url
        local_treasury = int(treasury_balance) if treasury_balance > 0 else 0
        local_max_bps = int(max_transfer_bps) if max_transfer_bps > 0 else 0
        local_param_cap = int(param_fee_cap_bps) if param_fee_cap_bps > 0 else 0

        # --- deterministic decode of the locked approved-destination list ---
        approved = []
        try:
            approved = json.loads(approved_destinations_json)
        except Exception:
            approved = []
        approved_set = {}
        for a in approved:
            approved_set[str(a).lower()] = True

        # --- deterministic breakers (exact math vs locked policy) ---
        cap = local_treasury * local_max_bps // 10000
        threshold_status = "n/a"
        approved_status = "n/a"
        policy_status = "n/a"
        over_hard = False
        soft_breach = False

        if local_kind == "transfer":
            threshold_status = "pass" if local_amount <= cap else "fail"
            approved_status = "pass" if local_recipient in approved_set else "fail"
            over_hard = local_amount > (2 * cap)
            soft_breach = (local_amount > cap) and (local_amount <= 2 * cap)
        else:
            policy_status = "pass" if local_param_value <= local_param_cap else "fail"

        # --- human-readable decode of the executable action ---
        if local_kind == "transfer":
            action_desc = (
                "transfer " + str(local_amount)
                + " GenUSDC from the protected treasury to recipient "
                + local_recipient
            )
        else:
            action_desc = (
                "set protocol parameter '" + local_param_name
                + "' to value " + str(local_param_value) + " (basis points)"
            )
        local_action_desc = action_desc

        # --- fetch the governance proposal (contract-fetched evidence) ---
        def fetch_proposal() -> str:
            response = gl.nondet.web.get(local_proposal_url)
            body = response.body.decode("utf-8")
            return body[:3000]

        proposal_text = gl.eq_principle.strict_eq(fetch_proposal)
        local_proposal_text = proposal_text

        # --- semantic breaker: calldata-vs-proposal, decided by consensus ---
        def get_input() -> str:
            return (
                "EXECUTABLE ACTION (the real decoded on-chain action that will "
                "execute if allowed):\n"
                + local_action_desc
                + "\n\nGOVERNANCE PROPOSAL TEXT (fetched from "
                + local_proposal_url + "):\n"
                + local_proposal_text
            )

        task = (
            "You are a governance-firewall verifier. Compare the EXECUTABLE "
            "ACTION (the real, decoded on-chain action that will execute) against "
            "the GOVERNANCE PROPOSAL TEXT (what the proposal claims the action "
            "should do). Decide if the executable action faithfully matches the "
            "proposal's stated intent.\n"
            "A MISMATCH is when the action does something materially different "
            "from, or beyond, what the proposal describes. Examples: the proposal "
            "says 'adjust the fee parameter' but the action transfers treasury "
            "funds; the proposal says 'transfer to the grants wallet' but the "
            "action sends to a different address; the proposal describes a small "
            "change but the action is far larger.\n"
            "A MATCH is when the action's effect is what the proposal describes.\n"
            "Judge ONLY faithfulness of action-to-proposal. Do NOT judge whether "
            "the amount is within policy limits or whether the destination is on "
            "an approved list; those are separate deterministic checks handled "
            "elsewhere. Return ONLY one JSON object with keys: match (true or "
            "false), reasoning (1-2 sentences grounded in the specific action "
            "fields and the proposal text), minority_note (one sentence giving "
            "the strongest argument for the opposite verdict, or an empty string)."
        )
        criteria_check = (
            "The response is exactly one valid JSON object with keys match, "
            "reasoning, minority_note. match is a boolean. reasoning is a "
            "non-empty string grounded in the actual action fields and proposal "
            "text. match is true only if the executable action faithfully "
            "reflects the proposal's stated intent."
        )

        raw = gl.eq_principle.prompt_non_comparative(
            get_input,
            task=task,
            criteria=criteria_check,
        )

        parsed = json.loads(raw)
        match = str(parsed["match"]).strip().lower() == "true"
        reasoning = str(parsed["reasoning"])
        minority_note = str(parsed["minority_note"])
        match_status = "pass" if match else "fail"

        # --- combine the four breakers into the gate outcome (deterministic) ---
        if match_status == "fail":
            outcome = "BLOCK"
        elif local_kind == "param_change" and policy_status == "fail":
            outcome = "BLOCK"
        elif local_kind == "transfer" and over_hard:
            outcome = "BLOCK"
        elif local_kind == "transfer" and approved_status == "fail":
            outcome = "ESCALATE"
        elif local_kind == "transfer" and soft_breach:
            outcome = "DELAY"
        else:
            outcome = "ALLOW"

        # --- store the verdict ---
        self.verdict_counter = u256(int(self.verdict_counter) + 1)
        self.case_ids.append(case_id)
        self.g_action_id[case_id] = action_id
        self.g_kind[case_id] = local_kind
        self.g_outcome[case_id] = outcome
        self.g_match_status[case_id] = match_status
        self.g_threshold_status[case_id] = threshold_status
        self.g_approved_status[case_id] = approved_status
        self.g_policy_status[case_id] = policy_status
        self.g_reasoning[case_id] = reasoning
        self.g_minority_note[case_id] = minority_note
        self.g_proposal_url[case_id] = local_proposal_url
        self.g_amount[case_id] = u256(local_amount)
        self.g_cap[case_id] = u256(cap)
        self.g_recipient[case_id] = local_recipient
        self.g_param_value[case_id] = u256(local_param_value)
        self.g_param_cap[case_id] = u256(local_param_cap)
        self.g_treasury_balance[case_id] = u256(local_treasury)

        return case_id

    # ---------- views ----------
    @gl.public.view
    def get_verdict(self, case_id: str) -> dict:
        if case_id not in self.g_outcome:
            return {}
        return {
            "case_id": case_id,
            "action_id": self.g_action_id[case_id],
            "kind": self.g_kind[case_id],
            "outcome": self.g_outcome[case_id],
            "match_status": self.g_match_status[case_id],
            "threshold_status": self.g_threshold_status[case_id],
            "approved_status": self.g_approved_status[case_id],
            "policy_status": self.g_policy_status[case_id],
            "reasoning": self.g_reasoning[case_id],
            "minority_note": self.g_minority_note[case_id],
            "proposal_url": self.g_proposal_url[case_id],
            "amount": int(self.g_amount[case_id]),
            "cap": int(self.g_cap[case_id]),
            "recipient": self.g_recipient[case_id],
            "param_value": int(self.g_param_value[case_id]),
            "param_cap": int(self.g_param_cap[case_id]),
            "treasury_balance": int(self.g_treasury_balance[case_id]),
        }

    @gl.public.view
    def get_verdict_count(self) -> int:
        return int(self.verdict_counter)

    @gl.public.view
    def get_all_case_ids(self) -> list:
        out = []
        for i in range(len(self.case_ids) - 1, -1, -1):
            out.append(self.case_ids[i])
        return out
