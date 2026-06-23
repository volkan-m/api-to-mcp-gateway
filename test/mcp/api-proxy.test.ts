import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import nock from "nock";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";
import { encrypt } from "@/lib/server/crypto";

// Inline prisma mock requiring fine-grained control for api-proxy.
// (Shared db-mock does not support include, so it is controlled directly here.)
interface MockEndpoint {
  id: string;
  apiIntegrationId: string;
  method: string;
  path: string;
  externalUrlProd: string | null;
  externalUrlTest: string | null;
  inputSchema: string;
  apiIntegration: {
    id: string;
    activeEnv: string;
    baseUrlProd: string;
    baseUrlTest: string;
  };
}

const state: {
  endpoints: MockEndpoint[];
  credentials: Array<{ apiIntegrationId: string; credentialType: string; keyName: string; keyValue: string }>;
} = { endpoints: [], credentials: [] };

vi.mock("@/lib/db", () => ({
  prisma: {
    endpoint: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.endpoints.find((e) => e.id === where.id) ?? null,
    },
    apiCredential: {
      findMany: async ({ where }: { where: { apiIntegrationId: string } }) =>
        state.credentials.filter((c) => c.apiIntegrationId === where.apiIntegrationId),
    },
  },
}));

import { proxyApiCall } from "@/lib/mcp/api-proxy";

function seedEndpoint(overrides: Partial<MockEndpoint> = {}): MockEndpoint {
  const ep: MockEndpoint = {
    id: "ep1",
    apiIntegrationId: "int1",
    method: "GET",
    path: "/items/{id}",
    externalUrlProd: null,
    externalUrlTest: null,
    inputSchema: JSON.stringify({
      parameters: [
        { name: "id", in: "path", schema: { type: "string" } },
        { name: "q", in: "query", schema: { type: "string" } },
      ],
    }),
    apiIntegration: {
      id: "int1",
      activeEnv: "test",
      baseUrlProd: "https://prod.example.com",
      baseUrlTest: "https://test.example.com",
      ...(overrides.apiIntegration ?? {}),
    },
    ...overrides,
  };
  if (overrides.apiIntegration) ep.apiIntegration = { ...ep.apiIntegration, ...overrides.apiIntegration };
  state.endpoints = [ep];
  return ep;
}

describe("api-proxy — birim/entegrasyon testleri", () => {
  beforeEach(() => {
    state.endpoints = [];
    state.credentials = [];
    delete process.env.BEARER_TOKEN;
    nock.cleanAll();
  });
  afterEach(() => {
    nock.cleanAll();
  });

  // Task 9.1 — Requirements 10.1: test base URL is selected in test environment
  it("test ortamında test base URL kullanılır, path/query parametreleri doldurulur", async () => {
    seedEndpoint();
    const scope = nock("https://test.example.com")
      .get("/items/42")
      .query({ q: "search" })
      .reply(200, { ok: true });

    const res = await proxyApiCall("int1", "ep1", { id: "42", q: "search" });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });
    expect(scope.isDone()).toBe(true);
  });

  // Task 9.1 — Requirements 10.1: prod base URL is selected in prod environment
  it("prod ortamında prod base URL kullanılır", async () => {
    seedEndpoint({ apiIntegration: { id: "int1", activeEnv: "prod", baseUrlProd: "https://prod.example.com", baseUrlTest: "https://test.example.com" } });
    const scope = nock("https://prod.example.com").get("/items/7").reply(200, { env: "prod" });

    const res = await proxyApiCall("int1", "ep1", { id: "7" });
    expect(res.data).toEqual({ env: "prod" });
    expect(scope.isDone()).toBe(true);
  });

  // Task 9.1 — Requirements 10.3: target 4xx/5xx is returned as-is with status+data
  it("hedef API 404 yanıtı status+data ile aynen döndürülür", async () => {
    seedEndpoint();
    nock("https://test.example.com")
      .get("/items/99")
      .query(true)
      .reply(404, { error: "not found" });

    const res = await proxyApiCall("int1", "ep1", { id: "99" });
    expect(res.status).toBe(404);
    expect(res.data).toEqual({ error: "not found" });
  });

  // Task 9.1 — Requirements 10.5: connection error is thrown
  it("bağlantı hatasında (response yok) hata fırlatılır", async () => {
    seedEndpoint();
    nock("https://test.example.com")
      .get("/items/1")
      .query(true)
      .replyWithError("ECONNREFUSED");

    await expect(proxyApiCall("int1", "ep1", { id: "1" })).rejects.toBeTruthy();
  });

  // Task 9.1 — Requirements 10.4: POST body is passed through
  it("POST için kalan args request body olarak gönderilir", async () => {
    seedEndpoint({
      method: "POST",
      path: "/items",
      inputSchema: JSON.stringify({ parameters: [] }),
    });
    const scope = nock("https://test.example.com")
      .post("/items", { name: "neo" })
      .reply(201, { created: true });

    const res = await proxyApiCall("int1", "ep1", { name: "neo" });
    expect(res.status).toBe(201);
    expect(scope.isDone()).toBe(true);
  });
});

describe("api-proxy — property: ortam seçimi (Property 9)", () => {
  beforeEach(() => {
    state.endpoints = [];
    state.credentials = [];
    nock.cleanAll();
  });
  afterEach(() => nock.cleanAll());

  // Task 9.2 — Property 9: Proxy environment selection — Validates: Requirements 10.1
  it(
    propertyLabel(
      9,
      "∀ endpoint çağrısı, activeEnv==='prod' ise prod URL/credential; aksi halde test",
    ),
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.constantFrom("prod", "test"), async (env) => {
          nock.cleanAll();
          const prodBase = "https://prod.example.com";
          const testBase = "https://test.example.com";
          seedEndpoint({
            path: "/ping",
            inputSchema: JSON.stringify({ parameters: [] }),
            apiIntegration: {
              id: "int1",
              activeEnv: env,
              baseUrlProd: prodBase,
              baseUrlTest: testBase,
            },
          });

          const expectedBase = env === "prod" ? prodBase : testBase;
          const scope = nock(expectedBase).get("/ping").reply(200, { env });

          const res = await proxyApiCall("int1", "ep1", {});
          expect(res.data).toEqual({ env });
          expect(scope.isDone()).toBe(true);
        }),
        { numRuns: Math.min(FC_RUNS, 50) },
      );
    },
  );
});

describe("api-proxy — property: yetki önceliği (Property 10)", () => {
  beforeEach(() => {
    state.endpoints = [];
    state.credentials = [];
    delete process.env.BEARER_TOKEN;
    nock.cleanAll();
  });
  afterEach(() => {
    nock.cleanAll();
    delete process.env.BEARER_TOKEN;
  });

  // Task 9.3 — Property 10: Auth priority — Validates: Requirements 10.2
  // Order: args.bearerToken > customHeaders.Authorization > DB credential > BEARER_TOKEN env
  it(
    propertyLabel(
      10,
      "yetki kaynağı önceliği args.bearerToken > customHeaders.Authorization > DB credential > BEARER_TOKEN env şeklinde deterministiktir",
    ),
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            hasArgsToken: fc.boolean(),
            hasCustomHeader: fc.boolean(),
            hasDbCred: fc.boolean(),
            hasEnv: fc.boolean(),
          }),
          async ({ hasArgsToken, hasCustomHeader, hasDbCred, hasEnv }) => {
            nock.cleanAll();
            state.credentials = [];
            delete process.env.BEARER_TOKEN;

            seedEndpoint({
              path: "/auth",
              inputSchema: JSON.stringify({ parameters: [] }),
            });

            const argsToken = "ARGS_TOKEN";
            const headerAuth = "Bearer HEADER_TOKEN";
            const dbToken = "DB_TOKEN";
            const envToken = "ENV_TOKEN";

            if (hasDbCred) {
              state.credentials = [
                {
                  apiIntegrationId: "int1",
                  credentialType: "bearer",
                  keyName: "Authorization",
                  keyValue: encrypt(dbToken),
                },
              ];
            }
            if (hasEnv) process.env.BEARER_TOKEN = envToken;

            // Expected Authorization value (in priority order)
            let expected: string | undefined;
            if (hasArgsToken) expected = `Bearer ${argsToken}`;
            else if (hasCustomHeader) expected = headerAuth;
            else if (hasDbCred) expected = `Bearer ${dbToken}`;
            else if (hasEnv) expected = `Bearer ${envToken}`;
            else expected = undefined;

            let capturedAuth: string | undefined;
            nock("https://test.example.com")
              .get("/auth")
              .reply(function () {
                capturedAuth = (this.req.headers["authorization"] as string | string[] | undefined) as string;
                if (Array.isArray(capturedAuth)) capturedAuth = capturedAuth[0];
                return [200, { ok: true }];
              });

            const args: Record<string, unknown> = {};
            if (hasArgsToken) args.bearerToken = argsToken;
            const customHeaders = hasCustomHeader ? { Authorization: headerAuth } : undefined;

            await proxyApiCall("int1", "ep1", args, customHeaders);

            if (expected === undefined) {
              expect(capturedAuth).toBeUndefined();
            } else {
              expect(capturedAuth).toBe(expected);
            }
          },
        ),
        { numRuns: Math.min(FC_RUNS, 60) },
      );
    },
  );
});
