import { NextRequest } from "next/server";
import { integrationService } from "@/lib/server/services/integration-service";
import { createIntegrationSchema } from "@/lib/validation/schemas";
import { handleError, ok } from "@/lib/server/http";

// GET /api/integrations  -> entegrasyon listesi
export async function GET() {
  try {
    return ok(await integrationService.list());
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/integrations -> entegrasyon oluştur
export async function POST(req: NextRequest) {
  try {
    const body = createIntegrationSchema.parse(await req.json());
    const id = await integrationService.create(body);
    return ok({ id }, 201);
  } catch (error) {
    return handleError(error);
  }
}
