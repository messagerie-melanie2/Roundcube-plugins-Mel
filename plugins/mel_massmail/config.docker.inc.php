<?php
// Configuration for mass mails limitation
// <number of minutes> => <maximum number of messages emitted>
$rcmail_config['max_emitted_messages_configuration'] = [
	5 => 500, // Max 500 messages emitted in 5 minutes
    60 => 1500, // Max 1500 messages emitted in 1 hour
    600 => 4000, // Max 4000 messages emitted in 10 hour
];

// List of email addresses alerted when a user exceeds the mass mails limitation
$rcmail_config['alert_message_dest'] = $_ENV['RC_MEL_MASSMAIL_ALERT_MESSAGE_DEST'];

// Grilled password prefix
$rcmail_config['grilled_password_prefix'] = $_ENV['RC_MEL_MASSMAIL_GRILLED_PASSWORD_PREFIX'] ?? 'GRILLED/';

// Max number of recipient emails displayed in the alert (to avoid flooding the alert message)
$rcmail_config['max_destinataires_alerte'] = $_ENV['RC_MEL_MASSMAIL_MAX_DESTINATAIRES_ALERTE'] ?? 10;
