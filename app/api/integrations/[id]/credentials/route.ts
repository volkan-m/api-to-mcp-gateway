import { NextRequest } from "next/server";
import { credentialService } from "@/lib/server/services/credential-service";
import { createCredentialSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

// GET /api/integrations/[id]/credentials
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return ok(await credentialService.list(id));
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/integrations/[id]/credentials
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = createCredentialSchema.parse(await req.json());
    const credId = await credentialService.create(id, body);
    return ok({ id: credId }, 201);
  } catch (error) {
    return handleError(error);
  }
}
