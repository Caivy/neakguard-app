import en from "./en.json";
import km from "./km.json";

export type Lang = "km" | "en";
export type Key = keyof typeof en;

export const LOCALES = {
  km: { path: "/", htmlLang: "km", label: "ខ្មែរ" },
  en: { path: "/en/", htmlLang: "en", label: "English" },
} as const satisfies Record<Lang, { path: "/" | "/en/"; htmlLang: Lang; label: string }>;

const dictionaries: Record<Lang, Record<Key, string>> = { km, en };

export function t(lang: Lang, key: Key): string {
  return dictionaries[lang][key];
}

export function otherLang(lang: Lang): Lang {
  return lang === "km" ? "en" : "km";
}
