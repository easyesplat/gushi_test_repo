// probat/registry.ts
import type React from "react";

// EXAMPLE: map labels to the components inside your experiments folders.
// Adjust these imports to match the actual file you export in each experiment dir.
import ButtonA from "./experiments/3a32c924-c933-4c25-a601-504610c53726/0a888779-e599-456c-a7c8-d6a6aeaedf5c.tsx"; // label "a"
import ButtonB from "./experiments/3a32c924-c933-4c25-a601-504610c53726/fe57446f-da48-4df6-bd6f-fcf8b4374126.tsx"; // label "b"

export const PROBAT_REGISTRIES: Record<
  string,
  Record<string, React.ComponentType<any>>
> = {
  // key MUST be the exact path of the component file you’re overriding
  "react-test-repo/src/components/Button.tsx": {
    a: ButtonA,
    c: ButtonB,
  },
};
