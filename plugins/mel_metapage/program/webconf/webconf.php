<?php
use \Firebase\JWT\JWT;
require_once __DIR__ . '/vendor/autoload.php';
include_once __DIR__."/../program.php";

class Webconf extends Program
{
    public const PUBLIC_URL = 'webconf';
    private const DEFAULT_VA_PARAM = 'large';
    private const VA_PARAM = 'visio_audio_parameters';
    private const ASK_ON_END_PARAM = 'visio_ask_on_end';
    private $tmp_key;

    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin);
    }  

    public function init()
    {
        $this->register_action("index", [$this, "index"]);
        $this->register_action("jwt", [$this, "get_jwt"]);
        $this->register_action("get_workspace_datas", [$this, "get_workspace_datas"]);
        $this->register_action("onGo", [$this, "onGo"]);
        $this->register_action("notify", [$this, "notify"]);
        
        if ($this->action === "" || $this->action === "index")
        {
            $this->include_js("../../../rocket_chat/favico.js");
            $this->include_js("../../../rocket_chat/rocket_chat.js");
            $this->include_js("stabilised_webconf.js");
            $this->include_css("webconf.css");
        }
    }

    public function program_task()
    {
        return 'webconf';
    }

    public function public()
    {
        $askOnEnd = self::ASK_ON_END_PARAM;
        $visio_audio_video_parameters = self::VA_PARAM;
        $visio_audio_video_parameters_default = self::DEFAULT_VA_PARAM;

        $this->add_parameters(function ($args) use($askOnEnd, $visio_audio_video_parameters, $visio_audio_video_parameters_default) {
            if ($args['section'] == 'visio')
            {
                $this->plugin->add_texts('localization/');
                $askOnEnd_config = $this->rc->config->get($askOnEnd, true);
                $visio_audio_video_parameters_config = $this->rc->config->get($visio_audio_video_parameters, $visio_audio_video_parameters_default);
    
                $askOnEnd_check = new html_checkbox(['name' => $askOnEnd, 'id' => $askOnEnd, 'value' => 1]);
                $args['blocks']['general']['options'][$askOnEnd] = [
                    'title'   => html::label($askOnEnd, rcube::Q($this->plugin->gettext($askOnEnd))),
                    'content' => $askOnEnd_check->show($askOnEnd_config ? 1 : 0),
                ];

                $args['blocks']['general']['options'][$visio_audio_video_parameters] = $this->create_pref_select($visio_audio_video_parameters, $visio_audio_video_parameters_config, [
                        $this->plugin->gettext("compact", "mel_metapage"),
                        $this->plugin->gettext("large", "mel_metapage"),
                ], ['compact', 'large']);
            }

            return $args;
        }, function ($args) use($askOnEnd, $visio_audio_video_parameters, $visio_audio_video_parameters_default) {
            if ($args['section'] == 'visio')
            {
                $this->plugin->add_texts('localization/');
                $askOnEnd_config = $this->rc->config->get($askOnEnd, true);
                $askOnEnd_config = rcube_utils::get_input_value($askOnEnd, rcube_utils::INPUT_POST) === '1';
                $args['prefs'][$askOnEnd] = $askOnEnd_config;

                $visio_audio_video_parameters_config = $this->rc->config->get($visio_audio_video_parameters, $visio_audio_video_parameters_default);
                $visio_audio_video_parameters_config = rcube_utils::get_input_value($visio_audio_video_parameters, rcube_utils::INPUT_POST);
                $args['prefs'][$visio_audio_video_parameters] = $visio_audio_video_parameters_config;
            }
            
            return $args;
        });
    }

    function log_webconf($id)
    {
        mel_logs::get_instance()->log(mel_logs::INFO, "[Webconf]La webconf $id a été rejoint");
    }

    public function index()
    {
        $key_invalid = false;
        $need_config = $this->get_input("_need_config") ?? false;
        $locks = $this->get_input("_locks") ?? [];

        if (is_string($locks))
        {
            if (strpos($locks, ',') !== false) $locks = mel_helper::Enumerable(explode(',', $locks))->select(function ($k, $v) {
                return intval($v);
            })->toArray();
            else $locks = [intval($locks)];
        }

        $key = $this->get_input("_key");
        $this->tmp_key = $key;// ?? $this->generate_key();
        $this->set_env_var("webconf.key", $key);
        $wsp = $this->get_input("_wsp");// ?? "webconf-1";
        $ariane = null;

        if ($wsp === null)
        {
                $ariane = $this->get_input("_ariane") ?? '@home';
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
            "name" => $user->name,
            "email" => $user->email
        ]);
        $this->set_env_var("webconf.bar", $this->parse("webconf_bar"));

        //check if key is valid
        if ($need_config != 1 && $key !== null && $key !== '' && !$this->check_key_validity($key)) {
            $key_invalid = true;
            $need_config = 1;
        }

        if ($need_config == 1 || $key === null || $key === '')
        {
            $this->add_handler("roomkey", [$this, "get_key"]);
            $this->add_handler("selectrooms", [$this, "get_ariane_rooms"]);
            $this->add_handler("selectwsp", [$this, "get_all_workspaces"]);

            if (!$key_invalid) $this->set_env_var("webconf.need_config", true);
            $this->set_env_var("webconf.locks", $locks);
        }
        else if ($key !== null && ($wsp !== null || $ariane !== null))
        {
            $this->log_webconf($key);
            $this->set_env_var("already_logged", "logged");
        }

        $this->set_env_var("webconf.public_url", self::PUBLIC_URL);

        $this->set_env_var("webconf.feedback_url", $this->get_config("webconf_feedback_url"));
        $this->set_env_var("webconf.have_feed_back", $this->get_config("visio_ask_on_end", true));
        $this->set_env_var("webconf.audio_style_params", $this->get_config(self::VA_PARAM, self::DEFAULT_VA_PARAM));
        $this->rc->output->set_pagetitle("Visioconférence");
        $this->send("webconf");
    }

    public function get_workspace_datas()
    {
        $uid = $this->get_input("_uid");
        $workspace = $this->workspace($uid);
                    $wsp = [
                "objects" => json_decode($workspace->objects), 
                "datas" => ["logo" => $workspace->logo,"ispublic" => $workspace->ispublic, 'uid' => $workspace->uid, "allow_ariane" => $workspace->ispublic || mel_workspace::is_in_workspace($workspace)
                    ,"title" => $workspace->title,
                    "color" => json_decode($workspace->settings)->color
                    ]
                ];
        echo json_encode($wsp);
        exit;
    }

    public function onGo()
    {
        if (rcube_utils::get_input_value('_alreadyLogged', rcube_utils::INPUT_POST) === null)
        {
            $room = rcube_utils::get_input_value('_room', rcube_utils::INPUT_POST);
            $this->log_webconf($room);
        }

        echo 0;
        exit;
    }

    public function check_key_validity($key)
    {
        return strlen($key) >= 10 && mel_helper::Enumerable($key)->where(function ($k, $v) {
            return preg_match("/\d/", $v) === 1;
        })->count() >= 3 && preg_match("/^[0-9a-zA-Z]+$/", $key);
    }

    public function notify()
    {
        if (class_exists("mel_notification"))
        {
            $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

            if ($uid !== null)
            {
                $wsp = $this->workspace($uid);
                $link = rcube_utils::get_input_value('_link', rcube_utils::INPUT_POST);

                $current_user = driver_mel::gi()->getUser();
                $users = $wsp->shares;

                foreach ($users as $user) {
                    if ($user->user !== $current_user->uid)
                    {
                        mel_notification::notify("webconf", $current_user->name.' vient de lancer une webconférence lié à l\'espace "'.$wsp->title.'" !', 'Vous pouvez rejoindre directement la webconférence en cours via le lien disponible ci-dessous.', 
                        [
                            [
                                'href' => $link,
                                'text' => "Rejoindre",
                                'title' => "Cliquez pour rejoindre la webconférence"
                            ]
                        ]
                        , $user->user);
                    }
                }
            }


        }
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
            // $wsp = [
            //     "objects" => json_decode($workspace->objects), 
            //     "datas" => ["logo" => $workspace->logo,"ispublic" => $workspace->ispublic, 'uid' => $workspace->uid, "allow_ariane" => $workspace->ispublic || mel_workspace::is_in_workspace($workspace)
            //         ,"title" => $workspace->title,
            //         "color" => json_decode($workspace->settings)->color
            //         ]
            //     ];
            $html .= '<option '.($this->get_input("_wsp") !== null && $this->get_input("_wsp") === $workspace->uid ? "selected" : "" ).' value="'.$workspace->uid.'">'.$workspace->title.'</option>';
        }
        $html .= "</select>";

        return $html;
    }

    public function get_ariane_rooms($classes = "", $ownerOnly = false, $only = 0)
    {
        try {
            $list = null;
            $chat = $this->get_plugin("rocket_chat");
            if ($ownerOnly)
            {
                $list = $chat->get_all_moderator_joined();
                switch ($only) {
                    case 1:
                        $list["group"] = [];
                        break;

                    case 2:
                        $list["channel"] = [];
                        break;
                    
                    default:
                        # code...
                        break;
                }
            }
            else {
                $list = $chat->get_joined();
                $list["channel"] = json_decode($list["channel"]["content"]);
                $list["group"] = json_decode($list["group"]["content"]);
            }

            $html = '<select class="ariane_select input-mel '.$classes.'">';
            $html .= "<option value=home selected>".$this->rc->gettext("nothing", "mel_metapage")."</option>";

            foreach (($ownerOnly ? $list["channel"] : $list["channel"]->channels) as $key => $value) {
                $html.='<option value="true:'.$value->name.'">'.$value->name.'</option>';
            } 

            foreach (($ownerOnly ? $list["group"] : $list["group"]->groups) as $key => $value) {
                $html.='<option value="false:'.$value->name.'">'.$value->name.'</option>';
            } 
            
            $html .= "</select>";
        } catch (\Throwable $th) {
            $html = '<select class="ariane_select input-mel '.$classes.'">';
            $html .= "<option value=home>".$this->rc->gettext("nothing", "mel_metapage")."</option>";
            $html .= "</select>";
        }
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
    }

    public static function validWebconfKey($key)
    {
        $isValid = true;

        if (strlen($key) < 10) $isValid = false;

        return $isValid;
    }
}

Program::add_class_to_load('Webconf');