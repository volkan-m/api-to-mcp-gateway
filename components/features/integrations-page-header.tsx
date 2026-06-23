"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

export function IntegrationsPageHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{t("integrations.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("integrations.subtitle")}</p>
      </div>
      <Button asChild>
        <Link href="/integrations/new">
          <Plus className="h-4 w-4" />
          {t("integrations.newIntegration")}
        </Link>
      </Button>
    </div>
  );
}
