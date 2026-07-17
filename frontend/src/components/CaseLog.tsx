import { useEffect, useState, useCallback } from "react";
import { getAllCaseIds, getVerdict } from "../lib/contracts";

const CHIPS = [
  { key: "match_status", label: "M" },
  { key: "threshold_status", label: "T" },
  { key: "approved_status", label: "A" },
  { key: "policy_status", label: "P" },
];

const BREAKER_NAMES = [
  { key: "match_status", label: "Calldata Match" },
  { key: "threshold_status", label: "Threshold" },
  { key: "approved_status", label: "Approved Destination" },
  { key: "policy_status", label: "Policy Bounds" },
];

function shortAddr(a: string): string {
  if (!a) return "";
  if (a.length <= 12) return a;
  return a.slice(0, 6) + "…" + a.slice(-4);
}

export function CaseLog({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const ids = await getAllCaseIds();
      const out: any[] = [];
      for (const id of ids) {
        const v = await getVerdict(id);
        if (v && v.case_id) out.push(v);
      }
      setRows(out);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  function toggle(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
  }

  return (
    <div className="panel">
      <div className="panel-head" onClick={() => setCollapsed((c) => !c)}>
        <h2>Case log</h2>
        <span className="collapse-toggle mono">
          {rows.length > 0 ? "(" + rows.length + ")" : ""} {collapsed ? "▸" : "▾"}
        </span>
      </div>

      {!collapsed && (
        <>
          {loading && <div className="msg mono">Reading the gate log…</div>}
          {err && <div className="error mono">{err}</div>}
          {!loading && rows.length === 0 && (
            <div className="hint">No cases yet. Run the gate to create one.</div>
          )}
          {rows.map((v) => {
            const isOpen = openId === v.case_id;
            return (
              <div key={v.case_id} className="case-row">
                <div className="case-clickable" onClick={() => toggle(v.case_id)}>
                  <div className="case-top">
                    <span className="mono case-id">
                      <span className="case-caret">{isOpen ? "▾" : "▸"}</span> {v.case_id}
                    </span>
                    <span className={"case-outcome outcome-" + v.outcome}>{v.outcome}</span>
                  </div>
                  <div className="case-chips">
                    {CHIPS.map((c) => {
                      const s = v[c.key];
                      const safe = s === "n/a" ? "na" : s;
                      return (
                        <span key={c.key} className={"chip chip-" + safe} title={c.key + ": " + s}>
                          {c.label}
                        </span>
                      );
                    })}
                    <span className="case-detail mono">
                      {v.kind === "transfer"
                        ? v.amount + " → " + shortAddr(v.recipient)
                        : "set fee_bps → " + v.param_value}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div className="case-expand">
                    <div className="case-breakers">
                      {BREAKER_NAMES.map((b) => {
                        const s = v[b.key];
                        const safe = s === "n/a" ? "na" : s;
                        return (
                          <div key={b.key} className={"case-brk case-brk-" + safe}>
                            <span>{b.label}</span>
                            <span className="mono">{s}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="case-evi mono">
                      {v.kind === "transfer" ? (
                        <>
                          <div><span className="k">amount</span> {v.amount} GenUSDC</div>
                          <div><span className="k">cap</span> {v.cap} GenUSDC</div>
                          <div><span className="k">recipient</span> {v.recipient}</div>
                        </>
                      ) : (
                        <>
                          <div><span className="k">set fee_bps</span> {v.param_value} bps</div>
                          <div><span className="k">fee cap</span> {v.param_cap} bps</div>
                        </>
                      )}
                      <div><span className="k">treasury</span> {v.treasury_balance} GenUSDC</div>
                      <div><span className="k">action</span> {v.action_id}</div>
                      <div className="case-proposal">
                        <span className="k">proposal</span>{" "}
                        <a href={v.proposal_url} target="_blank" rel="noreferrer">{v.proposal_url}</a>
                      </div>
                    </div>

                    <div className="reasoning">
                      <span className="stat-label">REASONING</span>
                      <p>{v.reasoning}</p>
                    </div>
                    {v.minority_note && v.minority_note !== "" && (
                      <div className="reasoning">
                        <span className="stat-label">MINORITY NOTE</span>
                        <p className="dim">{v.minority_note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
