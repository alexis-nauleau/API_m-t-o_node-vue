const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const meteoRouter = require('./routes/meteo')

// Une fonction qui fabrique l'appli : les tests peuvent en créer une avec
// un autre réglage (par exemple une limite de 3 requêtes au lieu de 30)
function creerApp({ limite = 30 } = {}) {
  const app = express()

  const limiteur = rateLimit({
    windowMs: 60 * 1000,
    limit: limite,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erreur: 'Trop de requêtes, réessaie dans une minute.' },
  })

  app.use(cors({ origin: 'http://localhost:5173' }))
  app.use('/meteo', limiteur, meteoRouter)

  app.get('/', (req, res) => {
    res.json({
      message: 'API météo',
      // L'adresse vient de la requête : plus besoin de connaître le port ici
      exemple: `${req.protocol}://${req.get('host')}/meteo?ville=Lyon`,
    })
  })

  return app
}

module.exports = { creerApp }