<?php
include_once __DIR__.'/../base/mel_metapage_plugin.php';
include_once __DIR__.'/../interfaces/ichat.php';

abstract class AChatPlugin extends AMelMetapagePlugin implements iChatHooks
{
    protected function register_module()
    {
        $this->register_task($this->plugin_task());
    }

    protected function plugin_task() {
        return Consts::TASK_CHAT;
    }

    protected abstract function must_load_config();

    protected function add_hooks() {
        parent::add_hooks();
        $this->add_hook(ConstChat::HOOK_INDEX, [$this, 'connector_index']);
        $this->add_hook(ConstChat::HOOK_CREATE_CHANNEL, [$this, 'connector_create_channel']);
        $this->add_hook(ConstChat::HOOK_ADD_USERS, [$this, 'connector_add_users']);
        $this->add_hook(ConstChat::HOOK_GET_USER_INFO, [$this, 'connector_get_user_info']);
        $this->add_hook(ConstChat::HOOK_GET_CHANNEL_UNREAD_COUNT, [$this, 'connector_get_channel_unread_count']);
        $this->add_hook(ConstChat::HOOK_KICK_USER, [$this, 'connector_kick_user']);
        $this->add_hook(ConstChat::HOOK_POST_MESSAGE, [$this, 'connector_post_message']);
        $this->add_hook(ConstChat::HOOK_ADVANCE_POST_MESSAGE, [$this, 'connector_advanced_post_message']);
        $this->add_hook(ConstChat::HOOK_UPDATE_OWNER, [$this, 'connector_update_owner']);
        $this->add_hook(ConstChat::HOOK_DELETE_CHANNEL, [$this, 'connector_delete_channel']);
        $this->add_hook(ConstChat::HOOK_UPDATE_CHANNEL_TYPE, [$this, 'connector_update_channel_type']);
        $this->add_hook(ConstChat::HOOK_GET_JOINED, [$this, 'connector_get_joined']);
        $this->add_hook(ConstChat::HOOK_GET_ALL_MODERATOR_JOINED, [$this, 'connector_get_all_moderator_joined']);
        $this->add_hook(ConstChat::HOOK_CHECK_IF_ROOM_EXIST, [$this, 'connector_check_if_room_exist']);
        $this->add_hook(ConstChat::HOOK_CHECK_IF_ROOM_EXIST_BY_NAME, [$this, 'connector_check_if_room_exist_by_name']);
        $this->add_hook(ConstChat::HOOK_ROOM_INFO, [$this, 'connector_room_info']);
        $this->add_hook(ConstChat::HOOK_LOGIN, [$this, 'connector_login']);
        $this->add_hook(ConstChat::HOOK_LOGOUT, [$this, 'connector_logout']);
    }
    
    protected abstract function init_plugin();
    
    public abstract function connector_index($args = []);
    public abstract function connector_create_channel($args);
    public abstract function connector_add_users($args);
    public abstract function connector_get_user_info($args);
    public abstract function connector_get_channel_unread_count($args);
    public abstract function connector_kick_user($args);
    public abstract function connector_post_message($args);
    public abstract function connector_advanced_post_message($args);
    public abstract function connector_update_owner($args);
    public abstract function connector_delete_channel($args);
    public abstract function connector_update_channel_type($args);
    public abstract function connector_get_joined($args);
    public abstract function connector_get_all_moderator_joined($args);
    public abstract function connector_check_if_room_exist($args);
    public abstract function connector_check_if_room_exist_by_name($args);
    public abstract function connector_room_info($args);
    public abstract function connector_login($args);
    public abstract function connector_logout($args);
    public abstract function login($args = []);
    public abstract function logout();
    public abstract function create_channel($room_name, $users, $is_public);
    public abstract function add_users($users, $channel_id, $private, ...$miscs);
    public abstract function get_user_info($user);
    public abstract function get_channel_unread_count($channel);
    public abstract function kick_user($channel_id, $user, $private, ...$miscs);
    public abstract function post_message($room_id, $text);
    public abstract function advanced_post_message($room_id, $text, $alias, $avatar = null);
    public abstract function update_owner($user, $channel_id, $private, $remove = false);
    public abstract function delete_channel($channel_id, $private);
    public abstract function update_channel_type($channel_id, $private);
    public abstract function get_joined();
    public abstract function get_all_moderator_joined($user = null);
    public abstract function check_if_room_exist($room_id);
    public abstract function check_if_room_exist_by_name($room_name);
    public abstract function room_info($room_name);
}