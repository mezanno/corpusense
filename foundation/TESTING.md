# TESTING

## Stratégie observée (OBSERVED — D-010, D-004)

Pyramide à trois niveaux :

| Ce qui est testé | Niveau | Outils | Dépendance framework | Valeur | Limites |
|---|---|---|---|---|---|
| Fonctions pures (loi de statut, convertisseurs, dérivations) | Unitaire | Vitest | Aucune | Élevée — couvre le cœur critique sans harness | Sous-couvre l'intégration si on s'arrête là |
| Composants/hooks via rôles accessibles + user-event | Composant | RTL + jsdom + faux moteur IndexedDB | Framework UI | Bonne — tests robustes au refactoring d'implémentation | Harnais non trivial (voir plus bas) |
| Parcours critiques (import → collection → annotation persistée → export) | E2E | Playwright, chromium seul | Navigateur | Élevée sur les parcours ; a trouvé 2 bugs produits | Coût de stabilité (règle des 10 runs) |

Standards observés, tous transférables :

1. **Unitaire massif sur les modules purs** — la loi d'état, la migration, les transitions se testent sans jsdom, sans ORM, sans framework.
2. **Tests sur le vrai stack de persistance** : faux moteur IndexedDB in-process + helper de réinitialisation de base entre tests ; interdiction de mocker les factories d'accès aux données. Choix délibéré (D-004) : « tester le vrai Dexie plutôt que simuler le contrat ».3. **Accessibilité comme contrat de test** : assertions par rôles accessibles et libellés réels ; **aucun `data-testid`** en production.
4. **i18n neutralisé par le mock** : le mock de test renvoie les clés à l'identique → les tests assertent sur les clés ; une chaîne traduite n'est jamais une dépendance de test.
5. **E2E déterministe, zéro réseau externe** : abandon de toute requête sortante, fixtures servies par interception sur un hôte factice ;IndexedDB vierge par test (contexte neuf) ; les parcours se reconstruisent eux-mêmes via des helpers de journey.
6. **Règle de stabilité E2E** : un spec ne se commite qu'après 10 runs consécutifs verts ; retries activés **uniquement en CI** ; rapport/trace téléversés seulement au premier échec.
7. **Tests co-localisés** (unitaire) et **E2E en répertoire dédié** — la séparation des deux communautés est explicitement actée.
8. `it.todo` et tests ignorés visibles plutôt que supprimés silencieusement.

## Harnais : leçons concrètes (OBSERVED — à recréer équivalent dans toute cible)

- Chaque dépendance runtime qui suppose un environnement complet doit avoir son **stub documenté dans le setup global** (observer API, media query, WebGL, API de fichiers) — sans l'un d'eux, 8 fichiers de test ne se chargent plus : la cause racine est unique mais le symptôme est diffus.
- Les mocks d'i18n doivent exposer **tout le contrat utilisé** (hook + composant) ; la règle « ajouter la fonction au mock quand un composant testé l'utilise » est consignée comme piège.
- Les modules CJS externalisés nécessitent une inline/interop explicite sous le runner Node-based.

## Stratégie de tests générique recommandée (RECOMMENDED)

Pour un nouveau projet, reprendre dans cet ordre :

1. **Dès le premier commit** : runner unitaire capable de tester les modules purs sans aucun adapter ; un faux moteur de persistance fidèle (in-process) ; un harnais global de stubs d'API d'environnement.
2. **Couvrir d'abord les lois** (machines à états, dérivations, validations de schéma) : c'est là que le projet source concentre sa valeur de test.
3. Tests d'intégration sur le **vrai** mécanisme de persistance (ou faux moteur fidèle), jamais contre un mock du propre code d'accès.
4. E2E **petit et bloquant** (≤ ~15 specs), parcours critiques métier, sans réseau externe, sans testid, retries CI only.
5. Couverture cible : non pas un pourcentage global, mais **100 % des modules de loi** + points de contact des adapters (le source vise ses « 500 lignes non testées » connues comme backlog Q2, ce qui est la bonne unité de suivi).
6. Données de test : fixtures JSON versionnées dans le dépôt (`__tests__/*.json` côté unitaire, `e2e/fixtures/` + script de régénération côté E2E).
