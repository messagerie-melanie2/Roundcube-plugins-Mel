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
        $this->add_handler("folders_options", [$this, "folders_options"]);
        $this->add_handler("balps_options", [$this, "balps_options"]);
        $this->add_handler("word_searched", [$this, "word_searched"]);
        $this->add_handler("bali_name", [$this, "bali_name"]);

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

    public function folders_options()
    {
        $folders = $this->rc->storage->list_folders_subscribed('', '*', 'mail');
        $options = '<option value="all">Tous</option>';

        foreach ($folders as $key => $value) {
            $value = rcube_charset::convert($value, 'UTF7-IMAP');
            $key = $value;
            $value = str_replace('INBOX', 'Courrier entrant', $value);
            $options .= "<option value=\"$key\">".$value."</option>";
        }

        return $options;
    }

    public function balps_options()
    {
        $mails = $this->rc->plugins->get_plugin('mel_sharedmailboxes')->get_user_sharedmailboxes_list();
        $options = '';

        foreach ($mails as $key => $value) {
            $value = $value->mailbox->fullname;
            $value = rcube_charset::convert($value, 'UTF7-IMAP');
            $options .= "<option value=\"$key\">".$value."</option>";
        }

        return $options;
    }

    public function bali_name()
    {
        return driver_mel::gi()->getUser()->fullname;
    }

    public function word_searched()
    {
        return $this->word;
    }
}