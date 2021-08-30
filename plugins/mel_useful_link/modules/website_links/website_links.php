<?php
/**
 * Module Website_links pour le portail Mél
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

class Website_links extends Module {
  /**
   * Mapping entre les champs items et ceux du form
   */
  protected $mappingFields = [
    'name' => 'item_website_links_name',
    'color' => 'item_website_links_color',
    'tooltip' => 'item_website_links_tooltip',
    'flip' => 'item_website_links_flip',
    'newtab' => 'item_website_links_newtab',
    'provenance' => 'item_website_links_provenance',
    'width' => 'item_website_links_width',
    'links_logobg' => 'item_website_links_links_logobg',
  ];

  /**
   * Liste des champs qui ne seront pas en lecture/seule
   */
  protected $writableFields = ['link_name', 'link_show'];

  /**
   * Liste des champs obligatoires
   */
  protected $requiredFields = ['name', 'link_name', 'link_url'];

  /**
   * Est-ce que le module doit utiliser un logo ?
   */
  public $no_logo = true;

  /**
   * Handler HTML dédié au module
   */
  public function settings_handler($attrib) {
    $item = $this->rc->output->get_env('personal_item');
    $this->rc->output->set_env("personal_item_read_only", false);
    // Ajouter les boutons d'actions
    $this->plugin->add_button(array(
      'command' => 'add_portail_link',
      'class'   => 'button add website_links',
      'innerclass' => 'button-inner',
      'label'   => 'mel_portail.item_add_link',
      'title'   => 'mel_portail.item_add_link_title',
    ), 'portail_item_edit_taskbar');
    return $this->settings_table(['name', 'tooltip', 'color', 'provenance', 'width', 'links_logobg'], $item, '_website_links', !$item['personal']);
  }

  /**
   * Ajoute un fieldset supplémentaire si on souhaite plus d'options de paramètrage dans le module
   */
  public function setting_fieldset($item) {
    $out = "";
    if (isset($item['links'])) {
      $i = 0;
      foreach ($item['links'] as $key => $_link) {
        $out .= $this->setting_link_html($i, [
          'link_show'         => isset($_link['hide']) ? !$_link['hide'] : true,
          'link_name'        => $key,
          'link_url'         => $_link['url'],
          'link_title'       => $_link['title'],
          'link_logo'        => $_link['logo'],
        ], count($item['links']) - 1, !$item['personal'] && !$_link['personal']);
        $i++;
      }
    }
    else {
      $out .= $this->setting_link_html(0, [
        'link_show'         => true,
        'link_name'         => '',
        'link_url'         => '',
        'link_title'       => '',
        'link_logo'        => '',
      ], 0, false);
    }
    // Ajout du template
    $out .= $this->setting_link_html('template', [
      'link_show'         => true,
      'link_name'         => '',
      'link_url'         => '',
      'link_title'       => '',
      'link_logo'        => '',
    ], 'template', false);
    return $out;
  }

  /**
   * Création de l'item à partir des données de formulaire
   */
  public function item_from_form(&$item) {
    $this->mapFields($item);
    // Gestion des links
    $link_keys = [];
    foreach ($_POST as $key => $value) {
      if (strpos($key, '_link_name') !== false && $key != 'item_website_links_template_link_name') {
        $link_keys[] = str_replace('_link_name', '', $key);
      }
    }
    // Parcourir les links
    foreach ($link_keys as $val) {
      $link_name = rcube_utils::get_input_value($val.'_link_name', rcube_utils::INPUT_POST);
      if (isset($link_name) && !empty($link_name)) {
        if (!isset($item['links'])) {
          $item['links'] = [];
        }
        $item['links'][$link_name] = [];
        $_link_show = rcube_utils::get_input_value($val.'_link_show', rcube_utils::INPUT_POST);
        if (!isset($_link_show) || $_link_show != 'true') {
          $item['links'][$link_name]['hide'] = true;
        }
        $_link_url = rcube_utils::get_input_value($val.'_link_url', rcube_utils::INPUT_POST);
        if (isset($_link_url) && !empty($_link_url)) {
          $item['links'][$link_name]['url'] = $this->fix_url($_link_url);
        }
        $_link_title = rcube_utils::get_input_value($val.'_link_title', rcube_utils::INPUT_POST);
        if (isset($_link_title) && !empty($_link_title)) {
          $item['links'][$link_name]['title'] = $_link_title;
        }
        $_link_logo = rcube_utils::get_input_value($val.'_link_logo', rcube_utils::INPUT_POST);
        if (isset($_link_logo) && !empty($_link_logo)) {
          if ($_link_logo == 'custom') {
            $item['links'][$link_name]['logo'] = rcube_utils::get_input_value($val.'_link_custom_logo', rcube_utils::INPUT_POST);
          }
          else {
            $item['links'][$link_name]['logo'] = $_link_logo;
          }
        }
        $button_name = rcube_utils::get_input_value($val.'_link_button_name', rcube_utils::INPUT_POST);
        if (isset($button_name) && !empty($button_name)) {
          $item['links'][$link_name]['button'] = [
            'name' => $button_name,
          ];
          $_link_button_title = rcube_utils::get_input_value($val.'_link_button_title', rcube_utils::INPUT_POST);
          if (isset($_link_button_title) && !empty($_link_button_title)) {
            $item['links'][$link_name]['button']['title'] = $_link_button_title;
          }
          $_link_button_href = rcube_utils::get_input_value($val.'_link_button_href', rcube_utils::INPUT_POST);
          if (isset($_link_button_href) && !empty($_link_button_href)) {
            $item['links'][$link_name]['button']['href'] = $this->fix_url($_link_button_href);
          }
        }
        // Gérer les cas ou on ne modifie rien
        if (empty($item['links'][$link_name])) {
          unset($item['links'][$link_name]);
        }
      }
    }
  }

  /**
   * Génère le html pour ajouter un lien
   */
  private function setting_link_html($i, $link, $max_links, $readonly) {
    $class = !empty($link['link_name']) ? 'collapsed' : 'expanded';
    $class .=  $readonly ? ' readonly' : '';
    $class .=  !isset($link['link_show']) || !$link['link_show'] ? ' hide' : '';
    return html::tag('fieldset', ['id' => 'item_link_website_links_'.$i, 'class' => 'more expandable ' . $class . ($i === 'template' ? '' : ' website_links links')], 
      html::tag('legend', ['class' => 'expand'], $this->plugin->gettext('item_link_website_links') . (!empty($link['link_name']) ? ' ' . $link['link_name'] : '')) .
      html::tag('legend', ['class' => 'collapse'], $this->plugin->gettext('item_link_website_links_collapse') . (!empty($link['link_name']) ? ' : ' . $link['link_name'] : '')) .
      html::div(['id' => 'item_links_img_' . $i, 'class' => 'item_links_img'], 
        html::img(['src' => $link['link_logo'] ?: '/plugins/mel_portail/modules/website_links/logo.png', 'alt' => $this->plugin->gettext('item_links_iconalt')])
      ) . 
      $this->settings_table(['link_show', 'link_logo', 'link_name', 'link_url', 'link_title'], $link, '_website_links_' . $i, $readonly) .
      (!$readonly ? html::div(['class' => 'buttons'], html::a(['href' => '#', 'class' => 'button delete', 'title' => $this->plugin->gettext('item_delete_link_title'), 'onclick' => 'rcmail.delete_portail_link(event, this);'], $this->plugin->gettext('item_delete_link'))) : '')
    );
  }

  /**
   * Call setting_row from prop
   */
  protected function setting_prop(&$table, $prop, $item, $submodule = null, $readonly = false) {
    if ($readonly && !in_array($prop, $this->writableFields)) {
      $this->setting_row($table, $prop, $item, null, 'readonly', $submodule);
    }
    else if ($prop == 'link_logo') {
        $select = new html_select(['id' => '_item' . $submodule . '_link_logo', 'name' => 'item' . $submodule . '_link_logo', 'class' => '_item_website_links_logo']);
        $select->add($this->plugin->gettext('no icon'), '');
        $select->add($this->plugin->gettext('custom logo'), 'custom');
        $files = scandir(__DIR__ . '/../icons/list/');
        foreach ($files as $file) {
            if (strpos($file, '.') !== 0) {
                $tmp = explode(' - ', $file, 2);
                $name = str_replace('.png', '', $tmp[1]);
                $select->add($name, '/plugins/mel_portail/modules/icons/list/' . $file);
            }
        }
        if (isset($item[$prop]) && !empty($item[$prop])) {
          if (strpos($item[$prop], '/plugins/mel_portail/modules/icons/list/') === 0) {
            $select_value = $item[$prop];
            $custom_value = '';
          }
          else {
            $select_value = 'custom';
            $custom_value = $item[$prop];
          }
        }
        else {
          $select_value = '';
          $custom_value = '';
        }
        $html = $this->setting_row($table, $prop, $item, $select->show($select_value), '', $submodule);
        $input = new html_inputfield(['id' => '_item'.$submodule.'_link_custom_logo', 'class' => '_item_website_links_custom_logo', 'name' => 'item'.$submodule.'_link_custom_logo']);
        $html = $this->setting_row($table, 'logo_custom', $item, $input->show($custom_value), '', $submodule);

    }
    else if ($prop == 'links_logobg') {
      $html = $this->setting_row($table, $prop, $item, null, 'inputcolor', $submodule);
    }
    else if ($prop == 'link_show') {
      $html = $this->setting_row($table, $prop, $item, null, 'checkbox', $submodule);
    }
    else {
      $html = parent::setting_prop($table, $prop, $item, $submodule);
    }
    return $html;
  }

  /**
     * Merge le global item avec le personal item
     */
  public function mergeItem($globalItem, $personalItem) {
    if (isset($globalItem['links']) 
        && isset($personalItem['links'])
        && is_array($globalItem['links'])
        && is_array($personalItem['links'])) {
      $links = [];
      // Start with personal links
      foreach ($personalItem['links'] as $key => $link) {
        if (isset($globalItem['links'][$key]) && isset($link['hide'])) {
          $globalItem['links'][$key]['hide'] = $link['hide'];
        }
        else {
          $link['personal'] = true;
          $links[$key] = $link;
        }
      }
      // Then global links
      foreach ($globalItem['links'] as $key => $link) {
        $links[$key] = $link;
      }
      $globalItem['links'] = $links;
    }
    return $globalItem;
  }

  /**
   * Est-ce que l'item doit être en readonly
   */
  public function isReadonly($item) {
    return false;
  }
}


