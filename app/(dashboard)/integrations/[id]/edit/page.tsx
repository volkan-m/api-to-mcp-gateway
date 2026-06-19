import { notFound } from "next/navigation";
import { integrationService } from "@/lib/server/services/integration-service";
import { isAppError } from "@/lib/server/errors";
import { IntegrationForm } from "@/components/features/integration-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditIntegrationPage({ params }: Props) {
  const { id } = await params;

  try {
    const integration = await integrationService.get(id);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Entegrasyonu Düzenle</h1>
          <p className="text-sm text-muted-foreground">{integration.name}</p>
        </div>
        <IntegrationForm
          integrationId={id}
          defaultValues={{
            name: integration.name,
            description: integration.description ?? "",
            baseUrlProd: integration.baseUrlProd,
            baseUrlTest: integration.baseUrlTest,
            activeEnv: integration.activeEnv as "prod" | "test",
          }}
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
