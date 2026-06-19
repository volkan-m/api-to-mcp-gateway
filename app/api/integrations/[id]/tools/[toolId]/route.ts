import { NextRequest } from "next/server";
import { toolService } from "@/lib/server/services/tool-service";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string; toolId: string }> };

// DELETE /api/integrations/[id]/tools/[toolId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, toolId } = await params;
    await toolService.remove(id, toolId);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
