# SECURITY

## Périmètre de confiance observé (OBSERVED)

La décision fondatrice est **D-011** : application mono-utilisateur locale, la machine de l'utilisateur **est** sa frontière de confiance ; pas de multi-locataire, pas de gardes de routes, pages publiques assumées. Cette décision est **conditionnelle** : elle a un déclencheur de réouverture écrit (accès distant ou multi-utilisateur réel).

Transposable tel quel : **nommer la frontière de confiance dans un ADR avant d'écrire la sécurité**, plutôt que d'appliquer des garde-fous par réflexe. C'est ce qui permet au source d'accepter des risques (clés API en stockage local) de façon documentée et réversible.

## Surfaces réellement exposées (OBSERVED — registre `securite.md`)

(a) la chaîne d'approvisionnement logicielle ; (b) le stockage des clés API tierces ; (c) les services connectés et leurs règles d'accès ; (d) tout script tiers exécuté sur l'origine. La classification du source est juste pour toute app « locale avec services connectés » : **quand il n'y a pas de backend, la supply chain et les services connectés deviennent la surface d'attaque principale.**

## Pratiques observées à conserver

1. **Registre de sécurité vivant** : points numérotés S-xx avec criticité, référence OWASP, constat **re-vérifié contre le code à date fixe**, action, points fermés gardés « pour mémoire ». Le registre dit ce qui est _assumé_, pas seulement ce qui est ouvert.
2. **Preuves négatives vérifiées** : « zéro `innerHTML`/`eval` dans `src/` », « le proxy open-relay de dev a été supprimé et ne doit pas être réintroduit sans liste blanche ». Consigner l'absence d'un sink est aussi utile que consigner sa présence.
3. **Audit OWASP périodique re-vérifié**, consolidation des audits dans un seul registre (pas une pile de rapports datés).
4. **Secrets publics ≠ secrets** : les variables de build sont publiques _par design_ et le doc le dit ; les secrets utilisateur (clés API) ne passent jamais par le dépôt ni par la CI, ils sont saisis dans l'app et leur risque est accepté avec mesure d'atténuation (portée minimale du PAT).
5. Erreurs : la discipline D-002 (relayer/enrober avec `cause`, jamais remplacer par un générique) est explicitement listée comme **correctif de sécurité** (fuite d'information vs diagnostic).

## Lacunes assumées à ne pas reproduire telles quelles (OBSERVED)

| ID        | Constat                                                                                                                               | Leçon pour un nouveau projet                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| S-03      | Aucune CSP / en-têtes de sécurité                                                                                                     | Prévoir CSP `default-src 'self'` + `connect-src` borné **dès le starter**, pas en dette     |
| S-05      | Dépendance vulnérable sans correctif amont (`xlsx`) ; dépendance git **non épinglée** (tag/SHA) ; dépendance morte restée au manifest | Politique : dépendance git = SHA épinglé ; toute dépendance a un propriétaire qui l'utilise |
| S-06/S-07 | Slug de page non assaini ; rendu markdown de contenu distant non sanitisé                                                             | Sanitiser tout contenu non contrôlé par défaut, pas par correctif                           |
| S-08      | Import de backup JSON sans validation de schéma                                                                                       | Tout import = passe par le schéma de validation + résumé avant application                  |
| S-09      | ~59 `console.log` en prod dont payloads externes                                                                                      | Module de logging unique (voir OBSERVABILITY.md)                                            |
| S-11      | `.env` commité avant son gitignore (contenu public par design, mais historique lisible)                                               | Hook anti-secrets + `.gitignore` au premier commit                                          |

## Recommandations cible (RECOMMENDED)

1. Reprendre le **format** du registre (ID, criticité, référence cadre, constat daté, action, points fermés) — c'est la pratique la plus transférable du volet sécurité.
2. Si l'app reste locale : formaliser la frontière de confiance (D-011) et ses **déclencheurs de réexamen**.
3. Si l'app est multi-utilisateur ou exposée : les guards de routes du source sont à réexaminer (note S-01), l'authentification existante ne protégeant qu'une feature.
4. Validation des entrées (schéma) + sanitisation du rendu + CSP : trio absent du source, à poser au démarrage — coût quasi nul sur projet neuf, coût élevé en dette (le source le paie maintenant).
