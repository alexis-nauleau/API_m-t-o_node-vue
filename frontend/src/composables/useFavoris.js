import { ref, onBeforeUnmount } from 'vue'

const CLE = 'meteo.favoris' // nom sous lequel la liste est rangée dans le navigateur
const MAX = 8

// On ne garde que les champs utiles, avec le bon type.
function nettoyer(v) {
  return {
    id: v.id,
    nom: v.nom,
    region: typeof v.region === 'string' ? v.region : null,
    pays: typeof v.pays === 'string' ? v.pays : null,
    latitude: v.latitude,
    longitude: v.longitude,
  }
}

// Une ville est valable si elle a un identifiant, un nom et des coordonnées réalistes.
// On vérifie même ce qu'on lit dans localStorage : l'utilisateur (ou une extension)
// peut l'avoir modifié, et le contenu ne vient pas forcément de notre code.
function valide(v) {
  return (
    v !== null &&
    typeof v === 'object' &&
    v.id !== undefined &&
    v.id !== null &&
    typeof v.nom === 'string' &&
    v.nom !== '' &&
    Number.isFinite(v.latitude) &&
    Number.isFinite(v.longitude) &&
    Math.abs(v.latitude) <= 90 &&
    Math.abs(v.longitude) <= 180
  )
}

// Lit la liste. Renvoie [] si elle est absente, illisible ou abîmée :
// une liste vide plutôt qu'une page cassée.
function lire() {
  try {
    const data = JSON.parse(localStorage.getItem(CLE) ?? '[]')
    if (!Array.isArray(data)) return []

    const vus = new Set() // pour écarter les doublons d'identifiant
    const liste = []
    for (const v of data) {
      if (!valide(v) || vus.has(v.id)) continue
      vus.add(v.id)
      liste.push(nettoyer(v))
      if (liste.length === MAX) break
    }
    return liste
  } catch {
    // JSON invalide, ou localStorage inaccessible (certains navigateurs en navigation privée)
    return []
  }
}

// Écrit la liste. Renvoie false si l'écriture échoue (stockage plein ou interdit).
function ecrire(liste) {
  try {
    localStorage.setItem(CLE, JSON.stringify(liste))
    return true
  } catch {
    return false
  }
}

// À appeler UNE SEULE FOIS (dans App.vue) : chaque appel crée sa propre liste.
export function useFavoris() {
  const favoris = ref(lire())
  const message = ref('') // un message d'information à afficher, ou ''

  const estFavori = (ville) => favoris.value.some((f) => f.id === ville.id)

  function basculer(ville) {
    message.value = ''
    if (estFavori(ville)) return retirer(ville)
    if (!valide(ville)) return
    if (favoris.value.length >= MAX) {
      message.value = `${MAX} favoris maximum : retires-en un avant d'en ajouter.`
      return
    }
    appliquer([...favoris.value, nettoyer(ville)])
  }

  function retirer(ville) {
    message.value = ''
    appliquer(favoris.value.filter((f) => f.id !== ville.id))
  }

  function appliquer(liste) {
    favoris.value = liste // l'écran se met à jour tout de suite
    if (!ecrire(liste)) {
      message.value = "Impossible d'enregistrer : tes favoris ne seront pas conservés."
    }
  }

  // Si les favoris changent dans un AUTRE onglet, on se met à jour.
  // L'événement "storage" ne se déclenche que dans les autres onglets, jamais dans celui
  // qui a écrit : pas de boucle.
  function surStockage(e) {
    if (e.key === CLE || e.key === null) favoris.value = lire()
  }
  window.addEventListener('storage', surStockage)
  onBeforeUnmount(() => window.removeEventListener('storage', surStockage))

  return { favoris, message, estFavori, basculer, retirer }
}