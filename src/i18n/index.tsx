import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { LanguageCode, LanguageInfo, Translations } from "./types.ts";
import { viTranslations } from "./locales/vi.ts";
import { enTranslations } from "./locales/en.ts";
import { jaTranslations } from "./locales/ja.ts";
import { esTranslations } from "./locales/es.ts";
import { frTranslations } from "./locales/fr.ts";
import { zhTranslations } from "./locales/zh.ts";
import { deTranslations } from "./locales/de.ts";
import { koTranslations } from "./locales/ko.ts";

export * from "./types.ts";

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
];

export const TRANSLATION_MAP: Record<LanguageCode, Translations> = {
  vi: viTranslations,
  en: enTranslations,
  ja: jaTranslations,
  es: esTranslations,
  fr: frTranslations,
  zh: zhTranslations,
  de: deTranslations,
  ko: koTranslations,
};

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<Translations>;

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageInfo: LanguageInfo;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageInfo[];
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "studylens_language_preference";

export const I18nProvider: React.FC<{
  children: ReactNode;
  initialLanguage?: LanguageCode;
}> = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (initialLanguage && TRANSLATION_MAP[initialLanguage]) {
      return initialLanguage;
    }
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && TRANSLATION_MAP[saved]) {
      return saved;
    }
    // Auto-detect browser language
    try {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("vi")) return "vi";
      if (browserLang.startsWith("ja")) return "ja";
      if (browserLang.startsWith("es")) return "es";
      if (browserLang.startsWith("fr")) return "fr";
      if (browserLang.startsWith("zh")) return "zh";
      if (browserLang.startsWith("de")) return "de";
      if (browserLang.startsWith("ko")) return "ko";
    } catch {
      // fallback
    }
    return "vi"; // Default to Vietnamese for the user's primary request
  });

  const setLanguage = (newLang: LanguageCode) => {
    if (TRANSLATION_MAP[newLang]) {
      setLanguageState(newLang);
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  };

  const currentLanguageInfo = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const t = (
    key: string,
    params?: Record<string, string | number>
  ): string => {
    const keys = key.split(".");
    let current: any = TRANSLATION_MAP[language] || TRANSLATION_MAP.en;
    let fallback: any = TRANSLATION_MAP.en;

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        current = undefined;
      }
      if (fallback && typeof fallback === "object" && k in fallback) {
        fallback = fallback[k];
      } else {
        fallback = undefined;
      }
    }

    let text = typeof current === "string" ? current : typeof fallback === "string" ? fallback : key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
      });
    }

    return text;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageInfo,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider
    const fallbackT = (key: string, params?: Record<string, string | number>) => {
      const keys = key.split(".");
      let val: any = viTranslations;
      for (const k of keys) {
        if (val && typeof val === "object" && k in val) {
          val = val[k];
        } else {
          val = undefined;
        }
      }
      let text = typeof val === "string" ? val : key;
      if (params) {
        Object.entries(params).forEach(([pk, pv]) => {
          text = text.replace(new RegExp(`\\{${pk}\\}`, "g"), String(pv));
        });
      }
      return text;
    };

    return {
      language: "vi",
      setLanguage: () => {},
      currentLanguageInfo: SUPPORTED_LANGUAGES[0],
      t: fallbackT,
      languages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
};
