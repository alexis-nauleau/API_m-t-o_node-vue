# API Météo

Application météo en deux parties : une API Node.js/Express qui sert de passerelle
vers l'API Open-Meteo, et une interface Vue 3. On saisit une ville, on obtient la
météo actuelle et les prévisions sur 7 jours.



## Objectif

- Appeler une API externe depuis un serveur Node 
- Enchaîner deux appels : géocodage (nom de ville vers coordonnées), puis prévisions
- Proposer des villes à mesure que l'on tape (route /villes), en écartant les
  résultats qui ne sont pas des lieux habités
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

- Géocodage : `https://geocoding-api.open-meteo.com/v1/search`
- Prévisions : `https://api.open-meteo.com/v1/forecast`

## Lancer le projet

Backend (http://localhost:3002) :

    cd backend
    npm install
    npm run dev

Frontend (http://localhost:5173) :

    cd frontend
    npm install
    npm run dev


## API

### Codes d'erreur

| Statut | Signification |
|---|---|
| 400 | Paramètre invalide (ville de 2 à 60 caractères, q de 3 à 60, coordonnées hors plage) |
| 404 | Ville introuvable (mode ville de /meteo) |
| 429 | Trop de requêtes |
| 502 | L'API Open-Meteo n'a pas répondu |

## Cache

| Donnée | Durée |
|---|---|
| Coordonnées d'une ville (mode ville de /meteo) | 24 h |
| Prévisions | 15 min |
| Résultats de /villes | 1 h |

Le cache est en mémoire : il est vidé à chaque redémarrage du serveur.

## Limitation de débit

Chaque adresse IP a sa propre limite par route et par minute :

| Route | Requêtes par minute |
|---|---|
| /meteo | 30 |
| /villes | 120 (l'autocomplétion envoie une requête à chaque pause de frappe) |

Au-delà, le serveur répond 429 sans interroger Open-Meteo. Le compteur est en
mémoire : il repart à zéro à chaque redémarrage du serveur.

## Tests

    cd backend
    npm test

24 tests automatisés avec le module intégré node:test, sans dépendance à installer.
Les appels à Open-Meteo sont simulés : les tests sont rapides et fonctionnent sans
Internet.

| Fichier | Ce qui est vérifié |
|---|---|
| cache.test.js | Lecture, expiration, taille maximale du cache |
| openMeteo.test.js | Cache des villes et des prévisions, échecs non mémorisés, erreurs de l'API |
| meteo.test.js | Réponses 200, 400, 404, 502 et 429 de la route /meteo |
| villes.test.js | Filtrage, tri, 5 résultats maximum, minimum de 3 caractères, cache, 502, limiteur |
| coordonnees.test.js | Mode lat et lon : réponse sans géocodage, coordonnées invalides refusées |

Le fichier tests/aide.js regroupe les outils partagés (démarrage d'un serveur de test,
fausses réponses) : ce n'est pas un test.

Limites : les fausses réponses reproduisent le format attendu d'Open-Meteo. Si l'API
change ses champs, les tests restent verts alors que l'appli casse. L'interface n'est
pas testée.

## Structure

    backend/
      index.js                  démarre le serveur
      app.js                    construit l'application Express (routes, CORS, limiteurs)
      routes/meteo.js           route /meteo (validation, mise en forme de la réponse)
      routes/villes.js          route /villes (validation du texte tapé)
      services/openMeteo.js     appels à l'API externe (villes, prévisions, recherche)
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

- Le cache et les limiteurs sont en mémoire : ils ne conviennent pas à plusieurs serveurs.
- L'interface cherche encore par nom de ville (premier résultat du géocodage) : une
  ville au nom très courant peut renvoyer un lieu inattendu. L'autocomplétion, qui
  enverra les coordonnées de la ville choisie, corrigera ce point.
- L'icône ne distingue pas le jour de la nuit.
- /meteo?lat&lon ne renvoie pas le nom du lieu.

## À venir

- Autocomplétion dans l'interface : liste déroulante, délai avant envoi, annulation de
  la requête précédente, navigation au clavier
- Villes favorites, enregistrées dans le navigateur (localStorage)


## Github
mettre à jour sur la branche feat
git add .
git status
git commit -m "feat: /meteo accepte des coordonnées, tests de /villes et des coordonnées"
git push -u origin feat/meteo-coordonnees

récupérer sur dev
git switch dev
git pull
git branch
git --no-pager log --oneline --graph --all -5

supprimer feat
git branch -d feat/meteo-coordonnees  (sur pc)
git push origin --delete feat/coordonnees (sur github)