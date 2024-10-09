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

    if ($this->rc->task === "useful_links") {
      // bloquer les refresh
      $this->rc->output->set_env('refresh_interval', 0);

      $this->register_action('index', array($this, 'index'));
      $this->register_action('mel_widget', [$this, 'mel_widget']);
      $this->register_action('gpl', array($this, 'get_personal_links'));
      $this->register_action('update', array($this, 'update_link'));
      $this->register_action('correct', array($this, 'correct_links'));
      $this->register_action('delete', array($this, 'delete_link'));
      $this->register_action('update_list', array($this, 'update_list'));

      if ($this->rc->action == "index" || $this->rc->action == "") {
        $this->init_links();

        $this->rc->output->set_env("mul_old_items", $this->rc->config->get('portail_personal_items', []));
        $this->rc->output->set_env("mul_items", $this->rc->config->get('new_personal_useful_links', []));
        $this->rc->output->set_env("external_icon_url", $this->rc->config->get('external_icon_url', []));
        $this->rc->output->set_env("default_links", $this->get_store_link());

        include_once "lib/hidden.php";
        $this->rc->output->set_env("mul_hiddens", mel_hidden_links::load($this->rc)->DEBUG());
      }
    } else if ($this->rc->task === 'bureau') {
      $this->break_initial_fonctionality('mel.portal.links.generate.html');
      $this->init_links();

      $this->add_hook('mel.portal.links.html', array($this, 'mel_portal_link'));
      $this->rc->output->set_env("mul_items", $this->rc->config->get('new_personal_useful_links', []));
      $this->rc->output->set_env("external_icon_url", $this->rc->config->get('external_icon_url', []));
      $this->rc->output->set_env("default_links", $this->get_store_link());

      $this->rc->output->set_env("mel_portal_ulink", true);
    } else if (class_exists('mel_metapage') && mel_metapage::can_add_widget()) {
      mel_metapage::add_widget("all_links", "useful_links");
      mel_metapage::add_widget("not_taked_links", "useful_links", 'joined');
    }
  }

  /** 
   *  Hook pour l'ajout des liens utiles sur la page d'accueil
   * 
   * @return html[]
   */
  public function mel_portal_link()
  {
    $html = html::div(['class' => 'links-items mel-portal-ulinks']);
    return ['html' => $html];
  }

  /**
   * Initialise les liens utiles
   * 
   * @return void
   */
  public function init_links()
  {
    $this->include_uLinks();
    include_once "lib/link.php";

    $personal_useful_links = $this->rc->config->get('personal_useful_links', []);
    $new_personal_useful_links = $this->rc->config->get('new_personal_useful_links', []);

    if (empty($personal_useful_links)) {
      if (empty($new_personal_useful_links)) {
        //Si aucun lien, on met les liens par défaut
        $this->rc->user->save_prefs(array('new_personal_useful_links' => $new_personal_useful_links));
      } else {
        //On converti les images qui contenait une icone
        $this->convert_image_icon($new_personal_useful_links);
      }
    } else {
      if (empty($new_personal_useful_links)) {
        $this->convert_old_links($personal_useful_links);
      }
    }

    $this->check_pinned_link();
  }

  /**
   * Inclus les dépendances nécessaires pour les liens utiles
   * 
   * @return void
   */
  public function include_uLinks()
  {
    $this->load_script_module('manager');
    $this->include_stylesheet($this->local_skin_path() . '/links.css');
    $this->rc->output->set_env("link_modify_options", $this->rc->config->get('modify_options', []));
  }

  /**
   * Récupère et les liens épinglés qui ne sont pas affichés
   * 
   * @return MelLink[]
   */
  public function check_pinned_link()
  {
    $created_default_useful_links = $this->rc->config->get('created_default_useful_links', []);
    $new_personal_useful_links = $this->rc->config->get('new_personal_useful_links', []);
    $default_links = $this->get_default_link();

    if (empty($created_default_useful_links)) {
      $created_default_useful_links = $this->get_created_pinned_link();

      $this->rc->user->save_prefs(array('created_default_useful_links' => $created_default_useful_links));
    }

    $changed_default = false;
    $changed_links = false;
    foreach ($created_default_useful_links as $id => $already_created) {
      //Si l'utilisateur à déjà le lien dans sa liste
      if (array_key_exists($id, $new_personal_useful_links)) {
        //On met a true pour ne pas recréer le lien si l'utilisateur le supprime
        if ($already_created === false) {
          $created_default_useful_links[$id] = true;
          $changed_default = true;
        }
        continue;
      }

      if ($already_created === true) continue;

      $new_personal_useful_links = [$id => $default_links[$id]] + $new_personal_useful_links;
      $created_default_useful_links[$id] = true;
      $changed_links = true;
      $changed_default = true;
    }

    if ($changed_default) $this->rc->user->save_prefs(array('created_default_useful_links' => $created_default_useful_links));
    if ($changed_links) $this->rc->user->save_prefs(array('new_personal_useful_links' => $new_personal_useful_links));
  }

  /**
   * Converti les anciens liens vers des nouveaux objet MelLink
   *
   * @param [] $personal_useful_links
   * 
   * @return void
   */
  public function convert_old_links($personal_useful_links)
  {
    //On sauvegarde les anciens liens en cas de problème
    $this->rc->user->save_prefs(array('save_personal_useful_links' => $personal_useful_links));

    foreach ($personal_useful_links as $id => $item) {
      $item = json_decode($item);
      if ($item->links) {
        $links = [];
        foreach ($item->links as $key => $value) {
          $links[] = new MelLink(uniqid(), $value, $this->validate_url($key));
        }
        $temp = new MelFolderLink($id, $item->title, $links);
      } else
        $temp = new MelLink($id, $item->title, $this->validate_url($item->link));

      $new_personal_useful_links[$id] = $temp->serialize();
    }

    $new_personal_useful_links = array_merge($new_personal_useful_links, $this->get_default_link());

    $this->rc->user->save_prefs(array('new_personal_useful_links' => $new_personal_useful_links));
    $this->rc->user->save_prefs(array('personal_useful_links' => []));
  }

  /**
   * Corrige le problème des icones s'étant déplacer dans les images des liens
   *
   * @param MelLink[] $new_personal_useful_links
   * 
   * @return void
   */
  private function convert_image_icon($new_personal_useful_links)
  {
    foreach ($new_personal_useful_links as $id => $item) {
      $item = json_decode($item);
      if ($item->links) {
        foreach ($item->links as $key => $value) {
          if (strpos($value->icon, '://')) {
            $item->links->$key = self::convert_image($value);
          }
        }
        $temp = new MelFolderLink($id, $item->title, $item->links);
        $new_personal_useful_links[$id] = $temp->serialize();
      } else if (strpos($item->icon, '://')) {
        $new_personal_useful_links[$id] = self::convert_image($item)->serialize();
      }
    }
    $this->rc->user->save_prefs(array('new_personal_useful_links' => $new_personal_useful_links));
  }

  /**
   * Déplace l'icone dans l'image (correctif bug)
   *
   * @param MelLink $link
   * 
   * @return MelLink
   */
  private function convert_image($link)
  {
    $link->image = $link->icon;
    $link->icon = "";
    $temp = new MelLink($link->id, $link->title, $link->link, $link->image, $link->icon);
    return $temp;
  }

  public function get_store_link()
  {
    $links = $this->getFilteredDn(driver_mel::gi()->getUser()->dn);

    //On trie les liens par ordre alphabétique
    uasort($links, function ($a, $b) {
      return strcmp($a['name'], $b['name']);
    });
    return $links;
  }


  /**
   * Récupère les liens utiles par défaut selon la configuration de l'utilisateur
   * 
   * @return []
   */
  public function get_default_link()
  {
    $items = $this->getCardsConfiguration(driver_mel::gi()->getUser()->dn);
    $items = array_merge($items, $this->rc->config->get('portail_items_list', []));
    $newMelLinks = [];

    foreach ($items as $id => $item) {
      if (!$item['links']) {
        $temp = new MelLink($id, $item['name'], $item['url'], null, $item['icon']);
      } else {
        $links = [];
        foreach ($item['links'] as $key => $value) {
          $links[] = new MelLink(uniqid(), $key, $this->validate_url($value['url']),  null, $item['icon']);
        }
        $temp = new MelFolderLink($id, $item['name'], $links);
      }
      $newMelLinks[$id] = $temp->serialize();
    }

    return $newMelLinks;
  }

  /**
   * Récupère les liens utiles épinglés selon la configuration de l'utilisateur
   * 
   * @return Array
   */
  public function get_created_pinned_link()
  {
    $items = $this->getCardsConfiguration(driver_mel::gi()->getUser()->dn);
    $items = array_merge($items, $this->rc->config->get('portail_items_list', []));
    $pinnedMelLinks = [];

    foreach ($items as $id => $item) {
      if ($item['pinned']) {
        $pinnedMelLinks[$id] = false;
      }
    }

    return $pinnedMelLinks;
  }

  /**
   * Détermine si une url est correcte
   *
   * @param string $url
   * 
   * @return string
   */
  public function validate_url($url)
  {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
      $url = filter_var($url, FILTER_SANITIZE_URL);
      if (strpos($url, "http") === false) {
        $url = "http://" . $url;
      }
    }

    return $url;
  }

  /** 
   *  Met à jour la liste après déplacement des liens
   * 
   * @return void
   */
  public function update_list()
  {
    include_once "lib/link.php";

    $newOrder = rcube_utils::get_input_value("_list", rcube_utils::INPUT_POST);
    $key = rcube_utils::get_input_value("_key", rcube_utils::INPUT_POST);

    $newList = array();
    foreach ($newOrder as $object) {
      if (isset($object['id'])) {
        $id = $object['id'];
        if ($object['link'])
          $temp = new MelLink($id, $object['title'], $object['link'], $object['image'], $object['icon']);
        else if ($object['links'])
          $temp = new MelFolderLink($id, $object['title'], $object['links']);

        $newList[$id] = $temp->serialize();
      }
    }

    if (!$this->rc->plugins->exec_hook('save_external_ulinks', ['key' => $key, 'links' => $newList])['done']) {
      $this->rc->user->save_prefs(array('new_personal_useful_links' => $newList));
      echo true;
      exit;
    }
  }

  /** 
   * Setup des liens utiles
   * 
   * @return void
   */
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

    if ($need_button) {
      $this->add_button(array(
        'command' => "useful_links",
        'class'  => 'useful_links icon-mel-link',
        'classsel' => 'links button-selected icon-mel-link',
        'innerclass' => 'button-inner inner',
        'label'  => 'My_useful_links',
        'title' => '',
        'type'       => 'link',
        'domain' => "mel_useful_link"
      ), $need_button);
    }

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
        $temp = new MelLink($decoded_value->configKey, $decoded_value->title, $decoded_value->link, $decoded_value->icon);
        $links[] = $temp->serialize();
      } else {
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

    if ($items !== null) {
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

    if (count($items) > 0) {
      $paramDefault = $this->rc->config->get('personal_default_useful_links', []);

      $k = function ($k, $x) {
        return strpos($x["type"], "website") !== false; //$x["type"] === "website" || $x["type"] === "website_button" || $x["type"] === "website_links";
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
        if (!$tmpLink->personal) {
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

    $input_link = rcube_utils::get_input_value("link", rcube_utils::INPUT_GPC);
    $key = rcube_utils::get_input_value("_key", rcube_utils::INPUT_GPC);

    $id = $input_link['_id'];
    $title = $input_link['_title'];
    $link = $input_link['_link'];
    $image = $input_link['_image'];
    $icon = $input_link['_icon'];

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
        $melLink = new MelLink($id, $title, $link, $image, $icon);
    } else {
      $melLink = json_decode($config[$id]);

      if ($isMultiLink)
        $melLink = new MelFolderLink($id, $title, $link);
      else
        $melLink = new MelLink($id, $title, $link, $image, $icon);
    }

    //On supprime les anciens liens qui viennent d'être ajoutés dans un dossier
    $index;
    if ($isMultiLink) {
      foreach ($link as $link_key => $value) {
        $index = array_search($link_key, array_keys($config));
        unset($config[$link_key]);
      }

      //On met le nouveau lien à la place des anciens
      if ($index) {
        $config = array_merge(
          array_slice($config, 0, $index),
          array($id => $melLink->serialize()),
          array_slice($config, $index)
        );
      }
    }
    $config[$id] = $melLink->serialize();



    if (!$this->rc->plugins->exec_hook('save_external_ulinks', ['key' => $key, 'links' => $config])['done']) {
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

    if (!$this->rc->plugins->exec_hook('save_external_ulinks', ['key' => $key, 'links' => $links])['done']) {
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
      if ($key == false || $key == "false" || $key == null || $key === "unknown") {
        $id = $this->generate_id($value->title, $config);
        $value->configKey = $id;
        $config[$id] = $value->serialize();
        unset($config[$key]);

        if (!$update)
          $update = true;
      } //Si problème de configkey
      else if ($value->configKey === null || $value->configKey === "unknown") {
        if ($key !== $value->configKey)
          $value->configKey = $key;
        else {
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
  private function mergeItems($globalItems, $personalItems)
  {
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
        } else {
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
  private function getCardsConfiguration($user_dn, $config_file = '/config.json')
  {
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
        } else {
          // Le dir n'existe pas on sort de la boucle
          break;
        }
      }
    }
    return $configuration;
  }


  /**
   * Filter if the user dn match the item dn
   * 
   * @param string $user_dn
   * @param string|array $item_dn
   * 
   * @return boolean true si le dn match, false sinon
   */
  private function filter_dn($user_dn, $item_dn)
  {
    if (is_array($item_dn)) {
      $res = false;
      $res_neg = null;
      $res_eq = null;
      // C'est un tableau, appel récursif
      foreach ($item_dn as $dn) {
        $_res = self::filter_dn($user_dn, $dn);
        if (strpos($dn, '=') === 0) {
          if (is_null($res_eq)) {
            $res_eq = $_res;
          } else {
            $res_eq = $res_eq || $_res;
          }
        } else if (strpos($dn, '!') === 0) {
          if (is_null($res_neg)) {
            $res_neg = $_res;
          } else {
            $res_neg = $res_neg && $_res;
          }
        } else {
          $res = $res || $_res;
        }
      }
      // Validation des resultats
      if (!is_null($res_eq)) {
        if (!is_null($res_neg) && $res_neg === false) {
          $res = $res_neg;
        } else {
          $res = $res_eq;
        }
      } else if (!is_null($res_neg)) {
        $res = $res_neg;
      }
    } else {
      if (strpos($item_dn, '!') === 0) {
        // DN doit être différent
        $_item_dn = substr($item_dn, 1, strlen($item_dn) - 1);
        $res = strpos($user_dn, $_item_dn) === false;
      } else if (strpos($item_dn, '=') === 0) {
        // DN exactement égal
        $_item_dn = substr($item_dn, 1, strlen($item_dn) - 1);
        if (strpos($_item_dn, 'ou') === 0) {
          $_user_dn = explode(',', $user_dn, 2);
          $res = $_user_dn[1] == $_item_dn;
        } else {
          $res = $user_dn == $_item_dn;
        }
      } else {
        // DN contient
        $res = strpos($user_dn, $item_dn) !== false;
      }
    }
    return $res;
  }

  private function getFilteredDn($user_dn, $config_file = '/config.json')
  {
    $filtered_dn = [];
    $configurations = $this->getCardsConfiguration($user_dn, $config_file);

    foreach ($configurations as $key => $value) {
      if (isset($value['links'])) {
        foreach ($value['links'] as $link_key => $link) {
          if ($link['dn'] && $this->filter_dn($user_dn, $link['dn'])) {
            $filtered_dn[$link_key] = $link;
          } else {
            $filtered_dn[$link_key] = $link;
          }
        }
      } else if (isset($value['dn']) && $this->filter_dn($user_dn, $value['dn'])) {
        $filtered_dn[$key] = $value;
      } else {
        $filtered_dn[$key] = $value;
      }
    }
    return $filtered_dn;
  }
}
