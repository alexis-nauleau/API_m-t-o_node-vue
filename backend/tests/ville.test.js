const { test } = require('node:test')
const assert = require('node:assert/strict')
const { vraiFetch, reponseJson, demarrer } = require('./aide')

// Simule le géocodage d'Open-Meteo et renvoie la liste des appels effectués
function fauxGeocodage(t, resultats, status = 200) {
  const appels = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const adresse = new URL(String(url))
    if (adresse.hostname === 'geocoding-api.open-meteo.com') {
      appels.push(adresse.href)
      return reponseJson({ results: resultats }, status)
    }
    return vraiFetch(url, options) // vers notre serveur de test : vrai appel
  })
  return appels
}

function lieu(id, nom, code, population, extra = {}) {
  return {
    id,
    name: nom,
    feature_code: code,
    population,
    latitude: 1,
    longitude: 2,
    ...extra,
  }
}

// Les caches sont partagés dans ce fichier : chaque test utilise donc
// un texte de recherche différent.

test('/villes : écarte les non-villes, trie par population, ne garde que les champs utiles', async (t) => {
  fauxGeocodage(t, [
    lieu(1, 'Aérodrome', 'AIRP', 0), // aéroport : écarté
    lieu(2, 'Hameau', 'PPL', 100),
    lieu(3, 'Grande Ville', 'PPLA', 5000, {
      admin1: 'Région',
      country: 'France',
      postcodes: ['69000', '69001'],
    }),
    lieu(4, 'Île', 'ISL', 50), // île : écartée
  ])
  const { base, fermer } = await demarrer()
  try {
    const res = await fetch(`${base}/villes?q=filtre`)
    assert.equal(res.status, 200)
    const villes = await res.json()

    assert.deepEqual(villes.map((v) => v.id), [3, 2]) // plus peuplée d'abord
    assert.deepEqual(villes[0], {
      id: 3,
      nom: 'Grande Ville',
      region: 'Région',
      pays: 'France',
      latitude: 1,
      longitude: 2,
    }) // et surtout : aucune liste de codes postaux
    assert.equal(villes[1].region, null) // champ absent : null
  } finally {
    await fermer()
  }
})

test('/villes : au maximum 5 résultats', async (t) => {
  const beaucoup = Array.from({ length: 8 }, (_, i) => lieu(i + 1, `Ville${i}`, 'PPL', i))
  fauxGeocodage(t, beaucoup)
  const { base, fermer } = await demarrer()
  try {
    const villes = await (await fetch(`${base}/villes?q=maximum`)).json()
    assert.equal(villes.length, 5)
  } finally {
    await fermer()
  }
})

test('/villes : moins de 3 caractères renvoie 400, sans appel externe', async (t) => {
  const appels = fauxGeocodage(t, [])
  const { base, fermer } = await demarrer()
  try {
    const res = await fetch(`${base}/villes?q=ab`)
    assert.equal(res.status, 400)
    assert.equal(appels.length, 0)
  } finally {
    await fermer()
  }
})

test('/villes : la même recherche, casse et espaces ignorés, vient du cache', async (t) => {
  const appels = fauxGeocodage(t, [lieu(1, 'Cachée', 'PPL', 10)])
  const { base, fermer } = await demarrer()
  try {
    await fetch(`${base}/villes?q=cachee`)
    await fetch(`${base}/villes?q=%20CACHEE%20`) // " CACHEE " avec espaces
    assert.equal(appels.length, 1)
  } finally {
    await fermer()
  }
})

test('/villes : API externe en panne renvoie 502', async (t) => {
  fauxGeocodage(t, [], 500)
  const { base, fermer } = await demarrer()
  try {
    const res = await fetch(`${base}/villes?q=panne`)
    assert.equal(res.status, 502)
  } finally {
    await fermer()
  }
})

test('/villes : limiteur propre à cette route (429 à la 4e requête si la limite est 3)', async (t) => {
  fauxGeocodage(t, [])
  const { base, fermer } = await demarrer({ limiteVilles: 3 })
  try {
    for (let i = 0; i < 3; i++) {
      assert.equal((await fetch(`${base}/villes?q=ab`)).status, 400) // compte dans la limite
    }
    assert.equal((await fetch(`${base}/villes?q=ab`)).status, 429)
  } finally {
    await fermer()
  }
})