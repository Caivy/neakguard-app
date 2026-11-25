<script lang="ts">
  import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    AccordionTrigger,
  } from "@ui-sdk/svelte/accordion";

  interface Item {
    value: string;
    question: string;
    answer: string;
  }
  interface Props {
    items: Item[];
    label: string;
  }

  let { items, label }: Props = $props();
</script>

<Accordion aria-label={label} hiddenUntilFound class="divide-y divide-line border-y border-line">
  {#each items as item (item.value)}
    <AccordionItem value={item.value}>
      <AccordionHeader class="m-0 text-base font-medium">
        <AccordionTrigger
          class="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-start text-lg font-medium text-white"
        >
          {item.question}
          <svg
            class="size-5 shrink-0 text-river transition-transform duration-200 group-data-open:rotate-180"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionPanel>
        <p class="pb-5 pe-8 text-river">{item.answer}</p>
      </AccordionPanel>
    </AccordionItem>
  {/each}
</Accordion>
