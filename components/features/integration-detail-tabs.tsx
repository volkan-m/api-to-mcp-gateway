"use client";

import { useTranslation } from "@/hooks/use-translation";
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
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="specs" className="w-full">
      <TabsList>
        <TabsTrigger value="specs">{t("detail.specs")} ({specs.length})</TabsTrigger>
        <TabsTrigger value="endpoints">
          {t("detail.endpoints")} ({endpoints.length})
        </TabsTrigger>
        <TabsTrigger value="tools">{t("detail.tools")} ({tools.length})</TabsTrigger>
        <TabsTrigger value="credentials">
          {t("detail.credentials")} ({credentials.length})
        </TabsTrigger>
        <TabsTrigger value="mcp">{t("detail.mcpConfig")}</TabsTrigger>
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
