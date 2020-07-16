<?php
/**
 * Plugin Mél Portail
 *
 * Portail web
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

class mel_portail extends rcube_plugin
{
  /**
   *
   * @var string
   */
  public $task = '.*';
  /**
   * @var  rcmail The one and only instance
   */
  public $rc;
  /**
   * Array of templates
   * @var array
   */
  private $templates;
  /**
   * Array of items
   * @var array
   */
  private $items;
  
  /**
   * (non-PHPdoc)
   * @see rcube_plugin::init()
   */
  function init()
  {
    $this->rc = rcmail::get_instance();
    // Ajout du css
    $skin_path = $this->local_skin_path();
    if ($this->rc->output->get_env('ismobile')) {
      $skin_path .= '_mobile';
    }
    $this->include_stylesheet($skin_path . '/styles.css');

    // ajout de la tache
    $this->register_task('portail');

    // Ajoute le bouton en fonction de la skin
    if ($this->rc->config->get('ismobile', false)) {
      $this->add_button(array(
          'command' => 'portail',
          'class'	=> 'button-mel_portail ui-link ui-btn ui-corner-all ui-icon-bullets ui-btn-icon-left',
          'classsel' => 'button-mel_portail button-selected ui-link ui-btn ui-corner-all ui-icon-bullets ui-btn-icon-left',
          'innerclass' => 'button-inner',
          'label'	=> 'mel.portail',
      ), 'taskbar_mobile');
    } else {
        $taskbar = $this->rc->config->get('skin') == 'mel_larry' ? 'taskbar_mel' : 'taskbar';
        $this->add_button(array(
            'command' => 'portail',
            'class'	=> 'button-mel_portail',
            'classsel' => 'button-mel_portail button-selected',
            'innerclass' => 'button-inner',
            'label'	=> 'mel.portail',
            'title'	=> 'mel.portail_title',
        ), $taskbar);
    }
    
    // Si tache = portail, on charge l'onglet
    if ($this->rc->task == 'portail') {
      $this->add_texts('localization/', true);
      
      // Chargement de la conf
      $this->load_config();
      // Ajout de l'interface
      include_once 'modules/imodule.php';
      include_once 'modules/module.php';
      // Index
      $this->register_action('index', array($this, 'action'));
      // Flux
      $this->register_action('flux', array($this, 'flux'));
      // Gestion des autres actions
      if (!empty($this->rc->action) && $this->rc->action != 'flux' && $this->rc->action != 'refresh' && $this->rc->action != 'index') {
        $templates = $this->rc->config->get('portail_templates_list', []);
        foreach ($templates as $type => $template) {
          if (isset($template['actions']) && isset($template['actions'][$this->rc->action])) {
            if (isset($template['php'])) {
              include_once 'modules/' . $type . '/' . $template['php'];
            }
            $this->register_action($this->rc->action, $template['actions'][$this->rc->action]);
          }
        }
      }
      else {
        $this->include_stylesheet($skin_path . '/mel_portail.css');
        // Si le panneau de droite n'est pas chargé on charge custom scrollbar
        if (!in_array('right_panel', $this->rc->config->get('plugins'))) {
          $this->include_stylesheet($this->local_skin_path() . '/jquery.mCustomScrollbar.min.css');
          $this->include_script('jquery.mCustomScrollbar.concat.min.js');
        }
        // Add handler
        $this->rc->output->add_handler('portail_items_list', array($this, 'items_list'));
      }
    }
    else if ($this->rc->task == 'settings' && !isset($_GET['_courrielleur'])) {
      $this->add_texts('localization/', true);
      // Chargement de la conf
      $this->load_config();
      // Ajout de l'interface
      include_once 'modules/imodule.php';
      include_once 'modules/module.php';
      // Activation du menu dans Mon compte
      $this->rc->output->set_env('enable_mesressources_portail', true);
      // register actions
      $this->api->register_action('plugin.mel_resources_portail', $this->ID, array($this,'resources_init'));
      $this->api->register_action('plugin.mel_portail_edit', $this->ID, array($this,'portail_edit'));
      $this->api->register_action('plugin.portail_delete_item', $this->ID, array($this,'delete_item'));
      $this->api->register_action('plugin.portail_reinit_items', $this->ID, array($this,'reinit_items'));
      $this->api->register_action('plugin.portail_hide_item', $this->ID, array($this,'hide_item'));
      $this->api->register_action('plugin.portail_show_item', $this->ID, array($this,'show_item'));
      $this->api->register_action('plugin.portail_sort_items', $this->ID, array($this,'sort_items'));
    }
  }
  
  function action() {
    // register UI objects
    $this->rc->output->add_handlers(array(
        'mel_portail_frame'    => array($this, 'portail_frame'),
    ));
    
    // Chargement du template d'affichage
    $this->rc->output->set_pagetitle($this->gettext('title'));
    $this->rc->output->send('mel_portail.mel_portail');
  }

  /**
   * Lecture d'un fichier de flux
   */
  function flux() {
    function endsWith($haystack, $needle) {
        $length = strlen($needle);
        if ($length == 0) {
            return true;
        }
        return (substr($haystack, -$length) === $needle);
    }
    // Récupération du nom du fichier
    $_file = rcube_utils::get_input_value('_file', rcube_utils::INPUT_GET);

    if (isset($_file)) {
      // Gestion du folder
      $folder = $this->rc->config->get('portail_flux_folder', null);
      if (!isset($folder)) {
        $folder = __DIR__ . '/rss/';
      }
      if ($this->rc->config->get('portail_flux_use_provenance', false)) {
        if (mel::is_internal()) {
          $folder .= 'intranet/';
        }
        else {
          $folder .= 'intranet/';
        }
      }
      // Gestion de l'extension
      if (endsWith($_file, '.xml')) {
        header("Content-Type: application/xml; charset=" . RCUBE_CHARSET);
      }
      else if (endsWith($_file, '.html')) {
        header("Content-Type: text/html; charset=" . RCUBE_CHARSET);
      }
      else if (endsWith($_file, '.json')) {
        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
      }
      // Ecriture du fichier
      $content = file_get_contents($folder . $_file);
      if ($content === false) {
        header('HTTP/1.0 404 Not Found');
      }
      else {
        echo $content;
      }
      exit;
    }
  }

  /**
   * Show item name in html template
   */
  public function itemname($attrib) {
    $name = "";
    if ($this->rc->output->get_env('personal_item_is_new')) {
      $name = $this->gettext('New item');
    }
    else {
      $item = $this->rc->output->get_env('personal_item');
      $name = $item['name'];
    }
    return $name;
  }
  
  /**
   * Initialisation du menu ressources pour les Applications du portail
   * 
   * Affichage du template et gestion de la sélection
   */
  public function resources_init() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    if (isset($id)) {
      $id = driver_mel::gi()->rcToMceId($id);
      $this->templates = $this->rc->config->get('portail_templates_list', []);
      if ($id == 'new') {
        // Dans le cas d'une vignette perso on passe en édition
        $this->rc->output->set_env("personal_item_is_new", true);
        $this->rc->output->set_env("personal_item_id", $id);
        $this->rc->output->set_env("personal_item_read_only", false);
        $this->rc->output->set_env("personal_item", ['personal' => true]);
      }
      else {
        // Vignette générique, l'utilisateur ne peut voir que les informations
        $user = driver_mel::gi()->getUser();
        $this->items = $this->getCardsConfiguration($user->dn);
        $this->items = array_merge($this->items, $this->rc->config->get('portail_items_list', []));
        $this->items = $this->mergeItems($this->items, $this->rc->config->get('portail_personal_items', []));
        // Dans le cas d'une vignette perso on passe en édition
        $item = $this->items[$id];
        $this->rc->output->set_env("personal_item_is_new", $id == 'new');
        $this->rc->output->set_env("personal_item_id", $id);
        $this->rc->output->set_env("personal_item", $item);
        $template = $this->templates[$item['type']];
        // Ajoute le php ?
        if (isset($template['php'])) {
          include_once 'modules/' . $item['type'] . '/' . $template['php'];
          $classname = ucfirst($item['type']);
          $object = new $classname($id, $this);
          $this->rc->output->set_env("personal_item_read_only", $object->isReadonly($item));
        }
        else {
          $this->rc->output->set_env("personal_item_read_only", !$item['personal']);
        }
      }
      // register UI objects
      $this->rc->output->add_handlers(
        array(
          'itemname'    => array($this, 'itemname'),
          'item_edit'   => array(new Module('', $this), 'settings_handler'),
        )
      );
      // Ajout le javascript
      $this->include_script('edit.js');
      // Ajout des js des différents modules      
      foreach ($this->templates as $type => $template) {
        // Ajoute le javascript ?
        if (isset($template['edit_js'])) {
          $this->include_script('modules/' . $type . '/' . $template['edit_js']);
        }
        // Ajout le css ?
        if (isset($template['edit_css'])) {
          $this->include_stylesheet('modules/' . $type . '/' . $template['edit_css']);
        }
      }
      $this->rc->output->send('mel_portail.portail_item_edit');
    }
    else {
      // register UI objects
      $this->rc->output->add_handlers(
          array(
              'mel_resources_elements_list' => array($this, 'resources_elements_list'),
              'mel_resources_type_frame'    => array($this, 'mel_resources_type_frame'),
          )
      );
      $this->rc->output->set_env("resources_action", "portail");
      $this->rc->output->include_script('list.js');
      $this->include_script('settings.js');
      $this->rc->output->set_pagetitle($this->gettext('mel_moncompte.resources'));
      $this->rc->output->send('mel_portail.resources_elements');
    }
  }
  
  /**
   * Affiche la liste des éléments
   *
   * @param array $attrib
   * @return string
   */
  public function resources_elements_list($attrib) {
    // add id to message list table if not specified
    if (! strlen($attrib['id']))
      $attrib['id'] = 'rcmresourceselementslist';
      
    // Objet HTML
    $table = new html_table();
    $checkbox_subscribe = new html_checkbox(array('name' => '_portail_show_item[]', 'title' => $this->rc->gettext('changesubscription'), 'onclick' => "rcmail.command(this.checked ? 'plugin.mel_portail_show_resource' : 'plugin.mel_portail_hide_resource', this.value)"));
    $user = driver_mel::gi()->getUser();
    
    $this->templates = $this->rc->config->get('portail_templates_list', []);
    $this->items = $this->getCardsConfiguration($user->dn);
    $this->items = array_merge($this->items, $this->rc->config->get('portail_items_list', []));
    $personal_items = $this->rc->config->get('portail_personal_items', []);
    $this->items = $this->mergeItems($this->items, $personal_items);
    // Tri des items
    uasort($this->items, [$this, 'sortItems']);
    
    foreach ($this->items as $id => $item) {
      if (!isset($this->templates[$item['type']])) {
        unset($this->items[$id]);
        continue;
      }
      // Check if the item match the dn
      if (isset($item['dn'])) {
        $res = Module::filter_dn($user->dn, $item['dn']);
        if ($res !== true) {
          unset($this->items[$id]);
          continue;
        }
      }
      $template = $this->templates[$item['type']];
      // Ajoute le php ?
      if (isset($template['php'])) {
        include_once 'modules/' . $item['type'] . '/' . $template['php'];
        $classname = ucfirst($item['type']);
        $object = new $classname($id, $this);
        if (!$object->show()) {
          unset($this->items[$id]);
          continue;
        }
      }
      $name = $item['name'];
      $class = '';
      if (isset($item['provenance'])) {
        $name .= ' (' . $this->gettext($item['provenance']) . ')';
      }
      // Item personnel
      if (isset($item['personal']) && $item['personal']) {
        $name = '[' . $this->gettext('personal') .'] ' . $name;
        $class = ' personal';
      }
      // Unchangeable item
      if (isset($item['unchangeable']) && $item['unchangeable']) {
        $class = ' unchangeable';
      }
      // Configuration
      if ($item['type'] == 'configuration') {
        $class = ' configuration';
      }
      $table->add_row(array('id' => 'rcmrow' . driver_mel::gi()->mceToRcId($id), 'class' => 'portail' . $class, 'foldername' => driver_mel::gi()->mceToRcId($id)));
      if ($item['type'] == 'configuration') {
        $table->add('name', '');
        $table->add('subscribed', '');
      }
      else {
        $table->add('name', $name);
        if (!isset($item['unchangeable']) || !$item['unchangeable']) {
          $table->add('subscribed', $checkbox_subscribe->show(((!isset($item['hide']) || !$item['hide']) ? $id : ''), array('value' => $id)));
        }
        else {
          $table->add('subscribed', '');
        }
      }
    }
    // set client env
    $this->rc->output->add_gui_object('mel_portail_items_list', $attrib['id']);
    
    return $table->show($attrib);
  }
  
  /**
   * Initialisation de la frame pour les ressources
   *
   * @param array $attrib
   * @return string
   */
  public function mel_resources_type_frame($attrib) {
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmsharemeltypeframe';
    }
    
    $attrib['name'] = $attrib['id'];
    
    $this->rc->output->set_env('contentframe', $attrib['name']);
    $this->rc->output->set_env('blankpage', $attrib['src'] ? $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');
    
    return $this->rc->output->frame($attrib);
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
   * Supprimer l'item des prefs roundcube
   */
  public function delete_item() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
    if (isset($id)) {
      $personal_items = $this->rc->config->get('portail_personal_items', []);
      if (isset($personal_items[$id])) {
        unset($personal_items[$id]);
      }
      if ($this->rc->user->save_prefs(array('portail_personal_items' => $personal_items))) {
        $this->rc->output->show_message('mel_portail.delete_item_confirm', 'confirmation');
        $this->rc->output->command('mel_portail_reload_page', 'delete');
      }
      else {
        $this->rc->output->show_message('mel_portail.modify_error', 'error');
      }
    }
    else {
      $this->rc->output->show_message('mel_portail.modify_error', 'error');
    }
  }

  /**
   * Reinitialisation de la configuration par défaut des items
   */
  public function reinit_items() {
    $personal_items = $this->rc->config->get('portail_personal_items', []);
    foreach ($personal_items as $key => $item) {
      unset($item['order']);
      unset($item['hide']);
      if (isset($item['personal']) && $item['personal']) {
        $item['hide'] = true;
        $item['order'] = 500;
        $personal_items[$key] = $item;
      }
      else if (empty($item)) {
        unset($personal_items[$key]);
      }
      else {
        $personal_items[$key] = $item;
      }
    }
    if ($this->rc->user->save_prefs(array('portail_personal_items' => $personal_items))) {
      $this->rc->output->show_message('mel_portail.reinit_items_confirm', 'confirmation');
      $this->rc->output->command('mel_portail_reload_page', 'delete');
    }
    else {
      $this->rc->output->show_message('mel_portail.modify_error', 'error');
    }
  }

  /**
   * Masquer l'item dans roundcube
   */
  public function hide_item() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
    if (isset($id)) {
      $personal_items = $this->rc->config->get('portail_personal_items', []);
      if (isset($personal_items[$id])) {
        $personal_items[$id]['hide'] = true;
      }
      else {
        $personal_items[$id] = [
          'hide' => true,
        ];
      }
      if ($this->rc->user->save_prefs(array('portail_personal_items' => $personal_items))) {
        $this->rc->output->show_message('mel_portail.hide_item_confirm', 'confirmation');
      }
      else {
        $this->rc->output->show_message('mel_portail.modify_error', 'error');
      }
    }
    else {
      $this->rc->output->show_message('mel_portail.modify_error', 'error');
    }
  }

  /**
   * Afficher l'item dans roundcube
   */
  public function show_item() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST);
    if (isset($id)) {
      $personal_items = $this->rc->config->get('portail_personal_items', []);
      if (isset($personal_items[$id])) {
        $personal_items[$id]['hide'] = false;
      }
      else {
        $personal_items[$id] = [
          'hide' => false,
        ];
      }
      if ($this->rc->user->save_prefs(array('portail_personal_items' => $personal_items))) {
        $this->rc->output->show_message('mel_portail.show_item_confirm', 'confirmation');
      }
      else {
        $this->rc->output->show_message('mel_portail.modify_error', 'error');
      }
    }
    else {
      $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
  }

  /**
   * Trier les items
   */
  public function sort_items() {
    $items = rcube_utils::get_input_value('_items', rcube_utils::INPUT_POST);
    if (isset($items)) {
      $items = json_decode($items, true);
      $personal_items = $this->rc->config->get('portail_personal_items', []);
      foreach ($items as $order => $id) {
        if (isset($personal_items[$id])) {
          $personal_items[$id]['order'] = $order;
        }
        else {
          $personal_items[$id] = [
            'order' => $order,
          ];
        }
      }
      if ($this->rc->user->save_prefs(array('portail_personal_items' => $personal_items))) {
        $this->rc->output->show_message('mel_portail.sort_items_confirm', 'confirmation');
        $this->rc->output->command('mel_portail_reload_page', 'sort');
      }
      else {
        $this->rc->output->show_message('mel_portail.modify_error', 'error');
      }
    }
    else {
      $this->rc->output->show_message('mel_moncompte.modify_error', 'error');
    }
  }
  
  /**
  * Génération de la liste des items pour l'utilisateur courant
  * 
  * @param array $attrib Liste des paramètres de la liste
  * @return string HTML
  */
  public function items_list($attrib) {
    if (!$attrib['id']) {
      $attrib['id'] = 'portailview';
    }
    
    $content = html::div(['class' => 'manage_message'], 
      $this->gettext('You are actually in edition mode') . 
      html::a(['class' => 'button', 'href' => '#', 'onclick' => 'rcmail.editPortailItems(event)'], $this->gettext('switch off edition mode'))
    );
    $scripts_js = [];
    $scripts_css = [];
    $user = driver_mel::gi()->getUser();
    
    $this->templates = $this->rc->config->get('portail_templates_list', []);
    $this->items = $this->getCardsConfiguration($user->dn);
    $this->items = array_merge($this->items, $this->rc->config->get('portail_items_list', []));
    $this->items = $this->mergeItems($this->items, $this->rc->config->get('portail_personal_items', []));
    
    // Tri des items
    uasort($this->items, [$this, 'sortItems']);
    
    foreach ($this->items as $id => $item) {
      if (!isset($this->templates[$item['type']])) {
        unset($this->items[$id]);
        continue;
      }
      if (isset($item['show']) && $item['show'] === false) {
        unset($this->items[$id]);
        continue;
      }
      if (isset($item['hide']) && $item['hide'] === true) {
        unset($this->items[$id]);
        continue;
      }
      if (isset($item['session']) && !isset($_SESSION[$item['session']])) {
        unset($this->items[$id]);
        continue;
      }
      if (isset($item['!session']) && isset($_SESSION[$item['!session']])) {
        unset($this->items[$id]);
        continue;
      }
      if (isset($item['provenance'])) {
        if (mel::is_internal() && $item['provenance'] == 'internet' 
            || !mel::is_internal() && $item['provenance'] == 'intranet') {
          unset($this->items[$id]);
          continue;
        }
      }
      $item['id'] = $id;
      $template = $this->templates[$item['type']];
      // Check if the item match the dn
      if (isset($item['dn'])) {
        $res = Module::filter_dn($user->dn, $item['dn']);
        if ($res !== true) {
          unset($this->items[$id]);
          continue;
        }
      }
      // Ajoute le php ?
      if (isset($template['php'])) {
        include_once 'modules/' . $item['type'] . '/' . $template['php'];
        $classname = ucfirst($item['type']);
        $object = new $classname($id, $this);
        if (!$object->show()) {
          unset($this->items[$id]);
          continue;
        }
        $object->init();
      }
      else {
        $object = new Module($id, $this);
      }
      $content .= $object->item_html(['id' => $id], $item, $user->dn);
      // Ajoute le javascript ?
      if (isset($template['js'])) {
        $scripts_js['modules/' . $item['type'] . '/' . $template['js']] = true;
      }
      // Ajoute le css ?
      if (isset($template['css'])) {
        $scripts_css['modules/' . $item['type'] . '/' . $template['css']] = true;
      }
      // Actualise l'objet
      $this->items[$id] = $item;
    }
    // Charger les scripts JS
    foreach ($scripts_js as $script => $load) {
      if ($load) {
        $this->include_script($script);
      }
    }
    // Charger les scripts CSS
    foreach ($scripts_css as $script => $load) {
      if ($load) {
        $this->include_stylesheet($script);
      }
    }
    $this->rc->output->set_env("portail_items", $this->items);
    // Ajout le javascript
    $this->include_script('mel_portail.js');
    return html::tag('section', $attrib, $content);
  }
  
  /**
   * Tri des items en fonction de l'order ou de l'order du template
   * 
   * @param array $a
   * @param array $b
   * 
   * @return number
   */
  private function sortItems($a, $b) {
    if (!isset($a['order']) && isset($this->templates[$a['type']])) {
      $a['order'] = $this->templates[$a['type']]['order'];
    }
    if (!isset($b['order']) && isset($this->templates[$b['type']])) {
      $b['order'] = $this->templates[$b['type']]['order'];
    }
    return strnatcmp($a['order'], $b['order']);
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
  
  /**
   * Gestion de la frame
   * @param array $attrib
   * @return string
   */
  function portail_frame($attrib) {
    if (!$attrib['id'])
      $attrib['id'] = 'rcmportailframe';
      
    $attrib['name'] = $attrib['id'];
    
    $this->rc->output->set_env('contentframe', $attrib['name']);
    $this->rc->output->set_env('blankpage', $attrib['src'] ?
    $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');
    
    return $this->rc->output->frame($attrib);
  }
}