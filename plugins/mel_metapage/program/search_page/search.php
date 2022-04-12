<?php
include_once __DIR__."/../program.php";

class SearchPage extends Program
{
    private $word;
    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin);
    }  

    public function init()
    {
        $this->register_action("index", [$this, "index"]);
        
        if ($this->action === "" || $this->action === "index")
        {
            $this->plugin->add_hook('ready', array($this, 'onReady'));
            $this->include_js('search.js');
        }
    }

    public function index()
    {
        //$this->add_texts('localization/', true);
        $search_key_word = $this->get_input('_word');
        $this->word = $search_key_word;
        
        $this->add_handler("label", [$this, "label"]);
        $this->add_handler("content_options", [$this, "content_options"]);
        $this->add_handler("word_searched", [$this, "word_searched"]);

        $this->set_env_var("word_searched", $search_key_word);
        $this->send("search");
    }

    public function onReady($args)
    {
        $mails = $this->rc->plugins->get_plugin('mel_sharedmailboxes')->get_user_sharedmailboxes_list();
        $this->set_env_var('shared_mailboxes', $mails);
        return $args;
    }

    public function label()
    {
        return 'Résultats de recherche';
    }

    public function content_options()
    {
        $options = '<option value="all">Tous</option>';

        $config = $this->get_config('search', []);

        foreach ($config as $key => $value) {
            $options .= "<option value=\"".$this->plugin->gettext($key, 'mel_metapage')."\">".$this->plugin->gettext($key, 'mel_metapage')."</option>";
        }

        return $options;
    }

    public function word_searched()
    {
        return $this->word;
    }
}