# BOOTSTRAP-CHECKLIST

Checklist ordonnée de démarrage d'un nouveau projet sur ces fondations. Classification : REQUIRED (bloquant pour le premier commit significatif), RECOMMENDED (premières semaines), OPTIONAL (à justifier).

- [ ] **1. Trancher les points de choix C1–C6** (`STARTER.md` §1) — REQUIRED
- [ ] **2. Initialiser le dépôt** : `.gitignore` complet, `.env.example`, licence, hook anti-secrets, branches `main`/`develop` + deux canaux de publication si applicable — REQUIRED
- [ ] **3. Choisir le runtime et épingler** : version de runtime + version de package manager déclarées dans le manifeste (leçon : l'écart lockfile/runner est une cause d'échec connue) — REQUIRED
- [ ] **4. Configurer le build** : base-path injectée, métadonnées de version/hash/date générées au build (fichier non versionné) — REQUIRED
- [ ] **5. Poser l'architecture de dossiers** (§2 du starter) avec la règle de dépendances **rendue mécanique** par un plugin de lint à frontières — REQUIRED
- [ ] **6. Écrire le socle d'erreurs** : type Result + hiérarchie d'erreurs à contexte + règle de lint anti-erreur-nue + liste blanche vide — REQUIRED
- [ ] **7. Écrire la première loi de domaine** dans un module pur (statuts, alphabets clos, transitions, tables totales) avec ses tests unitaires — REQUIRED (c'est l'ordre du source : la loi d'abord, D-006/D-008)
- [ ] **8. Configurer la persistance** : migrations versionnées + abonnements + transactions + faux moteur fidèle + helper de réinitialisation inter-tests — REQUIRED
- [ ] **9. Configurer les tests** : runner unitaire, harnais global de stubs d'environnement **documenté**, mock i18n à contrat complet, premier E2E de fumée sans réseau externe — REQUIRED
- [ ] **10. Configurer lint + format + typecheck** : presets typés stricts, ratchet baseline 0, format incluant l'organisation des imports — REQUIRED
- [ ] **11. Configurer le logging** : module unique + niveaux + politique prod + interdiction de la console hors module — REQUIRED
- [ ] **12. Configurer la configuration** : séparation build-time/runtime, vérification des variables obligatoires dans la CI, message d'erreur nommant chaque variable — REQUIRED
- [ ] **13. Configurer la CI** : job validate (types → tests → format → lint → audit), permissions minimales, actions épinglées par SHA, concurrency cancel, cache — REQUIRED
- [ ] **14. Rendre le CI bloquant** : protection de branches sur validate (+ e2e si présent) — REQUIRED (le source court toujours après ce retard)
- [ ] **15. Sécurité de squelette** : CSP + en-têtes si servi web, sanitisation du rendu de contenu externe, validation par schéma de tout import — REQUIRED
- [ ] **16. Écrire la documentation de démarrage** : README, `docs/architecture.md` daté, `docs/DECISIONS.md` (rejouer D-A..D-J pour la cible), `docs/securite.md` (frontière de confiance + risques acceptés avec déclencheurs), `docs/roadmap.md` avec critères de sortie, `CONTEXT.md` du domaine, guide développeur (carte de navigation + pièges) — REQUIRED
- [ ] **17. Mise en place des plugins/asynchrone** : registre **unique**, moteur de file à ports (repository/horloge/notifieur), premier plugin réel testé avec horloge fausse — RECOMMENDED
- [ ] **18. E2E bloquant PR-only** avec fixtures locales interceptées et règle de stabilité avant commit — RECOMMENDED
- [ ] **19. Publication** : pipeline publish conditionné par validate, artefact unique, environnements stables/test — RECOMMENDED
- [ ] **20. Observabilité avancée** : journal d'événements système visible de l'utilisateur, endpoint/fichier de version, (métriques/traces seulement si service central) — OPTIONAL
- [ ] **21. Revue de dépendances outillée / SBOM** — OPTIONAL

**Règle de fin de bootstrap** : le projet est « bootstrappé » quand les items REQUIRED sont cochés **et** que la commande de vérification complète (typecheck + tests + lint + format) passe en local comme en CI — le source appelle cet ensemble « le contrôle qualité du dépôt » ; le reproduire tel quel.
