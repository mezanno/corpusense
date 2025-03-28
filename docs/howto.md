# Manuel d'utilisation

## Ouvrir un manifest

Corpusense permet l'ouverture d'un manifest IIIF de 4 façons différentes :

- directement depuis Gallica en utilisant un plugin du navigateur
- en utilisant l'URL du manifest
- grâce au numéro ARK d'un contenu sur Gallica
- en copiant le contenu du manifest

### A partir de Gallica

Pour pouvoir ouvrir un manifest dans Corpusense directement depuis Gallica, il faut d'abord installer l'extension _Open in IIIF Viewer_ (https://github.com/2SC1815J/open-in-iiif-viewer) dans le navigateur (Firefox ou Chrome uniquement).
Après configuration, ce dernier pourra ouvrir une instance de l'application à l'adresse : https://mezanno.xyz/corpusense/manifest?manifestId=[url_manifest] ([url_manifest] = https://gallica.bnf.fr/iiif/ark:/12148/bd6t543024772/manifest.json par exemple).

### A partir d'une URL

En allant dans la section **Manifest Explorer** de Corpusense, cliquer sur le bouton **Ouvrir un manifest**. Ce dernier ouvrre un panneau comportant 3 onglets. Par défaut, c'est celui permettant d'ouvrir un manifest grâce à son URL qui est ouvert.
Il suffit alors de simplement saisir l'URL du manifest puis de cliquer sur le bouton **Ouvrir** pour charger le manifest dans Corpusense.

### A partir d'une référence ARK

En allant dans la section **Manifest Explorer** de Corpusense, cliquer sur le bouton **Ouvrir un manifest**. Ce dernier ouvrre un panneau comportant 3 onglets. Il faut alors ouvrir l'onglet **J'ai un identifiant ARK**. Une fois ouvert, saisir l'idientifiant ARK puis cliquer sur le bouton **Ouvrir**.

### A partir d'un contenu

En allant dans la section **Manifest Explorer** de Corpusense, cliquer sur le bouton **Ouvrir un manifest**. Ce dernier ouvrre un panneau comportant 3 onglets. Il faut alors ouvrir l'onglet **Je veux coller le contenu**. Une fois ouvert, saisir/coller le contenu du manifest dans la zone de texte et cliquer sur **Ouvrir**.

## Parcourir un manifest

Pour parcourir un manifest, il faut se placer dans la section **Manifest Explorer** (et avoir ouvert un manifest). Trois panneaux apparaîssent à l'écran :

- metadata : affiche le tableau des metadata du manifest. Il permet également d'ajouter de nouvelles metadata au manifest.
- gallerie de canvas : affiche l'ensemble des canvas contenus dans le manifest. C'est ici que l'on va pouvoir faire une sélection de canvas et les ajouter dans des listes.
- visualiseur de canvas : affiche un canvas et permet de zoomer sur l'image.

### Ajouter/supprimer des metadata

Pour ajouter une metadata,Il suffit de cliquer sur le bouton **ajouter une metadata**. Une nouvelle ligne apparaît où l'on peut saisir la clé et la valeur de la nouvelle metadata. Il faut ensuite cliquer sur le bouton **Enregistrer** pour sauvegarder la nouvelle metadata.
Pour supprimer une metadata, il suffit de cliquer sur la petite croix présente sur chaque ligne du tablea.

### Faire une sélection.

Pour créer une sélection de canvas, 2 méthodes sont possibles :

- En traçant un rectangle autour des canvas que l'on souhaite sélectionner. On peut également ajouter d'autres canvas à la sélection de départ en appuyant sur la touche Shift et en traçant un autre rectangle.
- En faisant d'abord un clic droit sur un premier comvas puis en sélectionnant le menu **Début de la sélection ici**. Puis en faisant un clic droit sur un autre canvas et en sélectionnant le menu **Fin de la sélection ici**.

Une fois la sélection réalisée, Il est possible de soit l'ajouter à une liste existante, soit l'ajouter à une nouvelle liste.

## Créer une liste de contenus (canvas IIIF)

Une liste de contenus correspond à un ensemble de canvas IIIF (en IIIF, un canvas correspond à une image ainsi que l'ensemble des annotations associées).
Dans Corpusense, il est possible de créer une liste à partir de canvas provenant de différents manifests. A ce jour, il est également possible d'ajouter plusieurs fois le même canvas à une liste donnée.

Pour créer une liste de contenus, il existe é méthodes :

- depuis la gallerie du **Manifest Explorer**
- depuis la section **Lists Manager**

### Créer une liste dans la section Manifest Explorer

Pour créer une nouvelle liste depuis la section **Manifest Explorer**, il faut tout d'abord réaliser une sélection de canvas (cf section précédente). Une fois la sélection réalisée, il suffit de faire un clic droit sur la sélection et de cliquer sur le menu **Créer une liste à partir de la sélection**. Une popup apparaît permettant de saisir le nom de la nouvelle liste. Cliquer sur le bouton **Créer la liste** pour finaliser l'opération.

### Créer une liste dans la section Lists Manager

Dans la section **Lists Manager**, on peut créer une liste en cliquant sur **Créer une nouvelle liste** (en haut de l'écran). Un panneau avec une zone de saisie de texte apparaît et il est alors possible de saisir le nom d'une liste. Une fois saisi, il faut cliquer sur le bouton **Créer** pour créer la liste. Un popup en bas de l'écran apparaît et la nouvelle liste apparaît dans le tableau.

## Visualiser l'ensemble des listes

La page **list manager** permet d'afficher l'ensemble des listes. Plus de leur nom, on peut également connaître le nombre d'éléments présents dans la liste. Sur cette page, Il est possible de supprimer des listes (bouton **Supprimer**) ou d'exporter la liste au format CSV. Pour réaliser l'export, il faut d'abord cliquer sur le bouton **Générer un export**. Une fois prêt, un bouton **Télécharger l'export** apparaît. Il faut alors cliquer dessus pour télécharger le fichier CSV.
En cliquant sur une des listes, cela va ouvrir la page **Inspecteur de liste**.

## Inspecteur de liste

L'inspecteur de liste affiche des informations sur une liste en particulier. On y retrouve le nom de la liste, un commentaire, une liste de tags associés et une grille de miniatures de l'ensemble des canvas de la liste.

### Ajouter un tag

Il est possible d'associer des tags à une liste. Pour ce faire, dans l'encadré **Tags**. on peut soit sélectionner un tag déjà existant, soit en créer un nouveau en écrivant directement l'intitulé du tag. Il faut cliquer sur **Enregistrer** pour sauvegarder les nouveaux tags ajoutés.

### Supprimer un canvas de la liste

Pour supprimer un canvas de la liste, il faut passer la souris par dessus la miniature du canvas et une croix rouge apparaît. En cliquant dessus le canvas est supprimé de la liste.

# TODO

- la miniature dans le panneau est déformée
- revoir le bouton Ouvrir un Manifest (style + ajouter un tooltip)
- à l'ouverture d'un manifest :
  - en cas d'erreur lors de l'ouverture, afficher un message d'erreur.
  - si l'ouverture a réussi, afficher un message et lors du clic sur ok, fermer le drawer
- export : il faut ajouter un dictionnaire d'export pour faire correspondre l'export généré à une liste en particulier
- historique : ajouter la possiblité de supprimer une entrée de l'historique de consultation
