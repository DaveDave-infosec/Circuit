import { useEffect, useState } from "react";

// Each scenario drives the breakers to states that genuinely produce its outcome.
// M = Calldata Match, T = Threshold, A = Approved Destination, P = Policy Bounds.
const SCENARIOS = [
  { outcome: "ALLOW", results: ["pass", "pass", "pass", "na"] },
  { outcome: "BLOCK", results: ["fail", "pass", "pass", "na"] },
  { outcome: "ESCALATE", results: ["pass", "pass", "fail", "na"] },
  { outcome: "DELAY", results: ["pass", "fail", "pass", "na"] },
];

const LABELS = ["Calldata Match", "Threshold", "Approved Destination", "Policy Bounds"];

export function HeroBreaker() {
  const [scenario, setScenario] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let mounted = true;
    let handles: number[] = [];
    let current = 0;

    function clearAll() {
      handles.forEach((t) => clearTimeout(t));
      handles = [];
    }

    function runCycle() {
      if (!mounted) return;
      clearAll();
      setScenario(current);
      setStep(0);
      handles.push(window.setTimeout(() => mounted && setStep(1), 500));
      handles.push(window.setTimeout(() => mounted && setStep(2), 900));
      handles.push(window.setTimeout(() => mounted && setStep(3), 1300));
      handles.push(window.setTimeout(() => mounted && setStep(4), 1700));
      handles.push(window.setTimeout(() => mounted && setStep(5), 2100));
      handles.push(
        window.setTimeout(() => {
          current = (current + 1) % SCENARIOS.length;
          runCycle();
        }, 4800)
      );
    }

    runCycle();
    return () => {
      mounted = false;
      clearAll();
    };
  }, []);

  const sc = SCENARIOS[scenario];
  const masterLive = step >= 5;

  function brkState(index: number): string {
    if (step < index + 1) return "arming";
    return sc.results[index];
  }

  return (
    <div className="hero-breaker">
      <div className={"hb-master " + (masterLive ? "outcome-" + sc.outcome + " bp-slam" : "outcome-EVAL")}>
        {masterLive ? sc.outcome : "EVALUATING"}
      </div>
      <div className="hb-row">
        {LABELS.map((label, i) => {
          const st = brkState(i);
          return (
            <div key={label} className={"brk brk-" + st}>
              <div className="brk-housing"><div className="brk-toggle" /></div>
              <div className="brk-label">{label}</div>
            </div>
          );
        })}
      </div>
      <div className={"hb-protocol " + (masterLive ? "outcome-border-" + sc.outcome : "")}>
        <span className="stat-label">PROTECTED TREASURY</span>
        <span className={"mono " + (masterLive ? hbMsgClass(sc.outcome) : "dim")}>
          {masterLive ? hbMsg(sc.outcome) : "gate evaluating…"}
        </span>
      </div>
    </div>
  );
}

function hbMsg(outcome: string): string {
  if (outcome === "ALLOW") return "CLEARED · ACTION EXECUTES";
  if (outcome === "BLOCK") return "HELD AT GATE · EXECUTION BLOCKED";
  if (outcome === "ESCALATE") return "HELD AT GATE · GOVERNANCE FROZEN";
  return "HELD AT GATE · COOLDOWN";
}

function hbMsgClass(outcome: string): string {
  if (outcome === "ALLOW") return "bp-passed";
  if (outcome === "BLOCK") return "held-BLOCK";
  if (outcome === "ESCALATE") return "held-ESCALATE";
  return "held-DELAY";
}
