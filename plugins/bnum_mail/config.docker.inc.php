<?php

// Etat par défaut du scope de la recherche, base, sub ou all.
$config['search_scope'] = $_ENV['RC_BNUM_MAIL_SEARCH_SCOPE'] ?? 'base';

// Colonnes en plus pour les mails
$config['additional_columns'] = $_ENV['RC_BNUM_MAIL_ADDITIONAL_COLUMNS'] ?? ['priority'];
