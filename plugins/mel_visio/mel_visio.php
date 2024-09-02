<?php
use \Firebase\JWT\JWT;

class mel_visio extends bnum_plugin
{

    public const PUBLIC_URL = 'webconf';
    private const DEFAULT_VA_PARAM = 'large';
    private const VA_PARAM = 'visio_audio_parameters';
    private const ASK_ON_END_PARAM = 'visio_ask_on_end';
    private const OLD = true;
    private $tmp_key;


    /**
     * Contient la task associé au plugin
     * @var string
     */
    public $task = '?(?!login|logout).*';

    /**
     * Undocumented variable
     *
     * @var [VisioParams]
     */
    private $data;
    /**
     * Méthode héritée de rcube_plugin
     * pour l'initialisation du plugin
     * @see rcube_plugin::init()
     */
    function init()
    {
        if ('webconf' === $this->get_current_task()) {
            $this->load_config();
            include_once __DIR__.'/lib/data.php'; 
            $this->data = new VisioParams();
            $this->register_task('webconf');
            $this->force_register_action('index', [$this, 'index']);
            $this->force_register_action('jwt', [$this, 'get_jwt']);
            $this->force_register_action('get_workspace_datas', [$this, 'get_workspace_datas']);
            $this->force_register_action('onGo', [$this, 'onGo']);
            $this->force_register_action('notify', [$this, 'notify']);
        }
        else if ('calendar' === $this->get_current_task()) {
            $this->send_visio_config();
        }
        else if ('settings' === $this->get_current_task()) {
            $askOnEnd = self::ASK_ON_END_PARAM;
            $visio_audio_video_parameters = self::VA_PARAM;
            $visio_audio_video_parameters_default = self::DEFAULT_VA_PARAM;

            $this->add_parameters(function ($args) use($askOnEnd, $visio_audio_video_parameters, $visio_audio_video_parameters_default) {
                if ($args['section'] == 'visio')
                {
                    $this->add_texts('localization/');
                    $askOnEnd_config = $this->rc()->config->get($askOnEnd, true);
                    $visio_audio_video_parameters_config = $this->rc()->config->get($visio_audio_video_parameters, $visio_audio_video_parameters_default);
        
                    $askOnEnd_check = new html_checkbox(['name' => $askOnEnd, 'id' => $askOnEnd, 'value' => 1]);
                    $args['blocks']['general']['options'][$askOnEnd] = [
                        'title'   => html::label($askOnEnd, rcube::Q($this->gettext($askOnEnd))),
                        'content' => $askOnEnd_check->show($askOnEnd_config ? 1 : 0),
                    ];
                }

                return $args;
            }, function ($args) use($askOnEnd, $visio_audio_video_parameters, $visio_audio_video_parameters_default) {
                if ($args['section'] == 'visio')
                {
                    $this->add_texts('localization/');
                    $askOnEnd_config = $this->rc()->config->get($askOnEnd, true);
                    $askOnEnd_config = rcube_utils::get_input_value($askOnEnd, rcube_utils::INPUT_POST) === '1';
                    $args['prefs'][$askOnEnd] = $askOnEnd_config;

                    $visio_audio_video_parameters_config = $this->rc()->config->get($visio_audio_video_parameters, $visio_audio_video_parameters_default);
                    $visio_audio_video_parameters_config = rcube_utils::get_input_value($visio_audio_video_parameters, rcube_utils::INPUT_POST);
                    $args['prefs'][$visio_audio_video_parameters] = $visio_audio_video_parameters_config;
                }
                
                return $args;
            });
        }
    }

    function index() {
        if (!$this->data->has_room() || $this->data->need_config()) $this->go_to_page('index');
        else $this->go_to_page('visio');
        
    }

    function go_to_page($page) {
        $data = $this->api->exec_hook("visio.$page", ['break' => false]);

        if (!$data['break']) {
            call_user_func([$this, "page_$page"]);
        }
    }

    function page_index() {
        if (self::OLD) return $this->go_to_page('visio');

        if (class_exists('rocket_chat')) {
            $this->add_handler("selectrooms", [$this, "get_ariane_rooms"]);
            $this->rc()->output->set_env('visio.has_channel', true);
        }

        if (class_exists('mel_workspace')) {
            $this->add_handler("selectwsp", [$this, "get_all_workspaces"]);
            $this->rc()->output->set_env('visio.has_wsp', true);
        }

        $locks = rcube_utils::get_input_value('_locks', rcube_utils::INPUT_GET) ?? [];

        if ($this->data->need_config()) $this->rc()->output->set_env('visio.data', $this->data->serialize());

        if (is_string($locks))
        {
            if (strpos($locks, ',') !== false) $locks = mel_helper::Enumerable(explode(',', $locks))->select(function ($k, $v) {
                return intval($v);
            })->toArray();
            else $locks = [intval($locks)];

            $this->rc()->output->set_env('webconf.locks', $locks);
        }

        $this->include_css("webconf.css");
        $this->load_script_module('index');

        $this->rc()->output->send('mel_visio.index');
    }

    function page_visio() {
        if (!$this->old_visio()) {
            $is_from_config = rcube_utils::get_input_value('_from_config', rcube_utils::INPUT_GET);

            if ($is_from_config !== true) $is_from_config = $is_from_config === 'true';

            if (class_exists('mel_notification') && $is_from_config && !!$this->data->wsp()) {
                //TODO Notify
            }

            $this->include_css("webconf.css");
            $this->rc()->output->set_env('visio.data', $this->data->serialize());  
            $this->send_visio_config();

            $this->rc()->output->send('mel_visio.visio');
        }
    }

    protected function get_input($key, $type = rcube_utils::INPUT_GPC) {
        return rcube_utils::get_input_value($key, $type);
    }

    protected function set_env_var($key, $item)
    {
        $this->rc()->output->set_env($key, $item);
    }

    protected function send($html, $plugin = "mel_visio")
    {
        $this->rc()->output->send("$plugin.$html");
    }

    protected function add_parameters($onLoad, $onSave)
    {
        $this->add_hook('preferences_list', $onLoad);
        $this->add_hook('preferences_save', $onSave);
    }

    protected function get_config($key, $default = null)
    {
        if ($default === null)
            return $this->rc()->config->get($key);
        else
            return $this->rc()->config->get($key, $default);
    }

    protected function parse($html, $plugin = "mel_visio", $exit = false, $write = false)
    {
        return $this->rc()->output->parse("$plugin.$html", $exit, $write);
    }


    protected function include_js($path)
    {
        $this->include_script("js/$path");
    }

    private function old_visio() {
        $this->setup_module();
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

        $pass = $this->get_input("_pass");
        if ($pass) {
            $this->set_env_var("webconf.pass", $pass);
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
        $this->rc()->output->set_pagetitle("Visioconférence");
        $this->include_js("../../rocket_chat/favico.js");
        $this->include_js("../../rocket_chat/rocket_chat.js");
        $this->include_js("webconf_audio_visualiser.js");
        $this->include_js("webconf_video_manager.js");
        $this->include_js("visio.js");
        $this->include_css("webconf.css");
        $this->send("visio");
    }

    public function send_visio_config() {
        $this->rc()->output->set_env('visio.voxify_indicatif', $this->rc()->config->get('webconf_voxify_indicatif', 'FR'));
        $this->rc()->output->set_env('visio.voxify_url', $this->rc()->config->get('voxify_url'));   
        $this->rc()->output->set_env('visio.url', $this->rc()->config->get('visio_url'));     
    }

    function log_webconf($id)
    {
        mel_logs::get_instance()->log(mel_logs::INFO, "[Webconf]La webconf $id a été rejoint");
    }

    public function get_ariane_rooms($classes = "", $ownerOnly = false, $only = 0)
    {
        $html = '<select class="ariane_select input-mel '.$classes.'">';
        $html .= "<option value=home>".$this->rc()->gettext("nothing", "mel_metapage")."</option>";
        $html .= "</select>";
        // try {
        //     $list = null;
        //     $chat = $this->rc()->plugins->get_plugin("rocket_chat");
        //     if ($ownerOnly)
        //     {
        //         $list = $chat->get_all_moderator_joined();
        //         switch ($only) {
        //             case 1:
        //                 $list["group"] = [];
        //                 break;

        //             case 2:
        //                 $list["channel"] = [];
        //                 break;
                    
        //             default:
        //                 # code...
        //                 break;
        //         }
        //     }
        //     else {
        //         $list = $chat->get_joined();
        //         $list["channel"] = json_decode($list["channel"]["content"]);
        //         $list["group"] = json_decode($list["group"]["content"]);
        //     }

        //     $html = '<select class="ariane_select input-mel '.$classes.'">';
        //     $html .= "<option value=home selected>".$this->rc()->gettext("nothing", "mel_metapage")."</option>";

        //     foreach (($ownerOnly ? $list["channel"] : $list["channel"]->channels) as $key => $value) {
        //         $html.='<option value="true:'.$value->name.'">'.$value->name.'</option>';
        //     } 

        //     foreach (($ownerOnly ? $list["group"] : $list["group"]->groups) as $key => $value) {
        //         $html.='<option value="false:'.$value->name.'">'.$value->name.'</option>';
        //     } 
            
        //     $html .= "</select>";
        // } catch (\Throwable $th) {
        //     $html = '<select class="ariane_select input-mel '.$classes.'">';
        //     $html .= "<option value=home>".$this->rc()->gettext("nothing", "mel_metapage")."</option>";
        //     $html .= "</select>";
        // }
        return $html;
    }

    public function get_all_workspaces()
    {
        // Metapage sans workspace
        if (class_exists("mel_workspace"))
        {
            $plugin = $this->rc()->plugins->get_plugin("mel_workspace");
            $plugin->load_workspaces();
            $workspaces = $plugin->workspaces;
        }
        else {
            $workspaces = [];
        }
        
        $html = '<select class="wsp_select input-mel">';

        foreach ($workspaces as $workspace) {
            $html .= '<option '.($this->data->wsp() !== null && $this->data->wsp() === $workspace->uid ? "selected" : "" ).' value="'.$workspace->uid.'">'.$workspace->title.'</option>';
        }
        $html .= "</select>";

        return $html;
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

    ////////////
    
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
