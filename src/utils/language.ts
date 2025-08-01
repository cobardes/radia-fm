export type LocaleCode = "en-GB" | "es-ES" | "es-CL";

// Single source of truth for language data
export const LANGUAGES = [
  { locale: "en-GB", name: "British English" },
  { locale: "es-ES", name: "Neutral Spanish" },
  { locale: "es-CL", name: "Chilean Spanish" },
] as const;

export function getLanguageName(locale: LocaleCode): string {
  const language = LANGUAGES.find((lang) => lang.locale === locale);
  if (!language) {
    throw new Error(`Unknown locale: ${locale}`);
  }
  return language.name;
}

export function isValidLocale(locale: string): locale is LocaleCode {
  return LANGUAGES.some((lang) => lang.locale === locale);
}

/**
 * Detects the user's browser language and maps it to a supported locale
 * with fallback logic. For example, es-419 -> es-ES, en-US -> en-GB.
 * If no match is found, defaults to en-GB.
 */
export function detectBrowserLanguage(): LocaleCode {
  // Get browser languages (ordered by preference)
  const browserLanguages = navigator.languages || [navigator.language];

  for (const browserLang of browserLanguages) {
    const normalizedLang = browserLang.toLowerCase();

    // Try exact match first
    const exactMatch = LANGUAGES.find(
      (lang) => lang.locale.toLowerCase() === normalizedLang
    );
    if (exactMatch) {
      return exactMatch.locale;
    }

    // Try language family fallback (e.g., es-419 -> es-ES)
    const languageCode = normalizedLang.split("-")[0];

    // Spanish variants fall back to es-ES
    if (languageCode === "es") {
      return "es-ES";
    }

    // English variants fall back to en-GB
    if (languageCode === "en") {
      return "en-GB";
    }
  }

  // Ultimate fallback
  return "en-GB";
}
