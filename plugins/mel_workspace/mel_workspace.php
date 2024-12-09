<?php
include_once __DIR__.'/lib/Workspace.php';
use LibMelanie\Api\Defaut\Workspaces\Share;

/* Liste de hooks disponibles : 
- wsp.show => Est appelé lorsque l'espace doit s'afficher. On attend des plugins les données de la barre de navigations, le javascripts, css etc....
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   layout, objet de type WorkspacePageLayout, c'est ici qu'on va ajouter du html ou indiquer les données de la barre de navigation
                   plugin, plugin mel_workspace

- wsp.services.user.add => Est appelé lorsque un utilisateur est ajouté à l'espace
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   plugin, plugin mel_workspace
    
- workspace.services.set.role => Est appelé lorsqu'un utilisateur change de rôle
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   plugin, plugin mel_workspace
                   user, id de l'utilisateur qui a changer de rôle
                   new_right, Nouveau rôle
                   reload, true si la page doit être rechargée
                   rights, droits disponibles

- workspace.users.services.delete => Est appelé lorsqu'un utilisateur est supprimé d'un espace
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   plugin, plugin mel_workspace
                   user, id de l'utilisateur supprimée

- workspace.service.delete => Est appelé lorsque l'espace est supprimée
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   plugin, plugin mel_workspace
                   services, Services qui vont être supprimée

- workspace.params.services.show => Est appelé lorsque l'on affiche la liste des applications disponible pour un espace. Doit gérer le paramètre "continuer" pour savoir si on doit l'afficher ou non
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   plugin, plugin mel_workspace 
                   app, application en cours
                   enabled, si l'application est activé ou non dans l'espace
                   continue, à changer, si retourné à vrai, l'application ne sera pas affichée

- workspace.params.services.show.update => Est appelé lorsque l'on affiche la liste des applications disponible pour un espace. Permet d'afficher ou non un système pour modifier le fonctionnement du service
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   plugin, plugin mel_workspace                     
                   app, application en cours
                   enabled, si l'application est activé ou non dans l'espace
                   html, données à mettre dedans ou non

- workspace.services.set => Est appelé lorsqu'un espace est crée ou un utilisateur ajouté. Permet de créer ou non le service
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   services, services actifs ou non
                   default_values, valeurs par défauts

- workspace.service.get => Récupère le service
    - arguments => workspace, objet de type Workspace. Contient tout les données de l'espace
                   services, liste des services, à ajouter le votre
*/

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
     * @var Workspace
     */
    private $workspace;

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
                    $uid = $this->get_input('_uid', rcube_utils::INPUT_GET);
                    if ($uid !== null){
                        $this->redirect('workspace', 'workspace', [
                            '_uid' => $uid,
                            '_force_bnum' => 1
                        ]);
                        return;
                    }

                    $this->_setup_index_action();
                }
                else if ($this->get_current_task() === 'workspace') {
                    $this->_setup_workspace_actions();
                }

                $this->_setup_external_actions();
                break;

            case 'bnum':
                $this->add_texts('localization', true);
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
            
            case 'forum':
                if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                    try {
                        if ($this->rc()->output !== null) {
                            $this->include_module('forum_additions.js', 'js/lib/forums');
                        }
                    } catch (\Throwable $th) {
                        //throw $th;
                    }
                }
                break;

            case 'tasks':
                if ($this->is_index_action()) {
                    $this->include_module('page.tasks.js');
                }
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
        $this->add_texts('localization/workspace', true);

        $uid = $this->get_input('_uid');

        if (!isset($uid)) {
            $this->redirect('workspace');
            return;
        }

        $workspace = new Workspace($uid, true);

        if ($workspace->title() === null ) {
            $this->redirect('workspace');
            return;
        }

        if ($workspace->hasUser($this->get_user()->uid)) {
            $plugin = $this->exec_hook('wsp.show', [
                'workspace' => $workspace,
                'layout' => new WorkspacePageLayout(),
                'plugin' => $this
            ]);
    
            $plugin ??= [];
    
            $this->workspacePageLayout = $plugin['layout'] ?? new WorkspacePageLayout();
    
            $this->workspacePageLayout->fourthRow()->append(12, $this->workspacePageLayout->htmlModuleBlock(['id' => 'module-agenda']));
            $this->workspacePageLayout->setNavBarSetting('home', 'home', false, 0);
            $this->workspacePageLayout->setNavBarSetting('mel_metapage.calendar', 'calendar_month', true, 1);
    
            if ($workspace->objects()->has(self::KEY_TASK)) $this->workspacePageLayout->setNavBarSetting('tasks', 'check_box', false, 6);
            
            if ($workspace->isAdmin()) $this->workspacePageLayout->setNavBarSetting('workspace_params', 'settings', false, 999);
            else {
                $this->workspacePageLayout->setNavBarSetting('workspace_user', 'group', false, 999);
                $this->include_web_component()->Avatar();
            }
            
    
            $this->rc()->output->add_handlers(array(
                'wsp.row.first'  => [$this, 'handler_get_row'],
                'wsp.row.second' => [$this, 'handler_get_row'],
                'wsp.row.third'  => [$this, 'handler_get_row'],
                'wsp.row.fourth' => [$this, 'handler_get_row'],
                'wsp.row.other'  => [$this, 'handler_get_row'],
            ));
    
            $this->workspace = $workspace;
            $this->rc()->output->add_handlers([
                'settings_or_member' => [$this, 'handler_settings_or_member']
            ]);
    
            $this->include_css('workspace.css');
            self::IncludeWorkspaceModuleComponent();
            $this->include_module('agenda.js', 'js/lib/Parts');
            $this->load_script_module('page.workspace.js');
            $this->include_script('js/params.js');
    
            if (!$workspace->isAdmin()) $this->include_module('page.user.js');
    
            $this->rc()->output->set_env('current_workspace_uid', $uid);
            $this->rc()->output->set_env('current_workspace_services_actives', $workspace->services());
            $this->rc()->output->set_env('current_workspace_users', $workspace->users(true)->select(function ($k, $v) {
                return ['email' => $v->email, 'name' => $v->name, 'fullname' => $v->fullname, 'is_external' => $v->is_external];
            })->toDictionnary(function ($k, $v) {
                return $v['email'];
            }, function ($k, $v) {
                return $v;
            }));
    
            $visibility = $this->get_config('workspace_modules_visibility', [])[$uid];
            $this->rc()->output->set_env('workspace_modules_visibility', $visibility);
            $this->rc()->output->set_env('current_workspace_color', $workspace->color());
            $this->rc()->output->set_env('current_workspace_is_public', $workspace->isPublic());
            
    
            $this->rc()->plugins->get_plugin('calendar')->include_script('lib/js/fullcalendar.js');
            $this->rc()->plugins->get_plugin('calendar')->include_script('lib/js/scheduler.js');
            $this->rc()->plugins->get_plugin('calendar')->include_script('lib/js/moment_fr.js');
            $this->rc()->plugins->get_plugin('calendar')->include_stylesheet('lib/js/scheduler.css');
            $this->rc()->output->set_env("wsp_shares",             $workspace->users_mail(true));

            if (class_exists('mel_forum')) $this->include_module('forum_additions.js', 'js/lib/forums');

            include_once __DIR__.'/lib/NavBar.php';

            $navbar = new NavBar($uid);
            $navbar->set_settings($this->workspacePageLayout->getNavBarSettings());
            $navbar->add_css($this->local_skin_path().'/navbar.css');
            $navbar->add_css('/'.$this->local_skin_path().'/material-symbols.css');
            // $navbar->add_module('js/lib/navbar.js');
    
            $this->rc()->output->set_env('navbar', $navbar->get());
    
            // $this->add_handler('navbar', function() use ($navbar) {
            //     return $navbar->get();
            // });
    
            self::IncludeNavBarComponent();

            if ($this->get_input('_page')) $this->rc()->output->set_env('start_page', $this->get_input('_page'));
        } else {
            $this->load_script_module('page.not_in_workspace.js');
            $this->rc()->output->set_env('current_workspace_uid', $uid);
            $this->rc()->output->set_env('current_workspace_is_public', $workspace->isPublic());
        }

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

    public function update_module_visibility() {
        $uid = $this->get_input_post('_uid');
        $task = $this->get_input_post('_key');
        $state = $this->get_input_post('_state');
        
        $visibility = $this->get_config('workspace_modules_visibility', []);

        if ($state) {
            if ($visibility[$uid] === null) $visibility[$uid] = [];

            $visibility[$uid][$task] = $state;
        }
        else if ($visibility[$uid] !== null) {
            unset($visibility[$uid][$task]);
            
            if (count($visibility[$uid]) === 0) unset($visibility[$uid]);
        } 
        
        $this->rc()->user->save_prefs(array('workspace_modules_visibility' => $visibility));

        echo true;
        exit;
    }

    function get_email_from_workspace()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = new Workspace($uid, true);//self::get_workspace($uid);
        $shares = $workspace->users(true);
        $array = [];
        $user = driver_mel::gi()->getUser()->uid;
        foreach ($shares as $key => $value) {
            if ($value->uid !== $user)
            {
                // $tmp = driver_mel::gi()->getUser($value->user);

                if (isset($value)) $array[] = "$value->fullname<$value->email>";
            }
                
        }
        echo json_encode($array);
        exit;
    }

    function get_hashtags()
    {
        $hashtag_label = rcube_utils::get_input_value("_hashtag", rcube_utils::INPUT_GPC);
        $hashtag = driver_mel::gi()->workspace_hashtag();
        $hashtag->label = "$hashtag_label%";
        $operators = ["label" => \LibMelanie\Config\MappingMce::like];
        $hashtags_raw = $hashtag->getList(null, null, $operators, "label", true);
        $hashtags = [];

        foreach ($hashtags_raw as $key => $value) {
            $hashtags[] = $value->hashtag;
        }

        $this->sendEncodedExit($hashtags);
    }

    #region actions/params

    public function join_user()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::Workspace($uid);//self::get_workspace($uid);
        if ($workspace->isPublic() === 1)
        {
            $workspace->add_users(driver_mel::gi()->getUser()->uid);
            $this->_add_users($workspace);
            $workspace->save();
            $admins = $workspace->getAdmins();//self::get_admins($workspace);
            foreach($admins as $admin)
            {
                if (class_exists("mel_notification"))
                {
                    mel_notification::notify('workspace', driver_mel::gi()->getUser()->name.' vient de rejoindre l\'espace "'.$workspace->title().'" !','',null,$admin);
                }
            }
            //récupérer tout les admins du workspaces
            //for each notif
        }
        else
            echo "denied";
        exit;
    }

    public function change_color()
    {
        // include_once "lib/mel_utils.php";
        mel_helper::load_helper()->include_utilities();
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $color = rcube_utils::get_input_value("_color", rcube_utils::INPUT_POST);
        $workspace = new Workspace($uid, true);//$this->update_setting($uid, "color", $color);
        $workspace->color($color);

        if ($workspace->get() !== null && $workspace->isAdmin($this->_CurrentUser()->uid))
        {
            foreach ($workspace->users() as $s)
            {
                mel_utils::cal_update_color($s->user, "ws#".$workspace->uid(), $color);
            }

            $workspace->save();
            echo "";
        }
        else
            echo "denied";
        exit;
    }

    function change_visibility()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = new Workspace($uid, true);//self::get_workspace($uid);

        if ($workspace->isAdmin($this->_CurrentUser()->uid))
        {
            // $isPublic = !$workspace->ispublic;
            // $workspace->ispublic = $isPublic;
            $workspace->isPublic(!$workspace->isPublic());
            $workspace->save();

            // try {
            //     $rocket = $this->rc->plugins->get_plugin('rocket_chat');
            //     $rocket->update_channel_type(
            //         $this->get_object($workspace, self::CHANNEL)->id,
            //         !$isPublic);
            // } catch (\Throwable $th) {
            //     //throw $th;
            // }

            echo "";
        }
        else 
            echo "denied";

        exit;
    }

    function change_logo()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $logo = rcube_utils::get_input_value("_logo", rcube_utils::INPUT_POST) ?? "false";
        $workspace = new Workspace($uid, true);//self::get_workspace($uid);

        if ($workspace->isAdmin($this->_CurrentUser()->uid))
        {
            //$workspace->logo = $logo;
            //self::edit_modified_date($workspace, false);
            $workspace->logo($logo);
            $workspace->save();
            echo "";
        }
        else 
            echo "denied";
        
        exit;
    }

    function update_primary_parameters()
    {
        $echoed = 'denied';

        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $type = rcube_utils::get_input_value("_type", rcube_utils::INPUT_POST);
        $val = rcube_utils::get_input_value("_val", rcube_utils::INPUT_POST);

        $wsp = new Workspace($uid, true);//self::get_workspace($uid);

        if ($wsp->isAdmin($this->get_user()->uid))
        {

            switch ($type) {
                case 'title':
                    //$wsp->title = $val;
                    $wsp->title($val);
                    break;
                case 'desc':
                    //$wsp->description = $val;
                    $wsp->description($val);
                    break;
                case 'hashtag':
                    //$wsp->hashtags = [$val];
                    $wsp->hashtag($val);
                    break;
                    
                default:
                    # code...
                    break;
            } 


            $echoed = $wsp->save();
        }
    
        $this->sendExit($echoed);
        //exit;
    }

        /**
     * Add users to workspace
     * 
     * @param string _uid POST
     * @param array _users POST
     */
    function add_users()
    {
        //get input
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $tmp_users = rcube_utils::get_input_value("_users", rcube_utils::INPUT_POST);
        //
        $workspace = new Workspace($uid, true);//self::get_workspace($uid);
        //get users
        $users = [];
        $noNotifUsers = [];
        $unexistingUsers = [];
        // foreach ($tmp_users as $key => $value) {
        //     $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $value);
        //     $user_exists = true;

        //     if ($tmp_user->uid === null && !$tmp_user->is_list) {
        //         if (rcmail::get_instance()->config->get('enable_external_users', false)) {
        //             $user_exists = driver_mel::gi()->create_external_user($value, $workspace);
        //         }
        //         else {
        //             $user_exists = false;
        //         }

        //         if ($user_exists) {
        //             $tmp_user = driver_mel::gi()->getUser(null, true, false, null, $value);
        //             $noNotifUsers[] = $value;
        //         }
        //         else {
        //             $unexistingUsers[] = $value;
        //         }
        //     }

        //     if ($user_exists) {
        //         foreach ($this->_add_internal_user($workspace, $tmp_user) as $cuser) {
        //             $users[] = $cuser;
        //         }
        //     }
        // }

        $users = $workspace->add_users(...$tmp_users);

        if (count($users['errored_user']) >= count($tmp_users)) {
            echo "no one was found";
            exit;
        }
        else {
            //get workspace
            if ($workspace->isAdmin($this->_CurrentUser()->uid)) {
                $this->_add_users($workspace, null, $noNotifUsers);
                //self::edit_modified_date($workspace, false);
                //save
                $workspace->save();
                //end
                echo json_encode($users['errored_user'] ?? []);
            }
            else echo "denied";

            if (!rcube_utils::get_input_value("_not_exist", rcube_utils::INPUT_POST)) exit;
        }
    }

    /**
     * Add users to workspace
     * 
     * @param Workspace $workspace
     * @param array $users
     * @param boolean $noNotif
     * @param array $noNotifUsers
     * 
     * @return void
     */
    function _add_users(&$workspace, $noNotif = false, $noNotifUsers = [])
    {
        $plugin = $this->exec_hook('wsp.services.user.add', [
            'workspace' => $workspace,
            'plugin' => $this
        ]);

        $plugin ??= [];

        $workspace = $plugin['workspace'] ?? $workspace;

        $this->_set_services($workspace, $workspace->services(true, true), null);
    }

    function update_user_rights()
    {
        $return = 'Unknown error';

        try {
            $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
            $user = rcube_utils::get_input_value("_id", rcube_utils::INPUT_POST);
            $new_right = rcube_utils::get_input_value("_right", rcube_utils::INPUT_POST);
            $workspace = new Workspace($uid, true);//self::get_workspace($uid);
            if ($workspace->isAdmin())
            {
             
                if ($workspace->getAdmins()->count() === 1 && $new_right === "w")
                {
                    $return = "you are the alone";
                }
                else {
                    //$workspace->shares[$user]->rights = $new_right;
                    $workspace->share($user)->rights = $new_right;
                    //self::edit_modified_date($workspace, false);
                    $workspace->save();
    
                    //$services = $this->get_worskpace_services($workspace);
    
                    // if ($services[self::CHANNEL])
                    //     $this->get_ariane()->update_owner($user, $this->get_object($workspace, self::CHANNEL)->id, $workspace->ispublic === 0 ? true : false, $new_right === Share::RIGHT_WRITE);
    
                    // if ($services[self::WEKAN])
                    //     $this->wekan()->update_user_status($this->get_object($workspace, self::WEKAN)->id, $user, !($new_right === Share::RIGHT_WRITE));
    
                    $plugin = $this->exec_hook('workspace.services.set.role', [
                        'workspace' => $workspace,
                        'user' => $user,
                        'new_right' => $new_right,
                        'reload' => false,
                        'rights' => ['owner' => Share::RIGHT_OWNER, 'user' => Share::RIGHT_WRITE],
                        'plugin' => $this
                    ]) ?? ['reload' => false];

                    if ($plugin['reload'] || $user === driver_mel::gi()->getUser()->uid) $return = "reload";
                }
            }
            else $return = "denied";
        } catch (\Throwable $th) {
            $return = "error";
            mel_logs::gi()->log(mel_logs::ERROR, '###[update_user_rights]'.$th->getMessage());
        }
        
        if (rcube_utils::get_input_value("_noexit", rcube_utils::INPUT_POST) !== 'ok') $this->sendExit($return);
    }

    function delete_user($uid = null, $user_to_delete = null, $exit = true, $forceDelete = false)
    {
        $return = 'Unknown return';

        if ($uid === null)
            $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        if ($user_to_delete === null)
            $user_to_delete = rcube_utils::get_input_value("_user_to_delete", rcube_utils::INPUT_POST);

        
        $workspace = Workspace::GetLoad($uid);//self::get_workspace($uid);
        $currentUserIsAdmin = $workspace->isAdmin();

        if($currentUserIsAdmin || $user_to_delete === driver_mel::gi()->getUser()->uid )
        {
            //Si il n'y a qu'un seul admin
            if ($currentUserIsAdmin && $workspace->getAdmins()->count() === 1 && !$forceDelete)
            {
                //Et que l'on veut se supprimer
                if ($user_to_delete === driver_mel::gi()->getUser()->uid)
                {
                    $return = "you are the alone";

                    if ($exit) $this->sendExit($return);
                    else return $return;
                }
            }

            $user_find = false;
            foreach ($workspace->users() as $key => $value) {
                if ($value->user === $user_to_delete)
                {                
                    $shares = $workspace->users();
                    unset($shares[$key]);
                    $workspace->updateUsers($shares);
                    //$this->delete_services_for_user($workspace, $user_to_delete, $this->get_worskpace_services($workspace, true, true));

                    $this->exec_hook('workspace.users.services.delete', [
                        'workspace' => $workspace,
                        'user' => $user_to_delete,
                        'plugin' => $this
                    ]);

                    $user_find = true;
                    break;
                }
            }

            //self::edit_modified_date($workspace, false);

            if ($user_find)
            {
                $workspace->save();

                if ($exit === true) mel_notification::notify("workspace", 'Vous avez été supprimé de l\'espace de travail "'.$workspace->title().'"', '', null, $user_to_delete);
            }

            $return = "";
        }
        else
            $return = "denied";

        if ($exit) $this->sendExit($return);
        else return $return;
    }

    function update_user_table_rights()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $this->workspace = self::Workspace($uid);
        $this->sendExit($this->setup_params_rights());
    }

    function update_app() {
        $return = '';

        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $app = rcube_utils::get_input_value("_app", rcube_utils::INPUT_POST);

        $workspace = self::Workspace($uid);

        if ($workspace->isAdmin() && !$workspace->hasService($app)) {
            $this->_set_services($workspace, array_merge($workspace->services(true, true), [$app]), null);
            $workspace->save();
        }
        else $return = 'denied';

        $this->sendExit($return);
    }

    function update_app_table()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);

        $this->sendExit($this->setup_params_apps(self::Workspace($uid)));
    }

    function archive_workspace()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::Workspace($uid);
        if ($workspace->isAdmin())
        {
            $workspace->isArchived(!$workspace->isArchived());
            $workspace->save();
            echo "";
        }
        else
            echo "denied";
        exit;
    }

    function delete_workspace()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::Workspace($uid);//self::get_workspace($uid);
        if ($workspace->isAdmin())
        {
            $shares = $workspace->users();
            foreach ($shares as $key => $value) {
                $this->delete_user($uid, $value->user, false, true);
            }
            $workspace->hashtag(null);
            $workspace->save();
            $workspace->load();

            $services = $workspace->services(true, true);//$this->get_worskpace_services($workspace, false, true);

            try {
                // if ($services[self::EMAIL] || $services[self::CLOUD])
                //     driver_mel::gi()->workspace_group($workspace->uid, [], false);  

                // if ($services[self::WEKAN])
                // {
                //     $wekan = $this->get_object($workspace, self::WEKAN);
                //     if ($wekan->updated !== true) $this->wekan()->delete_board($wekan->id);
                // }

                if (array_search(self::KEY_TASK, $services, true) !== false) {
                    $mel = new M2taskswsp($workspace->uid());
                    $mel->getTaskslist();
                    $mel->deleteTaskslist();

                }

                $this->exec_hook('workspace.service.delete', [
                    'services' => $services,
                    'workspace' => $workspace,
                    'plugin' => $this
                ]);

                // if ($services[self::TCHAP_CHANNEL])
                // {
                //     $can =true;
                //     try {
                //         $can = !($this->get_object($workspace, self::TCHAP_CHANNEL)->edited ?? false);
                //     } catch (\Throwable $th) {
                //         //throw $th;
                //     }
                //     if ($can)
                //     {
                //         if (class_exists('tchap')) $value = tchap::delete_tchap_room($this->get_object($workspace, self::TCHAP_CHANNEL)->id);
                //     }
                // }

            } catch (\Throwable $th) {
                throw $th;
            }

            $workspace->get()->delete();
            unset($workspace);

        }
        else
            echo "denied";
        exit;
    }

    function leave_workspace()
    {
        $uid = rcube_utils::get_input_value("_uid", rcube_utils::INPUT_POST);
        $workspace = self::Workspace($uid);//self::get_workspace($uid);
        $shares = $workspace->users();
        if (count($shares) === 1)
        {
            if (!$workspace->isAdmin()) {
                $_POST['_id'] = $this->get_user()->uid;
                $_POST['_right'] = Share::RIGHT_OWNER;
                $_POST['_noexit'] = 'ok';
                $workspace->share($_POST['_id'])->rights = $_POST['_right'];
                $workspace->save();
                $this->update_user_rights();
                echo 'yourealoneupgrade';
            }
            else echo "yourealone";
        }
        else
        {
            $nb_admin = 0;
            foreach ($shares as $key => $value) {
                if ($workspace->isAdmin($value->user))
                    ++$nb_admin;
            }
            if ($nb_admin === 1 && $workspace->isAdmin())
                echo 'youretheone';
            else {
                $this->delete_user($uid, driver_mel::gi()->getUser()->uid, false);
                echo '';
            }
        }
        exit;
    }

    #endregion action/params

    #endregion actions

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

    public function handler_settings_or_member($args) {
        $workspace = $this->workspace;

        if ($workspace->isAdmin()) return $this->setup_params_page();
        else return $this->setup_user_page();
    
    }

    function setup_user_page()
    {
        $env = [];
        $html = '<div class="wsp-params wsp-object" style="margin-top:30px;display:none">';
        $shares = $this->sort_user($this->workspace->users()); 
        $nbuser = count($shares);

        $html .= "<h2>Liste des membres ($nbuser)</h2>";
        $html .= '<div class="wsp-block">';

        foreach ($shares as $key => $value) {
            $user = driver_mel::gi()->getUser($value->user); 
            $tmp = $user->name;
            
            if (!isset($user)) continue;

            if (isset($tmp) || $tmp !== '')
            {
                $html .= html::div(["class" => "row member"], 
                html::div(["class" => "col-2 avatar-wsp"],
                    html::tag('bnum-avatar', ['class' => 'avatar-member', 'data-email' => $user->email, 'data-force-size' => '42px', 'style' => 'background-color:'.$this->workspace->color()])
                    // html::div(["class" => "dwp-round", "style" => "background-color:transparent"],
                    //     html::tag("img", ["src" => $this->rc()->config->get('rocket_chat_url')."avatar/".$value->user])
                    // )
                ).
                html::div(["class" => "col-10"],
                    html::tag("span", ["class" => "name"], driver_mel::gi()->getUser($value->user)->name.($this->workspace->isAdmin($value->user) ? html::tag("span", ["class" => "plus icofont-crown"]) : "")).
                    "<br/>".
                    html::tag("span", ["class" => "email"], driver_mel::gi()->getUser($value->user)->email ?? 'Adresse inconnue')
                )
                );
                $env[$user->email] = ['email' => $user->email, 'name' => $user->name, 'fullname' => $user->fullname, 'is_external' => $user->is_external];
            }
        }

        $html .= "</div></div>";

        return $html;

    }

    function setup_params_page()
    {
        $workspace = $this->workspace;
        $uid = $workspace->uid();
        $user_rights = $workspace->share()->rights;
        
        $html = mel_helper::Parse('mel_workspace.params');

        if ($user_rights === "l") $html->set_other_variable('users-right', '');
        else  $html->set_other_variable('users-rights', $this->setup_params_rights());

        //JJ/MM/YYYY HH:mm 
        $endDate = $workspace->settings()->get('end_date') ?? 'JJ/MM/YYYY HH:mm ';

        if ($endDate === '')
            $endDate = "JJ/MM/YYYY HH:mm ";

        $html->end_date = $endDate;
        $html->color = $workspace->color();
        $html->applications = $this->setup_params_apps();

        $html->title = $user_rights === Share::RIGHT_OWNER ? $workspace->title() : '';
        $html->desc = ($user_rights === Share::RIGHT_OWNER ? ($workspace->description() === '' ? 'Nouvelle description...' : ($workspace->description() ?? 'Nouvelle description...')) : '');

        if ($user_rights === Share::RIGHT_OWNER) {
            $hashtag = $workspace->hashtag();

            if (($hashtag ?? '') === '') $hashtag = "Nouvelle thématique...";

            $html->current_hashtag = $hashtag;
        }
        else $html->current_hashtag = '';

        if ($user_rights === Share::RIGHT_OWNER) $html->set_other_variable('button-delete', '<button onclick="rcmail.command(`workspace.delete`)" class="btn btn-danger mel-button no-button-margin" style="margin-top:5px;margin-bottom:15px">Supprimer l\'espace de travail</button>');
        else $html->set_other_variable('button-delete', '<button onclick="rcmail.command(`workspace.leave`)" class="btn btn-danger mel-button no-button-margin" style="margin-top:5px;margin-bottom:15px">Quitter l\'espace de travail</button>');
        
        if (!$workspace->isArchived())  $html->set_other_variable('button-archive', '<button class="btn btn-danger mel-button no-button-margin" style="margin-top: 5px;margin-bottom: 15px;margin-left:10px;"onclick="rcmail.command(`workspace.archive`)">Archiver</button>');
        else $html->set_other_variable('button-archive', '<button class="btn btn-success mel-button no-button-margin" style="margin-top: 5px;margin-bottom: 15px;margin-left:10px;"onclick="rcmail.command(`workspace.unarchive`)">Désarchiver</button>');
        
        if ($user_rights === Share::RIGHT_OWNER)
        {
            $logo = $workspace->logo();//self::get_workspace_logo($this->currentWorkspace);
            $html->logo = (($logo ?? "false") == "false" ? '<span>'.substr($workspace->title(), 0, 3)."</span>" : '<img src="'.$logo.'" />');
            $html->visibility = $workspace->isPublic() ? 'privé' : 'public';
        }
        else
        {
            $html->logo = '';
            $html->visibility = '???';
        }

        // if ($this->rc->config->get('workspace_bar_color_force', "default") === 'default')
        // {
        //     $activeColor = $this->is_color_custom($this->currentWorkspace);
        //     $html = str_replace("<bar_color_text/>", ($activeColor ? $this->gettext('unactive_bar_color', 'mel_workspace').'<span class="plus icon-mel-minus"></span>' : $this->gettext('active_bar_color', 'mel_workspace').'<span class="plus icon-mel-plus"></span>'), $html);
        //     $html = str_replace("<bar_color_title/>", ($activeColor ? $this->gettext('unactive_bar_color_title', 'mel_workspace') : $this->gettext('active_bar_color_title', 'mel_workspace')), $html);
        //     $html = str_replace("<bar_color_visibility/>", "", $html);
        // }
        // else
        //     $html = str_replace("<bar_color_visibility/>", "display:none;", $html);

        return $html->parse();
    }

    /**
     * @param Workspace | null $workspace
     */
    function setup_params_apps($workspace = null)
    {
        $workspace ??= $this->workspace;

        $icons=["minus" => "icon-mel-minus", "plus" => "icon-mel-plus"];
        $services = $workspace->services(true);//$this->get_worskpace_services($workspace);
        $config = $this->rc()->config->get("workspace_services");
        $html = '<table id=table-apps class="table table-striped table-bordered">';
        $html .= "<thead><tr><td>Applications</td></tr></thead>";

        $count = 0;
        foreach ($services as $key => $value) {
            if ($key === self::KEY_TCHAT || $key === self::KEY_AGENDA)// || $key === self::AGENDA || ($key === self::CHANNEL && !$value))
                continue;

            $plugin = $this->exec_hook('workspace.params.services.show', [
                'workspace' => $workspace,
                'plugin' => $this,
                'app' => $key,
                'enabled' => $value,
                'continue' => true
            ]) ?? ['continue' => true];

            if ($plugin !== null && $plugin['continue'] === true) continue;
            // if ($key === self::CLOUD && 
            //     (!mel_helper::stockage_active() || 
            //         (mel_metapage::have_0_quota() && mel_helper::stockage_active())
            //     )) continue;

            $info = $this->get_type_config($config, $key);
            $html.= '<tr><td>';
            if ($info['material']) $html.= '<bnum-icon style="font-size: 14px;" class="'.($value ? "text-success" : "text-secondary").'">'.$info["icon"].'</bnum-icon> '.$info["name"];
            else $html.= '<span class="'.($value ? "text-success" : "text-secondary").' wsp-change-icon '.$info["icon"].'"></span> '.$info["name"];

            if ($value)
            {

                // if ($key === self::CHANNEL)
                //     $html.= html::tag("button", ["title" => ($this->channel_enabled === false ? "Vous n'avez pas accès au canal courant ! Demandez à ce que l'on vous rajoute ou changez de canal avec ce bouton !" : "Choisissez un nouveau canal !"),  "id" => "update-channel-button","class" => "mel-button param-button ".($this->channel_enabled === false ? "btn-danger btn" : "") ], "Changer de canal".html::tag("span", ["class" => "plus icon-mel-pencil"]));
                // else if ($key === self::TASKS)
                //     $html.= html::tag("button", ["title" => "Choisissez un nouveau tableau !",  "id" => "update-wekan-button","class" => "mel-button param-button " ], "Changer de tableau".html::tag("span", ["class" => "plus icon-mel-pencil"]));
                // else if ($key === self::TCHAP_CHANNEL) {
                //     $html.= '<span class="mel-message"> ('. tchap::get_room_name($this->get_object($this->currentWorkspace, self::TCHAP_CHANNEL)->id) .')</span>';
                //     $html.= html::tag("button", ["title" => ($this->tchap_channel_enabled === false ? "Vous n'avez pas accès au canal courant ! Demandez à ce que l'on vous rajoute ou changez de canal avec ce bouton !" : "Choisissez un nouveau canal !"),  "id" => "update-tchap-channel-button","class" => "mel-button param-button ".($this->tchap_channel_enabled === false ? "btn-danger btn" : "") ], "Changer de canal tchap".html::tag("span", ["class" => "plus icon-mel-pencil"]));
                // }
                $plugin = $this->exec_hook('workspace.params.services.show.update', [
                    'workspace' => $workspace,
                    'plugin' => $this,
                    'app' => $key,
                    'enabled' => $value,
                    'html' => $html
                ]) ?? ['html' => $html];

                $html = $plugin['html'];

                $class = "btn btn-danger hidden mel-button no-button-margin";
                $span = $icons["minus"];    
                $func = '';           
            }
            else {
                $class = "btn btn-success mel-button no-button-margin";
                $span = $icons["plus"];   
                $func = "rcmail.command('workspace.update_app','$key')"; 
                ++$count;
            }

            

            if ($info === null)
                $class.= " disabled";

            $html.= "<button onclick=$func style=float:right; class=\"$class\" ><span class=$span></span></button>";
            $html .= "</td></tr>";
        }

        $html .= "</table>";

        return $html;

    }

    function get_type_config($config, $type)
    {
        foreach ($config as $key => $value) {
            if ($value["type"] === $type)
                return $value;
        }
    }


    function sort_user($users)
    {
        usort($users, function($a, $b)
        {
            if ($a->rights == $b->rights)
                return driver_mel::gi()->getUser($a->user)->name <=> driver_mel::gi()->getUser($b->user)->name;
            
            return $a->rights == Share::RIGHT_OWNER && $b->rights != $a->rights ? -1 : 1;


        });
        return $users;
    }

    private function _check_if_is_in_list($wsp, $user_id) {
        $array = [];
        $lists = $wsp->settings()->get('lists') ?? [];//$this->get_setting($wsp, 'lists') ?? [];

        foreach ($lists as $key => $value) {
            if (in_array($user_id, $value)) $array[] = $key;
        }

        return $array;
    }

    private function _list_to_title($lists) {
        $txt = '';
        foreach ($lists as $key => $value) {
            $value = driver_mel::gi()->getUser(null, true, false, null, $value);
            $txt .= $value->fullname . "\n";
        }

        return $txt;
    }


    function setup_params_rights()
    {
        $workspace = $this->workspace;
        $icons_rights = [
            Share::RIGHT_OWNER => "icofont-crown",
            Share::RIGHT_WRITE => "icofont-pencil-alt-2"
        ];

        $options_title = [
            Share::RIGHT_OWNER => "Passer en administrateur",
            Share::RIGHT_WRITE => "Passer en utilisateur"
        ];

        $current_title = [
            Share::RIGHT_OWNER => "Administrateur",
            Share::RIGHT_WRITE => "Utilisateur"
        ];

        $icon_delete = "icon-mel-trash";
        $env = [];
        $shares = $this->sort_user($workspace->users()); 
        $nbuser = count($shares);

        $html = '<table id=wsp-user-rights class="table table-striped table-bordered">';
        $html .= "<thead>";
        $html .= "<tr><td>Utilisateur ($nbuser) </td><td class=\"mel-fit-content\">Droits d'accès</td><td class=\"mel-fit-content\">Supprimer</td></tr>";
        $html .= "</thead>";
        $share = $this->sort_user($workspace->users());
        $current_user = driver_mel::gi()->getUser();

        foreach ($share as $key => $value) {
            $user =driver_mel::gi()->getUser($value->user);

            if (!isset($user)) continue;

            $from_list = $this->_check_if_is_in_list($workspace, $value->user);
            $html .= "<tr>";
            $html .= '<td>'.(count($from_list) > 0 ? '<span style="margin-right:5px;vertical-align: bottom;" class="material-symbols-outlined" title="'.$this->_list_to_title($from_list).'">groups</span>' : ''). $user->fullname."</td>";
            
            $html .= "<td>".$this->setup_params_value($icons_rights, $options_title, $current_title, $value->rights,$value->user)."</td>";
            if ($value->user === $current_user)
                $html += '<td></td>';
            else
                $html .= '<td><button style="float:right" onclick="rcmail.command(`workspace.remove_user`, `'.$value->user.'`)" class="btn btn-danger mel-button no-button-margin"><span class='.$icon_delete.'></span></button></td>';
            
            $html .= "</tr>";
            $env[$user->email] = ['email' => $user->email, 'name' => $user->name, 'fullname' => $user->fullname, 'is_external' => $user->is_external];
        }

        // $this->rc()->output->set_env('current_workspace_users', $env);
        unset($env);
        unset($from_list);

        $lists = $workspace->settings()->get('lists') ?? [];//$this->get_setting($workspace, "lists") ?? [];

        if (!is_array($lists)) $lists = get_object_vars($lists);

        if (count($lists) > 0) {
            $html .= "<thead>";
            $html .= '<tr><td>Listes</td><td class="mel-fit-content">Synchroniser</td><td class="mel-fit-content">Supprimer</td></tr>';
            $html .= "</thead>";

            foreach ($lists as $key => $value) {
                $html .= "<tr>";
                $html .= "<td>". driver_mel::gi()->getUser(null, true, false, null, $key)->fullname."</td>";
                $html .= "<td><button style=\"float:right\" onclick=\"rcmail.command(`workspace.sync_list`, `".$key."`);\" class=\"btn btn-primary mel-button no-button-margin without-text px45\"><span class=\"material-symbols-outlined\">sync</span></button></td>";
                $html .= "<td><button style=\"float:right\" onclick=\"rcmail.command(`workspace.remove_list`, `".$key."`);\" class=\"btn btn-danger mel-button no-button-margin without-text px45\"><span class=\"material-symbols-outlined\">delete</span></button></td>";
                $html .= "</tr>";
            }
        }



        $html .= "</table>";

        return $html;
    }

    function setup_params_value($icons, $titles, $current_titles, $rights, $user)
    {
        $options = json_encode($icons);
        $options = str_replace('"', "¤¤¤", $options);
        $classes = [];

        foreach ($icons as $key => $value) {
            $classes[$key] = $key;
        }

        $classes = str_replace('"', "¤¤¤", json_encode($classes));

        return '<button style="float:right" title="'.$current_titles[$rights].'"  type="button" data-option-title-current="'.str_replace('"', "¤¤¤", json_encode($current_titles)).'" data-option-title="'.str_replace('"', "¤¤¤", json_encode($titles)).'" data-rcmail=true data-onchange="rcmail.command(`workspace.update_user`, MEL_ELASTIC_UI.SELECT_VALUE_REPLACE+`:'.$user.'`)" data-options_class="'.$classes.'" data-is_icon="true" data-value="'.$rights.'" data-options="'.$options.'" class="select-button-mel mel-button no-button-margin  btn-u-r btn btn-primary '.$rights.'"><span class='.$icons["$rights"].'></span></button>';
        // $html = '<select class=" pretty-select" >';
        // foreach ($icons as $key => $value) {
        //     $html .= '<option class=icofont-home value="'.$key.'" '.($key === $rights ? "selected" : "")." ></option>";
        // }
        // $html .= "</select>";
        // return $html;
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
        #region private/register_actions
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
                    'set_visu_mode' => [$this, 'set_visu_mode'],
                    'update_module_visibility' => [$this, 'update_module_visibility'],
                    'get_email_from_ws' => [$this, 'get_email_from_workspace']
                ]
            );
            $this->register_action('PARAM_Change_color', array($this, 'change_color'));
            $this->register_action('PARAMS_change_logo', array($this, 'change_logo'));
            $this->register_action('PARAMS_change_visibility', array($this, 'change_visibility'));
            $this->register_action('PARAMS_add_users', array($this, 'add_users'));
            $this->register_action('PARAMS_update_user_table_rights', array($this, 'update_user_table_rights'));
            $this->register_action('PARAMS_update_user_rights', array($this, 'update_user_rights'));
            $this->register_action('PARAMS_delete_user', array($this, 'delete_user'));
            $this->register_action('PARAMS_update_app', array($this, 'update_app'));
            $this->register_action('PARAMS_update_app_table', array($this, 'update_app_table'));
            $this->register_action('PARAMS_update_toolbar', array($this, 'update_toolbar'));
            $this->register_action('PARAMS_update_services', array($this, 'update_services'));
            $this->register_action('PARAMS_update_end_date', array($this, 'update_end_date_setting'));
            $this->register_action('PARAMS_change_primary', array($this, 'update_primary_parameters'));
            $this->register_action('archive_workspace', array($this, 'archive_workspace'));
            $this->register_action('delete_workspace', array($this, 'delete_workspace'));
            $this->register_action('hashtag', array($this, 'get_hashtags'));
            $this->register_action('leave_workspace', array($this, 'leave_workspace'));
            $this->register_action('join_user', array($this, 'join_user'));
        }

        private function _setup_workspace_actions() {
            $this->register_action('workspace', [$this, 'show_workspace']);
        }
        #endregion

        #region private/hook_actions
        private function _hook_actions() {
            $this->add_hook('webcomponents.scroll.count', [$this, 'webcomponentScrollCount']);
            $this->add_hook('webcomponents.scroll.data', [$this, 'webcomponentScrollData']);
            $this->add_hook('workspace.users.services.delete', [$this, 'workspace_users_services_delete']);
            $this->add_hook('workspace.params.services.show', [$this, 'workspace_params_services_show']);
            $this->add_hook('workspace.service.get', [$this, 'workspace_service_get']);
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

        public function workspace_service_get($args) {
            if ($args['services'][self::KEY_AGENDA] === null) $args['services'][self::KEY_AGENDA] = false;

            if ($args['services'][self::KEY_TASK] === null) $args['services'][self::KEY_TASK] = false;

            return $args;
        }

        public function workspace_users_services_delete($args) {
            $user = $args['user'];

            if ($args['workspace']->hasService(self::KEY_TASK)) {
                include_once "../mel_moncompte/ressources/tasks.php";

                $tasklist = $args['workspace']->objects()->get(self::KEY_TASK);

                if ($tasklist !== null)
                {
                    $mel = new M2taskswsp($tasklist);
                    $mel->deleteAcl($user);
                }
            }
            
            if ($args['workspace']->hasService(self::KEY_AGENDA)) {
                $now = date(LibMelanie\Api\Defaut\Event::DB_DATE_FORMAT);
                $time = strtotime($now);
                $calendar = driver_mel::gi()->calendar([$user]);
                $events = $calendar->getRangeEvents($now);
        
                foreach ($events as $e) {
                    if ($e->category === 'ws#'.$workspace->uid()) 
                    {
                        if ($e->recurrence->type !== LibMelanie\Api\Defaut\Recurrence::RECURTYPE_NORECUR)
                        {
                            $e->recurrence->enddate = $now;
                            
                            if (isset($e->exceptions))
                            {
                                foreach ($e->exceptions as $exception) {
                                    if (strtotime($exception->start) > $time)
                                    {
                                        $exception->delete();
                                    }
                                }
                            }
                            $e->save();
                        }
                        else $e->delete();
                    }
                }
                
                $calendar->save();    
            }
        }

        public function workspace_params_services_show($args) {
            if ($args['app'] === self::KEY_TASK) $args['continue'] = false;

            return $args;
        }
        #endregion

        #region private/services
        private function _set_services(&$workspace, $services, $default_value = null) {
            $plugins = $this->rc()->plugins->exec_hook('workspace.services.set', ['workspace' => $workspace, 'services' => $services, 'default_values' => $default_value]);

            if (isset($plugins) && isset($plugins['workspace'])) $workspace = $plugins['workspace']; 

            $services = $this->_set_tasklist($workspace, $services, $default_value);
            $services = $this->_set_agenda($workspace, $services);
        }

        private function _set_tasklist(&$workspace, $services, $default_value)
        {
            if (array_search(self::KEY_TASK, $services, true) === false) return $services;
    
            include_once "../mel_moncompte/ressources/tasks.php";
            $tasklist = $workspace->objects()->get(self::KEY_TASK);//$this->get_object($workspace, $tasks);
    
            if ($tasklist !== null) //Si la liste de tâche existe déjà
            {
                $mel = new M2taskswsp($tasklist);
                if ($mel->getTaskslist() !== null)
                {
                    foreach ($workspace->users() as $s => $v)
                    {
                        $mel->setAcl($s, ["w"]);
                    }
                }
                else {
                    //$this->remove_object($workspace, $tasks);
                    $workspace->objects()->remove(self::KEY_TASK);
                    return $this->_set_tasklist($workspace, $services, $default_value);//$this->create_tasklist($workspace, $services, $users, $update_wsp, $default_value);
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
    
            $key = array_search(self::KEY_TASK, $services, true);
    
            //$this->create_wekan($workspace, $services, $users, $default_value);
    
            if ($key !== false) unset($services[$key]);
    
            return $services;
        }

        private function _set_agenda(&$workspace, $services) {
            mel_helper::load_helper()->include_utilities();
            $color = $workspace->color();
    
            foreach ($workspace->users() as $s) mel_utils::cal_add_category($s->user, 'ws#'.$workspace->uid(), $color);
    
            $workspace->objects()->set(self::KEY_AGENDA, true);
            
            $key = array_search(self::KEY_AGENDA, $services, true);
    
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
        $plugin = rcmail::get_instance()->plugins->get_plugin('mel_workspace');
        $plugin->include_stylesheet($plugin->local_skin_path().'/workspace_list.css');
        unset($plugin);

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
            return isset($favorites) && isset($favorites[$v->uid]) && $favorites[$v->uid]['tak'] ? PHP_INT_MAX : (new DateTime($v->modified))->getTimestamp();
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
        $block->join = $workspace->hasUser();
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

    public static function Workspace($uid) : Workspace {
        return Workspace::GetLoad($uid);
    }

    private static function _CurrentUser()  {
        return driver_mel::gi()->getUser();
    }
    #endregion

}