"use client";

import Link from "next/link";
import { Boxes } from "lucide-react";
import { LogoutButton } from "@/components/features/logout-button";
import { LanguageSwitcher } from "@/components/features/language-switcher";
import { useTranslation } from "@/hooks/use-translation";

export function DashboardHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-14 items-center gap-4">
        <Link
          href="/integrations"
          className="flex items-center gap-2 font-semibold"
        >
          <Boxes className="h-5 w-5" />
          <span>MCP Gateway</span>
        </Link>
        <nav className="ml-6 flex items-center gap-4 text-sm">
          <Link
            href="/integrations"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("nav.integrations")}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
