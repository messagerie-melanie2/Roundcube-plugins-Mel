<?php
/**
 * Module Ariane pour le portail Mél
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

class Ariane extends Module {
  /**
   * Mapping entre les champs items et ceux du form
   */
  protected $mappingFields = [
    'channel' => 'item_ariane_channel',
    'name' => 'item_ariane_name',
    'tooltip' => 'item_ariane_tooltip',
    'description' => 'item_ariane_description',
    'flip' => 'item_ariane_flip',
    'newtab' => 'item_ariane_newtab',
    'width' => 'item_ariane_width',
    'provenance' => 'item_ariane_provenance',
  ];
  
  /**
   * Liste des champs obligatoires
   */
  protected $requiredFields = ['channel', 'name'];

  /**
   * Handler HTML dédié au module
   */
  public function settings_handler($attrib) {
    $item = $this->rc->output->get_env('personal_item');
    return $this->settings_table(['channel', 'name', 'tooltip', 'description', 'width', 'provenance'], $item, '_ariane', !$item['personal']);
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
    if (isset($item['channel'])) {
      $item['url'] = '/?_task=ariane&_channel=/channel/' . $item['channel'];
      $item['feedUrl'] = 'https://ariane.din.developpement-durable.gouv.fr/channel/' . $item['channel'];
    }
    return parent::item_html($attrib, $item, $user_dn);
  }
}


