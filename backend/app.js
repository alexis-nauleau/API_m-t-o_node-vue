const express = require('express')
const cors = require('cors') 
const rateLimit = require('express-rate-limit') 
const meteoRouter = require('./routes/meteo')
const villesRouter = require('./routes/villes')

// ------------------------------------------------------------
// Les deux routes ont la même mécanique, mais pas la même limite : on écrit
// donc la fabrication une seule fois, et la limite devient un paramètre.
// ------------------------------------------------------------
function fabriquerLimiteur(limit) {
  return rateLimit({
    windowMs: 60 * 1000, // fenêtre de 1 minute
    limit, // nombre maximum de requêtes dans la fenêtre, par adresse IP
    standardHeaders: true, // ajoute les en-têtes RateLimit-* (requêtes restantes...)
    legacyHeaders: false, // pas les anciens en-têtes X-RateLimit-*
    // Au-delà de la limite, le serveur répond 429 ("Too Many Requests")
    // avec ce message, sans exécuter la route.
    message: { erreur: 'Trop de requêtes, réessaie dans une minute.' },
  })
}

// ------------------------------------------------------------
// Les paramètres sont entre accolades avec une valeur par défaut :
//   creerApp()                  limite = 30 et limiteVilles = 120
//   creerApp({ limite: 3 })     limite = 3, et limiteVilles reste à 120
// Le "= {}" final permet d'appeler creerApp() sans rien lui passer.
// ------------------------------------------------------------
function creerApp({ limite = 30, limiteVilles = 120 } = {}) {
  const app = express()

  // CORS : sans lui, le navigateur bloque les appels du front (port 5173) vers
  // l'API (port 3002), car ce sont deux adresses différentes.
  app.use(cors({ origin: 'http://localhost:5173' }))

  // app.use('/chemin', limiteur, routeur) : toute requête vers /meteo passe
  // d'abord par le limiteur, puis seulement par la route. L'ORDRE compte :
  // le limiteur doit être placé AVANT la route pour l'intercepter.
  app.use('/meteo', fabriquerLimiteur(limite), meteoRouter)

  // /villes a sa propre limite, plus large : l'autocomplétion envoie une
  // requête à chaque pause de frappe, bien plus qu'une recherche de météo.
  app.use('/villes', fabriquerLimiteur(limiteVilles), villesRouter)

  // Page d'accueil : confirme que le serveur tourne et montre un exemple.
  // L'adresse est reconstruite à partir de la requête : plus besoin de
  // connaître le numéro de port dans ce fichier.
  app.get('/', (req, res) => {
    res.json({
      message: 'API météo',
      exemple: `${req.protocol}://${req.get('host')}/meteo?ville=Lyon`,
    })
  })

  return app
}

// On exporte la fonction pour index.js et pour les tests.
module.exports = { creerApp }