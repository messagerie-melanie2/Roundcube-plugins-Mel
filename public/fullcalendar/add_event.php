<?php

// Inclusion des fichiers
require_once '../lib/utils.php';
require_once 'mail.php';
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
  echo json_encode(["success" => false, "error" => "Erreur de lecture pour l'identifiant de l'agenda."]);
  exit();
}


// Génération de l'utilisateur Mél
if (isset($_user)) {
  $user = new LibMelanie\Api\Mel\User();
  $user->uid = $_user;
  $user->load();
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
  echo json_encode(["success" => false, "error" => "La clé d'identification n'est pas valide"]);
  exit;
}

// Génération du calendrier et de l'évènement
if (isset($user)) {
  $calendar = new LibMelanie\Api\Mel\Calendar($user);
  $calendar->id = $calendar_name;
  $calendar->load();

  $event = new LibMelanie\Api\Mel\Event($user, $calendar);
  $event->uid = generate_uid($_user);
  $event->load();

  $events = $calendar->getAllEvents();

  $appointment = json_decode($_POST['appointment'], true);
  $attendee_post = json_decode($_POST['attendee'], true);

  $event->created = time();
  $event->title = $appointment['object'] == "" ? "Rendez-vous" . displayUserFullName($attendee_post) : $appointment['object'] . displayUserFullName($attendee_post);
  $event->start = new DateTime($appointment['time_start']);
  $event->end = new DateTime($appointment['time_end']);
  $event->description = $appointment['description'];
  if ($appointment['type'] == "webconf") {
    $event->location = $appointment['location'] + '(' + $appointment['phone'] + ' | ' + $appointment['pin'] + ')';
  } else {
    $event->location = $appointment['location'];
  }

  $_attendees = array();
  $organizer = new LibMelanie\Api\Mel\Organizer($event);
  $organizer->name = $user->fullname;
  $organizer->email =  $user->email;
  $event->organizer = $organizer;

  $attendee = new LibMelanie\Api\Mel\Attendee();
  $attendee->name = $attendee_post['name'] . ' ' . $attendee_post['firstname'];
  $attendee->email = $attendee_post['email'];
  $attendee->role = LibMelanie\Api\Mel\Attendee::ROLE_REQ_PARTICIPANT;
  $_attendees[] = $attendee;

  $event->attendees = $_attendees;

  $event_ics = $event->ics;

  $event_response = $event->save();

  if (!is_null($event_response)) {
    Mail::SendAttendeeAppointmentMail($organizer, $attendee_post, $appointment, $event_ics);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["success" => true]);
  } else {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["success" => false, "error" => "Echec de l'enregistrement"]);
  }
}

/**
 * Generate a unique identifier for an event
 */
function generate_uid($_user)
{
  return strtoupper(md5(time() . uniqid(rand())) . '-' . substr(md5($_user), 0, 16));
}

/**
 * Generate the user fullname
 */
function displayUserFullName($attendee_post)
{
  return ' avec ' . $attendee_post['firstname'] . ' ' . $attendee_post['name'];
}
