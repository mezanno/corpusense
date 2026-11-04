# CorpuSense

Application web pour explorer des manifests IIIF, constituer des collections, annoter des zones d'intérêt, lancer des traitements (OCR/extraction) et exporter des données structurées.

## Liens utiles

- Dépôt principal : https://github.com/mezanno/corpusense
- Fork de développement : https://github.com/mezanno/corpusense-dev
- Version stable : https://mezanno.xyz/corpusense/
- Version de test : https://mezanno.xyz/corpusense-dev/

## Dépôts et branches

### Dépôt principal (corpusense)

- main : version stable
- develop : branche d'intégration des contributions
- gh-pages : build statique publié automatiquement depuis develop

### Fork de développement (corpusense-dev)

- develop : branche de développement
- gh-pages : build statique publié automatiquement depuis develop

Cette organisation permet de conserver une version stable et une version d'essai accessibles en ligne.

## À quoi sert l'application

CorpuSense permet de :

- Charger un manifest IIIF (URL, identifiant ARK ou JSON collé)
- Parcourir ses canvas
- Créer des collections de canvas
- Annoter des zones
- Lancer des traitements automatiques (OCR, extraction)
- Structurer les résultats avec des modèles de données
- Exporter les résultats pour analyse

Guides fonctionnels détaillés :

- [Manuel d'utilisation](./public/doc/howto.md)
- [Cas d'usage](./public/doc/usecase.md)

## Comment l'application est structurée

### Flux global

- Interface React 19 (pages et composants réactifs)
- Persistance locale Local-First via IndexedDB (Dexie `useLiveQuery`)
- Gestion d'erreurs typées via Result Pattern (`FunctionResult<T, E>`) dans la DAL
- Store Redux Toolkit allégé (événements et notifications system UI)
- Logique asynchrone & orchestrateur de workers (Redux-Saga + Supabase Realtime)
- Plugins modulaires pour imports et traitements d'IA/OCR (Mistral, OpenAI-compatible, Pero OCR, extraction de layout)

### Fichiers clés

- Point d'entrée app : src/main.tsx
- Routing et providers : src/App.tsx
- Navigation applicative : src/hooks/useAppNavigation.tsx
- Pattern Result / Erreurs : src/utils/functionResult.ts
- Repositories IndexedDB : src/data/repositories/indexeddb/
- Store Redux : src/state/store.ts
- Root saga : src/state/sagas/index.ts
- Sagas workers : src/state/sagas/workers.ts
- Internationalisation : src/i18n.ts

### Arborescence métier (repères)

- src/pages : pages principales
- src/components : composants UI et métier
- src/state : reducers, sagas, zustand stores
- src/data/models : modèles de données et schémas Zod
- src/data/repositories : accès aux données IndexedDB
- public/locales : traductions i18n
- public/doc : documentation utilisateur servie par l'application
- docs : documentation technique (spécifications, décisions, sécurité, roadmap)

### Documentation technique interne

- Index et politique de documentation : [docs/README.md](./docs/README.md)
- Spécification d'architecture : [docs/architecture.md](./docs/architecture.md)
- Guide développeur : [docs/developpement.md](./docs/developpement.md)
- Décisions d'architecture (ADR) : [docs/DECISIONS.md](./docs/DECISIONS.md)
- Registre de sécurité : [docs/securite.md](./docs/securite.md)
- Feuille de route : [docs/roadmap.md](./docs/roadmap.md)

## Technologies utilisées

- React 19
- TypeScript 5.9
- Vite 7
- Dexie (IndexedDB Local-First ORM)
- FunctionResult (Result Pattern)
- Redux Toolkit & Redux-Saga
- Tailwind CSS 4 & Shadcn/UI
- Annotorious + OpenSeaDragon + dnd-kit
- Vitest + React Testing Library

Références de configuration :

- package.json
- vite.config.ts

## Installation rapide (utilisation locale)

Prérequis :

- Node.js 22 (version utilisée en CI)
- npm 11.6.4 (version déclarée dans `package.json`)
- Certificat HTTPS local et configuration Supabase : voir le [guide développeur](./docs/developpement.md#1-démarrage)

Étapes :

1. Cloner le dépôt
2. Installer les dépendances
3. Lancer en local

Commandes :

```bash
npm ci
npm run dev
```

Après configuration, l'application est disponible sur l'URL HTTPS locale affichée par Vite.

## Contribuer au projet

### Workflow recommandé

1. Créer une branche depuis develop
2. Développer et tester localement
3. Vérifier lint/format
4. Ouvrir une PR vers develop

### Commandes utiles

- Dev : `npm run dev`
- Build : `npm run build`
- Preview build : `npm run preview`
- Tests : `npm run test`
- Tests coverage : `npm run test:coverage`
- Tests E2E : `npm run test:e2e` (installation de Chromium et détails dans le [guide développeur](./docs/developpement.md#tests-e2e-playwright-q9))
- Lint : `npm run lint`
- Lint utilisé en CI : `npm run lint:ratchet`
- Lint auto-fix : `npm run lint-fix`
- Format check : `npm run format`
- Format fix : `npm run format-fix`

### Bonnes pratiques PR

- Décrire le besoin et le changement
- Ajouter des captures d'écran pour les changements UI
- Garder des commits lisibles
- Vérifier que tests et lint passent avant PR

## Télécharger et déployer simplement

Cette section cible une personne qui ne souhaite pas contribuer au code.

### Option A (la plus simple) : déploiement automatique via GitHub Pages

Le projet est configuré pour déployer automatiquement via GitHub Pages lors d'un push sur develop (après validation complète) :

- .github/workflows/deploy.yml (quality gate via ci.yml → build → deploy)

Le build lit ses valeurs de configuration dans les **variables de dépôt** GitHub (et non plus dans un .env versionné) : VITE_BASE_PATH, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_STORAGE_URL, VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID — à déclarer dans Settings → Secrets and variables → Actions → Variables (valeurs publiques : ces variables sont incrustées dans le bundle client). L'assistant `scripts/setup-deploy-env.sh` vous y conduit pas à pas.

Étapes :

1. Forker le dépôt
2. Déclarer les variables de dépôt listées ci-dessus
3. Pousser sur develop
4. L'action GitHub construit puis publie automatiquement

### Option B : hébergement statique classique (Netlify, Vercel static, Nginx, Apache)

Étapes :

1. Télécharger le projet
2. Installer les dépendances
3. Générer le build
4. Publier le dossier dist sur l'hébergeur

Commandes :

```bash
npm ci
npm run build
```

Le site statique à publier est dans le dossier dist.

### Important : déploiement sous sous-répertoire

Si l'application est servie sous un sous-chemin (exemple : /corpusense-dev/), définir la variable d'environnement VITE_BASE_PATH avant le build.

Exemple :

```bash
VITE_BASE_PATH=/corpusense-dev/
```

Cette valeur est utilisée par le routeur, les assets et le manifest PWA.

## Configuration fonctionnelle

Certaines fonctionnalités nécessitent une clé API (exemple : Mistral pour l'extraction).
La saisie se fait dans la page de configuration de l'application.

Guide : [manuel d'utilisation](./public/doc/howto.md)

## Notes

- Les données métier sont stockées localement via IndexedDB (Dexie).
- Un script de build génère des métadonnées de version : scripts/generate-env.js.
