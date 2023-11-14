<?php
$config = [];
$config['mi_auth'] = [
  'client_id' => 'client_id', //client_id défini dans l'API de gestion des mots de passe
  'client_secret' => 'client_secret', //client_secret défini dans l'API de gestion des mots de passe
  'portail_uri' => "https://localhost/portail", //uri du portail utilisateur (gestion des mdp)
  'api_uri_ext' => "https://domaine.api/v1/", //uri publique de l'API (depuis un navigateur
  'api_uri' => "https://localhost/api/v1/", //uri de l'API de gestion des mdp avec la version
  /* définition des endpoints de l'API nécessaires */
  'auth_endpoint' => "auth/client",
  'auth_user_endpoint' => "auth/user",
  'portail_endpoint' => "portail/token",
  'userinfo_endpoint' => "pwd/user/info",
  //optional. Add parameters for requests for guzzle connexion
  'requests' =>  [
    'http_errors' => false,
    'verify' => false, //verify TLS signature
//    'proxy' => [ //add proxy access if needed
//      'http' => 'http://proxy:port', //for http access
//      'https' => 'http://proxy:port', //for https access
//      'no' => ['.domain1, 'domain2'], //list to not use proxy
//    ],
    'timeout' => 20.0, //timeout before error 408
    'curl' => [
      //CURLOPT_SSL_CIPHER_LIST => 'DEFAULT@SECLEVEL=1', //définitions de params optionnels suivant le serveur distant
    ],
  ],
];
