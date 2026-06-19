import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";

// @/lib/db mock'u — paylaşılan singleton db-mock üzerinden.
vi.mock("@/lib/db", async () => {
  const mod = await import("../helpers/db-mock");
  return { prisma: mod.mockPrisma };
});

// SSRF guard'ı mock'la: URL indirme testlerinde DNS'e gitmeden deterministik
// güvenli/güvensiz kararı verdirebilmek için.
let safeUrlImpl: (url: string) => Promise<boolean> = async () => true;
vi.mock("@/lib/server/ssrf-guard", () => ({
  isSafeUrl: (url: string) => safeUrlImpl(url),
}));

import { mockPrisma as db } from "../helpers/db-mock";
import { specService } from "@/lib/server/services/spec-service";
import { AppError } from "@/lib/server/errors";

const OPENAPI3 = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Test API", version: "1.2.3" },
  paths: {
    "/users/{id}": {
      get: {
        operationId: "getUser",
        summary: "Kullanıcı getir",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "ok" } },
      },
    },
    "/users": {
      post: {
        operationId: "createUser",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { name: { type: "string" } } },
            },
          },
        },
        responses: { "201": { description: "created" } },
      },
    },
  },
});

const SWAGGER2 = JSON.stringify({
  swagger: "2.0",
  info: { title: "Legacy", version: "1.0" },
  paths: { "/ping": { get: { responses: { "200": { description: "ok" } } } } },
});

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

describe("spec-service — birim testleri", () => {
  beforeEach(() => {
    db._reset();
    safeUrlImpl = async () => true;
  });

  // Task 5.1 — Requirements 5.1: geçerli openapi3 içerik parse edilip ApiSpec oluşturur
  it("geçerli openapi3 içeriği ApiSpec olarak kaydeder", async () => {
    const integrationId = await seedIntegration();
    const specId = await specService.uploadSpec(integrationId, OPENAPI3);
    const stored = await db.apiSpec.findUnique({ where: { id: specId } });
    expect(stored).not.toBeNull();
    expect(stored!.format).toBe("openapi3");
    expect(stored!.title).toBe("Test API");
    expect(stored!.version).toBe("1.2.3");
  });

  // Task 5.1 — Requirements 5.1: swagger2 desteklenir
  it("geçerli swagger2 içeriği ApiSpec olarak kaydeder", async () => {
    const integrationId = await seedIntegration();
    const specId = await specService.uploadSpec(integrationId, SWAGGER2);
    const stored = await db.apiSpec.findUnique({ where: { id: specId } });
    expect(stored!.format).toBe("swagger2");
  });

  // Task 5.1 — Requirements 5.2: geçersiz spec SPEC_PARSE_ERROR fırlatır, kayıt oluşmaz
  it("geçersiz spec içeriğinde SPEC_PARSE_ERROR fırlatır ve kayıt oluşmaz", async () => {
    const integrationId = await seedIntegration();
    await expect(
      specService.uploadSpec(integrationId, "{ not valid openapi }"),
    ).rejects.toMatchObject({ code: "SPEC_PARSE_ERROR" });
    expect(db.apiSpec.rows).toHaveLength(0);
  });

  it("boş spec içeriği SPEC_PARSE_ERROR fırlatır", async () => {
    const integrationId = await seedIntegration();
    await expect(specService.uploadSpec(integrationId, "   ")).rejects.toBeInstanceOf(
      AppError,
    );
    expect(db.apiSpec.rows).toHaveLength(0);
  });

  // Task 5.1 — Requirements 5.3, 5.6: SSRF reddinde SSRF_BLOCKED, indirme yapılmaz
  it("SSRF reddinde SSRF_BLOCKED fırlatır ve indirme/kayıt yapılmaz", async () => {
    const integrationId = await seedIntegration();
    safeUrlImpl = async () => false;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      specService.downloadSpecFromUrl(integrationId, "http://169.254.169.254/meta"),
    ).rejects.toMatchObject({ code: "SSRF_BLOCKED" });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(db.apiSpec.rows).toHaveLength(0);
    fetchSpy.mockRestore();
  });
});

describe("spec-service — endpoint çıkarma idempotansı (property)", () => {
  beforeEach(() => {
    db._reset();
    safeUrlImpl = async () => true;
  });

  // Task 5.2 — Property 6: Endpoint çıkarma idempotansı — Validates: Requirements 6.3
  it(
    propertyLabel(
      6,
      "∀ spec S, extractEndpoints(S) iki kez çalıştırıldığında endpoint sayısı ve içerikleri değişmez",
    ),
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Rastgele sayıda path/method kombinasyonu üret
          fc.array(
            fc.record({
              path: fc
                .string({ minLength: 1 })
                .map((s) => "/" + s.replace(/[^a-zA-Z0-9]/g, "") + "x"),
              method: fc.constantFrom("get", "post", "put", "delete", "patch"),
            }),
            { minLength: 1, maxLength: 6 },
          ),
          async (ops) => {
            db._reset();
            const integrationId = await seedIntegration();

            // Benzersiz (method, path) kombinasyonlarından bir OpenAPI dokümanı kur
            const paths: Record<string, Record<string, unknown>> = {};
            for (const op of ops) {
              paths[op.path] = paths[op.path] ?? {};
              paths[op.path][op.method] = {
                responses: { "200": { description: "ok" } },
              };
            }
            const content = JSON.stringify({
              openapi: "3.0.0",
              info: { title: "Gen", version: "1.0" },
              paths,
            });

            const specId = await specService.uploadSpec(integrationId, content);

            const firstCount = await specService.extractEndpoints(integrationId, specId);
            const firstRows = JSON.stringify(
              [...db.endpoint.rows]
                .map((r) => ({ method: r.method, path: r.path, inputSchema: r.inputSchema }))
                .sort((a, b) => (a.method + a.path).localeCompare(b.method + b.path)),
            );

            const secondCount = await specService.extractEndpoints(integrationId, specId);
            const secondRows = JSON.stringify(
              [...db.endpoint.rows]
                .map((r) => ({ method: r.method, path: r.path, inputSchema: r.inputSchema }))
                .sort((a, b) => (a.method + a.path).localeCompare(b.method + b.path)),
            );

            // Sayı ve içerik iki çalıştırma arasında değişmez
            expect(secondCount).toBe(firstCount);
            expect(secondRows).toBe(firstRows);

            // inputSchema her zaman geçerli JSON
            for (const row of db.endpoint.rows) {
              expect(() => JSON.parse(row.inputSchema)).not.toThrow();
            }
          },
        ),
        { numRuns: FC_RUNS },
      );
    },
  );
});
