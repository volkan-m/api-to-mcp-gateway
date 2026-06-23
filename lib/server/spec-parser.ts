import yaml from "js-yaml";
import { AppError } from "./errors";

// OpenAPI/Swagger spec parse layer. Replaces C# `SpecParserService` (Microsoft.OpenApi).
// Parses JSON or YAML content, performs basic validation.

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
    // JSON or YAML: js-yaml can also parse JSON.
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

// Resolves local ($/, components, definitions...) `$ref` references.
// Because C# `OpenApiStringReader` resolves refs automatically, we must provide
// the same behavior so generated tool schemas are fully populated. Otherwise
// requestBody/parameter schemas remain as `{ "$ref": ... }` and
// schema-converter produces empty `properties`.
function resolveRefs(root: Record<string, unknown>): Record<string, unknown> {
  // JSON Pointer (#/a/b/c) resolution
  function getByPointer(ref: string): unknown {
    if (!ref.startsWith("#/")) return undefined; // local refs only
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
        // Cycle guard: if the same ref is seen again, break.
        if (stack.has(ref)) return {};
        const target = getByPointer(ref);
        if (target === undefined) return obj; // unresolvable/external ref: leave as-is

        const nextStack = new Set(stack);
        nextStack.add(ref);
        const resolved = walk(target, nextStack);

        // Preserve sibling keys other than $ref (rare).
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
  // Resolve all local $refs like C# OpenApiStringReader.
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

    // Path-level common parameters
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

// Generates normalized JSON to be stored as Endpoint.inputSchema for an operation.
// Preserves standard OpenAPI structure (schema-converter understands this directly).
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
