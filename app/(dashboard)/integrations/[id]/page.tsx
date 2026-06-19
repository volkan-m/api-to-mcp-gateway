import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { integrationService } from "@/lib/server/services/integration-service";
import { credentialService } from "@/lib/server/services/credential-service";
import { specService } from "@/lib/server/services/spec-service";
import { endpointService } from "@/lib/server/services/endpoint-service";
import { toolService } from "@/lib/server/services/tool-service";
import { isAppError } from "@/lib/server/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/integrations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{integration.name}</h1>
              <Badge
                variant={integration.activeEnv === "prod" ? "default" : "secondary"}
              >
                {integration.activeEnv}
              </Badge>
            </div>
            {integration.description && (
              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href={`/integrations/${id}/edit`}>Düzenle</Link>
          </Button>
        </div>

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
