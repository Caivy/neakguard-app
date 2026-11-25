<script lang="ts">
  import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/svelte/tabs";

  interface Shot {
    value: string;
    label: string;
    src: string;
    alt: string;
  }
  interface Props {
    lang: string;
    shots: Shot[];
    label: string;
    width: number;
    height: number;
  }

  let { lang, shots, label, width, height }: Props = $props();
</script>

<Tabs
  defaultValue={lang}
  class="overflow-hidden rounded-2xl border border-naga-2 bg-naga-2 shadow-2xl shadow-black/40"
>
  <div class="flex items-center gap-4 border-b border-line px-4 py-3">
    <span class="flex gap-1.5" aria-hidden="true">
      <span class="size-2.5 rounded-full bg-river/30"></span>
      <span class="size-2.5 rounded-full bg-river/30"></span>
      <span class="size-2.5 rounded-full bg-river/30"></span>
    </span>
    <TabsList aria-label={label} class="mx-auto flex gap-1 rounded-full bg-naga p-1">
      {#each shots as shot (shot.value)}
        <TabsTab
          value={shot.value}
          class="cursor-pointer rounded-full px-4 py-1 text-sm text-river data-selected:bg-naga-2 data-selected:text-white"
        >
          {shot.label}
        </TabsTab>
      {/each}
    </TabsList>
    <span class="w-[3.25rem] max-sm:hidden" aria-hidden="true"></span>
  </div>
  {#each shots as shot (shot.value)}
    <TabsPanel value={shot.value}>
      <img
        src={shot.src}
        alt={shot.alt}
        {width}
        {height}
        loading="lazy"
        decoding="async"
        class="block h-auto w-full"
      />
    </TabsPanel>
  {/each}
</Tabs>
