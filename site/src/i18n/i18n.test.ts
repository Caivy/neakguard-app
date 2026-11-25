import { describe, expect, it } from "vitest";
import en from "./en.json";
import km from "./km.json";
import { LOCALES, t, type Lang } from "./index";

const LANGS: Lang[] = ["km", "en"];
const KHMER_LETTER = /[ក-អ]/;
const brandOnly = new Set<string>([]);

describe("i18n dictionaries", () => {
  it("every Khmer key exists in English", () => {
    const missing = Object.keys(km).filter((key) => !(key in en));
    expect(missing, `keys missing from en.json: ${missing.join(", ")}`).toEqual([]);
  });

  it("every English key exists in Khmer", () => {
    const missing = Object.keys(en).filter((key) => !(key in km));
    expect(missing, `keys missing from km.json: ${missing.join(", ")}`).toEqual([]);
  });

  it.each(LANGS)("no %s value is empty", (lang) => {
    const dictionary = lang === "km" ? km : en;
    const empty = Object.entries(dictionary)
      .filter(([, value]) => typeof value !== "string" || value.trim() === "")
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it("every Khmer value is written in Khmer, not left in English", () => {
    const untranslated = Object.entries(km)
      .filter(([key, value]) => !brandOnly.has(key) && !KHMER_LETTER.test(value))
      .map(([key]) => key);
    expect(untranslated).toEqual([]);
  });
});

describe("t(lang, key)", () => {
  it("returns the text of the requested language", () => {
    expect(t("en", "downloadButton")).toBe("Download for Windows");
    expect(t("km", "downloadButton")).toContain("Windows");
    expect(t("km", "downloadButton")).not.toBe(t("en", "downloadButton"));
  });
});

describe("LOCALES", () => {
  it("serves Khmer at / and English at /en/", () => {
    expect(LOCALES.km).toMatchObject({ path: "/", htmlLang: "km" });
    expect(LOCALES.en).toMatchObject({ path: "/en/", htmlLang: "en" });
  });

  it("labels each language in its own language", () => {
    expect(LOCALES.km.label).toBe("ខ្មែរ");
    expect(LOCALES.en.label).toBe("English");
  });
});
