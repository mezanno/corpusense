# TODO

## Priority

FIX : la fenêtre de sélection des modèles n'apparaît plus
TODO : ajouter des exemples lors de la recherche de données structurées

TODO : workers :

- comment combiner le code des converters/schéma/configuration des plugins ?

## Later

TODO : collections de listes --> utilisation de tags à la place ?
TODO : workers :

- envoyer le texte complet d'une collection à Mistral pour gérer les cas d'entrées sur plusieurs pages

## BUGS

FIX : si on supprime les results à la main, il faut mettre à jour le statut des task d'un worker.
FIX: récupèrer l'erreur detail:"Unauthorized" de mistral
FIX : la miniature dans le panneau est déformée (problème avec le composant Thumbnail)

## A discuter

DISCUSS ; importer des listes d'ARK/catalogue ?

DISCUSS: Zone par défaut orange qui recouvre toute la page : prête à confusion. Peut-être commencer sans zones ou bien avec une petite zone centrale à déplacer / agrandir ?

Appliquer les colonnes sur les autres pages : modifie les colonnes qui ont déjà été faites à la main. Peut-être faire ignorer les pages déjà annotées ?
Appliquer à tous les éléments à gauche/droit de cette page
Réappliquer les ajustements à gauche/droite
Modèle : pouvoir soumettre une liste de choix ? du style references_pages: Union[List[int], str]
Magnétisme entre les boîtes (en optionnel)
Pouvoir tracer des zones polygonales
