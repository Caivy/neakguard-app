import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const readLocale = (name) => JSON.parse(readFileSync(new URL(`./${name}.json`, import.meta.url), 'utf8'))

test('Khmer messages are complete and contain no damaged text', () => {
  const en = readLocale('en')
  const km = readLocale('km')
  assert.deepEqual(Object.keys(km).sort(), Object.keys(en).sort())
  for (const [key, value] of Object.entries(km)) {
    assert.doesNotMatch(value, /\?{2,}|\uFFFD/, key)
    if (!['title', 'language'].includes(key)) assert.match(value, /[\u1780-\u17FF]/, key)
    assert.deepEqual(value.match(/\{\w+\}/g), en[key].match(/\{\w+\}/g), key)
  }
})

test('NeakGuard App message references exist in both languages', () => {
  const app = readFileSync(new URL('../App.svelte', import.meta.url), 'utf8')
  for (const locale of ['en', 'km']) {
    const messages = readLocale(locale)
    for (const [, key] of app.matchAll(/strings\.(\w+)/g)) {
      assert.equal(typeof messages[key], 'string', `${locale}.${key}`)
    }
  }
})
