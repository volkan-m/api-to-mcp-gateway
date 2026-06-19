import { z } from "zod";

const httpUrl = z.string().url("Geçerli bir http(s) URL girin");
const envEnum = z.enum(["prod", "test"]);

// Boş ("") değere de izin veren opsiyonel URL. Formlar boş alanı "" olarak
// gönderebildiğinden bunu geçerli sayıp boş değerleri null'a indirger.
const optionalUrl = z
  .union([httpUrl, z.literal("")])
  .optional()
  .nullable();

// İçeriğin parse edilebilir bir JSON olduğunu doğrular (sunucu sonradan
// JSON.parse ettiğinden bozuk veri girişini erken yakalar).
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

// Güncellemede keyValue opsiyoneldir: boş bırakılırsa mevcut (şifreli) değer korunur.
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
