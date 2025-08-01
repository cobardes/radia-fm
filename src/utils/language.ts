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
