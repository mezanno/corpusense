# TODO

## Priority

TODO : charger le modèle utiliser en fonction des datafield utiliser dans les annotations
TODO : lors de l'export du CSV, ajouter les tags de la collection, les informations du canvas/ark
TODO : ajouter des exemples lors de la recherche de données structurées
TODO : pouvoir créer un modèle à partir d'un autre
TODO : workers :

- passer OCR en mode worker
- passer Edwin en mode worker
- en cas d'erreur, ajouter un paramètre retry
- comment regrouper les résultats dans le menu export ?
- menu reprise ? Peut-être le mixer avec le menu de lancement

## Later

TODO : bibliothèque de manifests
TODO : collections de listes --> utilisation de tags à la place ?
TODO : ajouter un bouton permettant de passer une annotation en premier/dernier (ordre)
TODO : supprimer les annotations d'un certain type
TODO : pouvoir modifier taille police à Konva

## BUGS

FIX : revoir l'ensemble des suppressions pour s'assurer que tout est bien supprimé lors de la suppression d'une collection
FIX : la miniature dans le panneau est déformée (problème avec le composant Thumbnail)
FIX : à l'ouverture d'un manifest :

- en cas d'erreur lors de l'ouverture, afficher un message d'erreur.
- si l'ouverture a réussi, afficher un message et lors du clic sur ok

FIX : agrandir les miniatures
FIX : bug export texte : si on exporte le texte d'un canvas qui possède plusieurs régions et que les OCR n'ont pas été fait en même temps, l'ordre repars à 0 à chaque région.

## A discuter

DISCUSS : comment associer plusieurs modèles à une même page d'une collection ? dans le cadre du cinéma, on ne peut avoir qu'un type de modèle par collection
DISCUSS : empêcher l'utilisation de plusieurs modèles dans une collection
