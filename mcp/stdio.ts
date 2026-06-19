#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MCPServer } from "../lib/mcp/server";

// stdio MCP transport (Claude Desktop / Cursor). Tek bir INTEGRATION_ID için çalışır.
// Çalıştırma: INTEGRATION_ID=<id> tsx mcp/stdio.ts

const INTEGRATION_ID = process.env.INTEGRATION_ID;
if (!INTEGRATION_ID) {
  console.error("INTEGRATION_ID environment variable is required");
  process.exit(1);
}

const mcp = new MCPServer();

const server = new Server(
  { name: `mcp-gateway-${INTEGRATION_ID}`, version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: mcp.listTools(INTEGRATION_ID) };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await mcp.callTool(
    {
      name: request.params.name,
      arguments: (request.params.arguments ?? {}) as Record<string, unknown>,
    },
    INTEGRATION_ID!,
  );
  // SDK sonuç tipi birliğiyle uyum için cast (MCPToolResponse content döner).
  return result as unknown as Record<string, unknown>;
});

async function main() {
  await mcp.loadTools(INTEGRATION_ID!);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[INFO] MCP Gateway stdio sunucusu çalışıyor");
}

main().catch((error) => {
  console.error("[ERROR] Fatal error:", error);
  process.exit(1);
});
