import { NextRequest } from "next/server";
import { specService } from "@/lib/server/services/spec-service";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

// GET /api/integrations/[id]/specs -> spec listesi
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    return ok(await specService.list(id));
  } catch (error) {
    return handleError(error);
  }
}
