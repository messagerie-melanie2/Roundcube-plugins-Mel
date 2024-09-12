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

    private function _setup_index_action() {
        $this->register_action('index', [$this, 'show_workspaces']);
    }

    public function show_workspaces() {
        //$this->load_script_module_from_plugin('mel_metapage', 'tab_web_element', '/js/lib/html/JsHtml/CustomAttributes/', false, 'head');
        $this->include_web_component()->Tabs();

        $this->rc()->output->send('mel_workspace.index');
    }

}