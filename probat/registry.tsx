// probat/registry.tsx
import type React from "react";

/**
 * Registry maps:
 *   key = exact path of the overridden component file in the repo
 *   value = { [label: string]: React.ComponentType<any> }
 *
 * The Probat agent keeps imports and entries up to date as experiments are activated.
 */
export const PROBAT_REGISTRIES: Record<string, Record<string, React.ComponentType<any>>> = {
  // "react-test-repo/src/components/Button.tsx": {
  //   a: require("./<proposal>/<exp_id>/<file>").default,
  //   c: require("./<proposal>/<exp_id>/<file>").default,
  // },
};
