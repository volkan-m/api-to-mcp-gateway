"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CredentialsPanel, type CredentialRow } from "./credentials-panel";
import { SpecsPanel, type SpecRow } from "./specs-panel";
import { EndpointsPanel, type EndpointRow } from "./endpoints-panel";
import { ToolsPanel, type ToolRow } from "./tools-panel";
import { McpConfigPanel } from "./mcp-config-panel";

interface Props {
  integrationId: string;
  credentials: CredentialRow[];
  specs: SpecRow[];
  endpoints: EndpointRow[];
  tools: ToolRow[];
}

export function IntegrationDetailTabs({
  integrationId,
  credentials,
  specs,
  endpoints,
  tools,
}: Props) {
  return (
    <Tabs defaultValue="specs" className="w-full">
      <TabsList>
        <TabsTrigger value="specs">Spec'ler ({specs.length})</TabsTrigger>
        <TabsTrigger value="endpoints">
          Endpoint'ler ({endpoints.length})
        </TabsTrigger>
        <TabsTrigger value="tools">Tool'lar ({tools.length})</TabsTrigger>
        <TabsTrigger value="credentials">
          Credential'lar ({credentials.length})
        </TabsTrigger>
        <TabsTrigger value="mcp">MCP Bağlantısı</TabsTrigger>
      </TabsList>

      <TabsContent value="specs">
        <SpecsPanel integrationId={integrationId} specs={specs} />
      </TabsContent>
      <TabsContent value="endpoints">
        <EndpointsPanel integrationId={integrationId} endpoints={endpoints} />
      </TabsContent>
      <TabsContent value="tools">
        <ToolsPanel
          integrationId={integrationId}
          tools={tools}
          endpoints={endpoints}
        />
      </TabsContent>
      <TabsContent value="credentials">
        <CredentialsPanel
          integrationId={integrationId}
          credentials={credentials}
        />
      </TabsContent>
      <TabsContent value="mcp">
        <McpConfigPanel integrationId={integrationId} />
      </TabsContent>
    </Tabs>
  );
}
