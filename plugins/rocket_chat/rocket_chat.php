<?php
/**
 * Plugin Rocket.Chat
 * Integration of Rocket.Chat as an iFrame in Roundcube
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class rocket_chat extends rcube_plugin {
    /**
     *
     * @var string
     */
    public $task = '.*';
    /**
     *
     * @var rcmail
     */
    public $rc;
    /**
     * (non-PHPdoc)
     * 
     * @see rcube_plugin::init()
     */
    public function init() {
        global $__page_content;
        
        $this->rc = rcmail::get_instance();
        // Chargement de la conf
        $this->load_config();
        
        $this->add_texts('localization/', true);
        // $this->require_plugin('jqueryui');
        
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/rocket_chat.css');
        
        // ajout de la tache
        if ($this->rc->task == 'ariane') {
          $this->register_task('ariane');
        }
        else {
          $this->register_task('discussion');
        }
        
        // Ne charger le plugin que pour les users pour l'instant
        if (!$this->rc->config->get('rocket_chat_limited_use', false) || in_array($this->rc->get_user_name(), $this->rc->config->get('rocket_chat_users', []))) {
          // Ajoute le bouton en fonction de la skin
          if ($this->rc->config->get('ismobile', false)) {
            $this->add_button(array(
                'command' => 'discussion',
                'class' => 'button-rocket_chat ui-link ui-btn ui-corner-all ui-icon-comment ui-btn-icon-left',
                'classsel' => 'button-rocket_chat button-selected ui-link ui-btn ui-corner-all ui-icon-comment ui-btn-icon-left',
                'innerclass' => 'button-inner',
                'label' => 'rocket_chat.task'
            ), 'taskbar_mobile');
          } else {
            $this->add_button(array(
                'command' => 'discussion',
                'class' => 'button-rocket_chat',
                'classsel' => 'button-rocket_chat button-selected',
                'innerclass' => 'button-inner',
                'label' => 'rocket_chat.task'
            ), 'taskbar');
          }
        }
        
        // Si tache = ariane, on charge l'onglet
        if (($this->rc->task == 'ariane' || $this->rc->task == 'discussion') && isset($_GET['_courrielleur'])) {
          // Ajout du css
          $this->include_stylesheet($this->local_skin_path() . '/mel_frame.css');
          // Disable refresh
          $this->rc->output->set_env('refresh_interval', 0);
          $this->register_action('index', array(
              $this,
              'action_courrielleur'
          ));
        }
        else if ($this->rc->task == 'ariane' || $this->rc->task == 'discussion') {
            // Ajout du css
            $this->include_stylesheet($this->local_skin_path() . '/mel_frame.css');
            $this->register_action('index', array(
                $this,
                'action'
            ));
            $this->rc->output->set_env('refresh_interval', 0);
            
            try {
              $this->login();
              
              $userId = $this->getUserId();
              $authToken = $this->getAuthToken();
              
              // Configuration de l'environnement
              $this->rc->output->set_env('rocket_chat_auth_token', $authToken);
              $this->rc->output->set_env('rocket_chat_user_id', $userId);
              $this->rc->output->set_env('rocket_chat_url', $this->rc->config->get('rocket_chat_url'));
              if (isset($_GET['_params'])) {
                $params = rcube_utils::get_input_value('_params', rcube_utils::INPUT_GET);
                $this->rc->output->set_env('rocket_chat_gotourl', $this->rc->config->get('rocket_chat_url') . $params);
              }
              $this->rc->output->set_env('rocket_chat_channel', rcube_utils::get_input_value('_channel', rcube_utils::INPUT_GET));
              
              // Configuration du domaine
              if (!$this->rc->output->get_env('courrielleur')) {
                $this->rc->output->set_env('rocket_chat_domain', $this->rc->config->get('rocket_chat_domain'));
              }
              
              // Appel la lib pour la gestion du Favico
              $this->include_script('favico.js');
              // Appel le script de création du chat
              $this->include_script('rocket_chat.js');
            }
            catch (\Exception $ex) {
              $__error_title = $this->gettext('rocket_error_title');
              $__error_text = $ex->getMessage();
              $__back = $this->gettext('back');
              $__page_content = <<<EOF
<div>
<h3 class="error-title">$__error_title</h3>
<div class="error-text">$__error_text</div>
<br>
<div><a href="/">$__back</a></div>
</div>
EOF;
              $this->rc->output->send('error');
            }
        }
        else if ($this->rc->task == 'logout') {
          $this->logout();
        }
        else {
          // Appel le script de création du chat
          $this->include_script('rocket_chat_storage_event.js');
          // Appel le script de gestion des link
          $this->rc->output->set_env('rocket_chat_url', $this->rc->config->get('rocket_chat_url'));
          $this->include_script('rocket_chat_link.js');
          $this->rc->output->set_env('rocket_chat_params_url', $this->rc->url(array(
              "_task" => "discussion",
              "_params" => "%%other_params%%"
          )));
        }
    }
    
    public function action() {
        if (mel_logs::is(mel_logs::TRACE))
            mel_logs::get_instance()->log(mel_logs::TRACE, "rocket_chat::action()");
        // register UI objects
        $this->rc->output->add_handlers(array(
                        'rocket_chat_frame' => array(
                                        $this,
                                        'rocket_chat_frame'
                        )
        ));
        // Chargement du template d'affichage
        $this->rc->output->set_pagetitle($this->gettext('title'));
        $this->rc->output->send('rocket_chat.rocket_chat');
    }
    
    public function action_courrielleur() {
      $rcmail = rcmail::get_instance();
      // Chargement du template d'affichage
      $rcmail->output->set_pagetitle($this->gettext('title'));
      $rcmail->output->send('rocket_chat.rocket_chat_courrielleur');
    }

    /**
     * Récupération des informations de l'utilisateur en fonction de son username
     * Utilise soit les API Rocket.Chat soit l'accés direct à la base de données
     * 
     * @param string $username [Optionnel] soit le username soit l'email
     * @param string $email [Optionnel] soit le username soit l'email
     * 
     * @return array Liste des informations de l'utilisateur
     * "id": "nSYqWzZ4GsKTX4dyK",
     * "status": "offline",
     * "active": true,
     * "name": "Example User",
     * "username": "example"
     */
    public function getUserInfos($username = null, $email = null) {
      $infos = null;
      if (!isset($username)) {
        $user = \LibMelanie\Ldap\Ldap::GetUserInfosFromEmail($email);
        $username = $user['uid'][0];
      }
      if ($useMongoDB = $this->rc->config->get('rocket_chat_use_mongodb', false)) {
        // Charge la lib MongoDB si nécessaire
        require_once __DIR__ . '/lib/rocketchatmongodb.php';
        $mongoClient = new RocketChatMongoDB($this->rc);
        $infos = $mongoClient->searchUserByUsername($username);
      }
      else {
        // Charge la lib cliente
        require_once __DIR__ . '/lib/rocketchatclient.php';
        $rocketClient = new RocketChatClient($this->rc);
        $rocketClient->setUserId($this->rc->config->get('rocket_chat_admin_user_id', null));
        $rocketClient->setAuthToken($this->rc->config->get('rocket_chat_admin_auth_token', null));
        if ($rocketClient->authentification($this->rc->config->get('rocket_chat_admin_username', ''), $this->rc->config->get('rocket_chat_admin_password', ''))) {
          $infos = $rocketClient->userInfo($username);
        }
      }
      return $infos;
    }
    
    /**
     * Appel le login vers Rocket.Chat
     * @throws Exception
     */
    public function login() {
      $userId = $this->getUserId();
      $authToken = $this->getAuthToken();
      
      if (!isset($userId) || !isset($authToken)) {
        // Charge la lib cliente
        require_once __DIR__ . '/lib/rocketchatclient.php';
        $rocketClient = new RocketChatClient($this->rc);
        if ($useMongoDB = $this->rc->config->get('rocket_chat_use_mongodb', false)) {
          // Charge la lib MongoDB si nécessaire
          require_once __DIR__ . '/lib/rocketchatmongodb.php';
          $mongoClient = new RocketChatMongoDB($this->rc);
        }
        
        // Récupération du username de l'utilisateur
        $username = $this->rc->get_user_name();
        $rocketClient->setUserId($this->rc->config->get('rocket_chat_admin_user_id', null));
        $rocketClient->setAuthToken($this->rc->config->get('rocket_chat_admin_auth_token', null));
        if (!$rocketClient->authentification($this->rc->config->get('rocket_chat_admin_username', ''), $this->rc->config->get('rocket_chat_admin_password', ''))) {
          throw new Exception($this->gettext('rocket_admin_auth_error'));
        }
        
        if (!isset($userId)) {
          $infos = $this->getUserInfos($username);
          $userId = $infos['id'];
          if (!isset($userId)) {
            $user = \LibMelanie\Ldap\Ldap::GetUserInfos($username);
            $ret = $rocketClient->createUser($user['uid'][0], $user['mailpr'][0], $this->rc->get_user_password(), $user['displayname'][0]);
            // Gestion du cas ou l'utilisateur est créé, mais pas en ldap
            if (!$ret['success'] && $ret['errorType'] == 'error-field-unavailable') {
              $ret['user_id'] = $rocketClient->userInfo($user['uid'][0]);
              if (isset($ret['user_id'])) {
                $ret['success'] = true;
              }
            }
            if (!$ret['success'] || !isset($ret['user_id'])) {
              throw new Exception($this->gettext('rocket_create_user_error') . (isset($ret['error']) ? ' : ' . $ret['error'] : ''));
            }
            $userId = $ret['user_id'];
            if ($useMongoDB) {
              $mongoClient->setLdapUser($userId, $username);
            }
          }
          $this->setUserId($userId);
        }
        
        $ret = $rocketClient->createUserToken($userId);
        if (!$ret['success'] || !isset($ret['authToken'])) {
          if ($ret['errorType'] == 'error-invalid-user') {
            $this->setUserId(null);
            return $this->login();
          }
          throw new Exception($this->gettext('rocket_create_token_error'));
        }
        $authToken = $ret['authToken'];
        $this->setAuthToken($authToken);
      }
    }
    
    /**
     * Appel apres l'appel au logout
     *
     * @param array $args
     */
    public function logout() {
      $authToken = $this->getAuthToken();
      $userId = $this->getUserId();
      
      if (isset($authToken) && isset($userId)) {
        // Charge la lib cliente
        require_once __DIR__ . '/lib/rocketchatclient.php';
        $rocketClient = new RocketChatClient($this->rc);
        // Positionne les infos
        $rocketClient->setAuthToken($authToken);
        $rocketClient->setUserId($userId);
        // Appel la deconnexion par les APIs
        $rocketClient->logout();
      }
    }
    
    /**
     * Gestion de la frame
     * 
     * @param array $attrib            
     * @return string
     */
    public function rocket_chat_frame($attrib) {
        if (!$attrib['id'])
            $attrib['id'] = 'rcmrocketchatframe';
        
        $attrib['name'] = $attrib['id'];
        
        $this->rc->output->set_env('contentframe', $attrib['name']);
        $this->rc->output->set_env('blankpage', $attrib['src'] ? $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');
        
        return $this->rc->output->frame($attrib);
    }
    /**
     * Retourne l'auth token en session
     * 
     * @return NULL|string
     */
    private function getAuthToken() {
      return isset($_SESSION['rocket_chat_auth_token']) ? $_SESSION['rocket_chat_auth_token'] : null;
    }
    /**
     * Positionne l'auth token en session
     * 
     * @param string $authToken
     */
    private function setAuthToken($authToken) {
      $_SESSION['rocket_chat_auth_token'] = $authToken;
    }
    /**
     * Retourne le user id en session
     * 
     * @return NULL|string
     */
    private function getUserId() {
      return $this->rc->config->get('rocket_chat_user_id', null);
    }
    /**
     * Positionne le user id en session
     * 
     * @param string $userId
     */
    private function setUserId($userId) {
      $this->rc->user->save_prefs(array('rocket_chat_user_id' => $userId));
    }
    /**
     * Génération aléatoire d'un auth token
     * 
     * @return string
     */
    private function generateAuthToken() {
      return base64_encode(uniqid('roundcube_plugin_rocket_chat')); 
    }
}