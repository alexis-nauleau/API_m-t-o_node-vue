
const { Cache } = require('./cache')

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const METEO_URL = 'https://api.open-meteo.com/v1/forecast'

// Trois caches, avec trois durées de vie, car les données ne changent pas
// au même rythme :

const cacheVilles = new Cache(24 * 60 * 60 * 1000)
const cachePrevisions = new Cache(15 * 60 * 1000)
const cacheRecherches = new Cache(60 * 60 * 1000)


async function appeler(url) {

  // AbortSignal.timeout(5000) l'annule au bout de 5 secondes : sans ça, une API qui ne répond pas ferait attendre ta requête indéfiniment.
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })

  // res.ok vaut false si le serveur répond par une erreur (404, 500...).
  // "throw new Error" déclenche une erreur : la fonction s'arrête ici, et
  // c'est le "catch" de la route qui la récupère.
  if (!res.ok) throw new Error(`API météo : statut ${res.status}`)

  return res.json()
}
// chercherVille : nom de ville vers coordonnées GPS (avec cache).
async function chercherVille(nom) {
  // Clé du cache : trim() enlève les espaces autour, toLowerCase() met en
  // minuscules. "Lyon", "lyon" et " LYON " donnent la clé "lyon" et partagent
  // donc la même entrée.
  const cle = nom.trim().toLowerCase()

  // 1. A-t-on déjà la réponse en mémoire ?
  const enCache = cacheVilles.get(cle)
  if (enCache) {
    // HIT = "touché" : la réponse était en cache, aucun appel à Internet.
    console.log(`géocodage "${cle}" : cache HIT`)
    return enCache // la fonction s'arrête ici et renvoie la réponse
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
  // front traduit en texte et en icône.
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

// ------------------------------------------------------------
// rechercherVilles : début de nom vers une LISTE de villes (autocomplétion).
// Contrairement à chercherVille, elle renvoie plusieurs résultats, nettoyés.
// ------------------------------------------------------------
async function rechercherVilles(texte) {
  const cle = texte.trim().toLowerCase()

  const enCache = cacheRecherches.get(cle)
  if (enCache) {
    console.log(`recherche "${cle}" : cache HIT`)
    return enCache
  }
  console.log(`recherche "${cle}" : cache MISS, appel à l'API`)

  // On demande 10 résultats alors qu'on n'en gardera que 5 : certains seront
  // écartés par le filtre ci-dessous (aéroports, îles...).
  const params = new URLSearchParams({ name: texte, count: '10', language: 'fr' })
  const data = await appeler(`${GEO_URL}?${params}`)

  // "data.results ?? []" : si results n'existe pas, on prend une liste vide
  // (un "?? []" évite que .filter plante sur undefined).
  // Les .filter, .sort, .slice et .map s'enchaînent : chacun reçoit la liste
  // produite par le précédent.
  const villes = (data.results ?? [])
    // .filter() garde les éléments qui respectent la condition.
    // Le feature_code décrit le type de lieu : "PPL..." = lieu habité.
    // On écarte les aéroports (AIRP), les îles (ISL), etc.
    .filter((r) => r.feature_code?.startsWith('PPL'))
    // .sort() trie. (b - a) trie du plus grand au plus petit : les villes les
    // plus peuplées en premier. "?? 0" : sans population connue, on compte 0.
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
    // .slice(0, 5) garde les 5 premiers éléments.
    .slice(0, 5)
    // .map() transforme chaque élément. On ne garde que l'utile : l'API renvoie
    // aussi, par exemple, plus de 250 codes postaux pour Lyon, inutiles ici.
    .map((r) => ({
      id: r.id, // identifiant unique du lieu, utile pour reconnaître un favori
      nom: r.name,
      region: r.admin1 ?? null, // ex : "Auvergne-Rhône-Alpes"
      pays: r.country ?? null,
      latitude: r.latitude,
      longitude: r.longitude,
    }))

  // Une liste vide est une réponse valide ("aucune ville ne correspond") :
  // on la mémorise aussi, contrairement à une erreur.
  cacheRecherches.set(cle, villes)
  return villes
}

// On exporte les trois fonctions pour que les routes puissent les utiliser.
// "appeler" et les caches restent privés : seuls ces trois noms sont visibles.
module.exports = { chercherVille, previsions, rechercherVilles }