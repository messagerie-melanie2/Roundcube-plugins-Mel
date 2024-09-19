<?php

class mel_workspace extends bnum_plugin
{
    /**
     * @var string
     */
    public $task = '.*';

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
                            'domain' => "mel_workspace"
                        ], $need_button);
                    }
                break;
            
            default:
                # code...
                break;
        }
    }

    #region pages
    public function show_workspaces() {
        $this->add_texts('localization/index', true);
        $this->include_css('workspace_list.css');
        $this->include_css('index.css');
        $this->load_script_module('index');
        $this->include_web_component()->Tabs();
        $this->include_web_component()->PressedButton();
        self::IncludeWorkspaceBlockComponent();

        $this->add_handler('subscribed', [$this, 'handler_subscribed']);

        $this->rc()->output->send('mel_workspace.index');
    }
    #endregion

    #region actions
    public function check_uid() {
        
    }
    #endregion

    #region handlers
    public function handler_subscribed($args) {
        $args['class'] = 'workspace-list';
        $html = html::div($args, $this->_show_block(0));
        return $html;
    }
    #endregion

    #region private_functions
    private function _setup_index_action() {
        $this->register_action('index', [$this, 'show_workspaces']);
    }

    private function _setup_external_actions() {
        $this->register_actions(
            ['check_uid' => [$this, '']]
        )
    }

    private function _show_block($mode) {
        $html = '';
        $workspaces = null;
        switch ($mode) {
            case 0:
                $workspaces = self::LoadWorkspaces();
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
    #endregion

    #region statics
    private static function _GetWorkspaceLogo($workspace) {
        $logo = $workspace->logo;
        if ($logo !== null && strpos($logo, 'mel_elastic') === false && strpos($logo, 'elastic') !== false) {
            $logo = str_replace('elastic', 'mel_elastic', $logo);
        }

        return $logo;
    }

    public static function IncludeWorkspaceBlockComponent() {
        WebComponnents::Instance()->____METHODS____('_include_component', 'workspace_block_item', '/js/lib/WebComponents/', 'mel_workspace');
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
        $rc = rcmail::get_instance();
        $name = 'mel_workspace.workspace_block';

        $favorites = $rc->config->get('workspaces_personal_datas', null);
        $hashtags = $workspace->hashtags;

        $users = [];
        {
            $it = 0;
            $shared = $workspace->shares;

            foreach ($shared as $value) {
                $tmp = driver_mel::gi()->getUser($value->user);

                if ($tmp) {
                    $tmp = $rc->plugins->exec_hook('bnum.avatar', ['user' => $tmp, 'url' => "./?_task=addressbook&_action=photo&_email=$tmp->email&_error=1&_is_from=iframe"]);
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

        $block->picture = self::_GetWorkspaceLogo($workspace);
        $block->tag = isset($hashtags) && count($hashtags) > 0 ? ($hashtags[0] ?? '') : '';
        $block->title = $workspace->title;
        $block->description = $workspace->description;
        $block->users = implode(',', $users);
        $block->edited = $workspace->modified;
        $block->color = self::_GetWorkspaceSetting($workspace, 'color');
        $block->favorite = isset($favorites) && isset($favorites[$workspace->uid]) && $favorites[$workspace->uid] && $favorites[$workspace->uid]['tak'] ? $favorites[$workspace->uid]['tak'] : false;
        $block->private = !$workspace->ispublic;

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
    public static function LoadWorkspaces()
    {
        return driver_mel::gi()->getUser()->getSharedWorkspaces("modified", false);
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