import { IntegrationForm } from "@/components/features/integration-form";

export default function NewIntegrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Yeni Entegrasyon</h1>
        <p className="text-sm text-muted-foreground">
          Yeni bir API entegrasyonu tanımlayın.
        </p>
      </div>
      <IntegrationForm />
    </div>
  );
}
