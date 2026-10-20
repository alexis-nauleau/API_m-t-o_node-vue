# API Météo

Application météo en deux parties : une API Node.js/Express qui sert de passerelle
vers l'API Open-Meteo, et une interface Vue 3. On saisit une ville, on obtient la
météo actuelle et les prévisions sur 7 jours.

Projet d'apprentissage : pratiquer l'appel à une API externe, la validation des
entrées, le cache, la gestion d'erreurs et les tests automatisés.

## Objectif

- Appeler une API externe depuis un serveur Node (et non depuis le navigateur)
- Enchaîner deux appels : géocodage (nom de ville vers coordonnées), puis prévisions
- Mettre en cache les réponses pour limiter les appels et accélérer le service
- Renvoyer un format de réponse indépendant du fournisseur
- Gérer proprement les erreurs (entrée invalide, ville inconnue, API en panne)
- Tester le backend sans dépendre du réseau

## Stack

- **Node.js** (appels réseau avec `fetch` intégré)
- **Express 5** pour le serveur et les routes
- **Open-Meteo** pour les données météo
- **Vue 3** et **Vite** pour l'interface
- **node:test** pour les tests automatisés

## Source des données

Les données viennent de [Open-Meteo](https://open-meteo.com), utilisée sans clé
d'API dans le cadre d'un projet non commercial :

- Géocodage : `https://geocoding-api.open-meteo.com/v1/search`
- Prévisions : `https://api.open-meteo.com/v1/forecast`

Open-Meteo s'appuie sur des modèles de services météorologiques nationaux.
Consulte leurs [conditions d'utilisation](https://open-meteo.com/en/terms) avant
tout usage autre que personnel ou pédagogique.

## Lancer le projet

Prérequis : Node.js installé. Il faut deux terminaux.

Backend (http://localhost:3002) :

    cd backend
    npm install
    npm run dev

Frontend (http://localhost:5173) :

    cd frontend
    npm install
    npm run dev

Le backend n'autorise que l'origine http://localhost:5173 (CORS) : si Vite démarre
sur un autre port, les appels seront bloqués.

## API

### GET /meteo?ville=Lyon

Exemple de réponse (valeurs d'illustration) :

    {
      "lieu": { "nom": "Lyon", "pays": "France", "latitude": 45.75, "longitude": 4.85 },
      "actuel": { "temperature": 14.2, "vent": 9.5, "code": 3 },
      "jours": [
        { "date": "2026-10-20", "max": 17.1, "min": 8.4, "pluie": 0.0, "code": 3 }
      ]
    }

Le champ code est un code météo WMO, traduit en texte et en icône par le front.

### Codes d'erreur

| Statut | Signification |
|---|---|
| 400 | Nom de ville invalide (2 à 60 caractères) |
| 404 | Ville introuvable |
| 429 | Trop de requêtes (plus de 30 par minute) |
| 502 | L'API Open-Meteo n'a pas répondu |

## Cache

| Donnée | Durée |
|---|---|
| Coordonnées d'une ville | 24 h |
| Prévisions | 15 min |

Le cache est en mémoire : il est vidé à chaque redémarrage du serveur.

## Limitation de débit

Chaque adresse IP peut faire 30 requêtes par minute sur /meteo. Au-delà, le serveur
répond 429 sans interroger Open-Meteo. Le compteur est en mémoire : il repart à zéro
à chaque redémarrage du serveur.

## Tests

    cd backend
    npm test

15 tests automatisés avec le module intégré node:test, sans dépendance à installer.
Les appels à Open-Meteo sont simulés : les tests sont rapides et fonctionnent sans
Internet.

| Fichier | Ce qui est vérifié |
|---|---|
| cache.test.js | Lecture, expiration, taille maximale du cache |
| openMeteo.test.js | Cache des villes et des prévisions, échecs non mémorisés, erreurs de l'API |
| meteo.test.js | Réponses 200, 400, 404, 502 et 429 de la route /meteo |

Limite : les fausses réponses reproduisent le format attendu d'Open-Meteo. Si l'API
change ses champs, les tests restent verts alors que l'appli casse. L'interface
n'est pas testée.

## Structure

    backend/
      index.js                  démarre le serveur
      app.js                    construit l'application Express (routes, CORS, limiteur)
      routes/meteo.js           route /meteo (validation, mise en forme de la réponse)
      services/openMeteo.js     appels à l'API externe
      services/cache.js         cache en mémoire avec durée de vie
      tests/                    tests automatisés
    frontend/
      src/App.vue               recherche et assemblage de l'écran
      src/components/           météo actuelle, prévisions sur 7 jours
      src/utils/meteo.js        codes météo (icône et texte), arrondis, dates

## Dépendances

Backend (installées avec npm, versions dans backend/package.json) :

| Paquet | Rôle dans le projet |
|---|---|
| express | Crée le serveur web et gère les routes |
| cors | Autorise l'interface (autre port) à appeler l'API. Sans lui, le navigateur bloque les requêtes |
| express-rate-limit | Limite le nombre de requêtes par adresse IP, pour éviter qu'un visiteur sature le serveur ou épuise les appels autorisés par Open-Meteo |

Frontend : Vue 3 (interface), Vite (serveur de développement et build), ESLint et
Prettier (qualité et formatage du code).

Fonctions intégrées à Node.js, sans installation :

| Outil | Rôle dans le projet |
|---|---|
| fetch | Envoie les requêtes à l'API Open-Meteo |
| AbortSignal.timeout | Annule un appel qui dépasse 5 secondes |
| node --watch | Relance le serveur à chaque sauvegarde en développement |
| node:test | Lance les tests automatisés (npm test) |

## Limites connues

- Le cache et le limiteur sont en mémoire : ils ne conviennent pas à plusieurs serveurs.
- Seul le premier résultat du géocodage est retenu : une ville au nom très courant
  peut renvoyer un lieu inattendu.
- L'icône ne distingue pas le jour de la nuit.

## À venir

- Autocomplétion du nom de ville, avec choix parmi plusieurs résultats, favoris