<?php
//Url public de wekan
$config['wekan_url'] = $_ENV['RC_MEL_WEKAN_URL'];
//Url privée de wekan, si il n'y en a pas, mettez la même que l'url public
$config['server_wekan_url'] = $_ENV['RC_MEL_WEKAN_SERVER_WEKAN_URL'] ?? $config['wekan_url'];
//Nom d'utilisateur et mot de passe de l'admin wekan (Seul un admin wekan peux faire des appel à l'api)
$config['wekan_admin_user'] = [
    "username" => $_ENV['RC_MEL_WEKAN_ADMIN_USERNAME'],
    "password" => $_ENV['RC_MEL_WEKAN_ADMIN_PASSWORD'],
];
//Gestion du ssl
$config["wekan_ssl_options"] = [
    "verify_peer" => $_ENV['RC_MEL_WEKAN_SSL_OPTIONS_VERIFY_PEER'] ?? false,
    "verify_host" => $_ENV['RC_MEL_WEKAN_SSL_OPTIONS_VERIFY_HOST'] ?? 0
];
//Nom de l'application à la fin du stockage local du type Meteor.loginToken:/:/xxxx 
$config["wekan_storage_end"] = $_ENV['RC_MEL_WEKAN_STORAGE_END'] ?? "wekan";