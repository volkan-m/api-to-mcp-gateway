import type { Parameters as FcParameters } from "fast-check";

// Common fast-check configuration for property-based tests.
// At least 100 iterations (required by design/Requirement 14.3).
export const FC_RUNS = 100;

export const fcConfig: FcParameters<unknown> = {
  numRuns: FC_RUNS,
};
