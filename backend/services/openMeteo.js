// ============================================================
// À QUOI SERT CE FICHIER ?
// C'est le seul endroit qui parle à l'API Open-Meteo (le service externe).
// Les routes de ton serveur lui demandent des données sans savoir d'où
// elles viennent, ni si elles sortent du cache.
// ============================================================

// On importe la classe Cache du fichier voisin (le "./" veut dire "même dossier").
// Les accolades { } sélectionnent l'élément "Cache" exporté par cache.js.
const { Cache } = require('./cache')

// Les deux adresses de l'API. Il y en a deux car ce sont deux services :
//   GEO_URL   : transforme un nom de ville en coordonnées GPS
//   METEO_URL : donne la météo à partir de coordonnées GPS
// On les écrit en MAJUSCULES : par convention, ce sont des constantes
// (des valeurs qu'on ne change jamais).
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const METEO_URL = 'https://api.open-meteo.com/v1/forecast'

// Deux caches avec deux durées de vie, car les données ne changent pas
// au même rythme :
//   villes     : 24 h (Lyon ne se déplace pas)
//   prévisions : 15 min (la météo évolue, mais pas à la seconde)
// Calcul : 24 heures x 60 minutes x 60 secondes x 1000 millisecondes.
const cacheVilles = new Cache(24 * 60 * 60 * 1000)
const cachePrevisions = new Cache(15 * 60 * 1000)

// ------------------------------------------------------------
// appeler : fonction utilitaire qui télécharge une adresse et renvoie le JSON.
// "async" signifie que la fonction attend des choses lentes (le réseau).
// "await" met la fonction en pause jusqu'à la réponse, sans bloquer le serveur.
// ------------------------------------------------------------
async function appeler(url) {
  // fetch envoie la requête à Internet.
  // AbortSignal.timeout(5000) l'annule au bout de 5 secondes : sans ça, une API
  // qui ne répond pas ferait attendre ta requête indéfiniment.
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })

  // res.ok vaut false si le serveur répond par une erreur (404, 500...).
  // "throw new Error" déclenche une erreur : la fonction s'arrête ici, et
  // c'est le "catch" de routes/meteo.js qui la récupère.
  if (!res.ok) throw new Error(`API météo : statut ${res.status}`)

  // .json() transforme le texte reçu en objet JavaScript utilisable.
  return res.json()
}

// ------------------------------------------------------------
// chercherVille : nom de ville vers coordonnées GPS (avec cache).
// ------------------------------------------------------------
async function chercherVille(nom) {
  // On fabrique la clé du cache. trim() enlève les espaces autour,
  // toLowerCase() met en minuscules : "Lyon", "lyon" et " LYON "
  // donnent tous la clé "lyon" et partagent donc la même entrée.
  const cle = nom.trim().toLowerCase()

  // 1. A-t-on déjà la réponse en mémoire ?
  const enCache = cacheVilles.get(cle)
  if (enCache) {
    // HIT = "touché" : la réponse était en cache, aucun appel à Internet.
    console.log(`géocodage "${cle}" : cache HIT`)
    return enCache // on s'arrête là : la fonction renvoie directement la réponse
  }

  // MISS = "raté" : pas en cache, il faut interroger l'API.
  console.log(`géocodage "${cle}" : cache MISS, appel à l'API`)

  // 2. On fabrique l'adresse complète.
  // URLSearchParams assemble les paramètres (?name=Lyon&count=1...) et protège
  // les caractères spéciaux (espaces, accents) pour qu'ils passent dans une adresse.
  //   count: '1'      : on ne veut que le premier résultat
  //   language: 'fr'  : noms de lieux en français
  const params = new URLSearchParams({ name: nom, count: '1', language: 'fr' })
  const data = await appeler(`${GEO_URL}?${params}`)

  // 3. On prend le premier résultat.
  // "?." est l'accès prudent : si data.results n'existe pas (ville inconnue),
  // on obtient "undefined" au lieu d'une erreur qui ferait planter le serveur.
  const r = data.results?.[0]

  // Aucun résultat : on renvoie null. On ne le met PAS en cache, pour ne pas
  // mémoriser pendant 24 h une faute de frappe.
  if (!r) return null

  // 4. On ne garde que les champs utiles, avec nos propres noms.
  const lieu = { nom: r.name, pays: r.country, latitude: r.latitude, longitude: r.longitude }

  // 5. On range le résultat dans le cache pour les prochaines fois.
  cacheVilles.set(cle, lieu)
  return lieu
}

// ------------------------------------------------------------
// previsions : coordonnées GPS vers météo (avec cache).
// ------------------------------------------------------------
async function previsions(latitude, longitude) {
  // Clé du cache : les coordonnées arrondies à 2 décimales (environ 1 km).
  // Deux villes très proches partageront ainsi la même entrée.
  // toFixed(2) garde 2 chiffres après la virgule : 45.7578 devient "45.76".
  const cle = `${latitude.toFixed(2)},${longitude.toFixed(2)}`

  const enCache = cachePrevisions.get(cle)
  if (enCache) {
    console.log(`prévisions ${cle} : cache HIT`)
    return enCache
  }
  console.log(`prévisions ${cle} : cache MISS, appel à l'API`)

  // Les paramètres demandés à l'API :
  //   current  : les valeurs de maintenant (température, code météo, vent)
  //   daily    : les valeurs par jour (max, min, pluie, code météo)
  //   timezone : 'auto' donne les dates dans le fuseau horaire du lieu
  // Le "code météo" est un nombre (0 = ciel dégagé, 61 = pluie...) que le
  // front traduira en texte ou en icône.
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: 'temperature_2m,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    timezone: 'auto',
  })
  const data = await appeler(`${METEO_URL}?${params}`)

  // On range la réponse dans le cache. Cette ligne n'est atteinte que si
  // l'appel a réussi : en cas d'erreur, appeler() s'arrête avant, donc
  // une réponse ratée n'est jamais mémorisée.
  cachePrevisions.set(cle, data)
  return data
}

// On exporte les deux fonctions pour que routes/meteo.js puisse les utiliser.
// Les fonctions "appeler" et les caches restent privés : seuls ces deux
// noms sont visibles de l'extérieur.
module.exports = { chercherVille, previsions }