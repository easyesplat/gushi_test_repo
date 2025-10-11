import React from "react";

type ResolveResp = {
  proposal_id: string;
  experiment_id: string;
  treatment_label: string;
};

const API_BASE = "https://gushi.onrender.com";

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    "samesite=lax",
    `max-age=${maxAgeSeconds}`,
  ];
  document.cookie = parts.join("; ");
}
function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

async function fetchDecision(proposalId: string): Promise<ResolveResp | null> {
  const url = `${API_BASE}/retrieve_react_experiment/${encodeURIComponent(proposalId)}`;
  const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as ResolveResp;
  return data;
}

async function postClickMetric(experimentId: string) {
  const url = `${API_BASE}/experiments/${encodeURIComponent(experimentId)}/metrics`;
  const payload = {
    metric_name: "click",
    metric_value: 1,
    metric_unit: "count",
    source: "react",
    dimensions: {},
  };
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {}
}

export function withProposalVariant<P>(
  Original: React.ComponentType<P>,
  proposalId: string,
  cookieTTLSeconds = 60 * 60 * 24 * 7
) {
  const cookieKey = `variant_${proposalId}`;

  const Wrapper: React.FC<P> = (props) => {
    const [Comp, setComp] = React.useState<React.ComponentType<P> | null>(null);
    const [ready, setReady] = React.useState(false);
    const [expId, setExpId] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (typeof window !== "undefined") (window as any).React = React;
      let cancelled = false;

      async function init() {
        try {
          let chosen: ResolveResp | null = null;
          const cached = getCookie(cookieKey);
          if (cached) {
            try {
              chosen = JSON.parse(cached) as ResolveResp;
            } catch {}
          }
          if (!chosen) {
            chosen = await fetchDecision(proposalId);
            if (chosen) setCookie(cookieKey, JSON.stringify(chosen), cookieTTLSeconds);
          }
          if (!chosen || chosen.treatment_label === "control" || !chosen.experiment_id) {
            setComp(() => Original);
            setReady(true);
            setExpId(null);
            return;
          }
          const variantUrl = `${API_BASE}/variants/${encodeURIComponent(
            proposalId
          )}/${encodeURIComponent(chosen.experiment_id)}.mjs`;
          const mod: any = await import(/* @vite-ignore */ variantUrl);
          let Final: React.ComponentType<P> | null = null;
          if (typeof mod?.applyVariant === "function") Final = mod.applyVariant(Original);
          else if (mod?.Variant) Final = mod.Variant as React.ComponentType<P>;
          else if (mod?.default) Final = mod.default as React.ComponentType<P>;
          else Final = Original;
          setComp(() => Final!);
          setReady(true);
          setExpId(chosen.experiment_id);
        } catch (err) {
          setComp(() => Original);
          setReady(true);
          setExpId(null);
        }
      }

      init();
      return () => {
        cancelled = true;
      };
    }, [cookieKey]);

    const containerStyle: React.CSSProperties = {
      opacity: ready ? 1 : 0,
      transition: "opacity 0.8s ease-in-out",
      width: "100%",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    };

    const handleClick = React.useCallback(() => {
      if (expId) postClickMetric(expId);
    }, [expId]);

    if (!Comp) return null;
    return (
      <div style={containerStyle} onClick={handleClick}>
        <Comp {...props} />
      </div>
    );
  };

  return Wrapper;
}