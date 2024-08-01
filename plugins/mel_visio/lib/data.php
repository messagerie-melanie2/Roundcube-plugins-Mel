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
        if (!$this->room) $this->room = rcube_utils::get_input_value('_key', rcube_utils::INPUT_GET);

        return $this->room;
    }

    public function wsp() {
        if (!$this->wsp) $this->wsp = rcube_utils::get_input_value('_wsp', rcube_utils::INPUT_GET);

        return $this->wsp;
    }

    public function channel() {
        if (!$this->channel) $this->channel = rcube_utils::get_input_value('_channel', rcube_utils::INPUT_GET) ?? rcube_utils::get_input_value('_ariane', rcube_utils::INPUT_GET) ;

        return $this->channel;
    }

    public function password() {
        if (!$this->password) $this->password = rcube_utils::get_input_value('_pass', rcube_utils::INPUT_GET);

        return $this->password;
    }

    public function need_config() {
        if (!isset($this->need_config)) $this->need_config = rcube_utils::get_input_value('_need_config', rcube_utils::INPUT_GET) ?? false;

        return $this->need_config;
    }

    public function update_room($room) {
        $this->room = $room;
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