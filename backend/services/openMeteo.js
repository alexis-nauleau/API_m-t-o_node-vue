const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const METEO_URL = 'https://api.open-meteo.com/v1/forecast'

// Appel générique : timeout de 5 s, erreur si le statut n'est pas 2xx.
// Sans timeout, une API qui ne répond pas bloquerait ta requête indéfiniment.
async function appeler(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`API météo : statut ${res.status}`)
  return res.json()
}

// Transforme un nom de ville en coordonnées (géocodage)
async function chercherVille(nom) {
  const params = new URLSearchParams({ name: nom, count: '1', language: 'fr' })
  const data = await appeler(`${GEO_URL}?${params}`)
  const r = data.results?.[0] // "?." : pas d'erreur si "results" n'existe pas
  if (!r) return null
  return { nom: r.name, pays: r.country, latitude: r.latitude, longitude: r.longitude }
}

// Récupère la météo actuelle et les prévisions journalières
async function previsions(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    timezone: 'auto', // les dates sont dans le fuseau du lieu
  })
  return appeler(`${METEO_URL}?${params}`)
}

module.exports = { chercherVille, previsions }