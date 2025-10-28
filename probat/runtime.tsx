// probat/runtime.tsx
import * as React from "react";

// Minimal, self-contained config for runtime networking/caching:
const ENV_BASE: string =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_PROBAT_API) ||
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_PROBAT_API) ||
  (typeof window !== "undefined" && (window as any).__PROBAT_API) ||
  "https://gushi.onrender.com";

const CHOICE_STORE = "probat_choice_v2";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type RetrieveResponse = {
  proposal_id: string;
  experiment_id: string;
  label: string | null;
};

function lsGet<T = any>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    return null;
  }
}
function lsSet(k: string, v: any) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}
function writeCachedVariant(experiment_id: string, variant_id: string) {
  const now = Date.now();
  const obj = lsGet<Record<string, { variant_id: string; ts: number }>>(CHOICE_STORE) || {};
  obj[experiment_id] = { variant_id, ts: now };
  lsSet(CHOICE_STORE, obj);
}
function readCachedVariant(experiment_id: string): string | null {
  const obj = lsGet<Record<string, { variant_id: string; ts: number }>>(CHOICE_STORE);
  if (!obj) return null;
  const rec = obj[experiment_id];
  if (!rec) return null;
  if (Date.now() - rec.ts > TTL_MS) return null;
  return rec.variant_id;
}

async function fetchDecision(
  baseUrl: string,
  proposalId: string
): Promise<{ experiment_id: string; variant_id: string }> {
  const url = `${baseUrl.replace(/\/$/, "")}/retrieve_react_experiment/${encodeURIComponent(proposalId)}`;
  try {
    const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as RetrieveResponse;

    const experiment_id = data.experiment_id || `exp_${proposalId}`;
    const variant_id = data.label && data.label !== "control" ? data.label : "control";
    writeCachedVariant(experiment_id, variant_id);
    return { experiment_id, variant_id };
  } catch {
    const experiment_id = `exp_${proposalId}`;
    const cached = readCachedVariant(experiment_id);
    return { experiment_id, variant_id: cached || "control" };
  }
}

type WithExperimentOpts = {
  proposalId: string;
  registry?: Record<string, React.ComponentType<any>>;
};

export function withExperiment<P = any>(
  Control: React.ComponentType<P>,
  opts: WithExperimentOpts
): React.ComponentType<P> {
  const { proposalId, registry = {} } = opts;

  function Wrapped(props: P) {
    const [choice, setChoice] = React.useState<{ experiment_id: string; label: string } | null>(null);

    React.useEffect(() => {
      let mounted = true;
      (async () => {
        const { experiment_id, variant_id } = await fetchDecision(ENV_BASE, proposalId);
        if (!mounted) return;
        setChoice({ experiment_id, label: variant_id });
      })();
      return () => { mounted = false; };
    }, [proposalId]);

    if (!choice) return React.createElement(Control, { ...(props as any) });

    const Variant = registry[choice.label] || Control;
    return React.createElement(Variant, { ...(props as any) });
  }

  const controlName = (Control as any).displayName || Control.name || "Component";
  (Wrapped as any).displayName = `withExperiment(${controlName})`;
  return Wrapped;
}
