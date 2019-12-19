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
    
    $this->add_texts('localization/', true);
    
    // ajout de la tache
    $this->register_task('portail');
    
    // Si tache = portail, on charge l'onglet
    if ($this->rc->task == 'portail') {
      // Chargement de la conf
      $this->load_config();
      // Ajout de l'interface
      include_once 'imodule.php';
      // Index
      $this->register_action('index', array($this, 'action'));
      // Ajout du css
      $this->include_stylesheet($this->local_skin_path() . '/mel_portail.css');
      // Add handler
      $this->rc->output->add_handler('portail_items_list', array($this, 'items_list'));
    }
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
    
    $content = "";
    $scripts_js = [];
    $scripts_css = [];
    $user_infos = LibMelanie\Ldap\Ldap::GetUserInfos($this->rc->get_user_name());
    
    $this->templates = $this->rc->config->get('portail_templates_list', []);
    $this->items = $this->getCardsConfiguration($user_infos['dn']);
    
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
        $res = $this->filter_dn($user_infos['dn'], $item['dn']);
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
      $content .= $this->item_html(['id' => $id], $item);
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
   * @return string HTML
   */
  public function item_html($attrib, $item) {
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
      // Header html du front
      $header = html::tag('header', [],
          $flip .
          html::a(['href' => $item['url'], 'target' => $item['newtab'] ? '_blank': null, 'onclick' => $item['onclick'] ?: null],
                html::img(['class' => 'icon', 'style' => $logo_style, 'alt' => $item['name'] . ' logo', 'src' => isset($item['logo']) ? $item['logo'] : '/plugins/mel_portail/modules/' . $item['type'] . '/logo.png']) .
                html::tag('h1', 'title', $item['name']) .
                ($item['type'] == 'communication' ? "" : html::tag('p', 'description', $item['description']))
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
          $buttons_back_list .= html::a(['class' => 'button', 'href' => $button['href'] ?: '#', 'target' => $item['newtab'] && isset($button['href']) ? '_blank': null, 'onclick' => $button['onclick'] ?: null], $text);
        }
        else {
          $buttons_list .= html::a(['class' => 'button', 'href' => $button['href'] ?: '#', 'target' => $item['newtab'] && isset($button['href']) ? '_blank': null, 'onclick' => $button['onclick'] ?: null], $text);
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
        $links_list .= html::a(['class' => 'link', 'href' => $link['url'], 'target' => $item['newtab'] ? '_blank': null, 'onclick' => $link['onclick'] ?: null],
            html::img(['class' => 'icon', 'style' => $logo_style, 'alt' => $item['name'] . ' logo', 'src' => isset($link['logo']) ? $link['logo'] : '/plugins/mel_portail/modules/' . $item['type'] . '/logo.png']) .
            html::tag('h3', 'title', $text)
        );
      }
      $buttons = html::div('links', $links_list);
    }
    else if ($item['type'] == 'website' || $item['type'] == 'communication') {
      $attrib['class'] .= " full";
    }
    // Générer le contenu html
    if ($item['flip']) {
      // Front + back
      $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $header . $buttons) .
                  html::tag('article', 'back', html::tag('header', [], $flip) . $buttons_back);
    }
    else {
      // Front
      $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $header . $buttons) .
                  html::tag('article', 'back blank', '');
    }
    
    return html::tag('article', $attrib, $content);
  }
  
  function action()
  {
    // register UI objects
    $this->rc->output->add_handlers(array(
        'mel_portail_frame'    => array($this, 'portail_frame'),
    ));
    
    // Chargement du template d'affichage
    $this->rc->output->set_pagetitle($this->gettext('title'));
    $this->rc->output->send('mel_portail.mel_portail');
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