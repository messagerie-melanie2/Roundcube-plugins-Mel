<?php 
include_once __DIR__."/../program.php";
class MetricsConfigData extends Program {
    public $url;
    public $token;
    public $send_interval;

    public function __construct($plugin = null) {
        parent::__construct(rcmail::get_instance(), $plugin ?? rcmail::get_instance()->plugins->get_plugin('mel_metapage'));
        $this->init();
    }

    public function program_task() {}

    public function init() {
        $this->url = $this->get_config('metrics_url');
        $this->token = $this->get_config('metrics_token');
        $this->send_interval = $this->get_config('metrics_send_interval', 60);
    }

    public function send_to_env() {
        $this->set_env_var('mel_metrics_url', $this->url);
        $this->set_env_var('mel_metrics_token', $this->token);
        $this->set_env_var('mel_metrics_send_interval', $this->send_interval);
    }
}