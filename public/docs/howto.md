# Manuel d'utilisation

## Configuration

Pour pouvoir utiliser l'extraction de données dans Corpusense (Mistral), il faut enregistrer sa clé API Mistral. Pour cela, cliquer sur le bouton **Paramètres de configuration** en bas à gauche de l'écran qui ouvre la page de configuration.
![Capture d'écran de Gallica](./docs/images/corpusense_btt_parameters.png)
Il suffit ensuite de saisir la clé dans le champ texte **Clé API Mistral** et de cliquer sur le bouotn **Enregistrer**.
![Capture d'écran de Gallica](./docs/images/corpusense_apikey_mistral.png){height=150}

## Ouvrir un manifest

Corpusense permet l'ouverture d'un manifest IIIF de 4 façons différentes :

- directement depuis Gallica en utilisant un plugin du navigateur
- en utilisant l'URL du manifest
- grâce au numéro ARK d'un contenu sur Gallica
- en copiant le contenu du manifest

### A partir d'un fournisseur IIIF

Pour pouvoir ouvrir un manifest dans Corpusense directement depuis un fournisseur IIIF (par exemple Gallica), il faut d'abord installer l'extension _Open in IIIF Viewer_ (<https://github.com/2SC1815J/open-in-iiif-viewer>) dans le navigateur (Firefox ou Chrome uniquement).
Après configuration, ce dernier pourra ouvrir une instance de l'application à l'adresse : <https://mezanno.xyz/corpusense-dev/manifest?manifestId=[url_manifest]&forceV3=true> ([url_manifest] = <https://gallica.bnf.fr/iiif/ark:/12148/bd6t543024772/manifest.json> par exemple).
![Capture d'écran de Gallica](./docs/images/gallica.png){width=640}

### A partir d'une URL

En allant dans la section **Manifest Explorer** de Corpusense, cliquer sur le bouton **Ouvrir un manifest**. Ce dernier ouvrre un panneau comportant 3 onglets. Par défaut, c'est celui permettant d'ouvrir un manifest grâce à son URL qui est ouvert (**J'ai une URL**).
Il suffit alors de simplement saisir l'URL du manifest puis de cliquer sur le bouton **Ouvrir** pour charger le manifest dans Corpusense.

### A partir d'une référence ARK

En allant dans la section **Manifest Explorer** de Corpusense, cliquer sur le bouton **Ouvrir un manifest**. Ce dernier ouvrre un panneau comportant 3 onglets. Il faut alors ouvrir l'onglet **J'ai un identifiant ARK**. Une fois ouvert, saisir l'idientifiant ARK puis cliquer sur le bouton **Ouvrir**.

### A partir d'un contenu

En allant dans la section **Manifest Explorer** de Corpusense, cliquer sur le bouton **Ouvrir un manifest**. Ce dernier ouvrre un panneau comportant 3 onglets. Il faut alors ouvrir l'onglet **Je veux coller le contenu**. Une fois ouvert, saisir/coller le contenu du manifest dans la zone de texte et cliquer sur **Ouvrir**.

## Parcourir un manifest

Pour parcourir un manifest, il faut se placer dans la section **Manifest Explorer** (et avoir ouvert un manifest). Trois panneaux apparaîssent à l'écran :

- metadata : affiche le tableau des metadata du manifest. Il permet également d'ajouter de nouvelles metadata au manifest.
- gallerie de canvas : affiche l'ensemble des canvas contenus dans le manifest. C'est ici que l'on va pouvoir faire une sélection de canvas et les ajouter dans des collections.
- visualiseur de canvas : affiche un canvas et permet de zoomer sur l'image.
  ![Capture d'écran de Corpusense - Manifest Explorer](./docs/images/corpusense_manifest.png){width=1024}

### Ajouter/supprimer des metadata

Pour ajouter une metadata, il suffit de cliquer sur le bouton **ajouter une metadata**. Une nouvelle ligne apparaît où l'on peut saisir la clé et la valeur de la nouvelle metadata. Il faut ensuite cliquer sur le bouton **Enregistrer** pour sauvegarder la nouvelle metadata.
Pour supprimer une metadata, il suffit de cliquer sur la petite croix présente sur chaque ligne du tableau.
![Capture d'écran de Corpusense - Manifest Explorer - Metadata](./docs/images/corpusense_manifest_metadata.png)

### Faire une sélection

Pour créer une sélection de canvas, 2 méthodes sont possibles :

- En traçant un rectangle autour des canvas que l'on souhaite sélectionner. On peut également ajouter d'autres canvas à la sélection de départ en appuyant sur la touche Shift et en traçant un autre rectangle.
  ![Capture d'écran de Corpusense - Manifest Explorer - Selection - Drag](./docs/images/corpusense_selection_drag.png){height=400}
- En faisant d'abord un clic droit sur un premier comvas puis en sélectionnant le menu **Début de la sélection ici**.
  ![Capture d'écran de Corpusense - Manifest Explorer - Selection - Start](./docs/images/corpusense_selection_start.png)
  Puis en faisant un clic droit sur un autre canvas et en sélectionnant le menu **Fin de la sélection ici**.
  ![Capture d'écran de Corpusense - Manifest Explorer - Selection - End](./docs/images/corpusense_selection_end.png)

Une fois la sélection réalisée, Il est possible de soit l'ajouter à une collection existante, soit l'ajouter à une nouvelle collection.

## Créer une collection

Une collection correspond à un ensemble de canvas IIIF (en IIIF, un canvas correspond à une image ainsi que l'ensemble des annotations associées).
Dans Corpusense, il est possible de créer une collection à partir de canvas provenant de différents manifests. A ce jour, il est également possible d'ajouter plusieurs fois le même canvas à une collection donnée.

Pour créer une collection, il existe 2 méthodes :

- depuis la gallerie du **Manifest Explorer**
- depuis la section **Gestionnaire de collections**

### Créer une liste dans la section Manifest Explorer

Pour créer une nouvelle collection depuis la section **Manifest Explorer**, il faut tout d'abord réaliser une sélection de canvas (cf section précédente). Une fois la sélection réalisée, il suffit de faire un clic droit sur la sélection et de cliquer sur le menu **Créer une collection à partir de la sélection**.
![Capture d'écran de Corpusense - Manifest Explorer - Create collection](./docs/images/corpusense_selection_create_collection.png)
Une popup apparaît permettant de saisir le nom de la nouvelle collection. Cliquer sur le bouton **Créer la collection** pour finaliser l'opération.
![Capture d'écran de Corpusense - Manifest Explorer - Create collection - popup](./docs/images/corpusense_selection_create_collection_popup.png)

### Créer une collection dans la section Gestionnaire de collections

Dans la section **Gestionnaire de collections**, on peut créer une collection en cliquant sur **Créer une nouvelle collection** (en haut de l'écran).
![Capture d'écran de Corpusense - Manifest Explorer - Create collection - button](./docs/images/corpusense_selection_create_collection_button.png)
Un panneau avec une zone de saisie de texte apparaît et il est alors possible de saisir le nom d'une collection. Une fois saisi, il faut cliquer sur le bouton **Créer** pour créer la collection. Un popup en bas de l'écran apparaît et la nouvelle collection apparaît dans le tableau.

## Visualiser l'ensemble des collections

La page **Gestionnaire de collections** permet d'afficher l'ensemble des collections. En plus de leur nom, on peut également connaître le nombre d'éléments présents dans la collection. Sur cette page, Il est possible de supprimer des collections (bouton **Supprimer**). On peut éditer une collection en cliquant dessus dans le tableau.
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_collection_manager.png){width=1024}

### Exporter/Importer une/des collection(s)

Il est possible d'exporter (et d'importer) une ou plusieurs collections. Pour ce faire, il faut sélectionner les collections à exporter en cliquant dans les cases à cocher de chaque collection. Une icone exporter apparaît alors dans la dernière ligne du tableau. En cliquant dessus, l'application génère un zip contenant la ou les collections exportée(s).
![Capture d'écran de Corpusense - Collection export](./docs/images/corpusense_collection_export.png){width=1024}
On peut ensuite importer ce zip directement dans l'application en cliquant sur le bouton **Importer une collection** et en sélectionnant le zip.
![Capture d'écran de Corpusense - Collection export](./docs/images/corpusense_collection_import.png)

## Voir/Editer une collection

On peut voir et/ou éditer une colleciton en cliquant dessus dans le **Gestionnaire de collections**. Une nouvelle page apparaît, composée de 3 sections : informations de la collection, barre d'actions et le visualiseur de canvas.
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_collection.png){width=1024}

### Informations de la collection

Dans la section de la partie supérieure de la page, il est possible d'éditer les informations de la collection. On peut renommer la collection, lui ajouter un commentaire ainsi que des tags.
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_collection_metadata.png)

#### Ajouter un tag

Il est possible d'associer des tags à une collection. Pour ce faire, dans l'encadré **Tags**. on peut soit sélectionner un tag déjà existant, soit en créer un nouveau en écrivant directement l'intitulé du tag. Il faut cliquer sur **Enregistrer** pour sauvegarder les nouveaux tags ajoutés.

### Supprimer un canvas de la collection

Pour supprimer un canvas de la collection, il faut passer la souris par dessus la miniature du canvas et une croix rouge apparaît. En cliquant dessus le canvas est supprimé de la collection.
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_collection_delete_canvas.png)

##  Annoter un canvas

Dans Corpusense, il est possible d'annoter les canvas d'une collection. Ces annotations peuvent ensuite être exportées au format IIIF.
Par défaut, Corpusense ajoute une annotation de type _REGION_ à chaque canvas ajouté à une collection. Celle-ci prend les dimensions du canvas auquel elle est ajoutée et à pour ordre 0. L'ordre correspond à l'ordre dans lequel les annotations vont être prises en compte pour les analyses (OCR par exemple) ou l'extraction de texte.
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_annotation_first.png)

### Ajouter une annotation

Pour ajouter des annotations, il faut passer en mode _annotation_.
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_btt_mode_vue.png)
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_btt_mode_annotation.png)
Pour créer une nouvelle annotation, il faut cliquer une première fois sur un des coins qui délimite la zone à annoter, puis cliquer une deuxième fois à l'opposé (en diagonal) pour former un rectangle.
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_annotation_create.png).
Une annotation est alors créée. Par défaut, elle aura le type _REGION_ et une valeur vide. Son ordre sera égal à l'ordre maximum pour les annotations de ce type + 1 (s'il existe déjà une annotaiton d'ordre 0, la suivante sera donc d'ordre 1, puis 2, etc.).
![Capture d'écran de Corpusense - Collection manager](./docs/images/corpusense_annotation_created.png).
