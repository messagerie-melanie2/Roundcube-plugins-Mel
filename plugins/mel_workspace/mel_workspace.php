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

        if ($this->get_current_task() === 'workspace') {
            $this->register_task('workspace');

            if ($this->is_index_action()) {
                $this->_setup_index_action();
            }
        }
    }

    private function _setup_index_action() {
        $this->add_handler('index', [$this, 'show_workspaces']);
    }

    public function show_workspaces() {
        
    }

}