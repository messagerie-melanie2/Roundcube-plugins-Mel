<?php
include_once __DIR__.'/lib/Workspace.php';

class mel_workspace extends bnum_plugin
{
    public const PAGE_MAX = 16;
    public const KEY_TASK = 'tasks';
    public const KEY_AGENDA = 'calendar';
    public const KEY_DRIVE = 'doc';
    public const KEY_TCHAT = 'tchat';
    
    /**
     * @var string
     */
    public $task = '.*';

    private static $_workspaces;
    /**
     * @var WorkspacePageLayout
     */
    private $workspacePageLayout;

  /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->require_plugin('mel_helper');

        switch ($this->get_current_task()) {
            case 'workspace':
                $this->register_task('workspace');

                if ($this->is_index_action()) {
                    $this->_setup_index_action();
                }
                else if ($this->get_current_task() === 'workspace') {
                    $this->_setup_workspace_actions();
                }

                $this->_setup_external_actions();
                break;

            case 'bnum':
                    // Ajoute le bouton en fonction de la skin
                    $need_button = 'taskbar';

                    if (class_exists("mel_metapage")) {
                        $need_button = $this->rc()->plugins->get_plugin('mel_metapage')->is_app_enabled('app_workspace') ? $need_button : 'otherappsbar';
                    }
                
                    if ($need_button)
                    {
                        $this->add_button([
                            'command' => "workspace",
                            'class'	=> 'wsp button-wsp icon-mel-workplace',
                            'classsel' => 'wsp button-wsp button-selected icon-mel-workplace',
                            'innerclass' => 'wsp button-inner',
                            'label'	=> 'my_workspaces',
                            'title' => 'my_workspaces',
                            'type'       => 'link',
                            'domain' => "mel_workspace",
                            'data-task' => 'workspace'
                        ], $need_button);
                    }

                    self::IncludeNavBarComponent();
                break;
            
            default:
                # code...
                break;
        }

        $this->_hook_actions();
    }

    #region pages
    public function show_workspaces() {
        $this->add_texts('localization/index', true);
        $this->include_css('workspace_list.css');
        $this->include_css('index.css');
        $this->load_script_module('index');
        $this->include_web_component()->Base();
        $this->include_web_component()->Tabs();
        $this->include_web_component()->PressedButton();
        $this->include_web_component()->InfiniteScrollContainer();
        $this->include_web_component()->Avatar();
        self::IncludeWorkspaceBlockComponent();

        $this->add_handler('subscribed', [$this, 'handler_subscribed']);
        $this->add_handler('publics', [$this, 'handler_publics']);
        $this->add_handler('archived', [$this, 'handler_archived']);
        $this->add_handler('publiccount', [$this, 'handler_public_count']);

        $this->rc()->output->set_env('visu-mode', $this->get_config('wsp-visu-mode', 'cards'));

        $this->rc()->output->send('mel_workspace.index');
    }

    public function show_workspace() {
        include_once __DIR__.'/lib/WorkspacePage.php';

        $uid = $this->get_input('_uid');
        $workspace = new Workspace($uid, true);

        $plugin = $this->exec_hook('wsp.show', [
            'workspace' => $workspace,
            'layout' => new WorkspacePageLayout(),
            'plugin' => $this
        ]);

        $plugin ??= [];

        $this->workspacePageLayout = $plugin['layout'] ?? new WorkspacePageLayout();

        $this->workspacePageLayout->fourthRow()->append(12, $this->workspacePageLayout->htmlModuleBlock(['id' => 'module-agenda']));

        $this->rc()->output->add_handlers(array(
            'wsp.row.first'  => [$this, 'handler_get_row'],
            'wsp.row.second' => [$this, 'handler_get_row'],
            'wsp.row.third'  => [$this, 'handler_get_row'],
            'wsp.row.fourth' => [$this, 'handler_get_row'],
            'wsp.row.other'  => [$this, 'handler_get_row'],
        ));

        $this->include_css('workspace.css');
        self::IncludeWorkspaceModuleComponent();
        $this->include_module('agenda.js', 'js/lib/Parts');
        $this->load_script_module('page.workspace.js');
        $this->rc()->output->set_env('current_workspace_uid', $uid);
        $this->rc()->output->set_env('current_workspace_services_actives', $workspace->services());
        $this->rc()->output->set_env('current_workspace_users', $workspace->users(true)->select(function ($k, $v) {
            return ['email' => $v->email, 'name' => $v->name, 'fullname' => $v->fullname, 'is_external' => $v->is_external];
        })->toDictionnary(function ($k, $v) {
            return $v['email'];
        }, function ($k, $v) {
            return $v;
        }));

        $this->rc()->output->set_env('current_workspace_color', $workspace->color());
        $this->rc()->output->set_env('current_workspace_is_public', $workspace->isPublic());
        

        $this->rc()->plugins->get_plugin('calendar')->include_script('lib/js/fullcalendar.js');
        $this->rc()->plugins->get_plugin('calendar')->include_script('lib/js/scheduler.js');
        $this->rc()->plugins->get_plugin('calendar')->include_script('lib/js/moment_fr.js');
        $this->rc()->plugins->get_plugin('calendar')->include_stylesheet('lib/js/scheduler.css');
        $this->rc()->output->set_env("wsp_shares",             $workspace->users_mail(true));
        
        include_once __DIR__.'/lib/NavBar.php';

        $navbar = new NavBar($uid);
        $navbar->add_css($this->local_skin_path().'/navbar.css');
        $navbar->add_css('/'.$this->local_skin_path().'/material-symbols.css');
        // $navbar->add_module('js/lib/navbar.js');

        $this->rc()->output->set_env('navbar', $navbar->get());

        // $this->add_handler('navbar', function() use ($navbar) {
        //     return $navbar->get();
        // });

        self::IncludeNavBarComponent();

        $this->rc()->output->send('mel_workspace.workspace');
    }

    public function action_workspace() {
        include_once __DIR__.'/lib/NavBar.php';
        $uid = $this->get_input('_uid');

        $navbar = new NavBar($uid);
        $navbar->add_css($this->local_skin_path().'/navbar.css');
        $navbar->add_css('/'.$this->local_skin_path().'/material-symbols.css');
        // $navbar->add_module('js/lib/navbar.js');

        $this->rc()->output->set_env('navbar', $navbar->get());

        $this->add_handler('navbar', function() use ($navbar) {
            return $navbar->get();
        });

        self::IncludeNavBarComponent();

        $this->rc()->output->send('mel_workspace.navbar');
    }
    #endregion

    #region actions
    public function check_uid() {
        $return = 3;

        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);

        if ($uid === "" || $uid === null) $return = 2;
        else if (Workspace::IsUIDValid($uid)) {
            $workspace = new Workspace($uid);
            $return = $workspace->exists() ? 0 : 1;
        }

        $this->sendEncodedExit($return);
    }

    public function create() {
        try {
            $data = [
                "avatar" => rcube_utils::get_input_value("avatar", rcube_utils::INPUT_POST),
                "title" => rcube_utils::get_input_value("title", rcube_utils::INPUT_POST),
                "uid" => rcube_utils::get_input_value("custom_uid", rcube_utils::INPUT_POST),
                "desc" => rcube_utils::get_input_value("desc", rcube_utils::INPUT_POST),
                "end_date" => rcube_utils::get_input_value("end_date", rcube_utils::INPUT_POST),
                "hashtag" => rcube_utils::get_input_value("hashtag", rcube_utils::INPUT_POST),
                "visibility" => rcube_utils::get_input_value("visibility", rcube_utils::INPUT_POST),
                "users" => rcube_utils::get_input_value("users", rcube_utils::INPUT_POST),
                "services" => rcube_utils::get_input_value("services", rcube_utils::INPUT_POST) ?? [],
                "color" => rcube_utils::get_input_value("color", rcube_utils::INPUT_POST),
                "service_params" => rcube_utils::get_input_value("_services_params", rcube_utils::INPUT_POST),
            ];

            if ($data["color"] === "" || $data["color"] === null) $data["color"] = "#FFFFFF";
            if ($data["uid"] === null || $data["uid"] === "") $data['uid'] = Workspace::GenerateUID($data["title"]);

            $retour = [
                "errored_user" => [],
                "existing_users" => []
            ];

            $user = driver_mel::gi()->getUser();
            $workspace = new Workspace($data["uid"]);
            $workspace->title($data['title'])
                    ->logo($data['avatar'])
                    ->description($data['desc'])
                    ->creator($user->uid)
                    ->created(new DateTime('now'))
                    ->modified(new DateTime('now'))
                    ->isPublic((($data["visibility"] === "private") ? false : true))
                    ->hashtag($data['hashtag'])
                    ->color($data['color'])
                    ->settings()->set('end_date', $data['end_date']);
            
            $workspace->save();
            $workspace->load();

            $workspace->add_owners($user->email);

            if (isset($data['users']) && count($data['users']) > 0) {
                $retour = $workspace->add_users(...$data['users']);

                if (isset($retour) && isset($retour['existing_users']) && count($retour['existing_users']) > 0) {
                    foreach ($retour['existing_users'] as $userData) {
                        $just_created = $userData['just_created'];

                        if (class_exists("mel_notification") && !$just_created) {
                            $user_id = $userData['user'];
                            $this->_notify_user($user_id, $workspace->get(), $user_id);
                        }
                    }
                }
            }

            $services = $this->_set_services($workspace, $data['services'], $data['service_params']);

            $workspace->save();

            $retour["workspace_uid"] = $workspace->uid();

            $retour["uncreated_services"] = $services;

            $this->sendEncodedExit($retour);
        } catch (\Throwable $th) {
            $func = "create";
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func] Un erreur est survenue lors de la création de l'espace de travail ''".$workspace->title."'' !");
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getTraceAsString());
            mel_logs::get_instance()->log(mel_logs::ERROR, "###[mel_workspace->$func]".$th->getMessage());
        }
    } 

    public function workspaces_search() {
        $type = $this->get_input_post('_type');
        $page = $this->get_input_post('_page');

        $html = '';

        switch ($type) {
            case 'public':
                $html = $this->_show_block(3, $page);
                break;
            
            case 'count_public':
                $html = ceil(count($this->_search_publics_workspaces($this->get_input_post('_search'))) / self::PAGE_MAX);
                break;
            
            default:
                throw new Exception("###[workspaces_search]Type de recherche ''$type'' inconnue !", 1);
        }

        $this->sendEncodedExit($html);
    }

    public function toggle_favorite() {
        $uid = $this->get_input_post('_id');

        $wsp = Workspace::ToggleFavoriteWsp($uid);

        $this->sendEncodedExit(['newState' => $wsp->isFavorite()]);
    }

    public function set_visu_mode() {
        $mode = $this->get_input_post('_mode');

        $this->rc()->user->save_prefs(array('wsp-visu-mode' => $mode));

        $this->sendEncodedExit('ok');
    }
    #endregion

    #region handlers
    public function handler_subscribed($args) {
        $args['class'] = 'workspace-list contents';
        $html = html::div($args, $this->_show_block(0));
        return $html;
    }

    public function handler_publics($args) {
        $args['class'] = 'workspace-list contents';
        $html = html::div($args, $this->_show_block(1));
        return $html;
    }

    public function handler_archived($args) {
        $args['class'] = 'workspace-list contents';
        $html = html::div($args, $this->_show_block(2));
        return $html;
    }

    public function handler_public_count($args) {
        return ceil(count((driver_mel::gi()->workspace())->listPublicsWorkspaces()) / self::PAGE_MAX);
    }

    public function handler_get_row($args) {

        switch ($args['name']) {
            case 'wsp.row.first':
                return $this->workspacePageLayout->firstRow()->get();

            case 'wsp.row.second':
                return $this->workspacePageLayout->secondRow()->get();

            case 'wsp.row.third':
                return $this->workspacePageLayout->thirdRow()->get();

            case 'wsp.row.fourth':
                return $this->workspacePageLayout->fourthRow()->get();
            
            default:
                return $this->workspacePageLayout->otherRow()->get();
        }

        return '';
    }
    #endregion

    #region public_functions
    public function include_workspace_module($plugin, $name = 'module', $path = 'js/lib') {
        //$this->load_script_module_from_plugin($plugin, $name, $path);
        $this->include_script_from_plugin($plugin, "$path/$name/scriptType:module", 'head');//->include_module($plugin, $name, $path);
    }

    public function include_workspace_object() {
        include_once __DIR__.'/lib/WorkspacePage.php';
        return $this;
    }
    #endregion

    #region private_functions
    private function _show_block($mode, $page = null) {
        $html = '';
        $workspaces = null;
        switch ($mode) {
            case 0:
                $workspaces = self::LoadWorkspaces(1);
                break;

            case 1:
                $workspaces = (driver_mel::gi()->workspace())->listPublicsWorkspaces('modified', true, self::PAGE_MAX, (($page ?? 1) - 1)*self::PAGE_MAX);
                break;

            case 2:
                $workspaces = self::LoadWorkspaces(2);
                break;

            case 3:
                $search = $this->get_input_post('_search');

                if (!isset($search) || $search === '') return $this->_show_block(1);
                else {
                    $workspaces = $this->_search_publics_workspaces($search, (($page ?? 1) - 1)*self::PAGE_MAX, self::PAGE_MAX);//$workspace->getList(null, null, $operators, 'modified', true, (($page ?? 1) - 1)*self::PAGE_MAX, self::PAGE_MAX, ["workspace_title"]);
                }
                break;
            
            default:
                # code...
                break;
        }

        if (isset($workspaces)) {
            $html = self::GetWorkspaceBlocks($workspaces);
        }

        return $html;
    }

    private function _search_publics_workspaces($search, $offset = null, $max = null) {
        $workspace = driver_mel::gi()->workspace();
        $workspace->ispublic = true;
        $workspace->title = "%$search%";

        $operators =  [
            'ispublic' => LibMelanie\Config\MappingMce::eq,
            'title' => LibMelanie\Config\MappingMce::like,
        ];

        return $workspace->getList(null, null, $operators, 'modified', true, $max, $offset, ["workspace_title"]);
    }

    private function _notify_user($userid, $workspace, $tmp_user = null) {
        $canNotify = true;
        $user_last_login = mel_helper::last_login($userid);
        
        if (class_exists("mel_notification") && isset($user_last_login)) {
            if (mel_helper::check_date_past($user_last_login, 15)) $canNotify = false;
        } else $canNotify = false;

        if ($canNotify) {
            mel_notification::notify('workspace', driver_mel::gi()->getUser()->name.$this->gettext("mel_workspace.notification_title").'"'.$workspace->title.'"', $this->gettext("mel_workspace.click_for_open"), [
                [
                    'href' => "./?_task=workspace&_action=workspace&_uid=".$workspace->uid,
                    'text' => $this->gettext("mel_workspace.open"),
                    'title' => $this->gettext("mel_workspace.click_for_open"),
                    'command' => "event.click"
                ]
            ], $tmp_user);
        }
        else {
            mel_helper::include_mail_body();
            include_once 'lib/wsp_mail_body.php';
            $email = $this->get_worskpace_services($workspace)[self::EMAIL] ? (self::get_wsp_mail($workspace_id) ?? driver_mel::gi()->getUser()->email) : driver_mel::gi()->getUser()->email;

            $bodymail = new WspMailBody('mel_workspace.email');

            $bodymail->user_name = driver_mel::gi()->getUser()->name;
            $bodymail->user_email = driver_mel::gi()->getUser()->email;
            $bodymail->wsp_name = $workspace->title;
            $bodymail->wsp_creator = $workspace->creator;
            $bodymail->wsp_last__action_text = $workspace->created === $workspace->modified ? 'Crée le' : 'Mise à jour';
            $bodymail->wsp_last__action_date = DateTime::createFromFormat('Y-m-d H:i:s', $workspace->modified)->format('d/m/Y');
            $bodymail->logobnum = MailBody::load_image(__DIR__.'/skins/elastic/pictures/logobnum.png', 'png');
            $bodymail->bnum_base__url = 'http://mtes.fr/2';
            $bodymail->url = 'https://mel.din.developpement-durable.gouv.fr/bureau/?_task=workspace&_action=workspace&_uid='.$workspace->uid;

            $div = ['<div style="display:flex">'];
            $shares = $workspace->shares;

            $i = 0;
            foreach ($shares as $user) {
                if ($i++ < 2) {
                    $image = MailBody::load_image($this->rc->config->get('rocket_chat_url').'avatar/'.$user->user_uid);

                    if (MailBody::image_loaded()) $div[] = "<img src=\"$image\" style=\"width:36px;height:36px;border-radius:100%;margin-left:-15px;border: solid thick white;\" />";
                    else $div[] = "<div style=\"text-align: center;line-height: 25px;display:inline-block;width:36px;height:36px;border-radius:100%;background-color:#7DD0C2;margin-left:-15px;border: solid thick white;\"><span>".substr(driver_mel::gi()->getUser($user->user_uid)->name, 0, 2)."</span></div>";
                }
                else {
                    $i = count($shares) - 2;

                    if ($i > 99) $i = ">99";
                    else $i = "+$i";

                    $div[] = "<div style=\"text-align: center;line-height: 25px;display:inline-block;width:36px;height:36px;border-radius:100%;background-color:#7DD0C2;margin-left:-15px;border: solid thick white;\"><span>$i</span></div>";
                    
                    break;
                }
            }

            $div[] = '</div>';

            $bodymail->wsp_shares_rounded = implode('', $div);

            $subject = $bodymail->subject();
            $message = $bodymail->body();

            $is_html = true;
            mel_helper::send_mail($subject, $message, $email, ['email' => driver_mel::gi()->getUser($userid)->email, 'name' => driver_mel::gi()->getUser($userid)->name], $is_html);
        }
    }
        #region register_actions
        private function _setup_index_action() {
            $this->register_action('index', [$this, 'show_workspaces']);
        }

        private function _setup_external_actions() {
            $this->register_actions(
                [
                    'navbar' => [$this, 'action_workspace'],
                    'check_uid' => [$this, 'check_uid'],
                    'create' => [$this, 'create'],
                    'search' => [$this, 'workspaces_search'],
                    'toggle_favorite' => [$this, 'toggle_favorite'],
                    'set_visu_mode' => [$this, 'set_visu_mode']
                ]
            );
        }

        private function _setup_workspace_actions() {
            $this->register_action('workspace', [$this, 'show_workspace']);
        }
        #endregion

        #region hook_actions
        private function _hook_actions() {
            $this->add_hook('webcomponents.scroll.count', [$this, 'webcomponentScrollCount']);
            $this->add_hook('webcomponents.scroll.data', [$this, 'webcomponentScrollData']);
        }

        public function webcomponentScrollCount($args) {
            $namespace = $args['namespace'];

            switch ($namespace) {
                case 'workspace.publics':
                    $args['count'] = ceil(count((driver_mel::gi()->workspace())->listPublicsWorkspaces()) / self::PAGE_MAX);
                    break;
                
                default:
                    # code...
                    break;
            }

            return $args;
        }

        public function webcomponentScrollData($args) {
            $page = $args['page'];
            $namespace = $args['namespace'];

            switch ($namespace) {
                case 'workspace.publics':
                    $args['html'] = $this->_show_block(1, $page);
                    break;
                
                default:
                    # code...
                    break;
            }

            return $args;
        }
        #endregion

        #region services
        private function _set_services(&$workspace, $services, $default_value = null) {
            $plugins = $this->rc()->plugins->exec_hook('workspace.services.set', ['workspace' => $workspace, 'services' => $services, 'default_values' => $default_value]);

            if (isset($plugins) && isset($plugins['workspace'])) $workspace = $plugins['workspace']; 

            $services = $this->_set_tasklist($workspace, $services, $default_value);
            $services = $this->_set_agenda($workspace, $services);
        }

        private function _set_tasklist(&$workspace, $services, $default_value)
        {
            if (array_search(self::KEY_TASK, $services) === false) return $services;
    
            include_once "../mel_moncompte/ressources/tasks.php";
            $tasklist = $workspace->objects()->get(self::KEY_TASK);//$this->get_object($workspace, $tasks);
    
            if ($tasklist !== null) //Si la liste de tâche existe déjà
            {
                $mel = new M2taskswsp($tasklist);
                if ($mel->getTaskslist() !== null)
                {
                    foreach ($users as $s)
                    {
                        $mel->setAcl($s, ["w"]);
                    }
                }
                else {
                    //$this->remove_object($workspace, $tasks);
                    $workspace->objects()->remove(self::KEY_TASK);
                    return $this->create_tasklist($workspace, $services, $users, $update_wsp, $default_value);
                }
            }
            else {//Sinon
                $mel = new M2taskswsp($workspace->uid());
    
                if ($mel->createTaskslist($workspace->title()))
                {
                    foreach ($users as $s)
                    {
                        $mel->setAcl($s, ["w"]);
                    }
    
                    $taskslist = $mel->getTaskslist();
                    $workspace->objects()->set(self::KEY_TASK, $taskslist->id);
                }
            }
    
            $key = array_search(self::KEY_TASK, $services);
    
            //$this->create_wekan($workspace, $services, $users, $default_value);
    
            if ($key !== false) unset($services[$key]);
    
            return $services;
        }

        private function _set_agenda(&$workspace, $services) {
            mel_helper::load_helper()->include_utilities();
            $color = $workspace->color();
    
            foreach ($workspace->users() as $s) mel_utils::cal_add_category($s->user, 'ws#'.$workspace->uid(), $color);
    
            $workspace->objects()->set(self::KEY_AGENDA, true);
            
            $key = array_search(self::KEY_AGENDA, $services);
    
            if ($key !== false) unset($services[$key]);

            return $services;
        }
        #endregion
    #endregion

    #region statics
    public static function GetWorkspaceLogo($workspace) {
        $logo = $workspace->logo;

        if (strpos($logo ,'/bureau') !== false) $logo = str_replace('/bureau', '', $logo);

        if ($logo !== null && strpos($logo, 'mel_elastic') === false && strpos($logo, 'elastic') !== false) {
            $logo = str_replace('elastic', 'mel_elastic', $logo);
        }

        return $logo;
    }

    public static function IncludeWorkspaceBlockComponent() {
        WebComponnents::Instance()->____METHODS____('_include_component', 'workspace_block_item.js', '/js/lib/WebComponents', 'mel_workspace');
    }

    public static function IncludeNavBarComponent() {
        WebComponnents::Instance()->____METHODS____('_include_component', 'navbar.js', '/js/lib/WebComponents', 'mel_workspace');
    }

    public static function IncludeWorkspaceModuleComponent() {
        WebComponnents::Instance()->____METHODS____('_include_component', 'workspace_module_block.js', '/js/lib/WebComponents', 'mel_workspace');
    }

    public static function IncludeWorkspacesBlocks($workspaces, $callback = null) {
        self::IncludeWorkspaceBlockComponent();

        $html = '';

        $it = 0;
        foreach (self::GetWorkspaceBlocksGenerator($workspaces) as $block) {
            if (isset($callback)) {
                $result = call_user_func($callback, ['ignore' => false, 'break' => false, 'block' => $block, 'it' => $it]);
                if (isset($result)) {
                    if (isset($result['ignore']) && $result['ignore'] === true) continue;
                    if (isset($result['break']) && $result['break'] === true) break;
                    if (isset($result['block'])) $html .= $result['block'];
                }
            }
            else $html .= $block;

            ++$it;
        }

        unset($it);

        return $html;
    }

    public static function GetWorkspaceBlocks($workspaces) {
        $favorites = rcmail::get_instance()->config->get('workspaces_personal_datas', null);

        $html = '';

        if (isset($favorites)) $workspaces = mel_helper::Enumerable($workspaces)->orderBy(function ($k, $v) use($favorites) {
            return isset($favorites) && isset($favorites[$v->uid]) && $favorites[$v->uid]['tak'] ? new DateTime(date('Y-m-d H:i:s', PHP_INT_MAX)) : new DateTime($v->modified);
        }, true);

        foreach (self::GetWorkspaceBlocksGenerator($workspaces) as $block) {
           $html .= $block;
        }

        return $html;
    }

    public static function GetWorkspaceBlocksGenerator($workspaces) {
        foreach ($workspaces as $workspace) {
            yield self::GetWorkspacesBlock($workspace);
        }
    }

    public static function GetWorkspacesBlock($workspace) {
        $workspace = Workspace::FromWorkspace($workspace);

        mel_helper::load_helper()->include_utilities();
        $rc = rcmail::get_instance();
        $name = 'mel_workspace.workspace_block';

        // $favorites = $rc->config->get('workspaces_personal_datas', null);
        // $hashtags = $workspace->hashtag();

        $users = [];
        {
            $it = 0;
            $shared = $workspace->users();

            foreach ($shared as $value) {
                $tmp = driver_mel::gi()->getUser($value->user);

                if ($tmp) {
                    $tmp = $rc->plugins->exec_hook('bnum.avatar', ['user' => $tmp, 'url' => $tmp->email]);
                    if (isset($tmp) && isset($tmp['url'])) {              
                        $users[] = implode('|', [$tmp['url'], $tmp['user']->name]);
                        ++$it;
                    }
                }

                if ($it > 3) {
                    $users[] = implode('|', [count($shared) - 4, '']);
                    break;
                }
            }
        }

        $block = mel_helper::Parse($name);

        $block->id = $workspace->uid();
        $block->picture = self::GetWorkspaceLogo($workspace->get());
        $block->tag = $workspace->hashtag();//isset($hashtags) && count($hashtags) > 0 ? ($hashtags[0] ?? '') : '';
        $block->tag = mel_utils::for_data_html($block->tag);
        $block->title = mel_utils::for_data_html($workspace->title());
        $block->description = mel_utils::for_data_html($workspace->description());
        $block->users = implode(',', $users);
        $block->edited = $workspace->modified();
        $block->color = $workspace->color();//self::_GetWorkspaceSetting($workspace, 'color');
        $block->favorite = $workspace->isFavorite();//isset($favorites) && isset($favorites[$workspace->uid]) && $favorites[$workspace->uid] && $favorites[$workspace->uid]['tak'] ? $favorites[$workspace->uid]['tak'] : false;
        $block->private = !$workspace->isPublic();
        //$block->canBeFavorite = !($workspace->isArchived() || ($workspace->isPublic() && !$workspace->hasUser(driver_mel::gi()->getUser()->uid)));

        return $block->parse();
    }

    private static function _GetWorkspaceSetting(&$workspace, $key)
    {
        if ($workspace->settings === null)
            return null;
        else
            return json_decode($workspace->settings)->$key;
    }

    /**
     * Charge les espaces de travail de l'utilisateur
     *
     * @return void
     */
    public static function LoadWorkspaces($mode = 0, $limit = null, $offset = null)
    {
        if (!isset(self::$_workspaces)) self::$_workspaces = driver_mel::gi()->getUser()->getSharedWorkspaces(null, false, $limit, $offset);

        $data = self::$_workspaces;

        switch ($mode) {
            case 1:
                $data = mel_helper::Enumerable($data)->where(function ($k, $v) {
                    return !$v->isarchived;
                });
                break;
            
            case 2:
                $data = mel_helper::Enumerable($data)->where(function ($k, $v) {
                    return $v->isarchived;
                });
                break;

            default:
                # code...
                break;
        }

        return $data;
    }

    public static function GetWorkspace($uid)
    {
        $workspace = driver_mel::gi()->workspace([driver_mel::gi()->getUser()]);
        $workspace->uid = $uid;
        $workspace->load();
        return $workspace;
    }
    #endregion

}