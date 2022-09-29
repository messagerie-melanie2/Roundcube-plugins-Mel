<?php
class mel_useful_link extends rcube_plugin
{
        /**
     * @var string
     */
    public $task = '.*';

    /**
     * @var rcmail
     */
    private $rc;

    private $links;

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->require_plugin('mel_helper');
        $this->setup();

        if ($this->rc->task === "useful_links")
        {
          $this->register_action('index', array($this, 'index'));  
          $this->register_action('mel_widget', [$this, 'mel_widget']);
          $this->register_action('gpl', array($this, 'get_personal_links')); 
          $this->register_action('update', array($this, 'update_link'));  
          $this->register_action('update_default_color', array($this, 'update_default_color'));  
          $this->register_action('correct', array($this, 'correct_links'));  
          $this->register_action('delete', array($this, 'delete_link'));  
          $this->register_action('tak', array($this, 'pin_link'));
          $this->register_action('tak_default', array($this, 'pin_default'));
          $this->register_action('get_joined_links', array($this, 'get_joined_links'));
          $this->register_action('hideOrShow', array($this, 'HideOrShow'));

          if ($this->rc->action == "index" || $this->rc->action == "")
            $this->links = $this->get_personal_links();
            $this->include_uLinks();
            $this->rc->output->set_env("mul_old_items", $this->rc->config->get('portail_personal_items', []));
            $this->rc->output->set_env("mul_items", $this->rc->config->get('personal_useful_links', []));
            include_once "lib/hidden.php";
            $this->rc->output->set_env("mul_hiddens", mel_hidden_links::load($this->rc)->DEBUG());
        }
        else if (class_exists('mel_metapage') && mel_metapage::can_add_widget())
        {
            mel_metapage::add_widget("all_links" ,"useful_links");
            mel_metapage::add_widget("not_taked_links" ,"useful_links", 'joined');
            mel_metapage::add_widget("taked_links" ,"useful_links", 'epingle');
        }

        // $this->add_hook('preferences_list', array($this, 'prefs_list'));
        // $this->add_hook('preferences_save',     array($this, 'prefs_save'));
    }

    public function include_uLinks()
    {
      $this->include_script('js/links.js');
      $this->include_stylesheet($this->local_skin_path().'/links.css');
      $this->rc->output->set_env("link_modify_options", $this->rc->config->get('modify_options', []));
    }

    function setup()
    {
        $this->rc = rcmail::get_instance();
        $this->add_texts('localization/', true);
        $this->load_config();

        $this->register_task("useful_links");  
        
        $need_button = true;
        if (class_exists("mel_metapage")) {
          $need_button = $this->rc->plugins->get_plugin('mel_metapage')->is_app_enabled('app_ul');
        }

        if ($need_button)
        {
          $this->add_button(array(
            'command' => "ul",
            'class'	=> 'useful_links icon-mel-link',
            'classsel' => 'links button-selected icon-mel-link',
            'innerclass' => 'button-inner inner',
            'label'	=> 'My_useful_links',
            'title' => '',
            'type'       => 'link',
            'domain' => "mel_useful_link"
        ), "taskbar");
        }

      $this->include_script('js/classes.js');
    }

    function index()
    {
      $handler = [          
        'epingle'    => array($this, 'index_epingle'),
        'joined'    => array($this, 'index_joined'),
        'showahl'    => array($this, 'show_button_all_hidden_link')
      ];

      $isWidget = rcube_utils::get_input_value("_mel", rcube_utils::INPUT_GPC) === 'widget';

      if ($isWidget)
      {
        $isWidget = rcube_utils::get_input_value("_arg", rcube_utils::INPUT_GPC);

        switch ($isWidget) {
          case 'epingle':
            unset($handler['joined']);
            unset($handler['showahl']);
            break;

          case 'joined':
            unset($handler['epingle']);
            unset($handler['showahl']);
            break;
          
          default:
            unset($handler['epingle']);
            unset($handler['showahl']);
            break;
        }

        $this->rc->output->set_env("is_widget", true);
        $this->include_script('js/widget.js');
      }

      $this->rc->output->add_handlers($handler);

      $this->rc->output->set_pagetitle("Liens utiles");
      $this->rc->output->send('mel_useful_link.index');
    }

    public function mel_widget()
    {
      $this->rc->output->redirect(array("_action" => "index", "_task" => "useful_links", "_is_from" => "iframe", "_mel" => "widget", "_arg" => rcube_utils::get_input_value("_arg", rcube_utils::INPUT_GPC)));
    }

    public function show_button_all_hidden_link()
    {
      include_once "lib/hidden.php";

      $hiddened = mel_hidden_links::load($this->rc);

      if (true)
        return html::tag("button", [
          "id" => "mulsah",
          "class" => "mel-button btn btn-secondary crossed-eye",
          "title" => "Afficher toutes les vignettes",
          "style" => "margin-right:15px;",
          "onclick" => "ShowOrHideAllHidden()"
        ], html::tag("span", ["class" => "icon-mel-eye-crossed"]));

      return "";
    }

    public function index_epingle()
    {
      $html = $this->index_show(true, 1);
      return $html === "" ? "Pas de liens épinglés, ajoutez en dès maintenant !" : $html;
    }

    public function index_joined()
    {
      $isWidget = rcube_utils::get_input_value("_mel", rcube_utils::INPUT_GPC) === 'widget' && 
      rcube_utils::get_input_value("_arg", rcube_utils::INPUT_GPC) !== 'joined' &&
      rcube_utils::get_input_value("_arg", rcube_utils::INPUT_GPC) !== 'epingle';
      
      $html = '';

      if ($isWidget)
        $html .= $this->index_show(true, 1, !$isWidget);

      $html .= $this->index_show(false, 1, !$isWidget);

      return $html === "" ? "Pas de liens, ajoutez en dès maintenant en cliquant sur le bouton \"Ajouter\" !" : $html;
    }

    function index_show($pined, $page, $addInRow = true)
    {
      include_once "lib/xTuple.php";

      $html = "";
      $couples = new xTuple(4);
      $size = count($this->links);
      $min = 10*($page-1);
      $max = $size;// 10*$page > $size ? $size : 10*$page; 

      // //On forme des couples
      // for ($i=0; $i < $max; ++$i) { 

      //   if ($pined && !$this->links[$i]->pin ||
      //       !$pined && $this->links[$i]->pin)//Si on demande seulement ceux qui sont épinglé
      //     continue;

        
        
      //   $couples->add($this->links[$i]);
      // }

      $i = 0;
      foreach ($this->links as $key => $value) {
        if ($i >= $max)
          break;

          if ($pined && !$value->pin ||
            !$pined && $value->pin)//Si on demande seulement ceux qui sont épinglé
            continue;

      
      
        $couples->add($value);
        ++$i;
      }

      $size = $couples->length();

      //On transforme les couples en html
      for ($i=0; $i < $size; ++$i) { 

        $min = $couples->get($i);
        $max = count($min);

        if ($max === 0)
          continue;
        else {

          $divs = "";

          foreach ($min as $key => $value) {
            $divs .= html::div(["class" => "col-md-".$couples->get_md()], $value->html($this->rc));
          }

          if ($addInRow) $html.=html::div(["class" => "row"], $divs);
          else $html .= $divs;
        }

      }

      return $html;

    }

    public function get_joined_links()
    {
      $this->links = $this->get_personal_links(rcube_utils::get_input_value("_show", rcube_utils::INPUT_GPC) ?? false);
      echo $this->index_joined();
      exit;
    }

    function get_workspace_link($workspace, $plugin, $getHtml = false)
    {
      include_once "lib/link.php";

      $serialized_links = $plugin->get_object($workspace, mel_workspace::LINKS);

      $links = [];
      foreach ($serialized_links as $key => $value) {
        $links[] = mel_link::fromConfig($value);
      }

      if ($getHtml)
      {
        $this->links = $links;
        return [
          "pined" => $this->index_show(true, 1),
          "joined" => $this->index_show(false, 1)
        ];
      }
      else
        return $links;
    }

    function get_personal_links($showHidden = false)
    {
        if ($showHidden === "true" || $showHidden === "false")
          $showHidden = $showHidden === "true";

        include_once "lib/link.php";
        include_once "lib/hidden.php";

        $links = [];
        $user = driver_mel::gi()->getUser();
    
        //Links from old portal
        // $items = $this->getCardsConfiguration($user->dn);
        // $items = array_merge($items, $this->rc->config->get('portail_items_list', []));
        // $items = $this->mergeItems($items, $this->rc->config->get('portail_personal_items', []));

        $items = $this->rc->config->get('personal_useful_links', null);
        $hiddened = mel_hidden_links::load($this->rc);

        if ($items !== null)
        {
           foreach ($items as $key => $value) {

              if (!$showHidden && $hiddened->check_new($key))
                continue;

              $links[$key] = mel_link::fromConfig($value);
              $links[$key]->hidden = $hiddened->check_new($key);
                
           } 
        }
        // $dbug =            ["website_buttons61766c11d8650" => [
        //   "buttons" => [
        //     "Test enfant" => [
        //       "href" => "http://enfant"
        //     ]
        //   ],
        //   "color" => "default",
        //   "name" => "parent",
        //   "type" => "website_buttons",
        //   "url" => "http://Test parent",
        //  ]];
        //  $this->rc->user->save_prefs(array('portail_personal_items' => $dbug));

        // $items = [
        //   "website_links616d3bb2cf99e" => [
        //     "name" => "Test",
        //     "type" => "website_links",
        //     "personal" => true,
        //     "links" => [
        //       "Reddit" => ["url" => "https://reddit.com"],
        //       "¤This is swag" => ["url" => "https://minecraft-france.fr"]
        //     ]
        //   ]
        //     ];// $this->rc->config->get('portail_personal_items', []);
        //     $this->rc->user->save_prefs(array('portail_personal_items' => $items));

         $items = $this->getCardsConfiguration($user->dn);
         $items = array_merge($items, $this->rc->config->get('portail_items_list', []));
         $items = $this->mergeItems($items, $this->rc->config->get('portail_personal_items', []));

        if (count($items) > 0)
        {
          $paramDefault = $this->rc->config->get('personal_default_useful_links', []);

          $k = function ($k, $x) {
              return strpos($x["type"], "website") !== false;//$x["type"] === "website" || $x["type"] === "website_button" || $x["type"] === "website_links";
          };

          $items = $this->where($items, $k);

          $tmpLink;
          foreach ($items as $key => $value) {

              if (mel::is_internal() && strpos($key, "internet") !== false)
                continue;
              else if (!mel::is_internal() && strpos($key, "intranet") !== false)
                continue;

              // if ($value["url"] === null || $value["url"] === "")
              // {
              //   if ($value["links"] !== null || $value["buttons"] !== null)
              //   {
              //     if ($value["url"] === null || $value["url"] === "")
              //       continue;

              //   }
              //   else
              //     continue;
              // }

              if (!$showHidden && $hiddened->check_old($key))
                continue;

              $tmpLink = mel_link::fromOldPortail($key, $value);
              if (!$tmpLink->personal)
              {
                mel_link::updateDefaultConfig($tmpLink, $paramDefault);
              }
              $tmpLink->hidden = $hiddened->check_old($key);

              if (end($links) == $tmpLink)
                continue;

              $links[$key] = $tmpLink;
          }
        }
        //$this->rc->user->save_prefs(array('personal_useful_links' => []));
        //from config


        return $links;
    }

    function update_link()
    {
      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
      $title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_GPC);
      $link = rcube_utils::get_input_value("_link", rcube_utils::INPUT_GPC);
      $from = rcube_utils::get_input_value("_from", rcube_utils::INPUT_GPC);
      $showWhen = rcube_utils::get_input_value("_sw", rcube_utils::INPUT_GPC);
      $isSubItem = rcube_utils::get_input_value("_is_sub_item", rcube_utils::INPUT_GPC);//_is_sub_item
      $isSubItem = false;
      $forceUpdate = rcube_utils::get_input_value("_force", rcube_utils::INPUT_GPC) ?? false;
      $forceUpdate = $forceUpdate === "true";
      $color = rcube_utils::get_input_value("_color", rcube_utils::INPUT_GPC);
      $textColor = rcube_utils::get_input_value("_text_color", rcube_utils::INPUT_GPC);

      $isMultiLink = is_array($link) || strpos($link, '{') !== false;

      if ($isMultiLink) $link = json_decode($link);

      if ($id === "")
        $id = null;

      //Vérification des anciens
      $config = $id === null ? [

      ] : $this->rc->config->get('portail_personal_items', []);

      if (($config[$id] !== null || $isSubItem) && !$forceUpdate)
      {
        echo "override";
        exit;
      }
      else {
        include_once "lib/link.php";

        //Suppression de l'ancien lien 
        if ($config[$id] !== null)
        {
          //$this->child_old_links_to_new_link($config, $id);
          unset($config[$id]);
          $id = null;
          $this->rc->user->save_prefs(array('portail_personal_items' => $config));
        }
        //Suppression des sous-items des anciens liens
        else if ($isSubItem)
        {
          $parent = rcube_utils::get_input_value("_subparent", rcube_utils::INPUT_GPC);
          $child = rcube_utils::get_input_value("_subid", rcube_utils::INPUT_GPC);
          
          if ($config[$parent]["buttons"] !== null || $config[$parent]["links"] !== null)
            unset($config[$parent][$config[$parent]["buttons"] !== null ? "buttons" : "links"][$child]);

          $this->rc->user->save_prefs(array('portail_personal_items' => $config));
        }

        $config = $this->rc->config->get('personal_useful_links', []);
        $melLink;
        
        if ($id === null)
        {
          $id = $this->generate_id($title, $config);
          $melLink = mel_link::create($id, $title, $link, false, time(), $from, $showWhen, null, true, null, $isMultiLink);
        }
        else 
        {
          $melLink = mel_link::fromConfig($config[$id]);
          $melLink->title = $title;
          if ($isMultiLink) $melLink->links = $link;
          else $melLink->link = $link;
          $melLink->from = $from;
          $melLink->showWhen = $showWhen;

          if ($melLink->configKey === null || $melLink->configKey === "unknown" || $melLink->configKey === "")
            $melLink->configKey = $id;
        }

        $melLink->color = $color;
        $melLink->textColor = $textColor;

        $config[$id] = $melLink->serialize();
        $this->rc->user->save_prefs(array('personal_useful_links' => $config));
      }

      echo true;
      exit;

    }

    public function update_default_color()
    {
      include_once "lib/link.php";
      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
      $subId = rcube_utils::get_input_value("_sub_id", rcube_utils::INPUT_GPC);
      $color = rcube_utils::get_input_value("_color", rcube_utils::INPUT_GPC);

      $paramDefault = $this->rc->config->get('personal_default_useful_links', []);
      $configKey = isset($subId) ? "$id|$subId" : $id;

      $link;

      if ($paramDefault[$configKey] === null) $link = mel_default_link_sub_item::create($id, $subId);
      else $link = mel_default_link::load($paramDefault[$configKey]);

      $paramDefault[$configKey] = $link->setColor($color)->serialize();

      $this->rc->user->save_prefs(array('personal_default_useful_links' => $paramDefault));

      echo true;
      exit;
    }

    function pin_default()
    {
      include_once "lib/link.php";
      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
      $subId = rcube_utils::get_input_value("_sub_id", rcube_utils::INPUT_GPC);

      $paramDefault = $this->rc->config->get('personal_default_useful_links', []);
      $configKey = isset($subId) ? "$id|$subId" : $id;

      $link;

      if ($paramDefault[$configKey] === null) $link = mel_default_link_sub_item::create($id, $subId);
      else $link = mel_default_link::load($paramDefault[$configKey]);

      $paramDefault[$configKey] = $link->setPin(!$link->pin)->serialize();

      $this->rc->user->save_prefs(array('personal_default_useful_links' => $paramDefault));

      echo true;
      exit;
    }

    function pin_link()
    {
      include_once "lib/link.php";

      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
      $isSubItem = rcube_utils::get_input_value("_is_sub_item", rcube_utils::INPUT_GPC) ?? false;
      $isSubItem = false;
      $force = rcube_utils::get_input_value("_forced", rcube_utils::INPUT_GPC) ?? false;
      $force = $force === "true";

      $config = $this->rc->config->get('portail_personal_items', []);

      //Prévenir pour les anciens liens
      if (($config[$id] !== null || $isSubItem) && !$force)
      {
        echo "override";
        exit;
      }

      //Si c'est un vieux lien
      if ($config[$id] !== null && !$isSubItem)
      {

        //$this->child_old_links_to_new_link($config, $id);

        $link = mel_link::fromOldPortail($id, $config[$id]);
        $link->pin = true;
        $link->configKey = $this->generate_id($id, $this->rc->config->get('personal_useful_links', []));
        unset($config[$id]);
        $this->rc->user->save_prefs(array('portail_personal_items' => $config));

        $config = $this->rc->config->get('personal_useful_links', []);
        $config[$link->configKey] = $link->serialize();
        $this->rc->user->save_prefs(array('personal_useful_links' => $config));

      }
      //Si c'est un sous item d'un vieux lien
      else if ($isSubItem)
      {
        $parent = rcube_utils::get_input_value("_subparent", rcube_utils::INPUT_GPC);
        $child = rcube_utils::get_input_value("_subid", rcube_utils::INPUT_GPC);
        
        $link = mel_link::fromOldPortail($id, $config[$parent][$config[$parent]["buttons"] !== null ? "buttons" : "links"][$child], true);
        
        if ($link->color === null && $config[$parent]["color"] !== null && $config[$parent]["color"] !== "default")
          $link->color = $config[$parent]["color"];

        if ($link->title === null || $link->title === "")
          $link->title = rcube_utils::get_input_value("_subtitle", rcube_utils::INPUT_GPC);
        
        unset($config[$parent][$config[$parent]["buttons"] !== null ? "buttons" : "links"][$child]);
        $this->rc->user->save_prefs(array('portail_personal_items' => $config));
        $link->pin = true;
        $link->configKey = $this->generate_id($id, $this->rc->config->get('personal_useful_links', []));
        $config = $this->rc->config->get('personal_useful_links', []);
        $config[$link->configKey] = $link->serialize();
        $this->rc->user->save_prefs(array('personal_useful_links' => $config));

      }
      //SINON
      else {
        $config = $this->rc->config->get('personal_useful_links', []);
        $link = mel_link::fromConfig($config[$id]);
        $link->pin = !$link->pin;
        $config[$id] = $link->serialize();
        $this->rc->user->save_prefs(array('personal_useful_links' => $config));
      }

      echo true;
      exit;
    }

    function child_old_links_to_new_link(&$config, $id)
    {
      return;
        //On vérifie si il y a des liens enfants
        if ($config[$id]["buttons"] !== null || $config[$id]["links"] !== null)
        {
          $member = $config[$id]["buttons"] !== null ? "buttons" : "links";

          if (count($config[$id][$member]) > 0)
          {
            $tmpConfig = $this->rc->config->get('personal_useful_links', []);

            //Tranformer les liens enfants en lien BNum
            foreach ($config[$id][$member] as $key => $value) {
              $value["name"] = $config[$id]["name"]." - $key";

              if ($value["color"] === null)
                $value["color"] = $config[$id]["color"];

              //Créer le lien BNum
              $link = mel_link::fromOldPortail(
                $this->generate_id($id, $tmpConfig),
                $value
              );
              $link->createDate = time();

              //retirer le lien
              unset($config[$id][$member][$key]);
              
              //Sauvegarder le nouveau lien
              $tmpConfig[$link->configKey] = $link->serialize();

            }

            $this->rc->user->save_prefs(array('personal_useful_links' => $tmpConfig));
          }
        }
    }

    function delete_link()
    {
      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
      $isSubItem = rcube_utils::get_input_value("_is_sub_item", rcube_utils::INPUT_GPC) ?? false;
      $isSubItem = false;
      
      //Supression chez les anciens
      $config = $this->rc->config->get('portail_personal_items', []);
      if ($config[$id] !== null && !$isSubItem)
      {
        //$this->child_old_links_to_new_link($config, $id);
        unset($config[$id]);
        $this->rc->user->save_prefs(array('portail_personal_items' => $config));
      }
      else if($isSubItem)
      {
        $parent = rcube_utils::get_input_value("_subparent", rcube_utils::INPUT_GPC);
        $child = rcube_utils::get_input_value("_subid", rcube_utils::INPUT_GPC);
        $isButton = $config[$parent]["links"] === null;
        unset($config[$parent][$isButton ? "buttons" : "links"][$child]);
        $this->rc->user->save_prefs(array('portail_personal_items' => $config));
      }
      else {
        $config = $this->rc->config->get('personal_useful_links', []);
        unset($config[$id]);
        $this->rc->user->save_prefs(array('personal_useful_links' => $config));
      }

      echo true;
      exit;
    }

    function correct_links()
    {
      include_once "lib/link.php";

      $update = false;
      $config = $this->rc->config->get('personal_useful_links', []);

      foreach ($config as $key => $value) {
        $value = mel_link::fromConfig($config[$key]);
        //Si problème de clé
        if ($key == false || $key == "false" || $key == null || $key === "unknown")
        {
          $id = $this->generate_id($value->title, $config);
          $value->configKey = $id;
          $config[$id] = $value->serialize();
          unset($config[$key]);

          if (!$update)
            $update = true;
        }//Si problème de configkey
        else if ($value->configKey === null || $value->configKey === "unknown")
        {
          if ($key !== $value->configKey)
            $value->configKey = $key;
          else 
          {
            unset($config[$key]);
            $key = $this->generate_id($value->title, $config);
            $value->configKey = $key;
          }

          $config[$key] = $value->serialize();

          if (!$update)
            $update = true;
        }
      }

      if ($update)
        $this->rc->user->save_prefs(array('personal_useful_links' => $config));

      echo $update;
      exit;

    }

    function HideOrShow()
    {
      //init
      include_once "lib/hidden.php";

      $hiddened = mel_hidden_links::load($this->rc);
      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
      $isSubItem = rcube_utils::get_input_value("_is_sub_item", rcube_utils::INPUT_GPC) ?? false;
      $isSubItem = $isSubItem === "true";

      $user = driver_mel::gi()->getUser();
      $config = $this->getCardsConfiguration($user->dn);
      $config = array_merge($config, $this->rc->config->get('portail_items_list', []));
      $config = $this->mergeItems($config, $this->rc->config->get('portail_personal_items', []));

      //body
      if ($isSubItem)
      {
        $parent = rcube_utils::get_input_value("_subparent", rcube_utils::INPUT_GPC);
        $child = rcube_utils::get_input_value("_subid", rcube_utils::INPUT_GPC);
        $hiddened->set_old($child, $parent);
      }
      else if ($config[$id] !== null)
        $hiddened->set_old($id);
      else
        $hiddened->set_new($id);

      //return
      echo $hiddened->save($this->rc);
      exit;

      //end
    }

    /************* USEFUL FUNCTIONS **************/
    function generate_id($title, $config)
    {
      $max = 20;
      mel_helper::load_helper($this->rc)->include_utilities();

      include_once "lib/mel_utils.php";
      $text = mel_utils::replace_determinants(mel_utils::remove_accents(mel_utils::replace_special_char(strtolower($title))), "-");
      $text = str_replace(" ", "-", $text);
      if (count($text) > $max)
      {
          $title = "";
          for ($i=0; $i < count($text); $i++) { 
              if ($i >= $max)
                  break;
              $title.= $text[$i];
          }
          $text = $title;
      }
      $it = 0;
      try {
        do {
          ++$it;
      } while ($config[$text."-".$it] !== null);
      } catch (\Throwable $th) {
        $it = 0;
        do {
          ++$it;
          $newid = $text."-".$it;
      } while ($config->$newid !== null);
      }
      return $text."-".$it;
    }

    /**
     * Permet de récupérer seulement les objets d'un tableau qui valide une condition
     *
     * @param array $array
     * @param callback $callback
     * @return array
     */
    function where($array, $callback)
    {
        $r = [];
        foreach ($array as $key => $value) {
            if ($callback($key, $value))
                $r[$key] = $value;
        }
        return $r;
    }

      /**
   * Merge entre les global items et les personal items
   * Certaines valeurs de global items peuvent être modifiées par un personal item
   */
  private function mergeItems($globalItems, $personalItems) {
    if (is_array($personalItems)) {
      // Support for non personal items
      foreach ($globalItems as $id => $item) {
        $globalItems[$id]['personal'] = false;
      }
      // Merge personal items to global items
      foreach ($personalItems as $id => $personalItem) {
        if (isset($globalItems[$id])) {
          if (!isset($globalItems[$id]['unchangeable']) || !$globalItems[$id]['unchangeable']) {
            if (isset($personalItem['hide'])) {
              $globalItems[$id]['hide'] = $personalItem['hide'];
            }
            if ($globalItems[$id]['type'] != 'configuration') {
              if (isset($personalItem['order'])) {
                $globalItems[$id]['order'] = $personalItem['order'];
              }
            }
          }
          $item = $globalItems[$id];
          $template = $this->templates[$item['type']];
          // Ajoute le php ?
          if (isset($template['php'])) {
            include_once 'modules/' . $item['type'] . '/' . $template['php'];
            $classname = ucfirst($item['type']);
            $object = new $classname($id, $this);
            $globalItems[$id] = $object->mergeItem($item, $personalItem);
          }
        }
        else {
          $personalItem['personal'] = true;
          $globalItems[$id] = $personalItem;
        }
      }
    }
    return $globalItems;
  }


    /**
   * Va lire la configuration des cards dans l'arborescence configuré
   * Par défault récupère la conf dans les fichiers config.json de chaque dossier
   * 
   * @param string $user_dn
   * @param string $config_file
   * @return array
   */
  private function getCardsConfiguration($user_dn, $config_file = '/config.json') {
    $configuration_path = $this->rc->config->get('portail_configuration_path', null);
    $configuration = [];
    if (isset($configuration_path)) {
      $configuration_base = $this->rc->config->get('portail_base_configuration_dn', null);
      $user_folders = explode(',', str_replace($configuration_base, '', $user_dn));
      for ($i = count($user_folders) - 1; $i >= 0; $i--) {
        $user_folder = explode('=', $user_folders[$i], 2);
        $configuration_path = $configuration_path . '/' . $user_folder[1];
        if (is_dir($configuration_path)) {
          $config_file = '/' . $user_folder[1] . '.json';
          $file = $configuration_path . $config_file;
          if (file_exists($file)) {
            $json = file_get_contents($file);
            if (strlen($json)) {
              $data = json_decode($json, true);
              if (!is_null($data)) {
                $configuration = array_merge($configuration, $data);
              }
            }
          }
        }
        else {
          // Le dir n'existe pas on sort de la boucle
          break;
        }
      }
    }
    return $configuration;
  }

  public static function toLink($item)
  {
    include_once "lib/link.php";

    return mel_link::fromConfig($item);

  }

  public static function createLink($id, $title, $link, $pin, $showWhen, $createDate, $from = "always", $color = null,$textColor = null, $multilink = false)
  {
    include_once "lib/link.php";

    return mel_link::create($id, $title, $link, $pin, $createDate, $from, $showWhen, null, true, $color, $multilink, $textColor);
  }



  // public function prefs_list($args)
  // {

  // }

}