import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canDismiss, canOpenAnyway, dismissKey, heldFilesOf, holdIconName, holdMessageKey, loadDismissed, saveDismissed } from './held.js'

const held = [
  { name: 'photo.zip', fingerprint: '1', state: 'checking' },
  { name: 'secret.zip', fingerprint: '2', state: 'uninspected', reason: 'Encrypted' },
  { name: 'invoice.pdf.exe', fingerprint: '3', state: 'suspicious' },
]

test('Held Attachments are listed while the Broker runs, even when it reports an error', () => {
  assert.deepEqual(heldFilesOf({ running: true, held }), held)
  assert.deepEqual(heldFilesOf({ running: true, error: 'Tagging failed', held }), held)
})

test('no Held Attachments are listed when the Broker is not running or the list is missing', () => {
  assert.deepEqual(heldFilesOf({ running: false, held }), [])
  assert.deepEqual(heldFilesOf({ running: true }), [])
  assert.deepEqual(heldFilesOf({}), [])
  assert.deepEqual(heldFilesOf(undefined), [])
})

test('Open Anyway is offered for an Uninspected Attachment and never for a Suspicious one', () => {
  assert.deepEqual(held.map(canOpenAnyway), [false, true, false])
})

test('a failure to check one Attachment is a detail of that row and not a Broker error', () => {
  const status = {
    running: true,
    error: null,
    held: [{ name: 'broken.zip', fingerprint: '4', state: 'uninspected', reason: 'Failed', detail: 'Catastrophic failure' }],
  }
  assert.equal(heldFilesOf(status)[0].detail, 'Catastrophic failure')
  assert.equal(status.error, null)
})

const removed = { name: 'eicar.zip', path: 'C:/Telegram Desktop/eicar.zip', fingerprint: 'a-b-c', state: 'removed_by_antivirus' }
const unprotected = { name: 'locked.zip', fingerprint: '5', state: 'unprotected', detail: 'Access is denied. (os error 5)' }

test('an Attachment that NeakGuard could not hold is listed as its own row, with its detail', () => {
  const status = { running: true, error: null, held: [unprotected] }
  assert.deepEqual(heldFilesOf(status), [unprotected])
  assert.equal(heldFilesOf(status)[0].detail, 'Access is denied. (os error 5)')
  assert.equal(status.error, null)
})

test('Open Anyway is never offered for a file that is not held', () => {
  assert.equal(canOpenAnyway(unprotected), false)
})

test('each Held Attachment state has its own message', () => {
  assert.deepEqual([...held, unprotected, removed].map(holdMessageKey), ['holdChecking', 'holdUninspected', 'holdSuspicious', 'holdUnprotected', 'holdRemovedByAntivirus'])
})

const memory = () => {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}

test('a file that the antivirus removed is its own row, with no Open Anyway and no error', () => {
  const status = { running: true, error: null, held: [removed] }
  assert.deepEqual(heldFilesOf(status), [removed])
  assert.equal(canOpenAnyway(removed), false)
  assert.equal(holdMessageKey(removed), 'holdRemovedByAntivirus')
  assert.equal(holdIconName(removed), 'info')
  assert.equal(holdIconName(held[0]), 'timer')
  assert.equal(status.error, null)
})

test('only a file that the antivirus removed can be dismissed', () => {
  assert.deepEqual([...held, unprotected, removed].map(canDismiss), [false, false, false, false, true])
})

test('a dismissed row is hidden by its fingerprint, and no other row ever is', () => {
  const other = { ...removed, fingerprint: 'd-e-f', path: 'C:/Telegram Desktop/other.zip' }
  const status = { running: true, held: [...held, removed, other] }
  const dismissed = new Set([dismissKey(removed), held[0].fingerprint])
  assert.deepEqual(heldFilesOf(status, dismissed), [...held, other])
})

test('a row without a fingerprint is dismissed by its path', () => {
  const gone = { ...removed, fingerprint: '' }
  const other = { ...gone, path: 'C:/Telegram Desktop/other.zip' }
  const dismissed = new Set([dismissKey(gone)])
  assert.deepEqual(heldFilesOf({ running: true, held: [gone, other] }, dismissed), [other])
})

test('dismissed rows survive a restart of the App through the storage', () => {
  const storage = memory()
  assert.deepEqual([...loadDismissed(() => storage)], [])
  saveDismissed(new Set(['a-b-c', 'd-e-f']), () => storage)
  assert.deepEqual([...loadDismissed(() => storage)], ['a-b-c', 'd-e-f'])
})

test('storage that fails or holds damaged data never breaks the App', () => {
  const broken = () => { throw new Error('storage is blocked') }
  assert.deepEqual([...loadDismissed(broken)], [])
  assert.doesNotThrow(() => saveDismissed(new Set(['a']), broken))
  const damaged = memory()
  damaged.setItem('neakguard.dismissed', '{not json')
  assert.deepEqual([...loadDismissed(() => damaged)], [])
  damaged.setItem('neakguard.dismissed', '{"a":1}')
  assert.deepEqual([...loadDismissed(() => damaged)], [])
})

test('only the latest dismissed rows are kept', () => {
  const storage = memory()
  saveDismissed(new Set(Array.from({ length: 150 }, (_, index) => `f-${index}`)), () => storage)
  const kept = [...loadDismissed(() => storage)]
  assert.equal(kept.length, 100)
  assert.equal(kept.at(-1), 'f-149')
})
