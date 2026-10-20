const express = require('express')
const { chercherVille, previsions } = require('../services/openMeteo')

const router = express.Router()

// Convertit un paramètre d'adresse en nombre compris entre min et max.
// Renvoie null si la valeur est invalide.
// Piège évité : Number('') vaut 0. Sans le test sur la chaîne vide,
// "?lat=" serait pris pour l'équateur au lieu d'être refusé.
// typeof : si le paramètre est répété (?lat=1&lat=2), on reçoit un tableau : refusé aussi.
function lireNombre(valeur, min, max) {
  if (typeof valeur !== 'string' || valeur.trim() === '') return null
  const n = Number(valeur)
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

// Met la réponse d'Open-Meteo dans NOTRE format, indépendant du fournisseur
function formater(lieu, data) {
  const d = data.daily
  return {
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
  }
}

// GET /meteo?ville=Lyon            (comportement d'origine)
// GET /meteo?lat=45.75&lon=4.85    (nouveau : coordonnées d'une ville choisie)
router.get('/', async (req, res) => {
  const { lat, lon, ville } = req.query

  try {
    let lieu

    if (lat !== undefined || lon !== undefined) {
      // Mode coordonnées : si l'une des deux est présente, les deux sont exigées
      const latitude = lireNombre(lat, -90, 90)
      const longitude = lireNombre(lon, -180, 180)
      if (latitude === null || longitude === null) {
        return res
          .status(400)
          .json({ erreur: 'Coordonnées invalides (lat entre -90 et 90, lon entre -180 et 180).' })
      }
      // On ne connaît pas le nom du lieu : c'est le front qui l'affiche
      lieu = { latitude, longitude }
    } else {
      // Mode nom de ville, inchangé
      const nom = String(ville || '').trim()
      if (nom.length < 2 || nom.length > 60) {
        return res.status(400).json({ erreur: 'Ville invalide (2 à 60 caractères).' })
      }
      lieu = await chercherVille(nom)
      if (!lieu) return res.status(404).json({ erreur: 'Ville introuvable.' })
    }

    const data = await previsions(lieu.latitude, lieu.longitude)
    res.json(formater(lieu, data))
  } catch (e) {
    console.error(e)
    // 502 : notre serveur va bien, c'est l'API externe qui a échoué
    res.status(502).json({ erreur: 'Service météo indisponible.' })
  }
})

module.exports = router