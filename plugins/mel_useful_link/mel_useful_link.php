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

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        //$this->require_plugin('mel_helper');
        $this->setup();

        if ($this->rc->task === "useful_links")
        {
          $this->register_action('index', array($this, 'index'));  
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
          'label'	=> 'Liens utiles',
          'title' => '',
          'type'       => 'link',
          'domain' => "useful_link"
      ), "otherappsbar");
    }

    function index()
    {
      $this->rc->output->set_pagetitle("Liens utiles");
      $this->rc->output->send('mel_useful_link.index');
    }

    function get_personal_links()
    {
        include_once "lib/link.php";

        $links = [];
        $user = driver_mel::gi()->getUser();
    
        //Links from old portal
        $items = $this->getCardsConfiguration($user->dn);
        $items = array_merge($items, $this->rc->config->get('portail_items_list', []));
        $items = $this->mergeItems($items, $this->rc->config->get('portail_personal_items', []));

        if (count($items) > 0)
        {
          $k = function ($k, $x) {
              return $x["type"] === "website" || $x["type"] === "website_button" || $x["type"] === "website_links";
          };

          $items = $this->where($items, $k);

          foreach ($items as $key => $value) {
              $links[] = mel_link::fromOldPortail($value);
          }
        }

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

    function get_workspace_link()
    {}

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
                $r[] = $value;
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