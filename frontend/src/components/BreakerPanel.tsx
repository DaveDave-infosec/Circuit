import { useEffect, useState } from "react";

const BREAKERS = [
  { key: "match_status", label: "Calldata Match" },
  { key: "threshold_status", label: "Threshold" },
  { key: "approved_status", label: "Approved Destination" },
  { key: "policy_status", label: "Policy Bounds" },
];

export function BreakerPanel({
  verdict,
  protectedTarget,
}: {
  verdict: any;
  protectedTarget: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const timers: number[] = [];
    for (let i = 1; i <= 5; i++) {
      timers.push(window.setTimeout(() => setStep(i), i * 450));
    }
    return () => timers.forEach((t) => clearTimeout(t));
  }, [verdict]);

  function brkState(index: number, status: string): string {
    if (step < index + 1) return "arming";
    if (status === "pass") return "pass";
    if (status === "fail") return "fail";
    return "na";
  }

  const masterLive = step >= 5;
  const outcome = verdict.outcome;

  return (
    <div className="bp">
      <div className={"bp-master " + (masterLive ? "outcome-" + outcome + " bp-slam" : "outcome-EVAL")}>
        <span className="bp-master-label">{masterLive ? outcome : "EVALUATING"}</span>
      </div>

      <div className="bp-row">
        {BREAKERS.map((b, i) => {
          const status = verdict[b.key];
          const st = brkState(i, status);
          return (
            <div key={b.key} className={"brk brk-" + st}>
              <div className="brk-housing">
                <div className="brk-toggle" />
              </div>
              <div className="brk-label">{b.label}</div>
              <div className="brk-status mono">{st === "arming" ? "···" : status}</div>
            </div>
          );
        })}
      </div>

      <div className={"bp-protocol " + (masterLive ? "outcome-border-" + outcome : "")}>
        <div className="bp-protocol-left">
          <span className="stat-label">PROTECTED PROTOCOL</span>
          <span className="bp-protocol-name">{protectedTarget || "—"}</span>
        </div>
        <div className="bp-protocol-right">
          {!masterLive && <span className="mono dim">gate evaluating…</span>}
          {masterLive && outcome === "ALLOW" && (
            <span className="mono bp-passed">ACTION EXECUTED · VALUE MOVED</span>
          )}
          {masterLive && outcome === "BLOCK" && (
            <span className="mono held-BLOCK">HELD AT GATE · EXECUTION BLOCKED</span>
          )}
          {masterLive && outcome === "ESCALATE" && (
            <span className="mono held-ESCALATE">HELD AT GATE · GOVERNANCE FROZEN</span>
          )}
          {masterLive && outcome === "DELAY" && (
            <span className="mono held-DELAY">HELD AT GATE · COOLDOWN</span>
          )}
        </div>
      </div>
    </div>
  );
}
