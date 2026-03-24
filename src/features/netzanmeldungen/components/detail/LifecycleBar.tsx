/**
 * Animated Lifecycle-Bar — Steps füllen sich nacheinander auf
 * 10px Höhe, farbige Steps, pulsierender Dot, Hover-Tooltips, Prozent-Counter
 */
import { useState, useEffect, useRef } from "react";

interface Step {
  label: string;
  color: string;
  done: boolean;
  current?: boolean;
  date?: string;
  tooltip?: string;
}

interface Props {
  steps: Step[];
  animate?: boolean;
}

const css = `
@keyframes pulseDot {
  0%, 100% { box-shadow: 0 0 0 0 var(--dot-c, rgba(212,168,67,0.4)) }
  50% { box-shadow: 0 0 0 7px transparent }
}
`;

export default function LifecycleBar({ steps, animate = true }: Props) {
  const [activated, setActivated] = useState<boolean[]>(steps.map(() => false as boolean));
  const [dotVisible, setDotVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const mounted = useRef(false);

  const doneCount = steps.filter(s => s.done || s.current).length;
  const targetPercent = Math.round((doneCount / steps.length) * 100);
  const currentIdx = steps.findIndex(s => s.current);
  const hasRueckfrage = steps[currentIdx]?.label?.toLowerCase().includes("rück");

  useEffect(() => {
    if (mounted.current || !animate) {
      setActivated(steps.map((s) => !!(s.done || s.current)));
      setPercent(targetPercent);
      setDotVisible(true);
      return;
    }
    mounted.current = true;

    // Sequentiell aktivieren
    steps.forEach((s, i) => {
      if (s.done || s.current) {
        setTimeout(() => {
          setActivated((prev: boolean[]) => { const n = [...prev]; n[i] = true; return n; });
        }, 200 + i * 200);
      }
    });

    // Dot nach letztem aktiven Step + 500ms
    setTimeout(() => setDotVisible(true), 200 + doneCount * 200 + 500);

    // Prozent hochzählen
    let cur = 0;
    const step = Math.ceil(targetPercent / 30);
    const iv = setInterval(() => {
      cur = Math.min(cur + step, targetPercent);
      setPercent(cur);
      if (cur >= targetPercent) clearInterval(iv);
    }, 50);

    return () => clearInterval(iv);
  }, []);

  const pctColor = hasRueckfrage ? "#ef4444" : percent < 40 ? "#64748b" : percent < 70 ? "#eab308" : "#22c55e";

  return (
    <div>
      <style>{css}</style>

      {/* Prozent oben rechts — ÜBER der Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: pctColor, fontFamily: "monospace", transition: "color 0.3s" }}>
          {percent}%{hasRueckfrage ? " ⚠" : ""}
        </span>
      </div>

      {/* Bar */}
      <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1, position: "relative", cursor: "pointer" }} className="lc-step">
            {/* Background */}
            <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.025)", overflow: "hidden", position: "relative" }}>
              {/* Fill */}
              <div style={{
                height: "100%", borderRadius: 5,
                background: s.done || s.current ? s.color : "transparent",
                width: activated[i] ? "100%" : "0%",
                transition: animate ? `width 0.6s cubic-bezier(0.4, 0.0, 0.2, 1) ${200 + i * 200}ms` : "none",
              }} />
            </div>

            {/* Pulsierender Dot am Current-Step */}
            {s.current && (
              <div style={{
                position: "absolute", right: -5, top: -4,
                width: 18, height: 18, borderRadius: "50%",
                background: s.color,
                opacity: dotVisible ? 1 : 0,
                transform: dotVisible ? "scale(1)" : "scale(0)",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                animation: dotVisible ? "pulseDot 2s ease-in-out infinite" : "none",
                "--dot-c": s.color + "60",
                zIndex: 2,
                display: "flex", alignItems: "center", justifyContent: "center",
              } as React.CSSProperties}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
              </div>
            )}

            {/* Tooltip */}
            <div className="lc-tooltip" style={{
              position: "absolute", bottom: "calc(100% + 14px)", left: "50%",
              transform: "translateX(-50%) translateY(4px)",
              background: "rgba(15,15,35,0.97)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "8px 12px", whiteSpace: "nowrap",
              opacity: 0, pointerEvents: "none",
              transition: "all 0.15s ease", zIndex: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}{s.date ? ` · ${s.date}` : ""}</div>
              {s.tooltip && <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{s.tooltip}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Labels */}
      <div style={{ display: "flex", gap: 3 }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center",
            opacity: activated[i] || !animate ? 1 : (s.done || s.current) ? 0 : 0.4,
            transform: activated[i] || !animate ? "translateY(0)" : "translateY(6px)",
            transition: animate ? `all 0.3s ease ${250 + i * 200}ms` : "none",
          }}>
            <div style={{
              fontSize: 8, fontWeight: s.current ? 700 : s.done ? 500 : 400,
              color: s.current ? s.color : s.done ? "#22c55e" : "#3a4050",
            }}>
              {s.label}
            </div>
            {(s.done || s.current) && s.date && (
              <div style={{ fontSize: 7, color: "#64748b" }}>{s.date}</div>
            )}
          </div>
        ))}
      </div>

      {/* Hover CSS */}
      <style>{`
        .lc-step:hover .lc-tooltip { opacity: 1 !important; transform: translateX(-50%) translateY(0) !important; pointer-events: auto !important; }
      `}</style>
    </div>
  );
}
