const { test } = require('node:test')
const assert = require('node:assert/strict')
const { chercherVille, previsions } = require('../services/openMeteo')

// Fabrique une fausse réponse HTTP
function reponseJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const GEO = {
  results: [{ name: 'Testville', country: 'France', latitude: 45.75, longitude: 4.85 }],
}

// Les caches sont partagés dans ce fichier : chaque test utilise donc
// des noms de ville et des coordonnées différents.

test('chercherVille : le 2e appel vient du cache (casse et espaces ignorés)', async (t) => {
  const faux = t.mock.method(globalThis, 'fetch', async () => reponseJson(GEO))

  const a = await chercherVille('Ville1')
  const b = await chercherVille('  VILLE1 ')

  assert.deepEqual(a, b)
  assert.equal(faux.mock.callCount(), 1) // un seul appel réseau
})

test('chercherVille : ville inconnue renvoie null et n\'est pas mise en cache', async (t) => {
  const faux = t.mock.method(globalThis, 'fetch', async () => reponseJson({}))

  assert.equal(await chercherVille('inconnue1'), null)
  assert.equal(await chercherVille('inconnue1'), null)
  assert.equal(faux.mock.callCount(), 2) // on a redemandé : l'échec n'est pas mémorisé
})

test('chercherVille : une API en erreur lève une exception', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => reponseJson({}, 500))
  await assert.rejects(() => chercherVille('panne1'), /statut 500/)
})

test('previsions : des coordonnées très proches partagent le cache', async (t) => {
  const faux = t.mock.method(globalThis, 'fetch', async () => reponseJson({ ok: true }))

  await previsions(45.7501, 4.8501)
  await previsions(45.7502, 4.8499) // même clé après arrondi : "45.75,4.85"

  assert.equal(faux.mock.callCount(), 1)
})

test('previsions : un échec n\'est pas mis en cache', async (t) => {
  let n = 0
  const faux = t.mock.method(globalThis, 'fetch', async () => {
    n++
    return n === 1 ? reponseJson({}, 500) : reponseJson({ ok: true })
  })

  await assert.rejects(() => previsions(10, 10))
  const data = await previsions(10, 10) // le 2e essai refait un appel et réussit

  assert.deepEqual(data, { ok: true })
  assert.equal(faux.mock.callCount(), 2)
})