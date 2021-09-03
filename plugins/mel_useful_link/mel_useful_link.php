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
          $this->register_action('gpl', array($this, 'get_personal_links')); 
          $this->register_action('update', array($this, 'update_link'));  
          $this->register_action('delete', array($this, 'delete_link'));  
          $this->register_action('tak', array($this, 'pin_link'));

          if ($this->rc->action == "index" || $this->rc->action == "")
            $this->links = $this->get_personal_links();
            $this->include_script('js/links.js');
            $this->rc->output->set_env("link_modify_options", $this->rc->config->get('modify_options', []));
        }
    }

    function setup()
    {
        $this->rc = rcmail::get_instance();
        $this->add_texts('localization/', true);
        $this->load_config();

        $this->register_task("useful_links");  
        
        $this->add_button(array(
          'command' => "ul",
          'class'	=> 'useful_links icon-mel-link',
          'classsel' => 'links button-selected icon-mel-link',
          'innerclass' => 'button-inner inner',
          'label'	=> 'useful_links',
          'title' => '',
          'type'       => 'link',
          'domain' => "mel_useful_link"
      ), "otherappsbar");
    }

    function index()
    {
      $this->rc->output->add_handlers(array(
          'epingle'    => array($this, 'index_epingle'),
      ));
      $this->rc->output->add_handlers(array(
          'joined'    => array($this, 'index_joined'),
      ));

      $this->include_stylesheet($this->local_skin_path().'/links.css');

      $this->rc->output->set_pagetitle("Liens utiles");
      $this->rc->output->send('mel_useful_link.index');
    }

    public function index_epingle()
    {
      $html = $this->index_show(true, 1);
      return $html === "" ? "Pas de liens épinglés, ajoutez en dès maintenant !" : $html;
    }

    public function index_joined()
    {
      $html = $this->index_show(false, 1);
      return $html === "" ? "Pas de liens, ajoutez en dès maintenant en cliquant sur le bouton \"Ajouter\" !" : $html;
    }

    function index_show($pined, $page)
    {
      include_once "lib/arrayTuple.php";

      $html = "";
      $couples = new arrayTuple();
      $size = count($this->links);
      $min = 10*($page-1);
      $max = $size;// 10*$page > $size ? $size : 10*$page; 

      //On forme des couples
      for ($i=0; $i < $max; ++$i) { 

        if ($pined && !$this->links[$i]->pin)//Si on demande seulement ceux qui sont épinglé
          continue;
        
        $couples->add($this->links[$i]);
      }

      $size = $couples->length();

      //On transforme les couples en html
      for ($i=0; $i < $size; ++$i) { 

        $min = $couples->get($i);
        $max = count($min);

        if ($max === 0)
          continue;
        else {
          $html.=html::div(["class" => "row"], 
            html::div(["class" => "col-md-6"], $min[0]->html($this->rc))
            .($max === 2 ? html::div(["class" => "col-md-6"], $min[1]->html($this->rc)) : "")
          );
        }

      }

      return $html;

    }

    function get_personal_links()
    {
        include_once "lib/link.php";

        $links = [];
        $user = driver_mel::gi()->getUser();
    
        //Links from old portal
        // $items = $this->getCardsConfiguration($user->dn);
        // $items = array_merge($items, $this->rc->config->get('portail_items_list', []));
        // $items = $this->mergeItems($items, $this->rc->config->get('portail_personal_items', []));

        $items = $this->rc->config->get('portail_personal_items', []);

        if (count($items) > 0)
        {
          $k = function ($k, $x) {
              return $x["type"] === "website" || $x["type"] === "website_button" || $x["type"] === "website_links";
          };

          $items = $this->where($items, $k);

          $tmpLink;
          foreach ($items as $key => $value) {
              if ($value["url"] === null || $item["url"] === "")
                continue;

              $tmpLink = mel_link::fromOldPortail($key, $value);
              if (end($links) == $tmpLink)
                continue;
              $links[] = $tmpLink;
          }
        }
        //$this->rc->user->save_prefs(array('personal_useful_links' => []));
        //from config
        $items = $this->rc->config->get('personal_useful_links', null);

        if ($items !== null)
        {
           foreach ($items as $key => $value) {
               $links[] = mel_link::fromConfig($value);
           } 
        }

        return $links;
    }

    function update_link()
    {
      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);
      $title = rcube_utils::get_input_value("_title", rcube_utils::INPUT_GPC);
      $link = rcube_utils::get_input_value("_link", rcube_utils::INPUT_GPC);
      $from = rcube_utils::get_input_value("_from", rcube_utils::INPUT_GPC);
      $showWhen = rcube_utils::get_input_value("_sw", rcube_utils::INPUT_GPC);
      $forceUpdate = rcube_utils::get_input_value("_force", rcube_utils::INPUT_GPC) ?? false;

      if ($id === "")
        $id = null;

      //Vérification des anciens
      $config = $id === null ? [] : $this->rc->config->get('portail_personal_items', []);

      if ($config[$id] !== null && !$forceUpdate)
      {
        echo "override";
        exit;
      }
      else {

        //Suppression de l'ancien lien 
        if ($config[$id] !== null)
        {
          unset($config[$id]);
          //TO DO => Vérifier set_user_pref
          $this->rc->user->save_prefs(array('portail_personal_items' => $config));
        }

        $config = $this->rc->config->get('personal_useful_links', []);
        $melLink;

        include_once "lib/link.php";
        
        if ($id === null)
        {
          $id = $this->generate_id($title, $config);
          $melLink = mel_link::create($id, $title, $link, false, time(), $from, $showWhen);
        }
        else 
        {
          $melLink = mel_link::fromConfig($config[$id]);
          $melLink->title = $title;
          $melLink->link = $link;
          $melLink->from = $from;
          $melLink->showWhen = $showWhen;
        }

        $config[$id] = $melLink->serialize();
        $this->rc->user->save_prefs(array('personal_useful_links' => $config));
      }

      echo true;
      exit;

    }

    function pin_link()
    {
      include_once "lib/link.php";

      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);

      $config = $this->rc->config->get('portail_personal_items', []);
      if ($config[$id] !== null)
      {
        $link = mel_link::fromOldPortail($id, $config[$id]);
        $link->pin = true;
        $link->configKey = $this->generate_id($id, $this->rc->config->get('personal_useful_links', []));
        unset($config[$id]);
        $this->rc->user->save_prefs(array('portail_personal_items' => $config));

        $config = $this->rc->config->get('personal_useful_links', []);
        $config[$link->configKey] = $link->serialize();
        $this->rc->user->save_prefs(array('personal_useful_links' => $config));

      }
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

    function delete_link()
    {
      $id = rcube_utils::get_input_value("_id", rcube_utils::INPUT_GPC);

      //Supression chez les anciens
      $config = $this->rc->config->get('portail_personal_items', []);
      if ($config[$id] !== null)
      {
        unset($config[$id]);
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

    function get_workspace_link()
    {}

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
      do {
          ++$it;
      } while ($config[$text."-".$it] !== null);
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

}