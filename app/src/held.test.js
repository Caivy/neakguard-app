import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canOpenAnyway, heldFilesOf, holdMessageKey } from './held.js'

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
  assert.deepEqual([...held, unprotected].map(holdMessageKey), ['holdChecking', 'holdUninspected', 'holdSuspicious', 'holdUnprotected'])
})
