<script setup>
import { ref } from 'vue'
import MeteoActuelle from './components/MeteoActuelle.vue'
import PrevisionsJours from './components/PrevisionsJours.vue'

const API = 'http://localhost:3002'

const ville = ref('')
const meteo = ref(null)
const erreur = ref('')
const chargement = ref(false)

// Une réponse lente ne doit pas écraser une recherche plus récente
let derniereRecherche = 0

async function chercher() {
  const nom = ville.value.trim()
  if (nom.length < 2) {
    erreur.value = 'Tape au moins 2 caractères.'
    return
  }

  const numero = ++derniereRecherche
  erreur.value = ''
  chargement.value = true

  try {
    const res = await fetch(`${API}/meteo?ville=${encodeURIComponent(nom)}`)
    const data = await res.json().catch(() => ({}))

    if (numero !== derniereRecherche) return

    if (!res.ok) {
      erreur.value = data.erreur || 'Une erreur est survenue.'
      meteo.value = null
      return
    }
    meteo.value = data
  } catch (e) {
    if (numero !== derniereRecherche) return
    erreur.value = 'Serveur injoignable. Le backend est-il lancé ?'
    meteo.value = null
  } finally {
    if (numero === derniereRecherche) chargement.value = false
  }
}
</script>

<template>
  <main>
    <h1>Météo</h1>

    <form class="recherche" @submit.prevent="chercher">
      <input v-model="ville" class="champ" placeholder="Une ville…" />
      <button type="submit" class="bouton" :disabled="chargement">Chercher</button>
    </form>

    <p v-if="chargement" class="info">Chargement…</p>
    <p v-if="erreur" class="erreur">{{ erreur }}</p>

    <!-- Le <template> regroupe deux composants sans ajouter de balise HTML -->
    <template v-if="meteo">
      <MeteoActuelle :lieu="meteo.lieu" :actuel="meteo.actuel" />
      <PrevisionsJours :jours="meteo.jours" />
    </template>
  </main>
</template>

<!-- Style global (sans scoped) : s'applique à toute la page, y compris la classe .carte
     utilisée par les deux composants -->
<style>
*,
*::before,
*::after {
  box-sizing: border-box; /* padding et bordures comptés dans la largeur */
}
body {
  margin: 0;
  background: #eef0f6;
  font-family: system-ui, sans-serif;
  color: #333;
}
#app {
  max-width: 600px;
  margin: 0 auto;
}
.carte {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
}
</style>

<style scoped>
main {
  padding: 16px;
}
h1 {
  margin: 0 0 16px;
  font-size: 24px;
}
.recherche {
  display: flex;
  gap: 8px;
}
.champ {
  flex: 1;
  min-width: 0; /* un champ refuse de rétrécir sans ça, et déborde sur mobile */
  padding: 10px;
  border: 1px solid #dde0ea;
  border-radius: 8px;
  font-size: 16px; /* en dessous de 16 px, Safari sur iPhone zoome à la saisie */
}
.bouton {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #4db5ff;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
.bouton:disabled {
  opacity: 0.6;
  cursor: wait;
}
.info {
  color: #777;
}
.erreur {
  padding: 12px;
  border-radius: 8px;
  background: #ffe5ea;
  color: #c0203f;
}
</style>