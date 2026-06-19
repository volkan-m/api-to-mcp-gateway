import { NextRequest } from "next/server";
import { integrationService } from "@/lib/server/services/integration-service";
import { updateIntegrationSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

// GET /api/integrations/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return ok(await integrationService.get(id));
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/integrations/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = updateIntegrationSchema.parse(await req.json());
    await integrationService.update(id, body);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/integrations/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await integrationService.remove(id);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
