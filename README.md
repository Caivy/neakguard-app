# NeakGuard

NeakGuard is a Windows desktop app that spots disguised Telegram Desktop Attachments, such as archives that hide programs or files whose real format differs from their name. It works alongside Microsoft Defender and is not an antivirus.

This repository contains the **NeakGuard App**: the Tauri and Svelte window for onboarding, the Watched Folder, and the Quarantine list. The App opens in Khmer by default, with an English toggle.

The Broker and the Inspector do the protection work. They are not open source. `crates/neakguard-broker-stub` has the same interface as the Broker, so the App builds and runs from this repository. A build from this repository does not watch folders or examine Attachments. To get protection, install a NeakGuard release.

| Location | Contents |
| --- | --- |
| `app/` | Tauri and Svelte NeakGuard App |
| `crates/neakguard-broker-stub` | Public placeholder for the Broker interface |
| `docs/design/app` | NeakGuard App screenshots in Khmer and English |
| `GLOSSARY.md` | NeakGuard terms |

## Build and test

Use rustup stable, Node.js 24, and pnpm. On Linux, install the Tauri build dependencies listed in the CI workflow, including WebKitGTK 4.1.

```sh
(cd app && pnpm install --frozen-lockfile && pnpm test && pnpm build)
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
(cd app && pnpm tauri dev)
```

## Reporting security issues

Do not open a public issue for a security problem. Use GitHub's private vulnerability reporting on this repository.
