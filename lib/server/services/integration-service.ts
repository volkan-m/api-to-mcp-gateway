import { prisma } from "@/lib/db";
import { AppError } from "@/lib/server/errors";
import {
  CreateIntegrationInput,
  UpdateIntegrationInput,
} from "@/lib/validation/schemas";

// Eski C# CreateApiIntegrationHandler / Update / Delete / Query handler'larının
// TypeScript karşılığı. Tek iş mantığı kaynağı.

export const integrationService = {
  list() {
    return prisma.apiIntegration.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async get(id: string) {
    const integration = await prisma.apiIntegration.findUnique({
      where: { id },
    });
    if (!integration) throw new AppError("NOT_FOUND", "Entegrasyon bulunamadı");
    return integration;
  },

  async create(input: CreateIntegrationInput): Promise<string> {
    const existing = await prisma.apiIntegration.findUnique({
      where: { name: input.name },
    });
    if (existing) {
      throw new AppError("CONFLICT", "Bu isimde bir entegrasyon zaten var");
    }

    const created = await prisma.apiIntegration.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        baseUrlProd: input.baseUrlProd,
        baseUrlTest: input.baseUrlTest,
      },
    });
    return created.id;
  },

  async update(id: string, input: UpdateIntegrationInput): Promise<void> {
    await this.get(id);

    const existing = await prisma.apiIntegration.findUnique({
      where: { name: input.name },
    });
    if (existing && existing.id !== id) {
      throw new AppError("CONFLICT", "Bu isimde bir entegrasyon zaten var");
    }

    await prisma.apiIntegration.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description ?? null,
        baseUrlProd: input.baseUrlProd,
        baseUrlTest: input.baseUrlTest,
        activeEnv: input.activeEnv,
      },
    });
  },

  async remove(id: string): Promise<void> {
    await this.get(id);
    await prisma.apiIntegration.delete({ where: { id } });
  },
};
