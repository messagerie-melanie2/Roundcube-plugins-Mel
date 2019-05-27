<?php
/**
 * URL Publique pour la gestion des freebusy
 * Paramètres (GET) :
 * start : date de début des freebusy
 * end : date de fin des freebusy
 *
 * username : identifiant de l'utilisateur
 * ou
 * email : adresse email de l'utilisateur
 *
 * Utilise l'ORM M2 pour la génération des freebusy
 */

use Sabre\VObject;

// Inclusion des fichiers
require_once '../lib/utils.php';
require_once '../config.inc.php';

// Configuration du nom de l'application pour l'ORM
if (! defined('CONFIGURATION_APP_LIBM2')) {
  define('CONFIGURATION_APP_LIBM2', 'roundcube');
}
// Inclusion de l'ORM M2
@include_once 'includes/libm2.php';

// Utilisation de la librairie Sabre VObject pour la conversion ICS
require_once '../lib/vendor/autoload.php';
require_once '../../vendor/autoload.php';

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
}
else {
  // Si pas d'identifiant on retourne une erreur
  echo "Erreur de lecture pour l'identifiant de l'agenda.";
  exit();
}

// Génération de l'utilisateur Melanie2
if (isset($_user)) {
  $usermelanie = new LibMelanie\Api\Melanie2\User();
  $usermelanie->uid = $_user;
}

// Récupération de la clé de la requête
$keyhash = utils::get_input_value('_key', utils::INPUT_GET);
$keyhash = urldecode($keyhash);
if (isset($keyhash)) {
  // On compare la clé avec la valeur des paramètres utilisateurs
  $pref = new LibMelanie\Api\Melanie2\UserPrefs($usermelanie);
  $pref->name = "calendarskeyhash";
  $pref->scope = LibMelanie\Config\ConfigMelanie::CALENDAR_PREF_SCOPE;

  if ($pref->load()) {
    $value = unserialize($pref->value);
    if (!isset($value[$calendar_name]) || $value[$calendar_name] != $keyhash) {
      $keyhash = null;
    }
  }
}

// Vérification de la clé
if (!isset($keyhash)) {
  header('WWW-Authenticate: Basic realm="Roundcube Public Calendar"');
  header('HTTP/1.0 403 Fobidden');
  exit;
}

// Génération du Calendar melanie2
$calendar = new LibMelanie\Api\Melanie2\Calendar(new LibMelanie\Api\Melanie2\User());
$calendar->id = $calendar_name;

// Pas de start, on prend la date du jour moins deux ans
$start = time() - (365 * 2 * 24 * 60 * 60);

// On récupère la liste des événements
$events = $calendar->getRangeEvents("@".$start);

// Parcours les événements pour récupérer les vcalendar
$vcalendar = new VObject\Component\VCalendar();

foreach ($events as $event) {
  $event->vcalendar = $vcalendar;
  $vcalendar = $event->vcalendar;
}

// MANTIS 0005005: Rajouter une ligne de log pour un acces a l'url du calendrier
utils::log("/feed $_user $calendar_name");

// Génération du nom de fichier
$filename = utils::asciiwords(html_entity_decode(utils::get_input_value('_cal', utils::INPUT_GET)));

// Header
header('Content-type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename='.$filename);

// The freebusy report is another VCALENDAR object, so we can serialize it as usual:
echo $vcalendar->serialize();
exit;
