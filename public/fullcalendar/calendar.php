<?php

// Inclusion des fichiers
require_once '../lib/utils.php';
require_once __DIR__ . '/../config.inc.php';

// Configuration du nom de l'application pour l'ORM
if (!defined('CONFIGURATION_APP_LIBM2')) {
  define('CONFIGURATION_APP_LIBM2', 'roundcube');
}

$dir = utils::getDirPath('fullcalendar');

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

// Génération du Calendar Mél
$calendar = new LibMelanie\Api\Mel\Calendar();
$calendar->id = $data['calendar_name'];
if ($calendar->load()) {
  $user_prefs = json_decode($user_prefs, true);
  $user_prefs['calendar_name'] = $calendar->name;
  $user_prefs = json_encode($user_prefs);
}

header('Content-Type: application/json; charset=utf-8');
header("Expires: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0");
header("Pragma: no-cache");

echo $user_prefs;
exit;
