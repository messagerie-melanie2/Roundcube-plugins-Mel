<?php
/**
 * Plugin Right Panel
 *
 * Affiche un panneau a droite contenant diverses informations pour l'utilisateur
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
class right_panel extends rcube_plugin
{
  /**
   *
   * @var string
   */
  public $task = '.*';
  /**
   *
   * @var rcmail
   */
  private $rc;
  /**
   * Durée de conservation des données contacts dans le cache
   *
   * @var int
   */
  const CACHE_RIGHT_PANEL_CONTACTS = 60*60;
  /**
   * Durée de conservation des données messages dans le cache
   *
   * @var int
   */
  const CACHE_RIGHT_PANEL_MESSAGES = 10*60;
  
  /**
   * (non-PHPdoc)
   * @see rcube_plugin::init()
   */
  function init() {
    $this->rc = rcmail::get_instance();
    
    if ($this->rc->task != 'login' 
        && $this->rc->task != 'logout'
        && !$this->rc->output->get_env('ismobile')
        && !isset($_GET['_courrielleur'])
        && empty($_REQUEST['_framed'])
        && empty($_REQUEST['_extwin'])) {
      // Add localization
      $this->add_texts('localization/', true);
      
      // http post actions
      $this->register_action('plugin.list_contacts_favorites', array($this,'list_contacts_favorites'));
      $this->register_action('plugin.list_contacts_recent', array($this,'list_contacts_recent'));
      $this->register_action('plugin.get_unread_count', array($this,'get_unread_count'));
      $this->register_action('plugin.get_contact_email', array($this,'get_contact_email'));
      
      // add hook to refresh panel
      $this->add_hook('refresh', array($this, 'refresh'));

      // Actions list for the right panel
      $actions = ['', 'plugin.annuaire', 'preferences', 'folders', 'identities', 'show', 'compose', 'plugin.mel_signatures', 
        'plugin.managesieve', 'plugin.mel_resources_bal', 'plugin.mel_resources_agendas', 'plugin.mel_resources_contacts', 'plugin.mel_resources_tasks', 
        'plugin.mel_roadmap', 'plugin.managesieve',
        'plugin.mel_moncompte', 'plugin.mel_statistics_mobile', 'plugin.mel_suggestion_box', 'plugin.mel_doubleauth',];
      
      if ($this->rc->output->type == 'html' 
          // Is action in the list ?
          && in_array($this->rc->action, $actions)) {
        // Include css files
        $this->include_stylesheet('css/right_panel.css');
        $skin = $this->rc->config->get('skin');
        $this->include_stylesheet('css/' . $skin . '/styles.css');
        $this->include_stylesheet('css/jquery.mCustomScrollbar.min.css');
        
        // Include javascript files
        $this->include_script('js/right_panel.js');
        $this->include_script('js/jquery.mCustomScrollbar.concat.min.js');
        $this->include_script('../../program/js/treelist.js');
        
        $rocket_chat = $this->rc->config->get('right_panel_use_rocket_chat', false) ?  $this->rc->plugins->get_plugin('rocket_chat') : null;
        $user = driver_mel::gi()->getUser();
        if (isset($rocket_chat) && is_object($rocket_chat)) {
          // Ariane Web Socket
          if (!isset($_SESSION['rocket_chat_auth_token'])) {
            try {
              $rocket_chat->login();
            }
            catch (Exception $ex) {}
          }
          // Récupérer le user status Ariane
          try {
            $infos = $rocket_chat->getUserInfos($this->rc->get_user_name());
            $this->rc->output->set_env('ariane_user_status', $infos['status']);
            $this->rc->output->set_env('ariane_url', $this->rc->config->get('rocket_chat_url'));
            $this->rc->output->set_env('ariane_photo_url', $this->rc->config->get('rocket_chat_url') . 'avatar/');
            $this->rc->output->set_env('web_socket_ariane_url', str_replace('https', 'wss', $this->rc->config->get('rocket_chat_url')) . 'websocket');
            $this->rc->output->set_env('ariane_auth_token', $_SESSION['rocket_chat_auth_token']);
            $this->rc->output->set_env('ariane_user_id', $this->rc->config->get('rocket_chat_user_id', null));
            $this->rc->output->set_env('username', $this->rc->get_user_name());
            $this->rc->output->set_env('user_fullname', $infos['fname']);
            $this->rc->output->set_env('user_email', $user->email);
            // Initials
            $words = explode(" ", $infos['fname']); $acronym = "";
            foreach ($words as $w) { $acronym .= $w[0]; }
            $this->rc->output->set_env('user_initials', $acronym);
          }
          catch (Exception $ex) {}
        }
        if (!isset($infos['fname'])) {
          $this->rc->output->set_env('username', $user->uid);
          $this->rc->output->set_env('user_fullname', $user->name);
          $this->rc->output->set_env('user_email', $user->email);
          // Initials
          $words = explode(" ", $user->name); $acronym = "";
          foreach ($words as $w) { $acronym .= $w[0]; }
          $this->rc->output->set_env('user_initials', $acronym);
        }
      }
    }
    else if ($this->rc->task == 'logout' 
        || $this->rc->task == 'login') {
      // Include javascript files
      $this->include_script('js/logout.js');
    }
  }
  
  /**
   * Lister les contacts favoris de l'utilisateur
   */
  public function list_contacts_favorites() {
    $contacts = \mel::getCache('right_panel_contacts');
    if (!isset($contacts)) {
      $addressbook = $this->rc->get_address_book(driver_mel::gi()->mceToRcId($this->rc->get_user_name()));
      $addressbook->set_group('favorites');
      $addressbook->page_size = 200;
      $records = $addressbook->list_records();
  
      $rocket_chat = $this->rc->config->get('right_panel_use_rocket_chat', false) ?  $this->rc->plugins->get_plugin('rocket_chat') : null;
      $contacts = [];
      
      while ($row = $records->next()) {
        if (isset($row['email']) && isset($rocket_chat) && is_object($rocket_chat)) {
          $infos = $rocket_chat->getUserInfos(null, $row['email']);
          if (isset($infos['username'])) {
            $row['username'] = $infos['username'];
            $row['url'] = $this->rc->config->get('rocket_chat_url') . 'direct/'. $infos['username'];
            $row['status'] = $infos['status'];
            $row['photo_url'] = $this->rc->config->get('rocket_chat_url') . 'avatar/'. $infos['username'];
          }        
        }
        $contacts[] = $row;
      }
      \mel::setCache('right_panel_contacts', $contacts);
    }
    // Return the result to the ajax commant
    $result = array('action' => 'plugin.list_contacts_favorites', 'contacts' => $contacts);
    $json = json_encode($result);
    if ($json) {
      echo $json;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[list_contacts_favorites] contacts : " . var_export($contacts, 1));
      echo json_encode(['action' => 'plugin.list_contacts_favorites']);
    }
    exit;
  }

  /**
   * Lister les contacts récents de l'utilisateur
   */
  public function list_contacts_recent() {
    $contacts = \mel::getCache('right_panel_messages');
    if (!isset($contacts)) {
      // Desactiver le threading pour éviter les problèmes
      $this->rc->storage->set_threading(false);
      $this->rc->storage->set_pagesize(25);
      // Lister les messages INBOX triés par date
      $a_headers = $this->rc->storage->list_messages('INBOX', 0, 'date', 'DESC');
      $contacts = [];
      foreach ($a_headers as $a_header) {
        $a_parts = rcube_mime::decode_address_list($a_header->from);
        $timestamp = strtotime($a_header->date);
        
        if (isset($a_parts[1])) {
          $name = $a_parts[1]['name'];
          $name = str_replace('> ', '', $name);
          $name = explode(' - ', $name, 2);
          $name = $name[0];
          // Message format date
          $contacts[] = [
              'muid' => $a_header->uid,
              'type' => 'mail',
              'subject' => htmlspecialchars($a_header->get('subject', true)),
              'munread' => isset($a_header->flags['SEEN']) ? false : true,
              'name' => $name,
              'email' => $a_parts[1]['mailto'],
              'timestamp' => $timestamp,
          ];
        }
      }
      \mel::setCache('right_panel_messages', $contacts);
    }
    // send output
    header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
    // Return the result to the ajax command
    $json = json_encode(['action' => 'plugin.list_contacts_recent', 'contacts' => $contacts]);
    if ($json) {
      echo $json;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[list_contacts_recent] contacts : " . var_export($contacts, 1));
      echo json_encode(['action' => 'plugin.list_contacts_recent']);
    }
    exit;
  }
  
  /**
   * Handler for keep-alive requests
   * This will refresh the right panel
   */
  public function refresh($attr) {
    $this->rc->output->command('plugin.refresh_right_panel');
  }
  
  /**
   * Récupérer le nombre de mails non lus de l'utilisateur
   */
  public function get_unread_count() {
    // Récupérer le nombre de mails non lus pour l'INBOX
    $unseen_count = $this->rc->storage->count('INBOX', 'UNSEEN', true);
    // send output
    header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
    // Return the result to the ajax command
    $json = json_encode(['action' => 'plugin.get_unread_count', 'unseen_count' => $unseen_count]);
    if ($json) {
      echo $json;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[get_unread_count] unseen_count : " . var_export($unseen_count, 1));
      echo json_encode(['action' => 'plugin.get_unread_count']);
    }
    exit;
  }
  
  /**
   * Récupérer l'adresse email d'un contact
   */
  public function get_contact_email() {
    $username = rcube_utils::get_input_value('_user', rcube_utils::INPUT_GET);
    $rocket_chat = $this->rc->config->get('right_panel_use_rocket_chat', false) ?  $this->rc->plugins->get_plugin('rocket_chat') : null;
    if (isset($rocket_chat) && is_object($rocket_chat)) {
      $infos = $rocket_chat->getUserInfos($this->rc->get_user_name());
      // Return the result to the ajax command
      $result = array('action' => 'plugin.get_contact_email', 'username' => $username, 'email' => $infos['email'], 'status' => $infos['status']);
    }
    else {
      // Return the result to the ajax command
      $result = array('action' => 'plugin.get_contact_email', 'username' => $username);
    }
    // send output
    header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
    $json = json_encode($result);
    if ($json) {
      echo $json;
    }
    else {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[get_contact_email] result : " . var_export($result, 1));
      echo json_encode(['action' => 'plugin.get_contact_email']);
    }
    exit;
  }
}