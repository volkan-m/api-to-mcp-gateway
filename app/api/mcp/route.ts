import { NextRequest, NextResponse } from "next/server";
import { mcpServer } from "@/lib/mcp/server";
import { MCPToolCall } from "@/lib/mcp/types";

export const dynamic = "force-dynamic";

// Birleşik MCP HTTP transport. Eski Express `http.ts` /mcp dispatcher'ının karşılığı.
// X-Integration-Id header zorunludur. Desteklenen method'lar: listTools, callTool.

// Entegrasyon-bazlı tool önbelleği. Her entegrasyon için son yükleme zamanı
// tutulur; TTL dolduğunda DB'den yeniden yüklenir. Bu sayede:
//  - Farklı entegrasyonlar eşzamanlı çalışabilir (tek bir id'ye bağlı değil).
//  - Tool/endpoint düzenlemeleri en geç TTL sonunda yansır (bayat tool sorunu).
const TOOL_CACHE_TTL_MS = Number(process.env.MCP_TOOL_CACHE_TTL_MS ?? 5000);
const lastLoadedAt = new Map<string, number>();

async function ensureTools(integrationId: string) {
  const now = Date.now();
  const last = lastLoadedAt.get(integrationId) ?? 0;
  if (now - last > TOOL_CACHE_TTL_MS) {
    await mcpServer.loadTools(integrationId);
    lastLoadedAt.set(integrationId, now);
  }
}

function collectHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

export async function POST(req: NextRequest) {
  const integrationId = req.headers.get("x-integration-id");
  if (!integrationId) {
    return NextResponse.json(
      { error: "X-Integration-Id header is required." },
      { status: 400 },
    );
  }

  let body: { method?: string; params?: { name: string; arguments?: Record<string, unknown> } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    await ensureTools(integrationId);

    if (body.method === "listTools") {
      return NextResponse.json({ tools: mcpServer.listTools(integrationId) });
    }

    if (body.method === "callTool" && body.params) {
      const call: MCPToolCall = {
        name: body.params.name,
        arguments: body.params.arguments ?? {},
      };
      const result = await mcpServer.callTool(
        call,
        integrationId,
        collectHeaders(req),
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid MCP request format." },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

// GET -> tool listesi (kolay test için)
export async function GET(req: NextRequest) {
  const integrationId = req.headers.get("x-integration-id");
  if (!integrationId) {
    return NextResponse.json(
      { error: "X-Integration-Id header is required." },
      { status: 400 },
    );
  }
  try {
    await ensureTools(integrationId);
    return NextResponse.json({ tools: mcpServer.listTools(integrationId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
