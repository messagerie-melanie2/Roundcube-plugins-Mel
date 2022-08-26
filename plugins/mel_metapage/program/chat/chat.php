<?php
include_once __DIR__.'/../consts/chat.php';
include_once __DIR__.'/../interfaces/ichat.php';
include_once __DIR__.'/../program.php';

class Chat extends Program implements iChatActions
{
    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin);
    }  

    public function init()
    {
        $this->register_module();
        $this->register_action(ConstChat::ACTION_INDEX, array(
            $this,
            ConstChat::FUNCTION_INDEX
        ));
        $this->register_action(ConstChat::ACTION_CREATE_CHANNEL, array(
            $this,
            ConstChat::FUNCTION_CREATE_CHANNEL
          ));
          $this->register_action(ConstChat::ACTION_ADD_USERS, array(
            $this,
            ConstChat::FUNCTION_ADD_USERS
          ));
          $this->register_action(ConstChat::ACTION_GET_USER_INFO, array(
            $this,
            ConstChat::FUNCTION_GET_USER_INFO
          ));
          $this->register_action(ConstChat::ACTION_GET_CHANNEL_UNREAD_COUNT, array(
            $this,
            ConstChat::FUNCTION_GET_CHANNEL_UNREAD_COUNT
          ));
          $this->register_action(ConstChat::ACTION_LOGIN, array(
            $this,
            ConstChat::FUNCTION_LOGIN
          ));
          $this->register_action(ConstChat::ACTION_LOGOUT, array(
            $this,
            ConstChat::FUNCTION_LOGOUT
          ));  
          $this->register_action(ConstChat::ACTION_GET_JOINED, array(
            $this,
            ConstChat::FUNCTION_GET_JOINED
          )); 
    }

    function program_task()
    {
        return ConstChat::TASK_NAME;
    }

    protected function _get_args($args)
    {
        return $args[ConstChat::RETURN] ?? $args;
    }

    function page_index($args = [])
    {
        $args = $this->trigger_hook(ConstChat::HOOK_INDEX, $args);
        return $args;
    }

    function get_log($args = [])
    {
        $array = $this->login();
        echo json_encode($array);
        exit;
    }

    function create_chanel_action($args = [])
    {
        $room_name = rcube_utils::get_input_value('_roomname', rcube_utils::INPUT_POST);
        $users = rcube_utils::get_input_value('_users', rcube_utils::INPUT_POST);
        $is_public = rcube_utils::get_input_value('_public', rcube_utils::INPUT_POST);

        if ($is_public === "false")
            $is_public = false;
        else
            $is_public = true;

        $result = $this->create_channel($room_name, $users, $is_public);

        echo json_encode($result);

        exit;
    }

    function get_channel_unread_count_action($args = [])
    {
        $channel = rcube_utils::get_input_value('_channel', rcube_utils::INPUT_POST);

        $results = $this->get_channel_unread_count($channel);
  
        echo json_encode($results);
  
        exit;
    }

    function get_user_info_action($args = [])
    {
        $username = rcube_utils::get_input_value('_user', rcube_utils::INPUT_POST);

        echo json_encode($this->get_user_info($username));
  
        exit;
    }

    function add_users_action($args = [])
    {
        $users = rcube_utils::get_input_value('_users', rcube_utils::INPUT_POST);
        $channel_id = rcube_utils::get_input_value('_channel', rcube_utils::INPUT_POST);
        $private = rcube_utils::get_input_value('_private', rcube_utils::INPUT_POST);
  
        $results = $this->add_users($users, $channel_id, $private);
  
        echo json_encode($results);
        exit;
    }

    function get_joined_action($args = [])
    {
      $user_id = rcube_utils::get_input_value('_user_id', rcube_utils::INPUT_POST) ?? driver_mel::gi()->getUser()->uid;
      $moderator_only = rcube_utils::get_input_value('_moderator', rcube_utils::INPUT_POST) ?? false;
      $mode = rcube_utils::get_input_value('_mode', rcube_utils::INPUT_POST) ?? 0;
      $mode = (int) $mode;

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

      echo $list;
      exit;
    }

    function login($args = [])
    {
        $args = $this->trigger_hook(ConstChat::HOOK_LOGIN, $args);
        return $this->_get_args($args);
    }

    function logout()
    {
        $args = $this->trigger_hook(ConstChat::HOOK_LOGOUT, $args);
        return $args;
    }

    function create_channel($room_name, $users, $is_public, ...$miscs)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_CREATE_CHANNEL, [
            ConstChat::ARG_ROOM_NAME => $room_name,
            ConstChat::ARG_USER => $users,
            ConstChat::ARG_IS_PUBLIC => $is_public,
            ConstChat::ARG_MISCELLANEOUS => $miscs
        ]);
        return $this->_get_args($args);
    }

    function add_users($users, $channel_id, $private, ...$miscs)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_ADD_USERS, [
            ConstChat::ARG_CHANNEL_ID => $channel_id,
            ConstChat::ARG_USER => $users,
            ConstChat::ARG_PRIVATE => $private,
            ConstChat::ARG_MISCELLANEOUS => $miscs
        ]);
        return $this->_get_args($args);
    }

    function get_user_info($user) {
        $args = $this->trigger_hook(ConstChat::HOOK_GET_USER_INFO, [
            ConstChat::ARG_USER => $user
        ]);
        return $this->_get_args($args);
    }

    function get_channel_unread_count($channel)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_GET_CHANNEL_UNREAD_COUNT, [
            ConstChat::ARG_CHANNEL => $channel
        ]);
        return $this->_get_args($args);
    }

    function kick_user($channel_id, $user, $private, ...$miscs) //
    {
        $args = $this->trigger_hook(ConstChat::HOOK_KICK_USER, [
            ConstChat::ARG_CHANNEL_ID => $channel_id,
            ConstChat::ARG_USER => $user,
            ConstChat::ARG_PRIVATE => $private,
            ConstChat::ARG_MISCELLANEOUS => $miscs
        ]);

        return $this->_get_args($args);
    }

    function post_message($room_id, $text)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_POST_MESSAGE, [
            ConstChat::ARG_CHANNEL_ID => $room_id,
            ConstChat::ARG_STRING => $text
        ]);

        return $this->_get_args($args);
    }

    function advanced_post_message($room_id, $text, $alias, $avatar = null)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_ADVANCE_POST_MESSAGE, [
            ConstChat::ARG_CHANNEL_ID => $room_id,
            ConstChat::ARG_STRING => $text,
            ConstChat::ARG_ALIAS => $alias,
            ConstChat::ARG_AVATAR => $avatar
        ]);

        return $this->_get_args($args);
    }

    function update_owner($user, $channel_id, $private, $remove = false)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_UPDATE_OWNER, [
            ConstChat::ARG_USER => $user,
            ConstChat::ARG_CHANNEL_ID => $channel_id,
            ConstChat::ARG_PRIVATE => $private,
            ConstChat::ARG_REMOVE => $remove
        ]);

        return $this->_get_args($args);
    }

    function delete_channel($channel_id, $private)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_DELETE_CHANNEL, [
            ConstChat::ARG_CHANNEL_ID => $channel_id,
            ConstChat::ARG_PRIVATE => $private
        ]);

        return $this->_get_args($args);
    }

    function update_channel_type($channel_id, $private)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_UPDATE_CHANNEL_TYPE, [
            ConstChat::ARG_CHANNEL_ID => $channel_id,
            ConstChat::ARG_PRIVATE => $private
        ]);

        return $this->_get_args($args);
    }

    function get_joined()
    {
        $args = $this->trigger_hook(ConstChat::HOOK_GET_JOINED);

        return $this->_get_args($args);
    }

    function get_all_moderator_joined($user = null)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_GET_ALL_MODERATOR_JOINED, [
            ConstChat::ARG_USER => $user,
        ]);

        return $this->_get_args($args);
    }

    function check_if_room_exist($room_id)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_CHECK_IF_ROOM_EXIST, [
            ConstChat::ARG_CHANNEL_ID => $channel_id
        ]);

        return $this->_get_args($args);
    }

    function check_if_room_exist_by_name($room_name)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_CHECK_IF_ROOM_EXIST_BY_NAME, [
            ConstChat::ARG_ROOM_NAME => $room_name
        ]);

        return $this->_get_args($args);
    }

    function room_info($room_name)
    {
        $args = $this->trigger_hook(ConstChat::HOOK_ROOM_INFO, [
            ConstChat::ARG_ROOM_NAME => $room_name
        ]);

        return $this->_get_args($args);
    }

    function have_plugin($arg = false)
    {
        $arg = $this->trigger_hook(ConstChat::HOOK_HAVE_PLUGIN, $arg);
        return $arg;
    }

    function register_module($args = [])
    {
        $arg = $this->trigger_hook('chat.register_module', $args);
        return $arg;
    }

}


Program::add_class_to_load('Chat');