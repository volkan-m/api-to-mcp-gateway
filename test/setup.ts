import fc from "fast-check";

// Global default for all property-based tests: at least 100 iterations.
// (Individual tests can increase numRuns if needed.)
fc.configureGlobal({ numRuns: 100 });

// Fixed ENCRYPTION_KEY for deterministic key derivation in tests.
// (crypto.ts uses DEFAULT_KEY when env is not set; we explicitly fix it in tests.)
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default_encryption_key_32_chars_!!";
