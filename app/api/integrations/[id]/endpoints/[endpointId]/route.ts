import { NextRequest } from "next/server";
import { endpointService } from "@/lib/server/services/endpoint-service";
import { updateEndpointSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string; endpointId: string }> };

// PUT /api/integrations/[id]/endpoints/[endpointId]
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, endpointId } = await params;
    const body = updateEndpointSchema.parse(await req.json());
    await endpointService.update(id, endpointId, body);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/integrations/[id]/endpoints/[endpointId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, endpointId } = await params;
    await endpointService.remove(id, endpointId);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
