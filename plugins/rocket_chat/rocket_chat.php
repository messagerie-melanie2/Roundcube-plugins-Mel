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
     * Durée d'expiration d'un token rocket chat en secondes
     * Valeur par défaut : 48h
     */
    const TOKEN_EXPIRE_DURATION = 172800;
	/**
     * Durée de conservation des données rocket dans le cache
     *
     * @var int
     */
    const CACHE_ROCKETCHAT = 10*60;
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

        if (class_exists("mel_metapage")) mel_metapage::add_url_spied($this->rc->config->get('rocket_chat_url'), 'discussion');
        
        // Ne charger le plugin que pour les users pour l'instant
        if (!$this->rc->config->get('rocket_chat_limited_use', false) || in_array($this->rc->get_user_name(), $this->rc->config->get('rocket_chat_users', []))) {
          // Ajoute le bouton en fonction de la skin
          $need_button = 'taskbar';
          if (class_exists("mel_metapage")) {
            $need_button = $this->rc->plugins->get_plugin('mel_metapage')->is_app_enabled('chat') ? $need_button : 'otherappsbar';;
          }

          if ($need_button) {
            if ($this->rc->config->get('ismobile', false)) {
              $this->add_button(array(
                  'href' => 'chat',
                  'class' => ' button-rocket_chat ui-link ui-btn ui-corner-all ui-icon-comment ui-btn-icon-left',
                  'classsel' => 'button-rocket_chat button-selected ui-link ui-btn ui-corner-all ui-icon-comment ui-btn-icon-left',
                  'innerclass' => 'button-inner',
                  'label' => 'rocket_chat.task'
              ), 'taskbar_mobile');
            } else {
              $this->add_button(array(
                  'href' => './?_task=chat',
                  'class' => 'icon-mel-message button-rocket_chat',
                  'classsel' => 'icon-mel-message button-rocket_chat button-selected',
                  'innerclass' => 'button-inner',
                  'label' => 'rocket_chat.task',
                  'type'=> 'link'
              ), $need_button);
            }
          }

          $this->register_action('create_chanel', array(
            $this,
            'create_chanel'
          ));
          $this->register_action('add_users', array(
            $this,
            'add_users'
          ));
          $this->register_action('get_user_info', array(
            $this,
            'get_user_info'
          ));
          $this->register_action('get_channel_unread_count', array(
            $this,
            'get_channel_unread_count'
          ));
          $this->register_action('get_joined', array(
            $this,
            'get_joined_action'
          ));
          $this->register_action('login', array(
            $this,
            'get_log'
          ));
          $this->register_action('get_status', [$this, 'get_status']);
          $this->register_action('set_status', [$this, 'set_status']);
          $this->register_action('logout', array(
            $this,
            'logout'
          ));
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
          if (!class_exists("mel_metapage")) $this->include_script('rocket_chat_link.js');
                        // Appel la lib pour la gestion du Favico
                        $this->include_script('favico.js');
                        // Appel le script de création du chat
                        $this->include_script('rocket_chat.js');
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
        $this->rc->output->send( ((rcube_utils::get_input_value('_tiny', rcube_utils::INPUT_GET) == 1) ? 'rocket_chat.tiny_rocket_chat' : 'rocket_chat.rocket_chat' ));
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
    public function getUserInfos($username = null, $email = null, $force_admin = false) {
      if (mel_logs::is(mel_logs::DEBUG))
        mel_logs::get_instance()->log(mel_logs::DEBUG, "rocket_chat::getUserInfos($username, $email)");
      $infos = null;
      if (!isset($username)) {
        $user = driver_mel::gi()->user();
        $user->email = $email;
        if ($user->load(['uid'])) {
          $username = $user->uid;
        }
      }
      $infos = \mel::getCache('rocketchat');
      if ($force_admin || !isset($infos)) {
        $useMongoDB = $this->rc->config->get('rocket_chat_use_mongodb', false);
        if (!$force_admin && $useMongoDB) {
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
        \mel::setCache('rocketchat', $infos);
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
            $user = driver_mel::gi()->getUser($username);
            $ret = $rocketClient->createUser($user->uid, $user->email, $this->rc->get_user_password(), $user->name);
            // Gestion du cas ou l'utilisateur est créé, mais pas en ldap
            if (!$ret['success'] && $ret['errorType'] == 'error-field-unavailable') {
              $ret['user_id'] = $rocketClient->userInfo($user->uid);
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
        $this->setAuthToken(null);
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
      $token = isset($_SESSION['rocket_chat_auth_token']) ? $_SESSION['rocket_chat_auth_token'] : null;
      if (isset($_SESSION['rocket_chat_auth_token_expire_date']) 
          && $_SESSION['rocket_chat_auth_token_expire_date'] < time()) {
        unset($_SESSION['rocket_chat_auth_token_expire_date']);
        unset($_SESSION['rocket_chat_auth_token']);
        $token = null;
      }
      return $token;
    }
    /**
     * Positionne l'auth token en session
     * 
     * @param string $authToken
     */
    private function setAuthToken($authToken) {
      $_SESSION['rocket_chat_auth_token'] = $authToken;
      $duration = $this->rc->config->get('rocket_chat_token_duration', self::TOKEN_EXPIRE_DURATION);
      $_SESSION['rocket_chat_auth_token_expire_date'] = time() + $duration;
    }
    /**
     * Retourne le user id en session
     * 
     * @return NULL|string
     */
    private function getUserId() {
      // MANTIS 0006224: Ajouter un mapping entre les utilisateurs Mél et les utilisateurs Rocket Chat
      $mapping = $this->rc->config->get('rocket_chat_users_mapping', []);
      if (isset($mapping[$this->rc->get_user_name()])) {
        $userId = $mapping[$this->rc->get_user_name()];
        // Enregistrer la nouvelle valeur en pref si jamais elle est différente
        if ($userId != $this->rc->config->get('rocket_chat_user_id', null)) {
          $this->setUserId($userId);
        }
      }
      else {
        $userId = $this->rc->config->get('rocket_chat_user_id', null);
      }
      // Problème en conf sur le userId
      if (is_array($userId)) {
        if (isset($userId['id'])) {
          $userId = $userId['id'];
          $this->setUserId($userId);
        }
        else {
          $userId = null;
        }
      }
      return $userId;
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

    function get_log()
    {
      $this->login();
      $array = [
        "uid" => $this->getUserId(),
        "token" => $this->getAuthToken()
      ];
      echo json_encode($array);
      exit;
    }

  /**
   * Récupère un objet de classe RocketChatClient.
   *
   * @return RocketChatClient
   */
    private function get_rc_client()
    {
      require_once __DIR__ . '/lib/rocketchatclient.php';
      
      $this->login();

      $uid = $this->getUserId();
      $token = $this->getAuthToken();

      $rocketClient = new RocketChatClient($this->rc);
      $rocketClient->setUserId($uid);
      $rocketClient->setAuthToken($token);

      $me = $rocketClient->me();
      if ($me["httpCode"] === 401)
      {
        $this->logout();
        $rocketClient = $this->get_rc_client();
        setcookie("ariane_need_to_reconnect", "true");
      }

      return $rocketClient;
    }

    private function get_rc_admin_client()
    {
      //getUserInfos
      require_once __DIR__ . '/lib/rocketchatclient.php';

      $rocketClient = new RocketChatClient($this->rc);
      $rocketClient->authentification($this->rc->config->get('rocket_chat_admin_username', null), $this->rc->config->get('rocket_chat_admin_password', ''), true);

      return $rocketClient;
    }

    public function me()
    {
      require_once __DIR__ . '/lib/rocketchatclient.php';
      $uid = $this->getUserId();
      $token = $this->getAuthToken();

      $rocketClient = new RocketChatClient($this->rc);
      $rocketClient->setUserId($uid);
      $rocketClient->setAuthToken($token);

      $me = $rocketClient->me();

      return $me["httpCode"] !== 401;
    }



  /**
   * Créer un canal ou un groupe via un appel ajax.
   */
    public function create_chanel()
    {
      $room_name = rcube_utils::get_input_value('_roomname', rcube_utils::INPUT_POST);
      $users = rcube_utils::get_input_value('_users', rcube_utils::INPUT_POST);
      $is_public = rcube_utils::get_input_value('_public', rcube_utils::INPUT_POST);

      if ($is_public === "false")
        $is_public = false;
      else
        $is_public = true;

      $result = $this->_create_channel($room_name, $users, $is_public);

      echo json_encode($result);

      exit;
    }

    public function post_message($room_id, $text, $alias, $avatar = null)
    {
      $rocketClient = $this->get_rc_client();

      //$b = $this->get_rc_client()->add_users($room_id, [$this->rc->config->get('rocket_chat_admin_username', null)], false);

      return $rocketClient->post_message($room_id, $text, $alias
      //, $avatar
    );
    }

   /**
   * Créer un canal ou un groupe.
   *
   * @param string $room_name
   * @param array $users
   * @param bool $is_public
   * @return array
   */
    public function _create_channel($room_name, $users, $is_public)
    {
      $user = $this->rc->get_user_name();
      $rocketClient = $this->get_rc_client();

      return $rocketClient->create_chanel($room_name, $users, $is_public);
    }

    /**
     * Récupère les infos de l'utilisateur.
     */
    public function get_user_info()
    {
      $username = rcube_utils::get_input_value('_user', rcube_utils::INPUT_POST);

      echo json_encode($this->getUserInfos($username));

      exit;
    }

    /**
     * Ajoute des utilisateurs à un canal ou à un groupe.
     * 
     * @param array $users
     * @param string $channel_id
     * @param bool $private
     * 
     * @return array
     */
    public function add_users($users = null, $channel_id = null, $private = null)
    {
      $ajax = $users === null && $channel_id === null && $private === null;

      if ($users === null)
        $users = rcube_utils::get_input_value('_users', rcube_utils::INPUT_POST);

      if ($channel_id === null)
        $channel_id = rcube_utils::get_input_value('_channel', rcube_utils::INPUT_POST);

      if ($private === null)
        $private = rcube_utils::get_input_value('_private', rcube_utils::INPUT_POST);

      $rocketClient = $this->get_rc_client();
      $results = $rocketClient->add_users($channel_id, $users, $private);

      if (!$ajax)
        return $results;

      echo json_encode($results);
      exit;
    }

    /**
     * Ajoute ou retire le rôle "Owner" à un utilisateur
     * 
     * @param string $user
     * @param string $channel_id
     * @param bool $private
     * @param bool $remove
     * 
     * @return array
     */
    public function update_owner($user, $channel_id, $private, $remove = false)
    {
      $rocketClient = $this->get_rc_client();

      return $remove ? $rocketClient->remove_owner($channel_id, $user, $private) : $rocketClient->add_owner($channel_id, $user, $private);
    }

    /**
     * Supprime un utilisateur d'un groupe ou d'un canal.
     * 
     * @param string $user
     * @param string $channel_id
     * @param bool $private
     * 
     * @return array
     */
    public function kick_user($channel_id, $user, $private)
    {
      $rocketClient = $this->get_rc_client();

      return $rocketClient->kick_user($channel_id, $user, $private);
    }

    /**
     * Supprime un groupe ou un canal.
     * 
     * @param string $channel_id
     * @param bool $private
     * 
     * @return array
     */
    public function delete_channel($channel_id, $private)
    {
      $rocketClient = $this->get_rc_client();

      return $rocketClient->delete($channel_id, $private);      
    }

        /**
     * Supprime un groupe ou un canal.
     * 
     * @param string $channel_id
     * @param bool $private
     * 
     * @return array
     */
    public function update_channel_type($channel_id, $private)
    {
      $rocketClient = $this->get_rc_client();

      return $rocketClient->update_channel($channel_id, $private);      
    }

    /**
     * Récupère le nombre de messages non-lus d'un canal.
     */
    public function get_channel_unread_count()
    {
      $channel = rcube_utils::get_input_value('_channel', rcube_utils::INPUT_POST);
;
      $results = $this->_get_channel_unread_count($channel);

      echo json_encode($results);

      exit;
    }

    public function _get_channel_unread_count($channel) {
      $rocketClient = $this->get_rc_client();
      return $rocketClient->channel_count($channel);
    }

    /**
     * Récupère la liste des groupes ou des canaux rejoins.
     */
    public function get_joined()
    {
      $rocketClient = $this->get_rc_client();

      return $rocketClient->get_all_joined();
    }

    public function get_all_moderator_joined($user = null)
    {
      $rocketClient = $this->get_rc_client();

      return $rocketClient->get_all_moderator_joined($user ?? driver_mel::gi()->getUser()->uid);
    }

    public function _get_joined_action($user_id, $moderator_only, $mode) {
      if (!isset($user_id)) $user_id = driver_mel::gi()->getUser()->uid;

      if (!isset($moderator_only)) $moderator_only = false;

      if (!isset($mode)) $mode = 0;
      else $mode = (int) $mode;

      $list;
      try {
        if ($moderator_only)
        {
          $list = $this->get_all_moderator_joined($user_id);
        }
        else 
        {
          $list = $this->get_joined();
        }
  
        switch ($mode) {
          case 0:
            $list = json_encode($list);
            break;
  
          case 1: //public
            $list = json_encode($list['channel']);
            break;
  
          case 2: //private
            $list = json_encode($list['group']);
            break;
          
          default:
            # code...
            break;
        }
      } catch (\Throwable $th) {
        $list = [];
      }

      return $list;
    }

    public function get_joined_action()
    {
      $user_id = rcube_utils::get_input_value('_user_id', rcube_utils::INPUT_POST) ?? driver_mel::gi()->getUser()->uid;
      $moderator_only = rcube_utils::get_input_value('_moderator', rcube_utils::INPUT_POST) ?? false;
      $mode = rcube_utils::get_input_value('_mode', rcube_utils::INPUT_POST) ?? 0;

      $list = $this->_get_joined_action($user_id, $moderator_only, $mode);

      echo $list;
      exit;

    }

    public function check_if_room_exist($room_id)
    {
      return $this->get_rc_client()->room_exist($room_id);
    }

    public function check_if_room_exist_by_name($room_name)
    {
      return $this->get_rc_client()->room_exist($room_name, false);
    }

    public function room_info($room_name)
    {
      $infos = $this->get_rc_client()->room_info($room_name, false);
      $infos["content"] = json_decode($infos["content"]);
      return $infos;
    }

    public function get_status() {
      $infos = $this->_get_status();
      echo json_encode($infos);
      exit;
    }

    public function _get_status() {
      $infos = $this->get_rc_client()->get_user_status();
      $infos["content"] = json_decode($infos["content"]);

      return $infos;
    }

    public function set_status(){
      $status = rcube_utils::get_input_value('_st', rcube_utils::INPUT_POST);
      $msg = rcube_utils::get_input_value('_msg', rcube_utils::INPUT_POST);

      $return = $this->_set_status($status, $msg);
      echo json_encode($return);
      exit;
    }

    public function _set_status($status, $message) {
      return $this->get_rc_client()->set_user_status($status, $message);
    }
}