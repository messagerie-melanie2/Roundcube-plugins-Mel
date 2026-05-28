<?php

// Source of annuaire
$config['annuaire_source'] = $_ENV['RC_ANNUAIRE_SOURCE'] ?? 'amande';

// Base DB for LDAP Annuaire
$config['annuaire_base_dn'] = $_ENV['RC_ANNUAIRE_BASE_DN'];

// Driver configuration (default, mtes, ...)
$config['annuaire_driver'] = $_ENV['RC_ANNUAIRE_DRIVER'] ?? 'mtes';

// Activer l'export de l'annuaire pour les utilisateurs
$config['annuaire_export'] = $_ENV['RC_ANNUAIRE_EXPORT'] ?? true;

// Liste des champs à utiliser pour la recherche dans le ldap
$config['annuaire_search_fields'] = $_ENV['RC_ANNUAIRE_SEARCH_FIELDS'] ?? ['cn', 'mail'];

// Liste des champs pour lesquels on fait une recherche exacte
$config['annuaire_search_equal_fields'] = $_ENV['RC_ANNUAIRE_SEARCH_EQUAL_FIELDS'] ?? ['mail'];

// Filtre de recherche à utiliser en plus de la recherche sur les champs configurés
$config['annuaire_search_filter'] = $_ENV['RC_ANNUAIRE_SEARCH_FILTER'];
