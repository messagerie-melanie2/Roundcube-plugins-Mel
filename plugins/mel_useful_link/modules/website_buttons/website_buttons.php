<?php
/**
 * Module Website_buttons pour le portail Mél
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

class Website_buttons extends Module {
  /**
   * Mapping entre les champs items et ceux du form
   */
  protected $mappingFields = [
    'url' => 'item_website_buttons_url',
    'name' => 'item_website_buttons_name',
    'color' => 'item_website_buttons_color',
    'tooltip' => 'item_website_buttons_tooltip',
    'description' => 'item_website_buttons_description',
    'flip' => 'item_website_buttons_flip',
    'newtab' => 'item_website_buttons_newtab',
    'width' => 'item_website_buttons_width',
    'provenance' => 'item_website_buttons_provenance',
  ];

  /**
   * Liste des champs obligatoires
   */
  protected $requiredFields = ['url', 'name', 'button_name', 'button_href'];

  /**
   * Handler HTML dédié au module
   */
  public function settings_handler($attrib) {
    $item = $this->rc->output->get_env('personal_item');
    // Ajouter les boutons d'actions
    $this->plugin->add_button(array(
      'command' => 'add_portail_button',
      'class'   => 'button add website_buttons',
      'innerclass' => 'button-inner',
      'label'   => 'mel_portail.item_add_button',
      'title'   => 'mel_portail.item_add_button_title',
    ), 'portail_item_edit_taskbar');
    return $this->settings_table(['url', 'name', 'tooltip', 'description', 'color', 'flip', 'width', 'provenance'], $item, '_website_buttons', !$item['personal']);
  }

  /**
   * Ajoute un fieldset supplémentaire si on souhaite plus d'options de paramètrage dans le module
   */
  public function setting_fieldset($item) {
    $out = "";
    if (isset($item['buttons'])) {
      $i = 0;
      foreach ($item['buttons'] as $key => $_button) {
        $out .= $this->setting_button_html($item, $i, [
          'button_name' => $key,
          'button_href' => $_button['href'],
          'button_title' => $_button['title'],
          'button_back' => $_button['back'],
        ], count($item['buttons']) - 1);
        $i++;
      }
    }
    else {
      $out .= $this->setting_button_html($item, 0, [
        'button_name' => '',
        'button_href' => '',
        'button_title' => '',
        'button_back' => '',
      ], 0);
    }
    // Ajout du template
    $out .= $this->setting_button_html($item, 'template', [
      'button_name' => '',
      'button_href' => '',
      'button_title' => '',
      'button_back' => '',
    ], 'template');
    return $out;
  }

  /**
   * Call setting_row from prop
   */
  protected function setting_prop(&$table, $prop, $item, $submodule = null, $readonly = false) {
    if ($readonly) {
      $this->setting_row($table, $prop, $item, null, 'readonly', $submodule);
    }
    else if ($prop == 'button_back') {
      $select = new html_select(['id' => '_item'.$submodule.'_button_back', 'name' => 'item'.$submodule.'_button_back']);
      foreach (['false', 'true'] as $type) {
        $select->add($this->plugin->gettext($type), $type);
      }
      $html = $this->setting_row($table, $prop, $item, $select->show($item[$prop] ? 'true' : 'false'), '', $submodule);
    }
    else {
        $html = parent::setting_prop($table, $prop, $item, $submodule);
    }
    return $html;
  }

  /**
   * Création de l'item à partir des données de formulaire
   */
  public function item_from_form(&$item) {
    $this->mapFields($item);
    // Gestion des boutons
    $boutton_keys = [];
    foreach ($_POST as $key => $value) {
      if (strpos($key, '_button_name') !== false && $key != 'item_website_buttons_template_button_name') {
        $boutton_keys[] = str_replace('_button_name', '', $key);
      }
    }
    // Parcourir les boutons
    foreach ($boutton_keys as $val) {
      $button_name = rcube_utils::get_input_value($val.'_button_name', rcube_utils::INPUT_POST);
      if (isset($button_name) && !empty($button_name)) {
        if (!isset($item['buttons'])) {
          $item['buttons'] = [];
        }
        $item['buttons'][$button_name] = [
          'href' => $this->fix_url(rcube_utils::get_input_value($val.'_button_href', rcube_utils::INPUT_POST)),
          'title' => rcube_utils::get_input_value($val.'_button_title', rcube_utils::INPUT_POST),
          'back' => rcube_utils::get_input_value($val.'_button_back', rcube_utils::INPUT_POST) == 'true',
        ];
      }
    }
  }

  /**
   * Génère le html pour ajouter un bouton
   */
  private function setting_button_html($item, $i, $button, $max_buttons) {
    $class = !empty($button['button_name']) ? 'collapsed' : 'expanded';
    return html::tag('fieldset', ['id' => 'item_button_website_buttons_'.$i, 'class' => 'more expandable ' . $class . ($i === 'template' ? '' : ' website_buttons buttons')], 
      html::tag('legend', ['class' => 'expand'], $this->plugin->gettext('item_button_website_buttons') . (!empty($button['button_name']) ? ' ' . $button['button_name'] : '')) .
      html::tag('legend', ['class' => 'collapse'], $this->plugin->gettext('item_button_website_buttons_collapse') . (!empty($button['button_name']) ? ' : ' . $button['button_name'] : '')) .
      $this->settings_table(['button_name', 'button_href', 'button_title', 'button_back'], $button, '_website_buttons_' . $i, !$item['personal']) .
      ($item['personal'] ? html::div(['class' => 'buttons'], html::a(['href' => '#', 'class' => 'button delete', 'title' => $this->plugin->gettext('item_delete_button_title'), 'onclick' => 'rcmail.delete_portail_button(event, this);'], $this->plugin->gettext('item_delete_button'))) : '')
    );
  }
}


