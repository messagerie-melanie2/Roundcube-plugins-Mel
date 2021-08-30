<?php
/**
 * Module Website pour le portail Mél
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

class Website extends Module {
  /**
   * Mapping entre les champs items et ceux du form
   */
  protected $mappingFields = [
    'url' => 'item_website_url',
    'name' => 'item_website_name',
    'color' => 'item_website_color',
    'tooltip' => 'item_website_tooltip',
    'description' => 'item_website_description',
    'flip' => 'item_website_flip',
    'newtab' => 'item_website_newtab',
    'width' => 'item_website_width',
    'provenance' => 'item_website_provenance',
  ];

  /**
   * Liste des champs obligatoires
   */
  protected $requiredFields = ['url', 'name'];

  /**
   * Handler HTML dédié au module
   */
  public function settings_handler($attrib) {
    $item = $this->rc->output->get_env('personal_item');
    return $this->settings_table(['url', 'name', 'tooltip', 'description', 'color', 'width', 'provenance'], $item, '_website', !$item['personal']);
  }
}


