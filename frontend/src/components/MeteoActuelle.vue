<script setup>

// computed sert à fabriquer une valeur qui se recalcule toute seule.
import { computed } from 'vue'
import { decrire, arrondir } from '../utils/meteo'
import { themeDe } from '../utils/themes'

//  "Déclare les données(objets) que le parent doit m'envoyer."

const props = defineProps({ lieu: Object, actuel: Object, favori: Boolean })

//  "Déclare le message que je peux envoyer au parent." (passer de favori à non-favori).
defineEmits(['basculer-favori'])

const condition = computed(() => decrire(props.actuel.code))
const theme = computed(() => themeDe(props.lieu))
</script>

<template>
  <!--la valeur est theme ; mais si theme vaut null,prends undefined à la place".
       Avec Vue, un attribut dont la valeur est undefined n'est PAS écrit du tout. -->
  <section class="carte actuelle" :data-theme="theme ?? undefined">
    <!-- crée ces éléments que si le thème est'doudounette'". 
         aria-hidden="true" : les lecteurs d'écran ignorent ces cœurs décoratifs. -->
    <template v-if="theme === 'doudounette'">
      <span v-for="n in 6" :key="n" class="coeur" :class="`c${n}`" aria-hidden="true">♥</span>
    </template>

    <div class="entete">
      <h2>
        {{ lieu.nom }}
        <span v-if="lieu.region">, {{ lieu.region }}</span
        ><span v-if="lieu.pays">, {{ lieu.pays }}</span> <!-- affiche ce <span> que si lieu region existe -->
      </h2>

      <!-- 
           ajoute en plus la classe 'plein' SI favori est vrai
           :aria-pressed="favori" : indique aux lecteurs d'écran si le bouton est  vrai ou  faux
           :aria-label="..." : le texte lu par un lecteur d'écran, car le bouton ne
             contient qu'un dessin. "favori ? A : B" se lit "si favori, alors A, sinon B".
           :title="..." : le texte qui apparaît au survol de la souris.
           @click="$emit('basculer-favori')" : "au clic, envoie le message
             'basculer-favori' au parent". C'est le parent qui décide quoi faire. -->
      <button
        type="button"
        class="etoile"
        :class="{ plein: favori }"
        :aria-pressed="favori"
        :aria-label="favori ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        :title="favori ? 'Retirer des favoris' : 'Ajouter aux favoris'"
        @click="$emit('basculer-favori')"
      >

        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"
          />
        </svg>
      </button>
    </div>

    <div class="principal">
      <!-- role="img" : "ce <span> joue le rôle d'une image".
           :aria-label="condition.texte" : "le texte lu par un lecteur d'écran",
           car il ne lirait sinon qu'un symbole emoji. -->
      <span class="icone" role="img" :aria-label="condition.texte">{{ condition.icone }}</span>
      <!-- Traduction : "affiche la température actuelle, arrondie, suivie de °".
           Si temperature vaut 14.2, arrondir() renvoie 14 et on lit "14°". -->
      <span class="temperature">{{ arrondir(actuel.temperature) }}°</span>
    </div>
    <!-- Le texte de la condition : "Pluie faible", "Ciel dégagé"... -->
    <p class="texte">{{ condition.texte }}</p>
    <!-- "Vent : 9 km/h" (la vitesse est arrondie) -->
    <p class="vent">Vent : {{ arrondir(actuel.vent) }} km/h</p>
  </section>
</template>


<style scoped>

.actuelle {
  text-align: center; 
  position: relative; 
  overflow: hidden; /* ce qui dépasse de la carte est coupé :*/
}


.entete {
  display: flex; 
  justify-content: center; 
  align-items: center; 
  gap: 8px; /* 8 pixels d'espace entre le nom et l'étoile */
  margin-bottom: 8px; 
}

/* Le nom de la ville */
h2 {
  margin: 0;
  min-width: 0; 
  font-size: 18px;
  font-weight: 500; 
}

.etoile {
  --contour: #555; 
  --remplie: none; 
  flex: none; /* ne rétrécit jamais, même avec un long titre */
  border: none;
  background: none;
  padding: 6px; 
  cursor: pointer;
  line-height: 0; 
}
.etoile svg {
  width: 40px; 
  height: 40px;
  display: block; /* évite un petit espace sous le dessin */
  fill: var(--remplie); 
  stroke: var(--contour); 
  stroke-width: 2.2; 
  stroke-linejoin: round; /* pointes légèrement arrondies */
  transition: transform 0.15s; 
}

.etoile.plein {
  --contour: #b86e00;
  --remplie: #ffb703;
}

.etoile:hover svg {
  transform: scale(1.12);
}

.etoile:focus-visible {
  outline: 3px solid #4db5ff;
  outline-offset: 2px;
  border-radius: 50%;
}


.principal {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

/* La grande icône emoji */
.icone {
  font-size: 64px;
  line-height: 1;
}

/* La grande température */
.temperature {
  font-size: 64px;
  font-weight: 300; 
}

/* "Pluie faible", "Ciel dégagé */
.texte {
  margin: 4px 0;
  font-size: 18px;
}

/* La ligne du vent  */
.vent {
  margin: 4px 0 0; 
  color: #777;
  font-size: 14px;
}

/* ============================================================
   [THÈME] SAINT-doudounette
   ============================================================ */

/* Le fond et le contour de la carte */
.actuelle[data-theme='doudounette'] {
  background: linear-gradient(160deg, #fff0f5, #ffe0ec); 
  border: 2px solid #ff8fb1; 
  box-shadow: 0 6px 20px rgba(255, 77, 109, 0.18); 
}

/* Le nom, la température et le texte  */
.actuelle[data-theme='doudounette'] h2,
.actuelle[data-theme='doudounette'] .temperature,
.actuelle[data-theme='doudounette'] .texte {
  color: #c1121f; 
}

/* La ligne du vent : */
.actuelle[data-theme='doudounette'] .vent {
  color: #8c3b55;
}

/* L'étoile du thème  */
.actuelle[data-theme='doudounette'] .etoile {
  --contour: #c1121f; 
}
.actuelle[data-theme='doudounette'] .etoile.plein {
  --contour: #c1121f;
  --remplie: #ff4d6d; 
}

/* Les contenus passent AU-DESSUS des cœurs.
   Traduction du sélecteur : "tout enfant direct de .actuelle (>) qui n'est pas
   un .coeur (:not)".  */
.actuelle > :not(.coeur) {
  position: relative;
  z-index: 1;
}

/* Les cœurs décoratifs */
.coeur {
  position: absolute; 
  color: #ff4d6d;
  opacity: 0.75; 
  pointer-events: none; /* les cœurs ne bloquent jamais un clic */
  animation: flotter 3.5s ease-in-out infinite; 
}


.c1 { top: 8px; left: 12px; font-size: 20px; --rot: -15deg; }
.c2 { top: 14px; right: 14px; font-size: 26px; --rot: 12deg; animation-delay: 0.6s; }
.c3 { top: 46%; left: 6px; font-size: 16px; --rot: -8deg; animation-delay: 1.2s; }
.c4 { top: 50%; right: 8px; font-size: 18px; --rot: 10deg; animation-delay: 0.3s; }
.c5 { bottom: 10px; left: 18px; font-size: 24px; --rot: 14deg; animation-delay: 0.9s; }
.c6 { bottom: 8px; right: 20px; font-size: 20px; --rot: -12deg; animation-delay: 1.5s; }


@keyframes flotter {
  0%, 100% { transform: translateY(0) rotate(var(--rot)); }
  50% { transform: translateY(-6px) rotate(var(--rot)); }
}

/* Pour qui a demandé "réduire les animations" dans son système :
   les cœurs restent immobiles, et l'étoile ne grossit plus au survol. */
@media (prefers-reduced-motion: reduce) {
  .coeur { animation: none; transform: rotate(var(--rot)); }
  .etoile svg { transition: none; }
  .etoile:hover svg { transform: none; }
}
</style>