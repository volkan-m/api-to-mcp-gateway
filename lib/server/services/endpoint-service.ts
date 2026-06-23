import { prisma } from "@/lib/db";
import { AppError } from "@/lib/server/errors";
import {
  CreateEndpointInput,
  UpdateEndpointInput,
} from "@/lib/validation/schemas";

// Equivalent of old C# Create/Update/Delete ApiEndpointHandler and ListApiEndpoints.

export const endpointService = {
  list(integrationId: string) {
    return prisma.endpoint.findMany({
      where: { apiIntegrationId: integrationId },
      orderBy: [{ path: "asc" }, { method: "asc" }],
    });
  },

  async create(
    integrationId: string,
    input: CreateEndpointInput,
  ): Promise<string> {
    const integration = await prisma.apiIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) throw new AppError("NOT_FOUND", "Entegrasyon bulunamadı");

    const existing = await prisma.endpoint.findUnique({
      where: {
        apiIntegrationId_method_path: {
          apiIntegrationId: integrationId,
          method: input.method,
          path: input.path,
        },
      },
    });
    if (existing) {
      throw new AppError(
        "CONFLICT",
        "Bu method ve path için bir endpoint zaten var",
      );
    }

    const created = await prisma.endpoint.create({
      data: {
        apiIntegrationId: integrationId,
        method: input.method,
        path: input.path,
        externalUrlProd: input.externalUrlProd ?? null,
        externalUrlTest: input.externalUrlTest ?? null,
        summary: input.summary ?? null,
        description: input.description ?? null,
        inputSchema: input.inputSchema,
        outputSchema: input.outputSchema ?? null,
      },
    });
    return created.id;
  },

  async update(
    integrationId: string,
    endpointId: string,
    input: UpdateEndpointInput,
  ): Promise<void> {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    });
    if (!endpoint || endpoint.apiIntegrationId !== integrationId) {
      throw new AppError("NOT_FOUND", "Endpoint bulunamadı");
    }

    await prisma.endpoint.update({
      where: { id: endpointId },
      data: {
        method: input.method,
        path: input.path,
        externalUrlProd: input.externalUrlProd ?? null,
        externalUrlTest: input.externalUrlTest ?? null,
        summary: input.summary ?? null,
        description: input.description ?? null,
        inputSchema: input.inputSchema,
        outputSchema: input.outputSchema ?? null,
      },
    });
  },

  async remove(integrationId: string, endpointId: string): Promise<void> {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId },
    });
    if (!endpoint || endpoint.apiIntegrationId !== integrationId) {
      throw new AppError("NOT_FOUND", "Endpoint bulunamadı");
    }
    await prisma.endpoint.delete({ where: { id: endpointId } });
  },
};
