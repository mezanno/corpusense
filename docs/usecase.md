# Cas d'usages

##  Cas 1 : cinémathèque

Tifenn souhaite étudier la place des femmes dans les métiers du cinéma français de 1920 à 1960. Pour cela, elle veut dresser la liste des femmes dans les différents métiers du cinéma en se basant sur des annuraires spécialisés (ex : _Annuaire général de la cinématographie et des industries qui s’y rattachent_, Paris, Cinémagazine, dir. Jean Pascal, 1927, <https://gallica.bnf.fr/ark:/12148/bd6t543024772>).

1. **Importer les données** : la première étape va consister à importer les manifests des différents annuaires qu'elle souhaite utiliser pour son étude. Ces manifests sont présents dans Gallica (qu'elle sait utiliser).
2. **Créer des collections** : une fois qu'elle a ajouté les manifests dans l'application, elle peut créer des collections. Une collection est un ensemble de canvas. Elle va ainsi sélectionner les canvas qui vont contenir un certain type de données et les ajouter à une collection.
3. **Nettoyer les données** : l'étape suivante consiste à nettoyer les collections des éléments indésirables (page de pub par exemple) et à ajuster les zones de recherches (ne garder que la moitié d'un canvas par exemple). Par défaut la zone de recherche d'un canvas englobe le canvas dans sa totalité.
4. **OCR** : lorsque les zones de recherche sont définies, Tifenn à la possiblité de lancer un traitement OCR sur l'ensemble de la collection ou sur un canvas en particulier. Ceci va lui permettre de récupérer le texte de la collection (ou du canvas).
5. **Editer le texte** : grâce au texte extrait par l'analyse OCR,
