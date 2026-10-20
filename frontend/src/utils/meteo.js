// Open-Meteo renvoie un "code météo" numérique (norme WMO).
const CODES = {
  0: ['☀️', 'Ciel dégagé'],
  1: ['🌤️', 'Plutôt dégagé'],
  2: ['⛅', 'Partiellement nuageux'],
  3: ['☁️', 'Couvert'],
  45: ['🌫️', 'Brouillard'],
  48: ['🌫️', 'Brouillard givrant'],
  51: ['🌦️', 'Bruine légère'],
  53: ['🌦️', 'Bruine'],
  55: ['🌦️', 'Bruine dense'],
  56: ['🌧️', 'Bruine verglaçante'],
  57: ['🌧️', 'Bruine verglaçante dense'],
  61: ['🌧️', 'Pluie faible'],
  63: ['🌧️', 'Pluie'],
  65: ['🌧️', 'Pluie forte'],
  66: ['🌧️', 'Pluie verglaçante'],
  67: ['🌧️', 'Pluie verglaçante forte'],
  71: ['🌨️', 'Neige faible'],
  73: ['🌨️', 'Neige'],
  75: ['🌨️', 'Neige forte'],
  77: ['🌨️', 'Grains de neige'],
  80: ['🌦️', 'Averses faibles'],
  81: ['🌧️', 'Averses'],
  82: ['🌧️', 'Averses violentes'],
  85: ['🌨️', 'Averses de neige'],
  86: ['🌨️', 'Fortes averses de neige'],
  95: ['⛈️', 'Orage'],
  96: ['⛈️', 'Orage avec grêle'],
  99: ['⛈️', 'Orage violent avec grêle'],
}

export function decrire(code) {
  // "??" prend la valeur de droite seulement si celle de gauche est undefined
  const [icone, texte] = CODES[code] ?? ['❓', 'Conditions inconnues']
  return { icone, texte }
}


export function arrondir(n) {
  return Math.round(n)
}

// "2026-10-20" devient "mardi 20 oct." (et "Aujourd'hui" pour le premier jour).
export function libelleJour(date, index) {
  if (index === 0) return "Aujourd'hui"
  // On ajoute midi : "2026-10-20" seul serait lu à minuit UTC et pourrait
  // tomber la veille dans certains fuseaux horaires
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}