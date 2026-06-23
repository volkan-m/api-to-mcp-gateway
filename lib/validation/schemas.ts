import { z } from "zod";

const httpUrl = z.string().url("Geçerli bir http(s) URL girin");
const envEnum = z.enum(["prod", "test"]);

// Optional URL that also accepts empty ("") values. Since forms can send empty
// fields as "", we treat them as valid and reduce empty values to null.
const optionalUrl = z
  .union([httpUrl, z.literal("")])
  .optional()
  .nullable();

// Validates that the content is parseable JSON (catches malformed data early,
// since the server will JSON.parse it later).
const jsonString = z
  .string()
  .min(1, "Zorunludur")
  .refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, "Geçerli bir JSON olmalıdır");

const optionalJsonString = z
  .union([jsonString, z.literal("")])
  .optional()
  .nullable();

export const createIntegrationSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  description: z.string().optional().nullable(),
  baseUrlProd: httpUrl,
  baseUrlTest: httpUrl,
});

export const updateIntegrationSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  description: z.string().optional().nullable(),
  baseUrlProd: httpUrl,
  baseUrlTest: httpUrl,
  activeEnv: envEnum,
});

export const createCredentialSchema = z.object({
  credentialType: z.enum(["header", "query", "bearer"]),
  keyName: z.string().min(1, "Anahtar adı zorunludur"),
  keyValue: z.string().min(1, "Anahtar değeri zorunludur"),
});

// On update, keyValue is optional: if left empty, the existing (encrypted) value is preserved.
export const updateCredentialSchema = z.object({
  credentialType: z.enum(["header", "query", "bearer"]),
  keyName: z.string().min(1, "Anahtar adı zorunludur"),
  keyValue: z.string().optional().nullable(),
});

export const uploadSpecSchema = z.object({
  content: z.string().min(1, "Spec içeriği zorunludur"),
});

export const downloadSpecSchema = z.object({
  url: httpUrl,
});

const methodEnum = z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]);

export const createEndpointSchema = z.object({
  method: methodEnum,
  path: z.string().min(1, "Path zorunludur"),
  externalUrlProd: optionalUrl,
  externalUrlTest: optionalUrl,
  summary: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  inputSchema: jsonString,
  outputSchema: optionalJsonString,
});

export const updateEndpointSchema = createEndpointSchema;

export const upsertToolSchema = z.object({
  endpointId: z.string().min(1, "endpointId zorunludur"),
  toolName: z.string().min(1, "Tool adı zorunludur"),
  toolDescription: z.string().optional().nullable(),
  enabled: z.boolean().default(true),
});

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;
export type UploadSpecInput = z.infer<typeof uploadSpecSchema>;
export type DownloadSpecInput = z.infer<typeof downloadSpecSchema>;
export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;
export type UpsertToolInput = z.infer<typeof upsertToolSchema>;
