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
require_once __DIR__ . '/../config.inc.php';

// Configuration du nom de l'application pour l'ORM
if (! defined('CONFIGURATION_APP_LIBM2')) {
  define('CONFIGURATION_APP_LIBM2', 'roundcube');
}

if ($config['DEV']) {
  $dir = str_replace('/public/freebusy', '', dirname($_SERVER['SCRIPT_FILENAME']));
}
else if ($config['DOCKER']) {
  $dir = __DIR__ . '/../../bnum';
}
else {
  $dir = __DIR__ . '/../..';
}

// Inclusion de l'ORM M2
@include_once 'includes/libm2.php';

// Utilisation de la librairie Sabre VObject pour la conversion ICS
require_once '../lib/vendor/autoload.php';
require_once $dir.'/vendor/autoload.php';

// Récupération des paramètres de la requête
$start = utils::get_input_value("start", utils::INPUT_GET);
$end = utils::get_input_value("end", utils::INPUT_GET);
$email = utils::get_input_value("email", utils::INPUT_GET);
$uid = utils::get_input_value("username", utils::INPUT_GET);
$ics = utils::get_input_value("ics", utils::INPUT_GET);

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

  if (!strpos($calhash, ':')) {
    $calhash = base64_decode($calhash);
  }
  list($_user, $calendar_name) = explode(':', $calhash, 2);
  $calendar_name = utils::to_M2_id($calendar_name);
}

// Gestion des paramètres null
if (!isset($start)) {
  // Pas de start, on prend la date du jour
  $start = time() - ($config['nb_days'] * 24 * 60 * 60);
}
if (!isset($end)) {
  // Pas de end, on prend le nombre de jour
  $end = $start + (2 * $config['nb_days'] * 24 * 60 * 60);
}
if (isset($email)
    && !isset($uid)) {
  // Récupération de l'utilisateur depuis le serveur LDAP
  $infos = \LibMelanie\Ldap\Ldap::GetUserInfosFromEmail($email);
  if (isset($infos)) {
    $uid = $infos['uid'][0];
  }
}
// Si pas d'identifiant on retourne une erreur
if (!isset($uid) && !isset($calendar_name)) {
  echo "Erreur de lecture pour l'identifiant utilisateur ou de l'agenda.";
  exit();
}

if (isset($uid)) {
  // Génération du User Mél
  $user = new LibMelanie\Api\Mel\User();
  $user->uid = $uid;
  // Génération du Calendar Mél
  $calendar = new LibMelanie\Api\Mel\Calendar($user);
  $calendar->id = $uid;
}
else if (isset($calendar_name)) {
  // Génération du Calendar Mél
  $calendar = new LibMelanie\Api\Mel\Calendar(new LibMelanie\Api\Mel\User());
  $calendar->id = $calendar_name;
}

// On récupère la liste des événements
$events = $calendar->getRangeEvents("@".$start, "@".$end);

if ($ics) {
  // Parcours les événements pour récupérer les vcalendar
  $freebusy = new VObject\Component\VCalendar();
  foreach ($events as $event) {
    $event->ics_freebusy = true;
    $event->vcalendar = $freebusy;
    $freebusy = $event->vcalendar;
  }
  // Génération du nom de fichier
  if (isset($calendar_name)) {
    $filename = str_replace('%calendar', $calendar_name, $config['ics_filename']);
  }
  else {
    $filename = str_replace('%calendar', $uid, $config['ics_filename']);
  }
}
else {
  // Parcours les événements pour récupérer les vcalendar
  $vcalendars = array();
  foreach ($events as $event) {
    $event->ics_freebusy = true;
    $vcalendars[] = $event->vcalendar;
  }
  // We're giving it the calendar object. It's also possible to specify multiple objects,
  // by setting them as an array.
  //
  // We must also specify a start and end date, because recurring events are expanded.
  $fbGenerator = new VObject\FreeBusyGenerator(
      new DateTime("@".$start),
      new DateTime("@".$end),
      $vcalendars
  );

  // Grabbing the report
  $freebusy = $fbGenerator->getResult();

  // Génération du nom de fichier
  if (isset($calendar_name)) {
    $filename = str_replace('%uid', $calendar_name, $config['fb_filename']);
  }
  else {
    $filename = str_replace('%uid', $uid, $config['fb_filename']);
  }
}

// MANTIS 0005005: Rajouter une ligne de log pour un acces a l'url du calendrier
utils::log("/freebusy $_user $calendar_name");

// Header
header('Content-type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename='.$filename);
header("Expires: ".gmdate("D, d M Y H:i:s")." GMT");
header("Last-Modified: ".gmdate("D, d M Y H:i:s")." GMT");
header("Cache-Control: private, no-cache, no-store, must-revalidate, post-check=0, pre-check=0");
header("Pragma: no-cache");

// The freebusy report is another VCALENDAR object, so we can serialize it as usual:
echo $freebusy->serialize();
