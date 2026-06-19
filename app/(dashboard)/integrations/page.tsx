import Link from "next/link";
import { Plus } from "lucide-react";
import { integrationService } from "@/lib/server/services/integration-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationTable } from "@/components/features/integration-table";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const integrations = await integrationService.list();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Entegrasyonlar</h1>
          <p className="text-sm text-muted-foreground">
            API entegrasyonlarınızı yönetin ve MCP tool'larına dönüştürün.
          </p>
        </div>
        <Button asChild>
          <Link href="/integrations/new">
            <Plus className="h-4 w-4" />
            Yeni Entegrasyon
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tüm Entegrasyonlar ({integrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
