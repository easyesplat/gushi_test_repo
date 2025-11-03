// probat/runtime.tsx
import * as React from "react";

const ENV_BASE: string =
(typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_PROBAT_API) ||
(typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_PROBAT_API) ||
(typeof window !== "undefined" && (window as any).__PROBAT_API) ||
"https://gushi.onrender.com";

const CHOICE_STORE = "probat_choice_v2";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

type RetrieveResponse = {
proposal_id: string;
experiment_id: string | null;
label: string | null;
};

type CachedChoice = {
experiment_id: string;
variant_id: string;
ts: number;
};

function lsGet<T = any>(k: string): T | null {
try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
} catch {
    return null;
}
}
function lsSet(k: string, v: any) {
try {
    localStorage.setItem(k, JSON.stringify(v));
} catch {}
}

function now() { return Date.now(); }
function isFresh(ts: number) { return now() - ts <= TTL_MS; }

function writeCachedChoice(proposal_id: string, experiment_id: string, variant_id: string) {
const obj = lsGet<Record<string, CachedChoice>>(CHOICE_STORE) || {};
obj[proposal_id] = { experiment_id, variant_id, ts: now() };
lsSet(CHOICE_STORE, obj);
}
function readCachedChoice(proposal_id: string): CachedChoice | null {
const obj = lsGet<Record<string, CachedChoice>>(CHOICE_STORE);
if (!obj) return null;
const rec = obj[proposal_id];
if (!rec) return null;
if (!isFresh(rec.ts)) return null;
return rec;
}

async function fetchDecision(
baseUrl: string,
proposalId: string
): Promise<{ experiment_id: string; variant_id: string }> {
const url = `${baseUrl.replace(/\/$/, "")}/retrieve_react_experiment/${encodeURIComponent(proposalId)}`;
const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
if (!res.ok) throw new Error(String(res.status));
const data = (await res.json()) as RetrieveResponse;

const experiment_id = (data.experiment_id || `exp_${proposalId}`).toString();
const variant_id = data.label && data.label !== "control" ? data.label : "control";
writeCachedChoice(proposalId, experiment_id, variant_id);
return { experiment_id, variant_id };
}

type NetworkPolicy = "cache-first" | "network-first" | "cache-only";

type WithExperimentOpts = {
proposalId: string;
registry?: Record<string, React.ComponentType<any>>;
networkPolicy?: NetworkPolicy;
};

export function withExperiment<P = any>(
Control: React.ComponentType<P>,
opts: WithExperimentOpts
): React.ComponentType<P> {
const { proposalId, registry = {}, networkPolicy = "cache-first" } = opts;

function Wrapped(props: P) {
    const [choice, setChoice] = React.useState<{ experiment_id: string; label: string } | null>(null);
    const didRequestRef = React.useRef(false);

    React.useEffect(() => {
    let mounted = true;

    const cached = readCachedChoice(proposalId);
    if (networkPolicy === "cache-first" || networkPolicy === "cache-only") {
        if (cached && mounted) {
        setChoice({ experiment_id: cached.experiment_id, label: cached.variant_id });
        }
        if (networkPolicy === "cache-only") {
        return () => { mounted = false; };
        }
        if (cached && isFresh(cached.ts)) {
        return () => { mounted = false; };
        }
    }

    if (!didRequestRef.current) {
        didRequestRef.current = true;
        (async () => {
        try {
            const { experiment_id, variant_id } = await fetchDecision(ENV_BASE, proposalId);
            if (!mounted) return;
            setChoice({ experiment_id, label: variant_id });
        } catch (e) {
            const c = readCachedChoice(proposalId);
            const experiment_id = c?.experiment_id ?? `exp_${proposalId}`;
            const variant_id = c?.variant_id ?? "control";
            if (mounted) setChoice({ experiment_id, label: variant_id });
        }
        })();
    }

    return () => { mounted = false; };
    }, [proposalId, networkPolicy]);

    if (!choice) {
    return React.createElement(Control, { ...(props as any) });
    }

    const Variant = registry[choice.label] || Control;
    return React.createElement(Variant, { ...(props as any) });
}

const controlName = (Control as any).displayName || Control.name || "Component";
(Wrapped as any).displayName = `withExperiment(${controlName})`;
return Wrapped;
}
