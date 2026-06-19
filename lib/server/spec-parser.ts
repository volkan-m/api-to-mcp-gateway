import yaml from "js-yaml";
import { AppError } from "./errors";

// OpenAPI/Swagger spec parse katmanı. C# `SpecParserService`'in (Microsoft.OpenApi)
// yerini alır. JSON veya YAML içeriğini parse eder, temel doğrulamayı yapar.

export interface ParsedOperation {
  method: string; // GET, POST, ...
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
}

export interface ParsedSpec {
  format: "openapi3" | "swagger2";
  title?: string;
  version?: string;
  operations: ParsedOperation[];
}

const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "head", "options"];

function parseRaw(content: string): Record<string, unknown> {
  const trimmed = (content ?? "").trim();
  if (!trimmed) {
    throw new AppError("SPEC_PARSE_ERROR", "Spec içeriği boş");
  }

  try {
    // JSON veya YAML: js-yaml JSON'u da parse edebilir.
    const doc = yaml.load(trimmed);
    if (!doc || typeof doc !== "object") {
      throw new Error("Geçersiz doküman kökü");
    }
    return doc as Record<string, unknown>;
  } catch (error) {
    throw new AppError(
      "SPEC_PARSE_ERROR",
      "OpenAPI/Swagger dökümanı parse edilemedi",
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Yerel ($/components, $/definitions ...) `$ref` referanslarını çözer.
// C# `OpenApiStringReader` ref'leri otomatik çözdüğü için, üretilen tool
// şemalarının dolu olması adına aynı davranışı sağlamak zorundayız. Aksi halde
// requestBody/parameter şemaları `{ "$ref": ... }` olarak kalır ve
// schema-converter boş `properties` üretir.
function resolveRefs(root: Record<string, unknown>): Record<string, unknown> {
  // JSON Pointer (#/a/b/c) çözümü
  function getByPointer(ref: string): unknown {
    if (!ref.startsWith("#/")) return undefined; // yalnızca yerel ref
    const parts = ref
      .slice(2)
      .split("/")
      .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
    let current: unknown = root;
    for (const part of parts) {
      if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  function walk(node: unknown, stack: Set<string>): unknown {
    if (Array.isArray(node)) {
      return node.map((item) => walk(item, stack));
    }
    if (node && typeof node === "object") {
      const obj = node as Record<string, unknown>;
      const ref = obj["$ref"];

      if (typeof ref === "string") {
        // Döngü koruması: aynı ref tekrar görülürse kır.
        if (stack.has(ref)) return {};
        const target = getByPointer(ref);
        if (target === undefined) return obj; // çözülemeyen/dış ref: olduğu gibi bırak

        const nextStack = new Set(stack);
        nextStack.add(ref);
        const resolved = walk(target, nextStack);

        // $ref dışındaki kardeş anahtarları (nadir) koru.
        const siblings: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
          if (k !== "$ref") siblings[k] = walk(v, stack);
        }
        if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
          return { ...(resolved as Record<string, unknown>), ...siblings };
        }
        return resolved;
      }

      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        out[k] = walk(v, stack);
      }
      return out;
    }
    return node;
  }

  return walk(root, new Set<string>()) as Record<string, unknown>;
}

export function parseSpec(content: string): ParsedSpec {
  const rawDoc = parseRaw(content);
  // C# OpenApiStringReader gibi tüm yerel $ref'leri çöz.
  const doc = resolveRefs(rawDoc);

  const isOpenApi3 = typeof doc.openapi === "string";
  const isSwagger2 = typeof doc.swagger === "string";

  if (!isOpenApi3 && !isSwagger2) {
    throw new AppError(
      "SPEC_PARSE_ERROR",
      "Doküman bir OpenAPI 3 (openapi) veya Swagger 2 (swagger) spec'i değil",
    );
  }

  const info = (doc.info as Record<string, unknown> | undefined) ?? {};
  const paths = (doc.paths as Record<string, unknown> | undefined) ?? {};

  const operations: ParsedOperation[] = [];

  for (const [pathKey, pathItemRaw] of Object.entries(paths)) {
    if (!pathItemRaw || typeof pathItemRaw !== "object") continue;
    const pathItem = pathItemRaw as Record<string, unknown>;

    // Path seviyesi ortak parametreler
    const pathLevelParams = Array.isArray(pathItem.parameters)
      ? (pathItem.parameters as unknown[])
      : [];

    for (const method of HTTP_METHODS) {
      const operationRaw = pathItem[method];
      if (!operationRaw || typeof operationRaw !== "object") continue;
      const operation = operationRaw as Record<string, unknown>;

      const opParams = Array.isArray(operation.parameters)
        ? (operation.parameters as unknown[])
        : [];

      operations.push({
        method: method.toUpperCase(),
        path: pathKey,
        operationId: operation.operationId as string | undefined,
        summary: operation.summary as string | undefined,
        description: operation.description as string | undefined,
        parameters: [...pathLevelParams, ...opParams],
        requestBody: operation.requestBody,
        responses: operation.responses as Record<string, unknown> | undefined,
      });
    }
  }

  return {
    format: isOpenApi3 ? "openapi3" : "swagger2",
    title: info.title as string | undefined,
    version: info.version as string | undefined,
    operations,
  };
}

// Bir operasyon için Endpoint.inputSchema olarak saklanacak normalize JSON üretir.
// Standart OpenAPI yapısını korur (schema-converter bu yapıyı doğrudan anlar).
export function buildInputSchema(operation: ParsedOperation): string {
  return JSON.stringify({
    parameters: operation.parameters ?? [],
    requestBody: operation.requestBody ?? null,
  });
}

export function buildOutputSchema(operation: ParsedOperation): string | null {
  if (!operation.responses) return null;
  return JSON.stringify(operation.responses);
}
