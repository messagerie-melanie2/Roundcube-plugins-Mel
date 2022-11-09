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

namespace Program\Lib\Mail;

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
   * Méthode pour envoyer un message en text brut ou en html
   *
   * @param string $from adresse utilisée pour envoyer le message
   * @param string $to destinataire du message
   * @param string $subject sujet du message
   * @param string $bcc [optionnel] liste des destinataires en copie cachée
   * @param string $body corp du message
   * @param string $body_html [optionnel] corp du message en html
   * @param string $message [optionnel] message complet (sans les entêtes) en text/html
   * @param string $message_id [optionnel] identifiant du message à envoyer
   * @param string $in_reply_to [optionnel] réponse au message précédent
   * @return boolean
   */
  public static function SendMail($from, $to, $subject, $bcc = null, $body = null, $body_html = null, $message = null, $message_id = null, $in_reply_to = null, $as_attachment = false)
  {
    // Mail HTML
    if (isset($body_html)) {
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
      $headers[] = "X-Mailer: " . quoted_printable_encode(\Config\IHM::$TITLE . "/" . VERSION . '-' . BUILD);
      $envelopefrom = "-f $from";

      // Message texte
      $message = 'This is a multi-part message in MIME format.' . "\n\n";

      $message .= '--' . $boundary . "\n";
      $message .= 'Content-Type: text/plain; charset=UTF-8"' . "\n";
      $message .= 'Content-Transfer-Encoding: 8bit' . "\n\n";
      $message .= $body . "\n\n";

      // Message HTML
      $message .= '--' . $boundary . "\n";
      $message .= 'Content-Type: text/html; charset=UTF-8"' . "\n";
      $message .= 'Content-Transfer-Encoding: 8bit' . "\n\n";
      $message .= $body_html . "\n\n";

      $message .= '--' . $boundary . "\n";

      return mail($to, mb_encode_mimeheader($subject), $message, implode("\r\n", $headers), $envelopefrom);
    } else if (isset($message) && !$as_attachment) {
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
      $headers[] = "X-Mailer: " . quoted_printable_encode(\Config\IHM::$TITLE . "/" . VERSION . '-' . BUILD);
      $envelopefrom = "-f $from";

      // Set boundary
      $message = str_replace("%%boundary%%", $boundary, $message);

      return mail($to, mb_encode_mimeheader($subject), $message, implode("\r\n", $headers), $envelopefrom);
    } else if (isset($message) && $as_attachment) {
      // Génération de la boundary
      $boundary = '-----=' . md5(uniqid(mt_rand()));

      // Mail html headers
      $headers = array();
      $headers[] = "MIME-Version: 1.0";
      $headers[] = "Content-Transfer-Encoding: 8BIT";
      $headers[] = "From: " . quoted_printable_encode($from);
      $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
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
      $headers[] = "X-Mailer: " . quoted_printable_encode(\Config\IHM::$TITLE . "/" . VERSION . '-' . BUILD);
      $envelopefrom = "-f $from";

      // Set boundary
      $message = str_replace("%%boundary%%", $boundary, $message);

      return mail($to, mb_encode_mimeheader($subject), $message, implode("\r\n", $headers), $envelopefrom);
    } else {
      // Mail text headers
      $headers = array();
      $headers[] = "MIME-Version: 1.0";
      $headers[] = "Content-type: text/plain; charset=UTF-8";
      $headers[] = "Content-Transfer-Encoding: 8BIT";
      $headers[] = "From: " . quoted_printable_encode($from);
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
      $headers[] = "X-Mailer: " . quoted_printable_encode(\Config\IHM::$TITLE . "/" . VERSION . '-' . BUILD);
      $envelopefrom = "-f $from";

      return mail($to, mb_encode_mimeheader($subject), $body, implode("\r\n", $headers), $envelopefrom);
    }
  }

    /**
   * Méthode d'envoi du message notification à la création du sondage
   *
   * @param \Program\Data\Poll $poll sondage créé
   * @param \Program\Data\User $user utilisateur qui vient de créer le sondage
   * @return boolean
   */
  public static function SendCreatePollMail(\Program\Data\Poll $poll, \Program\Data\User $user)
  {
    $subject = Localization::g("Create poll mail subject", false);
    $message_id = md5($poll->organizer_id) . $poll->poll_uid . '-' . strtotime($poll->created) . "@" . \Config\IHM::$TITLE;
    $from = \Config\IHM::$FROM_MAIL;
    $to = '=?UTF-8?B?' . base64_encode('"' . $user->fullname . '"') . '?=' . "\r\n <" . $user->email . ">";
    $body = file_get_contents(__DIR__ . '/templates/' . \Config\IHM::$DEFAULT_LOCALIZATION . '/created_poll.html');
    // Replace elements
    $subject = str_replace("%%app_name%%", \Config\IHM::$TITLE, $subject);
    $subject = str_replace("%%poll_title%%", $poll->title, $subject);
    $body = str_replace("%%app_name%%", \Config\IHM::$TITLE, $body);
    $body = str_replace("%%poll_title%%", $poll->title, $body);
    // Gestion de l'emplacement
    if (!empty($poll->location)) {
      $location = "\r\n\r\n" . Localization::g('Edit location', false) . ": " . $poll->location;
      $html_location = "<br><div><b>" . Localization::g('Edit location', false) . " : </b>" . str_replace("\r\n", "<br>", htmlentities($poll->location)) . "</div>";
    } else {
      $location = '';
      $html_location = '';
    }
    $body = str_replace("%%poll_location%%", $location, $body);
    $body = str_replace("%%html_poll_location%%", $html_location, $body);
    // Gestion de la description
    if (!empty($poll->description)) {
      $description = "\r\n\r\n" . Localization::g('Edit description', false) . ":\r\n" . $poll->description;
      $html_description = "<br><div><b>" . Localization::g('Edit description', false) . " : </b></div><div>" . str_replace("\r\n", "<br>", htmlentities($poll->description)) . "</div>";
    } else {
      $description = '';
      $html_description = '';
    }
    $body = str_replace("%%poll_description%%", $description, $body);
    $body = str_replace("%%html_poll_description%%", $html_description, $body);
    $body = str_replace("%%user_fullname%%", $user->fullname, $body);

    return self::SendMail($from, $to, $subject, null, null, null, $body, $message_id);
  }
}
