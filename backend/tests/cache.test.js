const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Cache } = require('../services/cache')

test('une valeur rangée peut être relue', () => {
  const cache = new Cache(1000)
  cache.set('lyon', { temp: 14 })
  assert.deepEqual(cache.get('lyon'), { temp: 14 })
})

test('une clé inconnue renvoie undefined', () => {
  const cache = new Cache(1000)
  assert.equal(cache.get('paris'), undefined)
})

test('une valeur expire après sa durée de vie', (t) => {
  // On remplace l'horloge par une fausse : on avance le temps à la main,
  // sans attendre vraiment. Elle est restaurée toute seule à la fin du test.
  t.mock.timers.enable({ apis: ['Date'] })
  const cache = new Cache(1000)
  cache.set('lyon', 1)

  t.mock.timers.tick(999) // 999 ms : encore valable
  assert.equal(cache.get('lyon'), 1)

  t.mock.timers.tick(2) // 1001 ms : expirée
  assert.equal(cache.get('lyon'), undefined)
})

test('cache plein : la plus ancienne entrée est supprimée', () => {
  const cache = new Cache(1000, 2) // 2 entrées maximum
  cache.set('a', 1)
  cache.set('b', 2)
  cache.set('c', 3)
  assert.equal(cache.get('a'), undefined) // la plus ancienne a disparu
  assert.equal(cache.get('b'), 2)
  assert.equal(cache.get('c'), 3)
})

test('réécrire une clé la rend la plus récente', () => {
  const cache = new Cache(1000, 2)
  cache.set('a', 1)
  cache.set('b', 2)
  cache.set('a', 10) // "a" repasse en fin de file : "b" devient la plus ancienne
  cache.set('c', 3)
  assert.equal(cache.get('b'), undefined)
  assert.equal(cache.get('a'), 10)
})