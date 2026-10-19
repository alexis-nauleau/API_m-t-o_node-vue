const { test } = require('node:test')
const assert = require('node:assert/strict')
const { once } = require('node:events')
const { creerApp } = require('../app')

// On garde le vrai fetch : les tests s'en servent pour interroger NOTRE serveur,
// alors que les appels vers Open-Meteo sont simulés
const vraiFetch = globalThis.fetch

function reponseJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const PREVISIONS = {
  current: { temperature_2m: 14.2, weather_code: 3, wind_speed_10m: 9.5 },
  daily: {
    time: ['2026-10-19', '2026-10-20'],
    temperature_2m_max: [17.1, 16.0],
    temperature_2m_min: [8.4, 7.9],
    precipitation_sum: [0, 2.1],
    weather_code: [3, 61],
  },
}

// Simule Open-Meteo. Renvoie la liste des appels externes effectués.
function fauxOpenMeteo(t) {
  const appels = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const adresse = new URL(String(url))

    if (adresse.hostname === 'geocoding-api.open-meteo.com') {
      appels.push(adresse.href)
      const nom = adresse.searchParams.get('name')
      if (nom === 'panne') return reponseJson({}, 500)
      if (nom === 'inconnue') return reponseJson({}) // aucun résultat
      return reponseJson({
        results: [{ name: 'Testville', country: 'France', latitude: 45.75, longitude: 4.85 }],
      })
    }
    if (adresse.hostname === 'api.open-meteo.com') {
      appels.push(adresse.href)
      return reponseJson(PREVISIONS)
    }
    return vraiFetch(url, options) // vers notre serveur de test : vrai appel
  })
  return appels
}

// Démarre un vrai serveur sur un port libre choisi par le système (port 0)
async function demarrer(options) {
  const serveur = creerApp(options).listen(0)
  await once(serveur, 'listening')
  return {
    base: `http://127.0.0.1:${serveur.address().port}`,
    fermer: () =>
      new Promise((resolve) => {
        serveur.close(resolve)
        serveur.closeAllConnections() // évite d'attendre les connexions restées ouvertes
      }),
  }
}

test('GET /meteo?ville=Lyon : 200 et réponse au format attendu', async (t) => {
  fauxOpenMeteo(t)
  const { base, fermer } = await demarrer()
  try {
    const res = await fetch(`${base}/meteo?ville=Lyon`)
    assert.equal(res.status, 200)

    const corps = await res.json()
    assert.equal(corps.lieu.nom, 'Testville')
    assert.equal(corps.actuel.temperature, 14.2)
    assert.equal(corps.jours.length, 2)
    assert.deepEqual(corps.jours[1], { date: '2026-10-20', max: 16, min: 7.9, pluie: 2.1, code: 61 })
  } finally {
    await fermer()
  }
})

test('ville trop courte : 400, sans aucun appel à Open-Meteo', async (t) => {
  const appels = fauxOpenMeteo(t)
  const { base, fermer } = await demarrer()
  try {
    const res = await fetch(`${base}/meteo?ville=a`)
    assert.equal(res.status, 400)
    assert.equal(appels.length, 0) // la validation arrête tout avant l'API externe
  } finally {
    await fermer()
  }
})

test('ville inconnue : 404', async (t) => {
  fauxOpenMeteo(t)
  const { base, fermer } = await demarrer()
  try {
    const res = await fetch(`${base}/meteo?ville=inconnue`)
    assert.equal(res.status, 404)
  } finally {
    await fermer()
  }
})

test('API externe en panne : 502', async (t) => {
  fauxOpenMeteo(t)
  const { base, fermer } = await demarrer()
  try {
    const res = await fetch(`${base}/meteo?ville=panne`)
    assert.equal(res.status, 502)
    assert.match((await res.json()).erreur, /indisponible/)
  } finally {
    await fermer()
  }
})

test('limiteur : la 4e requête est refusée (429) quand la limite est 3', async (t) => {
  fauxOpenMeteo(t)
  const { base, fermer } = await demarrer({ limite: 3 })
  try {
    // "ville=a" donne un 400, mais compte quand même dans la limite
    for (let i = 0; i < 3; i++) {
      assert.equal((await fetch(`${base}/meteo?ville=a`)).status, 400)
    }
    const res = await fetch(`${base}/meteo?ville=a`)
    assert.equal(res.status, 429)
    assert.match((await res.json()).erreur, /Trop de requêtes/)
  } finally {
    await fermer()
  }
})