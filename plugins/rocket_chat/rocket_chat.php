<?php 
include_once __DIR__."../mel_metapage/program/chat/includes.php";
class rocket_chat extends AChatPlugin
{
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

  public function init_plugin()
  {
    global $__page_content;

    if ($this->is_current_task()) $this->__get('setup_plugin');
  }

  public function register_module()
  {
    parent::register_module();
    // ajout de la tache
    if ($this->rc->task == 'ariane') $this->register_task('ariane');
    else $this->register_task('discussion');
  }

  protected function include_js() {
    if (!$this->is_current_task() && $this->rc->task !== 'logout')
    {
      // Appel le script de création du chat
      $this->include_script('rocket_chat_storage_event.js');
      // Appel la lib pour la gestion du Favico
      $this->include_script('favico.js');
      // Appel le script de création du chat
      $this->include_script('rocket_chat.js');
      if (!class_exists("mel_metapage")) $this->include_script('rocket_chat_link.js');
    }
  }

  protected function include_css() {
    $this->include_stylesheet($this->local_skin_path() . '/mel_frame.css');
  }

  protected function include_env() {
    $this->rc->output->set_env('refresh_interval', 0);

    if (!$this->is_current_task() && $this->rc->task !== 'logout')
    {
      $this->rc->output->set_env('rocket_chat_url', $this->rc->config->get('rocket_chat_url'));
      $this->rc->output->set_env('rocket_chat_params_url', $this->rc->url(array(
        "_task" => "discussion",
        "_params" => "%%other_params%%"
      )));
    }
  }

  protected function add_bnum_buttons()
  {
    if ($this->can_use_rc())
    {
      // Ajoute le bouton en fonction de la skin
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
        ), 'taskbar');
      }
    }
  }

  protected function additionnal_setup() {
    if ($this->is_current_task() && !$this->is_courielleur())
    {
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
  } 

  public function connector_index($args = [])
  {
      if ($this->is_courielleur()) return $this->index_courielleur();
      else return parent::connector_index($args);
  }

  public function index_courrielleur() {
    // Chargement du template d'affichage
    $this->rc->output->set_pagetitle($this->gettext('title'));
    $this->rc->output->send('rocket_chat.rocket_chat_courrielleur');
  }

  public function page_index()
  {
    if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "rocket_chat::action()");
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

  /**
   * Appel le login vers Rocket.Chat
   * @throws Exception
   */
  public function login($args = []) {
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
   * Créer un canal ou un groupe.
   *
   * @param string $room_name
   * @param array $users
   * @param bool $is_public
   * @return array
   */
  public function create_channel($room_name, $users, $is_public)
  {
    $user = $this->rc->get_user_name();
    $rocketClient = $this->get_rc_client();

    return $rocketClient->create_chanel($room_name, $users, $is_public);
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
  public function add_users($users, $channel_id, $private, ...$miscs)
  {
    $rocketClient = $this->get_rc_client();
    $results = $rocketClient->add_users($channel_id, $users, $private);

    return $results;
  }

  /**
   * Récupère les infos de l'utilisateur.
   */
  public function get_user_info($user)
  {
    return $this->getUserInfos($username);
  }

  /**
   * Récupère le nombre de messages non-lus d'un canal.
   */
  public function get_channel_unread_count($channel)
  {
    $rocketClient = $this->get_rc_client();
    return $rocketClient->channel_count($channel);
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

  public function post_message($room_id, $text)
  {
    $this->advanced_post_message($room_id, $text);
  }

  public function advanced_post_message($room_id, $text, $alias, $avatar = null)
  {
    $rocketClient = $this->get_rc_client();

    return $rocketClient->post_message($room_id, $text, $alias);//, $avatar);
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

  private function can_use_rc()
  {
    return !$this->rc->config->get('rocket_chat_limited_use', false) || in_array($this->rc->get_user_name(), $this->rc->config->get('rocket_chat_users', []));
  }

  private function is_courielleur()
  {
    return $this->is_current_task() && isset($_GET['_courrielleur']);
  }

  private function is_current_task()
  {
    return $this->rc->task == 'ariane' || $this->rc->task == 'discussion';
  }
}