const express = require('express')
const { chercherVille, previsions } = require('../services/openMeteo')

const router = express.Router()

// GET /meteo?ville=Lyon
router.get('/', async (req, res) => {
  // 1. On valide ce que l'utilisateur envoie : jamais de confiance aveugle
  const ville = String(req.query.ville || '').trim()
  if (ville.length < 2 || ville.length > 60) {
    return res.status(400).json({ erreur: 'Ville invalide (2 à 60 caractères).' })
  }

  try {
    // 2. Nom de ville vers coordonnées
    const lieu = await chercherVille(ville)
    if (!lieu) return res.status(404).json({ erreur: 'Ville introuvable.' })

    // 3. Prévisions
    const data = await previsions(lieu.latitude, lieu.longitude)

    // 4. On renvoie une forme simple, indépendante du format de l'API externe :
    //    si on change de fournisseur, le front n'a rien à modifier
    const d = data.daily
    res.json({
      lieu,
      actuel: {
        temperature: data.current.temperature_2m,
        vent: data.current.wind_speed_10m,
        code: data.current.weather_code,
      },
      jours: d.time.map((date, i) => ({
        date,
        max: d.temperature_2m_max[i],
        min: d.temperature_2m_min[i],
        pluie: d.precipitation_sum[i],
        code: d.weather_code[i],
      })),
    })
  } catch (e) {
    console.error(e)
    // 502 = "mauvaise passerelle" : notre serveur va bien, c'est l'API externe qui a échoué
    res.status(502).json({ erreur: 'Service météo indisponible.' })
  }
})

module.exports = router