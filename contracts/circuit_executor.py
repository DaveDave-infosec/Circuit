# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class CircuitExecutor(gl.Contract):
    # --- config ---
    owner: str

    # --- embedded settlement token (GenUSDC), whole units ---
    balances: TreeMap[str, u256]

    # --- protected protocol: treasury + one changeable parameter ---
    treasury_funded: bool
    treasury_balance: u256
    protected_target: str
    param_fee_bps: u256

    # --- locked safety constitution ---
    constitution_set: bool
    constitution_locked: bool
    max_transfer_bps: u256
    param_fee_cap_bps: u256
    approved_dest_list: DynArray[str]
    approved_dest: TreeMap[str, bool]

    # --- proposed actions, keyed by action_id ---
    action_ids: DynArray[str]
    action_counter: u256
    act_proposer: TreeMap[str, str]
    act_submitted_at: TreeMap[str, str]
    act_kind: TreeMap[str, str]
    act_recipient: TreeMap[str, str]
    act_amount: TreeMap[str, u256]
    act_param_name: TreeMap[str, str]
    act_param_value: TreeMap[str, u256]
    act_proposal_url: TreeMap[str, str]
    act_status: TreeMap[str, str]
    act_case_id: TreeMap[str, str]
    act_outcome: TreeMap[str, str]
    act_reason: TreeMap[str, str]

    def __init__(self, owner_address: str):
        self.owner = owner_address.lower()
        self.treasury_funded = False
        self.treasury_balance = u256(0)
        self.protected_target = ""
        self.param_fee_bps = u256(0)
        self.constitution_set = False
        self.constitution_locked = False
        self.max_transfer_bps = u256(0)
        self.param_fee_cap_bps = u256(0)
        self.action_counter = u256(0)

    # ---------- token: open testnet faucet ----------
    @gl.public.write
    def mint(self, to_address: str, amount: int):
        to_address = to_address.lower()
        cur = self.balances[to_address] if to_address in self.balances else u256(0)
        self.balances[to_address] = u256(int(cur) + amount)

    @gl.public.view
    def balance_of(self, address: str) -> int:
        address = address.lower()
        return int(self.balances[address]) if address in self.balances else 0

    # ---------- treasury setup ----------
    @gl.public.write
    def fund_treasury(self, caller: str, target_name: str, amount: int):
        c = caller.lower()
        if c != self.owner:
            raise gl.UserError("only owner can fund treasury")
        if self.treasury_funded:
            raise gl.UserError("treasury already funded")
        amt = int(amount)
        if amt <= 0:
            raise gl.UserError("amount must be positive")
        bal = int(self.balances[c]) if c in self.balances else 0
        if bal < amt:
            raise gl.UserError("insufficient GenUSDC to fund treasury")
        self.balances[c] = u256(bal - amt)
        self.treasury_balance = u256(amt)
        self.protected_target = target_name
        self.treasury_funded = True

    # ---------- locked safety constitution ----------
    @gl.public.write
    def set_constitution(
        self,
        caller: str,
        max_transfer_bps: int,
        param_fee_cap_bps: int,
        initial_param_fee_bps: int,
    ):
        c = caller.lower()
        if c != self.owner:
            raise gl.UserError("only owner can set constitution")
        if self.constitution_locked:
            raise gl.UserError("constitution locked; cannot edit")
        self.max_transfer_bps = u256(int(max_transfer_bps))
        self.param_fee_cap_bps = u256(int(param_fee_cap_bps))
        self.param_fee_bps = u256(int(initial_param_fee_bps))
        self.constitution_set = True

    @gl.public.write
    def add_approved_destination(self, caller: str, dest: str):
        c = caller.lower()
        if c != self.owner:
            raise gl.UserError("only owner can add approved destination")
        if self.constitution_locked:
            raise gl.UserError("constitution locked; cannot edit")
        d = dest.lower()
        if d not in self.approved_dest:
            self.approved_dest[d] = True
            self.approved_dest_list.append(d)

    @gl.public.write
    def lock_constitution(self, caller: str):
        c = caller.lower()
        if c != self.owner:
            raise gl.UserError("only owner can lock")
        if not self.constitution_set:
            raise gl.UserError("set constitution before locking")
        if not self.treasury_funded:
            raise gl.UserError("fund treasury before locking")
        self.constitution_locked = True

    # ---------- propose an actual executable action (no value moves) ----------
    @gl.public.write
    def propose_action(
        self,
        caller: str,
        submitted_at: str,
        kind: str,
        recipient: str,
        amount: int,
        param_name: str,
        param_value: int,
        proposal_url: str,
    ) -> str:
        if not self.constitution_locked:
            raise gl.UserError("circuit not armed; lock constitution first")
        if kind != "transfer" and kind != "param_change":
            raise gl.UserError("kind must be transfer or param_change")

        proposer = caller.lower()
        action_id = "act_" + str(int(self.action_counter))
        self.action_counter = u256(int(self.action_counter) + 1)
        self.action_ids.append(action_id)

        self.act_proposer[action_id] = proposer
        self.act_submitted_at[action_id] = submitted_at
        self.act_kind[action_id] = kind
        self.act_recipient[action_id] = recipient.lower()
        self.act_amount[action_id] = u256(int(amount) if amount > 0 else 0)
        self.act_param_name[action_id] = param_name
        self.act_param_value[action_id] = u256(int(param_value) if param_value > 0 else 0)
        self.act_proposal_url[action_id] = proposal_url
        self.act_status[action_id] = "proposed"
        self.act_case_id[action_id] = ""
        self.act_outcome[action_id] = ""
        self.act_reason[action_id] = ""
        return action_id

    # ---------- apply a gate verdict: ALLOW is the ONLY path that moves value ----------
    @gl.public.write
    def apply_verdict(
        self,
        caller: str,
        action_id: str,
        case_id: str,
        outcome: str,
        reason: str,
    ):
        c = caller.lower()
        if c != self.owner:
            raise gl.UserError("only owner may relay a gate verdict (V1 relay)")
        if action_id not in self.act_status:
            raise gl.UserError("unknown action")
        if self.act_status[action_id] != "proposed":
            raise gl.UserError("action not in proposed state")

        self.act_case_id[action_id] = case_id
        self.act_outcome[action_id] = outcome
        self.act_reason[action_id] = reason

        if outcome == "BLOCK":
            self.act_status[action_id] = "blocked"
            return

        if outcome == "ESCALATE":
            self.act_status[action_id] = "escalated"
            return

        if outcome == "DELAY":
            self.act_status[action_id] = "delayed"
            return

        if outcome == "ALLOW":
            kind = self.act_kind[action_id]
            if kind == "transfer":
                recipient = self.act_recipient[action_id]
                amt = int(self.act_amount[action_id])
                tbal = int(self.treasury_balance)
                if amt > tbal:
                    raise gl.UserError("transfer exceeds treasury balance")
                self.treasury_balance = u256(tbal - amt)
                rbal = int(self.balances[recipient]) if recipient in self.balances else 0
                self.balances[recipient] = u256(rbal + amt)
                self.act_status[action_id] = "executed"
                return
            if kind == "param_change":
                self.param_fee_bps = u256(int(self.act_param_value[action_id]))
                self.act_status[action_id] = "executed"
                return
            raise gl.UserError("unknown action kind")

        raise gl.UserError("unknown outcome")

    # ---------- clear a DELAY so the gate can re-run the action ----------
    @gl.public.write
    def clear_delay(self, caller: str, action_id: str):
        c = caller.lower()
        if c != self.owner:
            raise gl.UserError("only owner may clear a delay")
        if action_id not in self.act_status:
            raise gl.UserError("unknown action")
        if self.act_status[action_id] != "delayed":
            raise gl.UserError("action not delayed")
        self.act_status[action_id] = "proposed"
        self.act_outcome[action_id] = ""
        self.act_case_id[action_id] = ""
        self.act_reason[action_id] = ""

    # ---------- views ----------
    @gl.public.view
    def get_config(self) -> dict:
        return {
            "owner": self.owner,
            "protected_target": self.protected_target,
            "treasury_funded": self.treasury_funded,
            "constitution_set": self.constitution_set,
            "constitution_locked": self.constitution_locked,
        }

    @gl.public.view
    def get_treasury_state(self) -> dict:
        return {
            "treasury_balance": int(self.treasury_balance),
            "param_fee_bps": int(self.param_fee_bps),
            "protected_target": self.protected_target,
        }

    @gl.public.view
    def get_constitution(self) -> dict:
        dests = []
        for i in range(len(self.approved_dest_list)):
            dests.append(self.approved_dest_list[i])
        return {
            "max_transfer_bps": int(self.max_transfer_bps),
            "param_fee_cap_bps": int(self.param_fee_cap_bps),
            "locked": self.constitution_locked,
            "approved_destinations": dests,
        }

    @gl.public.view
    def is_approved_destination(self, dest: str) -> bool:
        d = dest.lower()
        return d in self.approved_dest

    @gl.public.view
    def get_action(self, action_id: str) -> dict:
        if action_id not in self.act_status:
            return {}
        return {
            "action_id": action_id,
            "proposer": self.act_proposer[action_id],
            "submitted_at": self.act_submitted_at[action_id],
            "kind": self.act_kind[action_id],
            "recipient": self.act_recipient[action_id],
            "amount": int(self.act_amount[action_id]),
            "param_name": self.act_param_name[action_id],
            "param_value": int(self.act_param_value[action_id]),
            "proposal_url": self.act_proposal_url[action_id],
            "status": self.act_status[action_id],
            "case_id": self.act_case_id[action_id],
            "outcome": self.act_outcome[action_id],
            "reason": self.act_reason[action_id],
        }

    @gl.public.view
    def get_all_action_ids(self) -> list:
        out = []
        for i in range(len(self.action_ids) - 1, -1, -1):
            out.append(self.action_ids[i])
        return out

    @gl.public.view
    def get_action_count(self) -> int:
        return int(self.action_counter)
