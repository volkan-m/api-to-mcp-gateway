import { describe, it, expect, afterEach } from "vitest";
import fc from "fast-check";
import { encrypt, decrypt, maskSecret } from "@/lib/server/crypto";
import { AppError } from "@/lib/server/errors";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";
import {
  compatVectors,
  DEFAULT_KEY,
} from "../fixtures/csharp-compat-vectors";

const HEX_PAIR = /^[0-9A-F]+:[0-9A-F]+$/;

describe("crypto — birim testleri", () => {
  afterEach(() => {
    process.env.ENCRYPTION_KEY = DEFAULT_KEY;
  });

  // Task 2.1 — Requirements 3.2
  it("encrypt çıktısı büyük harf HEX:HEX biçimindedir", () => {
    const out = encrypt("hello-world");
    expect(out).toMatch(HEX_PAIR);
    const [ivHex] = out.split(":");
    // IV 16 bayt = 32 hex karakter
    expect(ivHex).toHaveLength(32);
  });

  // Task 2.1 — Requirements 3.7
  it("geçersiz formatlı decrypt girdisi INVALID_CIPHER fırlatır (':' yok)", () => {
    expect(() => decrypt("not-a-valid-cipher")).toThrowError(AppError);
    try {
      decrypt("not-a-valid-cipher");
    } catch (e) {
      expect((e as AppError).code).toBe("INVALID_CIPHER");
    }
  });

  // Task 2.1 — Requirements 3.7
  it("HEX olmayan/bozuk parçalar INVALID_CIPHER fırlatır", () => {
    try {
      decrypt("ZZZZ:YYYY");
      throw new Error("beklenen hata fırlatılmadı");
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe("INVALID_CIPHER");
    }
  });

  it("ikiden fazla ':' parçası INVALID_CIPHER fırlatır", () => {
    try {
      decrypt("AA:BB:CC");
      throw new Error("beklenen hata fırlatılmadı");
    } catch (e) {
      expect((e as AppError).code).toBe("INVALID_CIPHER");
    }
  });

  it("maskSecret tam değeri açığa çıkarmaz", () => {
    expect(maskSecret("supersecretvalue")).not.toContain("persecretval");
    expect(maskSecret("ab")).toBe("****");
    expect(maskSecret("")).toBe("");
  });
});

describe("crypto — property-based testleri", () => {
  afterEach(() => {
    process.env.ENCRYPTION_KEY = DEFAULT_KEY;
  });

  // Task 2.2 — Property 1: Encryption round-trip — Validates: Requirements 3.4
  it(
    propertyLabel(1, "∀ metin s, decrypt(encrypt(s)) === s"),
    () => {
      fc.assert(
        fc.property(fc.string(), (s) => {
          expect(decrypt(encrypt(s))).toBe(s);
        }),
        { numRuns: FC_RUNS },
      );
    },
  );

  // Task 2.3 — Property 2: Encryption confidentiality — Validates: Requirements 3.2, 3.3
  it(
    propertyLabel(
      2,
      "∀ credential, encrypt çıktısı HEX:HEX formatındadır, düz metni içermez ve farklı IV ile farklı çıktı üretir",
    ),
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 4 }).filter((s) => s.trim().length > 0),
          (plaintext) => {
            const out1 = encrypt(plaintext);
            const out2 = encrypt(plaintext);

            // Format: uppercase HEX:HEX
            expect(out1).toMatch(HEX_PAIR);

            // Confidentiality: the plaintext byte sequence is not present in the ciphertext.
            // (Comparison is done in hex; at least 4-char input to avoid accidental
            // single-character hex collisions.)
            const plaintextHex = Buffer.from(plaintext, "utf8")
              .toString("hex")
              .toUpperCase();
            const ciphertextHex = out1.split(":")[1];
            expect(ciphertextHex).not.toContain(plaintextHex);

            // Random IV => same input produces different output
            expect(out1).not.toBe(out2);
            // Both still decrypt to the same plaintext
            expect(decrypt(out1)).toBe(plaintext);
            expect(decrypt(out2)).toBe(plaintext);
          },
        ),
        { numRuns: FC_RUNS },
      );
    },
  );

  // Task 2.4 — Property 3: C# compatibility (MIGRATION CRITICAL) — Validates: Requirements 4.2
  it(
    propertyLabel(
      3,
      "∀ C# ile şifrelenmiş e, decrypt(e) orijinal düz metni döndürür",
    ),
    () => {
      // Decrypt all compatibility vectors.
      for (const vector of compatVectors) {
        process.env.ENCRYPTION_KEY = vector.key;
        expect(decrypt(vector.encrypted)).toBe(vector.plaintext);
      }
    },
  );

  // Task 2.4 — Requirements 4.1, 4.3: key derivation is the same as C#
  it("env tanımsızken DEFAULT_KEY ile üretilmiş vektör çözülebilir (Requirement 4.3)", () => {
    delete process.env.ENCRYPTION_KEY;
    const defaultVector = compatVectors.find(
      (v) => v.key === DEFAULT_KEY && v.plaintext === "Bearer abc123",
    )!;
    expect(decrypt(defaultVector.encrypted)).toBe("Bearer abc123");
  });
});
