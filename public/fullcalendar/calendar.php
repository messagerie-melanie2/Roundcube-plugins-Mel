<?php

// Inclusion des fichiers
require_once '../lib/utils.php';
require_once __DIR__ . '/../config.inc.php';
// Configuration du nom de l'application pour l'ORM
if (!defined('CONFIGURATION_APP_LIBM2')) {
  define('CONFIGURATION_APP_LIBM2', 'roundcube');
}


if ($config['DEV']) {
  $dir = str_replace('/public/fullcalendar', '', dirname($_SERVER['SCRIPT_FILENAME']));
} else {
  $dir = __DIR__ . '../..';
}

// Inclusion de l'ORM M2
@include_once 'includes/libm2.php';

// Utilisation de la librairie Sabre VObject pour la conversion ICS
require_once '../lib/vendor/autoload.php';
require_once $dir . '/vendor/autoload.php';

$data = utils::check_hash_key();

if (!$data['user']) {
  header('Content-Type: application/json; charset=utf-8');

  echo json_encode(["error" => "La clé d'identification n'est pas valide"]);
  exit;
}

$user_prefs = $data['user']->getCalendarPreference("appointment_properties");
header('Content-Type: application/json; charset=utf-8');
echo $user_prefs;
exit;
