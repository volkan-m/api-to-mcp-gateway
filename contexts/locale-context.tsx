"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale, defaultLocale, locales } from "@/lib/i18n";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function detectBrowserLocale(): Locale {
  // Önce localStorage'dan kontrol et
  const savedLocale = localStorage.getItem("locale") as Locale | null;
  if (savedLocale && locales.includes(savedLocale)) {
    return savedLocale;
  }

  // Tarayıcı dilini algıla
  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language?.toLowerCase() || "";

    // Tam eşleşme kontrolü (örn: tr-TR -> tr)
    if (browserLang.startsWith("tr")) {
      return "tr";
    }

    // Varsa parent dil eşleştir (örn: en-US -> en)
    const parentLang = browserLang.split("-")[0]?.toLowerCase();
    if (parentLang && locales.includes(parentLang as Locale)) {
      return parentLang as Locale;
    }
  }

  return defaultLocale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const detectedLocale = detectBrowserLocale();
    setLocaleState(detectedLocale);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
