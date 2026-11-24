# NeakGuard App redesign review

The screenshots show the production Vite build at 960 × 680. `km` is Khmer and
`en` is English. Screens 1–4 are onboarding. `home`, `restore`, `empty`, and
`stopped` cover the four Home states in the approved design. `missing` covers
the additional folder detection failure state.

The browser review supplied responses at the existing Tauri command boundary.
It used five example Quarantine entries to check four entries per page, long
Attachment names, and pagination. These screenshots contain no user data.
The review harness is outside the committed source and is not in the App build.

Compared with the approved local mockup, the NeakGuard App keeps the same
360-pixel guardian panel, colours, icons, cards, and action hierarchy. Khmer
headings use the requested 1.8 line height. The error state uses less space so
four Quarantine entries and the page controls fit in the fixed window. Setup
medals have a static glow; only the protecting state has a breathing glow.

Browser checks confirmed:

- All 18 screens fit the fixed window with no content below its bottom edge.
- Restore first focuses “Keep it in Quarantine”. Escape closes the dialog and
  returns focus to the Restore button without invoking `restore_attachment`.
- Confirming Restore invokes `restore_attachment` with the selected ID and
  refreshes the Quarantine list.
- Raw errors appear only in the details dialog.
- The local MiSans Khmer and Onest fonts load without font or network errors.

The App build, language tests, Rust format check, Clippy with warnings denied,
workspace tests, and Tauri debug build passed on Windows.

The App retains the existing `downloadDir()` / `Telegram Desktop` suggestion.
This path API returns a location; it does not check whether that folder exists.
The native folder picker is the fallback, and `configure_folder` validates the
chosen Watched Folder. No filesystem command or Broker change was added.
