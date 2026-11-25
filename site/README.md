# NeakGuard Website

Static Astro page in Khmer (`/`) and English (`/en/`). The FAQ and the App screenshot tabs are Svelte islands that use ui-sdk. This package is separate from `app/`.

Use Node.js 22.23.4 or later and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev       # dev server
pnpm test      # builds, then runs vitest (dictionaries, built HTML, islands)
pnpm check     # astro check
pnpm build     # static output in dist/
pnpm preview   # serve dist/
```

The release and source links live in `src/config.ts`. The text lives in `src/i18n/km.json` and `src/i18n/en.json`, which must have the same keys.
