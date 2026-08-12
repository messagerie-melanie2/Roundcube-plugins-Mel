# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Utilisateurs principaux : les agents de l'État (ministères — MTE, MASA et autres entités servies par le PNE Messagerie), pour qui Bnum est le poste de travail numérique quotidien, utilisé en continu sur la journée de travail.

Audience confirmée en plus des agents : les partenaires externes — collectivités, opérateurs et invités — intégrés aux espaces de travail collaboratifs. Ils accèdent au produit sans en être les usagers permanents, et sans partager le contexte interne des agents (plugins `mel_external_users`, `mel_sharedmailboxes`, invités d'espaces de travail).

## Product Purpose

Bnum (Mél) est le bureau numérique de communication et de collaboration mis à disposition des agents. Il réunit dans une interface unique la messagerie, l'agenda, les contacts et l'annuaire, la visioconférence, la messagerie instantanée, le stockage de fichiers, les sondages, les tâches et les espaces de travail.

Le produit réussit quand un agent mène toute sa journée de travail collaboratif sans quitter l'interface ni recomposer manuellement son contexte entre applications.

## Positioning

Le mécanisme différenciant est **l'intégration**, pas les briques : la valeur vient de ce que mail, agenda, visio, chat, drive, sondages et espaces de travail vivent dans un même lieu, avec un contexte partagé (identités LDAP, boîtes partagées, ACL, recherche transverse, notifications unifiées, espaces de travail qui agrègent les applications autour d'un projet). Un webmail concurrent, même complet, ne peut pas copier cette continuité de contexte inter-applicative.

Corollaire de design : une amélioration qui rend une brique plus belle en isolation mais rompt la continuité entre briques est une régression.

## Operating Context

- **Socle technique** : Roundcube Webmail étendu par des plugins et une skin. Ce dépôt (`Roundcube-plugins-Mel`) porte les plugins (≈67) et les skins ; le cœur Roundcube vit dans `Roundcube-Mel`. Déploiement auto-hébergé (installation locale de référence : `/opt/bnum/rcube/webmail/bnum`, dont `plugins/` est un lien symbolique vers le dépôt).
- **Skin** : `skins/mel_elastic`, qui `extends` la skin Elastic de Roundcube. Une seconde skin héritée, `skins/melanie2_larry`, ne contient plus qu'un favicon.
- **Applications intégrées** : messagerie et boîtes partagées, agenda (`calendar`, `libcalendaring`, ressources), contacts et annuaire LDAP (`annuaire`, `mel_contacts`), tâches (`tasklist`), visioconférence (`mel_visio`), messagerie instantanée (`mel_rocket_chat`, `rocket_chat`, `tchap`), fichiers (`mel_nextcloud`, `roundrive`), sondages (`mel_sondage`), forum (`mel_forum`), Wekan (`mel_wekan`), parapheur (`mel_parapheur`), envoi de pièces lourdes (`mel_melanissimo`, `mel_france_transfert`), portail et flux (`mel_portal`), espaces de travail (`mel_workspace`), aide contextuelle (`mel_help`), onboarding guidé (`mel_onboarding`).
- **Orchestration d'interface** : `mel_metapage` tient l'enveloppe applicative — barre de tâches, navigation entre applications, recherche transverse, notifications, chargement d'applications en frames. C'est le point de passage de la plupart des décisions d'interface transverses.
- **Enveloppes de bureau** : plugins `electron` et `mel_courrielleur` embarquent l'interface web dans une application de bureau. Ce n'est pas un produit natif : le langage de design reste web.
- **Contexte d'usage** : session de travail longue, plusieurs applications ouvertes en parallèle, forte densité d'information (listes de messages, plannings, arborescences de dossiers), poste de travail administratif.

## Capabilities and Constraints

Capacités confirmées par le code :

- Comptes et identités lus depuis le LDAP, boîtes partagées, ACL sur boîtes / agendas / contacts / tâches (`mel`, `mel_acl`).
- Double authentification (`mel_doubleauth`), authentification LDAP et SSO (`mel_ldap_auth`, `mi_auth`, `roundcube_auth`).
- Espaces de travail collaboratifs avec invités, planning, description et navigation propre.
- Système de thèmes : `skins/mel_elastic/themes` (thème `main` par défaut avec mode sombre dédié, plus `classique`, `super-classic`, `abstract-picture`, thèmes saisonniers `noel`, `hiver`, `halloween`), sélectionnables par l'utilisateur, avec trois échelles de taille de police (`fontsize_sm/fontsize/fontsize_lg`).
- Design system maison : `skins/mel_elastic/design-system` (module JS typé + CSS `global.css`), tokens CSS dans `styles/root.css`, bibliothèque de construction de DOM `JsHtml` (dont `JsAccessibilityHtml`).

Contraintes durables (posées par l'utilisateur) :

- **Compatibilité Roundcube / Elastic** : la skin doit rester une extension d'Elastic et suivre l'amont Roundcube. Cela borne ce qui peut être refondu : la structure de templates, les hooks et les classes fournis par l'amont ne sont pas librement remplaçables, et une refonte visuelle doit se faire dans ce cadre.

Faits produit explicitement non tranchés :

- **Internationalisation** : les fichiers de localisation présents sont uniquement `fr_FR`. L'utilisateur n'a pas rendu le monolinguisme contraignant — ne pas supposer qu'une i18n est requise, ni qu'elle est exclue. À trancher avant tout travail qui en dépend.
- **Navigateurs et matériel cibles** : non établis.

## Brand Commitments

- Nom du produit : **Bnum**, historiquement et encore présent dans le code sous **Mél** (`meta.json` : `"name": "Mél"`, auteur « Mél/PNE Annuaire et messagerie basé sur la skin Elastic by Aleksander Machniak »).
- Langue de l'interface et du code métier : français (libellés, commentaires, messages de commit).
- Licence : GPL v3 avec l'exception Roundcube pour les skins et plugins.

## Evidence on Hand

- Assets de marque : `skins/mel_elastic/images/` — `logo-light.png`, `logo-dark.png`, `taskbar-logo.png`, `bnumloader.svg` (+ masque), `favicon.ico`, `icon-192x192.png`, `icon_dark.svg`, illustrations `gars.svg`, `meuf.svg`, `looping.svg`.
- Fontes embarquées : `skins/mel_elastic/fonts/` — police d'icônes maison **DWP**, plus IcoFont et Material Symbols (variables `--main-icon-font`, `--secondary-icon-font`, `--third-icon-font`).
- Tokens couleur/typo existants : `skins/mel_elastic/styles/root.css` et `styles/less`.
- Onboarding existant : `plugins/mel_onboarding/` contient images, vidéos et parcours JSON réels.
- Documentation : `README.md` / `README_fr.md` (liste des plugins, partiellement obsolète — annonce la version 1.4.7 alors que `version.php` porte `25.7`), `docs/Documentation Roundcube - Developper un plugin.pdf`, `aide/`.
- Absences à ne pas fabriquer : aucun témoignage, chiffre d'adoption, benchmark, engagement de niveau de service ni déclaration de conformité d'accessibilité n'existe dans le dépôt. Ne pas en inventer.

## Product Principles

1. **L'intégration est le produit.** Toute décision d'interface se juge sur la continuité entre applications, pas sur la beauté d'un écran isolé.
2. **Journée entière, pas première impression.** Les utilisateurs vivent dans l'interface plusieurs heures par jour : densité lisible, cohérence et prévisibilité passent avant l'expressivité.
3. **Deux publics, un seul produit.** Un agent connaît le contexte interne, un partenaire externe ne le connaît pas. Les surfaces partagées (espaces de travail, invitations) doivent rester compréhensibles sans culture interne.
4. **L'amont est une frontière, pas un ennemi.** Concevoir dans ce que Roundcube/Elastic permet, plutôt que contre ; les écarts assumés doivent être délibérés et localisés.
5. **L'accessibilité est une obligation, pas une finition.** Elle se décide au moment du design, pas en correction après coup.

## Accessibility & Inclusion

Conformité **RGAA** exigée sur les interfaces (obligation légale du secteur public français). À traiter comme une contrainte de conception : structure sémantique, alternatives textuelles, navigation clavier, contrastes et gestion du focus font partie du périmètre de tout travail d'interface, y compris dans les composants générés en JavaScript (`JsAccessibilityHtml` existe déjà à cette fin).

Aucune déclaration de conformité ni audit RGAA n'est présent dans le dépôt : le niveau de conformité actuel est inconnu et ne doit pas être affirmé.
