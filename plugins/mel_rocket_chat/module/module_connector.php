<?php 
include_once __DIR__.'/../../mel_metapage/program/program.php';
include_once __DIR__.'/../../mel_metapage/program/modules/chat/ichat_module.php';
include_once __DIR__.'/../../mel_metapage/program/modules/chat/chat_module.php';

class ChatModuleConnector extends Program implements iChatClient {

    public const NOT_ACTIONS = ['post_message', 'update_owner', 'kick_user', 'delete_channel', 'update_channel_type', 
                                     'check_if_room_exist', 'check_if_room_exist_by_name', 'room_info'];

    private $is_setup;

    public function __construct($plugin = null) {
        parent::__construct(rcmail::get_instance(), ($plugin ?? rcmail::get_instance()->plugins->get_plugin('rocket_chat')));
        $this->is_setup = false;
        $this->init();
    } 

    public function program_task() {}
    public function init() {
        $this->setup_hooks();
    }

    public function setup_hooks($force = false) {
        if ((ChatModule::TASK === $this->rc->task || $force) && !$this->is_setup) {
            $hooks = array_merge(ChatModule::ACTIONS, self::NOT_ACTIONS);
            for ($i=0, $len=count($hooks); $i < $len; ++$i) { 
                $hook = $hooks[$i];
                $this->add_hook('chat.'.$hook, [$this, $hook.'_action']);
            }
            $this->is_setup = true;
        }
    }

    public function create_channel_action($args = null)
    {
        return $this->execute_connector($args, __METHOD__);
    }

    public function add_user_action($args = null){
        return $this->execute_connector($args, __METHOD__);
    }

    public function get_user_info_action($args = null) {
        return $this->execute_connector($args, __METHOD__);
    }

    public function get_channel_unread_count_action($args = null){
        return $this->execute_connector($args, __METHOD__);
    }

    public function get_joined_action($args = null) {
        return $this->execute_connector($args, __METHOD__);
    }

    public function get_status_action($args = null) {
        return $this->execute_connector($args, __METHOD__);
    }

    public function set_status_action($args = null){
        return $this->execute_connector($args, __METHOD__);
    }

    public function logout_action($args = null) {
        return $this->execute_connector($args, __METHOD__);
    }

    public function post_message_action($args = null) {
        $args['encoded'] = false;
        return $this->execute_connector($args, __METHOD__);
    }

    public function update_owner_action($args = null) {
        $args['encoded'] = false;
        return $this->execute_connector($args, __METHOD__);
    }

    public function kick_user_action($args = null) {
        $args['encoded'] = false;
        return $this->execute_connector($args, __METHOD__);
    }

    public function delete_channel_action($args = null) {
        $args['encoded'] = false;
        return $this->execute_connector($args, __METHOD__);
    }

    public function update_channel_type_action($args = null) {
        $args['encoded'] = false;
        return $this->execute_connector($args, __METHOD__);
    }

    public function check_if_room_exist_action($args = null) {
        $args['encoded'] = false;
        return $this->execute_connector($args, __METHOD__);
    }

    public function check_if_room_exist_by_name_action($args = null) {
        $args['encoded'] = false;
        return $this->execute_connector($args, __METHOD__);
    }

    public function room_info_action($args = null) {
        return $this->execute_connector($args, __METHOD__);
    }


    public function create_channel_connector($room, ...$otherArgs) {
        [$users, $public] = $otherArgs;

        return $this->plugin->_create_channel($room, $users, $public);
    }

    public function add_user_connector($user, $room, ...$otherArgs){
        return $this->plugin->add_users($room, $user, $this->input_to_bool($otherArgs[0]));
        //$otherArgs[0] => public ou non
    }

    public function get_user_info_connector($user, ...$otherArgs) {
        return $this->plugin->getUserInfos($user);
    }

    public function get_channel_unread_count_connector($room, ...$otherArgs){
        return $this->plugin->_get_channel_unread_count($room);
    }

    public function get_joined_connector($user, ...$otherArgs) {
        [$modo_only, $mode] = $otherArgs;
        return $this->plugin->_get_joined_action($user, $modo_only, $mode);
    }

    public function get_status_connector(...$otherArgs) {
        return $this->plugin->_get_status();
    }

    public function set_status_connector($status, ...$otherArgs) {
        return $this->plugin->_set_status($status, $otherArgs[0]);
    }
    public function logout_connector(...$otherArgs){
        $this->plugin->logout();
        return '';
    }

    public function post_message_connector($room_id, $text, $alias, $avatar = null, ...$otherArgs) {
        return $this->plugin->post_message($room_id, $text, $alias, $avatar);
    }

    public function update_owner_connector($user, $channel_id, $private, $remove = false, ...$otherArgs){
        return $this->plugin->update_owner($user, $channel_id, $private, $remove);
    }

    public function kick_user_connector($channel_id, $user, $private, ...$otherArgs) {
        return $this->plugin->kick_user($channel_id, $user, $private);
    }

    public function delete_channel_connector($channel_id, $private, ...$otherArgs) {
        return $this->plugin->delete_channel($channel_id, $private);
    }

    public function update_channel_type_connector($channel_id, $private, ...$otherArgs) {
        return $this->plugin->update_channel_type($channel_id, $private);
    }

    public function check_if_room_exist_connector($room_id, ...$otherArgs){
        return $this->plugin->check_if_room_exist($room_id);
    }

    public function check_if_room_exist_by_name_connector($room_name, ...$otherArgs) {
        return $this->plugin->check_if_room_exist_by_name($room_name);
    }

    public function room_info_connector($room_name, ...$otherArgs) {
        return $this->plugin->room_info($room_name);
    }

    private function execute_connector($hook_args, $connector) {
        $connector = str_replace('_action', '_connector', $connector);
        $connector = explode('::', $connector)[1];
        $hook_args['echo'] = call_user_func([$this, $connector], ...$hook_args['datas']);
        return $hook_args;
    }
}