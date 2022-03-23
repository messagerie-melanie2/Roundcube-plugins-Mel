<?php
require_once '../lib/mel/mel.php';
class Webconf extends Mel{
    private $key;
    private $ariane;
    private $wsp;
    
    public function __construct() {
        parent::__construct();
        $this->key = utils::get_input_value('_key', utils::INPUT_GET);
        $this->ariane = utils::get_input_value('_ariane', utils::INPUT_GET);
        $this->wsp = utils::get_input_value('_wsp', utils::INPUT_GET);
    }

    public function run(...$args)
    {
        //https://roundcube.ida.melanie2.i2/public/webconf/?_key=H8AU5QDX2NSK&_ariane=dev-du-bnum-1/group&
        //https://mel.din.developpement-durable.gouv.fr/lab-bnum/?_task=webconf&_key=H8AU5QDX2NSK&_ariane=dev-du-bnum-1/group&
        if ($this->isConnected())
            $this->redirect_to_rc('webconf', '', [
                '_key' => $this->key,
                '_ariane' => $this->ariane,
                '_wsp' => $this->wsp
            ]);
        else
            $this->redirect('https://webconf.numerique.gouv.fr/'.$this->key);
    }
}
Mel::addPlugin(new Webconf());
Mel::start();