import Exp_0_a from "./3a32c924-c933-4c25-a601-504610c53726/91c7f831-78a4-48e6-9e27-9460378f67dd";
import Exp_1_c from "./3a32c924-c933-4c25-a601-504610c53726/fe57446f-da48-4df6-bd6f-fcf8b4374126";
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
    "a": Exp_0_a,
    "c": Exp_1_c,
  },
};