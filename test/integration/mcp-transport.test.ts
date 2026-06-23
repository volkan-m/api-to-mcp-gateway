import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import nock from "nock";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";

// Inline, controllable prisma mock for MCP transport.
// The include-based queries used by loadTools/callTool are modeled manually.
interface Selection {
  id: string;
  apiIntegrationId: string;
  endpointId: string;
  toolName: string;
  toolDescription: string | null;
  enabled: boolean;
  endpoint: any;
  apiIntegration: any;
}

const state: { selections: Selection[]; endpoints: any[] } = {
  selections: [],
  endpoints: [],
};

vi.mock("@/lib/db", () => ({
  prisma: {
    toolSelection: {
      findMany: async ({ where }: { where: { apiIntegrationId: string; enabled?: boolean } }) =>
        state.selections.filter(
          (s) =>
            s.apiIntegrationId === where.apiIntegrationId &&
            (where.enabled === undefined || s.enabled === where.enabled),
        ),
      findFirst: async ({ where }: { where: { toolName: string; apiIntegrationId: string } }) =>
        state.selections.find(
          (s) => s.toolName === where.toolName && s.apiIntegrationId === where.apiIntegrationId,
        ) ?? null,
    },
    endpoint: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.endpoints.find((e) => e.id === where.id) ?? null,
    },
    apiCredential: {
      findMany: async () => [],
    },
  },
}));

import { POST, GET } from "@/app/api/mcp/route";

function makeReq(headers: Record<string, string>, body?: unknown) {
  return new Request("http://localhost/api/mcp", {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as never;
}

function seedToolAndEndpoint(integrationId: string) {
  const integration = {
    id: integrationId,
    activeEnv: "test",
    baseUrlProd: "https://prod.example.com",
    baseUrlTest: "https://test.example.com",
  };
  const endpoint = {
    id: `ep-${integrationId}`,
    apiIntegrationId: integrationId,
    method: "GET",
    path: "/ping",
    externalUrlProd: null,
    externalUrlTest: null,
    inputSchema: JSON.stringify({ parameters: [] }),
    apiIntegration: integration,
  };
  state.endpoints = [endpoint];
  state.selections = [
    {
      id: `sel-${integrationId}`,
      apiIntegrationId: integrationId,
      endpointId: endpoint.id,
      toolName: "ping_tool",
      toolDescription: "Ping",
      enabled: true,
      endpoint,
      apiIntegration: integration,
    },
  ];
}

describe("MCP transport — entegrasyon testleri", () => {
  beforeEach(() => {
    state.selections = [];
    state.endpoints = [];
    nock.cleanAll();
  });
  afterEach(() => nock.cleanAll());

  // Task 10.1 — Requirements 9.1: X-Integration-Id eksikse 400
  it("X-Integration-Id eksikse HTTP 400 döner ve tool yüklenmez", async () => {
    const res = await POST(makeReq({ "content-type": "application/json" }, { method: "listTools" }));
    expect(res.status).toBe(400);
  });

  // Task 10.1 — Requirements 9.2: listTools flow
  it("listTools etkin tool'ları döndürür", async () => {
    seedToolAndEndpoint("intA");
    const res = await POST(
      makeReq({ "content-type": "application/json", "x-integration-id": "intA" }, { method: "listTools" }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { tools: Array<{ name: string }> };
    expect(json.tools.map((t) => t.name)).toContain("ping_tool");
  });

  // Task 10.1 — Requirements 9.3: callTool flow (target API with nock)
  it("callTool hedef API'yi çağırır ve sonucu döndürür", async () => {
    seedToolAndEndpoint("intB");
    nock("https://test.example.com").get("/ping").reply(200, { pong: true });

    const res = await POST(
      makeReq(
        { "content-type": "application/json", "x-integration-id": "intB" },
        { method: "callTool", params: { name: "ping_tool", arguments: {} } },
      ),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { content: Array<{ text: string }>; isError?: boolean };
    expect(json.isError).toBeFalsy();
    expect(json.content[0].text).toContain("pong");
  });

  // Task 10.1 — Requirements 9.4: invalid method -> 400
  it("geçersiz method HTTP 400 döner", async () => {
    seedToolAndEndpoint("intC");
    const res = await POST(
      makeReq({ "content-type": "application/json", "x-integration-id": "intC" }, { method: "bogusMethod" }),
    );
    expect(res.status).toBe(400);
  });

  // Task 10.1 — Requirements 9.5: tools are reloaded when integrationId changes
  it("farklı integrationId için tool'lar yeniden yüklenir", async () => {
    seedToolAndEndpoint("intD");
    const resD = await GET(
      makeReq({ "x-integration-id": "intD" }) as never,
    );
    const jsonD = (await resD.json()) as { tools: Array<{ name: string }> };
    expect(jsonD.tools).toHaveLength(1);

    // Different integration: no tools
    state.selections = [];
    state.endpoints = [];
    const resE = await GET(makeReq({ "x-integration-id": "intE-empty" }) as never);
    const jsonE = (await resE.json()) as { tools: unknown[] };
    expect(jsonE.tools).toHaveLength(0);
  });
});

describe("MCP transport — property: X-Integration-Id zorunluluğu (Property 8)", () => {
  beforeEach(() => {
    state.selections = [];
    state.endpoints = [];
  });

  // Task 10.2 — Property 8: MCP transport requirement — Validates: Requirements 9.1
  it(
    propertyLabel(
      8,
      "∀ MCP isteği, X-Integration-Id yoksa sonuç 400'dür ve hiçbir tool çağrılmaz",
    ),
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            method: fc.constantFrom("listTools", "callTool", "bogus", "init"),
            withName: fc.boolean(),
          }),
          async ({ method, withName }) => {
            const body: Record<string, unknown> = { method };
            if (withName) body.params = { name: "ping_tool", arguments: {} };
            const res = await POST(makeReq({ "content-type": "application/json" }, body));
            expect(res.status).toBe(400);
          },
        ),
        { numRuns: Math.min(FC_RUNS, 40) },
      );
    },
  );
});
