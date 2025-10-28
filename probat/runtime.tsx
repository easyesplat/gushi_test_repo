// probat/runtime.tsx
import * as React from "react";
import { ENV_BASE, CHOICE_STORE, TTL_MS } from "./config";

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
    console.warn("[PROBAT] lsGet error:", e);
    return null;
  }
}

function lsSet(k: string, v: any) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.warn("[PROBAT] lsSet error:", e);
  }
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
  } catch (e) {
    console.error("[PROBAT] fetchDecision error:", e);
    // fall back to control with a stable exp id
    const experiment_id = `exp_${proposalId}`;
    const cached = readCachedVariant(experiment_id);
    return { experiment_id, variant_id: cached || "control" };
  }
}

type WithExperimentOpts = {
  proposalId: string;
  /**
   * label -> Component mapping for this specific overridden file.
   * Provided by probat/registry.tsx at build-time.
   */
  registry?: Record<string, React.ComponentType<any>>;
};

/**
 * HOC that decides which component to render for the given proposal/experiment.
 * - Queries the decision service (ENV_BASE/retrieve_react_experiment/:proposal)
 * - Falls back to cached assignment (localStorage) or "control"
 * - Uses a label->Component registry injected at build time (probat/registry.tsx)
 */
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
      return () => {
        mounted = false;
      };
    }, [proposalId]);

    if (!choice) {
      // Optional: render control while deciding, or a skeleton.
      return React.createElement(Control, { ...(props as any) });
    }

    const Variant = registry[choice.label] || Control;
    return React.createElement(Variant, { ...(props as any) });
  }

  // Give it a readable displayName in dev tools
  const controlName = (Control as any).displayName || Control.name || "Component";
  (Wrapped as any).displayName = `withExperiment(${controlName})`;
  return Wrapped;
}

// For compatibility with older callsites (you can remove if unused)
export const PROBAT_COMPONENTS: Record<string, React.ComponentType<any>> = {};
