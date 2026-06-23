import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Test configuration. Node environment (server/MCP/service logic is tested),
// `@/` path alias resolves to project root same as tsconfig,
// global default iteration count for fast-check is at least 100
// (configured in test/setup.ts).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    pool: "forks",
  },
});
