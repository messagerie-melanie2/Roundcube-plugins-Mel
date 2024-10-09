<?php

// Inclusion des fichiers
require_once '../lib/utils.php';
require_once 'mail.php';
require_once __DIR__ . '/../config.inc.php';

// Configuration du nom de l'application pour l'ORM
if (!defined('CONFIGURATION_APP_LIBM2')) {
  define('CONFIGURATION_APP_LIBM2', 'roundcube');
}

// Inclusion de l'ORM M2
@include_once 'includes/libm2.php';

@include_once '../lib/mel/mel.php';

// Utilisation de la librairie Sabre VObject pour la conversion ICS
require_once '../lib/vendor/autoload.php';

$data = utils::check_hash_key();
$data['user']->load();

if (!$data['user']) {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(["error" => "La clé d'identification n'est pas valide"]);
  exit;
}

$calendar = new LibMelanie\Api\Mel\Calendar($data['user']);
$calendar->id = $data['calendar_name'];
$calendar->load();

$event = new LibMelanie\Api\Mel\Event($data['user'], $calendar);
$event->uid = utils::generate_uid($_user);
$event->load();

$appointment = json_decode($_POST['appointment'], true);
$attendee_post = json_decode($_POST['attendee'], true);

$event->created = time();
$event->title = ($appointment['object'] == "custom" || $appointment['object'] == "") ? "Rendez-vous" . displayUserFullName($attendee_post) : $appointment['object'] . displayUserFullName($attendee_post);
$event->start = new DateTime($appointment['time_start']);
$event->end = new DateTime($appointment['time_end']);
$event->description = $appointment['description'];
$event->timezone = $event->timezone;
$event->event_creator_id = $data['user']->uid;
$event->alarm = 0;
$event->transparency = "OPAQUE";
$event->event_private = 0;
$event->modified = $event->created;
$event->modified_json = $event->created;
$event->event_status = 2;
$event->all_day = 0;

if ($appointment['type'] == "webconf") {
  $event->location = $appointment['location'] ? $appointment['location'] . '(' . $appointment['phone'] . ' | ' . $appointment['pin'] . ')' : "";
} else {
  $event->location = $appointment['location'] ?? "";
}

$_attendees = array();
$organizer = new LibMelanie\Api\Mel\Organizer($event);
$organizer->name = $data['user']->fullname;
$organizer->email =  $data['user']->email;
$event->organizer = $organizer;

$attendee = new LibMelanie\Api\Mel\Attendee();
$attendee->name = $attendee_post['name'] . ' ' . $attendee_post['firstname'];
$attendee->email = $attendee_post['email'];
$attendee->role = LibMelanie\Api\Mel\Attendee::ROLE_REQ_PARTICIPANT;
$_attendees[] = $attendee;

$event->attendees = $_attendees;

$event_ics = $event->ics;

$event_response = $event->save();

$user_prefs = json_decode($data['user']->getCalendarPreference("appointment_properties"));

if (!is_null($event_response)) {

  Mail::SendAttendeeAppointmentMail($organizer, $attendee_post, $appointment, $event_ics);

  if ($user_prefs->notification_type === "mail") {
    Mail::SendOrganizerAppointmentMail($organizer, $attendee_post, $appointment);
  } else {
    SendOrganizerNotification($data['user'], $attendee_post, $appointment);
  }
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(["success" => "Validation de l'enregistrement"]);
} else {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(["error" => "Echec de l'enregistrement"]);
}

/**
 * Generate the user fullname
 */
function displayUserFullName($attendee_post)
{
  return ' avec ' . $attendee_post['firstname'] . ' ' . $attendee_post['name'];
}

function SendOrganizerNotification($user, $attendee_post, $appointment)
{
  // Créer une notification
  $notification = new LibMelanie\Api\Mce\Notification($user);

  $notification->category = "agenda";
  $notification->title = $attendee_post['firstname'] . ' ' . $attendee_post['name'] . ' a pris rendez-vous avec vous le ' . $appointment['date_day'] . ' à ' . $appointment['date_time'];
  $notification->content = $attendee_post['firstname'] . ' ' . $attendee_post['name'] . ' a pris rendez-vous avec vous le ' . $appointment['date_day'] . ' à ' . $appointment['date_time'] . ' pour "' . $appointment['object'] . '"';
  $notification->action = serialize([
    [
      'text' => "Ouvrir mon agenda",
      'title' => "Cliquez pour ouvrir votre agenda",
      'command' => 'change_page',
      'params' => ['task' => 'calendar']
    ]
  ]);

  // Ajouter la notification au User
  $user->addNotification($notification);
}
