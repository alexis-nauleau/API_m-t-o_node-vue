const express = require('express')
const { rechercherVilles } = require('../services/openMeteo')
const router = express.Router()


// Le "/" ci-dessous est relatif au branchement : ici, il correspond à "/villes".
// req = la requête reçue, res = la réponse qu'on renvoie.
router.get('/', async (req, res) => {

  // String(... || '') évite un plantage si "q" manque ; trim() enlève les espaces.
  const q = String(req.query.q || '').trim()

  // 2. On valide AVANT d'appeler l'API  En dessous de 3 caractères, l'API ne fait pas de
  // recherche approchée
  // 400 = "requête incorrecte" : c'est l'appelant qui s'est trompé.
  if (q.length < 3 || q.length > 60) {
    return res.status(400).json({ erreur: 'Recherche invalide (3 à 60 caractères).' })
  }

  try {
    // 3. On renvoie la liste (éventuellement vide) au format JSON.
    res.json(await rechercherVilles(q))
  } catch (e) {
    // 4. Si l'API externe a échoué, on garde la trace dans le terminal...
    console.error(e)
    // ...et on répond 502 ("mauvaise passerelle") : notre serveur va bien,
    // c'est le service externe qui n'a pas répondu.
    res.status(502).json({ erreur: 'Service météo indisponible.' })
  }
})

module.exports = router