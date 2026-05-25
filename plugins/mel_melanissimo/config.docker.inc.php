<?php
// Taille maximum pour les pièces jointes, en octets
$rcmail_config['max_attachments_size'] = $_ENV['RC_MEL_MELANISSIMO_MAX_ATTACHMENTS_SIZE'] ?? 7489828;

// Configuration par l'utilisateur de la taille limite des pièces jointes pour la gestion par Mélanissimo
$rcmail_config['max_attachments_size_user_list'] = array(
		"10 Ko"   => "10240",
		"100 Ko"  => "102400",
		"500 Ko"  => "512000",
		"1 Mo"    => "1048576",
		"2 Mo"    => "2097152",
		"5 Mo"    => "5242880",
    	"7 Mo"    => "7489828",
);

// Taille maximum des pièces jointes gérées par Melanissimo
$rcmail_config['max_melanissimo_size'] = $_ENV['RC_MEL_MELANISSIMO_MAX_MELANISSIMO_SIZE'] ?? 4294967296;

// Version du service Web Melanissimo
$rcmail_config['version_service_melanissimo'] = $_ENV['RC_MEL_MELANISSIMO_VERSION_SERVICE_MELANISSIMO'] ?? '1.0';

// URL d'accès au service Melanissimo
$rcmail_config['url_service_melanissimo'] = $_ENV['RC_MEL_MELANISSIMO_URL_SERVICE_MELANISSIMO'];

// User agent
$rcmail_config['curl_user_agent'] = $_ENV['RC_MEL_MELANISSIMO_CURL_USER_AGENT'] ?? 'Roundcube Mél/1.4 Service Web Melanissimo';

// Http Proxy
$rcmail_config['curl_http_proxy'] = $_ENV['RC_MEL_MELANISSIMO_CURL_HTTP_PROXY'];

// SSL Verifier Peer
$rcmail_config['curl_ssl_verifierpeer'] = $_ENV['RC_MEL_MELANISSIMO_CURL_SSL_VERIFIERPEER'] ?? 1;

// SSL Verifier Host
$rcmail_config['curl_ssl_verifierhost'] = $_ENV['RC_MEL_MELANISSIMO_CURL_SSL_VERIFIERHOST'] ?? 2;

// SSL CA File
$rcmail_config['curl_cainfo'] = $_ENV['RC_MEL_MELANISSIMO_CURL_CAINFO'];

// Activer le service sur Internet
$rcmail_config['enable_internet_service'] = $_ENV['RC_MEL_MELANISSIMO_ENABLE_INTERNET_SERVICE'] ?? false;
