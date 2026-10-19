# API Météo

API Node.js/Express qui sert de passerelle vers l'API météo Open-Meteo : on lui
donne un nom de ville, elle renvoie la météo actuelle et les prévisions sur 7 jours.

Projet d'apprentissage : pratiquer l'appel à une API externe, la validation des
entrées, le cache et la gestion d'erreurs.

## Objectif

- Appeler une API externe depuis un serveur Node (et non depuis le navigateur)
- Enchaîner deux appels : géocodage (nom de ville vers coordonnées), puis prévisions
- Mettre en cache les réponses pour limiter les appels et accélérer le service
- Renvoyer un format de réponse indépendant du fournisseur
- Gérer proprement les erreurs (entrée invalide, ville inconnue, API en panne)

## Stack

- **Node.js** (appels réseau avec `fetch` intégré)
- **Express 5** pour le serveur et les routes
- **cors** pour autoriser le futur front
- **Open-Meteo** pour les données météo
- Front  : **Vue 3** 

## Source des données

Les données viennent de https://open-meteo.com, utilisée sans clé
d'API dans le cadre d'un projet non commercial :

- Géocodage : `https://geocoding-api.open-meteo.com/v1/search`
- Prévisions : `https://api.open-meteo.com/v1/forecast`

Open-Meteo s'appuie sur des modèles de services météorologiques nationaux.


## Utilisation

```bash
cd backend
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:3002`.



## Structure

```
backend/
  index.js              point d'entrée du serveur
  routes/meteo.js       route /meteo (validation, mise en forme de la réponse)
  services/openMeteo.js appels à l'API externe
  services/cache.js     cache en mémoire avec durée de vie
```

