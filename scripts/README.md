# Notification Tchap de déploiement

`main.py` poste un message dans un salon Tchap, via le bot **Bot-Gmcd**, à chaque exécution du job `launch-python-script` (cicd-yaml). Le salon et le contenu dépendent de la branche déployée (`CI_COMMIT_REF_NAME`) :

| Branche | Salon | Contenu |
|---------|-------|---------|
| `prod` | prod | Version (`bnum/version.php`) + **changelog** généré par IA (Albert) + date théorique de la prochaine mise en prod |
| `recette` | recette | Version + **compteur de tickets** traités / total (et restants) + lien [Kiwi](https://analyse-mel.m2.e2.rie.gouv.fr/kiwi/) |
| autre (`preprod`…) | aucun | Rien n'est envoyé |

```
cd bnum/scripts && python3 -m main
```

Pour tester depuis une autre branche, forcer le salon avec `BNUM_NOTIF_CHANNEL=prod` ou `recette` (par ex. dans **Run pipeline**).

## Tickets Mantis de la version

Un ticket appartient à la version si sa **version cible** (`target_version`) vaut la version de `bnum/version.php`, ou cette version sans suffixe (`26.9-pre.1` → `26.9-pre.1` ou `26.9`). L'API REST de Mantis ne filtre pas par version : tous les tickets du projet sont lus (pages de 250).

Un ticket est **traité** dès que son statut atteint `résolu` (id 80) : `résolu` et `fermé` comptent comme traités. Le seuil se change avec `BNUM_NOTIF_MANTIS_TREATED_STATUS`.

## Recette : compteur

`📊 Tickets traités : 12 / 30 (18 restants)`. Si Mantis ne répond pas, le message part avec « Compteur de tickets indisponible ».

## Prod : changelog (Albert)

[Albert](https://guides.ia.numerique.gouv.fr/albert-api/prise-en-main/quickstart) (IA de l'État, API compatible OpenAI) rédige le changelog à partir :
- des tickets Mantis **traités** de la version : titre, description (600 caractères max) et 2 dernières notes (300 caractères max) ;
- des titres des PR GitHub de la version : PR fusionnées dans la branche `dwp-<version>` de [Roundcube-plugins-Mel](https://github.com/messagerie-melanie2/Roundcube-plugins-Mel/pulls) (`dwp-26.9-pre.1` et `dwp-26.9` pour `26.9-pre.1`).

Le modèle reçoit la consigne de ne citer ni numéro de ticket, ni nom, ni adresse mail, ni détail technique. Il s'agit du premier modèle `text-generation` de `GET /v1/models`, sauf si `BNUM_NOTIF_ALBERT_MODEL` est renseignée.

Sans clé Albert ou si Albert ne répond pas, le changelog est remplacé par la simple liste des titres des tickets traités (ou des PR à défaut).

## Prod : date théorique de la prochaine mise en production

Date du déploiement (heure de Paris) + 1 mois, puis le premier **mercredi** à partir de cette date. Exemple : déploiement le mardi 17 novembre 2026 → 17 décembre (jeudi) → **mercredi 23 décembre 2026**. Un 31 janvier donne le 28/29 février avant de chercher le mercredi. La date est affichée avec la mention « date théorique ».

## Variables

| Variable | Où | Rôle |
|----------|----|------|
| `BNUM_NOTIF_TCHAP_BOT_URL` | `cicd-configuration/configuration/by_project/.sources-conf.yml` | URL du bot Tchap |
| `BNUM_NOTIF_TCHAP_WEBHOOK_PROD` | Variable CI/CD **masquée** du projet | Webhook du salon prod (le bot doit être membre du salon) |
| `BNUM_NOTIF_TCHAP_WEBHOOK_RECETTE` | Variable CI/CD **masquée** du projet | Webhook du salon recette |
| `BNUM_NOTIF_CHANNEL` | Optionnel | Force le salon (`prod` ou `recette`) |
| `BNUM_NOTIF_GITHUB_REPO` | Optionnel | Dépôt GitHub (défaut : `messagerie-melanie2/Roundcube-plugins-Mel`) |
| `BNUM_NOTIF_GITHUB_TOKEN` | Optionnel, variable CI/CD **masquée** | Token GitHub (lecture seule) : la limite sans token est de 60 appels/heure par IP |
| `BNUM_NOTIF_MANTIS_URL` | `.sources-conf.yml` | URL de Mantis (`https://mantis.m2.e2.rie.gouv.fr/`) |
| `BNUM_NOTIF_MANTIS_PROJECT_ID` | `.sources-conf.yml` | Identifiant du projet Mantis Bnum |
| `BNUM_NOTIF_MANTIS_TOKEN` | Variable CI/CD **masquée** du projet | Jeton d'API Mantis (Mon compte → Jetons d'API), en lecture |
| `BNUM_NOTIF_MANTIS_TREATED_STATUS` | Optionnel | Statut à partir duquel un ticket est traité (défaut : `80`, résolu) |
| `API_KEY_ALBERT` | Variable CI/CD **masquée** du projet | Clé d'API Albert ; liste simple des titres si absente |
| `BNUM_NOTIF_ALBERT_URL` | Optionnel | URL de l'API (défaut : `https://albert.api.etalab.gouv.fr/v1`) |
| `BNUM_NOTIF_ALBERT_MODEL` | Optionnel | Modèle à utiliser (ex. `albert-large`) ; défaut : premier modèle de génération de texte |

Tant que l'URL du bot ou le webhook du salon n'est pas renseigné, le message est seulement affiché dans les logs du job : le pipeline ne tombe pas en erreur.
