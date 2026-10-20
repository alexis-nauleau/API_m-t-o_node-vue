const { once } = require('node:events')
const { creerApp } = require('../app')

// On garde le vrai fetch AVANT que les tests ne le remplacent par un faux :
// il sert à interroger NOTRE serveur de test
const vraiFetch = globalThis.fetch

// Fabrique une fausse réponse HTTP
function reponseJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

// Démarre un vrai serveur sur un port libre choisi par le système (port 0)
async function demarrer(options) {
  const serveur = creerApp(options).listen(0)
  await once(serveur, 'listening')
  return {
    base: `http://127.0.0.1:${serveur.address().port}`,
    fermer: () =>
      new Promise((resolve) => {
        serveur.close(resolve)
        serveur.closeAllConnections() // évite d'attendre les connexions restées ouvertes
      }),
  }
}

module.exports = { vraiFetch, reponseJson, demarrer }