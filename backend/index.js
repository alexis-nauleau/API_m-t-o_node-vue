const { creerApp } = require('./app')

const PORT = process.env.PORT || 3002 // 3002 : le projet budget utilise 3001

creerApp().listen(PORT, () => {
  console.log(`API météo démarrée sur le port ${PORT}`)
  console.log(`Accueil : http://localhost:${PORT}/`)
  console.log(`Exemple : http://localhost:${PORT}/meteo?ville=Lyon`)
})