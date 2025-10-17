import * as ReactProbat from "react";
import type { ComponentType, MouseEventHandler } from "react";

;(globalThis as any).__probatReact = (globalThis as any).__probatReact || ReactProbat;
if (!(globalThis as any).React) (globalThis as any).React = ReactProbat;
const { useEffect, useState } = ReactProbat;

type VariantInfo = { experiment_id: string; variant_id: string; module_url?: string; };
type RetrieveResponse = { proposal_id: string; experiment_id: string; label: string; mjs_path: string; };
const BASE = "https://gushi.onrender.com";

export async function recordClick(experiment_id: string, variant_id: string) {
  try {
    await fetch(`${BASE}/experiments/${encodeURIComponent(experiment_id)}/metrics`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "click", variant_id, ts: Date.now() }), keepalive: true
    });
  } catch {}
}

export function withExperiment<P extends object>(
  ControlComponent: ReactProbat.ComponentType<P>,
  opts: { proposalId: string }
) {
  const { proposalId } = opts;
  return function Experimented(props: P & { onClick?: ReactProbat.MouseEventHandler }) {
    const [ready, setReady] = useState(false);
    useEffect(() => { setReady(true); }, []);
    const handleClick: MouseEventHandler = (e) => {
      props.onClick?.(e);
      recordClick("exp_" + proposalId, "control");
    };
    if (!ready) return null;
    return <ControlComponent {...(props as P)} onClick={handleClick} />;
  };
}