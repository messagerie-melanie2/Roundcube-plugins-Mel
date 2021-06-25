<?php
include_once "parsed_page.php";
class ContactPage extends ParsedPage
{
    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin, "contact_list", "contact_page");
    }  

    protected function set_handlers()
    {
        parent::set_handlers();
        // $this->register_handlers([
        //     "source_list" => [$this, "get_sources"],
        //     "get_children" => [$this, "get_contacts"]
        // ]);
        $this->register_handlers([
            'searchform'   => array($this->rc->output, 'search_form')
        ]);
    }

    protected function before_call() {
        parent::before_call();
        if (!($this->task === "mail" && $this->action === "compose") && $this->action !== "plugin.annuaire" && rcube_utils::get_input_value(mel_metapage::FROM_KEY, rcube_utils::INPUT_GET) !== mel_metapage::FROM_VALUE)
        {
            try {
                $this->register_handlers([
                    "contactepage" => [$this, "parsedpage"],
                    'searchform'   => array($this->rc->output, 'search_form')
                ]);
                $this->include_js("../../../annuaire/annuaire.js");
                $this->rc->output->add_gui_object('annuaire_list', 'annuaire-list');
                $this->include_css("annuaire_part.css");
                //$this->plugin->include_stylesheet($this->plugin->local_skin_path() . '/../../../annuaire/skins/mel_elastic/annuaire.css');
                $this->rc->output->include_script('treelist.js');
            } catch (\Throwable $th) {
                //throw $th;
            }
        }
    }


    public function parsedpage()
    {
        return $this->get_parsed_page();
    }

} 