// What the NeakGuard App lists as Held Attachments and what it may offer for them.

// The Broker publishes the list only while it runs, and it holds these files whatever else it
// reports. An operational error must not hide them or the Open Anyway action.
//
// A file that the antivirus removed is the antivirus's decision, not a Hold, and the user can
// dismiss its row. `dismissed` holds the keys of the rows that the user dismissed.
export const heldFilesOf = (status, dismissed = new Set()) =>
  (status?.running ? (status.held ?? []) : []).filter((file) => !(canDismiss(file) && dismissed.has(dismissKey(file))))

// Open Anyway is for an Uninspected Attachment only. A Suspicious Attachment waiting for its
// Quarantine never gets it.
export const canOpenAnyway = (file) => file.state === 'uninspected'

// Only a row for a file that the antivirus removed can be dismissed. NeakGuard has nothing
// else to do for it, and no other row is a decision that the user may hide.
export const canDismiss = (file) => file.state === 'removed_by_antivirus'

// A dismissal is for this version of the file. A file that was gone before its version was
// read has no fingerprint, so its path stands in for it.
export const dismissKey = (file) => file.fingerprint || file.path

// The message for a row. An unprotected file is one that NeakGuard could not keep closed, so it
// is not held at all: its row says so, and its detail says why. A file that the antivirus
// removed says so and nothing more.
const holdMessages = {
  checking: 'holdChecking',
  suspicious: 'holdSuspicious',
  unprotected: 'holdUnprotected',
  removed_by_antivirus: 'holdRemovedByAntivirus',
}
export const holdMessageKey = (file) => holdMessages[file.state] ?? 'holdUninspected'

// A file that is not held has an information icon. A held file waits, so it has a timer.
export const holdIconName = (file) => (file.state === 'unprotected' || file.state === 'removed_by_antivirus' ? 'info' : 'timer')

const dismissedKey = 'neakguard.dismissed'
const maxDismissed = 100

// The storage is read through a function, so a blocked or damaged storage never breaks the App.
export function loadDismissed(storage = () => localStorage) {
  try {
    const keys = JSON.parse(storage().getItem(dismissedKey) ?? '[]')
    return new Set(Array.isArray(keys) ? keys.filter((key) => typeof key === 'string') : [])
  } catch {
    return new Set()
  }
}

export function saveDismissed(dismissed, storage = () => localStorage) {
  try {
    storage().setItem(dismissedKey, JSON.stringify([...dismissed].slice(-maxDismissed)))
  } catch {
    // The row comes back after a restart. That is all a blocked storage costs.
  }
}
