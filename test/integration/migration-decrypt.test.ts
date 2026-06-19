import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { propertyLabel } from "../helpers/property-label";
import {
  compatVectors,
  DEFAULT_KEY,
} from "../fixtures/csharp-compat-vectors";

// @/lib/db mock'u — eski (C# ile şifrelenmiş) credential satırlarını DB'ye
// "yerleştirilmiş" gibi seed edip servis akışından okumak için.
vi.mock("@/lib/db", async () => {
  const mod = await import("../helpers/db-mock");
  return { prisma: mod.mockPrisma };
});

import { mockPrisma as db } from "../helpers/db-mock";
import { decrypt } from "@/lib/server/crypto";
import { credentialService } from "@/lib/server/services/credential-service";

describe("Geçiş doğrulama — eski C# verisinin çözülmesi (Task 13.1)", () => {
  afterEach(() => {
    process.env.ENCRYPTION_KEY = DEFAULT_KEY;
  });

  // Task 13.1 — Requirements 4.4, 15.4: fixture vektörleri doğrudan decrypt edilir
  it(
    propertyLabel(
      3,
      "eski C# ile şifrelenmiş tüm credential vektörleri orijinal düz metne çözülür",
    ),
    () => {
      for (const vector of compatVectors) {
        process.env.ENCRYPTION_KEY = vector.key;
        expect(decrypt(vector.encrypted)).toBe(vector.plaintext);
      }
    },
  );
});

describe("Geçiş doğrulama — credential servis akışı (uçtan uca)", () => {
  beforeEach(() => {
    db._reset();
    process.env.ENCRYPTION_KEY = DEFAULT_KEY;
  });
  afterEach(() => {
    process.env.ENCRYPTION_KEY = DEFAULT_KEY;
  });

  // Task 13.1 — Requirements 4.4, 15.4: servis decrypt + maskeleme uçtan uca
  it("eski DB'den gelen şifreli credential, servis listesinde doğru maskelenir", async () => {
    // Eski sistemden taşınmış gibi: keyValue zaten C# uyumlu şifreli değer.
    const vector = compatVectors.find(
      (v) => v.key === DEFAULT_KEY && v.plaintext === "Bearer abc123",
    )!;

    const integration = await db.apiIntegration.create({
      data: {
        name: "legacy-int",
        baseUrlProd: "https://prod.example.com",
        baseUrlTest: "https://test.example.com",
        activeEnv: "test",
      },
    });

    // Eski şifreli değeri doğrudan (encrypt çağırmadan) DB'ye yerleştir.
    await db.apiCredential.create({
      data: {
        apiIntegrationId: integration.id,
        credentialType: "bearer",
        keyName: "Authorization",
        keyValue: vector.encrypted,
      },
    });

    const list = await credentialService.list(integration.id);
    expect(list).toHaveLength(1);

    // Servis decrypt başarılı olduğu için maske "****" (çözülemeyen) değildir.
    const masked = list[0].keyValueMasked as string;
    expect(masked).not.toBe("****");
    // Maskeli değer düz metnin baş/son karakterlerini yansıtır (maskSecret davranışı).
    expect(masked.startsWith("Be")).toBe(true);
    expect(masked.endsWith("23")).toBe(true);
    // Düz metin tam olarak sızdırılmaz.
    expect(masked).not.toBe(vector.plaintext);
  });
});
