import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Test yapılandırması. Node ortamı (sunucu/MCP/servis mantığı test edilir),
// `@/` path alias'ı tsconfig ile aynı şekilde proje köküne bağlanır,
// fast-check için global varsayılan iterasyon sayısı en az 100'dür
// (test/setup.ts içinde ayarlanır).
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
