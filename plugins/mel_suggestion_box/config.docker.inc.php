<?php
// Subject of the suggestion message
$rcmail_config['suggestion_subject'] = $_ENV['RC_MEL_SUGGESTION_BOX_SUGGESTION_SUBJECT'] ?? '[Suggestion box] Mél';

// Subject of the suggestion message (If _courrielleur)
$rcmail_config['suggestion_subject_courrielleur'] = $_ENV['RC_MEL_SUGGESTION_BOX_SUGGESTION_SUBJECT_COURRIELLEUR'] ?? '[Suggestion box] Courrielleur';

// Suggestion destinataires
$rcmail_config['suggestion_dest'] = $_ENV['RC_MEL_SUGGESTION_BOX_SUGGESTION_DEST'];

