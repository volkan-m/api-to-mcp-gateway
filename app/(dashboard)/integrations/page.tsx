import { integrationService } from "@/lib/server/services/integration-service";
import { IntegrationTable } from "@/components/features/integration-table";
import { IntegrationsPageHeader } from "@/components/features/integrations-page-header";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const integrations = await integrationService.list();

  return (
    <div className="space-y-6">
      <IntegrationsPageHeader />

      <div className="rounded-lg border">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">
            All Integrations ({integrations.length})
          </h2>
        </div>
        <div className="p-6">
          <IntegrationTable
            data={integrations.map((i) => ({
              id: i.id,
              name: i.name,
              description: i.description,
              baseUrlProd: i.baseUrlProd,
              baseUrlTest: i.baseUrlTest,
              activeEnv: i.activeEnv,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
