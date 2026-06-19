import { NextRequest } from "next/server";
import { credentialService } from "@/lib/server/services/credential-service";
import { updateCredentialSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string; credentialId: string }> };

// PUT /api/integrations/[id]/credentials/[credentialId]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { credentialId } = await params;
    const body = updateCredentialSchema.parse(await req.json());
    await credentialService.update(credentialId, body);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/integrations/[id]/credentials/[credentialId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { credentialId } = await params;
    await credentialService.remove(credentialId);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
