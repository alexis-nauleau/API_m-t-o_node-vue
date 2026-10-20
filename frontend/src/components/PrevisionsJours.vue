<script setup>
import { decrire, arrondir, libelleJour } from '../utils/meteo'

defineProps({ jours: Array })
</script>

<template>
  <section class="carte">
    <h2>Prévisions sur {{ jours.length }} jours</h2>
    <ul>
      <!-- (j, i) : j = le jour, i = sa position (0 = aujourd'hui) -->
      <li v-for="(j, i) in jours" :key="j.date">
        <span class="jour">{{ libelleJour(j.date, i) }}</span>
        <span class="icone" role="img" :aria-label="decrire(j.code).texte" :title="decrire(j.code).texte">
          {{ decrire(j.code).icone }}
        </span>
        <!-- On n'affiche la pluie que s'il y en a : "0.0 mm" partout alourdirait la lecture -->
        <span class="pluie">{{ j.pluie > 0 ? `${j.pluie.toFixed(1)} mm` : '' }}</span>
        <span class="temps">
          <strong>{{ arrondir(j.max) }}°</strong>
          <span class="min">{{ arrondir(j.min) }}°</span>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
h2 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #555;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
li {
  display: grid;
  /* minmax(0, 1fr) : la colonne du jour peut rétrécir sur un petit écran */
  grid-template-columns: minmax(0, 1fr) 32px 64px 64px;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f1f6;
  font-size: 15px;
}
li:last-child {
  border-bottom: none;
}
.jour {
  text-transform: capitalize;
}
.icone {
  font-size: 22px;
  text-align: center;
}
.pluie {
  color: #3b82c4;
  font-size: 13px;
  text-align: right;
}
.temps {
  text-align: right;
}
.min {
  margin-left: 8px;
  color: #999;
}
</style>