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
    
    // Si tache = portail, on charge l'onglet
    if ($this->rc->task == 'portail') {
      $this->add_texts('localization/', true);
      // ajout de la tache
      $this->register_task('portail');
      // Chargement de la conf
      $this->load_config();
      // Ajout de l'interface
      include_once 'imodule.php';
      // Index
      $this->register_action('index', array($this, 'action'));
      // Flux
      $this->register_action('flux', array($this, 'flux'));
      // Ajout du css
      $this->include_stylesheet($this->local_skin_path() . '/mel_portail.css');
      // Si le panneau de droite n'est pas chargé on charge custom scrollbar
      if (!in_array('right_panel', $this->rc->config->get('plugins'))) {
        $this->include_stylesheet($this->local_skin_path() . '/jquery.mCustomScrollbar.min.css');
        $this->include_script('jquery.mCustomScrollbar.concat.min.js');
      }
      // Add handler
      $this->rc->output->add_handler('portail_items_list', array($this, 'items_list'));
    }
    // else if ($this->rc->task == 'settings') {
    //   $this->add_texts('localization/', true);
    //   // Chargement de la conf
    //   $this->load_config();
    //   // Ajout de l'interface
    //   include_once 'imodule.php';
    //   // Activation du menu dans Mon compte
    //   $this->rc->output->set_env('enable_mesressources_portail', true);
    //   // register actions
    //   $this->register_action('plugin.mel_resources_portail', array($this,'resources_init'));
    //   // Ajout le javascript
    //   //$this->include_script('settings.js');
    // }
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
   * Initialisation du menu ressources pour les Applications du portail
   * 
   * Affichage du template et gestion de la sélection
   */
  public function resources_init() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    if (isset($id)) {
      $id = driver_mel::gi()->rcToMceId($id);
      $user = driver_mel::gi()->getUser();
      $this->items = $this->getCardsConfiguration($user->dn);
      
      if (isset($this->items[$id])) {
        $item = $this->items[$id];
        $this->rc->output->set_env("resource_id", $id);
        $this->rc->output->set_env("resource_name", $item['name']);
        $this->rc->output->set_env("resource_type", $this->gettext($item['type']));
        if (isset($item['description'])) {
          $this->rc->output->set_env("resource_description", $item['description']);
        }
        if (isset($item['url'])) {
          $this->rc->output->set_env("resource_url", $item['url']);
        }
        if (isset($item['flip'])) {
          $this->rc->output->set_env("resource_flip", $this->gettext($item['flip'] ? 'true' : 'false'));
        }
        if (isset($item['feedUrl'])) {
          $this->rc->output->set_env("resource_feedurl", $item['feedUrl']);
        }
        if (isset($item['html'])) {
          $this->rc->output->set_env("resource_front_html", $item['html']);
        }
        if (isset($item['html_back'])) {
          $this->rc->output->set_env("resource_back_html", $item['html_back']);
        }
      }
      $this->rc->output->send('mel_portail.resource_portail');
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
    
    // Récupération des préférences de l'utilisateur
    $hidden_applications = $this->rc->config->get('hidden_applications', array());
      
    // Objet HTML
    $table = new html_table();
    $checkbox_subscribe = new html_checkbox(array('name' => '_show_resource_rc[]', 'title' => $this->rc->gettext('changesubscription'), 'onclick' => "rcmail.command(this.checked ? 'show_resource_in_roundcube' : 'hide_resource_in_roundcube', this.value, 'application')"));
    $user = driver_mel::gi()->getUser();
    
    $this->templates = $this->rc->config->get('portail_templates_list', []);
    $this->items = $this->getCardsConfiguration($user->dn);
    
    // Tri des items
    uasort($this->items, [$this, 'sortItems']);
    
    foreach ($this->items as $id => $item) {
      if (!isset($this->templates[$item['type']])) {
        unset($this->items[$id]);
        continue;
      }
      $template = $this->templates[$item['type']];
      // Check if the item match the dn
      if (isset($item['dn'])) {
        //$res = $this->filter_dn($user->dn, $item['dn']);
        $res = $this->filter_dn($user_dn, $item['dn']);
        if ($res !== true) {
          unset($this->items[$id]);
          continue;
        }
      }
      // Ajoute le php ?
      if (isset($template['php'])) {
        include_once 'modules/' . $item['type'] . '/' . $template['php'];
        $classname = ucfirst($item['type']);
        $object = new $classname($id);
        if (!$object->show()) {
          unset($this->items[$id]);
          continue;
        }
      }
      
      $table->add_row(array('id' => 'rcmrow' . driver_mel::gi()->mceToRcId($id), 'class' => 'portail', 'foldername' => driver_mel::gi()->mceToRcId($id)));
      $table->add('name', $item['name']);
      $table->add('subscribed', $checkbox_subscribe->show((! isset($hidden_applications[$id]) ? $id : ''), array('value' => $id)));
    }
    // set client env
    $this->rc->output->add_gui_object('mel_resources_elements_list', $attrib['id']);
    
    return $table->show($attrib);
  }
  
  /**
   * Initialisation de la frame pour les ressources
   *
   * @param array $attrib
   * @return string
   */
  public function mel_resources_type_frame($attrib) {
    if (! $attrib['id']) {
      $attrib['id'] = 'rcmsharemeltypeframe';
    }
    
    $attrib['name'] = $attrib['id'];
    
    $this->rc->output->set_env('contentframe', $attrib['name']);
    $this->rc->output->set_env('blankpage', $attrib['src'] ? $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');
    
    return $this->rc->output->frame($attrib);
  }
  
  /**
  * Génération de la liste des balp pour l'utilisateur courant
  * 
  * @param array $attrib Liste des paramètres de la liste
  * @return string HTML
  */
  public function items_list($attrib) {
    if (!$attrib['id']) {
      $attrib['id'] = 'portailview';
    }
    
    // Récupération des préférences de l'utilisateur
    $hidden_applications = $this->rc->config->get('hidden_applications', array());
    
    $content = "";
    $scripts_js = [];
    $scripts_css = [];
    $user = driver_mel::gi()->getUser();
    
    $this->templates = $this->rc->config->get('portail_templates_list', []);
    $this->items = $this->getCardsConfiguration($user->dn);
    
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
      if (isset($hidden_applications[$id]) && !isset($item['show'])) {
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
      $template = $this->templates[$item['type']];
      // Check if the item match the dn
      if (isset($item['dn'])) {
        //$res = $this->filter_dn($user->dn, $item['dn']);
        $res = $this->filter_dn($user_dn, $item['dn']);
        if ($res !== true) {
          unset($this->items[$id]);
          continue;
        }
      }
      // Ajoute le php ?
      if (isset($template['php'])) {
        include_once 'modules/' . $item['type'] . '/' . $template['php'];
        $classname = ucfirst($item['type']);
        $object = new $classname($id);
        if (!$object->show()) {
          unset($this->items[$id]);
          continue;
        }
        $object->init();
      }
      $content .= $this->item_html(['id' => $id], $item, $user_dn);
      // Ajoute le javascript ?
      if (isset($template['js'])) {
        $scripts_js['modules/' . $item['type'] . '/' . $template['js']] = true;
      }
      // Ajoute le css ?
      if (isset($template['css'])) {
        $scripts_css['modules/' . $item['type'] . '/' . $template['css']] = true;
      }
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
   * 
   * 
   * @param string $user_dn
   * @param string|array $item_dn
   * @return boolean true si le dn match, false sinon
   */
  private function filter_dn($user_dn, $item_dn) {
    if (is_array($item_dn)) {
      $res = false;
      $res_neg = null;
      $res_eq = null;
      // C'est un tableau, appel récursif
      foreach ($item_dn as $dn) {
        $_res = $this->filter_dn($user_dn, $dn);
        if (strpos($dn, '=') === 0) {
          if (is_null($res_eq)) {
            $res_eq = $_res;
          }
          else {
            $res_eq = $res_eq || $_res;
          }
        }
        else if (strpos($dn, '!') === 0) {
          if (is_null($res_neg)) {
            $res_neg = $_res;
          }
          else {
            $res_neg = $res_neg && $_res;
          }
        }
        else {
          $res = $res || $_res;
        }
      }
      // Validation des resultats
      if (!is_null($res_eq)) {
        if (!is_null($res_neg) && $res_neg === false) {
          $res = $res_neg;
        }
        else {
          $res = $res_eq;
        }
      }
      else if (!is_null($res_neg)) {
        $res = $res_neg;
      }
    }
    else {
      if (strpos($item_dn, '!') === 0) {
        // DN doit être différent
        $_item_dn = substr($item_dn, 1, strlen($item_dn) - 1);
        $res = strpos($user_dn, $_item_dn) === false;
      }
      else if (strpos($item_dn, '=') === 0) {
        // DN exactement égal
        $_item_dn = substr($item_dn, 1, strlen($item_dn) - 1);
        if (strpos($_item_dn, 'ou') === 0) {
          $_user_dn = explode(',', $user_dn, 2);
          $res = $_user_dn[1] == $_item_dn;
        }
        else {
          $res = $user_dn == $_item_dn;
        }
      }
      else {
        // DN contient
        $res = strpos($user_dn, $item_dn) !== false;
      }
    }
    return $res;
  }
  
  /**
   * Génère un item html en fonction des propriétés
   * 
   * @param array $attrib
   * @param array $item
   * @param string $user_dn
   * @return string HTML
   */
  public function item_html($attrib, $item, $user_dn) {
    $content = "";
    $attrib['class'] = $item['type'] . " item";
    // Gestion du bouton flip
    if ($item['flip']) {
      $flip = html::div('flip', html::tag('button', [], 'Flip'));
    }
    else {
      $flip = "";
    }
    $logo_style = null;
    if (isset($item['logobg'])) {
      $logo_style = 'background-color: '.$item['logobg'].';
                     border-radius: 5px;
                  	-webkit-box-shadow: 0 3px 0 0 rgba(43,43,43,.35);
                  	-moz-box-shadow: 0 3px 0 0 rgba(43,43,43,.35);
                  	box-shadow: 0 3px 0 0	rgba(43,43,43,.35);';
    }
    if (isset($item['url'])) {
      $description = $item['description'];
      // Gestion des astuces
      if (isset($item['tips']) 
          && is_array($item['tips'])) {
        $description = $item['tips'][array_rand($item['tips'])] . $description;
      }
      if (empty($description)) {
        $attrib['class'] .= " nodescription";
      }
      // Header html du front
      $header = html::tag('header', [],
          $flip .
          html::a(['href' => $item['url'], 'target' => $item['newtab'] ? '_blank': null, 'onclick' => $item['onclick'] ?: null],
                html::img(['class' => 'icon', 'style' => $logo_style, 'alt' => $item['name'] . ' logo', 'src' => isset($item['logo']) ? $item['logo'] : '/plugins/mel_portail/modules/' . $item['type'] . '/logo.png']) .
                html::tag('h1', 'title', $item['name']) .
                ($item['type'] == 'communication' ? "" : html::tag('p', 'description', $description))
              )
          );
    }
    else {
      // Header html du front
      $header = html::tag('header', [],
          $flip .
            html::tag('h1', 'title', $item['name'])
          );
    }
    
    // Gestion des boutons
    $buttons = "";
    $buttons_back = "";
    if ($item['type'] == 'communication') {
      $buttons = html::a(['href' => $item['url'], 'target' => $item['newtab'] ? '_blank': null, 'onclick' => $item['onclick'] ?: null],
        html::tag('span', 'description', $item['description'])
      );
    }
    else if (isset($item['buttons'])) {
      $buttons_list = "";
      $buttons_back_list = "";
      foreach ($item['buttons'] as $text => $button) {
        if (isset($button['back']) && $button['back']) {
          $buttons_back_list .= html::a(['class' => 'button', 'title' => $button['title'] ?: null, 'href' => $button['href'] ?: '#', 'target' => $item['newtab'] && isset($button['href']) ? '_blank': null, 'onclick' => $button['onclick'] ?: null], $text);
        }
        else {
          $buttons_list .= html::a(['class' => 'button', 'title' => $button['title'] ?: null, 'href' => $button['href'] ?: '#', 'target' => $item['newtab'] && isset($button['href']) ? '_blank': null, 'onclick' => $button['onclick'] ?: null], $text);
        }
        
      }
      $buttons = html::div('buttons', $buttons_list);
      if (strlen($buttons_back_list)) {
        $buttons_back = html::div('buttons', $buttons_back_list);
      }
      if ($item['type'] == 'fluxrss') {
        $attrib['class'] .= ' nonewsfront';
      }
    }
    else if (isset($item['links'])) {
      $attrib['class'] .= " links";
      $links_list = "";
      foreach ($item['links'] as $text => $link) {
        if (isset($link['show']) && !$link['show']) {
          continue;
        }
        if (isset($link['dn'])) {
          //$res = $this->filter_dn($user->dn, $link['dn']);
          $res = $this->filter_dn($user_dn, $link['dn']);
          if ($res !== true) {
            continue;
          }
        }
        // Gestion de la class
        $class = 'link';
        // Gestion du logo
        if (isset($link['logo'])) {
          $logo_link = $link['logo'];
        }
        else if (isset($item['logo'])) {
          $logo_link = $item['logo'];
        }
        else {
          $logo_link = '/plugins/mel_portail/modules/' . $item['type'] . '/logo.png';
        }
        // Gestion de la couleur du logo
        if (isset($link['logobg'])) {
          $logo_style_link = 'background-color: '.$link['logobg'].';
                         border-radius: 5px;
                        -webkit-box-shadow: 0 3px 0 0 rgba(43,43,43,.35);
                        -moz-box-shadow: 0 3px 0 0 rgba(43,43,43,.35);
                        box-shadow: 0 3px 0 0	rgba(43,43,43,.35);';
        }
        else {
          $logo_style_link = $logo_style;
        }
        // Gestion du button
        if (isset($link['button'])) {
          $class .= ' link_buttons';
          $button = $link['button'];
          $button_link = html::tag('span', ['class' => 'button_link', 'title' => $button['title'] ?: null, 'onclick' => $button['onclick'] ?: null], $button['text']);
        }
        else {
          $button_link = '';
        }
        $links_list .= html::a(['class' => $class, 'title' => $link['title'] ?: null, 'href' => $link['url'], 'target' => $item['newtab'] ? '_blank': null, 'onclick' => $link['onclick'] ?: null],
            html::img(['class' => 'icon', 'style' => $logo_style_link, 'alt' => $item['name'] . ' logo', 'src' => $logo_link]) .
            html::tag('h3', 'title', $text) .
            $button_link
        );
      }
      $buttons = html::div('links', $links_list);
    }
    else if ($item['type'] == 'website' || $item['type'] == 'communication') {
      $attrib['class'] .= " full";
    }
    // Multi news ?
    if (isset($item['multiNews']) && $item['multiNews']) {
      $attrib['class'] .= " multinews";
    }
    // Générer le contenu html
    if ($item['flip']) {
      if ($item['type'] == 'html') {
        // Front + back
        $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $item['html']) .
          html::tag('article', 'back', $item['html_back']);
      }
      else {
        // Contenu
        $content_back = "";
        if (isset($item['tips']) 
            && is_array($item['tips'])) {
          $list_back = "";
          foreach ($item['tips'] as $tips) {
            $list_back .= html::tag('li', null, html::a(null, html::tag('h1', null, $tips)));
          }
          $content_back = html::tag('ul', 'news', $list_back);
        }
        // Front + back
        $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $header . $buttons) .
          html::tag('article', 'back', html::tag('header', [], $flip) . $content_back . $buttons_back);
      }
      
    }
    else {
      if ($item['type'] == 'html') {
        // Front
        $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $item['html']) .
          html::tag('article', 'back blank', '');
      }
      else {
        // Front
        $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $header . $buttons) .
          html::tag('article', 'back blank', '');
      }
    }
    
    return html::tag('article', $attrib, $content);
  }
  
  /**
   * Gestion de la frame
   * @param array $attrib
   * @return string
   */
  function portail_frame($attrib)
  {
    if (!$attrib['id'])
      $attrib['id'] = 'rcmportailframe';
      
      $attrib['name'] = $attrib['id'];
      
      $this->rc->output->set_env('contentframe', $attrib['name']);
      $this->rc->output->set_env('blankpage', $attrib['src'] ?
      $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');
      
      return $this->rc->output->frame($attrib);
  }
}