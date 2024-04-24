<?php
class mel_useful_link extends bnum_plugin
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
          $this->register_action('correct', array($this, 'correct_links'));  
          $this->register_action('delete', array($this, 'delete_link'));  
          $this->register_action('update_list', array($this, 'update_list'));

          if ($this->rc->action == "index" || $this->rc->action == "")
            $this->include_uLinks();

            $this->convert_old_links();
            $this->rc->output->set_env("mul_old_items", $this->rc->config->get('portail_personal_items', []));
            $this->rc->output->set_env("mul_items", $this->rc->config->get('new_personal_useful_links', []));
            $this->rc->output->set_env("external_icon_url", $this->rc->config->get('external_icon_url', []));
            $this->rc->output->set_env("modify_order_delay", $this->rc->config->get('modify_order_delay', []));
            include_once "lib/hidden.php";
            $this->rc->output->set_env("mul_hiddens", mel_hidden_links::load($this->rc)->DEBUG());
        }
        else if (class_exists('mel_metapage') && mel_metapage::can_add_widget())
        {
            mel_metapage::add_widget("all_links" ,"useful_links");
            mel_metapage::add_widget("not_taked_links" ,"useful_links", 'joined');
        }

    }

    public function convert_old_links() {
      include_once "lib/link.php";

      if (!$this->rc->config->get('new_personal_useful_links', [])) {
        
        $mul_items = $this->rc->config->get('personal_useful_links', []);
        $this->rc->user->save_prefs(array('save_personal_useful_links' => $mul_items));
        $newMelLinks = $this->rc->config->get('new_personal_useful_links', []);
        
        foreach ($mul_items as $id => $item) {
          $item = json_decode($item);
          if ($item->links) {
            $links = [];
            foreach ($item->links as $key => $value) {
              $links[] = new MelLink(uniqid(), $value, $this->validate_url($key));
            }
            $temp = new MelFolderLink($id, $item->title, $links);
          }
          else
            $temp = new MelLink($id, $item->title, $this->validate_url($item->link));

          $newMelLinks[$id] = $temp->serialize();
        }
        
        $newMelLinks = array_merge($newMelLinks, $this->convert_default_link());

        // $this->rc->user->save_prefs(array('new_personal_useful_links' => []));
        $this->rc->user->save_prefs(array('new_personal_useful_links' => $newMelLinks));
        $this->rc->user->save_prefs(array('personal_useful_links' => []));
     }
    }
    
    public function convert_default_link() {      
      $items = $this->getCardsConfiguration(driver_mel::gi()->getUser()->dn);
      $items = array_merge($items, $this->rc->config->get('portail_items_list', []));
      $newMelLinks = [];

      foreach ($items as $item) {
        $id = uniqid();
        if (!$item['links']) {
          $temp = new MelLink($id, $item['name'], $this->validate_url($item['url']));
        }
        else {
          $links = [];
          foreach ($item['links'] as $key => $value) {
            $links[] = new MelLink(uniqid(), $key, $this->validate_url($value['url']));
          }
          $temp = new MelFolderLink($id, $item['name'], $links);
        }
        $newMelLinks[$id] = $temp->serialize();
      }

      return $newMelLinks;
    }

    public function validate_url($url) {
      if (!filter_var($url, FILTER_VALIDATE_URL)) {
        $url = filter_var($url, FILTER_SANITIZE_URL);
        if (strpos($url, "http") === false) {
          $url = "http://".$url;
        }
      }

      return $url;
    }

    public function update_list() {
      $newOrder = rcube_utils::get_input_value("_list", rcube_utils::INPUT_POST);
      $key = rcube_utils::get_input_value("_key", rcube_utils::INPUT_POST);

      $newList = array();
      foreach ($newOrder as $object) {
        if (isset($object['id'])) {
            $id = $object['id'];
            if ($object['link'])
              $temp = new MelLink($id, $object['title'], $object['link']);
            else if($object['links'])
              $temp = new MelFolderLink($id, $object['title'], $object['links']);
            
            $newList[$id] = $temp->serialize();
        }
    }

      if(!$this->rc->plugins->exec_hook('save_external_ulinks', ['key' => $key, 'links' => $newList])['done']) 
      {
        $this->rc->user->save_prefs(array('new_personal_useful_links' => $newList));
      }
    }

    public function include_uLinks()
    {
      $this->load_script_module('manager');
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
        
        $need_button = 'taskbar';
        if (class_exists("mel_metapage")) {
          $need_button = $this->rc->plugins->get_plugin('mel_metapage')->is_app_enabled('app_ul') ? $need_button : 'otherappsbar';
        }

        if ($need_button)
        {
          $this->add_button(array(
            'command' => "useful_links",
            'class'	=> 'useful_links icon-mel-link',
            'classsel' => 'links button-selected icon-mel-link',
            'innerclass' => 'button-inner inner',
            'label'	=> 'My_useful_links',
            'title' => '',
            'type'       => 'link',
            'domain' => "mel_useful_link"
        ), $need_button);
        }

      $this->include_script('js/classes.js');
      $this->include_script('js/display.js');
    }

    function index()
    {
      $this->rc->output->set_pagetitle("Liens utiles");
      $this->rc->output->send('mel_useful_link.index');
    }

    public function mel_widget()
    {
      $this->rc->output->redirect(array("_action" => "index", "_task" => "useful_links", "_is_from" => "iframe", "_mel" => "widget", "_arg" => rcube_utils::get_input_value("_arg", rcube_utils::INPUT_GPC)));
    }

    function get_workspace_link($workspace, $plugin)
    {
      include_once "lib/link.php";

      $serialized_links = $plugin->get_object($workspace, mel_workspace::LINKS);

      $links = [];
      foreach ($serialized_links as $key => $value) {
        $decoded_value = json_decode($value);
        if ($decoded_value->configKey) {
          $temp = new MelLink($decoded_value->configKey, $decoded_value->title, $decoded_value->link);
          $links[] = $temp->serialize();
        }
        else {
          $links[] = $value;
        }
      }

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
      include_once "lib/link.php";
  
      $link = rcube_utils::get_input_value("link", rcube_utils::INPUT_GPC);
      $key = rcube_utils::get_input_value("_key", rcube_utils::INPUT_GPC);

      $id = $link['_id'];
      $title = $link['_title'];
      $link = $link['_link'];
      $config = [];
      $melLink;
  
      if ($id === "")
        $id = null;
  
  
      $isMultiLink = is_array($link) || strpos($link, '{') !== false;
  
      $external_links = get_object_vars($this->rc->plugins->exec_hook('get_external_ulink', ['key' => $key])['links']);
  
      $config = $key ? $external_links : $this->rc->config->get('new_personal_useful_links', []);
  
      if ($id === null) {
      $id = uniqid();
  
        if ($isMultiLink)
          $melLink = new MelFolderLink($id, $title, $link);
        else
          $melLink = new MelLink($id, $title, $link);
      } 
      else {
        $melLink = json_decode($config[$id]);
  
        if ($isMultiLink)
          $melLink = new MelFolderLink($id, $title, $link);
        else
          $melLink = new MelLink($id, $title, $link);
      }
  
      //On supprime les anciens liens
      if ($isMultiLink) {
        foreach ($link as $link_key => $value) {
          unset($config[$link_key]);
        }
      }
  
      $config[$id] = $melLink->serialize();

      if(!$this->rc->plugins->exec_hook('save_external_ulinks', ['key' => $key, 'links' => $config])['done']) 
      {
        $this->rc->user->save_prefs(array('new_personal_useful_links' => $config));
      }

      echo $id;
      exit;
    }

    function delete_link()
    {
      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
      $key = rcube_utils::get_input_value("_key", rcube_utils::INPUT_GPC);

      $external_links = get_object_vars($this->rc->plugins->exec_hook('get_external_ulink', ['key' => $key])['links']);
      
      $links = $key ? $external_links : $this->rc->config->get('new_personal_useful_links', []);

      unset($links[$id]);

      if(!$this->rc->plugins->exec_hook('save_external_ulinks', ['key' => $key, 'links' => $links])['done']) 
      {
        $this->rc->user->save_prefs(array('new_personal_useful_links' => $links));
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


    /************* USEFUL FUNCTIONS **************/
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
}