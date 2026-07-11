import { useEffect, useState, useCallback } from "react";
import { getAllCaseIds, getVerdict } from "../lib/contracts";

const CHIPS = [
  { key: "match_status", label: "M" },
  { key: "threshold_status", label: "T" },
  { key: "approved_status", label: "A" },
  { key: "policy_status", label: "P" },
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
          {rows.map((v) => (
            <div key={v.case_id} className="case-row">
              <div className="case-top">
                <span className="mono case-id">{v.case_id}</span>
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
          ))}
        </>
      )}
    </div>
  );
}
