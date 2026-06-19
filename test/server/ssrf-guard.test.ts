import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import fc from "fast-check";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";

// dns/promises.lookup mock'u — düz (vi.fn olmayan) mutable bir implementasyon
// kullanılır. Böylece vitest'in vi.fn async-sonuç izlemesinin yarattığı
// "phantom unhandled rejection" sorunu yaşanmaz; reddetme yalnızca
// isSafeUrl'ün try/catch'i tarafından ele alınır.
let lookupImpl: (...args: unknown[]) => Promise<Array<{ address: string; family: number }>> =
  async () => [];

vi.mock("dns/promises", () => ({
  default: { lookup: (...a: unknown[]) => lookupImpl(...a) },
  lookup: (...a: unknown[]) => lookupImpl(...a),
}));

import { isSafeUrl } from "@/lib/server/ssrf-guard";

function resolveTo(...addresses: string[]) {
  lookupImpl = async () =>
    addresses.map((address) => ({
      address,
      family: address.includes(":") ? 6 : 4,
    }));
}

describe("ssrf-guard — birim testleri", () => {
  beforeEach(() => {
    lookupImpl = async () => [];
  });

  // Task 4.1 — Requirements 5.4: http/https dışı şema -> false
  it("http/https olmayan şema reddedilir", async () => {
    resolveTo("8.8.8.8");
    expect(await isSafeUrl("ftp://example.com")).toBe(false);
    expect(await isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(await isSafeUrl("gopher://example.com")).toBe(false);
  });

  // Task 4.1 — Requirements 5.5: geçersiz URL -> false
  it("geçersiz URL reddedilir", async () => {
    expect(await isSafeUrl("not-a-url")).toBe(false);
    expect(await isSafeUrl("")).toBe(false);
  });

  // Task 4.1 — Requirements 5.5: DNS hatası -> false (fail-closed)
  it("DNS çözümleme hatasında false döner (fail-closed)", async () => {
    lookupImpl = async () => {
      throw new Error("ENOTFOUND");
    };
    expect(await isSafeUrl("https://does-not-exist.example")).toBe(false);
  });

  it("boş DNS yanıtında false döner", async () => {
    lookupImpl = async () => [];
    expect(await isSafeUrl("https://empty.example")).toBe(false);
  });

  // Task 4.1: public IP -> true
  it("public IP'ye çözümlenen https URL kabul edilir", async () => {
    resolveTo("93.184.216.34");
    expect(await isSafeUrl("https://example.com")).toBe(true);
  });

  it("herhangi bir kayıt private ise reddedilir (DNS rebinding koruması)", async () => {
    resolveTo("93.184.216.34", "127.0.0.1");
    expect(await isSafeUrl("https://mixed.example")).toBe(false);
  });
});

describe("ssrf-guard — property-based testleri", () => {
  beforeEach(() => {
    lookupImpl = async () => [];
  });

  // Task 4.2 — Property 5: SSRF fail-closed — Validates: Requirements 5.3, 5.4, 5.5
  it(
    propertyLabel(
      5,
      "∀ private/loopback/link-local IP'ye çözümlenen url -> false; ∀ http/https olmayan şema -> false",
    ),
    async () => {
      // Private/loopback/link-local IPv4 üreticisi
      const privateIpv4 = fc.oneof(
        fc.tuple(fc.constant(10), fc.nat(255), fc.nat(255), fc.nat(255)),
        fc.tuple(fc.constant(127), fc.nat(255), fc.nat(255), fc.nat(255)),
        fc.tuple(fc.constant(192), fc.constant(168), fc.nat(255), fc.nat(255)),
        fc.tuple(fc.constant(169), fc.constant(254), fc.nat(255), fc.nat(255)),
        fc.tuple(
          fc.constant(172),
          fc.integer({ min: 16, max: 31 }),
          fc.nat(255),
          fc.nat(255),
        ),
      ).map((parts) => parts.join("."));

      await fc.assert(
        fc.asyncProperty(privateIpv4, async (ip) => {
          resolveTo(ip);
          expect(await isSafeUrl("https://internal.example")).toBe(false);
        }),
        { numRuns: FC_RUNS },
      );

      // http/https olmayan şemalar her zaman false
      const badScheme = fc.constantFrom("ftp", "file", "gopher", "ws", "data");
      await fc.assert(
        fc.asyncProperty(badScheme, async (scheme) => {
          resolveTo("93.184.216.34"); // IP güvenli olsa bile şema reddedilir
          expect(await isSafeUrl(`${scheme}://example.com/x`)).toBe(false);
        }),
        { numRuns: FC_RUNS },
      );
    },
  );
});
