<script setup>
import { ref } from 'vue'
import RechercheVille from './components/RechercheVille.vue'
import MeteoActuelle from './components/MeteoActuelle.vue'
import PrevisionsJours from './components/PrevisionsJours.vue'

const API = 'http://localhost:3002'

// Ce qu'on affiche : { lieu, actuel, jours }. Le nom du lieu vient de la liste
// de l'autocomplétion : /meteo?lat&lon ne renvoie que des coordonnées.
const affichage = ref(null)
const erreur = ref('')
const chargement = ref(false)

// Une réponse lente ne doit pas écraser un choix plus récent
let dernierChoix = 0

async function chargerMeteo(ville) {
  const numero = ++dernierChoix
  erreur.value = ''
  chargement.value = true

  try {
    const params = new URLSearchParams({ lat: ville.latitude, lon: ville.longitude })
    const res = await fetch(`${API}/meteo?${params}`)
    const data = await res.json().catch(() => ({}))

    if (numero !== dernierChoix) return

    if (!res.ok) {
      erreur.value = data.erreur || 'Une erreur est survenue.'
      affichage.value = null
      return
    }
    affichage.value = { lieu: ville, actuel: data.actuel, jours: data.jours }
  } catch (e) {
    if (numero !== dernierChoix) return
    erreur.value = 'Serveur injoignable. Le backend est-il lancé ?'
    affichage.value = null
  } finally {
    if (numero === dernierChoix) chargement.value = false
  }
}
</script>

<template>
  <main>
    <h1>Météo</h1>

    <RechercheVille @choisir="chargerMeteo" />

    <p v-if="chargement" class="info">Chargement…</p>
    <p v-if="erreur" class="erreur">{{ erreur }}</p>

    <template v-if="affichage">
      <MeteoActuelle :lieu="affichage.lieu" :actuel="affichage.actuel" />
      <PrevisionsJours :jours="affichage.jours" />
    </template>
  </main>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
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