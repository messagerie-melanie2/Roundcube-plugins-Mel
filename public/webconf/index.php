<?php
require_once '../lib/mel/mel.php';
class Webconf extends AMel{
    private $key;
    private $ariane;
    private $wsp;
    private $pass;
    
    public function __construct() {
        parent::__construct();
        $this->key = $this->get_input('_key');
        $this->ariane = $this->get_input('_ariane');
        $this->wsp = $this->get_input('_wsp');
        $this->pass = $this->get_input('_pass');
    }

    public function run(...$args)
    {
        if ($this->isConnected())
        {
            $config = ['_key' => $this->key];

            if (!empty($this->ariane)) $config['_ariane'] = $this->ariane;
            if (!empty($this->wsp)) $config['_wsp'] = $this->wsp;
            if (!empty($this->pass)) $config['_pass'] = $this->pass;

            $this->redirect_to_rc('webconf', '', $config);
        }
        else {
            // Contrairement à redirect_to_rc(), cette redirection concatène
            // _key directement à la suite de l'URL de conférence externe
            // (segment de chemin, pas paramètre) : un urlencode() casserait
            // un identifiant légitime contenant "/", donc on valide plutôt
            // le format pour refuser tout ce qui permettrait de sortir de ce
            // segment (retour à la ligne, "..", changement de schéma/hôte...).
            if (!$this->is_safe_webconf_key($this->key)) {
                utils::log("Webconf - Invalid _key format");
                header('HTTP/1.0 400 Bad Request');
                exit;
            }
            $this->redirect($this->get_webconf_url().$this->key);
        }
    }

    private function is_safe_webconf_key($key)
    {
        return is_string($key) && $key !== '' && strpos($key, '..') === false && preg_match('/^[A-Za-z0-9_\-\.\/]+$/', $key) === 1;
    }

    private function get_webconf_url()
    {
        $config = $this->get_config('mel_metapage');
        return $config['web_conf'] . ($config['web_conf'][strlen($config['web_conf']) - 1]  === '/' ? '' : '/');
    }
}
AMel::addPlugin(new Webconf());
AMel::start();
