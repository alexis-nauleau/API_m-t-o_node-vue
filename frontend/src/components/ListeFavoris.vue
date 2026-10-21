<script setup>
import { themeDe } from '../utils/themes'

// actif : l'identifiant de la ville actuellement affichée (pour la mettre en évidence)
defineProps({ favoris: Array, actif: [Number, String] })
defineEmits(['choisir', 'retirer'])

// "Auvergne-Rhône-Alpes, France" (la région peut manquer)
function detail(v) {
  return [v.region, v.pays].filter(Boolean).join(', ')
}
</script>

<template>
  <section v-if="favoris.length" class="favoris" aria-label="Villes favorites">
    <ul>
      
      <li
        v-for="v in favoris"
        :key="v.id"
        :class="{ actif: v.id === actif }"
        :data-theme="themeDe(v) ?? undefined"
      >
        <button type="button" class="ville" :title="detail(v)" @click="$emit('choisir', v)">
          <!-- aria-hidden : les cœurs sont décoratifs, un lecteur d'écran ne les lit pas -->
          <span v-if="themeDe(v)" class="coeur" aria-hidden="true">♥</span>
          {{ v.nom }}
          <span v-if="themeDe(v)" class="coeur" aria-hidden="true">♥</span>
        </button>
        <button
          type="button"
          class="retirer"
          :aria-label="`Retirer ${v.nom} (${detail(v)}) des favoris`"
          @click="$emit('retirer', v)"
        >
          ✕
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.favoris {
  margin-top: 12px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap; 
  gap: 10px; 
}
li {
  display: inline-flex;
  align-items: center;
  background: white;
  border: 1px solid #dde0ea;
  border-radius: 999px;
}
li.actif {
  border-color: #4db5ff;
  background: #eef6ff;
}
button {
  border: none;
  background: none;
  font-size: 15px;
  cursor: pointer;
  color: #333;
}
.ville {
  padding: 8px 4px 8px 14px;
}
.retirer {
  padding: 8px 12px 8px 6px;
  color: #aaa;
}
.retirer:hover {
  color: #c0203f;
}

/* ---- Thème Saint-Valentin ---- */

li[data-theme='valentin'] {
  border-color: #ff8fb1;
  background: #fff0f5;
  box-shadow: 0 0 0 2px #ffc2d6;
}
li[data-theme='valentin'].actif {
  border-color: #ff4d6d;
  box-shadow: 0 0 0 2px #ff8fb1;
}
li[data-theme='valentin'] .ville {
  color: #c1121f; 
  font-weight: 600;
}
li[data-theme='valentin'] .retirer {
  color: #d9718a;
}
.coeur {
  color: #ff4d6d;
  font-size: 0.9em;
}
</style>