<?php
include_once "page.php";
class CreateWorkspace extends Page
{
    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin, "create_workspace", "create_workspace");
    }  

    protected function before_page() {
        parent::before_page();
        //$this->rc->output->include_script('js/program/create_workspace.js');
        //$this->include_js("create_workspace.js");
    }

    protected function set_handlers()
    {
        parent::set_handlers();
        $this->register_handlers(array(
            'searchform'          => array($this->rc->output, 'search_form'),
            "addressbooks" => [$this, 'override_rcmail_addressbook_list'],
            "addresslist" => [$this, 'override_rcmail_contacts_list']
        ));
    }

    protected function do_send()
    {
        return true;
    }


}