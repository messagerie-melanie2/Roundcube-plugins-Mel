<?php

/**
 * Plugin d'archivage des messages depuis Roundcube
 * Les messages sont téléchargés sur le poste de l'utilisateur
 * Puis copié dans un dossier configuré dans 'mel_archivage_folder'
 */
class mel_archivage extends rcube_plugin
{
  /**
   * Task courante pour le plugin
   *
   * @var string
   */
  public $task = 'mail|settings';
  
  /**
   * RFC4155: mbox date format
   */
  const MBOX_DATE_FORMAT = 'D M d H:i:s Y';
  
  /**
   * Méthode d'initialisation du plugin mel_archivage
   */
  function init() {
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
      $this->add_button(
        array(
          'type'     => 'link',
          'label'    => 'mel_archivage.buttontext',
          'command'  => 'plugin_archiver',
          'class'    => 'button buttonPas archive',
          'classact' => 'button archive',
          'width'    => 32,
          'height'   => 32,
          'title'    => 'mel_archivage.buttontitle',
          'domain'   => $this->ID,
          'innerclass' => 'inner',
        ),
        'toolbar'
      );
      // Utiliser le driver mel ?
      $folder = $rcmail->config->get('mel_archivage_folder');
      if (class_exists('driver_mel') && isset($_GET['_account'])) {
        $delimiter = $rcmail->get_storage()->get_hierarchy_delimiter();
        $folder = driver_mel::get_instance()->getMboxFromBalp($rcmail->plugins->get_plugin('mel')->get_user_bal()) . $delimiter . $folder;
      }
      $rcmail->output->set_env('archive_folder', $folder);
      $this->register_action('plugin.mel_archivage', array($this, 'request_action'));
      $this->register_action('plugin.mel_archivage_traitement', array($this, 'traitement_archivage'));
      $this->register_action('plugin.mel_archivage_avancement', array($this, 'archivage_avancement'));
    }
  }
  
  /**
   * Affichage du template archivage
   */
  public function request_action() {
    setcookie("current_archivage", "0");
    $rcmail = rcmail::get_instance();
    $rcmail->output->set_env('help_url', $rcmail->config->get('mel_archivage_help_url'));
    $rcmail->output->set_env('mailbox', rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET));
    $rcmail->output->set_env('account', rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
    $rcmail->output->send('mel_archivage.mel_archivage');
  }
  
  /**
   * Generation de l'archivage et deplacement des messages
   */
  public function traitement_archivage() {
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
        $rcmail->output->set_env('account', rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
        $rcmail->output->show_message('mel_archivage.error_bad_folder', 'error');
        $rcmail->output->send('mel_archivage.mel_archivage');
      }
      
      $message_uid = array();
      $messageset = array();
      $break = false;
      for ($page = 1; $page <= $pages; $page++) {
        if (!$break) {
          foreach ($storage->list_messages($mbox, $page, 'date', 'ASC') as $message) {
            $dateMail = new DateTime(date("Y-m-d", strtotime($message->date)));
            $interval = $dateActuelle->diff($dateMail);
            $interval = $interval->format('%a');
            if ($interval > $nbJours) {
              $message_uid[] = $message->uid;
              $messageset[$message->folder] = $message_uid;
            } 
            else {
              $break = true;
              break;
            }
          }
        } 
        else {
          break;
        }
      }
    
      if (count($messageset) > 0) {
        $this->_download_messages($messageset);
      }
      else {
        if (class_exists('mel_logs')) {
          mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_archivage] traitement_archivage() Error: Count message = 0");
        }
        setcookie("current_archivage", "0");
        $rcmail->output->set_env('mailbox', rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET));
        $rcmail->output->set_env('account', rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
        $rcmail->output->show_message('mel_archivage.error_no_message', 'error');
        $rcmail->output->send('mel_archivage.mel_archivage');
      }

      // Créer un folder "Mes messages archivés" si non existant
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
        $storage->move_message($message_uid, $folder);
      }
    }
    catch (Exception $ex) {
      if (class_exists('mel_logs')) {
        mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_archivage] traitement_archivage() Error: " . $ex->getMessage());
      }
      setcookie("current_archivage", "0");
      $rcmail->output->set_env('mailbox', rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET));
      $rcmail->output->set_env('account', rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET));
      $rcmail->output->show_message('mel_archivage.error_too_many_messages', 'error');
      $rcmail->output->send('mel_archivage.mel_archivage');
    }
    // Variable pour archivage_avancement
    setcookie("current_archivage", "1");
    exit;
  }

  // /**
  //  * Helper method to send the zip archive to the browser
  //  */
  private function _deliver_zipfile($tmpfname, $filename)
  {
    $browser = new rcube_browser;
    $rcmail  = rcmail::get_instance();
    
    $rcmail->output->nocacheing_headers();
    
    if ($browser->ie)
    $filename = rawurlencode($filename);
    else
    $filename = addcslashes($filename, '"');
    
    // send download headers
    header("Content-Type: application/zip");
    if ($browser->ie) {
      header("Content-Type: application/force-download");
    }
    
    // don't kill the connection if download takes more than 30 sec.
    @set_time_limit(0);
    header("Content-Disposition: attachment; filename=\"" . $filename . "\"");
    header("Content-length: " . filesize($tmpfname));
    readfile($tmpfname);
  }

  /**
  * Helper function to convert filenames to the configured charset
  */
  private function _convert_filename($str)
  {
    $str = strtr($str, array(':' => '', '/' => '-'));
    
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

  /**
  * Helper method to packs all the given messages into a zip archive
  *
  * @param array List of message UIDs to download
  */
  private function _download_messages($messageset)
  {
    $rcmail    = rcmail::get_instance();
    $imap      = $rcmail->get_storage();
    // Mode maildir par défaut
    $mode      = 'maildir';
    //$mode      = rcube_utils::get_input_value('_mode', rcube_utils::INPUT_POST);
    $temp_dir  = $rcmail->config->get('temp_dir');
    $tmpfname  = tempnam($temp_dir, 'mel_archivage');
    $tempfiles = array($tmpfname);
    $folders   = count($messageset) > 1;
    // @TODO: file size limit
    
    // open zip file
    $zip = new ZipArchive();
    $zip->open($tmpfname, ZIPARCHIVE::OVERWRITE);
    
    foreach ($messageset as $mbox => $uids) {
      $imap->set_folder($mbox);
      $path = $folders ? str_replace($imap->get_hierarchy_delimiter(), '/', $mbox) . '/' : '';
      
      if ($uids === '*') {
        $index = $imap->index($mbox, null, null, true);
        $uids  = $index->get();
      }
      
      foreach ($uids as $uid) {
        
        $headers = $imap->get_message_headers($uid);
        
        if ($mode == 'mbox') {
          // Sender address
          $from = rcube_mime::decode_address_list($headers->from, null, true, $headers->charset, true);
          $from = array_shift($from);
          $from = preg_replace('/\s/', '-', $from);
          
          // Received (internal) date
          $date = rcube_utils::anytodatetime($headers->internaldate);
          if ($date) {
            $date->setTimezone(new DateTimeZone('UTC'));
            $date = $date->format(self::MBOX_DATE_FORMAT);
          }
          
          // Mbox format header (RFC4155)
          $header = sprintf(
            "From %s %s\r\n",
            $from ?: 'MAILER-DAEMON',
            $date ?: ''
          );
          
          fwrite($tmpfp, $header);
          
          // Use stream filter to quote "From " in the message body
          stream_filter_register('mbox_filter', 'mel_archivage_mbox_filter');
          $filter = stream_filter_append($tmpfp, 'mbox_filter');
          $imap->get_raw_body($uid, $tmpfp);
          stream_filter_remove($filter);
          fwrite($tmpfp, "\r\n");
        } else { // maildir
          $subject = rcube_mime::decode_header($headers->subject, $headers->charset);
          $subject = $this->_filename_from_subject(mb_substr($subject, 0, 32));
          $subject = $this->_convert_filename($subject);
          
          $disp_name = $path . $uid . ($subject ? " $subject" : '') . '.eml';
          
          $tmpfn = tempnam($temp_dir, 'zipmessage');
          $tmpfp = fopen($tmpfn, 'w');
          $imap->get_raw_body($uid, $tmpfp);
          $tempfiles[] = $tmpfn;
          fclose($tmpfp);
          $zip->addFile($tmpfn, $disp_name);
        }
      }
    }
    
    // Nom du fichier archive_<date>_dossier.zip
    $archivage_date = rcube_utils::get_input_value('archivage_date', rcube_utils::INPUT_GET);
    $date = DateTime::createFromFormat('d/m/Y', urldecode($archivage_date));
    $_folder = rcube_charset::convert($imap->get_folder(), 'UTF7-IMAP');
    if (strtoupper($_folder) == 'INBOX') {
      $_folder = $rcmail->get_user_name();
    }
    else if (!isset($_GET['_account']) 
          || empty($_GET['_account'])) {
        $_folder = $rcmail->get_user_name() . '-' . $_folder;
    }
    $filename = "archive_".$date->format('Ymd')."-" . $_folder;
    
    if ($mode == 'mbox') {
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
}
