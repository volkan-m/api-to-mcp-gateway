import { NextRequest } from "next/server";
import { endpointService } from "@/lib/server/services/endpoint-service";
import { createEndpointSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

// GET /api/integrations/[id]/endpoints
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return ok(await endpointService.list(id));
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/integrations/[id]/endpoints
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = createEndpointSchema.parse(await req.json());
    const endpointId = await endpointService.create(id, body);
    return ok({ id: endpointId }, 201);
  } catch (error) {
    return handleError(error);
  }
}
