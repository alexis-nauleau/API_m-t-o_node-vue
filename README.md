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
      index.js                    démarre le serveur
      app.js                      construit l'application Express (routes, CORS, limiteurs)
      routes/meteo.js             route /meteo (par nom de ville ou par coordonnées)
      routes/villes.js            route /villes (validation du texte tapé)
      services/openMeteo.js       appels à l'API externe (villes, prévisions, recherche)
      services/cache.js           cache en mémoire avec durée de vie
      tests/                      tests automatisés
        aide.js                   outils partagés (serveur de test, fausses réponses)
        cache.test.js             cache
        openMeteo.test.js         service Open-Meteo
        meteo.test.js             route /meteo
        coordonnees.test.js       /meteo avec lat et lon
        ville.test.js             route /villes
    frontend/
      src/App.vue                 assemble l'écran : recherche, favoris, météo
      src/components/
        RechercheVilles.vue       autocomplétion (délai, annulation, clavier)
        ListeFavoris.vue          villes favorites
        MeteoActuelle.vue         météo actuelle, étoile, thème
        PrevisionsJours.vue       prévisions sur 7 jours
      src/composables/
        useFavoris.js             lecture et écriture des favoris (localStorage)
      src/utils/
        meteo.js                  codes météo (icône et texte), arrondis, dates
        themes.js                 thèmes par ville

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





## Workflow Git

- **main** : la version stable. Elle ne reçoit que du code testé qui fonctionne.
- **dev** : la branche d'intégration, où l'on rassemble et teste les nouveautés.
- **feat/nom-de-la-fonctionnalite** : une branche par fonctionnalité, créée depuis dev.

On ne travaille jamais directement sur main ou dev.


### 1. Créer sa branche de travail

    git switch dev
    git pull
    git status
    git switch -c feat/ma-branche


### 2. Enregistrer son travail

    git branch
    git add .
    git status
    git commit -m "feat: description courte de ce qui a changé"


### 3. Envoyer sa branche sur GitHub

    git push -u origin feat/ma-branche

Le -u relie ta branche à GitHub :

### 4. Fusionner la branche dans dev

Méthode recommandée : la Pull Request sur GitHub. Elle laisse une trace visible.

1. Onglet Pull requests, puis New pull request. 
2. Règle les deux menus : base : dev (la branche qui reçoit) et
   compare : feat/ma-branche.
3. Create pull request, 
4. Merge pull request, puis Confirm merge.

Méthode en ligne de commande :

    git switch dev
    git pull
    git merge feat/ma-branche
    git push

### 5. Supprimer la branche de travail

    git switch dev
    git pull
    git branch -d feat/ma-branche
    git push origin --delete feat/ma-branche
    git fetch --prune
    git branch -a

- git branch -d (d minuscule) refuse de supprimer une branche qui n'a pas été
- git branch -a ne doit plus lister ta branche, ni en local ni dans remotes/origin/.

### 6. Fusionner dev dans main 

    git switch dev
    git pull
    git status

Vérifie d'abord que les tests passent et que l'application fonctionne. 

    git fetch
    git log --oneline main..dev
    git log --oneline dev..main

- La première commande liste les commits que main va gagner.
- La seconde doit être vide. Si elle affiche quelque chose, main a avancé de son
  côté : ne fusionne pas, demande de l'aide.

Puis fusionne et publie :

    git switch main
    git pull
    git merge --ff-only dev
    git push
    git switch dev

--ff-only fait simplement avancer main jusqu'au dernier commit de dev. 

Contrôle final : dev, main, origin/dev et origin/main doivent porter le même commit.

    git log --oneline --graph --all -4

### Fetch, pull et prune

- git fetch : télécharge l'état de GitHub et met à jour les branches origin/...,
  sans toucher à tes fichiers ni à tes branches. Sans risque.
- git pull : git fetch, puis fusion dans la branche où tu te trouves.
- git fetch --prune : comme fetch, et retire en plus les branches origin/...
  qui ont été supprimées sur GitHub.

### Règles à retenir

1. Toujours git branch avant git add : l'étoile doit être sur ta branche de travail.
2. Toujours relire git status avant de valider.
3. On ne pousse jamais directement sur main : on passe par dev.
4. Ne jamais utiliser git push --force ni git branch -D sans comprendre ce qu'ils effacent.

## Favoris, theme doudounette si ville ==Cremieu
## Thème par ville

Certaines villes ont une apparence particulière. Aujourd'hui, une seule règle existe :
Crémieu (France) déclenche le thème Saint-Valentin. La carte météo devient rose avec
des cœurs qui flottent, le texte passe au rouge, et la pastille de la ville dans les
favoris prend un contour rose avec deux cœurs.

Le thème se décide en un seul endroit (utils/themes.js). Les composants se contentent
de l'appliquer : ils ne connaissent aucun nom de ville.

Pour donner le thème à une autre ville, il suffit d'ajouter une ligne à la liste des
règles (nom et pays en minuscules, sans accents) :

    const REGLES = [
      {
        theme: 'doudounette',
        villes: [
          { nom: 'cremieu', pays: 'france' },
          { nom: 'lyon', pays: 'france' },
        ],
      },
    ]

### Où le code réagit au thème

| # | Fichier | Repère | Rôle |
|---|---|---|---|
| 1 | utils/themes.js | const REGLES | Seul endroit où le nom de la ville est écrit : la liste des villes qui ont un thème |
| 2 | utils/themes.js | function themeDe | Compare le nom et le pays de la ville avec la liste, en ignorant accents et majuscules. Renvoie 'doudounette' ou null |
| 3 | components/MeteoActuelle.vue | const theme = computed | Demande le thème de la ville affichée, et se recalcule quand la ville change |
| 4 | components/MeteoActuelle.vue | :data-theme | Écrit l'attribut data-theme="doudounette" sur la carte (rien pour une autre ville) |
| 5 | components/MeteoActuelle.vue | v-if="theme === 'doudounette'" | Crée les 6 cœurs décoratifs, ou aucun |
| 6 | components/MeteoActuelle.vue | [data-theme='doudounette'] dans le style | Fond rose, texte rouge, couleurs de l'étoile |
| 7 | components/MeteoActuelle.vue | .coeur, .c1 à .c6, @keyframes flotter | Position, taille et animation des cœurs |
| 8 | components/ListeFavoris.vue | :data-theme et v-if="themeDe(v)" | Même mécanique pour la pastille du favori et ses deux cœurs |
| 9 | components/ListeFavoris.vue | li[data-theme='doudounette'] dans le style | Contour rose épaissi, texte rouge |

Les animations des cœurs sont coupées pour les personnes qui ont réglé « réduire les
animations » dans leur système.

Limite : le thème dépend du nom et du pays, pas de l'identifiant du lieu. Une autre
ville qui porterait le même nom dans le même pays aurait aussi le thème.