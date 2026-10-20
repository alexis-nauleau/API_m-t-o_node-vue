<script setup>
import { computed } from 'vue'
import { decrire, arrondir } from '../utils/meteo'

const props = defineProps({ lieu: Object, actuel: Object })

// Se recalcule tout seul quand une nouvelle recherche change "actuel"
const condition = computed(() => decrire(props.actuel.code))
</script>

<template>
  <section class="carte actuelle">
    <h2>
      {{ lieu.nom }}<span v-if="lieu.pays">, {{ lieu.pays }}</span>
    </h2>
    <div class="principal">
      <!-- role="img" + aria-label : un lecteur d'écran lit le texte à la place de l'emoji -->
      <span class="icone" role="img" :aria-label="condition.texte">{{ condition.icone }}</span>
      <span class="temperature">{{ arrondir(actuel.temperature) }}°</span>
    </div>
    <p class="texte">{{ condition.texte }}</p>
    <p class="vent">Vent : {{ arrondir(actuel.vent) }} km/h</p>
  </section>
</template>

<style scoped>
h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 500;
}
.actuelle {
  text-align: center;
}
.principal {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}
.icone {
  font-size: 64px;
  line-height: 1;
}
.temperature {
  font-size: 64px;
  font-weight: 300;
}
.texte {
  margin: 4px 0;
  font-size: 18px;
}
.vent {
  margin: 4px 0 0;
  color: #777;
  font-size: 14px;
}
</style>