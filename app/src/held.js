// What the NeakGuard App lists as Held Attachments and what it may offer for them.

// The Broker publishes the list only while it runs, and it holds these files whatever else it
// reports. An operational error must not hide them or the Open Anyway action.
export const heldFilesOf = (status) => (status?.running ? (status.held ?? []) : [])

// Open Anyway is for an Uninspected Attachment only. A Suspicious Attachment waiting for its
// Quarantine never gets it.
export const canOpenAnyway = (file) => file.state === 'uninspected'

// The message for a row. An unprotected file is one that NeakGuard could not keep closed, so it
// is not held at all: its row says so, and its detail says why.
const holdMessages = { checking: 'holdChecking', suspicious: 'holdSuspicious', unprotected: 'holdUnprotected' }
export const holdMessageKey = (file) => holdMessages[file.state] ?? 'holdUninspected'
