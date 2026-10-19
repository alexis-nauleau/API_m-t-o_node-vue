// ============================================================
// À QUOI SERT CE FICHIER ?
// Un cache est une petite mémoire qui garde une réponse pendant un moment.
// Au lieu de redemander la même chose à Internet (lent), on réutilise
// ce qu'on a déjà. Chaque réponse a une date d'expiration.
// ============================================================

// Une "class" est un modèle pour fabriquer des objets.
// Ici, chaque "new Cache(...)" crée un cache indépendant, avec sa propre mémoire
// et sa propre durée de vie.
class Cache {
  // Le "constructor" s'exécute une seule fois, quand on écrit "new Cache(...)".
  // Il reçoit deux réglages :
  //   dureeMs : combien de temps une réponse reste valable, en millisecondes
  //   max     : combien de réponses on garde au maximum (500 par défaut)
  constructor(dureeMs, max = 500) {
    // "this" désigne CE cache précis. On range les réglages dedans.
    this.duree = dureeMs
    this.max = max

    // Une Map est une boîte à étiquettes : on range une valeur sous une clé
    // (par exemple la clé "lyon" pour la réponse concernant Lyon).
    // Elle se souvient aussi de l'ordre dans lequel on a ajouté les éléments.
    this.map = new Map()
  }

  // get : "as-tu une réponse pour cette clé ?"
  // Renvoie la réponse si elle existe et n'a pas expiré, sinon "undefined" (rien).
  get(cle) {
    const entree = this.map.get(cle)

    // Pas d'entrée pour cette clé : on n'a rien à donner.
    if (!entree) return undefined

    // Date.now() = l'heure actuelle en millisecondes.
    // Si elle dépasse l'heure d'expiration, la réponse est trop vieille.
    if (Date.now() > entree.expire) {
      this.map.delete(cle) // on la jette
      return undefined
    }

    return entree.valeur // réponse valable : on la rend
  }

  // set : "range cette réponse sous cette clé"
  set(cle, valeur) {
    // On supprime d'abord l'ancienne version si elle existe. Ça la fait passer
    // en fin de file quand on la rajoute (utile pour la ligne suivante).
    this.map.delete(cle)

    // Si le cache est plein, on supprime l'entrée la plus ancienne pour faire
    // de la place. Sans cette limite, la mémoire du serveur grossirait sans fin.
    //   this.map.keys() liste les clés dans l'ordre d'ajout
    //   .next().value prend la première, donc la plus ancienne
    if (this.map.size >= this.max) {
      this.map.delete(this.map.keys().next().value)
    }

    // On range la réponse avec son heure d'expiration :
    // maintenant + la durée de vie du cache.
    this.map.set(cle, { valeur, expire: Date.now() + this.duree })
  }
}

// module.exports rend la classe utilisable dans d'autres fichiers.
// Les accolades { Cache } permettent de l'importer par son nom avec
// require('./cache'), comme le fait openMeteo.js.
module.exports = { Cache }