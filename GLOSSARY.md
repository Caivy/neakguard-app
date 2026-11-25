# NeakGuard

NeakGuard protects Telegram Desktop users on Windows from disguised attachments, such as archives hiding programs or files whose real format differs from their name. It works alongside antivirus software and never replaces it.

## Processes

**Broker**:
The per-user NeakGuard process that watches folders, decides what happens to each Attachment, and owns the Quarantine. It never parses file contents.
_Avoid_: daemon, service, agent, tray app

**Inspector**:
A short-lived, sandboxed NeakGuard process that examines exactly one Attachment and reports a Verdict to the Broker. It can read the file but never move, change or delete it.
_Avoid_: worker, scanner, engine

**NeakGuard App**:
The NeakGuard window, used for onboarding, the Quarantine list and settings. It is opened only when needed and holds no protection logic.
_Avoid_: UI, frontend, dashboard

**NeakGuard Website**:
The public web page that explains NeakGuard and links to a NeakGuard release. It holds no protection logic.
_Avoid_: landing page, homepage, marketing site

## Files and places

**Watched Folder**:
A folder the user has confirmed for NeakGuard to protect, usually Telegram Desktop's download folder.
_Avoid_: monitored directory, download path

**Attachment**:
A file that appeared in a Watched Folder, or that the user asked NeakGuard to scan.
_Avoid_: download, file, sample

**Tagging**:
Marking an Attachment as coming from the internet (Mark of the Web), so Windows warns before anything inside it runs.
_Avoid_: labeling, zone marking

## Outcomes

**Verdict**:
The Inspector's conclusion about one Attachment: Suspicious, Uninspected or No Findings.
_Avoid_: result, scan result, status

**Finding**:
One concrete, explainable reason an Attachment looks disguised or dangerous, such as "looks like a PDF but is a Windows program".
_Avoid_: detection, alert, hit, signature

**Suspicious**:
A Verdict with at least one Finding.
_Avoid_: malicious, infected, virus

**Uninspected**:
A Verdict meaning NeakGuard could not finish examining the Attachment, always with a reason: encrypted, partial, unsupported, too large, failed, or out of time or memory.
_Avoid_: unknown, error, skipped

**No Findings**:
A Verdict meaning NeakGuard examined the Attachment and found nothing. It never means the file is safe.
_Avoid_: clean, safe, trusted

## Actions

**Quarantine**:
A reversible move of a Suspicious Attachment out of the user's reach, which the Broker does automatically.
_Avoid_: block, isolate, remove

**Restore**:
Undoing a Quarantine, returning the Attachment to where it came from without overwriting anything.
_Avoid_: release, unquarantine

**Delete**:
Permanently destroying a quarantined Attachment. Only the user can trigger it, never NeakGuard on its own.
_Avoid_: remove, purge, clean
