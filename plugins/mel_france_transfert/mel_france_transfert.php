<?php
/**
 * Plugin Mél France Transfert
 *
 * plugin mel_france_transfert pour roundcube
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

class mel_france_transfert extends rcube_plugin {
  /**
   *
   * @var string
   */
  public $task = 'mail|settings';
  /**
   *
   * @var rcmail
   */
  private $rc;

  /**
   *
   * @var ServiceWebFranceTransfert
   */
  private $ws;

  /**
   * Initialisation du plugin
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $this->rc = rcmail::get_instance();

    // Charge la configuration
    $this->load_config();

    if ($this->rc->task == 'mail') {
      include_once 'lib/service_web_francetransfert.php';
      $this->ws = new ServiceWebFranceTransfert($this->rc);

      // Load localization and configuration
      $this->add_texts('localization/', true);

      // Load stylesheet
      $this->include_stylesheet('francetransfert.css');

      // Requêtes ajax
      $this->register_action('plugin.test_francetransfert', array(
              $this,
              'testServiceFranceTransfert'
      ));
      $this->register_action('plugin.send_francetransfert', array(
              $this,
              'sendMessageByFranceTransfert'
      ));
      $this->register_action('plugin.update_progressbar', array(
              $this,
              'updateProgressBar'
      ));

      // Charger le javascript si on est dans l'écriture d'un message
      if ($this->rc->action == 'compose') {
        $max_attachments_size = $this->rc->config->get('max_attachments_size', 5000000);
        $sizes_list = $this->rc->config->get('max_attachments_size_user_list', []);
        $max_attachments_size_label = $max_attachments_size;
        if (in_array($max_attachments_size, $sizes_list)) {
          $max_attachments_size_label = array_search($max_attachments_size, $sizes_list);
        }
        // Modifier le libéllé
        $this->rc->gettext(['name' => 'maxuploadsize', 'fr_fr' => str_replace('%%max_attachments_size%%', $max_attachments_size_label, $this->gettext('maxuploadsize'))]);
        
        $this->require_plugin('jqueryui');
        $this->include_script('francetransfert.js');
        $this->rc->output->set_env("max_attachments_size", $max_attachments_size);
      }
    }
    else if ($this->rc->task == 'settings') {
      // Config hooks
      $this->add_hook('preferences_list', array(
              $this,
              'prefs_list'
      ));
      $this->add_hook('preferences_save', array(
              $this,
              'prefs_save'
      ));
    }
  }

  /**
   * Handler for user preferences form (preferences_list hook)
   */
  public function prefs_list($args) {
    if ($args['section'] != 'compose') {
      return $args;
    }

    // Load localization and configuration
    $this->add_texts('localization/');

    // Check that configuration is not disabled
    $dont_override = ( array ) $this->rc->config->get('dont_override', array());

    $key = 'pref_max_attachments_size';
    if (! in_array($key, $dont_override)) {
      $config_key = 'max_attachments_size';
      $field_id = "_" . $key;
      $pref_value = $this->rc->config->get($config_key, 5242880);
      $user_values_list = $this->rc->config->get('max_attachments_size_user_list', array());
      $select = new html_select(array(
              'name' => $field_id,
              'id' => $field_id));

      foreach ($user_values_list as $key_user_list => $value_user_list) {
        $select->add($key_user_list, $value_user_list);
      }

      $content = $select->show(strval($pref_value));

      $args['blocks']['main']['options'][$key] = array(
              'title' => html::label($field_id, rcube::Q($this->gettext($key))),
              'content' => $content
      );
    }
    return $args;
  }

  /**
   * Handler for user preferences save (preferences_save hook)
   */
  public function prefs_save($args) {
    if ($args['section'] != 'compose') {
      return $args;
    }

    // Check that configuration is not disabled
    $dont_override = ( array ) $this->rc->config->get('dont_override', array());

    $key = 'pref_max_attachments_size';
    if (! in_array($key, $dont_override)) {
      $config_key = 'max_attachments_size';
      $args['prefs'][$config_key] = rcube_utils::get_input_value('_' . $key, rcube_utils::INPUT_POST);
    }
    return $args;
  }

  /**
   * Fonction permettant de tester si le service France Transfert doit être appelé au moment de l'envoi
   * Appelé en Ajax
   * Une autre fonction est appelé pour l'envoie par le service France Transfert
   */
  public function testServiceFranceTransfert() {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_france_transfert::testServiceFranceTransfert()");

    $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);
    $COMPOSE_ID = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];
    $use_francetransfert = false;
    $over_size_francetransfert = false;
    $francetransfert_up = true;
    $size = 0;

    // Parcours des pièces jointes pour calculer la taille
    if (is_array($COMPOSE['attachments'])) {
      foreach ($COMPOSE['attachments'] as $id => $a_prop) {
        $size += $COMPOSE['attachments'][$id]['size'];
      }
    }

    // Défini si le service France Transfert doit être utilisé en fonction de la valeur configuré
    $max_francetransfert_size = $this->rc->config->get('max_francetransfert_size', 1000000000);
    $over_size_francetransfert = $max_francetransfert_size < $size;
    $use_francetransfert = $this->rc->config->get('max_attachments_size', 5000000) < $size && ! $over_size_francetransfert && (mel::is_internal() || $this->rc->config->get('enable_internet_service', true));

    // Retourne le résultat au javascript
    $result = array(
            'action' => 'plugin.test_francetransfert',
            'francetransfert_up' => $francetransfert_up,
            'use_francetransfert' => $use_francetransfert,
            'over_size_francetransfert' => $over_size_francetransfert,
            'size' => $size,
            'max_francetransfert_size' => $max_francetransfert_size,
            'dialog_html' => $this->_getHTMLDialogFranceTransfert($COMPOSE_ID, $size),
            'unlock' => $unlock,
            'httpCode' => $this->ws->getHttpCode(),
            'errorMessage' => $this->ws->getErrorMessage()
    );
    echo json_encode($result);
    exit();
  }

  /**
   * Fonction pour envoyer le message avec France Transfert
   */
  public function sendMessageByFranceTransfert() {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_france_transfert::sendMessageByFranceTransfert()");

    $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);
    $nb_days = rcube_utils::get_input_value('_nb_days', rcube_utils::INPUT_POST);
    $COMPOSE_ID = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $COMPOSE =& $_SESSION['compose_data_' . $COMPOSE_ID];

    // set default charset
    $message_charset = isset($_POST['_charset']) ? $_POST['_charset'] : $this->rc->output->get_charset();

    $mailto = $this->rcmail_email_input_format(rcube_utils::get_input_value('_to', rcube_utils::INPUT_POST, TRUE, $message_charset), true);
    $mailcc = $this->rcmail_email_input_format(rcube_utils::get_input_value('_cc', rcube_utils::INPUT_POST, TRUE, $message_charset), true);
    $mailbcc = $this->rcmail_email_input_format(rcube_utils::get_input_value('_bcc', rcube_utils::INPUT_POST, TRUE, $message_charset), true);

    // Get sender name and address...
    $from = rcube_utils::get_input_value('_from', rcube_utils::INPUT_POST, true, $message_charset);
    // ... from identity...
    if (is_numeric($from)) {
      if (is_array($identity_arr = $this->rc->user->get_identity($from))) {
        if ($identity_arr['email'])
          $from = $identity_arr['email'];
      }
      else {
        $from = null;
      }
    }
    // ... if there is no identity record, this might be a custom from
    else if ($from_string = $this->rcmail_email_input_format($from)) {
      if (preg_match('/(\S+@\S+)/', $from_string, $m))
        $from = trim($m[1], '<>');
      else
        $from = null;
    }

    // add subject
    $subject = trim(rcube_utils::get_input_value('_subject', rcube_utils::INPUT_POST, TRUE, $message_charset));

    // fetch message body
    $message_body = rcube_utils::get_input_value('_message', rcube_utils::INPUT_POST, TRUE, $message_charset);

    if ($this->ws->initPli($COMPOSE_ID, $nb_days, 'fr_FR', $from, $mailto, $mailcc, $mailbcc, $subject, $message_body)) {
      $success = true;

      // Parcours des pièces jointes pour les lister
      if (is_array($COMPOSE['attachments'])) {
        foreach ($COMPOSE['attachments'] as $id => $a_prop) {
          if (!$this->ws->sendFile($COMPOSE_ID, $from, $id, $a_prop['path'], $a_prop['name'])) {
            $success = false;
            break;
          }
        }
      }
    }
    else {
      $success = false;
    }

    // // delete previous saved draft
    // $old_id = rcube_utils::get_input_value('_draft_saveid', rcube_utils::INPUT_POST);
    // if ($old_id && $success) {
    //   $drafts_mbox = $this->rc->config->get('drafts_mbox');
    //   $deleted = $this->rc->storage->delete_message($old_id, $drafts_mbox);
    // }

    // // Cleanup session
    // if ($success) {
    //   $this->rcmail_compose_cleanup($COMPOSE_ID);
    //   // MANTIS 4164: Ajouter des logs à l'envoi France Transfert pour les statistiques
    //   mel_logs::get_instance()->log(mel_logs::INFO, "mel_france_transfert::sendMessageByFranceTransfert() [success] to $mailto cc $mailcc bcc $mailbcc");
    // }

    // Retourne le résultat au javascript
    $result = array(
            'action' => 'plugin.send_francetransfert',
            'success' => $success,
            'httpCode' => $this->ws->getHttpCode(),
            'errorMessage' => $this->ws->getErrorMessage(),
            'unlock' => $unlock
    );
    echo json_encode($result);
    exit();
  }

  /**
   * Fonction pour mettre à jour la progress bar en fonction des informations de session
   */
  public function updateProgressBar() {
    $COMPOSE_ID = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];
    $finish = false;
    $success = false;

    // Actualisation du statut
    if (!$this->ws->getStatus($COMPOSE_ID, $COMPOSE['ft_from'])) {
      $finish = true;

      unset($COMPOSE['ft_pli']);
      unset($COMPOSE['ft_value']);
      unset($COMPOSE['ft_from']);
    }

    // Le pli est prêt au téléchargement
    if ($COMPOSE['ft_pli']->statutPli->codeStatutPli == '032-PAT') {
      $finish = true;
      $success = true;

      // delete previous saved draft
      $old_id = rcube_utils::get_input_value('_draft_saveid', rcube_utils::INPUT_POST);
      if ($old_id) {
        $drafts_mbox = $this->rc->config->get('drafts_mbox');
        $deleted = $this->rc->storage->delete_message($old_id, $drafts_mbox);
      }

      // Cleanup session
      $this->rcmail_compose_cleanup($COMPOSE_ID);

      // MANTIS 4164: Ajouter des logs à l'envoi France Transfert pour les statistiques
      $mailto = $COMPOSE['param']['to'];
      mel_logs::get_instance()->log(mel_logs::INFO, "mel_france_transfert::sendMessageByFranceTransfert() [success] to $mailto");
    }
        // Erreur imprévue lors du chargement des fichiers du pli
    else if ($COMPOSE['ft_pli']->statutPli->codeStatutPli == '011-ECH' 
        // Erreur détectée lors de l’analyse des types de fichier : au moins un fichier a un mimetype non autorisé
        || $COMPOSE['ft_pli']->statutPli->codeStatutPli == '021-ETF'
        // Erreur détectée lors de l’analyse des types de fichier : au moins un fichier est un virus
        || $COMPOSE['ft_pli']->statutPli->codeStatutPli == '022-EAV') {
      $finish = true;
      unset($COMPOSE['ft_pli']);
      unset($COMPOSE['ft_value']);
      unset($COMPOSE['ft_from']);
    }

    // Retourne le résultat au javascript
    $result = array(
            'action'          => 'plugin.update_progressbar',
            'current_action'  => $COMPOSE['ft_action'] ?: '',
            'current_value'   => $COMPOSE['ft_value'] ?: null,
            'finish'          => $finish,
            'success'         => $success,
    );
    echo json_encode($result);
    exit();
  }

  /**
   * Génère le dialog HTML à afficher en Javascript
   *
   * @param int $size
   * @return string $html
   */
  private function _getHTMLDialogFranceTransfert($COMPOSE_ID, $size) {
    $COMPOSE = & $_SESSION['compose_data_' . $COMPOSE_ID];

    $html = "";
    $select = new html_select(array());

    for ($i = 1; $i <= $this->rc->config->get('francetransfert_max_days_duration', 90); $i ++) {
      $select->add($i . " " . $this->gettext('Send France Transfert days'), $i);
    }

    $html = html::div(array(
            "id" => "use_francetransfert_dialog"
    ), html::div(array(
            "class" => "dialog_title row align-items-center"
    ), html::span('col-3', html::img(['alt' => 'Logo République française', 'src' => 'https://francetransfert.numerique.gouv.fr/assets/logos/republique_francaise_logo.svg'])) . 
        html::span('col-6', html::img(['alt' => 'Logo France transfert', 'src' => 'https://francetransfert.numerique.gouv.fr/assets/logos/france_transfert_logo.svg']))) . 
    
      html::div(array(
            "class" => "dialog_text"
    ), $this->gettext('Send France Transfert text')) . 
    
      html::div(array(
            "class" => "dialog_select"
    ), html::span([], $this->gettext('Send France Transfert keep the file')) . 
        $select->show($this->rc->config->get('francetransfert_max_days_duration', 90))));

    return $html;
  }

  /**
   * Parse and cleanup email address input (and count addresses)
   *
   * @param string Address input
   * @param boolean Do count recipients (saved in global $RECIPIENT_COUNT)
   * @param boolean Validate addresses (errors saved in global $EMAIL_FORMAT_ERROR)
   * @return string Canonical recipients string separated by comma
   */
  private function rcmail_email_input_format($mailto, $count = false, $check = true) {
    global $EMAIL_FORMAT_ERROR, $RECIPIENT_COUNT;

    // simplified email regexp, supporting quoted local part
    $email_regexp = '(\S+|("[^"]+"))@\S+';

    $delim = trim($this->rc->config->get('recipients_separator', ','));
    $regexp = array(
            "/[,;$delim]\s*[\r\n]+/",
            '/[\r\n]+/',
            "/[,;$delim]\s*\$/m",
            '/;/',
            '/(\S{1})(<' . $email_regexp . '>)/U'
    );
    $replace = array(
            $delim . ' ',
            ', ',
            '',
            $delim,
            '\\1 \\2'
    );

    // replace new lines and strip ending ', ', make address input more valid
    $mailto = trim(preg_replace($regexp, $replace, $mailto));
    $items = rcube_utils::explode_quoted_string($delim, $mailto);
    $result = array();

    foreach ($items as $item) {
      $item = trim($item);
      // address in brackets without name (do nothing)
      if (preg_match('/^<' . $email_regexp . '>$/', $item)) {
        $item = rcube_utils::idn_to_ascii(trim($item, '<>'));
        $result[] = $item;
      }
      // address without brackets and without name (add brackets)
      else if (preg_match('/^' . $email_regexp . '$/', $item)) {
        $item = rcube_utils::idn_to_ascii($item);
        $result[] = $item;
      }
      // address with name (handle name)
      else if (preg_match('/<*' . $email_regexp . '>*$/', $item, $matches)) {
        $address = $matches[0];
        $name = trim(str_replace($address, '', $item));
        if ($name[0] == '"' && $name[count($name) - 1] == '"') {
          $name = substr($name, 1, - 1);
        }
        $name = stripcslashes($name);
        $address = rcube_utils::idn_to_ascii(trim($address, '<>'));
        $result[] = format_email_recipient($address, $name);
        $item = $address;
      }
      else if (trim($item)) {
        continue;
      }

      // check address format
      $item = trim($item, '<>');
      if ($item && $check && ! rcube_utils::check_email($item)) {
        $EMAIL_FORMAT_ERROR = $item;
        return;
      }
    }

    if ($count) {
      $RECIPIENT_COUNT += count($result);
    }

    return implode(', ', $result);
  }

  /**
   * clear message composing settings
   */
  public function rcmail_compose_cleanup($id) {
    if (! isset($_SESSION['compose_data_' . $id])) {
      return;
    }

    $rcmail = rcmail::get_instance();
    $rcmail->plugins->exec_hook('attachments_cleanup', array(
            'group' => $id
    ));
    $rcmail->session->remove('compose_data_' . $id);

    $_SESSION['last_compose_session'] = $id;
  }
}