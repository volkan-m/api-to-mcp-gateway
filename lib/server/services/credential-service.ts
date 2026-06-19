import { prisma } from "@/lib/db";
import { encrypt, decrypt, maskSecret } from "@/lib/server/crypto";
import { AppError } from "@/lib/server/errors";
import {
  CreateCredentialInput,
  UpdateCredentialInput,
} from "@/lib/validation/schemas";

// Eski C# CreateApiCredentialHandler / DeleteApiCredentialHandler /
// ListApiCredentialsHandler karşılığı. keyValue her zaman şifreli saklanır,
// listede maskelenir.

export const credentialService = {
  async create(
    integrationId: string,
    input: CreateCredentialInput,
  ): Promise<string> {
    const integration = await prisma.apiIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) throw new AppError("NOT_FOUND", "Entegrasyon bulunamadı");

    const created = await prisma.apiCredential.create({
      data: {
        apiIntegrationId: integrationId,
        credentialType: input.credentialType,
        keyName: input.keyName,
        keyValue: encrypt(input.keyValue),
      },
    });
    return created.id;
  },

  // keyValue çözülür ama yanıtta maskelenir (asla düz tam değer dönmez).
  async list(integrationId: string) {
    const credentials = await prisma.apiCredential.findMany({
      where: { apiIntegrationId: integrationId },
      orderBy: { createdAt: "desc" },
    });

    return credentials.map((c) => {
      let masked = "****";
      try {
        masked = maskSecret(decrypt(c.keyValue));
      } catch {
        masked = "****";
      }
      return {
        id: c.id,
        apiIntegrationId: c.apiIntegrationId,
        credentialType: c.credentialType,
        keyName: c.keyName,
        keyValueMasked: masked,
        createdAt: c.createdAt,
      };
    });
  },

  async remove(credentialId: string): Promise<void> {
    const credential = await prisma.apiCredential.findUnique({
      where: { id: credentialId },
    });
    if (!credential) throw new AppError("NOT_FOUND", "Credential bulunamadı");
    await prisma.apiCredential.delete({ where: { id: credentialId } });
  },

  // keyValue boş bırakılırsa mevcut (şifreli) değer korunur; aksi halde
  // yeni değer şifrelenerek güncellenir.
  async update(
    credentialId: string,
    input: UpdateCredentialInput,
  ): Promise<void> {
    const credential = await prisma.apiCredential.findUnique({
      where: { id: credentialId },
    });
    if (!credential) throw new AppError("NOT_FOUND", "Credential bulunamadı");

    await prisma.apiCredential.update({
      where: { id: credentialId },
      data: {
        credentialType: input.credentialType,
        keyName: input.keyName,
        ...(input.keyValue
          ? { keyValue: encrypt(input.keyValue) }
          : {}),
      },
    });
  },
};
