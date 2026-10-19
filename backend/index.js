const express = require('express')
const cors = require('cors')
const meteoRouter = require('./routes/meteo')

const app = express()
const PORT = process.env.PORT || 3002 

// Pas de cookies ici : un CORS simple suffit
app.use(cors({ origin: 'http://localhost:5173' }))


app.use('/meteo', meteoRouter)

app.listen(PORT, () => {
  console.log(`Accueil : http://localhost:${PORT}/`)

})