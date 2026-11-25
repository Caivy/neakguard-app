// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/svelte/agent";
import { afterEach, describe, expect, it } from "vitest";
import Faq from "./Faq.svelte";

const items = [
  { value: "antivirus", question: "Is NeakGuard an antivirus?", answer: "No. Keep Microsoft Defender on." },
  { value: "quarantine", question: "What happens to a Suspicious Attachment?", answer: "NeakGuard moves it to Quarantine." },
  { value: "source", question: "Is NeakGuard open source?", answer: "Only the NeakGuard App is." },
];

afterEach(cleanup);

function trigger(name: string) {
  return screen.getByRole("button", { name });
}

describe("FAQ accordion", () => {
  it("names every question as a button inside a heading and starts closed", () => {
    render(Faq, { items, label: "Questions" });
    for (const item of items) {
      const button = trigger(item.question);
      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect(button.closest("h3, h2")).not.toBeNull();
      expect(screen.getByText(item.answer, { ignore: "script" }).closest("[hidden]")).not.toBeNull();
    }
  });

  it("opens an answer with Enter and closes it with Space", async () => {
    const user = userEvent.setup();
    render(Faq, { items, label: "Questions" });
    await user.tab();
    const first = trigger(items[0]!.question);
    expect(document.activeElement).toBe(first);

    await user.keyboard("{Enter}");
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(items[0]!.answer).closest("[hidden]")).toBeNull();

    await user.keyboard(" ");
    expect(first.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText(items[0]!.answer).closest("[hidden]")).not.toBeNull();
  });

  it("wires each open trigger to a region labelled by that trigger", async () => {
    const user = userEvent.setup();
    render(Faq, { items, label: "Questions" });
    await user.click(trigger(items[1]!.question));
    const region = screen.getByRole("region", { name: items[1]!.question });
    expect(within(region).getByText(items[1]!.answer)).toBeTruthy();
    expect(trigger(items[1]!.question).getAttribute("aria-controls")).toBe(region.id);
  });

  it("keeps one answer open at a time", async () => {
    const user = userEvent.setup();
    render(Faq, { items, label: "Questions" });
    await user.click(trigger(items[0]!.question));
    await user.click(trigger(items[2]!.question));
    expect(trigger(items[0]!.question).getAttribute("aria-expanded")).toBe("false");
    expect(trigger(items[2]!.question).getAttribute("aria-expanded")).toBe("true");
  });

  it("lets an agent find every question by name and open one", async () => {
    const agent = createAgent();
    render(Faq, { items, label: "Questions" });
    const entries = agent.snapshot().filter((entry) => !entry.offPage && entry.component !== "more");
    for (const entry of entries) expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
    expect(entries.map((entry) => entry.label)).toContain("Questions");

    const result = await agent.act({
      steps: [{ ref: "Questions", action: "setValue", args: [["source"]] }],
    });
    expect(result.ok, result.error?.message).toBe(true);
    expect(trigger(items[2]!.question).getAttribute("aria-expanded")).toBe("true");
  });
});
