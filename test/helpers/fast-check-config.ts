import type { Parameters as FcParameters } from "fast-check";

// Property-based testler için ortak fast-check yapılandırması.
// En az 100 iterasyon (tasarım/Requirement 14.3 gereği).
export const FC_RUNS = 100;

export const fcConfig: FcParameters<unknown> = {
  numRuns: FC_RUNS,
};
