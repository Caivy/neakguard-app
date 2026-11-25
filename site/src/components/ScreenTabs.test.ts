// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/svelte/agent";
import { afterEach, describe, expect, it } from "vitest";
import ScreenTabs from "./ScreenTabs.svelte";

const shots = [
  { value: "km", label: "ខ្មែរ", src: "/screens/km-home.png", alt: "App in Khmer" },
  { value: "en", label: "English", src: "/screens/en-home.png", alt: "App in English" },
];
const props = { shots, label: "App language", width: 960, height: 680 };

afterEach(cleanup);

describe("App screenshot tabs", () => {
  it("names the tab list and both tabs", () => {
    render(ScreenTabs, { ...props, lang: "km" });
    expect(screen.getByRole("tablist", { name: "App language" })).toBeTruthy();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent?.trim())).toEqual(["ខ្មែរ", "English"]);
  });

  it.each([
    ["km", "ខ្មែរ", "App in Khmer"],
    ["en", "English", "App in English"],
  ] as const)("opens on the page language (%s)", (lang, tabName, alt) => {
    render(ScreenTabs, { ...props, lang });
    expect(screen.getByRole("tab", { name: tabName }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").querySelector("img")?.getAttribute("alt")).toBe(alt);
  });

  it("moves between tabs with the arrow keys and shows the matching screenshot", async () => {
    const user = userEvent.setup();
    render(ScreenTabs, { ...props, lang: "km" });
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "ខ្មែរ" }));

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "English" }));
    expect(screen.getByRole("tab", { name: "English" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").querySelector("img")?.getAttribute("src")).toBe("/screens/en-home.png");

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "ខ្មែរ" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").querySelector("img")?.getAttribute("src")).toBe("/screens/km-home.png");
  });

  it("keeps one tab in the tab order and ties each panel to its tab", () => {
    render(ScreenTabs, { ...props, lang: "en" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.getAttribute("tabindex"))).toEqual(["-1", "0"]);
    const panel = screen.getByRole("tabpanel");
    expect(screen.getByRole("tab", { name: "English" }).getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(screen.getByRole("tab", { name: "English" }).id);
  });

  it("gives the screenshot its size so the page does not jump", () => {
    render(ScreenTabs, { ...props, lang: "km" });
    const image = screen.getByRole("tabpanel").querySelector("img")!;
    expect(image.getAttribute("width")).toBe("960");
    expect(image.getAttribute("height")).toBe("680");
  });

  it("lets an agent find the tab list by name and switch language", async () => {
    const agent = createAgent();
    render(ScreenTabs, { ...props, lang: "km" });
    const entries = agent.snapshot().filter((entry) => !entry.offPage && entry.component !== "more");
    for (const entry of entries) expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
    expect(entries.map((entry) => entry.label)).toContain("App language");

    const result = await agent.act({
      steps: [{ ref: "App language", action: "setValue", args: ["en"] }],
    });
    expect(result.ok, result.error?.message).toBe(true);
    expect(screen.getByRole("tab", { name: "English" }).getAttribute("aria-selected")).toBe("true");
  });
});
