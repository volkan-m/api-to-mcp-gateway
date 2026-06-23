import { NextRequest } from "next/server";
import { specService } from "@/lib/server/services/spec-service";
import { uploadSpecSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

// POST /api/integrations/[id]/specs/upload -> upload spec with content
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = uploadSpecSchema.parse(await req.json());
    const specId = await specService.uploadSpec(id, body.content);
    return ok({ id: specId }, 201);
  } catch (error) {
    return handleError(error);
  }
}
