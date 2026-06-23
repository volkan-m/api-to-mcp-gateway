import { createMockPrisma } from "./mock-prisma";

// Shared singleton mock instance for @/lib/db.
//
// Usage pattern (vitest hoisting safe):
//   vi.mock("@/lib/db", async () => {
//     const mod = await import("../helpers/db-mock");
//     return { prisma: mod.mockPrisma };
//   });
//   import { mockPrisma } from "../helpers/db-mock";
//
// ESM modules are singletons; the dynamic import inside the vi.mock factory and
// the test's static import return THE SAME object. This allows accessing the
// same instance for seed/_reset.
export const mockPrisma = createMockPrisma();
