<?php
define('DEFAULT_SYMBOL', '¤¤¤¤¤¤¤DEFAULT_SYMBOL¤¤¤¤¤¤¤');
use LibMelanie\Api\Defaut\Workspaces\Share;
class Workspace {
  private $_uid;
  private $_workspace;
  private $_logo;
  private $_title;
  private $_description;
  private $_hashtag;
  private $_users;
  private $_ispublic;
  private $_creator;
  private $_created;
  private $_modified;
  
  public function __construct($uid, $load = false) {
    if ($uid !== null) {
      $this->_uid = $uid;
      $this->_workspace = driver_mel::gi()->workspace([driver_mel::gi()->getUser()]);
      $this->_workspace->uid = $uid;

      if ($load) $this->load();
    }
  }

  private function _from_workspace($workspace) {
    $this->_workspace = $workspace;
    $this->_uid = $this->_workspace->uid;

    return $this->_unset();
  }

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

  public function load() {
    $this->_workspace->load();

    return $this->_unset();
  }

  public function toggleFavorite() {
    FavoriteData::ToggleWsp($this->_uid);
  }

  public function isFavorite() {
    return FavoriteData::From($this->_uid)->is();
  }

  public function save() {
    $this->modified(new DateTime());
    $this->_workspace->save();
  
    return $this->_unset();
  }

  public function get() {
    return $this->_workspace;
  }

  public function exists() {
    return !is_null($this->_workspace) && $this->_workspace->exists();
  }

  public function uid() {
    return $this->_uid;
  }

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

  public function logo($newLogo = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('logo', $newLogo);
  }  

  public function title($newTitle = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('title', $newTitle);
  }

  public function description($newDesc = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('description', $newDesc);
  }

  public function hashtag($newTag = DEFAULT_SYMBOL) {
    $ret = $this;

    if ($newTag !== DEFAULT_SYMBOL) {
      $this->_workspace->hashtags = [$newTag];
      $this->_hashtag = $newTag;
    }
    else if(isset($this->_hashtag)) $ret = $this->_hashtag;
    else {
      $this->_hashtag = isset($this->_workspace->hashtags) && isset($this->_workspace->hashtags[0]) ? $this->_workspace->hashtags[0] : null;
      $ret = $this->_hashtag;
    }

    return $ret;    
  }

  public function isArchived($newState = DEFAULT_SYMBOL) {
    if ($newState === DEFAULT_SYMBOL) return $this->_workspace->isarchived;
    else $this->_workspace->isarchived = $newState;

    return $this;
  }

  public function settings() {
    return new WorkspaceSetting($this->_workspace);
  }

  public function objects() {
    return new WorkspaceObject($this->_workspace);
  }

  public function services($toHave = false, $includeOnlyHave = false) {
    if (!$toHave) return $this->_workspace->objects;
    else {
      return $this->objects()->convertToEnabled($includeOnlyHave);
    }
  }

  public function isPublic($newState = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('ispublic', $newState);
  }

  public function creator($newCreator = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('creator', $newCreator);
  }

  public function created($newDate = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('created', $newDate);
  }

  public function modified($newDate = DEFAULT_SYMBOL) {
    return $this->_update_or_get_item('modified', $newDate);
  }

  public function color($newColor = null) {
    $ret = $this;

    if (isset($newColor)) $this->settings()->set('color', $newColor);
    else $ret = $this->settings()->get('color');

    return $ret;
  }

  public function hasUser($user_id) {
    return mel_helper::Enumerable($this->users())->any(function ($k, $v) use($user_id) {
      return $v->user_uid === $user_id;
    });
  }

  public function hasUserFromEmail($email) {
    return $this->users(true)->any(function ($k, $v) use($email) {
      return $v->email === $email;
    });
  }

  public function share($userId = null, $to_melanie_user = false){
    $userId ??= driver_mel::gi()->getUser()->uid;

    if ($to_melanie_user) { 
      return $this->users($to_melanie_user)->where(function ($k, $v) use($userId) {
        return $v->uid === $userId;
      })->firstOrDefaut();
    }
    else return $this->users()[$userId];
  } 

  public function users($to_melanie_user = false) {
    if (!isset($this->_users)) $this->_users = $this->_workspace->shares;
    return $to_melanie_user ? mel_helper::Enumerable($this->_users)->select(function ($k, $v) {
      return driver_mel::gi()->getUser($v->user_uid);
    })->where(function ($k, $v) {
      return !is_null($v);
    }) : $this->_users;
  }

  public function users_mail($to_array = true) {
    $to_melanie_user = true;
    $tmp = $this->users($to_melanie_user)->select(function ($k, $v) {
      return $v->email;
    });

    return $to_array ? $tmp->toArray() : $tmp;
  }

  public function add_owners(...$users) {
    return $this->_add_users(mel_helper::Enumerable($users)->select(function($k, $v) {
      return ['right' => Share::RIGHT_OWNER, 'user' => $v];
    }));
  }

  public function add_users(...$users) {
    return $this->_add_users(mel_helper::Enumerable($users)->select(function($k, $v) {
      return ['right' => Share::RIGHT_WRITE, 'user' => $v];
    }));
  }

  public function isAdmin($username = null) {
    $user = $this->users()[$username ?? driver_mel::gi()->getUser()->uid];
    if ($user !== null)
        return $user->rights === Share::RIGHT_OWNER;
    else
        return false;
  }

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
      'services' => $this->objects()->serialize()
    ];

    return json_encode($raw);
  }

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

  private function _add_internal_user($user) {
    if ($user->is_list) {
        $list = [];

        foreach ($user->list->members as $value) {
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

  public static function FromWorkspace($workspace) {
    $wsp = new Workspace(null);

    return $wsp->_from_workspace($workspace);
  }

  public static function IsUIDValid($uid) {
    mel_helper::load_helper()->include_utilities();
    return mel_utils::replace_special_char($uid) === $uid && strtolower($uid) === $uid;
  }

  public static function GenerateUID($title)
  {
      $max = 30;

      mel_helper::load_helper()->include_utilities();
      $text = mel_utils::replace_determinants(mel_utils::replace_special_char(mel_utils::remove_accents(strtolower($title))), "-");
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
      do {
          $workspace = driver_mel::gi()->workspace();
          $workspace->uid = $text."-".(++$it);
      } while ($workspace->exists());
      
      do {
          $workspace = driver_mel::gi()->workspace();
          $workspace->uid = $text."-".(++$it);
      } while (driver_mel::gi()->if_group_exist($workspace->uid));

      return $text."-".$it;
  }

  public static function ToggleFavoriteWsp($uid, $load = false) {
    $wsp = new Workspace($uid, $load);
    $wsp->toggleFavorite();

    return $wsp;
  }

  public static function Workspaces() {
    yield from mel_helper::Enumerable(driver_mel::gi()->getUser()->getSharedWorkspaces("modified", false))->select(function ($key,$value) {
      return Workspace::FromWorkspace($value);
    });
  }

}

class FavoriteData {
  private $uid;
  private $config;

  public function __construct($uid) {
    $this->uid =  $uid;
    $this->config = self::_Config();

    if (!isset($this->config[$this->uid])) $this->config[$this->uid] = ['tak' => false];
  }

  public function is() {
    return isset($this->config[$this->uid]) && $this->config[$this->uid]['tak'] === true;
  }

  public function toggle() {
    $this->config[$this->uid]['tak'] = !$this->config[$this->uid]['tak'];
  }

  public function save() {
    return rcmail::get_instance()->user->save_prefs(array('workspaces_personal_datas' => $this->config));
  }

  private static function _Config() {
    return rcmail::get_instance()->config->get('workspaces_personal_datas', []);
  }

  public static function From($uid) {
    return new FavoriteData($uid);
  } 

  public static function ToggleWsp($uid, $save = true) {
    $data = self::From($uid);
    $data->toggle();

    if ($save) $data->save();

    return $data;
  }
}

class WorkspaceSetting {
  private $_workspace;

  public function __construct(&$workspace) {
    $this->_workspace = $workspace;
  }

  public function get($key) {
    if ($this->_workspace->settings === null) return null;
    else return json_decode($this->_workspace->settings)->$key;
  }

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

class WorkspaceObject {
  private $_workspace;

  public function __construct(&$workspace) {
    $this->_workspace = $workspace;
  }

  public function get($key) {
    if ($this->_workspace->objects === null) return null;
    else return json_decode($this->_workspace->objects)->$key;
  }

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

  public function remove($key) {
    if ($this->_workspace->objects !== null)
    {
        $this->_workspace->objects = json_decode($this->_workspace->objects);

        if (isset($this->_workspace->objects->$key)) unset($this->_workspace->objects->$key);

        $this->_workspace->objects = json_encode($this->_workspace->objects);
    }

    return $this;
  }

  public function convertToEnabledGenerator($includeOnlyHave = false) {
    $objects = json_decode($this->_workspace->objects);

    foreach ($objects as $key => $value) {
      if (!$includeOnlyHave || ($includeOnlyHave && isset($value))) yield $key => isset($value);
    }
  }

  public function convertToEnabled($includeOnlyHave = false) {
    $return = [];
    $objects = json_decode($this->_workspace->objects);

    foreach ($objects as $key => $value) {
      if ($includeOnlyHave && isset($value)) $return[] = $key;
      else if (!$includeOnlyHave ) $return[$key] = isset($value);
    }

    return $return;
  }

  public function serialize() {
    return json_decode($this->_workspace->objects);
  }
}