import { NextRequest } from "next/server";
import { toolService } from "@/lib/server/services/tool-service";
import { upsertToolSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

// GET /api/integrations/[id]/tools
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return ok(await toolService.list(id));
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/integrations/[id]/tools -> tool seçimi upsert
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = upsertToolSchema.parse(await req.json());
    const toolId = await toolService.upsert(id, body);
    return ok({ id: toolId }, 201);
  } catch (error) {
    return handleError(error);
  }
}
