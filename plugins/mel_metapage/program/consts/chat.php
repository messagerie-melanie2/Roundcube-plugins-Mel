<?php
include_once 'consts.php';
abstract class ConstChat 
{
    public const TASK_NAME = 'chat';

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

    public const HOOK_NAMESPACE = self::TASK_NAME;
    public const HOOK_NAMESPACE_SPERATOR = Consts::HOOK_NAMESPACE_SPERATOR;
    public const HOOK_INDEX = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_INDEX;
    public const HOOK_LOGIN = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_LOGIN;
    public const HOOK_LOGOUT =  self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::FUNCTION_LOGOUT;
    public const HOOK_CREATE_CHANNEL = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_CREATE_CHANNEL;
    public const HOOK_ADD_USERS = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_ADD_USERS;
    public const HOOK_GET_USER_INFO = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_GET_USER_INFO;
    public const HOOK_GET_CHANNEL_UNREAD_COUNT = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.self::ACTION_GET_CHANNEL_UNREAD_COUNT;
    public const HOOK_KICK_USER = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'kick_user';
    public const HOOK_POST_MESSAGE = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'post_message';
    public const HOOK_ADVANCE_POST_MESSAGE = self::HOOK_POST_MESSAGE.self::HOOK_NAMESPACE_SPERATOR.'advanced';
    public const HOOK_UPDATE_OWNER = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'update_owner';
    public const HOOK_DELETE_CHANNEL = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'delete_channel';
    public const HOOK_UPDATE_CHANNEL_TYPE =  self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'update_channel'.self::HOOK_NAMESPACE_SPERATOR.'type';
    public const HOOK_GET_JOINED = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'get_joined';
    public const HOOK_GET_ALL_MODERATOR_JOINED = self::HOOK_GET_JOINED.self::HOOK_NAMESPACE_SPERATOR.'moderator';
    public const HOOK_CHECK_IF_ROOM_EXIST = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'check_if_room_exist';
    public const HOOK_CHECK_IF_ROOM_EXIST_BY_NAME = self::HOOK_CHECK_IF_ROOM_EXIST.self::HOOK_NAMESPACE_SPERATOR.'name';
    public const HOOK_ROOM_INFO = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.'room_info';
    public const HOOK_HAVE_PLUGIN = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.Consts::HOOK_HAVE_PLUGIN;

    public const ARG_CHANNEL_ID = 'channel_id';
    public const ARG_CHANNEL = 'channel';
    public const ARG_USER = 'user';
    public const ARG_PRIVATE = 'private';
    public const ARG_IS_PUBLIC = 'is_public';
    public const ARG_MISCELLANEOUS = 'miscs';
    public const ARG_ROOM_NAME = 'room_name';
    public const ARG_STRING = 'text';
    public const ARG_ALIAS = 'alias';
    public const ARG_AVATAR = 'avatar';
    public const ARG_REMOVE = 'remove';

    public const RETURN = Consts::RETURN;
}