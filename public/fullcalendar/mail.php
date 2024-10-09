<?php

/**
 * Ce fichier fait parti de l'application de calendrier externe du BNUM
 *
 * L'application est écrite en PHP5,HTML et Javascript
 * et utilise une base de données postgresql  *
 * 
 * @author Arnaud Goubier
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

require_once __DIR__ . '/../config.inc.php';

/**
 * Classe de gestion des mails
 *
 * @package Lib
 * @subpackage Mail
 */
class Mail
{
  /**
   * Constructeur privé pour ne pas instancier la classe
   */
  private function __construct() {}

  /**
   * Méthode d'envoi du message notification à l'organisateur à la création du sondage
   *
   * @param $attendee informations de l'organisateur
   * @param $attendee informations du participant
   * @return boolean
   */

  public static function SendOrganizerAppointmentMail($organizer, $attendee, $appointment)
  {
    global $config;
    $subject = $config["organizer_mail_subject"];
    $from = $config['mail_from'];
    $to = '=?UTF-8?B?' . base64_encode('"' . $organizer->name . '"') . '?=' . "\r\n <" . $organizer->email . ">";
    $body = file_get_contents(__DIR__ . '/templates/organizer_appointment_mail.html');
    // Replace elements
    $subject = str_replace("%%attendee_name%%", $attendee['name'] . ' ' . $attendee['firstname'], $subject);
    $subject = str_replace("%%appointment_date_day%%", $appointment['date_day'], $subject);
    $body = str_replace("%%appointment_object%%", $appointment['object'], $body);
    $body = str_replace("%%attendee_name%%", $attendee['name'] . ' ' . $attendee['firstname'], $body);
    $body = str_replace("%%attendee_email%%", $attendee['email'], $body);
    $body = str_replace("%%appointment_date%%", $appointment['date'], $body);
    $body = str_replace("%%appointment_description%%", $appointment['description'], $body);
    $body = str_replace("%%appointment_location%%", $appointment['location'], $body);

    return \LibMelanie\Mail\Mail::Send($from, $to, $subject, $body);
  }

  /**
   * Méthode d'envoi du message notification au participant à la création du sondage
   *
   * @param $attendee informations de l'organisateur
   * @param $attendee informations du participant
   * @return boolean
   */

  public static function SendAttendeeAppointmentMail($organizer, $attendee, $appointment, $ics)
  {
    global $config;
    $subject = $config["attendee_mail_subject"];
    $from = $config['mail_from'];
    $to = '=?UTF-8?B?' . base64_encode('"' . $attendee['name'] . '"') . '?=' . "\r\n <" . $attendee['email'] . ">";
    $object = $appointment['object'];

    $body = file_get_contents(__DIR__ . '/templates/attendee_appointment_mail.html');
    // Replace elements
    $subject = str_replace("%%organizer_name%%", $organizer->name, $subject);
    $subject = str_replace("%%appointment_date_day%%", $appointment['date_day'], $subject);
    $body = str_replace("%%attendee_firstname%%", $attendee['firstname'], $body);



    if ($object) {
      if ($object == "custom") {
        $body = str_replace("%%appointment_object%%", '', $body);
        $body = str_replace("%%appointment_description%%", $appointment['description'], $body);
      } else {
        $body = str_replace("%%appointment_object%%", 'pour "' . $object . '" ', $body);
        $body = str_replace("%%appointment_description%%", "Aucune informations sur cet évènement", $body);
      }
    } else {
      $body = str_replace("%%appointment_object%%", '', $body);
      $body = str_replace("%%appointment_description%%", "Aucune informations sur cet évènement", $body);
    }

    if ($appointment['type']) {
      $type_template =  file_get_contents(__DIR__ . '/templates/location/' . $appointment['type'] . '.html');
      $type_template =  str_replace("%%appointment_location%%", $appointment['location'], $type_template);
      if ($appointment['type'] == "webconf") {
        $type_template =  str_replace("%%appointment_webconf_phone%%", $appointment['phone'], $type_template);
        $type_template =  str_replace("%%appointment_webconf_pin%%", $appointment['pin'], $type_template);
      }
    }

    $body = str_replace("%%location_template%%", $type_template, $body);

    $body = str_replace("%%appointment_date_day%%", $appointment['date_day'], $body);
    $body = str_replace("%%appointment_date_time%%", $appointment['date_time'], $body);
    $body = str_replace("%%organizer_name%%", $organizer->name, $body);
    $body = str_replace("%%attendee_email%%", $attendee['email'], $body);

    $body = str_replace("BEGIN:VEVENT", "METHOD:REQUEST\r\nBEGIN:VEVENT", $body);

    return \LibMelanie\Mail\Mail::Send($from, $to, $subject, $body, null, null, null, null, null, null, null, null, $ics);
  }
}
