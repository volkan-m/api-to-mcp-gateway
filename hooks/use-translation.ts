"use client";

import { useLocale } from "@/contexts/locale-context";
import { t as translate, getTranslations } from "@/lib/i18n";

export function useTranslation() {
  const { locale } = useLocale();
  const translations = getTranslations(locale);

  const t = (key: string, params?: Record<string, string>) => {
    return translate(locale, key, params);
  };

  return { t, locale, translations };
}
