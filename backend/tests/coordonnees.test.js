const { test } = require('node:test')
const assert = require('node:assert/strict')
const { vraiFetch, reponseJson, demarrer } = require('../tests/aide')

const PREVISIONS = {
  current: { temperature_2m: 14.2, weather_code: 3, wind_speed_10m: 9.5 },
  daily: {
    time: ['2026-10-20'],
    temperature_2m_max: [17.1],
    temperature_2m_min: [8.4],
    precipitation_sum: [0],
    weather_code: [3],
  },
}

// Simule Open-Meteo et renvoie la liste des appels externes effectués
function fauxOpenMeteo(t) {
  const appels = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const adresse = new URL(String(url))
    if (adresse.hostname.endsWith('open-meteo.com')) {
      appels.push(adresse.hostname)
      return reponseJson(PREVISIONS)
    }
    return vraiFetch(url, options)
  })
  return appels
}

test('/meteo?lat&lon : 200, sans géocodage, avec uniquement les coordonnées dans "lieu"', async (t) => {
  const appels = fauxOpenMeteo(t)
  const { base, fermer } = await demarrer()
  try {
    const res = await fetch(`${base}/meteo?lat=12.34&lon=56.78`)
    assert.equal(res.status, 200)

    const corps = await res.json()
    assert.deepEqual(corps.lieu, { latitude: 12.34, longitude: 56.78 })
    assert.equal(corps.actuel.temperature, 14.2)

    // Un seul appel externe, et c'est celui des prévisions : pas de géocodage
    assert.deepEqual(appels, ['api.open-meteo.com'])
  } finally {
    await fermer()
  }
})

test('/meteo : une seule coordonnée renvoie 400', async (t) => {
  const appels = fauxOpenMeteo(t)
  const { base, fermer } = await demarrer()
  try {
    assert.equal((await fetch(`${base}/meteo?lat=45`)).status, 400)
    assert.equal((await fetch(`${base}/meteo?lon=4`)).status, 400)
    assert.equal(appels.length, 0)
  } finally {
    await fermer()
  }
})

test('/meteo : coordonnées invalides renvoient 400, sans appel externe', async (t) => {
  const appels = fauxOpenMeteo(t)
  const { base, fermer } = await demarrer()
  try {
    const invalides = [
      'lat=abc&lon=4', // pas un nombre
      'lat=&lon=4', // chaîne vide (Number("") vaudrait 0 !)
      'lat=91&lon=4', // latitude hors plage
      'lat=45&lon=181', // longitude hors plage
      'lat=45&lon=Infinity', // pas un nombre fini
      'lat=1&lat=2&lon=4', // paramètre répété
    ]
    for (const q of invalides) {
      const res = await fetch(`${base}/meteo?${q}`)
      assert.equal(res.status, 400, `devrait refuser : ${q}`)
    }
    assert.equal(appels.length, 0)
  } finally {
    await fermer()
  }
})