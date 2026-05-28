<?php
// Taille maximum pour les pièces jointes, en octets
$rcmail_config['max_attachments_size'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_MAX_ATTACHMENTS_SIZE'] ?? 7489828;

// Configuration par l'utilisateur de la taille limite des pièces jointes pour la gestion par France Transfert
$rcmail_config['max_attachments_size_user_list'] = array(
		"10 Ko"   => "10240",
		"100 Ko"  => "102400",
		"500 Ko"  => "512000",
		"1 Mo"    => "1048576",
		"2 Mo"    => "2097152",
		"5 Mo"    => "5242880",
    	"7 Mo"    => "7489828",
);

// Taille maximum des pièces jointes gérées par France Transfert
$rcmail_config['max_francetransfert_size'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_MAX_FRANCETRANSFERT_SIZE'] ?? 4294967296;

// URL d'accès à l'API France Transfert
$rcmail_config['francetransfert_api_url'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_FRANCETRANSFERT_API_URL'];

// Clé d'API pour l'utilisation de France Transfert
$rcmail_config['francetransfert_api_key'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_FRANCETRANSFERT_API_KEY'];

// Liste des extensions refusées par France Transfert
$rcmail_config['francetransfert_forbidden_extensions'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_FRANCETRANSFERT_FORBIDDEN_EXTENSIONS'] ?? ['ade','adp','app','asp','aspx','asx','bas','bat','cer','chm','cmd','cnt','com','cpl','crt','csh','der','diagcab','exe','fxp','gadget','grp','hlp','hpj','hta','htc','inf','ins','isp','its','jar','jnlp','js','jse','ksh','lnk','mad','maf','mag','mam','maq','mar','mas','mat','mau','mav','maw','mcf','mda','mdb','mde','mdt','mdw','mdz','msc','msh','msh1','msh2','mshxml','msh1xml','msh2xml','msi','msp','mst','msu','ops','osd','pcd','pif','pl','plg','prf','prg','printerexport','ps1','ps1xml','ps2','ps2xml','psc1','psc2','psd1','psdm1','pst','py','pyc','pyo','pyw','pyz','pyzw','reg','scf','scr','sct','shb','shs','theme','tmp','url','vb','vbe','vbp','vbs','vhd','vhdx','vsmacros','vsw','webpnp','website','ws','wsc','wsf','wsh','xbap','xll','xnk'];

// User agent
$rcmail_config['curl_user_agent'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_CURL_USER_AGENT'] ?? 'Bnum 22.11/France Transfert';

// Http Proxy
$rcmail_config['curl_http_proxy'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_CURL_HTTP_PROXY'];

// SSL Verifier Peer
$rcmail_config['curl_ssl_verifierpeer'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_CURL_SSL_VERIFIERPEER'] ?? 1;

// SSL Verifier Host
$rcmail_config['curl_ssl_verifierhost'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_CURL_SSL_VERIFIERHOST'] ?? 2;

// SSL CA File
$rcmail_config['curl_cainfo'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_CURL_CAINFO'] ?? '/etc/certs/mycert.pem';

// Activer le service sur Internet
$rcmail_config['enable_internet_service'] = $_ENV['RC_MEL_FRANCE_TRANSFERT_ENABLE_INTERNET_SERVICE'] ?? false;
