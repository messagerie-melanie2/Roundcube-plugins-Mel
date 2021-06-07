<?php
/**
 * Plugin Mél Métapage
 *
 * Méta Page
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class mel_metapage extends rcube_plugin
{
    public const FROM_KEY = "_is_from";
    public const FROM_VALUE = "iframe";

    /**
     * Contient l'instance de rcmail
     * @var rcmail
     */
    public $rc;
    /**
     * Contient la task associé au plugin
     * @var string
     */
    public $task = '.*';

    function init()
    {
        $this->setup();
        if ($this->rc->task === "webconf")
        {
            include_once "program/webconf/webconf.php";
            $conf = new Webconf($this->rc, $this);
            $conf->init();
        }
        else if ($this->rc->task === "chat")
            $this->register_action('index', array($this, 'ariane'));

    }

    function setup()
    {
        // Récupération de l'instance de rcmail
        $this->rc = rcmail::get_instance();

        $this->rc->output->set_env('mel_metapage_const', [
            "key" => self::FROM_KEY,
            "value" => self::FROM_VALUE    
        ]);

        if (rcube_utils::get_input_value('_accept_back', rcube_utils::INPUT_GET) === "true" || rcube_utils::get_input_value('_accept_back', rcube_utils::INPUT_GET) === true)
            $this->rc->output->set_env("accept_back", true);

        if (rcube_utils::get_input_value('_framed', rcube_utils::INPUT_GET) === "1"
        || rcube_utils::get_input_value('_extwin', rcube_utils::INPUT_GET) === "1")
            return;

        if ($this->rc->task !== "login" && $this->rc->task !== "logout")
            $this->startup();
        else
        {
            $this->include_script('js/init/classes.js');
            $this->include_script('js/init/constants.js');
        }
        
        if ($this->rc->task !== "login" && $this->rc->task !== "logout" && $this->rc->config->get('skin') == 'mel_elastic' && $this->rc->action !=="create_document_template" && $this->rc->action !== "get_event_html" && empty($_REQUEST['_extwin']))
        {
            $this->add_texts('localization/', true);
            $this->load_config();
            //$this->include_depedencies();
            if ($this->rc->action === "chat" || $this->rc->task === "chat")
            {
                $this->include_script('js/actions/ariane.js');
            }
            $this->mm_include_plugin();
            $this->rc->get_storage();
            if ($this->rc->task === "webconf")
                $this->register_task("webconf");
            else if ($this->rc->task === "chat")
                $this->register_task("chat");
            else
                $this->register_task("mel_metapage");

            
            $this->register_action('search_mail', array($this, 'search_mail'));
            $this->register_action('get_unread_mail_count', array($this, 'get_unread_mail_count'));
            $this->register_action('search_contact', array($this, 'search_contact'));
            $this->register_action('contact', array($this, 'display_contact'));
            $this->register_action('chat', array($this, 'ariane'));
            $this->register_action('dialog-ui', array($this, 'create_calendar_event'));
            $this->register_action('create_document_template', array($this, 'get_create_document_template'));
            $this->register_action('get_event_html', array($this, 'get_event_html'));
            $this->register_action('get_create_workspace', array($this, 'create_workspace_html'));
            $this->register_action('check_users', array($this, 'check_users'));
            $this->add_hook('refresh', array($this, 'refresh'));
            $this->rc->output->set_env("webconf.base_url", $this->rc->config->get("web_conf"));
            if (rcube_utils::get_input_value(self::FROM_KEY, rcube_utils::INPUT_GET) !== self::FROM_VALUE)
                $this->include_script('js/actions/startup.js');
            else
            {
                try {
                    $this->rc->output->set_env("mmp_modal",$this->rc->output->parse("mel_metapage.mel_modal", false, false));
                } catch (\Throwable $th) {
                    //throw $th;
                }
            }
            
            $this->add_hook("send_page", array($this, "generate_html"));//$this->rc->output->add_header($this->rc->output->parse("mel_metapage.barup", false, false));
        }
        else if ($this->rc->task == 'logout' 
                || $this->rc->task == 'login') {
            // Include javascript files
            $this->include_script('js/actions/logout.js');
            $this->include_script('js/actions/login.js');
        }
        else if ($this->rc->action === "create_document_template")
        {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('create_document_template', array($this, 'get_create_document_template'));
        }
        else if ($this->rc->action === "get_event_html")
        {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('get_event_html', array($this, 'get_event_html'));
        }
        else if ($this->rc->action === "get_create_workspace")
        {
            $this->add_texts('localization/', true);
            $this->load_config();
            $this->register_task("mel_metapage");
            $this->register_action('get_create_workspace', array($this, 'create_workspace_html'));
        }
        if ($this->rc->task === "calendar" || ($this->rc->task === "mel_metapage" && $this->rc->action === "dialog-ui"))
        {
            $this->add_hook("send_page", array($this, "parasite_calendar"));
        }
    }

    /**
     * Fonction js appelé au refresh de roundcube.
     */
    function refresh()
    {
        $this->rc->output->command('mel_metapage_fn.refresh');
    }

    /**
     * Action à faire avant tout. 
     */
    function startup()
    {
        $files = scandir(__DIR__."/js/init/classes");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) {
            if (strpos($files[$i], ".js") !== false)
                $this->include_script('js/init/classes/'.$files[$i]);
            else if ($files[$i] === "." || $files[$i] === ".." || strpos($files[$i], ".") !== false)
                continue;
            else {
                $folderFiles = scandir(__DIR__."/js/init/classes/".$files[$i]);
                $folderSize = count($folderFiles);
                for ($j=0; $j < $folderSize; ++$j) { 
                    if(strpos($folderFiles[$j], ".js") !== false)
                        $this->include_script('js/init/classes/'.$files[$i]."/".$folderFiles[$j]);
                }
            }
        }
        $this->include_script('js/init/classes.js');
        $this->include_script('js/init/constants.js');
        $this->include_script('js/init/events.js');
        $this->load_config_js();
    }

    function mm_include_plugin()
    {
        $this->add_button(array(
            'command' => 'last_frame',
            'href' => '?_task=last_frame',
            'class'	=> 'disabled icon-mel-last-frame menu-last-frame',
            'classsel' => 'icon-mel-last-frame menu-last-frame menu-last-frame-selected',
            'innerclass' => 'inner',
            'label'	=> 'mel_metapage.last_frame_opened',
            'title' => 'Retour à la page précédente',
            'type'       => 'link',
        ), "taskbar");
        $this->include_depedencies();
        $this->include_css();
        $this->include_js();
        $this->setup_env_js_vars();
    }

    /**
     * Html du plugin.
     */
    function generate_html($args)
    {
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
        if (rcube_utils::get_input_value(self::FROM_KEY, rcube_utils::INPUT_GET) === self::FROM_VALUE)
        {
            $args["content"] = $this->from_iframe($args["content"]);
        }
        else {
            $tmp = explode('<div id="layout">', $args["content"]);
            // $args["content"] = '';
            $args["content"] = $tmp[0].$this->rc->output->parse("mel_metapage.mel_modal", false, false).'<div id="layout"><header role="banner">'.$this->rc->output->parse("mel_metapage.barup", false, false).$tmp[1];
            // $tmp = explode("</header>", $args["content"]);
            // $args["content"] = $tmp[0].'</header><main role="main">'.$tmp[1];
            // $tmp = explode("</body>", $args["content"]);
            // $args["content"] = $tmp[0].'</main></body>'.$tmp[1];

            if (strpos($args["content"],'<user/>') !== false)
                $args["content"] = str_replace("<user/>", $this->rc->output->parse("mel_metapage.user", false, false), $args["content"]);

            $args["content"] = $this->add_html($args["content"]);
        }
        return $args;
    }

    function parasite_calendar($args)
    {
        $content = $args["content"];
        $pos = strpos($content,'<div id="eventedit"');
        if ($pos !== false)
        {
            include_once "../calendar/calendar_ui.php";
            $size = strlen($content);
            $textToReplace = "";
            $final_start = false;
            $tmp = "";
            $final_div = 0;
            for ($i=$pos; $i < $size; ++$i) { 
                if ($final_div >= 2)
                    break;
                $textToReplace.=$content[$i];
                if (!$final_start && strpos($textToReplace,'<div id="edit-localchanges-warning"') !== false)
                {
                    $final_start = true;
                }
                if ($final_start)
                {
                    $tmp.=$content[$i];
                    if (strpos($tmp,'</div>') !== false)
                    {
                        $tmp = "";
                        ++$final_div;
                    }
                }
            }
            if ($textToReplace !== "")
            {
                $ui = new calendar_ui($this);
                $ui->init_templates();
                $w = function ()
                {
                    $wsp = $this->rc->plugins->get_plugin("mel_workspace");
                    $wsp->load_workspaces();
                    $workpaces = $wsp->workspaces;
                    $html = '<select id=wsp-event-all-cal-mm class="form-control input-mel">';
                    $html .= "<option value=\"#none\">Aucun</option>";
                    foreach ($workpaces as $key => $value) {
                        $html .= '<option value="'.$value->uid.'">'.$value->title.'</option>';
                    }
                    $html .= "</select>";
                    return $html;
                };
                $categories = function()
                {
                    $values = driver_mel::gi()->getUser($username)->getDefaultPreference("categories");
                    $values = (isset($values) ? explode("|" ,$values) : []);

                    $html = '<select id=categories-event-all-cal-mm class="form-control input-mel">';
                    $html .= "<option value=\"#none\">".$this->rc->gettext("nothing", "mel_metapage")."</option>";
                    foreach ($values as $key => $value) {
                        if ($value[0] === "w" && $value[1] === "s" && $value[2] === "#")
                            continue;
                        $html .= '<option value="'.$value.'">'.$value.'</option>';
                    }
                    $html .= "</select>";
                    return $html;
                };
                $this->rc->output->add_handlers(array(
                    'event-wsp'    => $w,
                    'categories-wsp'    => $categories,
                ));
                $args["content"] = str_replace($textToReplace, $this->rc->output->parse("mel_metapage.event_modal", false, false), $content);
                
                // $textes = [
                //     'roleorganizer',
                //     'rolerequired',
                //     'roleoptional',
                //     'rolechair',
                //     'rolenonparticipant'
                // ];
                // foreach ($textes as $key => $value) {
                //     $args["content"] = str_replace("calendar.$value", $this->gettext($value), $args["content"]);
                // }

            
            }
//<div id="edit-localchanges-warning"
        }
        return $args;
    }

    /**
     * Ajoute le html à la page.
     */
    function add_html($content){
        if (strpos($content, "<adressbook-options/>") !== false)
        {
            $content = str_replace('<adressbook-options/>', "", $content);
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
            $temp = str_replace('<adressbook-options/>', "", $temp);
            return $tmp[0].$var.$temp;
        }
        else
            return $content;
    }

    /**
     * Retire le menu si la page vient d'un iframe.
     */
    function from_iframe($contents)
    {
        return str_replace('<div id="layout-menu"', '<div id="layout-menu" data-edited=true style="display:none;"', $contents);
    }

    /**
     * Affiche un contact.
     */
    function display_contact()
    {   
        $id = rcube_utils::get_input_value('_cid', rcube_utils::INPUT_GET);
        $source = rcube_utils::get_input_value('_source', rcube_utils::INPUT_GET);
        $url = "?_task=addressbook&_framed=1&_cid=".$id."&_action=show&_source=".$source;
        $this->rc->output->set_env("contact_url", $url);
        $this->include_script('js/actions/set_iframe_contact.js');
        $this->rc->output->send("mel_metapage.contact");
    }

    function check_users()
    {
        $users = rcube_utils::get_input_value("_users", rcube_utils::INPUT_POST);
        $unexisting_users = [];
        $added_users = [];
        foreach ($users as $key => $value) {
            $tmp = driver_mel::gi()->getUser(null, true, false, null, $value);
            if ($tmp->uid === null)
                $unexisting_users[] = $value;
            else{
                $added_users[] = [
                    "name" => $tmp->name,
                    "uid" => $tmp->uid,
                    "email" => $value
                ];
            }
        }
        echo json_encode(["unexist" => $unexisting_users, "added" => $added_users]);
        exit;
        //driver_mel::gi()->getUser(null, true, false, null, $datas["users"][$i])->uid
    }

    function ariane()
    {
        $this->rc->output->send("mel_metapage.ariane");
    }

    function create_workspace_html()
    {
        echo $this->rc->output->parse("mel_metapage.create_workspace", false, false);
        exit;
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
        $this->include_stylesheet($this->local_skin_path().'/user.css');
    }

    function load_config_js()
    {

        //$this->include_script('js/search.js');
        $files = scandir(__DIR__."/js/configs");
        $size = count($files);
        for ($i=0; $i < $size; ++$i) { 
            if (strpos($files[$i], ".js") !== false)
            $this->include_script('js/configs/'.$files[$i]);
        }        
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
        //if ($this->rc->task === "calendar" || ($this->rc->task === "mel_metapage" && $this->rc->action === "dialog-ui"))
        $this->include_script('js/actions/calendar_event.js');

        if ($this->rc->task === "tasks")
            $this->include_script('js/actions/task_event.js');
        //$this->rc->output->include_script('treelist.js');
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
        include_once "program/search/search.php";
        include_once "program/search/search_config.php";
        $tmp = [];
        $it = 0;
        foreach ($this->rc->config->get("search") as $key => $value) {
            $tmp[$it++] = (new SearchConfig($value))->get()->url();//$value->url();
        }
        $this->rc->output->set_env('mm_search_config', $tmp);
        $this->rc->output->set_env('mel_metapage_ariane_button_config', $this->rc->config->get("pop_up_ariane"));
        $this->rc->output->set_env('REPLACED_SEARCH', ASearch::REPLACED_SEARCH);
        $this->rc->output->set_env('mel_metapage_templates_doc', $this->rc->config->get('documents_types'));
        $this->rc->output->set_env('mel_metapage_templates_services', $this->rc->config->get('workspace_services'));

        $icons_files = scandir(__DIR__."/skins/elastic/pictures/dwp_icons");
        if ($icons_files !== false)
        {
            $icons= [];
            foreach ($icons_files as $key => $value) {
                if ($value === "." || $value === "..")
                    continue;
                $icons[] = ["name" => $value, "path" => "/plugins/mel_metapage/skins/elastic/pictures/dwp_icons/".$value];
            }
            $this->rc->output->set_env('mel_metapage_workspace_logos', $icons);
        }
        foreach ($this->rc->user->list_emails() as $identity) {
            $emails[] = strtolower($identity['email']);
        }

        $this->rc->output->set_env('mel_metapage_user_emails', $emails);

        //$this->rc->output->set_env('currentTask', $this->rc->task);
    }

    /**
     * Récupère le nombre de mails non lu.
     */
    public function get_unread_mail_count()
    {
        $msgs = $this->rc->storage->list_messages();
        $size = count($msgs);
        $retour = 0;
        for ($i=0; $i < $size; ++$i) { 
            if (/*count($msgs[$i]) == 0 || */$msgs[$i]->flags["SEEN"] === null || !$msgs[$i]->flags["SEEN"] )
                ++$retour;
        }
        echo $retour;
        exit;
    }

    /**
     * Recherche un texte dans les mails.
     */
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

    /**
     * Recherche un id parmis les mails.
     */
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

    /**
     * Recherche un texte dans les contacts.
     */
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
            $source->set_pagesize(5);
    
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


    function get_create_document_template()
    {
        $this->rc->output->add_handlers(array(
            'document_type'    => array($this, 'get_docs_types'),
        ));
        echo $this->rc->output->parse("mel_metapage.create_document");
        exit;
        //$this->rc->output->send("mel_metapage.create_document");
    }

    function get_event_html()
    {
        $w = function ()
        {
            $wsp = $this->rc->plugins->get_plugin("mel_workspace");
            $wsp->load_workspaces();
            $workpaces = $wsp->workspaces;
            $html = '<select class="form-control input-mel">';
            $html .= "<option value=none>Aucun</option>";
            foreach ($workpaces as $key => $value) {
                $html .= '<option value="'.$value->uid.'">'.$value->title.'</option>';
            }
            $html .= "</select>";
            return $html;
        };
        $this->rc->output->add_handlers(array(
            'event-wsp'    => $w,
        ));
        echo $this->rc->output->parse("mel_metapage.event_body", false, false);
        exit;
    }

    
    function get_docs_types()
    {
        $templates = $this->rc->config->get('documents_types');
        $html = "";
        $size = count($templates);
        for ($i=0; $i < $size; ++$i) { 
            $html.= '<button class="btn btn-mel-block btn-secondary btn-mel" onclick="m_mp_UpdateCreateDocument({ext:`'+$templates[$i]['defautl_ext']+'`, type:`'+$templates[$i]['type']+'`})"><span class="'+$this->get_document_class_icon($templates[$i]["icon"])+'"></span>'+ $templates[$i]["name"] +'</button>';
        }
        return html::div([], $html);
    }

    function get_document_class_icon($icon)
    {
        switch ($icon) {
            case 'txt':
                return "icofont-file-document";         
            default:
                return $icon;
        }
    }


    function create_calendar_event()
    {
        $calendar = $this->rc->plugins->get_plugin('calendar');
        $calendar->add_texts('localization/', true);
        $calendar->ui->init();
        $calendar->ui->addJS();
        $calendar->ui->init_templates();
        $calendar->ui->calendar_list(array(), true); 
        if (rcube_utils::get_input_value('_framed', rcube_utils::INPUT_GET) == true)
        {
            $event = [];
            if (rcube_utils::get_input_value('_category', rcube_utils::INPUT_GET) !== null)
                $event["categories"] = [rcube_utils::get_input_value('_category', rcube_utils::INPUT_GET)];
            if (rcube_utils::get_input_value('_calendar_blocked', rcube_utils::INPUT_GET) !== null)//_calendar_blocked
                $event["calendar_blocked"] = rcube_utils::get_input_value('_calendar_blocked', rcube_utils::INPUT_GET);
            // if (rcube_utils::get_input_value('_startDate', rcube_utils::INPUT_GET) !== null)
            //     $event["start"] = [rcube_utils::get_input_value('_startDate', rcube_utils::INPUT_GET)];
            // else
            //     $event["start"] = ["now"];
            // if (rcube_utils::get_input_value('_endDate', rcube_utils::INPUT_GET) !== null)
            //     $event["end"] = [rcube_utils::get_input_value('_endDate', rcube_utils::INPUT_GET)];
            // else
            //     $event["end"] = ["start+1h"];

        }
        else
            $event = rcube_utils::get_input_value("_event", rcube_utils::INPUT_POST);
        $user = driver_mel::gi()->getUser();
        $event["calendar"] = driver_mel::gi()->mceToRcId($user->uid);
        $event["attendees"] = [
            ["email" => driver_mel::gi()->getUser()->email, "name" => $user->fullname, "role" => "ORGANIZER"]
        ];
        foreach ($this->rc->user->list_emails() as $rec) {
            if (!$identity)
                $identity = $rec;
            $identity['emails'][] = $rec['email'];
            $settings['identities'][$rec['identity_id']] = $rec['email'];
            }
        $identity['emails'][] = $this->rc->user->get_username();
        $settings['identity'] = array('name' => $identity['name'], 'email' => strtolower($identity['email']), 'emails' => ';' . strtolower(join(';', $identity['emails'])));
        $driver = $calendar->__get("driver");
        $this->rc->output->set_env('calendar_settings', $settings);
        $this->rc->output->set_env('identities-selector', $calendar->ui->identity_select(array(
            'id'         => 'edit-identities-list',
            'aria-label' => $this->gettext('roleorganizer'),
            'class'      => 'form-control custom-select',
        )));
        $this->rc->output->set_env('event_prop', $event);
        $this->include_script('../mel_workspace/js/setup_event.js');
        //$this->include_script('../calendar/calendar_ui.js');
        $this->rc->output->send('calendar.dialog');
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