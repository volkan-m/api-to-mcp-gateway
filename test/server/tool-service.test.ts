import { describe, it, expect, beforeEach, vi } from "vitest";
import fc from "fast-check";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";

vi.mock("@/lib/db", async () => {
  const mod = await import("../helpers/db-mock");
  return { prisma: mod.mockPrisma };
});

import { mockPrisma as db } from "../helpers/db-mock";
import { toolService } from "@/lib/server/services/tool-service";
import { endpointService } from "@/lib/server/services/endpoint-service";
import { upsertToolSchema } from "@/lib/validation/schemas";

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

async function seedEndpoint(integrationId: string, method = "GET", path = "/x"): Promise<string> {
  const created = await db.endpoint.create({
    data: {
      apiIntegrationId: integrationId,
      method,
      path,
      inputSchema: "{}",
    },
  });
  return created.id;
}

describe("tool-service — birim testleri", () => {
  beforeEach(() => db._reset());

  // Task 6.1 — Requirements 7.1: upsert creates a tool selection
  it("upsert yeni bir tool seçimi oluşturur", async () => {
    const integrationId = await seedIntegration();
    const endpointId = await seedEndpoint(integrationId);
    const id = await toolService.upsert(integrationId, {
      endpointId,
      toolName: "get_x",
      toolDescription: "X getir",
      enabled: true,
    });
    const stored = await db.toolSelection.findUnique({ where: { id } });
    expect(stored).not.toBeNull();
    expect(stored!.toolName).toBe("get_x");
  });

  // Task 6.1 — Requirements 7.3: empty toolName rejected (Zod)
  it("boş toolName reddedilir (Zod)", () => {
    const result = upsertToolSchema.safeParse({
      endpointId: "e1",
      toolName: "",
    });
    expect(result.success).toBe(false);
  });

  // Task 6.1 — Requirements 7.4: enabled defaults to true
  it("enabled varsayılanı true'dur (Zod default)", () => {
    const result = upsertToolSchema.parse({
      endpointId: "e1",
      toolName: "t",
    });
    expect(result.enabled).toBe(true);
  });

  it("bilinmeyen endpointId NOT_FOUND fırlatır", async () => {
    const integrationId = await seedIntegration();
    await expect(
      toolService.upsert(integrationId, {
        endpointId: "does-not-exist",
        toolName: "t",
        enabled: true,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("benzersizlik değişmezleri — property-based", () => {
  beforeEach(() => db._reset());

  // Task 6.2 — Property 7: Uniqueness invariants — Validates: Requirements 8.1, 8.2
  it(
    propertyLabel(
      7,
      "bir entegrasyonda iki Endpoint aynı (method, path)'e, iki ToolSelection aynı (apiIntegrationId, endpointId)'e sahip olamaz",
    ),
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            method: fc.constantFrom("GET", "POST", "PUT", "DELETE", "PATCH"),
            path: fc
              .string({ minLength: 1 })
              .map((s) => "/" + s.replace(/[^a-zA-Z0-9]/g, "") + "y"),
            repeats: fc.integer({ min: 2, max: 5 }),
          }),
          async ({ method, path, repeats }) => {
            db._reset();
            const integrationId = await seedIntegration();

            // First endpoint for (method, path) is created; repeats yield CONFLICT.
            const endpointId = await endpointService.create(integrationId, {
              method: method as never,
              path,
              inputSchema: "{}",
            } as never);

            for (let i = 1; i < repeats; i++) {
              await expect(
                endpointService.create(integrationId, {
                  method: method as never,
                  path,
                  inputSchema: "{}",
                } as never),
              ).rejects.toMatchObject({ code: "CONFLICT" });
            }
            // Single endpoint record (unique method+path)
            expect(db.endpoint.rows).toHaveLength(1);

            // Repeated upsert for the same (integration, endpoint) produces a single record (idempotent)
            for (let i = 0; i < repeats; i++) {
              await toolService.upsert(integrationId, {
                endpointId,
                toolName: `tool_${i}`,
                enabled: true,
              });
            }
            const selections = db.toolSelection.rows.filter(
              (r) => r.apiIntegrationId === integrationId && r.endpointId === endpointId,
            );
            expect(selections).toHaveLength(1);
          },
        ),
        { numRuns: FC_RUNS },
      );
    },
  );
});
