<?php
/**
 * Plugin Mél Boite a Idees
*
* Permet aux utilisateurs d'envoyer des suggestions depuis le menu parametres
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

class mel_suggestion_box extends rcube_plugin
{
  /**
   * @var string
   */
  public $task = 'settings';
  
  /**
   * @var rcmail
   */
  private $rc;
  /**
   * @var array
   */
  private $smtp_error;

  /**
   * (non-PHPdoc)
   * @see rcube_plugin::init()
   */
  public function init()
  {
    // Get rc instance
    $this->rc = rcmail::get_instance();
    // Add localization
    $this->add_texts('localization/', true);
    // Load configuration
    $this->load_config();
    // Add javascript  
    $this->include_script('suggestion_box.js');
    // Add css
    $this->include_stylesheet('suggestion_box.css');
    // Register settings action
    $this->register_action('plugin.mel_suggestion_box', array($this, 'init_settings'));
    $this->register_action('plugin.mel_suggestion_box_send', array($this, 'suggestion_box_send'));
  }
  /**
   * Initialisation de l'interface settings pour la boite a idees
   */
  public function init_settings() {
    $this->rc->output->set_pagetitle($this->gettext('suggestionbox'));

    $settings_url =  $this->rc->config->get('suggestion_url');

    if (isset($settings_url) && $settings_url !== '')
    {
      $this->rc->output->set_env('settings_frame_url', $settings_url);
    }

    $this->rc->output->send('mel_suggestion_box.suggestionbox_settings');
  }
  /**
   * Methode d'envoie du message de suggestion
   */
  public function suggestion_box_send() {
    $body = rcube_utils::get_input_value('_suggestion', rcube_utils::INPUT_POST);
    $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);
    if (isset($_GET['_courrielleur'])) {
      $subject = $this->rc->config->get('suggestion_subject_courrielleur');
    }
    else {
      $subject = $this->rc->config->get('suggestion_subject');
    }
    $ret = $this->send_suggestion_message($subject, $body);
    $result = array('action' => 'plugin.mel_suggestion_box_send', 'ret' => $ret, 'smtp_error' => $this->smtp_error, 'unlock' => $unlock);
    echo json_encode($result);
    exit;
  }
  /**
   * Envoi d'un message de suggestion
   * @param string $body Corps du message
   * @return boolean Send status
   */
  public function send_suggestion_message($subject, $body) {
    $identity  = $this->rc->user->get_identity();
    $sender    = format_email_recipient($identity['email'], $identity['name']);
    $mailto    = $this->rc->config->get('suggestion_dest');
    
    $compose = new Mail_mime("\r\n");
    
    $compose->setParam('text_encoding', 'quoted-printable');
    $compose->setParam('html_encoding', 'quoted-printable');
    $compose->setParam('head_encoding', 'quoted-printable');
    $compose->setParam('head_charset', RCUBE_CHARSET);
    $compose->setParam('html_charset', RCUBE_CHARSET);
    $compose->setParam('text_charset', RCUBE_CHARSET);
    
    // compose headers array
    $headers = array(
        'Date'       => $this->rc->user_date(),
        'From'       => $sender,
        'To'         => format_email_recipient($mailto),
        'Subject'    => $subject,
        'Message-ID' => $this->rc->gen_message_id($identity['email']),
        'X-Sender'   => $identity['email'],
    );
  
    if ($agent = $this->rc->config->get('useragent')) {
      $headers['User-Agent'] = $agent;
    }
    
    $compose->headers(array_filter($headers));
    $compose->setContentType('text/plain', ['charset' => RCUBE_CHARSET]);
    $compose->setTXTBody(rcube_mime::wordwrap($body, 75, "\r\n"));
    
    return $this->rc->deliver_message($compose, $identity['email'], rcube_utils::idn_to_ascii($mailto), $this->smtp_error);
  }
}