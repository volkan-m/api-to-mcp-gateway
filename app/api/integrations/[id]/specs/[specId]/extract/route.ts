import { NextRequest } from "next/server";
import { specService } from "@/lib/server/services/spec-service";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string; specId: string }> };

// POST /api/integrations/[id]/specs/[specId]/extract -> extract endpoints
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id, specId } = await params;
    const count = await specService.extractEndpoints(id, specId);
    return ok({ success: true, count });
  } catch (error) {
    return handleError(error);
  }
}
