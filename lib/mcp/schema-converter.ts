// OpenAPI schema -> MCP tool inputSchema dönüştürücü.
// Mevcut MCP sunucusundaki mantık korunmuş, ek olarak hem camelCase (yeni TS extract)
// hem PascalCase (eski C# extract) verisiyle uyumlu olacak şekilde sağlamlaştırılmıştır.

interface OpenAPIParameter {
  name?: string;
  Name?: string;
  in?: "query" | "path" | "header" | "cookie";
  In?: string;
  required?: boolean;
  Required?: boolean;
  schema?: Record<string, unknown>;
  Type?: string;
  description?: string;
  Description?: string;
}

interface OpenAPIInputSchema {
  parameters?: OpenAPIParameter[];
  Parameters?: OpenAPIParameter[];
  requestBody?: Record<string, unknown> | null;
  RequestBody?: Record<string, unknown> | null;
}

export function convertOpenAPIToMCPSchema(openApiSchema: OpenAPIInputSchema): {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
} {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  // Parametreler (camelCase veya PascalCase)
  const params = openApiSchema.parameters ?? openApiSchema.Parameters;
  if (params && Array.isArray(params)) {
    params.forEach((param) => {
      const name = param.name ?? param.Name;
      const location = (param.in ?? param.In)?.toLowerCase();
      if (!name) return;

      if (location === "query" || location === "path") {
        const paramSchema =
          param.schema ??
          (param.Type ? { type: String(param.Type).toLowerCase() } : { type: "string" });

        properties[name] = {
          ...paramSchema,
          description:
            param.description ??
            param.Description ??
            (paramSchema as Record<string, unknown>).description,
        };

        if (param.required || param.Required || location === "path") {
          required.push(name);
        }
      }
    });
  }

  // RequestBody (camelCase veya PascalCase)
  const requestBodyData =
    (openApiSchema.RequestBody as Record<string, unknown> | undefined) ??
    (openApiSchema.requestBody as Record<string, unknown> | undefined);

  if (requestBodyData) {
    const bodySchema = (requestBodyData.RequestBody ??
      requestBodyData.Schema ??
      requestBodyData) as Record<string, unknown>;

    const propertiesToAdd = (bodySchema.Properties ?? bodySchema.properties) as
      | Record<string, Record<string, unknown>>
      | undefined;
    const requiredToAdd = (bodySchema.Required ?? bodySchema.required) as
      | string[]
      | undefined;

    if (propertiesToAdd) {
      Object.entries(propertiesToAdd).forEach(([key, value]) => {
        properties[key] = {
          type: String(value.Type ?? value.type ?? "string").toLowerCase(),
          description: value.Description ?? value.description ?? undefined,
          format: value.Format ?? value.format ?? undefined,
        };
      });

      if (requiredToAdd && Array.isArray(requiredToAdd)) {
        required.push(...requiredToAdd);
      }
    } else if (
      bodySchema.type &&
      typeof bodySchema.type === "string" &&
      bodySchema.type !== "object"
    ) {
      // Primitive request body (örn: integer, string)
      properties["body"] = {
        type: String(bodySchema.type).toLowerCase(),
        description: bodySchema.description ?? "Request body content",
        format: bodySchema.format ?? undefined,
      };
      required.push("body");
    } else {
      // Standart OpenAPI yapısı fallback
      const content = requestBodyData.content as
        | Record<string, { schema?: Record<string, unknown> }>
        | undefined;
      const jsonContent =
        content?.["application/json"] ??
        content?.["text/json"] ??
        content?.["application/json-patch+json"] ??
        content?.["application/*+json"];

      if (jsonContent?.schema) {
        const schema = jsonContent.schema;
        if (schema.type === "object" && schema.properties) {
          Object.assign(properties, schema.properties as Record<string, unknown>);
          if (Array.isArray(schema.required)) {
            required.push(...(schema.required as string[]));
          }
        } else if (schema.type && schema.type !== "object") {
          properties["body"] = {
            type: String(schema.type).toLowerCase(),
            description: schema.description ?? "Request body content",
            format: schema.format ?? undefined,
          };
          required.push("body");
        }
      }
    }
  }

  const uniqueRequired = Array.from(new Set(required));

  return {
    type: "object",
    properties,
    ...(uniqueRequired.length > 0 && { required: uniqueRequired }),
  };
}
