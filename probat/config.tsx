// probat/config.tsx
/**
 * Centralized config detection for API base URL.
 * Priority:
 *  1) Vite: import.meta.env.VITE_PROBAT_API
 *  2) Next.js: process.env.NEXT_PUBLIC_PROBAT_API
 *  3) Window global: (window as any).__PROBAT_API
 *  4) Fallback: https://gushi.onrender.com
 */
export const ENV_BASE: string =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_PROBAT_API) ||
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_PROBAT_API) ||
  (typeof window !== "undefined" && (window as any).__PROBAT_API) ||
  "https://gushi.onrender.com";

// Local cache config
export const CHOICE_STORE = "probat_choice_v2";
export const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
