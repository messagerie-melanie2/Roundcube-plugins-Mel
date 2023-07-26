<?php
$dir = __DIR__;
include_once 'ichat_module.php';
include_once $dir.'/../../program.php';
class ChatModule extends Program implements iChatModule {

    public const TASK = 'clavardage';
    public const ACTIONS = ['create_channel', 'add_user', 'get_user_info', 'get_channel_unread_count', 'get_joined', 'get_status', 'set_status', 'logout'];

    private $force_decoded = false;

    public function __construct($plugin = null) {
        parent::__construct(rcmail::get_instance(), ($plugin ?? rcmail::get_instance()->plugins->get_plugin('mel_metapage')));
    } 

    public function program_task() {
        $this->setup_task();

        return $this;
    }

    public function init() {
        $this->program_task()->setup_actions();
    }

    public function setup_actions() {
        if (self::TASK === $this->rc->task) {
            $actions = self::ACTIONS;

            for ($i=0, $len = count($actions); $i < $len; ++$i) { 
                $this->register_action($actions[$i], [$this, $actions[$i].'_action']);
            }
        }

        return $this;
    }

    public function setup_task() {
        if (self::TASK === $this->rc->task) {
            $this->plugin->register_task(self::TASK);
        }
    }

    public function ignore_encode_start() {
        $this->force_decoded = true;
    }

    public function ignore_encode_end() {
        $this->force_decoded = false;
    }

    public function create_channel_connector($room, ...$otherArgs){
        return $this->verifyReturn($this->call('chat.create_channel', $room, ...$otherArgs));
    }

    public function add_user_connector($user, $room, ...$otherArgs) {
        return $this->call('chat.add_user', $user, $room, ...$otherArgs);
    }

    public function get_user_info_connector($user, ...$otherArgs) {
        return $this->call('chat.get_user_info', $user, ...$otherArgs);
    }

    public function get_channel_unread_count_connector($room, ...$otherArgs) {
        return $this->call('chat.get_channel_unread_count', $room, ...$otherArgs);
    }

    public function get_joined_connector($user, ...$otherArgs) {
        return $this->call('chat.get_joined', $user, ...$otherArgs);
    }

    public function get_status_connector(...$otherArgs) {
        return $this->call('chat.get_status', ...$otherArgs);
    }

    public function set_status_connector($status, ...$otherArgs) {
        return $this->call('chat.set_status', $status, ...$otherArgs);
    }

    public function logout_connector(...$otherArgs) {
        return $this->call('chat.logout', ...$otherArgs);
    }

    public function post_message_connector($room_id, $text, $alias, $avatar = null, ...$otherArgs) {
        return $this->call('chat.post_message', $room_id, $text, $alias, $avatar, ...$otherArgs);
    }

    public function update_owner_connector($user, $channel_id, $private, $remove = false, ...$otherArgs) {
        return $this->call('chat.update_owner', $user, $channel_id, $private, $remove, ...$otherArgs);
    }
    
    public function kick_user_connector($channel_id, $user, $private, ...$otherArgs) {
        return $this->call('chat.kick_user', $channel_id, $user, $private, ...$otherArgs);
    }

    public function delete_channel_connector($channel_id, $private, ...$otherArgs) {
        return $this->call('chat.delete_channel', $channel_id, $private, ...$otherArgs);
    }

    public function update_channel_type_connector($channel_id, $private, ...$otherArgs) {
        return $this->call('chat.update_channel', $channel_id, $private, ...$otherArgs);
    }

    public function check_if_room_exist_connector($room_id, ...$otherArgs) {
        return $this->call('chat.check_if_room_exist', $room_id, ...$otherArgs);
    }

    public function check_if_room_exist_by_name_connector($room_name, ...$otherArgs) {
        return $this->call('chat.check_if_room_exist_by_name', $room_name, ...$otherArgs);
    }

    public function room_info_connector($room_name, ...$otherArgs){
        return $this->call('chat.room_info', $room_name, ...$otherArgs);
    }

    public function create_channel_action($args = null) {
        $this->exit_action([$this, 'create_channel_connector'], '_roomname', '_users', '_public');
    }

    public function add_user_action($args = null) {
        $this->exit_action([$this, 'add_user_action_connector'], '_users', '_channel', '_private');
    }

    public function get_user_info_action($args = null) {
        $this->exit_action([$this, 'get_user_info_action_connector'], '_users', '_channel', '_private');
    }

    public function get_channel_unread_count_action($args = null) {
        $this->exit_action([$this, 'get_channel_unread_count_connector'], '_channel');
    }

    public function get_joined_action($args = null) {
        $this->exit_action([$this, 'get_joined_connector'], '_user_id', '_moderator', '_mode');
    }

    public function get_status_action($args = null) {
        $this->exit_action([$this, 'get_status_connector']);
    }

    public function set_status_action($args = null) {
        $this->exit_action([$this, 'set_status_connector'], '_st', '_msg');
    }

    public function logout_action($args = null){
        $this->exit_action([$this, 'logout_connector']);
    }

    private function call($key, ...$args) {
        $datas = $this->trigger_hook($key, ['echo' => '', 'datas' => $args, 'encoded' => false]);

        if (true === $datas['encoded']) $datas = json_encode($datas['echo']);
        else $datas = $datas['echo'];

        return $datas;
    }

    private function exit_action($callback, ...$inputs) {
        $inputs = mel_helper::Enumerable($inputs)->select(function ($k, $v) {
            return rcube_utils::get_input_value($v, rcube_utils::INPUT_POST);
        })->toArray();

        echo call_user_func($callback, ...$inputs);
        exit;
    } 

    private function verifyReturn($datas) {
        if (is_a($datas, 'ChatApiResult', true)) return $datas;
        else throw new Exception("Les données d'objets retournés ne sont pas sous forme de classe ChatApiResult", 565);
        
    }

    public static function Start($plugin = null) {
        $module = new ChatModule($plugin);
        $module->init();
        return $module;
    }
}