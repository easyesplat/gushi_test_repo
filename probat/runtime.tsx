// probat/runtime.tsx
import * as React from "react";

declare global {
interface Window {
    __PROBAT_API?: string;
}
}

const ENV_BASE: string =
(typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_PROBAT_API) ||
(typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_PROBAT_API) ||
(typeof window !== "undefined" && window.__PROBAT_API) ||
"https://gushi.onrender.com";

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const KEY = (proposalId: string) => `probat_choice_v3:${proposalId}`;

type RetrieveResponse = {
proposal_id: string;
experiment_id: string | null;
label: string | null;
};

type Choice = {
experiment_id: string;
label: string;
ts: number;
};

function safeGet(k: string): any | null {
try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
} catch {
    return null;
}
}
function safeSet(k: string, v: any) {
try {
    localStorage.setItem(k, JSON.stringify(v));
} catch {}
}
function now() { return Date.now(); }
function fresh(ts: number) { return now() - ts <= TTL_MS; }
function readChoice(proposalId: string): Choice | null {
const c = safeGet(KEY(proposalId)) as Choice | null;
return c && fresh(c.ts) ? c : null;
}
function writeChoice(proposalId: string, experiment_id: string, label: string) {
safeSet(KEY(proposalId), { experiment_id, label, ts: now() } as Choice);
}

async function fetchDecision(baseUrl: string, proposalId: string): Promise<{ experiment_id: string; label: string }> {
const url = `${baseUrl.replace(/\/$/, "")}/retrieve_react_experiment/${encodeURIComponent(proposalId)}`;
const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = (await res.json()) as RetrieveResponse;

const experiment_id = (data.experiment_id || `exp_${proposalId}`).toString();
const label = data.label && data.label.trim() ? data.label : "control";

writeChoice(proposalId, experiment_id, label);
return { experiment_id, label };
}

async function sendClickMetric(baseUrl: string, proposalId: string, _experiment_id?: string, variant_label?: string) {
const url = `${baseUrl.replace(/\/$/, "")}/send_metrics/${encodeURIComponent(proposalId)}`;
const body = {
    experiment_id: null,
    variant_label: variant_label ?? "control",
    metric_name: "click",
    metric_value: 1,
    metric_unit: "count",
    source: "react",
    dimensions: {},
    captured_at: new Date().toISOString(),
};
try {
    await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    });
} catch {}
}

type WithExperimentOpts = {
proposalId: string;
registry: Record<string, React.ComponentType<any>>;
};

export function withExperiment<P = any>(
Control: React.ComponentType<P>,
opts: WithExperimentOpts
): React.ComponentType<P & { onProbatClick?: () => void; probat?: { trackClick: () => void } }> {
const { proposalId, registry } = opts;

function Wrapped(props: P) {
    const [choice, setChoice] = React.useState<{ experiment_id: string; label: string } | null>(null);

    React.useEffect(() => {
    let alive = true;

    const cached = readChoice(proposalId);
    if (cached) {
        setChoice({ experiment_id: cached.experiment_id, label: cached.label });
    }

    if (!cached) {
        (async () => {
        try {
            const { experiment_id, label } = await fetchDecision(ENV_BASE, proposalId);
            if (!alive) return;
            setChoice({ experiment_id, label });
        } catch (e) {
            if (!alive) return;
            setChoice({ experiment_id: `exp_${proposalId}`, label: "control" });
        }
        })();
    }

    return () => { alive = false; };
    }, [proposalId]);

    const trackClick = React.useCallback(() => {
    const exp = choice?.experiment_id;
    const lbl = choice?.label ?? "control";
    void sendClickMetric(ENV_BASE, proposalId, exp, lbl);
    }, [proposalId, choice?.experiment_id, choice?.label]);

    const label = choice?.label ?? "control";
    const Variant = registry[label] || Control;

    const key = `${proposalId}:${label}`;
    return (
    <div onClick={trackClick} data-probat-proposal={proposalId}>
        {React.createElement(Variant, {
        key,
        ...(props as any),
        onProbatClick: trackClick,
        probat: { trackClick },
        })}
    </div>
    );
}

(Wrapped as any).displayName = `withExperiment(${(Control as any).displayName || Control.name || "Component"})`;
return Wrapped as any;
}
