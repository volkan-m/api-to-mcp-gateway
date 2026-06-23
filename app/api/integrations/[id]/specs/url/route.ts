import { NextRequest } from "next/server";
import { specService } from "@/lib/server/services/spec-service";
import { downloadSpecSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

// POST /api/integrations/[id]/specs/url -> download spec from URL (SSRF protected)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = downloadSpecSchema.parse(await req.json());
    const specId = await specService.downloadSpecFromUrl(id, body.url);
    return ok({ id: specId }, 201);
  } catch (error) {
    return handleError(error);
  }
}
