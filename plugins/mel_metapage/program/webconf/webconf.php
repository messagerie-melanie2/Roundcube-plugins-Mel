<?php
use \Firebase\JWT\JWT;
require_once __DIR__ . '/vendor/autoload.php';
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
        $this->register_action("jwt", [$this, "get_jwt"]);
        if ($this->action === "" || $this->action === "index")
        {
            $this->include_js("../../../rocket_chat/favico.js");
            $this->include_js("../../../rocket_chat/rocket_chat.js");
            $this->include_js("webconf.js");
            $this->include_css("webconf.css");
        }
    }

    public function index()
    {
        $key = $this->get_input("_key") ?? $this->generate_key();// ?? "B5LMKJPOIUI9POI4KL";
        $this->tmp_key = $key;
        $this->set_env_var("webconf.key", $key);
        $wsp = $this->get_input("_wsp");// ?? "webconf-1";
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
        if (($wsp === null && $ariane === null) || $key === "")
        {
            $this->add_handler("roomkey", [$this, "get_key"]);
            $this->add_handler("selectrooms", [$this, "get_ariane_rooms"]);
            $this->add_handler("selectwsp", [$this, "get_all_workspaces"]);
        }
        $this->rc->output->set_pagetitle("Visioconférence");
        $this->send("webconf");
    }

    public function get_key()
    {
        return $this->tmp_key;
    }

    public function get_all_workspaces()
    {
        $replace = "¤¤¤¤¤¤¤¤";

        $plugin = $this->get_plugin("mel_workspace");
        $plugin->load_workspaces();
        $workspaces = $plugin->workspaces;
        $html = '<select class="wsp_select input-mel">';

        foreach ($workspaces as $key => $workspace) {
            $wsp = [
                "objects" => json_decode($workspace->objects), 
                "datas" => ["logo" => $workspace->logo,"ispublic" => $workspace->ispublic, 'uid' => $workspace->uid, "allow_ariane" => $workspace->ispublic || mel_workspace::is_in_workspace($workspace)
                    ,"title" => $workspace->title,
                    "color" => json_decode($workspace->settings)->color
                    ]
                ];
            $html .= '<option '.($this->get_input("_wsp") !== null && $this->get_input("_wsp") === $workspace->uid ? "selected" : "" ).' value="'.str_replace('"', $replace, json_encode($wsp)).'">'.$workspace->title.'</option>';
        }
        $html .= "</select>";

        return $html;
        /*
                    $wsp = [
            "objects" => json_decode($workspace->objects), 
            "datas" => ["logo" => $workspace->logo,"ispublic" => $workspace->ispublic, 'uid' => $wsp, "allow_ariane" => $workspace->ispublic || mel_workspace::is_in_workspace($workspace)
                ,"title" => $workspace->title,
                "color" => json_decode($workspace->settings)->color
                ]
            ];
        */
    }

    public function get_ariane_rooms()
    {
        $chat = $this->get_plugin("rocket_chat");
        $list = $chat->get_joined();
        $list["channel"] = json_decode($list["channel"]["content"]);
        $list["group"] = json_decode($list["group"]["content"]);
        $html = '<select class="ariane_select input-mel">';
        $html .= "<option value=home>".$this->rc->gettext("nothing", "mel_metapage")."</option>";
        foreach ($list["channel"]->channels as $key => $value) {
            $html.='<option value="true:'.$value->name.'">'.$value->name.'</option>';
        } 
        foreach ($list["group"]->groups as $key => $value) {
            $html.='<option value="false:'.$value->name.'">'.$value->name.'</option>';
        } 
        $html .= "</select>";
        return $html;
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

    public function get_jwt()
    {
        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
        echo json_encode(self::jwt());
        exit;
    }
  /**
   * Génère le code jwt
   */
  public static function jwt() {
    $rcmail = rcmail::get_instance();
    $room = rcube_utils::get_input_value('_room', rcube_utils::INPUT_GET);
    //$id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GET);
    $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GPC);
    $payload = $rcmail->config->get('webconf_jwt_payload', null);

    $result = null;
    if (isset($payload)) {
        $payload['room'] = $room;
        $payload['exp'] = time() + 12*60*60; // Expiration dans 12h
        $key = $rcmail->config->get('webconf_jwt_key', null);

        $jwt = JWT::encode($payload, $key);
        $result = array(
            'action'  => 'jwt',
            'id'      => "webconf",
            'room'    => $room,
            'jwt'     => $jwt,
            'unlock'  => $unlock,
        );
    }
    return $result;
    //   // send output
    //   header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
    //   echo json_encode($result);
    // //}
    // exit();
  }
}