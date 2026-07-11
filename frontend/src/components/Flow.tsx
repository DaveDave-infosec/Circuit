import { useState } from "react";
import {
  proposeAction,
  getActionCount,
  getAction,
  runGate,
  getVerdictCount,
  getVerdict,
  getTreasuryState,
  getConstitution,
  applyVerdict,
} from "../lib/contracts";
import { BreakerPanel } from "./BreakerPanel";

type Stage = "propose" | "proposed" | "gated" | "applied";

const SCENARIOS = [
  {
    id: "honest",
    label: "Honest disbursement",
    expect: "ALLOW",
    kind: "transfer",
    recipient: "0x000000000000000000000000000000000000dEaD",
    amount: "5000",
    paramValue: "",
    proposalUrl:
      "https://gist.githubusercontent.com/DaveDave-infosec/0fc883b9e21f1021d7cb2a596730cf42/raw/fca6b203670fbb5da797c5f846f06cd4789b255f/proposal-1.txt",
  },
  {
    id: "attack",
    label: "Governance calldata attack",
    expect: "BLOCK",
    kind: "transfer",
    recipient: "0x000000000000000000000000000000000000dEaD",
    amount: "5000",
    paramValue: "",
    proposalUrl:
      "https://gist.githubusercontent.com/DaveDave-infosec/0b095fa7023dbbcf71ea2b737f5501a7/raw/da536b4980a050917d17f2eedf4bebd73ca50752/proposal-2.txt",
  },
  {
    id: "offlist",
    label: "Off-list destination",
    expect: "ESCALATE",
    kind: "transfer",
    recipient: "0x2222222222222222222222222222222222222222",
    amount: "5000",
    paramValue: "",
    proposalUrl:
      "https://gist.githubusercontent.com/DaveDave-infosec/3662333d91777a639dc269dee5b2f807/raw/52d340bd80f9015de3ffaca00d2e2c5c1f2d62c0/proposal-3.txt",
  },
];

function ActionSummary({ action }: { action: any }) {
  return (
    <div className="action-summary mono">
      <div><span className="k">id</span> {action.action_id}</div>
      <div><span className="k">kind</span> {action.kind}</div>
      {action.kind === "transfer" && (
        <>
          <div><span className="k">recipient</span> {action.recipient}</div>
          <div><span className="k">amount</span> {action.amount} GenUSDC</div>
        </>
      )}
      {action.kind === "param_change" && (
        <div><span className="k">set {action.param_name}</span> {action.param_value} bps</div>
      )}
      <div><span className="k">proposal</span> {action.proposal_url}</div>
      <div><span className="k">status</span> {action.status}</div>
    </div>
  );
}

export function Flow({
  account,
  isOwner,
  onExecuted,
}: {
  account: string;
  isOwner: boolean;
  onExecuted: () => void;
}) {
  const [stage, setStage] = useState<Stage>("propose");
  const [kind, setKind] = useState("transfer");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [paramValue, setParamValue] = useState("");
  const [proposalUrl, setProposalUrl] = useState("");

  const [action, setAction] = useState<any>(null);
  const [verdict, setVerdict] = useState<any>(null);
  const [treasuryState, setTreasuryState] = useState<any>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function fillScenario(s: (typeof SCENARIOS)[number]) {
    setKind(s.kind);
    setRecipient(s.recipient);
    setAmount(s.amount);
    setParamValue(s.paramValue);
    setProposalUrl(s.proposalUrl);
    setErr(null);
  }

  function reset() {
    setStage("propose");
    setRecipient("");
    setAmount("");
    setParamValue("");
    setProposalUrl("");
    setAction(null);
    setVerdict(null);
    setErr(null);
    setMsg(null);
  }

  async function doPropose() {
    setErr(null);
    setMsg(null);
    if (proposalUrl.trim() === "") {
      setErr("A governance proposal URL is required.");
      return;
    }
    if (kind === "transfer" && recipient.trim() === "") {
      setErr("Recipient is required for a transfer.");
      return;
    }
    setBusy(true);
    setMsg("Submitting the proposed action on-chain…");
    try {
      const countBefore = await getActionCount();
      const predictedId = "act_" + countBefore;
      const submittedAt = new Date().toISOString();
      await proposeAction(
        account,
        submittedAt,
        kind,
        kind === "transfer" ? recipient.trim() : "",
        kind === "transfer" ? Number(amount || "0") : 0,
        kind === "param_change" ? "fee_bps" : "",
        kind === "param_change" ? Number(paramValue || "0") : 0,
        proposalUrl.trim()
      );
      const a = await getAction(predictedId);
      setAction(a);
      setStage("proposed");
      setMsg(null);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setMsg(null);
    } finally {
      setBusy(false);
    }
  }

  async function doRunGate() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    setMsg("Running the breakers — fetching the proposal & reaching consensus. This can take 30–60 seconds…");
    try {
      const t = await getTreasuryState();
      const c = await getConstitution();
      setTreasuryState(t);
      const approvedJson = JSON.stringify(c.approved_destinations || []);
      const countBefore = await getVerdictCount();
      const predictedCase = "circuit_" + countBefore;
      await runGate(
        action.action_id,
        action.kind,
        action.recipient,
        Number(action.amount),
        action.param_name,
        Number(action.param_value),
        action.proposal_url,
        Number(t.treasury_balance),
        Number(c.max_transfer_bps),
        Number(c.param_fee_cap_bps),
        approvedJson
      );
      let v = await getVerdict(predictedCase);
      let tries = 0;
      while ((!v || !v.outcome || v.outcome === "") && tries < 5) {
        await new Promise((r) => setTimeout(r, 2500));
        v = await getVerdict(predictedCase);
        tries++;
      }
      if (!v || !v.outcome || v.outcome === "") {
        setErr(
          "The gate call didn't finalize — this can happen on a slow fetch or consensus round. Click Run the gate to retry."
        );
        setMsg(null);
        setBusy(false);
        return;
      }
      setVerdict(v);
      setStage("gated");
      setMsg(null);
      onExecuted();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setMsg(null);
    } finally {
      setBusy(false);
    }
  }

  async function doApply() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    setMsg("Relaying the verdict to the executor…");
    try {
      await applyVerdict(account, action.action_id, verdict.case_id, verdict.outcome, verdict.reasoning);
      const a = await getAction(action.action_id);
      setAction(a);
      setStage("applied");
      setMsg(null);
      onExecuted();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setMsg(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel flow-panel">
      {stage === "propose" && (
        <div className="subpanel">
          <h2>Propose an action</h2>

          <div className="scenarios">
            <span className="stat-label">TRY A SCENARIO (fills the form below)</span>
            <div className="scenario-row">
              {SCENARIOS.map((s) => (
                <button key={s.id} className="scenario-btn" onClick={() => fillScenario(s)}>
                  <span className="scenario-label">{s.label}</span>
                  <span className={"scenario-expect outcome-" + s.expect}>expect {s.expect}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="hint">
            Submit a real executable action. The gate judges it against your locked policy &
            the governance proposal it claims to fulfil.
          </p>

          <label>Action kind</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="transfer">Treasury transfer</option>
            <option value="param_change">Fee parameter change</option>
          </select>

          {kind === "transfer" && (
            <>
              <label>Recipient address</label>
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" />
              <label>Amount (GenUSDC)</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" />
            </>
          )}

          {kind === "param_change" && (
            <>
              <label>Parameter</label>
              <input value="fee_bps" disabled />
              <label>New value (bps)</label>
              <input value={paramValue} onChange={(e) => setParamValue(e.target.value)} placeholder="300" />
            </>
          )}

          <label>Governance proposal URL</label>
          <input
            value={proposalUrl}
            onChange={(e) => setProposalUrl(e.target.value)}
            placeholder="https://gist.githubusercontent.com/…/raw/…/proposal.txt"
          />

          <button className="primary" onClick={doPropose} disabled={busy}>
            {busy ? "Submitting…" : "Propose action"}
          </button>
        </div>
      )}

      {stage === "proposed" && action && (
        <div className="subpanel">
          <h2>Action proposed</h2>
          <ActionSummary action={action} />
          <p className="hint">The action is parked. No value has moved. Run the gate to judge it.</p>
          <button className="primary" onClick={doRunGate} disabled={busy}>
            {busy ? "Running the breakers…" : "Run the gate"}
          </button>
        </div>
      )}

      {stage === "gated" && verdict && (
        <div className="subpanel">
          <h2>Gate verdict</h2>
          <BreakerPanel
            verdict={verdict}
            protectedTarget={treasuryState ? treasuryState.protected_target : ""}
          />
          <div className="reasoning">
            <span className="stat-label">REASONING</span>
            <p>{verdict.reasoning}</p>
          </div>
          {verdict.minority_note && verdict.minority_note !== "" && (
            <div className="reasoning">
              <span className="stat-label">MINORITY NOTE</span>
              <p className="dim">{verdict.minority_note}</p>
            </div>
          )}
          {isOwner ? (
            <button className="primary" onClick={doApply} disabled={busy}>
              {busy ? "Relaying…" : "Apply verdict (execute)"}
            </button>
          ) : (
            <p className="hint">
              Execution relay is owner-only in V1. The verdict stands; the protocol owner applies it.
            </p>
          )}
          <button className="ghost" onClick={reset} disabled={busy}>
            Discard & propose another
          </button>
        </div>
      )}

      {stage === "applied" && action && (
        <div className="subpanel">
          <h2>Verdict applied</h2>
          <div className={"outcome-banner outcome-" + (verdict ? verdict.outcome : "")}>
            {action.status.toUpperCase()}
          </div>
          <ActionSummary action={action} />
          <p className="hint">
            {action.status === "executed" && "The action executed. Value moved."}
            {action.status === "blocked" && "The action was blocked. No value moved."}
            {action.status === "escalated" && "The action is frozen pending governance."}
            {action.status === "delayed" && "The action is in cooldown. Reassess before it can proceed."}
          </p>
          <button className="primary" onClick={reset}>Propose another</button>
        </div>
      )}

      {msg && <div className="msg mono">{msg}</div>}
      {err && <div className="error mono">{err}</div>}
    </div>
  );
}
