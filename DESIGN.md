---
name: Bnum
description: Le bureau numérique de l'État — une enveloppe institutionnelle sobre, dense et franche, alignée sur le Système de Design de l'État.
colors:
  bleu-france: "#000091"
  bleu-france-hover: "#1212ff"
  bleu-france-active: "#2e2eff"
  voile-bleu: "#f5f5fe"
  voile-bleu-hover: "#dcdcfc"
  voile-bleu-active: "#cbcbfa"
  encre: "#161616"
  gris-indice: "#666666"
  blanc-page: "#ffffff"
  gris-surface: "#f6f6f6"
  gris-surface-hover: "#dfdfdf"
  gris-surface-active: "#cfcfcf"
  filet: "#dddddd"
  champ: "#eeeeee"
  champ-trait: "#3a3a3a"
  rouge-marianne: "#ce0500"
  rouge-marianne-hover: "#ff2725"
  ardoise-nav: "#242424"
  ardoise-nav-hover: "#474747"
  vert-succes: "#36b37e"
  rouge-alerte: "#de350b"
  sombre-bleu-france: "#8585f6"
  sombre-encre-inverse: "#313178"
  sombre-fond: "#242424"
  sombre-surface: "#1e1e1e"
  sombre-filet: "#353535"
  sombre-champ: "#2f2f2f"
  sombre-texte: "#ffffff"
  app-bureau: "#a26859"
  app-mail: "#00a95f"
  app-agenda: "#009081"
  app-stockage: "#009099"
  app-annuaire: "#465f9d"
  app-visio: "#417dc4"
  app-parapheur: "#a558a0"
  app-chat: "#e18b76"
  app-espace: "#ce614a"
  app-sondage: "#c8aa39"
  app-rizomo: "#e4794a"
  app-wekan: "#d1b781"
  app-liens: "#bd987a"
  app-taches: "#ffc29e"
  app-actualites: "#466964"
  app-notes: "#ddb435"
  app-tchap: "#000091"
  app-reglages: "#808080"
typography:
  display:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Arial, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: "56px"
    letterSpacing: "normal"
  headline:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Arial, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: "48px"
    letterSpacing: "normal"
  title:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Arial, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Arial, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, Arial, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "24px"
    letterSpacing: "normal"
rounded:
  none: "0"
  sm: "5px"
  input: "4px 4px 0 0"
  circle: "50%"
  pill: "9999px"
spacing:
  xs: "5px"
  s: "10px"
  m: "15px"
  l: "20px"
  xl: "25px"
components:
  button-primary:
    backgroundColor: "{colors.bleu-france}"
    textColor: "{colors.voile-bleu}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.bleu-france-hover}"
    textColor: "{colors.voile-bleu}"
  button-primary-active:
    backgroundColor: "{colors.bleu-france-active}"
    textColor: "{colors.voile-bleu}"
  button-secondary:
    backgroundColor: "{colors.blanc-page}"
    textColor: "{colors.bleu-france}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1rem"
  button-secondary-hover:
    backgroundColor: "{colors.gris-surface}"
    textColor: "{colors.bleu-france}"
  button-danger:
    backgroundColor: "{colors.rouge-marianne}"
    textColor: "{colors.voile-bleu}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1rem"
  button-danger-hover:
    backgroundColor: "{colors.rouge-marianne-hover}"
    textColor: "{colors.voile-bleu}"
  input-text:
    backgroundColor: "{colors.champ}"
    textColor: "{colors.encre}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: "0.5rem 1rem"
    width: "100%"
  badge:
    backgroundColor: "{colors.bleu-france}"
    textColor: "{colors.voile-bleu}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs}"
  app-header:
    backgroundColor: "{colors.gris-surface}"
    textColor: "{colors.encre}"
    height: "60px"
    padding: "0 {spacing.m}"
  nav-rail-item:
    backgroundColor: "{colors.ardoise-nav}"
    textColor: "{colors.blanc-page}"
    rounded: "{rounded.none}"
    height: "58px"
    width: "60px"
  nav-rail-item-hover:
    backgroundColor: "{colors.ardoise-nav-hover}"
    textColor: "{colors.blanc-page}"
  list-row:
    backgroundColor: "{colors.blanc-page}"
    textColor: "{colors.encre}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "{spacing.s} {spacing.m}"
  list-row-hover:
    backgroundColor: "{colors.voile-bleu-hover}"
    textColor: "{colors.encre}"
  list-row-selected:
    backgroundColor: "{colors.voile-bleu-active}"
    textColor: "{colors.encre}"
  card-item:
    backgroundColor: "{colors.gris-surface}"
    textColor: "{colors.encre}"
    rounded: "{rounded.none}"
    padding: "5px 15px"
---

# Design System: Bnum

## Overview

**Creative North Star: "Le Bureau République"**

Bnum ressemble à ce qu'il est : un service de l'État. La sobriété n'est pas une timidité de designer, c'est la matière du produit. Le fond est blanc, les surfaces sont gris clair, le texte est presque noir, les angles sont droits et le seul accent est le bleu France. Ce qui reste à l'écran, une fois cette enveloppe retirée, c'est le travail de l'agent : des messages, des créneaux, des documents, des personnes. Le système est conçu pour disparaître derrière eux.

C'est un système **dense**. Les agents passent la journée dedans, avec plusieurs applications ouvertes ; on optimise le nombre de lignes lisibles à l'écran, pas la quantité de blanc. Mais dense ne veut pas dire serré ni deviné : les contrastes sont nets, les libellés explicites, les cibles cliquables franches. La densité se gagne sur l'espacement et la hiérarchie, jamais en rétrécissant le texte ni en supprimant un libellé.

La neutralité n'est pas de la grisaille. Elle est là pour laisser respirer deux sources de couleur légitimes : la **couleur d'application**, qui dit en un coup d'œil dans quelle brique on se trouve, et les **thèmes** (mode sombre, thèmes saisonniers) que l'utilisateur choisit. Le système ne dispute jamais ces couleurs ; il leur fait de la place. Anti-référence confirmée : l'ancien monde Mél — grands aplats indigo `#363A5B`, accent menthe `#80D5C6`, boutons en gélule et panneaux colorés bord à bord — n'est plus la cible. Il reste en place dans une partie du code et se retire écran par écran.

**Key Characteristics:**

- Bleu France en signal rare (≤ 10 % de la surface), pas en aplat de marque.
- Angle droit par défaut : `rounded.none` est le rayon normal, pas l'exception.
- Profondeur par filet 1px et écart de fond, pas par ombre.
- Densité assumée, sur une grille de 5/10/15/20/25 px.
- Une couleur par application, portée par l'icône et l'accent local, jamais par le fond de page.
- Deux modes (clair, sombre) et une échelle de taille de texte réglable par l'utilisateur : tout composant doit survivre aux deux.
- Composants livrés en éléments natifs `<bnum-*>` à Shadow DOM, pilotés par variables CSS.

## Colors

Une enveloppe achromatique — blanc, gris clair, encre — traversée par un seul bleu institutionnel et un voile bleu très pâle qui porte tous les états de liste.

### Primary

- **Bleu France** (`#000091`) : l'action principale, l'état sélectionné, le trait de focus sous un champ actif, le soulignement 4px d'un onglet actif. C'est la seule couleur saturée que le système s'autorise sur du chrome. En mode sombre il devient **Bleu France clair** (`#8585f6`), et le texte posé dessus passe à l'encre bleutée `#313178`.
- **Bleu France survol / appui** (`#1212ff` / `#2e2eff`) : uniquement en réponse à un pointeur ou un clic, jamais au repos.

### Secondary

- **Voile bleu** (`#f5f5fe`) : le bleu réduit à un souffle. Fond des lignes de liste au repos dans les zones bleutées, fond du jour courant dans l'agenda, et couleur du texte posé sur le bleu France. C'est ce qui permet de teinter une liste entière sans jamais dépenser l'accent.
- **Voile bleu survol** (`#dcdcfc`) et **Voile bleu sélection** (`#cbcbfa`) : les deux seuls fonds d'état d'une ligne de liste. Le glisser-déposer réutilise le fond de sélection.

### Tertiary

Le système de **couleurs d'application** : une teinte fixe par brique, empruntée aux couleurs illustratives de l'État. Elle vit dans l'icône de l'application, la pastille d'un événement, la puce d'un espace de travail — jamais dans un fond de page ni un bouton.

- Bureau `#a26859` · Messagerie `#00a95f` · Agenda `#009081` · Stockage `#009099` · Annuaire `#465f9d` · Visio `#417dc4` · Parapheur `#a558a0` · Discussion `#e18b76` · Espaces de travail `#ce614a` · Sondages `#c8aa39` · Rizomo `#e4794a` · Wekan `#d1b781` · Liens utiles `#bd987a` · Tâches `#ffc29e` · Actualités `#466964` · Notes `#ddb435` · Tchap `#000091` · Paramètres `#808080`.

### Neutral

- **Blanc page** (`#ffffff`) : fond du corps et de la colonne centrale, celle qui porte le contenu lu.
- **Gris surface** (`#f6f6f6`) : colonne de gauche, en-têtes, cartes, sous-bandeaux. L'écart avec le blanc page est la principale façon de séparer deux zones.
- **Gris survol / appui de surface** (`#dfdfdf` / `#cfcfcf`) : états des éléments posés sur une surface grise.
- **Filet** (`#dddddd`) : toutes les séparations de colonnes et de surfaces, en 1px.
- **Encre** (`#161616`) : texte courant et titres. Il n'y a pas de gris de texte « pour faire doux ».
- **Gris indice** (`#666666`) : uniquement les mentions d'aide, les métadonnées secondaires et les libellés de champ au repos.
- **Champ** (`#eeeeee`) et **Trait de champ** (`#3a3a3a`) : fond plein et soulignement des zones de saisie.
- **Ardoise nav** (`#242424`, survol `#474747`) : la barre de navigation principale, seule zone volontairement plus sombre que le reste en mode clair.
- **Vert succès** (`#36b37e`) et **Rouge alerte** (`#de350b`) : retours d'état ponctuels (validation de champ, pastilles d'environnement). Distincts du rouge d'action destructrice.
- **Rouge Marianne** (`#ce0500`, survol `#ff2725`) : action destructrice uniquement.

En mode sombre, l'enveloppe bascule sur **Fond nuit** (`#242424`), **Surface nuit** (`#1e1e1e`), **Filet nuit** (`#353535`), **Champ nuit** (`#2f2f2f`) et texte blanc.

### Named Rules

**La règle du Signal rare.** Le bleu France ne dépasse jamais 10 % de la surface d'un écran. Un écran qui a besoin de deux boutons bleus a en réalité une seule action principale et une action secondaire mal identifiée.

**La règle du Voile.** Les états d'une ligne de liste (survol, sélection, dépôt) se rendent avec les voiles `#dcdcfc` / `#cbcbfa`, jamais avec le bleu France lui-même. Une liste sélectionnée ne doit pas peser plus lourd à l'œil qu'un bouton d'action.

**La règle de l'enseigne.** La couleur d'application ne teinte que des objets de petite taille : icône, pastille, puce, filet d'accent. Dès qu'elle remplit un fond de page ou un bouton, elle entre en concurrence avec l'accent du système et la règle du Signal rare est violée.

## Typography

**Display / Body Font :** la pile système — `-apple-system, system-ui, BlinkMacSystemFont, Arial, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`. Aucune fonte de marque n'est chargée pour le texte : c'est un choix de performance et de neutralité, pas un manque.
**Secondary Font :** Georgia, disponible pour de rares blocs éditoriaux.
**Icon Fonts :** Material Symbols Outlined (fonte d'icônes courante du système, réglée en graisse 300, `opsz` 24), plus deux fontes héritées encore chargées, **DWP** (fonte d'icônes maison) et **IcoFont**.

**Character :** franche, sans caractère propre, taillée pour la lecture rapide de listes. La hiérarchie se fait par la taille et la graisse, jamais par la casse forcée ni par l'interlettrage.

### Hierarchy

- **Display** (700, `3rem`, 56px) : réservé aux surfaces d'accueil — connexion, onboarding, page d'accueil du bureau. Jamais dans le chrome applicatif. Le jeu complet de tailles d'affichage monte jusqu'à `5rem` (88px) avec une variante mobile pour chaque palier.
- **Headline** (700, `2.5rem`, 48px) : titre unique d'une page. Descend à 40px de hauteur de ligne en mobile.
- **Title** (700, `1.5rem`, 32px) : titres de section et de panneau. Les paliers intermédiaires `2rem`/40px et `1.75rem`/36px existent pour les hiérarchies profondes.
- **Body** (400, `1rem`, 24px) : texte courant, lignes de liste, libellés de bouton. C'est la taille par défaut du corps.
- **Label** (500, `0.875rem`, 24px) : métadonnées, mentions d'aide, en-têtes de colonne. Le palier `0.75rem`/20px est le plancher absolu, réservé aux badges et compteurs.

Les titres portent une marge basse de `25px` (`spacing.xl`) par défaut, annulable par `.no-margin`.

### Named Rules

**La règle du plancher.** Rien ne descend sous `0.75rem`. Si un bloc ne tient pas, c'est l'espacement ou la quantité d'information qu'on réduit, pas le corps du texte.

**La règle de l'échelle utilisateur.** L'utilisateur peut basculer toute l'interface en petit ou grand texte (`html.sm-text` / `html.lg-text`). Toute taille écrite en dur en pixels casse ce réglage : les tailles passent par les variables `--bnum-font-size-*`.

**La règle de la graisse unique.** Trois graisses seulement : 400 pour le texte, 500 pour les libellés, 600–700 pour les boutons et les titres. Pas de 300, pas d'italique décoratif.

## Layout

Le produit est une **coquille à trois colonnes** posée à droite d'un rail de navigation vertical : rail d'applications (60px, fixe, pleine hauteur) → colonne de gauche (`#f6f6f6`, dossiers ou filtres) → colonne centrale (listes) → colonne de contenu (`#ffffff`, l'objet ouvert). Chaque colonne est séparée de la suivante par un filet 1px, et chacune porte un en-tête de **60px** exactement (`--header-heights`), aligné en `space-between`, avec un filet bas identique. Cette hauteur d'en-tête est la constante la plus visible du système : elle doit être identique d'une application à l'autre, sinon la barre supérieure « saute » à chaque navigation.

**Grille d'espacement :** base 10px, cinq pas — `5px` (espace interne des boutons), `10px` (entre items de liste), `15px` (padding interne des cartes), `20px` (entre cartes), `25px` (entre sections). Aucun espacement n'est écrit en dehors de ces pas.

**Comportement responsive :** il ne passe **pas** par des media queries. Roundcube Elastic classe le `<html>` selon la largeur, et le système s'y accroche :

- `.layout-phone` — ≤ 480px : une seule colonne visible à la fois, navigation par écrans successifs.
- `.layout-small` — ≤ 768px : deux colonnes au plus.
- `.layout-normal` — 769–1200px : trois colonnes, la colonne de gauche pouvant se replier.
- `.layout-large` — > 1200px : disposition complète.
- `.touch` — ≤ 1024px : cibles agrandies, indépendamment du nombre de colonnes.

Un composant qui ne réagit qu'aux media queries sera correct isolé et faux dans l'application.

### Named Rules

**La règle des 60.** Le rail fait 60px de large, l'en-tête 60px de haut, l'item de rail 58px. Ces trois nombres tiennent l'alignement de toute la coquille ; on ne les ajuste pas localement.

**La règle de la classe de layout.** La réactivité s'écrit avec `html.layout-phone`, `html.layout-small`, `html.touch` — jamais avec `@media (max-width: …)` seul.

## Elevation & Depth

Le système est **plat**. Au repos, rien n'est élevé : la profondeur vient d'un filet 1px `#dddddd` et d'un écart de fond entre blanc page et gris surface. C'est ce qui permet d'empiler quatre colonnes d'information sans que l'écran devienne bruyant.

Deux ombres seulement existent, et elles sont réservées à ce qui **flotte réellement au-dessus** du plan : menus déroulants, popovers, modales, panneaux surgissants. Une carte posée dans le flux n'a jamais d'ombre.

### Shadow Vocabulary

- **Ombre courte** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)`) : élément détaché d'un seul cran — menu contextuel, infobulle.
- **Ombre portée** (`box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05)`) : couche modale et panneaux surgissants.

Empilement fixé par trois paliers de `z-index` : listes déroulantes `10`, modales `100`, infobulles `1000`.

### Named Rules

**La règle du filet.** Deux zones voisines se distinguent par un filet et un écart de fond. Si on est tenté d'ajouter une ombre pour les séparer, c'est le contraste de fond qui est insuffisant.

**La règle du flottant.** Une ombre signifie « cet élément est au-dessus du document et se ferme ». Un élément qui ne se ferme pas n'a pas d'ombre.

## Shapes

**L'angle droit est la forme par défaut.** `rounded.none` (`0`) s'applique aux boutons, cartes, surfaces, en-têtes, lignes de liste et panneaux. Ce n'est pas une austérité subie : c'est ce qui permet aux colonnes de s'aboûter proprement et aux listes denses de ne pas produire de bruit d'arrondis à chaque ligne.

Trois exceptions, et seulement trois :

- **`rounded.sm` (5px)** : les boutons qui portent explicitement l'attribut `rounded`, réservés aux contextes flottants (bandeaux, actions sur média).
- **`rounded.pill` / 100px** : badges, compteurs et pastilles d'état — des objets dont la forme doit dire « ceci est une valeur, pas une action ».
- **`rounded.circle` (50%)** : avatars, boutons ronds d'icône seule, boutons radio.

Les **bordures** se déclinent en trois épaisseurs : `1px` (filets et contours de champ), `2px` (soulignement de champ actif), `4px` (soulignement d'onglet ou d'élément sélectionné, en bleu France). Le champ de saisie fait figure de silhouette signature : bloc plein, coins hauts arrondis à `4px`, coins bas droits, soulignement inférieur de 2px — la forme dit « on écrit ici ».

### Named Rules

**La règle de l'angle droit.** Ajouter un rayon est une décision, pas un réflexe. En dehors des badges, avatars et boutons `rounded`, un rayon dans une nouvelle interface est une régression.

## Components

Les primitives sont livrées comme **éléments personnalisés natifs à Shadow DOM** : `<bnum-primary-button>`, `<bnum-secondary-button>`, `<bnum-tertiary-button>`, `<bnum-danger-button>`, `<bnum-icon-button>`, `<bnum-input-search>`, `<bnum-input-text>`, `<bnum-select>`, `<bnum-switch>`, `<bnum-radio>`, `<bnum-badge>`, `<bnum-avatar>`, `<bnum-icon>`, `<bnum-segmented-control>`, `<bnum-tabs>`, `<bnum-header>`, `<bnum-column>`, `<bnum-placeholder>`, `<bnum-screen-reader>`. Chacun expose ses variables CSS (`--bnum-button-*`, `--bnum-input-*`, `--bnum-badge-*`…) : on personnalise par variable, on ne réécrit pas le composant.

À côté vit une couche utilitaire `bds-*` (`bds-flex`, `bds-gap-m`, `bds-padding-l`, `bds-bg-surface`, `bds-text-on-primary`, `bds-space-s-top`…) adossée aux mêmes tokens, pour la mise en page sans CSS ad hoc.

### Buttons

Francs et carrés : le bouton répond, il ne bouge pas.

- **Shape :** angle droit (`0`). Variante `rounded` à 5px, variante `circle` pour l'icône seule.
- **Primary :** fond bleu France, texte voile bleu, `padding: 0.5rem 1rem`, graisse 600, `line-height: 1.5rem`.
- **Hover / Active :** seule la couleur de fond change (`#1212ff` puis `#2e2eff`), en `transition: background-color .2s ease, color .2s ease`. Aucune translation, aucune ombre, aucun changement de taille.
- **Secondary :** fond blanc, texte et bordure bleu France ; survol sur gris surface.
- **Tertiary :** sans fond ni bordure au repos, texte bleu France ; survol sur gris surface.
- **Danger :** fond rouge Marianne, texte voile bleu.
- **États :** `loading` remplace l'icône par un rotor (`rotate360`, 0,75s linéaire) et passe le curseur en `progress` ; `disabled` réduit l'opacité et coupe les événements pointeur. Un bouton avec icône accepte `data-icon` et `data-icon-pos`, et `data-hide="small"` masque le texte sur petit layout en conservant le libellé accessible.

### Inputs / Fields

- **Style :** bloc plein `#eeeeee`, sans bordure, coins hauts à `4px`, soulignement `inset 0 -2px 0 0 #3a3a3a`, `padding: 0.5rem 1rem`, `width: 100%`.
- **Focus :** le soulignement passe au bleu France. Le fond ne change pas.
- **Succès / Erreur :** le soulignement passe à `#36b37e` ou `#de350b`. La couleur ne porte jamais seule l'information : un message texte l'accompagne.
- **Recherche :** `<bnum-input-search>`, même silhouette avec icône à droite.

### Cards / Containers

- **Corner Style :** angle droit.
- **Background :** gris surface `#f6f6f6` sur fond blanc page.
- **Shadow Strategy :** aucune (voir Elevation & Depth).
- **Border :** filet 1px `#dddddd` quand la carte jouxte une autre surface de même valeur.
- **Internal Padding :** `15px` ; `5px 15px` pour les items de carte compacts en liste.

### Navigation

- **Rail d'applications :** colonne fixe de 60px, fond ardoise `#242424`, items de 58px, icône seule. Le libellé n'est pas supprimé mais masqué visuellement (technique `clip: rect(0,0,0,0)`) et reste lu par les lecteurs d'écran. Survol et sélection : `#474747`. Focus : anneau visible autour de l'item.
- **En-tête d'application :** 60px, fond gris surface, filet bas.
- **Onglets :** libellé simple, soulignement `4px` bleu France sur l'onglet actif, pas de fond.
- **Petits écrans :** le rail passe en barre repliable ; les colonnes s'effacent selon la classe de layout.

### Lignes de liste (composant signature)

C'est le composant le plus vu du produit — liste de messages, de contacts, de tâches, de créneaux.

- **Repos :** fond transparent sur blanc page, `padding: 10px 15px`, texte encre, métadonnées en gris indice.
- **Survol :** voile bleu survol `#dcdcfc`. **Sélection :** voile bleu sélection `#cbcbfa`. **Dépôt (glisser-déposer) :** même fond que la sélection.
- **Alternance :** quand une liste est zébrée, la ligne paire prend `#f6f6f6` (états `#dfdfdf` / `#cfcfcf`).
- **Non lu :** poids typographique et filet gauche en couleur, jamais un fond différent — le fond est réservé aux états d'interaction.
- **Séparation :** filet bas 1px `#dddddd`, pas d'ombre au survol.

### Badges et avatars

- **Badge :** pilule (`100px`), `padding: 5px`, variantes primary / secondary / danger. En variante circulaire, `aspect-ratio: 1` et contenu centré — pour les compteurs.
- **Avatar :** cercle, avec une pastille sémantique de couleur (`#36b37e`, `#de350b`) pour les états d'environnement.

## Do's and Don'ts

### Do:

- **Do** partir des tokens `--bnum-*` et des éléments `<bnum-*>` pour toute nouvelle interface. Ils sont chargés globalement (`design-system/css/global.css` + `ds-module-bnum.js`) sur toutes les tâches.
- **Do** personnaliser un composant par ses variables CSS exposées (`--bnum-button-padding`, `--bnum-input-background-color`…) plutôt qu'en surchargeant ses sélecteurs internes.
- **Do** tenir la règle du Signal rare : une seule action bleue par écran.
- **Do** rendre chaque état de liste avec les voiles `#dcdcfc` / `#cbcbfa`.
- **Do** vérifier tout écran dans les deux modes — `html.dark-mode` et `html.dark-mode-custom` — avant de le considérer terminé.
- **Do** vérifier tout écran aux trois échelles de texte (`sm-text`, défaut, `lg-text`) et sur `.layout-phone`, `.layout-small`, `.touch`.
- **Do** garder l'en-tête de colonne à 60px et le rail à 60px.
- **Do** doubler toute information portée par la couleur d'un libellé, d'une icône ou d'un texte d'état — exigence RGAA, et seule façon de rester lisible en thème sombre et en thème saisonnier.
- **Do** masquer un libellé visuellement (`clip`, `<bnum-screen-reader>`) plutôt que le supprimer, quand la place manque.

### Don't:

- **Don't** introduire les couleurs de l'ancien monde Mél dans une nouvelle interface : indigo `#363A5B`, `#2C3054`, `#484D7A`, menthe `#80D5C6`. Elles sont documentées ici uniquement pour être reconnues et retirées.
- **Don't** reprendre les boutons en gélule de l'héritage (`border-radius: 50px`, `margin-top: 15px`). Le bouton du système est carré et sans marge implicite.
- **Don't** écrire une couleur en dur là où un token existe. Le rail de navigation contient encore `#2c3054` codé en dur dans `styles/taskbar.css` alors que le système définit `--bnum-main-nav-color: #242424` : c'est une dérive à corriger, pas un précédent à suivre.
- **Don't** ajouter un rayon en dehors des badges, avatars et boutons `rounded`.
- **Don't** poser une ombre sur un élément qui ne flotte pas au-dessus du document.
- **Don't** utiliser une couleur d'application comme fond de page, de bouton ou de bandeau.
- **Don't** écrire de taille de police en pixels en dur : cela casse le réglage `sm-text` / `lg-text`.
- **Don't** produire un espacement hors de la grille 5 / 10 / 15 / 20 / 25.
- **Don't** s'appuyer uniquement sur `@media (max-width: …)` : la réactivité du produit passe par les classes de layout posées sur `<html>`.
- **Don't** animer autre chose que la couleur sur un changement d'état. Les transitions font 0,2s ; les déplacements et agrandissements au survol ne font pas partie du système.
