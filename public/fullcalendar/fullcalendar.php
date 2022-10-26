<?php

// Inclusion des fichiers
require_once '../lib/utils.php';
require_once '../config.inc.php';

// Configuration du nom de l'application pour l'ORM
if (!defined('CONFIGURATION_APP_LIBM2')) {
  define('CONFIGURATION_APP_LIBM2', 'roundcube');
}

// Developpement ?
define('DEV', true);


if (DEV) {
  $dir = str_replace('/public/fullcalendar', '', dirname($_SERVER['SCRIPT_FILENAME']));
} else {
  $dir = __DIR__ . '../..';
}

// Inclusion de l'ORM M2
@include_once 'includes/libm2.php';

// Utilisation de la librairie Sabre VObject pour la conversion ICS
require_once '../lib/vendor/autoload.php';
require_once $dir . '/vendor/autoload.php';

// Récupération des paramètres de la requête
$calhash = utils::get_input_value('_cal', utils::INPUT_GET);
if (isset($calhash)) {
  $format = 'ics';
  $calhash = urldecode($calhash);

  // Récupération des informations à partir du hash
  if (preg_match(($suff_regex = '/\.([a-z0-9]{3,5})$/i'), $calhash, $m)) {
    $format = strtolower($m[1]);
    $calhash = preg_replace($suff_regex, '', $calhash);
  }

  $ics = $format == 'ics';

  if (!strpos($calhash, ':'))
    $calhash = base64_decode($calhash);

  list($_user, $calendar_name) = explode(':', $calhash, 2);
  $calendar_name = utils::to_M2_id($calendar_name);
} else {
  // Si pas d'identifiant on retourne une erreur
  echo json_encode(["error" => "Erreur de lecture pour l'identifiant de l'agenda."]);
  exit();
}


// Génération de l'utilisateur Mél
if (isset($_user)) {
  $user = new LibMelanie\Api\Mel\User();
  $user->uid = $_user;
  // $user->load();
}

// Récupération de la clé de la requête 
$keyhash = utils::get_input_value('_key', utils::INPUT_GET);
$keyhash = urldecode($keyhash);
if (isset($keyhash)) {
  // On compare la clé avec la valeur des paramètres utilisateurs
  $value = $user->getCalendarPreference("appointmentkeyhash");

  if (isset($value)) {
    $value = unserialize($value);
    if (!isset($value[$calendar_name]) || $value[$calendar_name] != $keyhash) {
      $keyhash = null;
    }
  }
}

// Vérification de la clé
if (!isset($keyhash)) {
  header('Content-Type: application/json; charset=utf-8');

  echo json_encode(["error" => "La clé d'identification n'est pas valide"]);
  exit;
}

$user_prefs = $user->getCalendarPreference("appointment_properties");

header('Content-Type: application/json; charset=utf-8');
echo $user_prefs;
exit;
