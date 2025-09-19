# Style

## Variables de base pour le fond et le texte

--background → couleur principale de fond de l’app (body, page).

--foreground → couleur principale du texte principal.

--foreground-secondary → couleur pour textes secondaires ou moins importants.

--foreground-button → couleur du texte sur les boutons, par défaut.

--foreground-panel → couleur du texte ou éléments à l’intérieur de panels ou cards.

Choix :

Contraste suffisant avec le fond.

Différenciation entre texte principal et secondaire.

## Variables pour les cards / popovers / panels

--card → couleur de fond des cards (ou panels).

--card-foreground → couleur du texte sur ces cards.

--popover → fond des popovers (fenêtres flottantes, tooltips).

--popover-foreground → texte dans les popovers.

Choix :

Couleurs harmonisées avec le fond et contrastées avec le texte.

Souvent, card est un peu plus clair ou plus neutre que le fond général.

## Variables pour boutons et accents

--primary → couleur principale des boutons / actions importantes.

--primary-foreground → texte sur ces boutons.

--secondary → couleur pour boutons secondaires ou actions moins importantes.

--secondary-foreground → texte sur ces boutons.

--accent → couleur pour accents décoratifs ou highlights.

--accent-foreground → texte sur éléments accentués.

--destructive → boutons ou actions dangereuses (supprimer, réinitialiser).

--destructive-foreground → texte sur ces boutons.

Choix :

Doit être visible et facilement identifiable (ex. actions destructives en rouge ou contrasté).

Harmonisé avec la palette principale.

## Variables pour inputs / bordures / focus

--muted → texte ou éléments moins importants, souvent pour placeholder ou labels.

--muted-foreground → texte lisible sur muted backgrounds.

--border → couleur des bordures des inputs, cards, modals.

--input → couleur de fond ou bordure des champs de formulaire.

--ring → couleur du focus ring (tailwind focus:ring-\*).

Choix :

Lisibilité et contraste pour l’accessibilité.

Les inputs doivent se démarquer un peu du fond.

## Variables pour charts / graphiques

--chart-1 à --chart-5 → couleurs pour les graphiques et visualisations.

Choix :

Palette cohérente, mais distincte pour chaque série de données.

## Variables pour interface / sidebar

--sidebar → fond de la barre latérale.

--sidebar-foreground → texte sur la sidebar.

--sidebar-primary → couleur pour éléments principaux de la sidebar (liens actifs).

--sidebar-primary-foreground → texte sur ces éléments.

--sidebar-accent → accents visuels dans la sidebar (badges, icônes).

--sidebar-accent-foreground → texte sur ces accents.

--sidebar-border → bordure de la sidebar.

--sidebar-ring → focus ring dans la sidebar.

Choix :

La sidebar doit être visuellement séparée du contenu principal.

Les éléments actifs ou accentués doivent se distinguer.

## Autres variables

--radius → rayon des bordures pour boutons, cards, modals.

--cursor-pen-tool / --cursor-highlighter → curseurs personnalisés pour outils d’annotation.
