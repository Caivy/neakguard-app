// What the NeakGuard App reads from the Broker, and which failures count as a problem.

// Read the Broker status and the Quarantine list. They fail on their own. A failed status
// keeps the last status and list and is a problem. A failed list keeps the last list and is a
// message on the list only: the Broker is still protecting.
export async function refreshed(invoke, previous) {
  let status
  try {
    status = await invoke('protection_status')
  } catch (cause) {
    return { ...previous, statusError: String(cause) }
  }
  try {
    const quarantine = status.folder ? await invoke('list_quarantine') : []
    return { status, quarantine, statusError: '', listError: '' }
  } catch (cause) {
    return { status, quarantine: previous.quarantine, statusError: '', listError: String(cause) }
  }
}

// The problem that makes the App say "not protecting". A list error is never one.
export const problemOf = ({ error, statusError, status }) => error || statusError || status?.error || ''
