import { prisma } from "@/lib/db";
import { AppError } from "@/lib/server/errors";
import { isSafeUrl } from "@/lib/server/ssrf-guard";
import {
  parseSpec,
  buildInputSchema,
  buildOutputSchema,
} from "@/lib/server/spec-parser";

// Eski C# UploadApiSpecHandler / DownloadApiSpecFromUrlHandler /
// ExtractEndpointsFromSpecHandler karşılığı.

export const specService = {
  list(integrationId: string) {
    return prisma.apiSpec.findMany({
      where: { apiIntegrationId: integrationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        format: true,
        title: true,
        version: true,
        createdAt: true,
      },
    });
  },

  async uploadSpec(integrationId: string, content: string): Promise<string> {
    const integration = await prisma.apiIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) throw new AppError("NOT_FOUND", "Entegrasyon bulunamadı");

    const parsed = parseSpec(content);
    const spec = await prisma.apiSpec.create({
      data: {
        apiIntegrationId: integrationId,
        format: parsed.format,
        rawContent: content,
        title: parsed.title ?? null,
        version: parsed.version ?? null,
      },
    });
    return spec.id;
  },

  async downloadSpecFromUrl(
    integrationId: string,
    url: string,
  ): Promise<string> {
    const integration = await prisma.apiIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) throw new AppError("NOT_FOUND", "Entegrasyon bulunamadı");

    if (!(await isSafeUrl(url))) {
      throw new AppError("SSRF_BLOCKED", "Güvenli olmayan veya özel ağ URL'i");
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(
        "SPEC_PARSE_ERROR",
        `Spec indirilemedi (HTTP ${response.status})`,
      );
    }
    const content = await response.text();

    const parsed = parseSpec(content);
    const spec = await prisma.apiSpec.create({
      data: {
        apiIntegrationId: integrationId,
        format: parsed.format,
        rawContent: content,
        title: parsed.title ?? null,
        version: parsed.version ?? null,
      },
    });
    return spec.id;
  },

  // Endpoint çıkarma. Eski C# davranışından farkı: idempotent olması için
  // (apiIntegrationId, method, path) benzersizliği üzerinden upsert kullanır.
  async extractEndpoints(
    integrationId: string,
    specId: string,
  ): Promise<number> {
    const spec = await prisma.apiSpec.findUnique({ where: { id: specId } });
    if (!spec || spec.apiIntegrationId !== integrationId) {
      throw new AppError("NOT_FOUND", "Spec bulunamadı");
    }

    const parsed = parseSpec(spec.rawContent);
    let count = 0;

    for (const operation of parsed.operations) {
      const inputSchema = buildInputSchema(operation);
      const outputSchema = buildOutputSchema(operation);

      await prisma.endpoint.upsert({
        where: {
          apiIntegrationId_method_path: {
            apiIntegrationId: integrationId,
            method: operation.method,
            path: operation.path,
          },
        },
        update: {
          operationId: operation.operationId ?? null,
          summary: operation.summary ?? null,
          description: operation.description ?? null,
          inputSchema,
          outputSchema,
        },
        create: {
          apiIntegrationId: integrationId,
          method: operation.method,
          path: operation.path,
          operationId: operation.operationId ?? null,
          summary: operation.summary ?? null,
          description: operation.description ?? null,
          inputSchema,
          outputSchema,
        },
      });
      count++;
    }

    return count;
  },
};
