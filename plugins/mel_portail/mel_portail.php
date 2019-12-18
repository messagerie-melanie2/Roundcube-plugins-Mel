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
    $items = $this->rc->config->get('portail_items_list', []);
    $templates = $this->rc->config->get('portail_templates_list', []);
    foreach ($items as $id => $item) {
      if (!isset($templates[$item['type']])) {
        unset($items[$id]);
        continue;
      }
      $template = $templates[$item['type']];
      // Check if the item match the dn
      if (isset($item['dn'])) {
        if (is_string($item['dn']) && strpos($user_infos['dn'], $item['dn']) === false) {
          unset($items[$id]);
          continue;
        }
        else if (is_array($item['dn'])) {
          $found = false;
          foreach ($item['dn'] as $dn) {
            if (strpos($user_infos['dn'], $dn) !== false) {
              $found = true;
            }
          }
          if (!$found) {
            unset($items[$id]);
            continue;
          }
        }
      }
      // Ajoute le php ?
      if (isset($template['php'])) {
        include_once 'modules/' . $item['type'] . '/' . $template['php'];
        $classname = ucfirst($item['type']);
        $object = new $classname($id);
        if (!$object->show()) {
          unset($items[$id]);
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
    
    $this->rc->output->set_env("portail_items", $items);
    // Ajout le javascript
    $this->include_script('mel_portail.js');
    return html::tag('section', $attrib, $content);
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
              html::tag('p', 'description', $item['description'])
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
    if (isset($item['buttons'])) {
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
      $content = html::tag('article', ['class' => 'front', 'title' => $item['title'] ?: null], $header . $buttons) .
                  html::tag('article', 'back', html::tag('header', [], $flip) . $buttons_back);
    }
    else {
      // Front
      $content = html::tag('article', ['class' => 'front', 'title' => $item['title'] ?: null], $header . $buttons) .
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