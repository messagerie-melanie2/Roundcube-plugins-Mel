<?php
/**
 * Module Calendar_item pour le portail Mél
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

class Calendar_item extends Module {
  /**
   * Mapping entre les champs items et ceux du form
   */
  protected $mappingFields = [
    'calendar' => 'item_calendar_item_mailbox',
    'name' => 'item_calendar_item_name',
    'tooltip' => 'item_calendar_item_tooltip',
    'description' => 'item_calendar_item_description',
    'flip' => 'item_calendar_item_flip',
    'newtab' => 'item_calendar_item_newtab',
    'width' => 'item_calendar_item_width',
    'provenance' => 'item_calendar_item_provenance',
  ];

  /**
   * Liste des champs obligatoires
   */
  protected $requiredFields = ['calendar', 'name'];

  /**
   * Handler HTML dédié au module
   */
  public function settings_handler($attrib) {
    $item = $this->rc->output->get_env('personal_item');
    return $this->settings_table(['calendar', 'name', 'tooltip', 'description', 'width', 'provenance'], $item, '_calendar_item', !$item['personal']);
  }

  /**
   * Call setting_row from prop
   */
  protected function setting_prop(&$table, $prop, $item, $submodule = null, $readonly = false) {
    if ($readonly) {
      $this->setting_row($table, $prop, $item, null, 'readonly', $submodule);
    }
    else if ($prop == 'calendar') {
        $select = new html_select(['id' => '_item_calendar_item_mailbox', 'name' => 'item_calendar_item_mailbox']);
        $calendars = $this->rc->plugins->get_plugin('calendar')->driver->list_calendars();
        if (is_array($calendars) && !empty($calendars)) {
          foreach ($calendars as $calendars) {
            $select->add($calendars['listname'], $calendars['id']);
          }
        }
        $html = $this->setting_row($table, $prop, $item, $select->show($item[$prop] ?: ''), '', $submodule);
    }
    else {
        $html = parent::setting_prop($table, $prop, $item, $submodule);
    }
    return $html;
  }

  /**
   * Génère un item html en fonction des propriétés
   * 
   * @param array $attrib
   * @param array $item
   * @param string $user_dn
   * @return string HTML
   */
  public function item_html($attrib, &$item, $user_dn) {
    if (isset($item['calendar'])) {
      $item['url'] = '/?_task=calendar&source=' . $item['calendar'];
      $item['feedUrl'] = $item['url'];
    }
    return parent::item_html($attrib, $item, $user_dn);
  }
}


