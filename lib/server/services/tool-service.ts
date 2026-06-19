import { prisma } from "@/lib/db";
import { AppError } from "@/lib/server/errors";
import { UpsertToolInput } from "@/lib/validation/schemas";

// Eski C# UpsertApiToolSelectionHandler / DeleteApiToolSelectionHandler /
// ListApiToolSelections karşılığı. (apiIntegrationId, endpointId) benzersizdir.

export const toolService = {
  list(integrationId: string) {
    return prisma.toolSelection.findMany({
      where: { apiIntegrationId: integrationId },
      include: { endpoint: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async upsert(integrationId: string, input: UpsertToolInput): Promise<string> {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: input.endpointId },
    });
    if (!endpoint || endpoint.apiIntegrationId !== integrationId) {
      throw new AppError("NOT_FOUND", "Endpoint bulunamadı");
    }

    const selection = await prisma.toolSelection.upsert({
      where: {
        apiIntegrationId_endpointId: {
          apiIntegrationId: integrationId,
          endpointId: input.endpointId,
        },
      },
      update: {
        toolName: input.toolName,
        toolDescription: input.toolDescription ?? null,
        enabled: input.enabled,
      },
      create: {
        apiIntegrationId: integrationId,
        endpointId: input.endpointId,
        toolName: input.toolName,
        toolDescription: input.toolDescription ?? null,
        enabled: input.enabled,
      },
    });
    return selection.id;
  },

  async remove(integrationId: string, toolId: string): Promise<void> {
    const selection = await prisma.toolSelection.findUnique({
      where: { id: toolId },
    });
    if (!selection || selection.apiIntegrationId !== integrationId) {
      throw new AppError("NOT_FOUND", "Tool seçimi bulunamadı");
    }
    await prisma.toolSelection.delete({ where: { id: toolId } });
  },
};
