<?php
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
        $this->load_config();

        if ('webconf' === $this->get_current_task()) {
            include_once __DIR__.'/lib/data.php'; 
            $this->data = new VisioParams();
            $this->register_task('webconf');
            $this->force_register_action('index', [$this, 'index']);
            $this->force_register_action('jwt', [$this, 'get_jwt']);
            $this->force_register_action('get_workspace_datas', [$this, 'get_workspace_datas']);
            $this->force_register_action('onGo', [$this, 'onGo']);
            $this->force_register_action('notify', [$this, 'notify']);
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

        $this->rc()->output->send('mel_visio.index');
    }

    public function get_ariane_rooms($classes = "", $ownerOnly = false, $only = 0)
    {
        try {
            $list = null;
            $chat = $this->rc()->plugins->get_plugin("rocket_chat");
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
            $html .= "<option value=home selected>".$this->rc()->gettext("nothing", "mel_metapage")."</option>";

            foreach (($ownerOnly ? $list["channel"] : $list["channel"]->channels) as $key => $value) {
                $html.='<option value="true:'.$value->name.'">'.$value->name.'</option>';
            } 

            foreach (($ownerOnly ? $list["group"] : $list["group"]->groups) as $key => $value) {
                $html.='<option value="false:'.$value->name.'">'.$value->name.'</option>';
            } 
            
            $html .= "</select>";
        } catch (\Throwable $th) {
            $html = '<select class="ariane_select input-mel '.$classes.'">';
            $html .= "<option value=home>".$this->rc()->gettext("nothing", "mel_metapage")."</option>";
            $html .= "</select>";
        }
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
}
