<?php
include_once __DIR__.'/../base/mel_metapage_plugin.php';
include_once __DIR__.'/../interfaces/ichat.php';

abstract class AChatPlugin extends AMelMetapagePlugin implements iChat
{
    protected function register_plugin_task()
    {
        $this->register_task($this->plugin_task());
    }

    protected function plugin_task() {
        return Consts::TASK_CHAT;
    }

    protected abstract function must_load_config();

    protected function add_hooks() {
        parent::add_hooks();
        $this->add_hook(ConstChat::HOOK_INDEX, [$this, 'page_index']);
        $this->add_hook(ConstChat::HOOK_CREATE_CHANNEL, [$this, 'connector_create_channel']);
        $this->add_hook(ConstChat::HOOK_ADD_USERS, [$this, 'connector_add_users']);
        $this->add_hook(ConstChat::HOOK_GET_USER_INFO, [$this, 'connector_get_user_info']);
        $this->add_hook(ConstChat::HOOK_GET_CHANNEL_UNREAD_COUNT, [$this, 'connector_get_channel_unread_count']);
        $this->add_hool(ConstChat::HOOK_KICK_USER, [$this, 'connector_kick_user']);
        $this->add_hook(ConstChat::HOOK_LOGIN, [$this, ConstChat::ACTION_LOGIN]);
        $this->add_hook(ConstChat::HOOK_LOGOUT, [$this, ConstChat::ACTION_LOGOUT]);
    }

    public abstract function page_index($args = []);
    public abstract function login($args = []);
    public abstract function logout();
}