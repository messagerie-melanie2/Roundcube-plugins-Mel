# Plugin mi_larry lié

## Dépendance avec mel_larry

Le plugin mi_larry est lié au skin mi_larry. Les deux sont liés à mel_larry. Ainsi, au niveau de la configration générale de roundcube, le plugin mel_larry doit être chargé avant mi_larry.

## Configuration

Le plugin a un fichier de configuration qui n'est pas lié au système roundcube. Ce dernier va permettre de charger des informations par défaut (images, texte) et de charger ces mêmes informations dynamiquement via l'API de gestion des mots de passe du MI.

```php
<?php
$config = [
  "default" => [
    "img" => dirname(__FILE__) . '/images/MIOM.svg',
    "imgType" => "image/svg+xml",
    "logo" => dirname(__FILE__) . '/images/MIOM.svg',
    "logoType" => "image/svg+xml",
    "info" => [
      "libelle" => "Ministère de l'intérieur",
      "shortDir" => "DNUM",
      "direction" => "Direction du Numérique",
    ],
  ],
  "api" => [
    "imgInfoEndpoint" => "http://rc01/api/v1/ministere/logoInfo?logoid=SVG",
    "imgEndpoint" => "http://rc01/api/v1/ministere/pureLogo?logoid=SVG",
    "logoInfoEndpoint" => "http://rc01/api/v1/ministere/logoInfo?logoid=MCE",
    "logoEndpoint" => "http://rc01/api/v1/ministere/pureLogo?logoid=MCE",
    "infoEnpoint" => "http://rc01/api/v1/ministere/info",
    "context" =>[
      "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
      ],
      "http" => [
        "timeout" => 5,
      ],
    ],
  ],
  "cacheTs" => 3600,
  "tempDir" => sys_get_temp_dir() . '/ministere',
];

```

**default** sont les valeurs par défaut d'affichage. Si l'API n'est pas accessible, elles seront alors utilisées.

Au niveau des paramètres de l'api, tous les endpoints sont nullable. L'url indiquée pour chaque est celle d'accès au endpoint de l'API désiré. Replacer **http//rc01** par la valeur réelle de l'API.

**context** permet de définir les valeurs d'accès pour l'API. Si un proxy est entre RC et l'API, il faudra le spécifier ici.

**cacheTs** est le temps en seconde avant que le cache des fichiers chargés via les endpoints sont considérés comme non valide. A expiration du cache, les appels à l'API se feront.

**tempDir** est le répertoire où les fichiers du cache sont stockés sur le serveur. Ici, c'est le dossier /tmp du serveur dans un sous dossier "ministere".
