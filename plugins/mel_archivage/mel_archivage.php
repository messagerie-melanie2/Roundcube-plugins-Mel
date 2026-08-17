<?php

/**
 * Plugin Mél Archivage
 *
 * Plugin d'archivage des messages depuis Roundcube
 * Les messages sont téléchargés sur le poste de l'utilisateur
 * Puis copié dans un dossier configuré dans 'mel_archivage_folder' 
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class mel_archivage extends rcube_plugin
{
  /**
   * Task courante pour le plugin
   *
   * @var string
   */
  public $task = 'mail|settings';

  private $charset       = 'ASCII';

  /**
   * RFC4155: mbox date format
   */
  const MBOX_DATE_FORMAT = 'D M d H:i:s Y';

  /**
   * Méthode d'initialisation du plugin mel_archivage
   */
  function init()
  {
    // check requirements first
    if (!class_exists('ZipArchive', false)) {
      rcmail::raise_error(array(
        'code'    => 520,
        'file'    => __FILE__,
        'line'    => __LINE__,
        'message' => "php_zip extension is required for the zipdownload plugin"
      ), true, false);
      return;
    }
    $rcmail = rcmail::get_instance();

    $this->load_config();
    $this->charset = $rcmail->config->get('mel_archivage_charset', RCUBE_CHARSET);

    if ($rcmail->task == 'settings' || $rcmail->task == 'mail') {
      if ($rcmail->config->get('ismobile', false)) {
        $skin_path = 'skins/mel_larry_mobile';
      } else {
        $skin_path = $this->local_skin_path();
      }
      $this->include_stylesheet($skin_path . '/css/mel_archivage.css');
      $this->include_script('mel_archivage.js');
      $this->add_texts('localization/', true);


      // Utiliser le driver mel ?
      $folder = $rcmail->config->get('mel_archivage_folder');
      if (class_exists('driver_mel') && isset($_GET['_account'])) {
        $delimiter = $rcmail->get_storage()->get_hierarchy_delimiter();
        $folder = driver_mel::get_instance()->getMboxFromBalp($rcmail->plugins->get_plugin('mel')->get_user_bal()) . $delimiter . $folder;
      }
      $rcmail->output->set_env('archive_folder', $folder);
      $this->register_action('plugin.mel_archivage', array($this, 'request_action'));
      $this->register_action('plugin.mel_archivage_traitement_browser', array($this, 'traitement_archivage_browser'));
      $this->register_action('plugin.mel_archivage_traitement_electron', array($this, 'traitement_archivage_electron'));

      if ($rcmail->task == 'mail') {
        // Ajout du bouton dans la toolbar
        $this->add_button(array(
          'type'        => 'link',
          'command'     => 'plugin_archiver',
          'class'       => 'button archiver disabled',
          'classact'    => 'button archiver hide-touch',
          'label'       => 'archive',
          'title'       => 'title',
          'domain'      => $this->ID,
          'innerclass'  => 'inner',
        ), 'listcontrols');
      }
    }
  }

  /**
   * Affichage du template archivage
   */
  public function request_action()
  {
    setcookie("current_archivage", "0");
    $rcmail = rcmail::get_instance();
    $rcmail->output->set_env('help_url', $rcmail->config->get('mel_archivage_help_url'));
    $rcmail->output->set_env('mailbox', rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET));
    $rcmail->output->set_env('account', rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
    $rcmail->output->send('mel_archivage.mel_archivage');
  }

  /**
   * Envoi la liste des mails au javascript
   */
  public function traitement_archivage_electron()
  {
    header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
    $uids = rcube_utils::get_input_value('_uids', rcube_utils::INPUT_GET);
    $path_folder = rcube_utils::get_input_value('_path_folder', rcube_utils::INPUT_GET);
    $result = "";
    //Système d'archivage avec glisser/déposer
    if ($uids) {
      $result = array('action' => 'plugin.mel_archivage_traitement_electron', 'data' => $this->traitement_archivage_drag_drop(), 'path_folder' => $path_folder);
    } else {
      $result = array('action' => 'plugin.mel_archivage_traitement_electron', 'data' => $this->traitement_archivage());
    }
    echo json_encode($result);
    exit;
  }
  /**
   * Téléchargement des mails
   */
  public function traitement_archivage_browser()
  {
    $messageset = [];
    $messageset = $this->traitement_archivage();

    $this->_download_messages($messageset);
    $this->move_message($messageset);

    exit;
  }


  /**
   * Récupération des flags pour les mails archivés à l'aide du glisser/déposer
   */
  public function traitement_archivage_drag_drop()
  {
    try {
      $rcmail = rcmail::get_instance();
      $storage = $rcmail->get_storage();

      $uids = rcube_utils::get_input_value('_uids', rcube_utils::INPUT_GET);
      $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET);

      $messageset = [];
      foreach ($uids as $uid) {
        $message = $storage->get_message($uid, $mbox);
        $messageset[$message->folder][] = [
          "message_uid" => $message->uid,
          "flags" => $message->flags
        ];
      }
      setcookie("current_archivage", "1");
      return $messageset;

    } catch (Exception $ex) {
      if (class_exists('mel_logs')) {
        mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_archivage] traitement_archivage() Error: " . $ex->getMessage());
      }
      setcookie("current_archivage", "0");
      $rcmail->output->set_env('mailbox', rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET));
      $rcmail->output->show_message('mel_archivage.error_too_many_messages', 'error');
      $rcmail->output->send('mel_archivage.mel_archivage');
    }
  }


  /**
   * Generation de la liste d'uid de mails à télécharger et deplacement des messages
   */
  public function traitement_archivage()
  {
    try {
      $nbJours = rcube_utils::get_input_value('nb_jours', rcube_utils::INPUT_GET);
      $dateActuelle = new DateTime(date('Y-m-d'));

      $rcmail = rcmail::get_instance();
      $storage = $rcmail->get_storage();

      $folder = $rcmail->config->get('mel_archivage_folder');

      $storage->set_threading(false);

      $mbox           = $storage->get_folder();
      $msg_count      = $storage->count();
      $page_size      = $storage->get_pagesize();
      $pages          = ceil($msg_count / $page_size);

      if (class_exists('mel_logs')) {
        mel_logs::get_instance()->log(mel_logs::INFO, "[mel_archivage] traitement_archivage($nbJours, $mbox)");
      }
      // Si l'utilisateur est dans le dossier Messages Archivés
      if ($mbox == $folder) {
        if (class_exists('mel_logs')) {
          mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_archivage] traitement_archivage() Error: Bad Mbox");
        }
        setcookie("current_archivage", "0");
        $rcmail->output->set_env('mailbox', rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET));
        $rcmail->output->show_message('mel_archivage.error_bad_folder', 'error');
        $rcmail->output->send('mel_archivage.mel_archivage');
      }

      $messageset = [];
      $break = false;
      for ($page = 1; $page <= $pages; $page++) {
        if (!$break) {
          foreach ($storage->list_messages($mbox, $page, 'date', 'ASC') as $message) {
            $dateMail = new DateTime(date("Y-m-d", strtotime($message->date)));
            $interval = $dateActuelle->diff($dateMail);
            $interval = $interval->format('%a');
            if ($interval > $nbJours) {
              if (!is_array($messageset[$message->folder])) {
                $messageset[$message->folder] = [];
              }
              if ($rcmail->output->get_env('iselectron')) {
                $messageset[$message->folder][] = [
                  "message_uid" => $message->uid,
                  "flags" => $message->flags
                ];
              } else {
                $messageset[$message->folder][] = $message->uid;
              }
            } else {
              $break = true;
              break;
            }
          }
        } else {
          break;
        }
      }


      if (count($messageset) > 0) {
        setcookie("current_archivage", "1");
        return $messageset;
      } else {
        if (class_exists('mel_logs')) {
          mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_archivage] traitement_archivage() Error: Count message = 0");
        }
        setcookie("current_archivage", "0");
        $rcmail->output->set_env('mailbox', rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET));
        $rcmail->output->show_message('mel_archivage.error_no_message', 'error');
        $rcmail->output->send('mel_archivage.mel_archivage');
      }
    } catch (Exception $ex) {
      if (class_exists('mel_logs')) {
        mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_archivage] traitement_archivage() Error: " . $ex->getMessage());
      }
      setcookie("current_archivage", "0");
      $rcmail->output->set_env('mailbox', rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET));
      $rcmail->output->show_message('mel_archivage.error_too_many_messages', 'error');
      $rcmail->output->send('mel_archivage.mel_archivage');
    }
    // Variable pour archivage_avancement
    setcookie("current_archivage", "1");
    exit;
  }

  /**
   * Créer un folder "Mes messages archivés" si non existant et déplace les mails archivés
   * 
   * @param array $messageset List of message UIDs to move
   */
  private function move_message($messageset)
  {
    $rcmail = rcmail::get_instance();
    $storage = $rcmail->get_storage();

    $folder = $rcmail->config->get('mel_archivage_folder');

    if (isset($folder)) {
      $delimiter = $storage->get_hierarchy_delimiter();

      // Utiliser le driver mel ?
      if (class_exists('driver_mel')) {
        $folder = driver_mel::get_instance()->getMboxFromBalp($rcmail->plugins->get_plugin('mel')->get_user_bal()) . $delimiter . $folder;
      }

      $list_folders = $storage->list_folders('', $folder . '*', 'mail', null, true);

      //Si le dossier n'existe pas
      if (!in_array($folder, $list_folders)) {
        $path = explode($delimiter, $folder);

        for ($i = 0; $i < count($path); $i++) {
          $_folder = implode($delimiter, array_slice($path, 0, $i + 1));
          if (!in_array($_folder, $list_folders)) {
            $storage->create_folder($_folder, true);
          }
        }
      }
      foreach ($messageset as $messageset_uid) {
        $storage->move_message($messageset_uid, $folder);
      }
    }
  }

  /**
   * Helper method to packs all the given messages into a zip archive
   *
   * @param array $messageset List of message UIDs to download
   */
  public function _download_messages($messageset)
  {
      $this->add_texts('localization');

      $rcmail    = rcmail::get_instance();
      $imap      = $rcmail->get_storage();
      $delimiter = $imap->get_hierarchy_delimiter();
      // PAMELA - Shared temp dir
      $tmpfname  = rcube_utils::temp_filename('mel_archivage', true, true, true);
      $tempfiles = [$tmpfname];
      $folders   = count($messageset) > 1;
      $messages  = [];

      // collect messages metadata (and check size limit)
      foreach ($messageset as $mbox => $uids) {
          $imap->set_folder($mbox);

          if ($uids === '*') {
              $index = $imap->index($mbox, null, null, true);
              $uids  = $index->get();
          }

          foreach ($uids as $uid) {
              $headers = $imap->get_message_headers($uid);

              // maildir
              $subject = rcube_mime::decode_header($headers->subject, $headers->charset);
              $subject = $this->_filename_from_subject(mb_substr($subject, 0, 16));
              $subject = $this->_convert_filename($subject);

              $path      = $folders ? str_replace($delimiter, '/', $mbox) . '/' : '';
              $disp_name = $path . $uid . ($subject ? " $subject" : '') . '.eml';

              $messages[$uid . ':' . $mbox] = $disp_name;              
          }
      }

      // open zip file
      $zip = new ZipArchive();
      $zip->open($tmpfname, ZIPARCHIVE::OVERWRITE);

      $last_key = array_key_last($messages);
      foreach ($messages as $key => $value) {
          list($uid, $mbox) = explode(':', $key, 2);
          $imap->set_folder($mbox);

          if (!empty($tmpfp)) {
              fwrite($tmpfp, $value);

              // Use stream filter to quote "From " in the message body
              stream_filter_register('mbox_filter', 'zipdownload_mbox_filter');
              $filter = stream_filter_append($tmpfp, 'mbox_filter');
              $imap->get_raw_body($uid, $tmpfp);
              stream_filter_remove($filter);
              // Make sure the delimiter is a double \r\n
              $fstat = fstat($tmpfp);
              if (stream_get_contents($tmpfp, 2, $fstat['size'] - 2) != "\r\n") {
              fwrite($tmpfp, "\r\n");
              }
              if ($key != $last_key) {
                  fwrite($tmpfp, "\r\n");
              }
          }
          else { // maildir
              $tmpfn = rcube_utils::temp_filename('zipmessage');
              $fp = fopen($tmpfn, 'w');
              $imap->get_raw_body($uid, $fp);
              $tempfiles[] = $tmpfn;
              fclose($fp);
              $zip->addFile($tmpfn, $value);
          }
      }

      // Nom du fichier archive_<date>_dossier.zip
      $archivage_date = rcube_utils::get_input_value('archivage_date', rcube_utils::INPUT_GET);
      $date = DateTime::createFromFormat('d/m/Y', urldecode($archivage_date));
      $_folder = rcube_charset::convert($imap->get_folder(), 'UTF7-IMAP');
      if (strtoupper($_folder) == 'INBOX') {
        $_folder = $rcmail->get_user_name();
      } else if (
        !isset($_GET['_account'])
        || empty($_GET['_account'])
      ) {
        $_folder = $rcmail->get_user_name() . '-' . $_folder;
      }
      $filename = "archive_" . $date->format('Ymd') . "-" . $_folder;

      if (!empty($tmpfp)) {
          $tempfiles[] = $tmpfname . '.mbox';
          fclose($tmpfp);
          $zip->addFile($tmpfname . '.mbox', $filename . '.mbox');
      }

      $zip->close();

      $this->_deliver_zipfile($tmpfname, $filename . '.zip');

      // delete temporary files from disk
      foreach ($tempfiles as $tmpfn) {
          unlink($tmpfn);
      }
  }

  /**
   * Helper method to send the zip archive to the browser
   */
  private function _deliver_zipfile($tmpfname, $filename)
  {
      $rcmail = rcmail::get_instance();

      $rcmail->output->download_headers($filename, ['length' => filesize($tmpfname)]);

      readfile($tmpfname);
  }

  /**
   * Helper function to convert filenames to the configured charset
   */
  private function _convert_filename($str)
  {
      $str = strtr($str, [':' => '', '/' => '-']);

      return rcube_charset::convert($str, RCUBE_CHARSET, $this->charset);
  }

  /**
   * Helper function to convert message subject into filename
   */
  private function _filename_from_subject($str)
  {
      $str = preg_replace('/[\t\n\r\0\x0B]+\s*/', ' ', $str);

      return trim($str, " ./_");
  }
}
