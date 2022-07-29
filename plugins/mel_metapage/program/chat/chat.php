<?php
include_once __DIR__."/../interfaces/ichat.php";
include_once __DIR__."/../program.php";

class Chat extends Program implements iChatBnum
{
    public const ACTION_INDEX = 'index';
    public const ACTION_CREATE_CHANNEL = 'create_chanel';
    public const ACTION_ADD_USERS = 'add_users';
    public const ACTION_GET_USER_INFO = 'get_user_info';
    public const ACTION_GET_CHANNEL_UNREAD_COUNT = 'get_channel_unread_count';
    public const ACTION_LOGIN = 'login';
    public const ACTION_LOGOUT = 'logout';

    public const FUNCTION_INDEX = 'action';
    public const FUNCTION_CREATE_CHANNEL = self::ACTION_CREATE_CHANNEL.'_action';
    public const FUNCTION_ADD_USERS = self::ACTION_ADD_USERS.'_action';
    public const FUNCTION_GET_USER_INFO = self::ACTION_GET_USER_INFO.'_action';
    public const FUNCTION_GET_CHANNEL_UNREAD_COUNT = self::ACTION_GET_CHANNEL_UNREAD_COUNT.'_action';
    public const FUNCTION_LOGIN = 'get_log';
    public const FUNCTION_LOGOUT = self::ACTION_LOGOUT;

    public const HOOK_NAMESPACE = 'chat';
    public const HOOK_NAMESPACE_SPERATOR = '.';
    public const HOOK_INDEX = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_INDEX;
    public const HOOK_LOGIN = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_LOGIN;
    public const HOOK_LOGOUT =  self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::FUNCTION_LOGOUT;
    public const HOOK_CREATE_CHANNEL = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_CREATE_CHANNEL;
    public const HOOK_ADD_USERS = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_ADD_USERS;
    public const HOOK_GET_USER_INFO = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_GET_USER_INFO;
    public const HOOK_GET_CHANNEL_UNREAD_COUNT = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_GET_CHANNEL_UNREAD_COUNT;
    public const HOOK_KICK_USER = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'kick_user';

    public const ARG_CHANNEL_ID = 'channel_id';
    public const ARG_CHANNEL = 'channel';
    public const ARG_USER = 'user';
    public const ARG_PRIVATE = 'private';
    public const ARG_IS_PUBLIC = 'is_public';
    public const ARG_MISCELLANEOUS = 'miscs';
    public const ARG_ROOM_NAME = 'room_name';

    public const RETURN = 'return_value';

    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin);
    }  

    public function init()
    {
        $this->register_action(self::ACTION_INDEX, array(
            $this,
            self::FUNCTION_INDEX
        ));
        $this->register_action(self::ACTION_CREATE_CHANNEL, array(
            $this,
            self::FUNCTION_CREATE_CHANNEL
          ));
          $this->register_action(self::ACTION_ADD_USERS, array(
            $this,
            self::FUNCTION_ADD_USERS
          ));
          $this->register_action(self::ACTION_GET_USER_INFO, array(
            $this,
            self::FUNCTION_GET_USER_INFO
          ));
          $this->register_action(self::ACTION_GET_CHANNEL_UNREAD_COUNT, array(
            $this,
            self::FUNCTION_GET_CHANNEL_UNREAD_COUNT
          ));
          $this->register_action(self::ACTION_LOGIN, array(
            $this,
            self::FUNCTION_LOGIN
          ));
          $this->register_action(self::ACTION_LOGOUT, array(
            $this,
            self::FUNCTION_LOGOUT
          ));  
    }

    protected function _get_args($args)
    {
        return $args[self::RETURN] ?? $args;
    }

    function action($args = [])
    {
        $args = $this->trigger_hook(self::HOOK_INDEX, $args);
        return $args;
    }

    function get_log($args = [])
    {
        return $this->login();
    }

    function login()
    {
        $args = $this->trigger_hook(self::HOOK_LOGIN, $args);
        return $args;
    }

    function logout($args = [])
    {
        $args = $this->trigger_hook(self::HOOK_LOGOUT, $args);
        return $args;
    }

    function create_channel($room_name, $users, $is_public, ...$miscs)
    {
        $args = $this->trigger_hook(self::HOOK_CREATE_CHANNEL, [
            self::ARG_ROOM_NAME => $room_name,
            self::ARG_USER => $user,
            self::ARG_IS_PUBLIC => $is_public,
            self::ARG_MISCELLANEOUS => $miscs
        ]);
        return $this->_get_args($args);
    }

    function add_users($users, $channel_id, $private, ...$miscs)
    {
        $args = $this->trigger_hook(self::HOOK_ADD_USERS, [
            self::ARG_CHANNEL_ID => $channel_id,
            self::ARG_USER => $user,
            self::ARG_PRIVATE => $private,
            self::ARG_MISCELLANEOUS => $miscs
        ]);
        return $this->_get_args($args);
    }

    function get_user_info($user) {
        $args = $this->trigger_hook(self::HOOK_GET_USER_INFO, [
            self::ARG_USER => $user
        ]);
        return $this->_get_args($args);
    }

    function get_channel_unread_count($channel)
    {
        $args = $this->trigger_hook(self::HOOK_GET_CHANNEL_UNREAD_COUNT, [
            self::ARG_CHANNEL => $channel
        ]);
        return $this->_get_args($args);
    }

    function kick_user($channel_id, $user, $private, ...$miscs)
    {
        $args = $this->trigger_hook(self::HOOK_KICK_USER, [
            self::ARG_CHANNEL_ID => $channel_id,
            self::ARG_USER => $user,
            self::ARG_PRIVATE => $private,
            self::ARG_MISCELLANEOUS => $miscs
        ]);

        return $this->_get_args($args);
    }

    function have_chat_plugin($arg = false)
    {
        $argg = $this->trigger_hook('chat.have_chat_plugin', $arg);
        return $arg;
    }

}


Program::add_class_to_load('Chat');