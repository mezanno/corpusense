# Cas d'usages

##  Cas 1 : cinémathèque

Tifenn souhaite étudier la place des femmes dans les métiers du cinéma français de 1920 à 1960. Pour cela, elle veut dresser la liste des femmes dans les différents métiers du cinéma en se basant sur des annuraires spécialisés (ex : _Annuaire général de la cinématographie et des industries qui s’y rattachent_, Paris, Cinémagazine, dir. Jean Pascal, 1927, <https://gallica.bnf.fr/ark:/12148/bd6t543024772>).

1. **Importer les données** : la première étape va consister à importer les manifests des différents annuaires qu'elle souhaite utiliser pour son étude. Ces manifests sont présents dans Gallica (qu'elle sait utiliser).
2. **Créer des collections** : une fois qu'elle a ajouté les manifests dans l'application, elle peut créer des collections. Une collection est un ensemble de pages (canvas) extraites des annuaires, que Tifenn regroupe en fonction de leur contenu (ex. les pages listant les monteuses, réalisatrices, etc.). Elle va ainsi sélectionner les canvas qui vont contenir un certain type de données et les ajouter à une collection.
3. **Nettoyer les données** : l'étape suivante consiste à nettoyer les collections des éléments indésirables (page de pub par exemple) et à ajuster les zones de recherches (ne garder que la moitié d'un canvas par exemple). Par défaut la zone de recherche d'un canvas englobe le canvas dans sa totalité.
4. **OCR** : lorsque les zones de recherche sont définies, Tifenn a la possiblité de lancer un traitement OCR sur l'ensemble de la collection ou sur un canvas en particulier. Ceci va lui permettre de récupérer le texte de la collection (ou du canvas).
5. **Editer le texte** : à partir du texte extrait par l'analyse OCR, Tifenn définit la structure des informations qu’elle veut extraire (par exemple : nom, métier, année, société), afin de guider l’extraction automatique.
6. **Extraire les données** : une fois que le modèle de données est établi, elle lance l'extraction de données. Elle récupère ainsi la liste des données sous forme de CSV (ou JSON).

## Extraire les données des femmes dans le cinéma à partir d’annuaires numérisés

### Acteur principal

Tifenn (chercheuse en cinéma)

### Objectif

Obtenir un fichier structuré (CSV) listant les femmes mentionnées dans les annuaires.

### Préconditions

- Elle a accès aux annuaires sur Gallica.
- Elle connaît les structures attendues (nom, profession, etc.).

### Scénario principal

1. Tifenn ouvre l’application.
2. Elle clique sur "Ajouter un manifest" et colle une URL Gallica.
3. L’application charge le manifest et affiche les pages.
4. Elle sélectionne certaines pages et les ajoute à une collection.
5. Elle édite chaque canvas pour définir une zone de recherche (si besoin).
6. Elle supprime les pages inutiles (publicités, index...).
7. Elle clique sur "Analyse OCR".
8. Une fois l’OCR terminé, elle lit les résultats.
9. Elle crée un "modèle de données" : champ "Nom", champ "Profession", etc.
10. Elle annote un ou plusieurs textes pour apprendre à l'application où sont ces données.
11. Elle clique sur "Extraction de données".
12. Elle télécharge un fichier CSV.

### Postconditions

- Elle obtient un tableau exploitable pour sa recherche.
- Elle peut itérer avec d’autres annuaires.

### Extensions

- Si l’OCR échoue → elle peut relancer ou éditer le texte manuellement.
- Si le modèle d'extraction n'est pas satisfaisant → elle peut le corriger et relancer.

## Erreurs

Scénarios d’erreur (gestion des cas problématiques)

### Erreur 1 – Manifest non valide ou inaccessible

Étape concernée : lors de l’import d’un manifest IIIF depuis Gallica.

Détection : l’URL ne retourne pas de manifest, ou la structure JSON est invalide.

Traitement :

- Afficher une erreur : « Impossible d’importer ce manifest. Veuillez vérifier l’URL ou son accessibilité. »
- Proposer un exemple de manifest valide.
- Journaliser l’erreur pour diagnostic.

### Erreur 2 – OCR échoue ou renvoie un texte vide

Étape concernée : traitement OCR d’un canvas ou d’une collection.

Détection : le moteur OCR ne renvoie pas de texte, ou du texte inutilisable (trop de caractères spéciaux, texte vide).

Traitement :

- Afficher un message clair avec une option pour :
  - relancer l’OCR (avec autre moteur si possible),
  - annoter manuellement le texte,
  - supprimer le canvas de la collection.

### Erreur 3 – Modèle de données mal défini (champ manquant, chevauchement…)

Étape concernée : annotation du texte structuré.

Détection : le modèle ne respecte pas les contraintes (ex. : champ "Nom" obligatoire absent).

Traitement :

- Surbrillance de l’erreur dans l’interface.
- Blocage de l’étape suivante avec explication : « Vous devez définir au moins un champ obligatoire : Nom. »

### Erreur 4 – Échec de l’export (CSV/JSON)

Étape concernée : téléchargement du fichier final.

Causes possibles : modèle invalide, texte mal structuré, bug du navigateur.

Traitement :

- Tentative de régénération.
- Affichage d’un bouton « copier les données brutes ».
- Journalisation côté serveur si applicable.

### Erreur 5 – Zones de recherche mal définies

Étape concernée : découpe du canvas.

Problème : l’utilisateur a défini une zone vide ou hors des limites de l’image.

Traitement :

- Vérification automatique avant validation.
- Affichage : « La zone de recherche sélectionnée est vide ou en dehors des limites de la page. »
