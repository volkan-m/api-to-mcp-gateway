import { createMockPrisma } from "./mock-prisma";

// @/lib/db için paylaşılan singleton mock örneği.
//
// Kullanım deseni (vitest hoisting güvenli):
//   vi.mock("@/lib/db", async () => {
//     const mod = await import("../helpers/db-mock");
//     return { prisma: mod.mockPrisma };
//   });
//   import { mockPrisma } from "../helpers/db-mock";
//
// ESM modülleri tekildir; vi.mock factory'sindeki dynamic import ile testin
// statik importu AYNI nesneyi döndürür. Böylece seed/_reset için aynı örneğe
// erişilir.
export const mockPrisma = createMockPrisma();
