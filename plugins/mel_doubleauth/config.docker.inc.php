<?php
// if true ALL users must have 2-steps active
$rcmail_config['force_enrollment_users'] = $_ENV['RC_MEL_DOUBLEAUTH_FORCE_ENROLLMENT_USERS'] ?? false;

// if this is preprod, double auth is always enable
$rcmail_config['is_preprod'] = $_ENV['RC_MEL_DOUBLEAUTH_IS_PREPROD'] ?? false;

// Adresse du webservice dynalogin
$rcmail_config['dynalogin_websvc'] = $_ENV['RC_MEL_DOUBLEAUTH_DYNALOGIN_WEBSVC'];

// Set SSL stream context for web service
$rcmail_config['dynalogin_websvc_ssl'] = stream_context_create(array(
    'ssl' => array(
        // set some SSL/TLS specific options
        'verify_peer' => $_ENV['RC_MEL_DOUBLEAUTH_DYNALOGIN_WEBSVC_SSL_VERIFY_PEER'] ?? true,
    )
));

// Mode bouchon pour dynalogin
$rcmail_config['dynalogin_mode_bouchon'] = $_ENV['RC_MEL_DOUBLEAUTH_DYNALOGIN_MODE_BOUCHON'] ?? false;

// Mode bouchon double authentification activée ou non
$rcmail_config['dynalogin_bouchon_isActivated'] = $_ENV['RC_MEL_DOUBLEAUTH_DYNALOGIN_BOUCHON_ISACTIVATED'] ?? true;
