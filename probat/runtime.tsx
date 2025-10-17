import * as ReactProbat from "react";
import type { ComponentType, MouseEventHandler } from "react";

;(globalThis as any).__probatReact = (globalThis as any).__probatReact || ReactProbat;
if (!(globalThis as any).React) (globalThis as any).React = ReactProbat;
const { useEffect, useState } = ReactProbat;

type VariantInfo = {
  experiment_id: string;
  variant_id: string;
  module_url?: string;
};

type RetrieveResponse = {
  proposal_id: string;
  experiment_id: string;
  label: string;
  mjs_path: string;
};

const BASE = "https://gushi.onrender.com";

const variantCache: Map<string, Promise<VariantInfo>> =
  (globalThis as any).__probatVariantCache ||
  ((globalThis as any).__probatVariantCache = new Map());

const CHOICE_STORE  = "abx_choices_v1";
const VARIANT_STORE = "probat_variant_cache_v1";
const VARIANT_TTL_MS = 6 * 60 * 60 * 1000;

type Persisted = {
  experiment_id: string;
  label: string;
  mjs_path?: string;
  code?: string;
  ts: number;
};

function saveChoice(exp: string, variant: string) {
  try {
    const all = JSON.parse(localStorage.getItem(CHOICE_STORE) || "{}");
    all[exp] = { variant, ts: Date.now() };
    localStorage.setItem(CHOICE_STORE, JSON.stringify(all));
  } catch {}
}

function readPersisted(proposalId: string): Persisted | null {
  try {
    const all = JSON.parse(localStorage.getItem(VARIANT_STORE) || "{}");
    const rec = all[proposalId] as Persisted | undefined;
    if (!rec) return null;
    if (Date.now() - rec.ts > VARIANT_TTL_MS) return null;
    return rec;
  } catch { return null; }
}

function writePersisted(proposalId: string, rec: Omit<Persisted, "ts">) {
  try {
    const all = JSON.parse(localStorage.getItem(VARIANT_STORE) || "{}");
    all[proposalId] = { ...rec, ts: Date.now() };
    localStorage.setItem(VARIANT_STORE, JSON.stringify(all));
  } catch {}
}

function massageVariantCode(raw: string): string {
  let code = raw.replace(
    /const\s+React\s*=\s*globalThis\.React\s*;/,
    'const React = (globalThis.__probatReact || globalThis.React);'
  );

  code = code
    .replace(/^\s*import\s+React(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]react['"];?\s*$/gm, "")
    .replace(/^\s*import\s+\*\s+as\s+React\s+from\s+['"]react['"];?\s*$/gm, "")
    .replace(/^\s*import\s+\{[^}]*\}\s+from\s+['"]react\/jsx-runtime['"];?\s*$/gm, "")
    .replace(/^\s*const\s+React\s*=\s*require\(['"]react['"]\);\s*$/gm, "");

  const prelude =
    `if (!(globalThis.__probatReact || globalThis.React)) {` +
    `  throw new Error("[PROBAT] React not available in variant blob");` +
    `}\n`;

  return prelude + code;
}

async function codeToBlobUrl(rawCode: string): Promise<string> {
  const code = massageVariantCode(rawCode);
  const blob = new Blob([code], { type: "text/javascript" });
  return URL.createObjectURL(blob);
}

export type VariantModule = {
  default: ComponentType<any>;
};

export async function loadVariant(proposalId: string): Promise<VariantInfo> {
  if (!proposalId) throw new Error("Missing proposalId");

  if (variantCache.has(proposalId)) {
    return variantCache.get(proposalId)!;
  }

  const p = (async () => {
    const persisted = readPersisted(proposalId);
    if (persisted) {
      if (persisted.label === "control" || !persisted.mjs_path) {
        saveChoice(persisted.experiment_id, "control");
        return { experiment_id: persisted.experiment_id, variant_id: "control" } as VariantInfo;
      }
      if (persisted.code) {
        const url = await codeToBlobUrl(persisted.code);
        saveChoice(persisted.experiment_id, persisted.label);
        return {
          experiment_id: persisted.experiment_id,
          variant_id: persisted.label,
          module_url: url,
        };
      }
      try {
        const variantUrl = `${BASE}${persisted.mjs_path}`;
        const variantRes = await fetch(variantUrl);
        if (variantRes.ok) {
          const code = await variantRes.text();
          writePersisted(proposalId, {
            experiment_id: persisted.experiment_id,
            label: persisted.label,
            mjs_path: persisted.mjs_path,
            code,
          });
          const url = await codeToBlobUrl(code);
          saveChoice(persisted.experiment_id, persisted.label);
          return {
            experiment_id: persisted.experiment_id,
            variant_id: persisted.label,
            module_url: url,
          };
        } else { }
      } catch (e) { }
    }

    try {
      const url = `${BASE}/retrieve_react_experiment/${encodeURIComponent(proposalId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Retrieve failed (${res.status})`);

      const data: RetrieveResponse = await res.json();

      const experiment_id = data.experiment_id || `exp_${proposalId}`;
      const label = data.label || "control";
      saveChoice(experiment_id, label);

      // Control: persist and return
      if (label === "control" || !data.mjs_path) {
        writePersisted(proposalId, { experiment_id, label, mjs_path: "" });
        return { experiment_id, variant_id: "control" } as VariantInfo;
      }

      // Variant: fetch code, persist, return
      const variantUrl = `${BASE}/variants/${data.mjs_path}`;
      const variantRes = await fetch(variantUrl);
      if (!variantRes.ok) throw new Error(`Variant fetch failed (${variantRes.status})`);
      const code = await variantRes.text();

      writePersisted(proposalId, {
        experiment_id,
        label,
        mjs_path: data.mjs_path,
        code,
      });

      const module_url = await codeToBlobUrl(code);
      return { experiment_id, variant_id: label, module_url };
    } catch (e) {
      return { experiment_id: `exp_${proposalId}`, variant_id: "control" } as VariantInfo;
    }
  })();

  variantCache.set(proposalId, p);
  return p;
}

export async function importVariantModule(module_url: string): Promise<VariantModule> {
  return await import(/* @vite-ignore */ module_url);
}

export async function recordClick(
  experiment_id: string,
  variant_id: string,
  meta?: Record<string, any>
) {
  try {
    const payload = {
      metric_name: "click",
      metric_value: 1,
      metric_unit: "count",
      source: "frontend",
      dimensions: {
        button_id: meta?.button_id ?? "unknown",
        variant: variant_id,
        ...meta,
      },
    };

    const res = await fetch(
      `${BASE}/experiments/${encodeURIComponent(experiment_id)}/metrics`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[PROBAT] metric POST failed: ${res.status}`);
      if (text) console.warn("[PROBAT] server said:", text);
    }
  } catch (err) {
    console.warn("[PROBAT] metric POST error:", err);
  }
}

export function withExperiment<P extends object>(
  ControlComponent: ReactProbat.ComponentType<P>,
  opts: { proposalId: string; onMetric?: (info: { experiment_id: string; variant_id: string }) => void }
) {
  const { proposalId } = opts;

  return function Experimented(props: P & { onClick?: ReactProbat.MouseEventHandler }) {
    const [state, setState] = ReactProbat.useState<{
      ready: boolean;
      experiment_id: string;
      variant_id: string;
      VariantComp?: ReactProbat.ComponentType<any>;
    }>({ ready: false, experiment_id: "", variant_id: "control" });

    ReactProbat.useEffect(() => {
      let mounted = true;
      (async () => {
        const v = await loadVariant(proposalId);
        if (!mounted) return;

        if (v.variant_id === "control" || !v.module_url) {
          setState({ ready: true, experiment_id: v.experiment_id, variant_id: "control" });
        } else {
          try {
            const mod = await importVariantModule(v.module_url);
            if (!mounted) return;
            setState({
              ready: true,
              experiment_id: v.experiment_id,
              variant_id: v.variant_id,
              VariantComp: (mod as any).default,
            });
          } catch {
            setState({ ready: true, experiment_id: v.experiment_id, variant_id: "control" });
          }
        }
      })();

      return () => { mounted = false; };
    }, [proposalId]);

    // --- KEY CHANGE: capture clicks on a wrapper so we ALWAYS see them
    const handleClickCapture: ReactProbat.MouseEventHandler = (e) => {
      // leave user's own onClick intact, but don't let their errors block metrics
      try { props.onClick?.(e); } catch {}
      if (state.experiment_id) {
        recordClick(state.experiment_id, state.variant_id);
        opts.onMetric?.({ experiment_id: state.experiment_id, variant_id: state.variant_id });
      } else { }
    };

    if (!state.ready) return null;

    const Wrapper = (Comp: ReactProbat.ComponentType<any>) => (
      <span
        onClickCapture={handleClickCapture}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") (e.currentTarget as HTMLElement).click();
        }}
        style={{ display: "inline-block" }}
      >
        <Comp {...(props as P)} />
      </span>
    );

    if (state.variant_id === "control" || !state.VariantComp) {
      return Wrapper(ControlComponent);
    }
    const V = state.VariantComp!;
    return Wrapper(V);
  };
}