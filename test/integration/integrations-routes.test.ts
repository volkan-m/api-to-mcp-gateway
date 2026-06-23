import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";

vi.mock("@/lib/db", async () => {
  const mod = await import("../helpers/db-mock");
  return { prisma: mod.mockPrisma };
});

import { mockPrisma as db } from "../helpers/db-mock";
import * as integrationsRoute from "@/app/api/integrations/route";
import * as integrationByIdRoute from "@/app/api/integrations/[id]/route";
import * as credentialsRoute from "@/app/api/integrations/[id]/credentials/route";

function jsonReq(body: unknown) {
  return new Request("http://localhost/api/integrations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

const VALID_INTEGRATION = {
  name: "Test Integration",
  baseUrlProd: "https://prod.example.com",
  baseUrlTest: "https://test.example.com",
};

describe("REST route handlers — entegrasyon testleri", () => {
  beforeEach(() => db._reset());

  // Task 11.1 — Requirements 12.1: list starts empty
  it("GET /api/integrations boş liste döner", async () => {
    const res = await integrationsRoute.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  // Task 11.1 — Requirements 12.1: create -> 201, get -> 200
  it("POST oluşturur (201), GET ile okunur (200)", async () => {
    const createRes = await integrationsRoute.POST(jsonReq(VALID_INTEGRATION));
    expect(createRes.status).toBe(201);
    const { id } = (await createRes.json()) as { id: string };
    expect(id).toBeTruthy();

    const getRes = await integrationByIdRoute.GET({} as never, params(id));
    expect(getRes.status).toBe(200);
    const fetched = (await getRes.json()) as { name: string };
    expect(fetched.name).toBe(VALID_INTEGRATION.name);
  });

  // Task 11.1 — Requirements 12.3: Zod validation error -> 400
  it("geçersiz gövde 400 (VALIDATION_ERROR) döner", async () => {
    const res = await integrationsRoute.POST(jsonReq({ name: "" }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("VALIDATION_ERROR");
  });

  // Task 11.1 — Requirements 12.2: unknown record -> 404 (AppError mapping)
  it("bilinmeyen id GET 404 (NOT_FOUND) döner", async () => {
    const res = await integrationByIdRoute.GET({} as never, params("does-not-exist"));
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("NOT_FOUND");
  });

  // Task 11.1 — CONFLICT mapping -> 409
  it("aynı isimle ikinci oluşturma 409 (CONFLICT) döner", async () => {
    await integrationsRoute.POST(jsonReq(VALID_INTEGRATION));
    const res = await integrationsRoute.POST(jsonReq(VALID_INTEGRATION));
    expect(res.status).toBe(409);
  });

  // Task 11.1 — credential sub-resource (POST -> 201, GET masked list)
  it("credential POST 201, GET maskeli liste döner", async () => {
    const createRes = await integrationsRoute.POST(jsonReq(VALID_INTEGRATION));
    const { id } = (await createRes.json()) as { id: string };

    const credReq = new Request("http://localhost/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ credentialType: "header", keyName: "X-Api-Key", keyValue: "secret-value-1234" }),
    }) as never;
    const credRes = await credentialsRoute.POST(credReq, params(id));
    expect(credRes.status).toBe(201);

    const listRes = await credentialsRoute.GET({} as never, params(id));
    const list = (await listRes.json()) as Array<Record<string, unknown>>;
    expect(list).toHaveLength(1);
    expect(JSON.stringify(list)).not.toContain("secret-value-1234");
    expect(list[0].keyValueMasked).toBeDefined();
  });
});

describe("REST yüzey eşdeğerliği — property (Property 11)", () => {
  beforeEach(() => db._reset());

  // Old C# IntegrationsController route table (method + path template).
  // Verifies each one exists in the consolidated Route Handlers.
  const routeTable: Array<{ method: string; module: Record<string, unknown> }> = [
    { method: "GET", module: integrationsRoute },
    { method: "POST", module: integrationsRoute },
    { method: "GET", module: integrationByIdRoute },
    { method: "PUT", module: integrationByIdRoute },
    { method: "DELETE", module: integrationByIdRoute },
    { method: "GET", module: credentialsRoute },
    { method: "POST", module: credentialsRoute },
  ];

  // Task 11.2 — Property 11: REST surface equivalence — Validates: Requirements 12.1
  it(
    propertyLabel(
      11,
      "∀ mevcut C# controller route'u, birleşik Route Handler aynı HTTP metodu/yolu için handler sağlar",
    ),
    () => {
      fc.assert(
        fc.property(fc.nat(routeTable.length - 1), (idx) => {
          const entry = routeTable[idx];
          // A handler must be exported for each expected method.
          expect(typeof entry.module[entry.method]).toBe("function");
        }),
        { numRuns: Math.min(FC_RUNS, routeTable.length * 4) },
      );
    },
  );

  it("oluşturma sonrası liste tam olarak bir kayıt içerir (semantik eşdeğerlik)", async () => {
    await integrationsRoute.POST(jsonReq(VALID_INTEGRATION));
    const res = await integrationsRoute.GET();
    const list = (await res.json()) as unknown[];
    expect(list).toHaveLength(1);
  });
});
