<script setup>
import { ref, onBeforeUnmount } from 'vue'

const API = 'http://localhost:3002'
const MIN_CARACTERES = 3 // en dessous, le backend répond 400
const DELAI_MS = 300 // pause de frappe avant d'envoyer la requête

// Message envoyé au parent quand l'utilisateur choisit une ville
const emit = defineEmits(['choisir'])

const texte = ref('') // ce qui est écrit dans le champ
const suggestions = ref([]) // les villes proposées
const ouvert = ref(false) // le menu est-il affiché ?
const actif = ref(-1) // position de la suggestion en surbrillance (-1 = aucune)
const chargement = ref(false) // une requête est en attente
const erreur = ref('')
const termine = ref(false) // true quand une recherche vient de se terminer

let minuteur = null // le délai avant envoi (debounce)
let controle = null // permet d'annuler la requête en cours

// Annule le délai en attente ET la requête en cours
function annuler() {
  clearTimeout(minuteur)
  controle?.abort()
  controle = null
}

// Appelée à chaque frappe. On n'utilise pas v-model : ça évite que
// choisir() (qui écrit le nom de la ville dans le champ) relance une recherche.
function surSaisie(e) {
  texte.value = e.target.value
  annuler()
  actif.value = -1
  erreur.value = ''
  termine.value = false

  const q = texte.value.trim()
  if (q.length < MIN_CARACTERES) {
    suggestions.value = []
    ouvert.value = false
    chargement.value = false
    return
  }

  chargement.value = true
  ouvert.value = true
  // Debounce : si l'utilisateur retape avant 300 ms, annuler() supprime ce minuteur
  minuteur = setTimeout(() => rechercher(q), DELAI_MS)
}

async function rechercher(q) {
  const mien = new AbortController()
  controle = mien
  try {
    const res = await fetch(`${API}/villes?q=${encodeURIComponent(q)}`, { signal: mien.signal })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.erreur || 'Recherche indisponible.')
    suggestions.value = Array.isArray(data) ? data : []
  } catch (e) {
    if (e.name === 'AbortError') return // une recherche plus récente a pris le relais
    suggestions.value = []
    // fetch lève un TypeError quand il n'atteint pas le serveur
    erreur.value = e instanceof TypeError ? 'Serveur injoignable. Le backend est-il lancé ?' : e.message
  } finally {
    // Seule la requête la plus récente met à jour l'état : une réponse annulée
    // ou périmée ne doit pas éteindre le "Recherche…" d'une requête plus récente
    if (controle === mien) {
      chargement.value = false
      termine.value = true
      controle = null
    }
  }
}

function choisir(ville) {
  annuler()
  texte.value = ville.nom
  suggestions.value = []
  ouvert.value = false
  actif.value = -1
  chargement.value = false
  termine.value = false
  emit('choisir', ville)
}

function surTouche(e) {
  const n = suggestions.value.length
  if (e.key === 'ArrowDown' && n) {
    e.preventDefault() // empêche le curseur de sauter au début du champ
    ouvert.value = true
    actif.value = (actif.value + 1) % n
  } else if (e.key === 'ArrowUp' && n) {
    e.preventDefault()
    ouvert.value = true
    actif.value = (actif.value - 1 + n) % n
  } else if (e.key === 'Enter') {
    // Pendant le chargement, la liste affichée peut être celle d'une recherche
    // précédente : on ne valide rien dans ce cas
    if (!ouvert.value || chargement.value || !n) return
    e.preventDefault()
    choisir(suggestions.value[actif.value >= 0 ? actif.value : 0])
  } else if (e.key === 'Escape') {
    ouvert.value = false
    actif.value = -1
  }
}

function surFocus() {
  if (suggestions.value.length) ouvert.value = true
}

// "Auvergne-Rhône-Alpes, France" (la région peut manquer)
function detail(v) {
  return [v.region, v.pays].filter(Boolean).join(', ')
}

onBeforeUnmount(annuler)
</script>

<template>
  <div class="recherche">
    <!-- Attributs role / aria-* : ils décrivent le menu aux lecteurs d'écran -->
    <input
      class="champ"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-controls="liste-villes"
      :aria-expanded="ouvert && suggestions.length > 0"
      :aria-activedescendant="actif >= 0 ? `ville-${actif}` : undefined"
      autocomplete="off"
      placeholder="Une ville (3 lettres minimum)…"
      :value="texte"
      @input="surSaisie"
      @keydown="surTouche"
      @focus="surFocus"
      @blur="ouvert = false"
    />

    <!-- mousedown.prevent : cliquer dans le menu ne retire pas le focus du champ,
         sinon @blur fermerait le menu avant que le clic soit pris en compte -->
    <div v-show="ouvert" class="menu" @mousedown.prevent>
      <ul v-if="suggestions.length" id="liste-villes" role="listbox">
        <li
          v-for="(v, i) in suggestions"
          :id="`ville-${i}`"
          :key="v.id"
          role="option"
          :aria-selected="i === actif"
          :class="{ actif: i === actif }"
          @click="choisir(v)"
          @mousemove="actif = i"
        >
          <strong>{{ v.nom }}</strong>
          <span>{{ detail(v) }}</span>
        </li>
      </ul>

      <p v-if="chargement && !suggestions.length" class="message">Recherche…</p>
      <p v-else-if="erreur" class="message erreur">{{ erreur }}</p>
      <p v-else-if="termine && !suggestions.length" class="message">Aucune ville trouvée.</p>
    </div>
  </div>
</template>

<style scoped>
.recherche {
  position: relative; /* le menu se place par rapport à ce bloc */
}
.champ {
  width: 100%;
  padding: 10px;
  border: 1px solid #dde0ea;
  border-radius: 8px;
  font-size: 16px; /* en dessous de 16 px, Safari sur iPhone zoome à la saisie */
}
.menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10; /* au-dessus des cartes qui suivent */
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border: 1px solid #dde0ea;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}
ul {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}
li {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  cursor: pointer;
}
li.actif {
  background: #eef6ff;
}
li span {
  font-size: 13px;
  color: #777;
}
.message {
  margin: 0;
  padding: 12px;
  color: #777;
  font-size: 14px;
}
.erreur {
  color: #c0203f;
}
</style>