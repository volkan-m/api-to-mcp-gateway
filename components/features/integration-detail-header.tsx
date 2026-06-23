"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface Props {
  id: string;
  name: string;
  description?: string | null;
  activeEnv: string;
}

export function IntegrationDetailHeader({
  id,
  name,
  description,
  activeEnv,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="icon">
        <Link href="/integrations">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{name}</h1>
          <Badge
            variant={activeEnv === "prod" ? "default" : "secondary"}
          >
            {activeEnv}
          </Badge>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Button asChild variant="outline">
        <Link href={`/integrations/${id}/edit`}>{t("detail.edit")}</Link>
      </Button>
    </div>
  );
}
