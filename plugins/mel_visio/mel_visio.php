<?php
use \Firebase\JWT\JWT;

class mel_visio extends bnum_plugin
{
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
        $this->add_texts('localization/', false);  

        switch ($this->get_current_task()) {
            case 'webconf':
                include_once __DIR__.'/lib/data.php'; 

                $this->data = new VisioParams();

                $this->load_config();
                $this->register_task('webconf');
                $this->force_register_action('index', [$this, 'index']);
                $this->force_register_action('jwt', [$this, 'get_jwt']);
                $this->force_register_action('get_workspace_datas', [$this, 'get_workspace_datas']);
                $this->force_register_action('onGo', [$this, 'onGo']);
                $this->force_register_action('notify', [$this, 'notify']);
                break;

            case 'calendar':
                $this->send_visio_config();
                break;

            case 'bnum':              
                $this->add_button(array(
                    'command' => 'webconf',
                    'class'	=> 'button-mel-webconf icon-mel-webconf webconf hidden',
                    'classsel' => 'button-mel-webconf icon-mel-webconf webconf hidden selected',
                    'innerclass' => 'button-inner inner',
                    'label'	=> 'mel_visio.visio',
                    'title' => 'mel_visio.visio',
                    'type'       => 'link',
                    'data-task' => 'webconf'
                ), 'taskbar');

                $this->include_css("main-nav.css");
                break;
            
            default:
                break;
        }
    }

    function index() {
        $page =  rcube_utils::get_input_value('_page', rcube_utils::INPUT_GET) ?? 'init';

        if ($page === 'visio' || $page === 'index') {
            if (!$this->data->has_room() || $this->data->need_config()) $this->go_to_page('index');
            else $this->go_to_page('visio');
        }
        else $this->go_to_page($page);
    }

    function go_to_page($page) {
        $data = $this->api->exec_hook("visio.$page", ['break' => false]);

        if (!$data['break']) {
            call_user_func([$this, "page_$page"]);
        }
    }

    function page_init() {
        $this->setup_module();
        
        if (!$this->data->has_room()) {
            return $this->page_index();
        }
        else {
            $page = $this->data->has_room() ? 'visio' : null;
            
            $this->rc()->output->set_env('visio.data', $this->data->serialize());
            $this->rc()->output->set_env('visio.init.page', $page);

            $this->include_script('js/caller.js');

            $this->rc()->output->send('mel_metapage.empty');
        }
    }

    function page_index() {
        if (!$this->data->has_room()) 
        {
            $this->data->update_room($this->generate_key());
            $this->add_handler("inputroom", [$this, "get_room_input"]);
        }

        if (false && class_exists('rocket_chat')) {
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
        $path = __DIR__.'/config/toolbar.json';
        $toolbar = file_get_contents($path, true);
        $path = __DIR__.'/config/toolbar.more.json';
        $more = file_get_contents($path, true);
        $is_from_config = rcube_utils::get_input_value('_from_config', rcube_utils::INPUT_GET);

        if ($is_from_config !== true) $is_from_config = $is_from_config === 'true';

        if (class_exists('mel_notification') && $is_from_config && !!$this->data->wsp()) {
            //TODO Notify
        }

        $this->include_css("webconf.css");
        $this->rc()->output->set_env('visio.data', $this->data->serialize());  
        $this->rc()->output->set_env('visio.toolbar', $toolbar); 
        $this->rc()->output->set_env('visio.toolbar.more', $more); 
        // $base_src = $this->rc()->config->get('annuaire_source');
        // $contacts = $this->rc()->get_address_book($base_src)->search('email', driver_mel::gi()->getUser()->email);

        // if (count($contacts) > 0) {
        //     $cid = $contacts->first()['ID'];
        //     $this->rc()->output->set_env('cid', $cid);
        // }

        unset($contacts);

        $this->send_visio_config();
        $this->load_script_module('visio');
        $this->api->output->add_header('<script src="'.$this->rc()->config->get("web_conf").'/external_api.js"></script>');

        $this->rc()->output->send('mel_visio.visio');
        
    }

    function log_webconf($id)
    {
        mel_logs::get_instance()->log(mel_logs::INFO, "[Webconf]La webconf $id a été rejoint");
    }

    private function workspace($uid)
    {
        return mel_workspace::get_workspace($uid);
    }

    public function send_visio_config() {
        $this->rc()->output->set_env('visio.voxify_indicatif', $this->rc()->config->get('webconf_voxify_indicatif', 'FR'));
        $this->rc()->output->set_env('visio.voxify_url', $this->rc()->config->get('voxify_url'));   
        $this->rc()->output->set_env('visio.url', $this->rc()->config->get('visio_url'));     
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
            $plugin->include_workspace_object();
            $workspaces = Workspace::Workspaces();
        }
        else {
            $workspaces = [];
        }
        
        $html = '<select class="wsp_select input-mel">';

        foreach ($workspaces as $workspace) {
            $html .= '<option '.($this->data->wsp() !== null && $this->data->wsp() === $workspace->uid() ? "selected" : "" ).' value="'.$workspace->uid().'">'.$workspace->title().'</option>';
        }
        $html .= "</select>";

        return $html;
    }

    public function get_room_input() {
        $this->require_plugin('mel_helper');
        $input = mel_helper::Parse('mel_visio.block/input_room');
        $input->value = $this->data->room();
        return $input->parse();
    }

    public function get_jwt()
    {
        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
        echo json_encode(self::jwt());
        exit;
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

}
