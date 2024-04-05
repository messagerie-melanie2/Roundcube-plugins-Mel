<?php
class VisioParams
{
    private $room;
    private $wsp;
    private $channel;
    private $password;
    private $need_config;

    public function __construct() {}

    public function room() {
        if (!$room) $room = rcube_utils::get_input_value('_key', rcube_utils::INPUT_GET);

        return $room;
    }

    public function wsp() {
        if (!$wsp) $wsp = rcube_utils::get_input_value('_wsp', rcube_utils::INPUT_GET);

        return $wsp;
    }

    public function channel() {
        if (!$channel) $channel = rcube_utils::get_input_value('_channel', rcube_utils::INPUT_GET) ?? rcube_utils::get_input_value('_ariane', rcube_utils::INPUT_GET) ;

        return $channel;
    }

    public function password() {
        if (!$password) $password = rcube_utils::get_input_value('_pass', rcube_utils::INPUT_GET);

        return $password;
    }

    public function need_config() {
        if (!isset($password)) $need_config = rcube_utils::get_input_value('_need_config', rcube_utils::INPUT_GET) ?? false;

        return $need_config;
    }

    public function has_room() {
        return !!$this->room();
    }

    public function serialize() {
        return [
            'room' => $this->room(),
            'wsp' => $this->wsp(),
            'channel' => $this->channel(),
            'password' => $this->password(),
            'need_config' => $this->need_config()
        ];
    }


}