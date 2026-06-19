import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { convertOpenAPIToMCPSchema } from "@/lib/mcp/schema-converter";
import { propertyLabel } from "../helpers/property-label";
import { FC_RUNS } from "../helpers/fast-check-config";

describe("schema-converter — birim testleri", () => {
  // Task 7.1 — Requirements 11.2: yalnızca query/path parametreleri eklenir
  it("yalnızca in:query|path parametreleri properties'e eklenir", () => {
    const result = convertOpenAPIToMCPSchema({
      parameters: [
        { name: "q", in: "query", schema: { type: "string" } },
        { name: "id", in: "path", schema: { type: "string" } },
        { name: "X-Trace", in: "header", schema: { type: "string" } },
        { name: "sid", in: "cookie", schema: { type: "string" } },
      ],
    });

    expect(Object.keys(result.properties).sort()).toEqual(["id", "q"]);
    expect(result.type).toBe("object");
  });

  // Task 7.1 — Requirements 11.3: path parametreleri required'a eklenir
  it("path parametreleri required dizisine eklenir", () => {
    const result = convertOpenAPIToMCPSchema({
      parameters: [
        { name: "id", in: "path", schema: { type: "string" } },
        { name: "q", in: "query", required: false, schema: { type: "string" } },
      ],
    });
    expect(result.required).toContain("id");
    expect(result.required).not.toContain("q");
  });

  // Task 7.1 — Requirements 11.4: required tekilleştirilir
  it("required dizisinde yinelenen değer bulunmaz", () => {
    const result = convertOpenAPIToMCPSchema({
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { id: { type: "string" } },
              required: ["id", "id"],
            },
          },
        },
      },
    });
    const idCount = (result.required ?? []).filter((r) => r === "id").length;
    expect(idCount).toBe(1);
  });

  it("primitive request body 'body' alanı olarak eklenir", () => {
    const result = convertOpenAPIToMCPSchema({
      requestBody: {
        content: { "application/json": { schema: { type: "integer" } } },
      },
    });
    expect(result.properties).toHaveProperty("body");
    expect(result.required).toContain("body");
  });

  it("PascalCase (eski C# extract) parametreleriyle uyumludur", () => {
    const result = convertOpenAPIToMCPSchema({
      Parameters: [{ Name: "userId", In: "path", Type: "String", Required: true }],
    });
    expect(result.properties).toHaveProperty("userId");
    expect(result.required).toContain("userId");
  });
});

describe("schema-converter — property-based testleri", () => {
  // Task 7.2 — Property 12: Schema dönüşümü değişmezi — Validates: Requirements 11.1, 11.3
  it(
    propertyLabel(
      12,
      "∀ OpenAPI girişi, çıktı type:'object'tir ve her path parametresi required içindedir",
    ),
    () => {
      const paramArb = fc.record({
        name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        in: fc.constantFrom("query", "path", "header", "cookie"),
        required: fc.boolean(),
      });

      fc.assert(
        fc.property(fc.array(paramArb, { maxLength: 10 }), (params) => {
          // Benzersiz isimler (aynı isimli farklı 'in' tesadüfünü önle)
          const seen = new Set<string>();
          const uniqueParams = params.filter((p) => {
            if (seen.has(p.name)) return false;
            seen.add(p.name);
            return true;
          });

          const result = convertOpenAPIToMCPSchema({
            parameters: uniqueParams.map((p) => ({
              name: p.name,
              in: p.in as "query" | "path" | "header" | "cookie",
              required: p.required,
              schema: { type: "string" },
            })),
          });

          // Çıktı her zaman type:'object'
          expect(result.type).toBe("object");

          // Her path parametresi required içinde olmalı
          const pathParams = uniqueParams.filter((p) => p.in === "path");
          for (const p of pathParams) {
            expect(result.required ?? []).toContain(p.name);
          }

          // required tekilleştirilmiş
          const req = result.required ?? [];
          expect(new Set(req).size).toBe(req.length);
        }),
        { numRuns: FC_RUNS },
      );
    },
  );
});
