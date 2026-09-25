export const supportedLocales = ["en", "es", "pt-BR", "pt-PT", "fr", "de", "it"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en";
export const USER_LOCALE_STORAGE_KEY = "soccer-coach-user-locale";

export const localeNames: Record<SupportedLocale, string> = {
  en: "English", es: "Español", "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)", fr: "Français", de: "Deutsch", it: "Italiano",
};

// Keep interface labels separate from user-authored data. Additional locale catalogs can
// be supplied here later without modifying notes, objectives, or other stored content.
const messages = {
  en: {
    "media.choose": "Choose image",
    "media.change": "Change image",
    "media.remove": "Remove image",
    "media.prototypeHelp": "Images are resized and stored only in this browser for this prototype.",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

export function getUserLocale(): SupportedLocale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = window.localStorage.getItem(USER_LOCALE_STORAGE_KEY);
  return supportedLocales.includes(stored as SupportedLocale) ? stored as SupportedLocale : defaultLocale;
}

export function translate(key: MessageKey, locale: SupportedLocale = defaultLocale) {
  const catalog = messages[locale as keyof typeof messages] ?? messages.en;
  return (catalog as (typeof messages)["en"])[key] ?? messages.en[key];
}
