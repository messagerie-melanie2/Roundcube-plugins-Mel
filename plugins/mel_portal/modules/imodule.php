<?php 
/**
 * Interface iModule pour le portail Mél
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

// Declaration de l'interface 'iModule'
interface iModule
{
  /**
   * Est-ce que le module doit être affiché ou non ?
   *
   * @return boolean
   */
  public function show();
  
  /**
   * Initialisation du module
   */
  public function init();

//   /**
//    * Handler HTML dédié au module
//    */
//   public function settings_handler($attrib);

//   /**
//    * Création/modification d'une vignette du type choisi
//    */
//   public function save_settings(&$item);

  /**
   * Génération du html pour l'item
   */
  public function item_html();
  public function row_size();
  public function edit_row_size($newSize);
  public function edit_order($order);
  public function order();
  public function use_custom_style();
  public function set_use_custom_style($use);
//   /**
//    * Merge les items
//    */
//   public function mergeItem($globalItem, $personalItem);

  // /**
  //  * Est-ce que l'item doit être en readonly
  //  */
  // public function isReadonly($item);
}