<?php
include_once __DIR__."/../program.php";

class Webconf extends Program
{
    private $tmp_key;

    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin);
    }  

    public function init()
    {
        $this->register_action("index", [$this, "index"]);
        if ($this->action === "" || $this->action === "index")
        {
            $this->include_js("webconf.js");
            $this->include_css("webconf.css");
        }
    }

    public function index()
    {
        $key = $this->get_input("_key") ?? "A5LMKJPOIUI9POI4KL";
        if ($key === null)
            $key = $this->generate_key();
        $this->tmp_key = $key;
        $this->set_env_var("webconf.key", $key);
        $this->set_env_var("webconf.base_url", $this->webconf_base_url());
        $wsp = $this->get_input("_wsp") ?? "webconf-1";
        $ariane = null;
        if ($wsp === null)
        {
            $ariane = $this->get_input("_ariane");
            $this->set_env_var("webconf.ariane", $ariane);
        }
        else
        {
            $workspace = $this->workspace($wsp);
            $wsp = [
            "objects" => json_decode($workspace->objects), 
            "datas" => ["logo" => $workspace->logo,"ispublic" => $workspace->ispublic, 'uid' => $wsp, "allow_ariane" => $workspace->ispublic || mel_workspace::is_in_workspace($workspace)
                ,"title" => $workspace->title,
                "color" => json_decode($workspace->settings)->color
                ]
            ];
            $this->set_env_var("webconf.wsp", $wsp);
        }
        $user = driver_mel::gi()->getUser();
        $this->set_env_var("webconf.user_datas", [
            "name" => $user->fullname,
            "email" => $user->email
        ]);
        $this->set_env_var("webconf.bar", $this->parse("webconf_bar"));
        $this->add_handler("roomkey", [$this, "get_key"]);
        $this->add_handler("selectrooms", [$this, "get_ariane_rooms"]);
        $this->send("webconf");
    }

    public function get_key()
    {
        return $this->tmp_key;
    }

    public function get_ariane_rooms()
    {
        return "";
    }

    private function generate_key($size = null)
    {
        if ($size === null)
            $size = rand(10 , 20);
        $type = rand(0 , 3);
        $key = "";
        for ($i=0; $i < $size; ++$i) { 
            switch ($type) {
                case 0:
                    if ($i === 1 || $i == 3 || $i == 6)
                        $key.= rand(0,9);
                    else
                        $key.= chr(rand(65, 90));
                    break;
                case 1:
                    if ($i === 2 || $i == 4 || $i == 7)
                        $key.= rand(0,9);
                    else
                        $key.= chr(rand(65, 90));
                    break;
                case 2:
                    if ($i === 1 || $i == 4 || $i == 8)
                        $key.= rand(0,9);
                    else
                        $key.= chr(rand(65, 90));
                    break;
                default:
                if ($i === 2 || $i == 5 || $i == 9)
                    $key.= rand(0,9);
                else
                    $key.= chr(rand(65, 90));
                break;
            } 

        } 
        return $key;
    }

    private function workspace($uid)
    {
        return mel_workspace::get_workspace($uid);
    }

    private function webconf_base_url()
    {
        return $this->get_config("web_conf");
    }


}