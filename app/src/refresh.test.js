import assert from 'node:assert/strict'
import { test } from 'node:test'
import { problemOf, refreshed } from './refresh.js'

const running = { folder: 'C:\Telegram Desktop', running: true, error: null, held: [] }
const listed = [{ id: 'q-1', name: 'invoice.pdf.exe' }]
const empty = { status: {}, quarantine: [], statusError: '', listError: '' }

// An invoke that answers each command with a value, or throws when the answer is an Error.
const answering = (answers) => async (command) => {
  const answer = answers[command]
  if (answer instanceof Error) throw answer
  return answer
}

test('a failed Quarantine list is a message on the list and never a problem', async () => {
  const state = await refreshed(answering({ protection_status: running, list_quarantine: new Error('slot unreadable') }), empty)
  assert.equal(state.listError, 'Error: slot unreadable')
  assert.equal(state.statusError, '')
  assert.deepEqual(state.status, running)
  assert.equal(problemOf({ error: '', statusError: state.statusError, status: state.status }), '')
})

test('a failed Quarantine list keeps the list that was shown before', async () => {
  const before = { ...empty, status: running, quarantine: listed }
  const state = await refreshed(answering({ protection_status: running, list_quarantine: new Error('busy') }), before)
  assert.deepEqual(state.quarantine, listed)
})

test('a failed status is a problem, and the last status and list stay', async () => {
  const before = { ...empty, status: running, quarantine: listed }
  const state = await refreshed(answering({ protection_status: new Error('Broker status unreadable') }), before)
  assert.equal(state.statusError, 'Error: Broker status unreadable')
  assert.deepEqual(state.status, running)
  assert.deepEqual(state.quarantine, listed)
  assert.equal(problemOf({ error: '', statusError: state.statusError, status: state.status }), 'Error: Broker status unreadable')
})

test('a good refresh clears both errors', async () => {
  const before = { status: {}, quarantine: [], statusError: 'old', listError: 'old' }
  const state = await refreshed(answering({ protection_status: running, list_quarantine: listed }), before)
  assert.deepEqual(state, { status: running, quarantine: listed, statusError: '', listError: '' })
})

test('without a Watched Folder the list is empty and is not asked for', async () => {
  const asked = []
  const invoke = async (command) => { asked.push(command); return command === 'protection_status' ? { running: false } : [] }
  const state = await refreshed(invoke, { ...empty, quarantine: listed })
  assert.deepEqual(asked, ['protection_status'])
  assert.deepEqual(state.quarantine, [])
})

test('an error of an action or of the Broker status is a problem', () => {
  assert.equal(problemOf({ error: 'action failed', statusError: '', status: running }), 'action failed')
  assert.equal(problemOf({ error: '', statusError: '', status: { ...running, error: 'No directory watch' } }), 'No directory watch')
  assert.equal(problemOf({ error: '', statusError: '', status: {} }), '')
})
