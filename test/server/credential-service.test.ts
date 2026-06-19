import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";

// @/lib/db mock'u — paylaşılan singleton db-mock üzerinden.
vi.mock("@/lib/db", async () => {
  const mod = await import("../helpers/db-mock");
  return { prisma: mod.mockPrisma };
});

import { mockPrisma as db } from "../helpers/db-mock";
import { credentialService } from "@/lib/server/services/credential-service";
import { createCredentialSchema } from "@/lib/validation/schemas";

async function seedIntegration(): Promise<string> {
  const created = await db.apiIntegration.create({
    data: {
      name: `int-${Math.random()}`,
      baseUrlProd: "https://prod.example.com",
      baseUrlTest: "https://test.example.com",
      activeEnv: "test",
    },
  });
  return created.id;
}

describe("credential-service — birim testleri", () => {
  beforeEach(() => db._reset());

  // Task 3.1 — Requirements 3.1: keyValue şifreli yazılır
  it("create keyValue'yu şifreli saklar (düz metin DB'ye yazılmaz)", async () => {
    const integrationId = await seedIntegration();
    const id = await credentialService.create(integrationId, {
      credentialType: "header",
      keyName: "X-Api-Key",
      keyValue: "super-secret-123",
    });

    const stored = await db.apiCredential.findUnique({ where: { id } });
    expect(stored).not.toBeNull();
    expect(stored!.keyValue).not.toBe("super-secret-123");
    // HEX:HEX formatı
    expect(stored!.keyValue).toMatch(/^[0-9A-F]+:[0-9A-F]+$/);
  });

  // Task 3.1 — Requirements 3.6: credentialType doğrulaması (Zod katmanı)
  it("geçersiz credentialType reddedilir (Zod)", () => {
    const result = createCredentialSchema.safeParse({
      credentialType: "oauth",
      keyName: "X-Api-Key",
      keyValue: "v",
    });
    expect(result.success).toBe(false);
  });

  it("geçerli credentialType değerleri kabul edilir", () => {
    for (const t of ["header", "query", "bearer"]) {
      const result = createCredentialSchema.safeParse({
        credentialType: t,
        keyName: "X-Api-Key",
        keyValue: "v",
      });
      expect(result.success).toBe(true);
    }
  });

  // Task 3.1 — boş keyName reddedilir (Zod)
  it("boş keyName reddedilir (Zod)", () => {
    const result = createCredentialSchema.safeParse({
      credentialType: "header",
      keyName: "",
      keyValue: "v",
    });
    expect(result.success).toBe(false);
  });
});

describe("credential-service — property-based testleri", () => {
  beforeEach(() => db._reset());

  // Task 3.2 — Property 4: Credential maskeleme — Validates: Requirements 3.5
  it(
    propertyLabel(
      4,
      "∀ list() yanıtı, hiçbir keyValue düz/tam şifreli değer içermez (maskelenir)",
    ),
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 4 }).filter((s) => s.trim().length > 0),
          async (secret) => {
            db._reset();
            const integrationId = await seedIntegration();
            await credentialService.create(integrationId, {
              credentialType: "header",
              keyName: "X-Api-Key",
              keyValue: secret,
            });

            const list = await credentialService.list(integrationId);
            expect(list).toHaveLength(1);
            const item = list[0] as Record<string, unknown>;

            // Maskeli alan dışında ham anahtar değeri içeren bir alan olmamalı.
            const serialized = JSON.stringify(item);
            expect(serialized).not.toContain(secret);
            // Tam şifreli değer de sızdırılmaz (yalnızca maskeli alan döner).
            const stored = db.apiCredential.rows[0];
            expect(serialized).not.toContain(stored.keyValue);
            // keyValueMasked alanı mevcut ve ham değerden farklı.
            expect(item.keyValueMasked).toBeDefined();
            expect(item.keyValueMasked).not.toBe(secret);
          },
        ),
        { numRuns: FC_RUNS },
      );
    },
  );
});
