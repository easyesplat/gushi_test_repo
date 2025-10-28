// probat/runtime.ts
import * as React from "react";

type RetrieveResponse = {
  proposal_id: string;
  experiment_id: string;
  label: string | null;
};

const ENV_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_PROBAT_API) ||
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_PROBAT_API) ||
  (typeof window !== "undefined" && (window as any).__PROBAT_API) ||
  "https://gushi.onrender.com";

const CHOICE_STORE = "probat_choice_v2";
const TTL_MS = 6 * 60 * 60 * 1000;

function lsGet<T = any>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function lsSet<T = any>(k: string, v: T) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

function readCachedVariant(experimentId: string): string | null {
  const all = lsGet<Record<string, { variant: string; ts: number }>>(CHOICE_STORE) || {};
  const rec = all[experimentId];
  if (!rec || Date.now() - rec.ts > TTL_MS) return null;
  return rec.variant;
}

function writeCachedVariant(experimentId: string, variant: string) {
  const all = lsGet<Record<string, { variant: string; ts: number }>>(CHOICE_STORE) || {};
  all[experimentId] = { variant, ts: Date.now() };
  lsSet(CHOICE_STORE, all);
}

function readUrlOverride(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URL(window.location.href).searchParams.get("variant");
  } catch {
    return null;
  }
}

async function fetchDecision(baseUrl: string, proposalId: string): Promise<{
  experiment_id: string;
  variant_id: string;
}> {
  const url = `${baseUrl.replace(/\/$/, "")}/retrieve_react_experiment/${encodeURIComponent(proposalId)}`;

  try {
    // Make it a "simple" POST
    const form = new URLSearchParams({ proposalId });
    const res = await fetch(url, {
      method: "POST",
      body: form, // Content-Type auto = application/x-www-form-urlencoded
      // ⚠️ NO custom headers, no credentials
    });

    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as RetrieveResponse;

    const experiment_id = `probat_${proposalId}`;
    const variant_id = data.label && data.label !== "control" ? data.label : "control";

    writeCachedVariant(experiment_id, variant_id);
    return { experiment_id, variant_id };
  } catch (err) {
    console.error("[PROBAT] fetchDecision error:", err);
    return {
      experiment_id: `probat_${proposalId}`,
      variant_id: "control",
    };
  }
}


async function sendMetric(
  baseUrl: string,
  proposalId: string,
  variantLabel: string
) {
  const url = `${baseUrl.replace(/\/$/, "")}/send_metrics/${encodeURIComponent(proposalId)}`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        experiment_id: null,
        variant_label: variantLabel,
        metric_name: "click",
        metric_value: 1,
        metric_unit: "count",
        source: "react",
      }),
    });
  } catch {}
}

export function withExperiment<P>(
  Control: React.ComponentType<P>,
  opts: {
    proposalId: string;
    registry: Record<string, React.ComponentType<P>>;
    onMetric?: (x: { experiment_id: string; variant_id: string }) => void;
    baseApi?: string;
  }
) {
  const { proposalId, registry } = opts;
  const BASE = opts.baseApi || ENV_BASE;

  if (typeof window === "undefined") {
    return function SSRWrapped(props: P) {
      return <Control {...props} />;
    };
  }

  return function ExperimentWrapped(props: P & { onClick?: React.MouseEventHandler }) {
    const [state, setState] = React.useState<{
      ready: boolean;
      experiment_id: string;
      variant_id: string;
    }>({ 
      ready: false, 
      experiment_id: `probat_${proposalId}`, 
      variant_id: "control"
    });

    React.useEffect(() => {
      let alive = true;

      (async () => {
        try {
          const urlOverride = readUrlOverride();
          if (urlOverride) {
            const use = registry[urlOverride] ? urlOverride : "control";
            writeCachedVariant(`probat_${proposalId}`, use);
            if (!alive) return;
            setState({ 
              ready: true, 
              experiment_id: `probat_${proposalId}`, 
              variant_id: use
            });
            return;
          }

          const cached = readCachedVariant(`probat_${proposalId}`);
          if (cached && (cached === "control" || registry[cached])) {
            if (!alive) return;
            setState({ 
              ready: true, 
              experiment_id: `probat_${proposalId}`, 
              variant_id: cached
            });
            return;
          }

          const { experiment_id, variant_id } = await fetchDecision(BASE, proposalId);
          const safeVariant = variant_id !== "control" && registry[variant_id] ? variant_id : "control";
          if (!alive) return;
          setState({ 
            ready: true, 
            experiment_id, 
            variant_id: safeVariant
          });
        } catch {
          if (!alive) return;
          setState({ 
            ready: true, 
            experiment_id: `probat_${proposalId}`, 
            variant_id: "control"
          });
        }
      })();

      return () => { alive = false; };
    }, [proposalId, BASE]);

    const Active = state.variant_id === "control" ? Control : registry[state.variant_id];
    if (!Active) return <Control {...(props as P)} />;

    const onClickCapture: React.MouseEventHandler = (e) => {
      try {
        (props as any).onClick?.(e);
      } catch {}

      sendMetric(BASE, proposalId, state.variant_id);

      opts.onMetric?.({ experiment_id: state.experiment_id, variant_id: state.variant_id });
    };

    return (
      <span onClickCapture={onClickCapture} style={{ display: "inline-block" }}>
        <Active {...(props as P)} />
      </span>
    );
  };
}