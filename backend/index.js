const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const meteoRouter = require('./routes/meteo')

const app = express()
const PORT = process.env.PORT || 3002 // 3002 : le projet budget utilise 3001

// Limiteur : 30 requêtes par minute et par adresse IP.
// Au-delà, le serveur répond 429 ("Too Many Requests") sans exécuter la route.
const limiteur = rateLimit({
  windowMs: 60 * 1000, // fenêtre de 1 minute
  limit: 30, // nombre maximum de requêtes dans la fenêtre
  standardHeaders: true, // ajoute les en-têtes RateLimit-* (reste, réinitialisation)
  legacyHeaders: false, // pas les anciens en-têtes X-RateLimit-*
  message: { erreur: 'Trop de requêtes, réessaie dans une minute.' },
})

// Pas de cookies ici : un CORS simple suffit
app.use(cors({ origin: 'http://localhost:5173' }))

// Le limiteur est placé AVANT la route : il doit intercepter la requête en premier
app.use('/meteo', limiteur, meteoRouter)

// Page d'accueil : confirme que le serveur tourne et montre un exemple
app.get('/', (req, res) => {
  res.json({
    message: 'API météo',
    exemple: `http://localhost:${PORT}/meteo?ville=Lyon`,
  })
})

app.listen(PORT, () => {
  console.log(`API météo démarrée sur le port ${PORT}`)
  console.log(`Accueil : http://localhost:${PORT}/`)
  console.log(`Exemple : http://localhost:${PORT}/meteo?ville=Lyon`)
})