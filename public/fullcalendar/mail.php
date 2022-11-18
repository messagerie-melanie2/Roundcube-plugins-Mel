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
  private function __construct()
  {
  }

  /**
   * Méthode pour envoyer un mail en html
   *
   * @param string $from adresse utilisée pour envoyer le message
   * @param string $to destinataire du message
   * @param string $subject sujet du message
   * @param string $message [optionnel] message complet (sans les entêtes) en text/html
   * @param string $message_id [optionnel] identifiant du message à envoyer
   * @return boolean
   */
  public static function SendMail($from, $to, $subject, $message = null, $message_id = null)
  {
    global $config;
    // Génération de la boundary
    $boundary = '-----=' . md5(uniqid(mt_rand()));

    // Mail html headers
    $headers = array();
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Transfer-Encoding: 8BIT";
    $headers[] = "From: " . quoted_printable_encode($from);
    $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
    if (isset($bcc)) {
      $headers[] = "Bcc: " . $bcc;
    }
    if (isset($message_id)) {
      $headers[] = "Message-ID: <$message_id>";
    }
    if (isset($in_reply_to)) {
      $headers[] = "In-Reply-To: <$in_reply_to>";
      $headers[] = "References: <$in_reply_to>";
    }
    $headers[] = "X-Mailer: " . quoted_printable_encode($config['xmail']);
    $envelopefrom = "-f $from";

    // Set boundary
    $message = str_replace("%%boundary%%", $boundary, $message);

    return mail($to, mb_encode_mimeheader($subject), $message, implode("\r\n", $headers), $envelopefrom);
  }

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
    $message_id = $config['mail_message_id_prefix'] . md5(uniqid(mt_rand())) . $config['mail_message_id_suffix'];
    $from = $config['mail_from'];
    $to = '=?UTF-8?B?' . base64_encode('"' . $organizer->name . '"') . '?=' . "\r\n <" . $organizer->email . ">";
    $body = file_get_contents(__DIR__ . '/templates/organizer_appointment_mail.html');
    // Replace elements
    $subject = str_replace("%%attendee_firstname%%", $attendee['firstname'], $subject);
    $subject = str_replace("%%appointment_date_day%%", $appointment['date_day'], $subject);
    $body = str_replace("%%app_name%%", $config['app_name'], $body);
    $body = str_replace("%%organizer_name%%", $organizer->fullname, $body);
    $body = str_replace("%%appointment_object%%", $appointment['object'], $body);
    $body = str_replace("%%attendee_name%%", $attendee['name'], $body);
    $body = str_replace("%%attendee_email%%", $attendee['email'], $body);
    $body = str_replace("%%appointment_date%%", $appointment['date'], $body);
    $body = str_replace("%%appointment_description%%", $appointment['description'], $body);
    $body = str_replace("%%appointment_location%%", $appointment['location'], $body);

    return self::SendMail($from, $to, $subject, $body, $message_id);
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
    $message_id = $config['mail_message_id_prefix'] . md5(uniqid(mt_rand())) . $config['mail_message_id_suffix'];
    $from = $config['mail_from'];
    // $to = '=?UTF-8?B?' . base64_encode('"' . $attendee['name'] . ' ' .  $attendee['firstname'] . '"') . '?=' . "\r\n <" . $attendee['email'] . ">";
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

    $body = str_replace("%%event_ics%%", $ics, $body);
    $body = str_replace("BEGIN:VEVENT", "METHOD:REQUEST\r\nBEGIN:VEVENT", $body);

    return self::SendMail($from, $to, $subject, $body, $message_id);
  }
}
