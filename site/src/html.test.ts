// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { RELEASE_URL, SOURCE_URL } from "./config";
import { LOCALES, t, type Lang } from "./i18n";

const dist = resolve(import.meta.dirname, "../dist");

function loadPage(lang: Lang) {
  const file = lang === "km" ? "index.html" : "en/index.html";
  const { document } = new JSDOM(readFileSync(resolve(dist, file), "utf8")).window;
  return document;
}

function visibleText(document: Document) {
  const body = document.body.cloneNode(true) as HTMLElement;
  body.querySelectorAll("script, style, template, noscript").forEach((node) => node.remove());
  return (body.textContent ?? "").replace(/\s+/g, " ").trim();
}

function linksNamed(document: Document, name: string) {
  return [...document.querySelectorAll("a")].filter(
    (link) => (link.textContent ?? "").replace(/\s+/g, " ").trim() === name,
  );
}

// The honest note says "never means the file is safe". Only that sentence may use the word.
const NEVER_MEANS_SAFE: Record<Lang, RegExp> = {
  en: /never means the file is safe/gi,
  km: /មិនមានន័យថា[^។]*សុវត្ថិភាព/g,
};

const FORBIDDEN: Record<Lang, RegExp[]> = {
  en: [
    /\bclean(s|ed|ing|er)?\b/i,
    /\bsafe(ly|ty)?\b/i,
    /\bscann?(er|ers|ed|ing|s)?\b/i,
    /virus-free/i,
    /malware-free/i,
    /\btrusted\b/i,
    /\bmalicious\b/i,
    /\binfected\b/i,
    /\bdetect(ion|ions|ed|s)?\b/i,
    /\bis an antivirus\b/i,
    /\blanding page\b/i,
  ],
  km: [/សុវត្ថិភាព/, /ស្កេន/, /គ្មានមេរោគ/],
};

describe.each(["km", "en"] as const)("NeakGuard Website built page (%s)", (lang) => {
  const document = loadPage(lang);
  const other: Lang = lang === "km" ? "en" : "km";

  it("declares its language on <html>", () => {
    expect(document.documentElement.getAttribute("lang")).toBe(LOCALES[lang].htmlLang);
  });

  it("has exactly one h1", () => {
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("downloads the 64-bit installer straight from the latest release", () => {
    const hero = linksNamed(document, t(lang, "downloadButton"));
    const topBar = linksNamed(document, t(lang, "navDownload"));
    expect(hero).toHaveLength(1);
    expect(topBar).toHaveLength(1);
    for (const link of [...hero, ...topBar]) {
      expect(link.getAttribute("href")).toBe(
        "https://github.com/Caivy/neakguard-app/releases/latest/download/NeakGuard-windows-x64-setup.exe",
      );
    }
  });

  it("links to the other downloads on the release page", () => {
    const others = linksNamed(document, t(lang, "otherDownloads"));
    expect(others).toHaveLength(1);
    expect(others[0].getAttribute("href")).toBe(RELEASE_URL);
  });

  it("points every Source link at the App source", () => {
    const named = [
      ...linksNamed(document, t(lang, "navSource")),
      ...linksNamed(document, t(lang, "sourceLink")),
    ];
    expect(named).toHaveLength(2);
    for (const link of named) expect(link.getAttribute("href")).toBe(SOURCE_URL);
  });

  it("links to the other language with its own hreflang", () => {
    const switches = [...document.querySelectorAll("a[hreflang]")];
    expect(switches).toHaveLength(1);
    expect(switches[0]?.getAttribute("href")).toBe(LOCALES[other].path);
    expect(switches[0]?.getAttribute("hreflang")).toBe(LOCALES[other].htmlLang);
    expect(switches[0]?.textContent?.trim()).toBe(LOCALES[other].label);
  });

  it("makes no claim the glossary forbids", () => {
    const text = visibleText(document).replace(NEVER_MEANS_SAFE[lang], "");
    for (const pattern of FORBIDDEN[lang]) {
      expect(text, `forbidden wording ${pattern}`).not.toMatch(pattern);
    }
  });

  it("says plainly that NeakGuard is not an antivirus and No Findings is not safe", () => {
    const text = visibleText(document);
    expect(text).toContain(t(lang, "noteText"));
    expect(text).toContain(t(lang, "noteNoFindings"));
  });

  it("names every FAQ question and renders the FAQ before any script runs", () => {
    const text = visibleText(document);
    for (const key of ["faq1Q", "faq2Q", "faq3Q", "faq4Q", "faq5Q"] as const) {
      expect(text).toContain(t(lang, key));
    }
    expect(document.querySelectorAll('[data-slot="accordion-trigger"]')).toHaveLength(5);
  });

  it("opens the App screenshot tabs on the page language", () => {
    const selected = document.querySelector('[role="tab"][aria-selected="true"]');
    expect(selected?.textContent?.trim()).toBe(LOCALES[lang].label);
    expect(document.querySelectorAll('[role="tab"]')).toHaveLength(2);
  });

  it("gives every image a text alternative", () => {
    const images = [...document.querySelectorAll("img")];
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      const decorative = image.getAttribute("alt") === "" && image.getAttribute("aria-hidden") === "true";
      expect(decorative || (image.getAttribute("alt") ?? "").length > 0, image.outerHTML).toBe(true);
    }
  });

  it("explains each How it works step in its own band with a picture and points", () => {
    const steps = [...document.querySelectorAll("[data-step]")];
    expect(steps.map((step) => step.querySelector("h3")?.textContent?.trim())).toEqual([
      t(lang, "step1Title"),
      t(lang, "step2Title"),
      t(lang, "step3Title"),
    ]);
    for (const step of steps) {
      expect(step.tagName).toBe("SECTION");
      expect(step.querySelector("[data-step-visual]"), step.outerHTML.slice(0, 120)).not.toBeNull();
      expect(step.querySelectorAll("[data-step-points] li").length).toBe(3);
    }
  });

  it("shows the Finding inside the step 2 picture", () => {
    const visual = document.querySelectorAll("[data-step]")[1]?.querySelector("[data-step-visual]");
    expect(visual?.textContent).toContain(t(lang, "findingExample"));
  });

  it("shows disguised Attachment tiles with their real type", () => {
    const tiles = document.querySelectorAll("[data-tile]");
    expect(tiles.length).toBeGreaterThanOrEqual(4);
    for (const tile of tiles) {
      expect(tile.querySelector("[data-real-type]")?.textContent).toMatch(/^\.[a-z]{2,4}$/);
    }
  });
});
