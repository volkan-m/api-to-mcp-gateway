import { prisma } from "@/lib/db";
import { encrypt, decrypt, maskSecret } from "@/lib/server/crypto";
import { AppError } from "@/lib/server/errors";
import {
  CreateCredentialInput,
  UpdateCredentialInput,
} from "@/lib/validation/schemas";

// Equivalent of old C# CreateApiCredentialHandler / DeleteApiCredentialHandler /
// ListApiCredentialsHandler. keyValue is always stored encrypted,
// masked in listings.

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

  // keyValue is decrypted but masked in the response (never returns full plaintext).
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

  // If keyValue is left empty, the existing (encrypted) value is preserved; otherwise
  // the new value is encrypted and updated.
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
