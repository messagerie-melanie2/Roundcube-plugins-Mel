<?php
class mel_wekan extends rcube_plugin
{
    public const KEY_FOR_WORKSPACE = 'wekan';
    /**
     * @var string
     */
    public $task = '.*';

    /**
     * @var rcmail
     */
    private $rc;

    private $wekanApi;

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->require_plugin('mel_helper');
        $this->setup();
    }

    /**
     * Enregistre les différentes actions, configs et boutons.
     *
     * @return void
     */
    function setup()
    {
        $this->rc = rcmail::get_instance();
        $this->add_texts('localization/', true);
        $this->load_config();

        $this->register_task("wekan");
        $this->register_action('login', array($this, 'login'));
        $this->register_action('create_board', array($this, 'action_create_board'));
        $this->register_action('check_board', array($this, 'action_check_board'));
        $this->register_action('get_user_board', [$this, 'action_get_user_board']);
        $this->register_action('index', array($this, 'index'));
        $this->include_script('js/wekan.js');

        $this->load_lib();
        $this->wekanApi = new mel_wekan_api($this->rc, $this);

        $need_button = 'taskbar';
        if (class_exists("mel_metapage")) {
            $need_button = $this->rc->plugins->get_plugin('mel_metapage')->is_app_enabled('app_kanban') ? $need_button : 'otherappsbar';
        }

        $button_config = array(
            'command' => 'wekan',
            'class'    => 'button-mel-wekan icon-mel-trello wekan',
            'classsel' => 'button-mel-wekan button-selected icon-mel-trello wekan',
            'innerclass' => 'button-inner inner',
            'label'    => 'mel_wekan.kanban',
            'title' => 'mel_wekan.kanban',
            'type'       => 'link'
        );

        $params = $this->rc->plugins->exec_hook('main-nav-bar', [
            'plugin' => 'wekan',
            'need_button' => $need_button,
            'button' => $button_config
        ]);

        if (isset($params) && isset($params->need_button)) $need_button = $params->need_button;
        if (isset($params) && isset($params->button)) $button_config = $params->button;

        if ($need_button) $this->add_button($button_config, $need_button);

        unset($button_config);
        unset($params);
        unset($need_button);

        $this->rc->output->set_env("wekan_base_url", $this->wekan_url(false));
        if (class_exists("mel_metapage")) mel_metapage::add_url_spied($this->wekan_url(false), 'kanban');

        if ($this->rc->task === 'workspace') {
            $this->add_hook('wsp.show', [$this, 'wsp_block']);
            $this->add_hook('workspace.services.set', [$this, 'workspace_services_set']);
            $this->add_hook('workspace.services.set.role', [$this, 'workspace_services_set_role']);
            $this->add_hook('workspace.users.services.delete', [$this, 'workspace_users_services_delete']);
        }
    }

    function index()
    {

        $startupUrl =  rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC);
        if ($startupUrl !== null && $startupUrl !== "") $this->rc->output->set_env("wekan_startup_url", $startupUrl);

        $this->rc->output->set_env("wekan_storage_end", $this->rc->config->get("wekan_storage_end"));

        $this->rc->output->set_pagetitle("Kanban");
        $this->rc->output->send('mel_wekan.wekan');
    }

    /**
     * Charge les différents fichiers librairies de wekan (/lib)
     *
     * @return void
     */
    function load_lib()
    {
        mel_helper::load_helper($this->rc)->include_amel_lib();

        $files = scandir(__DIR__ . "/lib");
        $size = count($files);
        for ($i = 0; $i < $size; ++$i) {
            if (strpos($files[$i], ".php") !== false)
                include_once "lib/" . $files[$i];
        }
    }

    /**
     * Log un utilisateur et récupère ses tokens d'identifications.
     *
     * @return void
     */
    public function login()
    {
        $currentUser = rcube_utils::get_input_value("currentUser", rcube_utils::INPUT_GPC) ?? false;

        mel_logs::get_instance()->log(mel_logs::INFO, "[wekan/login]Login de wekan... Utilisteur courant ? $currentUser");
        $result = !$currentUser ? $this->wekanApi->login() : $this->wekanApi->create_token(driver_mel::gi()->getUser()->uid);

        mel_logs::get_instance()->log(mel_logs::INFO, '[wekan/login]Résultat ? ' . json_encode($result));

        echo json_encode($result);
        exit;
    }

    function action_create_board()
    {
        $title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_GPC);
        $public = rcube_utils::get_input_value("_isPublic", rcube_utils::INPUT_GPC) ?? "private";
        $color = rcube_utils::get_input_value("_color", rcube_utils::INPUT_GPC);

        $board = $this->create_board($title, $public, $color);
        echo json_encode($board);
        exit;
    }

    /**
     * Créer un tableau.
     *
     * @param string $title - Nom du tableau.
     * @param boolean $isPublic - Si le tableau est visible par tous ou non.
     * @param string|null $color - Couleur du tableau.
     * @return array
     */
    public function create_board($title, $isPublic, $color = null)
    {
        return $this->wekanApi->create_board($title, $isPublic, $color);
    }

    /**
     * Créer un tableau avec des colonnes déjà prédéfini.
     *
     * @param string $title - Nom du tableau.
     * @param boolean $isPublic - Si le tableau est visible par tous ou non.
     * @param string|null $color - Couleur du tableau.
     * @param array $lists - Nom des colonnes
     * @return array
     */
    public function create_board_with_inital_lists($title, $isPublic, $color = null, $lists = [])
    {
        $board = $this->create_board($title, $isPublic, $color);

        if ($board["httpCode"] == 200) {
            $content = json_decode($board["content"]);

            if ($content->_id !== null) {
                $board = [
                    "httpCode" => 200,
                    "board_id" => $content->_id,
                    "board" => $board,
                    "lists" => []
                ];

                foreach ($lists as $key => $value) {
                    $board["lists"][] = $this->create_list($content->_id, $value);
                }

                if (isset($content->defaultSwimlaneId)) {
                    $a = $this->wekanApi->create_swimlane($content->_id, $title);
                    $b = $this->wekanApi->delete_swimline($content->_id, $content->defaultSwimlaneId);
                }
            }
        }

        return $board;
    }

    /**
     * Créer une colonne pour un tableau.
     *
     * @param string $board - Id du tableau.
     * @param string $title - Nom de la colonne.
     * @return void
     */
    public function create_list($board, $title)
    {
        return $this->wekanApi->create_list($board, $title);
    }

    /**
     * Met à jours le privilège de l'utilisateur.
     *
     * @param string $board - Id du tableau.
     * @param string $user - Nom de l'utilisateur.
     * @param boolean $isAdmin - Devient admin ou non.
     * @return array
     */
    public function update_user_status($board, $user, $isAdmin)
    {
        return $this->wekanApi->update_user($board, $user, $isAdmin);
    }

    /**
     * Vérifie si l'utilisateur éxiste dans un tableau.
     *
     * @param string $board - Id du tableau.
     * @param string $user - Nom de l'utilisateur.
     * @return boolean
     */
    public function check_if_user_exist($board, $user)
    {
        return $this->wekanApi->check_user_exist($board, $user);
    }

    /**
     * Ajoute un utilisateur au tableau.
     *
     * @param string $board - Id du tableau.
     * @param string $username - Nom de l'utilisateur à ajouter.
     * @param boolean $isAdmin - Doit être administrateur du tableau ?
     * @return array
     */
    public function add_member($board, $username, $isAdmin = false)
    {
        return $this->wekanApi->add_member($board, $username, $isAdmin);
    }

    /**
     * Supprime un utilisateur du tableau.
     *
     * @param string $board - Id du tableau
     * @param string $user - Nom de l'utilisateur
     * @return array
     */
    public function remove_user($board, $user)
    {
        return $this->wekanApi->delete_user($board, $user);
    }

    /**
     * Supprime un tableau.
     *
     * @param string $board - Id du tableau.
     * @return array
     */
    public function delete_board($board)
    {
        return $this->wekanApi->delete_board($board);
    }

    public function action_check_board()
    {
        $board = rcube_utils::get_input_value("_board", rcube_utils::INPUT_GPC);

        echo json_encode($this->check_board($board));
        exit;
    }

    /**
     * Récupère les données d'un tableau.
     *
     * @param string $board - Id du tableau.
     * @return array
     */
    public function check_board($board)
    {
        return $this->wekanApi->get_board($board);
    }

    /**
     * Vérifie si un tableau éxiste.
     *
     * @param string $board - Id du tableau.
     * @return bool
     */
    public function board_exist($board)
    {
        $board_exist = false;
        $board = $this->check_board($board);

        if (
            $board["httpCode"] !== null && $board["httpCode"] == 200 && $board["content"] !== "{}" && !empty($board["content"])
            || $board["httpCode"] !== null && $board["httpCode"] != 200
        ) {
            $board_exist = true;
        } else {
            mel_logs::get_instance()->log(mel_logs::WARN, "/!\\[mel_wekan->board_exist|" . driver_mel::gi()->getUser()->uid . "]Recréation d'un board ! : " . json_encode($board));
        }

        return $board_exist;
    }

    /**
     * Vérifie si un tableau est archivé.
     *
     * @param string $board - Id du tableau.
     * @return boolean
     */
    public function board_archived($board)
    {
        $archived = false;
        $board = $this->check_board($board);

        if ($board["httpCode"] == 200 && $board["content"] !== "{}")
            $archived = json_decode($board["content"])->archived;

        return $archived;
    }

    public function add_tag($board, $label)
    {
        return $this->wekanApi->create_label($board, $label);
    }

    /**
     * Récupère l'url de wekan.
     *
     * @param boolean $server - Si vrai, l'url interne, sinon, l'url public.
     * @return string
     */
    public function wekan_url($server = true)
    {
        return $server ? $this->wekanApi->get_url() : $this->rc->config->get("wekan_url");
    }

    public function get_user_admin_board($username)
    {
        return $this->wekanApi->get_user_boards_admin($username);
    }

    public function get_user_admin_board_generator($username)
    {
        return $this->wekanApi->get_user_boards_admin_generator($username);
    }

    public function action_get_user_board()
    {
        $this->require_plugin('mel_helper');
        $user = rcube_utils::get_input_value('_user', rcube_utils::INPUT_POST) ?? driver_mel::gi()->getUser()->uid;
        $moderator_only = rcube_utils::get_input_value('_moderator', rcube_utils::INPUT_POST) ?? false;
        $mode = rcube_utils::get_input_value('_mode', rcube_utils::INPUT_POST) ?? 0;
        $only_title_and_id = (rcube_utils::get_input_value('_minified_datas', rcube_utils::INPUT_POST) ?? true) == 'true';
        $mode = (int) $mode;

        $list;
        if ($moderator_only) $list = $this->get_user_admin_board_generator($user);
        else $list = $this->wekanApi->get_user_boards_objects_generator($user);

        $list = mel_helper::Enumerable($list);

        switch ($mode) {
            case 1: //public
                $perm = 'public';
            case 2: //private
                if ($mode === 2) $perm = 'private';
            case 3:
                $list = $list->where(function ($k, $v) use ($perm) {
                    return $v->permission === $perm;
                });
                break;

            default:
                break;
        }

        if ($only_title_and_id) $list = $list->select(function ($k, $v) {
            return [
                'title' => $v->title,
                'id' => $v->id
            ];
        });

        echo $list = json_encode($list->toArray());

        exit;
    }

    function add_users_to_wekan_board($workspace, $users, $board_id = null, $wekan = null, $current_user = null)
    {
        if (!isset($current_user)) $current_user = driver_mel::gi()->getUser()->uid;
        if (!isset($wekan)) $wekan = $this;

        if (!isset($board_id)) $board_id = $workspace->objects()->get(self::KEY_FOR_WORKSPACE)->id;

        $return = ['users' => []];

        foreach ($users as $key => $value) {
            $value = $key;
            if (!$wekan->check_if_user_exist($board_id, $value))
            {
                try {
                    $return['users'][$value] = $wekan->add_member($board_id, $value, $workspace->isAdmin($value));
                    $wekan->update_user_status($board_id, $value, $workspace->isAdmin($value));
                } catch (\Throwable $th) {
                    //throw $th;
                }
            }
        }

        return $return;
    }

    #region Workspace
    function create_workspace_wekan($workspace, $title, $isPublic, $color, $list, $users)
    {
        $wekan = $this;
        $return = [
            "board" => $wekan->create_board_with_inital_lists($title, $isPublic, $color, $list),
            "users" => []
        ];

        if ($return["board"]["httpCode"] == 200)
        {
            $current_user = driver_mel::gi()->getUser()->uid;
            $board_id = $return["board"]["board_id"] !== null ? $return["board"]["board_id"] : json_decode($return["board"]["content"])->_id;

            $return['users'] = $this->add_users_to_wekan_board($workspace, $users, $board_id, $wekan, $current_user)['users'];

            $return["board_id"] = $board_id;
            $return["board_title"] = null;//$return["board"]["board_title"] !== null ? $return["board"]["board_title"] : json_decode($return["board"]["content"])->title;
        }

        return $return;
    }

    public function workspace_services_set($args) {
        $key = array_search(mel_workspace::KEY_TASK, $args['services']);

        if (isset($key)) {
            /**
             * @var Workspace
             */
            $workspace = $args['workspace'];
            $default_value = $args['default_values'];
            //Verifier si le wekan existe
            $board_id = $workspace->objects()->get(self::KEY_FOR_WORKSPACE);//$this->get_object($workspace, self::WEKAN);
            
            if ($board_id === null)
            {
                $object = ["id" => '', "title" => ''];
                $index = 'tasks';

                if (!isset($default_value) || !isset($default_value[$index]))
                {
                    if (!isset($default_value) || $default_value === '') $default_value = [];

                    $default_value[$index] = [
                        'mode' => 'default'
                    ];
                }

                switch ($default_value[$index]['mode']) {
                    case 'default':
                        $title = $workspace->title();
                    case 'custom_name':
                        if ($default_value[$index]['mode'] === 'custom_name') $title = $default_value[$index]['value'];
                    case 'create':
                        $board_id = $this->create_workspace_wekan($workspace, $title ?? $workspace->title(), $workspace->isPublic() === false ? false: true, null, [
                            $this->rc->gettext("wekan_todo", "mel_workspace"),
                            $this->rc->gettext("wekan_in_progress", "mel_workspace"),
                            $this->rc->gettext("wekan_do", "mel_workspace")
                        ], $workspace->users());
                        break;
                    case 'already_exist':
                        $board_id = [
                            'board_id' => $default_value[$index]['value'],
                            'board_title' => $this->wekanApi->get_board($default_value[$index]['value']),
                        ];
                        $board_id["board_title"] = ($board_id["board_title"]['httpCode'] === 200 ? json_decode($board_id["board_title"]['content'])->title : null) ?? '';
                        $object['updated'] = true;
                        break;
                    
                    default:
                        return;
                } 

                $object['id'] = $board_id['board_id'];
                $object['title'] = $board_id['board_title'];

                $workspace->objects()->set(self::KEY_FOR_WORKSPACE, $object);
                //$this->save_object($workspace, self::WEKAN, $object);
                $args['default_values'] = $default_value;
                $args['workspace'] = $workspace;
            }
            else {
                foreach ($workspace->users() as $key => $value) {
                    if (!$this->check_if_user_exist($board_id, $key))
                    {
                        try {
                            $this->add_member($board_id, $value);
                        } catch (\Throwable $th) {
                            throw $th;
                        }
                    }
                }

                $args['workspace'] = $workspace;
            }
        }

        return $args;
    }

    public function workspace_services_set_role($args) {
        if ($args['workspace']->hasService(self::KEY_FOR_WORKSPACE)) {
            $new_right = $args['new_right'];
            $this->update_user_status($args['workspace']->objects()->get(self::KEY_FOR_WORKSPACE)->id, $args['user'], !($new_right === $args['rights']['user']));
        }

        return $args;
    }

    public function workspace_users_services_delete($args) {
        if ($args['workspace']->hasService(self::KEY_FOR_WORKSPACE)) {
            $board_id = $args['workspace']->objects()->get(self::KEY_FOR_WORKSPACE)->id; 

            if ($this->check_if_user_exist($board_id, $args['user']))
            {
                try {
                    $this->remove_user($board_id, $args['user']);
                } catch (\Throwable $th) {
                    throw $th;
                }
            }   
        }

        return $args;
    }

    public function wsp_block($args) {
        if ($args['workspace']->objects()->get(self::KEY_FOR_WORKSPACE) !== null) {
            $args['plugin']->include_workspace_module('mel_wekan', 'workspace.js', 'js');
            $args['layout']->setNavBarSetting('wekan', 'view_kanban', false, 4);
        }

        return $args;
    }

    #endregion

    public function __api()
    {
        return $this->wekanApi;
    }
}
