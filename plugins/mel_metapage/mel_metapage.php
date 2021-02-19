<?php
class mel_metapage extends rcube_plugin
{
    /**
     * Contient l'instance de rcmail
     * @var rcmail
     */
    private $rc;
    /**
     * Contient la task associé au plugin
     * @var string
     */
    public $task = '.*';

    function init()
    {
        $this->setup();

    }

    function setup()
    {
        // Récupération de l'instance de rcmail
        $this->rc = rcmail::get_instance();
        $this->startup();
        if ($this->rc->task !== "login" && $this->rc->config->get('skin') == 'mel_elastic')
        {
            $this->add_texts('localization/', true);
            $this->load_config();
            //$this->include_depedencies();
            $this->include_plugin();
            $this->rc->get_storage();
            $this->register_task("mel_metapage");
            $this->register_action('search_mail', array($this, 'search_mail'));
            $this->register_action('get_unread_mail_count', array($this, 'get_unread_mail_count'));
            $this->register_action('search_contact', array($this, 'search_contact'));
            $this->register_action('contact', array($this, 'display_contact'));
            $this->add_hook('refresh', array($this, 'refresh'));
            if (rcube_utils::get_input_value('_from', rcube_utils::INPUT_GET) !== "iframe")
                $this->include_script('js/actions/startup.js');
            $this->add_hook("send_page", array($this, "generate_html"));//$this->rc->output->add_header($this->rc->output->parse("mel_metapage.barup", false, false));
        }
        else if ($this->rc->task == 'logout' 
        || $this->rc->task == 'login') {
      // Include javascript files
            $this->include_script('js/actions/logout.js');
            $this->include_script('js/actions/login.js');
        }
        //else if ($this->rc->task === "addressbook" && rcube_utils::get_input_value('_from', rcube_utils::INPUT_GET) !== "iframe")
          //  $this->rc->output->redirect(array("_task" => "mel_portal"));
    }

    function refresh()
    {
        $this->rc->output->command('mel_metapage_fn.refresh');
    }

    /**
     * Action à faire avant tout. 
     */
    function startup()
    {
        $this->include_script('js/init/classes.js');
        $this->include_script('js/init/constants.js');
    }

    function include_plugin()
    {
        $this->include_depedencies();
        $this->include_css();
        $this->include_js();
        $this->setup_env_js_vars();
    }

    function generate_html($args)
    {
        //$this->rc->output->send('mel_metapage.metapage');
        //$args["content"] = "<div class=yolo>test</div>".$args["content"];
        //<body class="iframe
        if (strpos($args["content"],'<html lang="fr" class="iframe') !== false)
        {
            $args["content"] = $this->from_iframe($args["content"]);
            return $args;
        }
        if (strpos($args["content"],'<body class="iframe') !== false || strpos($args["content"],'<framed_item>') !== false)
        {
            $args["content"] = $this->from_iframe($args["content"]);
            return $args;
        }
        $tmp = explode('<div id="layout">', $args["content"]);
        $args["content"] = $tmp[0].$this->rc->output->parse("mel_metapage.mel_modal", false, false).'<div id="layout">'.$this->rc->output->parse("mel_metapage.barup", false, false).$tmp[1];
        if (rcube_utils::get_input_value('_from', rcube_utils::INPUT_GET) === "iframe")
            $args["content"] = $this->from_iframe($args["content"]);
        $args["content"] = $this->add_html($args["content"]);
        return $args;
    }

    function add_html($content){
        $var = '<ul id="directorylist"';
        $tmp = explode($var, $content);
        $size = strlen($tmp[1]);
        $index = -1;
        $text = "";
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($text, "</ul></div>") !== false)
            {
                $index = $i-6;
                unset($text);
                break;
            }
            if ($tmp[1][$i] == ' ' || $tmp[1][$i] == PHP_EOL || $tmp[1][$i] == "\t")
                continue;
            $text .= $tmp[1][$i];
        }
        $temp = substr_replace($tmp[1], $this->rc->output->parse("mel_metapage.contact_option", false, false), $index, 0);
        $temp = str_replace('[|¤¤¤|]', $this->gettext("contacts_organization"), $temp);
        return $tmp[0].$var.$temp;
    }

    function from_iframe($contents)
    {
        return str_replace('<div id="layout-menu"', '<div id="layout-menu" data-edited=true style="display:none;"', $contents);
    }

    function display_contact()
    {   
        $id = rcube_utils::get_input_value('_cid', rcube_utils::INPUT_GET);
        $source = rcube_utils::get_input_value('_source', rcube_utils::INPUT_GET);
        $url = "?_task=addressbook&_framed=1&_cid=".$id."&_action=show&_source=".$source;
        $this->rc->output->set_env("contact_url", $url);
        $this->include_script('js/actions/set_iframe_contact.js');
        $this->rc->output->send("mel_metapage.contact");
    }

    /**
     * Récupère le css utile pour ce plugin.
     */
    function include_css()
    {
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path().'/barup.css');
        $this->include_stylesheet($this->local_skin_path().'/modal.css');
        $this->include_stylesheet($this->local_skin_path().'/global.css');
    }

    /**
     * Récupère le js utile pour ce plugin.
     */
    function include_js()
    {
        //$this->include_script('js/search.js');
        $files = scandir(__DIR__."/js");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($files[$i], ".js") !== false)
            $this->include_script('js/'.$files[$i]);
        }
        if ($this->rc->task === "calendar")
            $this->include_script('js/actions/calendar_event.js');
        if ($this->rc->task === "tasks")
            $this->include_script('js/actions/task_event.js');
    }

    /**
     * Récupère les dépendances utile pour ce plugin.
     */
    function include_depedencies()
    {
        //$this->include_script('../calendar/calendar_ui.js');
    }

    /**
     * Met en place les variables pour le js.
     */
    function setup_env_js_vars()
    {
        $tmp = [];
        $it = 0;
        foreach ($this->rc->config->get("search") as $key => $value) {
            $tmp[$it++] = $value->url();
        }
        $this->rc->output->set_env('mm_search_config', $tmp);
        $this->rc->output->set_env('REPLACED_SEARCH', ASearch::REPLACED_SEARCH);
        
        foreach ($this->rc->user->list_emails() as $identity) {
            $emails[] = strtolower($identity['email']);
        }

        $this->rc->output->set_env('mel_metapage_user_emails', $emails);
        
        //$this->rc->output->set_env('currentTask', $this->rc->task);
    }

    public function get_unread_mail_count()
    {
        $msgs = $this->rc->storage->list_messages();
        $size = count($msgs);
        $retour = 0;
        for ($i=0; $i < $size; ++$i) { 
            if (count($msgs[$i]) == 0 || $msgs[$i]->flags["SEEN"] === null || !$msgs[$i]->flags["SEEN"] )
                ++$retour;
        }
        echo $retour;
        exit;
    }

    public function search_mail()
    {
        include_once "program/search_result/search_result_mail.php";
        $input = rcube_utils::get_input_value('_q', rcube_utils::INPUT_GET);
        $msgs = $this->rc->storage->list_messages();
        $tmp = $this->rc->storage->search(null, "OR HEADER FROM ".$input." HEADER SUBJECT ".$input, RCUBE_CHARSET, "arrival");
        $array = $tmp->get();
        $size = count($array);
        $index = null;
        $retour = [];
        $it = 0;
        for ($i=$size; $i >= 0; --$i) { 
            $index = $this->mail_where($array[$i], $msgs);
            if ($index !== false)
                $retour[$it++] = $msgs[$index];
            if (count($retour) >= 5)
                break;
        }
        echo rcube_output::json_serialize(SearchResultMail::create_from_array($retour)->get_array($this->gettext("mails")));
        exit;

    }

    function mail_where($id, $array, $size = null)
    {
        if ($size === null)
            $size = count($array);
        for ($i=0; $i < $size; ++$i) { 
            if ($array[$i]->id == $id)
                return $i;
        }
        return false;

    }

    public function search_contact()
    {
        include_once "program/search_result/search_result_contact.php";
        $search = rcube_utils::get_input_value('_q', rcube_utils::INPUT_GET);
        $fields = explode(',', rcube_utils::get_input_value('_headers', rcube_utils::INPUT_GET));
        $sources = $this->rc->get_address_sources();
        $search_set = array();
        $records    = array();
        $sort_col   = $this->rc->config->get('addressbook_sort_col', 'name');
        $afields = $this->rc->config->get('contactlist_fields');
        $mode = (int) $this->rc->config->get('addressbook_search_mode');
        $mode |= rcube_addressbook::SEARCH_GROUPS;
        $retour = new SearchResults();
        foreach ($sources as $s) {
            $source = $this->rc->get_address_book($s['id']);
            //$source->table_cols[count($source->table_cols)] = "phone";
            // check if search fields are supported....
            if (is_array($fields)) {
                $cols = $source->coltypes[0] ? array_flip($source->coltypes) : $source->coltypes;
                $supported = 0;
    
                // foreach ($fields as $f) {
                //     if (array_key_exists($f, $cols)) {
                //         $supported ++;
                //     }
                // }
    
                // // in advanced search we require all fields (AND operator)
                // // in quick search we require at least one field (OR operator)
                // if (($adv && $supported < count($fields)) || (!$adv && !$supported)) {
                //     continue;
                // }
            }
    
            // reset page
            $source->set_page(1);
            $source->set_pagesize(9999);
    
            // get contacts count
            $result = $source->search($fields, $search, $mode, false);
    
            if (!$result->count) {
                continue;
            }
    
            // get records
            $result = $source->list_records($afields);
    
            while ($row = $result->next()) {
                $row['sourceid'] = $s['id'];
                $retour->add(new SearchResultContact($row, $search, $this->rc));
                if ($retour->count() >= 5)
                    break;
                // $key = rcube_addressbook::compose_contact_key($row, $sort_col);
                // $records[$key] = $row;
            }
    
            unset($result);
            // $search_set[$s['id']] = $source->get_search_set();
        }
        echo rcube_output::json_serialize($retour->get_array($this->gettext('contacts')));
        exit;

    }

    // public function display_event()
    // {
    //     $source = rcube_utils::get_input_value('_source', rcube_utils::INPUT_GET);
    //     $idEvent = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GET);
    //     $this->rc->user->save_prefs(array("calendar_datas"),
    //         ["source" => $source, ]
    //     )
    // }

}