<?php
require_once '../lib/mel/mel.php';
class Webconf extends AMel{
    private $key;
    private $ariane;
    private $wsp;
    
    public function __construct() {
        parent::__construct();
        $this->key = $this->get_input('_key');
        $this->ariane = $this->get_input('_ariane');
        $this->wsp = $this->get_input('_wsp');
    }

    public function run(...$args)
    {
        if ($this->isConnected())
        {
            $config = ['_key' => $this->key];

            if (!empty($this->ariane)) $config['_ariane'] = $this->ariane;
            if (!empty($this->wsp)) $config['_wsp'] = $this->wsp;

            $this->redirect_to_rc('webconf', '', $config);
        }
        else $this->redirect($this->get_webconf_url().$this->key);
    }

    private function get_webconf_url()
    {
        $config = $this->get_config('mel_metapage');
        return $config['web_conf'] . ($config['web_conf'][strlen($config['web_conf']) - 1]  === '/' ? '' : '/');
    }
}
AMel::addPlugin(new Webconf());
AMel::start();
