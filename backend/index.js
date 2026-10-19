const express = require('express')
const cors = require('cors')
const meteoRouter = require('./routes/meteo')

const app = express()
const PORT = process.env.PORT || 3002 


app.use(cors({ origin: 'http://localhost:5173' }))

app.use('/meteo', meteoRouter)

app.listen(PORT, () => console.log(`API météo démarrée sur le port ${PORT}`))