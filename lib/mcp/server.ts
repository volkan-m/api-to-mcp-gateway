import { prisma } from "@/lib/db";
import { MCPTool, MCPToolCall, MCPToolResponse } from "./types";
import { proxyApiCall } from "./api-proxy";
import { convertOpenAPIToMCPSchema } from "./schema-converter";

// MCP çekirdek sunucusu. Entegrasyon bazında tool map'i tutar.
// Hem HTTP transport (app/api/mcp) hem stdio (mcp/stdio.ts) bu sınıfı kullanır.

export class MCPServer {
  private integrationTools: Map<string, Map<string, MCPTool>> = new Map();

  async loadTools(integrationId: string): Promise<void> {
    const selections = await prisma.toolSelection.findMany({
      where: { apiIntegrationId: integrationId, enabled: true },
      include: { endpoint: true, apiIntegration: true },
    });

    const tools = new Map<string, MCPTool>();

    for (const selection of selections) {
      try {
        const inputSchemaStr = selection.endpoint.inputSchema;
        if (!inputSchemaStr || inputSchemaStr.trim().length === 0) {
          console.warn(`Tool ${selection.toolName}: inputSchema boş, atlanıyor`);
          continue;
        }

        let openApiSchema: unknown;
        try {
          openApiSchema = JSON.parse(inputSchemaStr);
        } catch {
          console.error(
            `Tool ${selection.toolName}: inputSchema geçersiz JSON, atlanıyor`,
          );
          continue;
        }

        const mcpSchema = convertOpenAPIToMCPSchema(
          openApiSchema as Record<string, never>,
        );

        tools.set(selection.toolName, {
          name: selection.toolName,
          description:
            selection.toolDescription || selection.endpoint.summary || "",
          inputSchema: mcpSchema,
        });
      } catch (error) {
        console.error(
          `Tool ${selection.toolName} için şema dönüştürme hatası:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    this.integrationTools.set(integrationId, tools);
  }

  listTools(integrationId?: string): MCPTool[] {
    if (integrationId) {
      const tools = this.integrationTools.get(integrationId);
      return tools ? Array.from(tools.values()) : [];
    }
    return [];
  }

  getTool(name: string, integrationId?: string): MCPTool | undefined {
    if (integrationId) {
      return this.integrationTools.get(integrationId)?.get(name);
    }
    for (const tools of this.integrationTools.values()) {
      const tool = tools.get(name);
      if (tool) return tool;
    }
    return undefined;
  }

  async callTool(
    call: MCPToolCall,
    integrationId: string,
    customHeaders?: Record<string, string>,
  ): Promise<MCPToolResponse> {
    const tool = this.getTool(call.name, integrationId);
    if (!tool) {
      throw new Error(`Tool not found: ${call.name}`);
    }

    const selection = await prisma.toolSelection.findFirst({
      where: { toolName: call.name, apiIntegrationId: integrationId },
    });

    if (!selection) {
      throw new Error(`Tool selection not found: ${call.name}`);
    }

    try {
      const result = await proxyApiCall(
        integrationId,
        selection.endpointId,
        call.arguments,
        customHeaders,
      );

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}

// HTTP transport için singleton (serverless'ta süreç başına yeniden kullanılır).
const globalForMcp = globalThis as unknown as { mcpServer?: MCPServer };
export const mcpServer = globalForMcp.mcpServer ?? new MCPServer();
if (process.env.NODE_ENV !== "production") {
  globalForMcp.mcpServer = mcpServer;
}
