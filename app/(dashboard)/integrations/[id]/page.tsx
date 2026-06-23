import { notFound } from "next/navigation";
import { integrationService } from "@/lib/server/services/integration-service";
import { credentialService } from "@/lib/server/services/credential-service";
import { specService } from "@/lib/server/services/spec-service";
import { endpointService } from "@/lib/server/services/endpoint-service";
import { toolService } from "@/lib/server/services/tool-service";
import { isAppError } from "@/lib/server/errors";
import { IntegrationDetailHeader } from "@/components/features/integration-detail-header";
import { IntegrationDetailTabs } from "@/components/features/integration-detail-tabs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function IntegrationDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    const integration = await integrationService.get(id);
    const [credentials, specs, endpoints, tools] = await Promise.all([
      credentialService.list(id),
      specService.list(id),
      endpointService.list(id),
      toolService.list(id),
    ]);

    return (
      <div className="space-y-6">
        <IntegrationDetailHeader
          id={id}
          name={integration.name}
          description={integration.description}
          activeEnv={integration.activeEnv}
        />

        <IntegrationDetailTabs
          integrationId={id}
          credentials={credentials}
          specs={specs.map((s) => ({
            id: s.id,
            format: s.format,
            title: s.title,
            version: s.version,
          }))}
          endpoints={endpoints.map((e) => ({
            id: e.id,
            method: e.method,
            path: e.path,
            summary: e.summary,
            description: e.description,
            externalUrlProd: e.externalUrlProd,
            externalUrlTest: e.externalUrlTest,
            inputSchema: e.inputSchema,
            outputSchema: e.outputSchema,
          }))}
          tools={tools.map((t) => ({
            id: t.id,
            toolName: t.toolName,
            toolDescription: t.toolDescription,
            enabled: t.enabled,
            endpointId: t.endpointId,
            endpointLabel: `${t.endpoint.method} ${t.endpoint.path}`,
          }))}
        />
      </div>
    );
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
