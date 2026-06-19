"use client";

import { useLocale } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggleLocale = () => {
    setLocale(locale === "en" ? "tr" : "en");
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleLocale} className="gap-2">
      <Globe className="h-4 w-4" />
      <span className="font-medium">{locale.toUpperCase()}</span>
    </Button>
  );
}
