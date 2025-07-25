<?php
define('DEFAULT_SYMBOL', '¤¤¤¤¤¤¤DEFAULT_SYMBOL¤¤¤¤¤¤¤');
use LibMelanie\Api\Defaut\Workspaces\Share;

/**
 * Classe représentant un espace de travail.
 */
class Workspace {
  /**
   * @var string Identifiant unique de l'espace de travail.
   */
  private $_uid;

  /**
   * @var LibMelanie\Api\Defaut\Workspace Instance de l'espace de travail.
   */
  private $_workspace;

  /**
   * @var string Logo de l'espace de travail.
   */
  private $_logo;

  /**
   * @var string Titre de l'espace de travail.
   */
  private $_title;

  /**
   * @var string Description de l'espace de travail.
   */
  private $_description;

  /**
   * @var string Hashtag associé à l'espace de travail.
   */
  private $_hashtag;

  /**
   * @var array Liste des utilisateurs de l'espace de travail.
   */
  private $_users;

  /**
   * @var bool Indique si l'espace de travail est public.
   */
  private $_ispublic;

  /**
   * @var string Créateur de l'espace de travail.
   */
  private $_creator;

  /**
   * @var DateTime Date de création de l'espace de travail.
   */
  private $_created;

  /**
   * @var DateTime Date de dernière modification de l'espace de travail.
   */
  private $_modified;

  /**
   * Constructeur de la classe Workspace.
   *
   * @param string $uid Identifiant unique de l'espace de travail.
   * @param bool $load Indique si l'espace de travail doit être chargé immédiatement.
   */
  public function __construct($uid, $load = false) {
    if ($uid !== null) {
      $this->_uid = $uid;
      $this->_workspace = driver_mel::gi()->workspace([driver_mel::gi()->getUser()]);
      $this->_workspace->uid = $uid;

      if ($load) $this->load();
    }
  }

  /**
   * Initialise l'objet à partir d'une instance d'espace de travail.
   *
   * @param object $workspace Instance de l'espace de travail.
   * @return self
   */
  private function _from_workspace($workspace) {
    $this->_workspace = $workspace;
    $this->_uid = $this->_workspace->uid;

    return $this->_unset();
  }

  /**
   * Réinitialise les propriétés de l'objet.
   *
   * @return self
   */
  private function _unset() {
    unset($this->_title);
    unset($this->_description);
    unset($this->_hashtag);
    unset($this->_users);
    unset($this->_ispublic);
    unset($this->_creator);
    unset($this->_created);
    unset($this->_modified);
    unset($this->_logo);

    return $this;
  }

  /**
   * Charge les données de l'espace de travail.
   *
   * @return self
   */
  public function load() {
    $this->_workspace->load();

    return $this->_unset();
  }

  /**
   * Bascule l'état de favori de l'espace de travail.
   */
  public function toggleFavorite() {
    FavoriteData::ToggleWsp($this->_uid);
  }

  /**
   * Vérifie si l'espace de travail est marqué comme favori.
   *
   * @return bool
   */
  public function isFavorite() {
    return FavoriteData::From($this->_uid)->is();
  }

  /**
   * Sauvegarde les modifications de l'espace de travail.
   *
   * @return self
   */
  public function save() {
    $this->modified(new DateTime());
    $this->_workspace->save();
  
    return $this->_unset();
  }

  /**
   * Récupère l'instance de l'espace de travail.
   *
   * @return LibMelanie\Api\Defaut\Workspace
   */
  public function get() {
    return $this->_workspace;
  }

  /**
   * Vérifie si l'espace de travail existe.
   *
   * @return bool
   */
  public function exists() {
    return !is_null($this->_workspace) && $this->_workspace->exists();
  }

  /**
   * Récupère l'identifiant unique de l'espace de travail.
   *
   * @return ?string
   */
  public function uid() {
    return $this->_uid;
  }

  /**
   * Met à jour ou récupère une propriété de l'espace de travail.
   *
   * @param string $prop Nom de la propriété.
   * @param mixed $item Valeur de la propriété.
   * @return mixed
   */
  private function _update_or_get_item($prop ,$item = DEFAULT_SYMBOL) {
    $private_prop = "_$prop";
    $ret = $this;

    if ($item !== DEFAULT_SYMBOL) {
      $this->_workspace->$prop = $item;
      $this->$private_prop = $item;
    }
    else if(isset($this->$private_prop)) $ret = $this->$private_prop;
    else {
      $this->$private_prop = $this->_workspace->$prop;
      $ret = $this->$private_prop;
    }

    return $ret;    
  }

  /**
   * Récupère ou met à jour le logo de l'espace de travail.
   *
   * @param string $newLogo Nouveau logo.
   * @return mixed
   */
  public function logo($newLogo = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('logo', $newLogo);
  }  

  /**
   * Récupère ou met à jour le titre de l'espace de travail.
   *
   * @param string $newTitle Nouveau titre.
   * @return mixed
   */
  public function title($newTitle = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('title', $newTitle);
  }

  /**
   * Récupère ou met à jour la description de l'espace de travail.
   *
   * @param string $newDesc Nouvelle description.
   * @return mixed
   */
  public function description($newDesc = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('description', $newDesc);
  }

  /**
   * Récupère ou met à jour le hashtag de l'espace de travail.
   *
   * @param string $newTag Nouveau hashtag.
   * @return mixed
   */
  public function hashtag($newTag = DEFAULT_SYMBOL) {
    $ret = $this;

    if ($newTag !== DEFAULT_SYMBOL) {
      $this->_workspace->hashtags = [$newTag];
      $this->_hashtag = $newTag;
    }
    else if(isset($this->_hashtag)) $ret = $this->_hashtag;
    else {
      $this->_hashtag = $this->_workspace->hashtags !== null && $this->_workspace->hashtags[0] != null ? $this->_workspace->hashtags[0] : null;
      $ret = $this->_hashtag;
    }

    return $ret;    
  }

  /**
   * Vérifie ou met à jour l'état d'archivage de l'espace de travail.
   *
   * @param bool $newState Nouvel état d'archivage.
   * @return self|bool
   * @todo Changer mixed par self|bool lors du passage à php 8
   */
  public function isArchived($newState = DEFAULT_SYMBOL) {
    if ($newState === DEFAULT_SYMBOL) return $this->_workspace->isarchived;
    else $this->_workspace->isarchived = $newState;

    return $this;
  }

  /**
   * Récupère les paramètres de l'espace de travail.
   *
   * @return WorkspaceSetting
   */
  public function settings() {
    return new WorkspaceSetting($this->_workspace);
  }

  /**
   * Récupère les objets de l'espace de travail.
   *
   * @return WorkspaceObject
   */
  public function objects() {
    return new WorkspaceObject($this->_workspace);
  }

  /**
   * Récupère les services de l'espace de travail.
   *
   * @param bool $toHave Indique si seuls les services possédés doivent être inclus.
   * @param bool $includeOnlyHave Indique si seuls les services possédés doivent être inclus.
   * @return array|string
   * @todo Changer mixed par array|string lors du passage à php 8
   */
  public function services($toHave = false, $includeOnlyHave = false) {
    if (!$toHave) return $this->_workspace->objects;
    else {
      return $this->objects()->convertToEnabled($includeOnlyHave);
    }
  }

  /**
   * Vérifie si l'espace de travail possède un service spécifique.
   *
   * @param string $service Nom du service.
   * @return bool
   */
  public function hasService($service) {
    return in_array($service, $this->services(true, true));
  }

  /**
   * Récupère ou met à jour l'état public de l'espace de travail.
   *
   * @param bool $newState Nouvel état public.
   * @return mixed
   */
  public function isPublic($newState = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('ispublic', $newState);
  }

  /**
   * Récupère ou met à jour le créateur de l'espace de travail.
   *
   * @param string $newCreator Nouveau créateur.
   * @return mixed
   */
  public function creator($newCreator = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('creator', $newCreator);
  }

  /**
   * Récupère ou met à jour la date de création de l'espace de travail.
   *
   * @param DateTime $newDate Nouvelle date de création.
   * @return mixed
   */
  public function created($newDate = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('created', $newDate);
  }

  /**
   * Récupère ou met à jour la date de dernière modification de l'espace de travail.
   *
   * @param DateTime $newDate Nouvelle date de modification.
   * @return mixed
   */
  public function modified($newDate = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('modified', $newDate);
  }

  /**
   * Récupère ou met à jour la couleur de l'espace de travail.
   *
   * @param string $newColor Nouvelle couleur.
   * @return mixed
   */
  public function color($newColor = null) {
    $ret = $this;

    if (isset($newColor)) $this->settings()->set('color', $newColor);
    else $ret = $this->settings()->get('color');

    return $ret;
  }

  /**
   * Vérifie si un utilisateur fait partie de l'espace de travail.
   *
   * @param string $user_id Identifiant de l'utilisateur.
   * @return bool
   */
  public function hasUser($user_id = null) {
    $user_id ??= driver_mel::gi()->getUser()->uid;
    return mel_helper::Enumerable($this->users())->any(function ($k, $v) use($user_id) {
      return $v->user_uid === $user_id;
    });
  }

  /**
   * Vérifie si un utilisateur fait partie de l'espace de travail à partir de son email.
   *
   * @param string $email Email de l'utilisateur.
   * @return bool
   */
  public function hasUserFromEmail($email) {
    return $this->users(true)->any(function ($k, $v) use($email) {
      return $v->email === $email;
    });
  }

  /**
   * Met à jour la liste des utilisateurs de l'espace de travail.
   *
   * @param array $newUsers Nouvelle liste des utilisateurs.
   * @return self
   */
  public function updateUsers($newUsers) {
    $this->_users = $newUsers;
    $this->_workspace->shares = $this->_users;
    return $this;
  }

  /**
   * Récupère les informations de partage d'un utilisateur.
   *
   * @param string $userId Identifiant de l'utilisateur.
   * @param bool $to_melanie_user Indique si l'utilisateur est un utilisateur de Mélanie.
   * @return mixed
   */
  public function share($userId = null, $to_melanie_user = false){
    $userId ??= driver_mel::gi()->getUser()->uid;

    if ($to_melanie_user) { 
      return $this->users($to_melanie_user)->where(function ($k, $v) use($userId) {
        return $v->uid === $userId;
      })->firstOrDefault();
    }
    else return $this->users()[$userId];
  } 

  /**
   * Récupère la liste des utilisateurs de l'espace de travail.
   *
   * @param bool $to_melanie_user Indique si les utilisateurs doivent être convertis en utilisateurs de Mélanie.
   * @return array|IMel_Enumerable
   */
  public function users($to_melanie_user = false) {
    if (!isset($this->_users)) $this->_users = $this->_workspace->shares;
    return $to_melanie_user ? mel_helper::Enumerable($this->_users)->select(function ($k, $v) {
      return driver_mel::gi()->getUser($v->user_uid);
    })->where(function ($k, $v) {
      return !is_null($v);
    }) : $this->_users;
  }

  /**
   * Récupère les emails des utilisateurs de l'espace de travail.
   *
   * @param bool $to_array Indique si les emails doivent être retournés sous forme de tableau.
   * @return array|IMel_Enumerable
   * @todo Changer mixed par array|IMel_Enumerable lors du passage à php 8
   */
  public function users_mail($to_array = true) {
    $to_melanie_user = true;
    $tmp = $this->users($to_melanie_user)->select(function ($k, $v) {
      return $v->email;
    });

    return $to_array ? $tmp->toArray() : $tmp;
  }

  /**
   * Ajoute des propriétaires à l'espace de travail.
   *
   * @param array $users Liste des utilisateurs à ajouter.
   * @return array
   */
  public function add_owners(...$users) {
    return $this->_add_users(mel_helper::Enumerable($users)->select(function($k, $v) {
      return ['right' => Share::RIGHT_OWNER, 'user' => $v];
    }));
  }

  /**
   * Ajoute des utilisateurs à l'espace de travail.
   *
   * @param array $users Liste des utilisateurs à ajouter.
   * @return array
   */
  public function add_users(...$users) {
    return $this->_add_users(mel_helper::Enumerable($users)->select(function($k, $v) {
      return ['right' => Share::RIGHT_WRITE, 'user' => $v];
    }));
  }

  /**
   * Vérifie si un utilisateur est administrateur de l'espace de travail.
   *
   * @param string $username Nom d'utilisateur.
   * @return bool
   */
  public function isAdmin($username = null) {
    $user = $this->users()[$username ?? driver_mel::gi()->getUser()->uid];
    if ($user !== null)
        return $user->rights === Share::RIGHT_OWNER;
    else
        return false;
  }

  /**
   * Récupère la liste des administrateurs de l'espace de travail.
   *
   * @return IMel_Enumerable
   */
  public function getAdmins() {
    return mel_helper::Enumerable($this->users())->where(function ($k, $v) {
      return $v->rights === Share::RIGHT_OWNER;
    });
  }

  /**
   * Sérialise les données de l'espace de travail.
   *
   * @param bool $addUsers Indique si les utilisateurs doivent être inclus dans la sérialisation.
   * @return string
   */
  public function serialize($addUsers = false) {
    $raw = [
      'uid' => $this->uid(),
      'title' => $this->title(),
      'description' => $this->description(),
      'hashtag' => $this->hashtag(),
      'logo' => $this->logo(),
      'users' => ($addUsers ? $this->users() : ''),
      'isPublic' => $this->isPublic(),
      'modified' => $this->modified(),
      'color' => $this->color(),
      'isJoin' => $this->hasUserFromEmail(driver_mel::gi()->getUser()->email),
      'isAdmin' => $this->isAdmin(),
      'services' => $this->objects()->serialize(), 
    ];

    $raw['isAdminAlone'] = $raw['isAdmin'] && $this->getAdmins()->count() === 1;

    return json_encode($raw);
  }

  /**
   * Ajoute des utilisateurs internes à l'espace de travail.
   *
   * @param array $users Liste des utilisateurs à ajouter.
   * @return array
   */
  private function _add_users($users) {
    $return_data = [            
      "errored_user" => [],
      "existing_users" => []
    ];

    $shares = $this->users();

    foreach ($users as $userData) {
      $right = $userData['right'];
      $id = $userData['user'];

      if (is_array($id)) $id = $id[0];

      $share = driver_mel::gi()->workspace_share([$this->_workspace]);
      $tmp_user = null;
      if (strpos($id, '@')) {
        $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $id);
      }else {
        $tmp_user = driver_mel::gi()->getUser($id);
      }

      if ($shares[$tmp_user->uid] !== null) continue;

      $user_exists = true;
      $just_created = false;

      if ($tmp_user->uid === null && !$tmp_user->is_list) {
        if (rcmail::get_instance()->config->get('enable_external_users', false)) {
            $user_exists = driver_mel::gi()->create_external_user($id, $this->_workspace);
            $just_created = true;
        }
        else {
            $user_exists = false;
        }
        
        if ($user_exists) {
            $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $id);
        }
        else {
            $return_data["errored_user"][] = $id;
        }
      }

      if ($user_exists) {
        foreach ($this->_add_internal_user($tmp_user) as $added_user) {
            if ($added_user !== null) {
              if ($shares[$added_user] !== null) continue;

                $return_data["existing_users"][] = ['just_created' => $just_created, 'user' => $added_user];
                $share = driver_mel::gi()->workspace_share([$this->_workspace]);
                $share->user = $added_user;
                $share->rights = $right;
                $shares[] = $share;             
            }
        }
      }
    }

    if (isset($return_data['existing_users']) && count($return_data['existing_users']) > 0) $this->_workspace->shares = $shares;

    $this->save();
    $this->load();

    return $return_data;
  }

  /**
   * Ajoute un utilisateur interne à l'espace de travail.
   *
   * @param object $user Utilisateur à ajouter.
   * @return Generator<int|int, mixed|mixed, mixed, void>
   */
  private function _add_internal_user($user) {
    if ($user->is_list) {
        $list = [];

        foreach ($user->list->members as $value) {
          if ($value->uid === null) continue;

          $currentUser = driver_mel::gi()->getUser($value->uid);

          if ($currentUser === null || $currentUser->email === null) continue;
          unset($currentUser);

          $value = $value->uid;
          $list[] = $value;
          yield $value;
        }

        $lists = $this->settings()->get('lists') ?? [];//$this->get_setting($workspace, 'lists') ?? [];

        if (is_array($lists)) $lists[$user->mail[0]] = $list;
        else {
            $user = $user->mail[0];
            $lists->$user = $list;
        }

        $this->settings()->set('lists', $lists);//$this->add_setting($workspace, 'lists', $lists);
    } 
    else yield $user->uid;
  }

  /**
   * Récupère une instance de Workspace chargée.
   *
   * @param string $uid Identifiant unique de l'espace de travail.
   * @return Workspace
   */
  public static function GetLoad($uid) {
    return new Workspace($uid, true);
  }

  /**
   * Initialise un objet Workspace à partir d'une instance d'espace de travail.
   *
   * @param LibMelanie\Api\Defaut\Workspace $workspace Instance de l'espace de travail.
   * @return Workspace
   */
  public static function FromWorkspace($workspace) {
    $wsp = new Workspace(null);

    return $wsp->_from_workspace($workspace);
  }

  /**
   * Vérifie si un identifiant d'espace de travail est valide.
   *
   * @param string $uid Identifiant unique de l'espace de travail.
   * @return bool
   */
  public static function IsUIDValid($uid) {
    mel_helper::load_helper()->include_utilities();
    return mel_utils::replace_special_char($uid) === $uid && strtolower($uid) === $uid;
  }

  /**
   * Génère un identifiant unique pour un espace de travail à partir de son titre.
   *
   * @param string $title Titre de l'espace de travail.
   * @return string
   */
  public static function GenerateUID($title)
  {
      $max = 30;

      mel_helper::load_helper()->include_utilities();
      $text = mel_utils::replace_determinants(mel_utils::replace_special_char(strtolower(mel_utils::remove_accents($title))), "-");
      $text = str_replace(" ", "-", $text);
      if (count($text) > $max)
      {
          $title = "";
          for ($i=0; $i < count($text); $i++) { 
              if ($i >= $max)
                  break;
              $title.= $text[$i];
          }
          $text = $title;
      }
      $it = 0;

      $workspace = driver_mel::gi()->workspace();
      $workspace->uid = $text;
      while ($workspace->exists()) {
        $workspace = driver_mel::gi()->workspace();
        $workspace->uid = $text."-".(++$it);
      }

      while (driver_mel::gi()->if_group_exist($workspace->uid)) {
        $workspace = driver_mel::gi()->workspace();
        $workspace->uid = $text."-".(++$it);
      }
      
      return $it > 0 ? $text."-".$it : $text;
  }

  /**
   * Bascule l'état de favori d'un espace de travail.
   *
   * @param string $uid Identifiant unique de l'espace de travail.
   * @param bool $load Indique si l'espace de travail doit être chargé immédiatement.
   * @return Workspace
   */
  public static function ToggleFavoriteWsp($uid, $load = false) {
    $wsp = new Workspace($uid, $load);
    $wsp->toggleFavorite();

    return $wsp;
  }

  /**
   * Récupère la liste des espaces de travail partagés.
   * @return Generator 
   */
  public static function Workspaces() {
    yield from mel_helper::Enumerable(driver_mel::gi()->getUser()->getSharedWorkspaces("modified", false))->select(function ($key,$value) {
      return Workspace::FromWorkspace($value);
    });
  }

}

/**
 * Classe représentant les données de favoris.
 */
class FavoriteData {
  /**
   * @var string Identifiant unique de l'espace de travail.
   */
  private $uid;

  /**
   * @var array Configuration des favoris.
   */
  private $config;

  /**
   * Constructeur de la classe FavoriteData.
   *
   * @param string $uid Identifiant unique de l'espace de travail.
   */
  public function __construct($uid) {
    $this->uid =  $uid;
    $this->config = self::_Config();

    if (!isset($this->config[$this->uid])) $this->config[$this->uid] = ['tak' => false];
  }

  /**
   * Vérifie si l'espace de travail est marqué comme favori.
   *
   * @return bool
   */
  public function is() {
    return isset($this->config[$this->uid]) && $this->config[$this->uid]['tak'] === true;
  }

  /**
   * Bascule l'état de favori de l'espace de travail.
   */
  public function toggle() {
    $this->config[$this->uid]['tak'] = !$this->config[$this->uid]['tak'];
  }

  /**
   * Sauvegarde la configuration des favoris.
   *
   * @return bool
   */
  public function save() {
    return rcmail::get_instance()->user->save_prefs(array('workspaces_personal_datas' => $this->config));
  }

  /**
   * Récupère la configuration des favoris.
   *
   * @return array
   */
  private static function _Config() {
    return rcmail::get_instance()->config->get('workspaces_personal_datas', []);
  }

  /**
   * Récupère une instance de FavoriteData à partir d'un identifiant unique.
   *
   * @param string $uid Identifiant unique de l'espace de travail.
   * @return FavoriteData
   */
  public static function From($uid) {
    return new FavoriteData($uid);
  } 

  /**
   * Récupère la liste des identifiants des espaces de travail marqués comme favoris.
   *
   * @return array
   */
  public static function UIds() {
    $config = self::_Config() ?? [];

    return mel_helper::Enumerable($config)->where(function ($k, $v) {
      return $v && isset($v['tak']) && $v['tak'] === true;
    })->select(function ($k, $v) {
      return $k;
    })->toArray();
  }

  /**
   * Bascule l'état de favori d'un espace de travail.
   *
   * @param string $uid Identifiant unique de l'espace de travail.
   * @param bool $save Indique si la configuration doit être sauvegardée.
   * @return FavoriteData
   */
  public static function ToggleWsp($uid, $save = true) {
    $data = self::From($uid);
    $data->toggle();

    if ($save) $data->save();

    return $data;
  }
}

/**
 * Classe représentant les paramètres d'un espace de travail.
 */
class WorkspaceSetting {
  /**
   * @var LibMelanie\Api\Defaut\Workspace Instance de l'espace de travail.
   */
  private $_workspace;

  /**
   * Constructeur de la classe WorkspaceSetting.
   *
   * @param LibMelanie\Api\Defaut\Workspace $workspace Instance de l'espace de travail.
   */
  public function __construct(&$workspace) {
    $this->_workspace = $workspace;
  }

  /**
   * Récupère la valeur d'un paramètre de l'espace de travail.
   *
   * @param string $key Nom du paramètre.
   * @return mixed
   */
  public function get($key) {
    if ($this->_workspace->settings === null) return null;
    else return json_decode($this->_workspace->settings)->$key;
  }

  /**
   * Définit la valeur d'un paramètre de l'espace de travail.
   *
   * @param string $key Nom du paramètre.
   * @param mixed $value Valeur du paramètre.
   * @return self
   */
  public function set($key, $value) {
    if ($this->_workspace->settings === null)
      $this->_workspace->settings = [$key => $value];
    else {
        $this->_workspace->settings = json_decode($this->_workspace->settings);
        $this->_workspace->settings->$key = $value;
    }

    $this->_workspace->settings = json_encode($this->_workspace->settings);

    return $this;
  }
}

/**
 * Classe représentant les objets d'un espace de travail.
 */
class WorkspaceObject {
  /**
   * @var LibMelanie\Api\Defaut\Workspace Instance de l'espace de travail.
   */
  private $_workspace;

  /**
   * Constructeur de la classe WorkspaceObject.
   *
   * @param LibMelanie\Api\Defaut\Workspace $workspace Instance de l'espace de travail.
   */
  public function __construct(&$workspace) {
    $this->_workspace = $workspace;
  }

  /**
   * Récupère la valeur d'un objet de l'espace de travail.
   *
   * @param string $key Nom de l'objet.
   * @return mixed
   */
  public function get($key) {
    if ($this->_workspace->objects === null) return null;
    else return json_decode($this->_workspace->objects)->$key;
  }

  /**
   * Définit la valeur d'un objet de l'espace de travail.
   *
   * @param string $key Nom de l'objet.
   * @param mixed $object Valeur de l'objet.
   * @return self
   */
  public function set($key, $object) {
    if ($this->_workspace->objects === null) $this->_workspace->objects = [$key => $object];
    else
    {
        $this->_workspace->objects = json_decode($this->_workspace->objects);
        $this->_workspace->objects->$key = $object;
    }

    $this->_workspace->objects = json_encode($this->_workspace->objects);

    return $this;
  }

  /**
   * Supprime un objet de l'espace de travail.
   *
   * @param string $key Nom de l'objet.
   * @return self
   */
  public function remove($key) {
    if ($this->_workspace->objects !== null)
    {
        $this->_workspace->objects = json_decode($this->_workspace->objects);

        if (isset($this->_workspace->objects->$key)) unset($this->_workspace->objects->$key);

        $this->_workspace->objects = json_encode($this->_workspace->objects);
    }

    return $this;
  }

  /**
   * Convertit les objets de l'espace de travail en services activés.
   *
   * @param bool $includeOnlyHave Indique si seuls les services possédés doivent être inclus.
   * @return Generator
   */
  public function convertToEnabledGenerator($includeOnlyHave = false) {
    $objects = json_decode($this->_workspace->objects);

    foreach ($objects as $key => $value) {
      if (!$includeOnlyHave || ($includeOnlyHave && isset($value))) yield $key => isset($value);
    }
  }

  /**
   * Convertit les objets de l'espace de travail en services activés.
   *
   * @param bool $includeOnlyHave Indique si seuls les services possédés doivent être inclus.
   * @return array
   */
  public function convertToEnabled($includeOnlyHave = false) {
    $return = [];
    $objects = json_decode($this->_workspace->objects);

    foreach ($objects as $key => $value) {
      if ($includeOnlyHave && isset($value)) $return[] = $key;
      else if (!$includeOnlyHave ) $return[$key] = isset($value);
    }

    if (!$includeOnlyHave) {
      $plugin = rcmail::get_instance()->plugins->exec_hook('workspace.service.get', [
        'workspace' => $this->_workspace,
        'services' => $return
      ]) ?? ['services' => $return];

      $return = $plugin['services'];
    }

    return $return;
  }

  /**
   * Vérifie si un objet existe dans l'espace de travail.
   *
   * @param string $key Nom de l'objet.
   * @return bool
   */
  public function has($key) {
    return $this->get($key) !== null;
  }

  /**
   * Sérialise les objets de l'espace de travail.
   *
   * @return array
   */
  public function serialize() {
    return json_decode($this->_workspace->objects);
  }
}