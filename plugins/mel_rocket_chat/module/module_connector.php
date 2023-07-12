<?php 
include_once __DIR__.'/../../mel_metapage/program/program.php';
include_once __DIR__.'/../../mel_metapage/program/modules/chat/ichat_module.php';
include_once __DIR__.'/../../mel_metapage/program/modules/chat/chat_module.php';

class ChatModuleConnector extends Program implements iChatClient {

    public const NOT_ACTIONS = ['post_message', 'update_owner', 'kick_user', 'delete_channel', 'update_channel_type', 
                                     'check_if_room_exist', 'check_if_room_exist_by_name', 'room_info'];

    public function __construct($plugin = null) {
        parent::__construct(rcmail::get_instance(), ($plugin ?? rcmail::get_instance()->plugins->get_plugin('rocket_chat')));
        $this->init();
    } 

    public function program_task() {}
    public function init() {
        $this->setup_hooks();
    }

    public function setup_hooks() {
        if ('chat' === $this->rc->task) {
            $hooks = array_merge(ChatModule::ACTIONS, self::NOT_ACTIONS);
            for ($i=0, $len=count($hooks); $i < $len; ++$i) { 
                $hook = $hooks[$i];
                $this->add_hook('mel.'.$hook, [$this, $hook.'_action']);
            }
        }
    }

    public function create_channel_action($args)
    {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function add_user_action($args){
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function get_user_info_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function get_channel_unread_count_action($args){
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function get_joined_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function get_status_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function set_status_action($args){
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function logout_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function post_message_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function update_owner_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function kick_user_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function delete_channel_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function update_channel_type_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function check_if_room_exist_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function check_if_room_exist_by_name_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
    }

    public function room_info_action($args) {
        return $this->execute_connector($args, var_dump(__FUNCTION__));
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

    public function post_message_connector($room_id, $text, $alias, $avatar = null, ...$otherArgs);
    public function update_owner_connector($user, $channel_id, $private, $remove = false, ...$otherArgs);
    public function kick_user_connector($channel_id, $user, $private, ...$otherArgs);
    public function delete_channel_connector($channel_id, $private, ...$otherArgs);
    public function update_channel_type_connector($channel_id, $private, ...$otherArgs);
    public function check_if_room_exist_connector($room_id, ...$otherArgs);
    public function check_if_room_exist_by_name_connector($room_name, ...$otherArgs);
    public function room_info_connector($room_name, ...$otherArgs);

    private function execute_connector($hook_args, $connector) {
        $connector = str_replace('_action', '_connector', $connector);
        $hook_args['echo'] = call_user_func([$this, $connector], ...$args['datas']);
        return $hook_args;
    }
}