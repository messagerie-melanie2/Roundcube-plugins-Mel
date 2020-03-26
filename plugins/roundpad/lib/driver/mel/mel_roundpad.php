<?php
/**
 * Plugin Roundpad
 *
 * Driver to handle etherpad or ethercalc
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

// Chargement de la librairie ORM
@include_once 'includes/libm2.php';

class mel_roundpad extends roundpad_driver
{
  /**
   * Scope
   */
  const PREF_SCOPE = 'roundpad';
  /**
   * Name
   */
  const PREF_NAME = 'data';

  /**
   * Save data to storage
   */
  protected function _saveData() {
    if ($this->hasChanged) {
      return driver_mel::gi()->getUser()->savePreference(self::PREF_SCOPE, self::PREF_NAME, $this->data);
    }
    return true;
  }
  /**
   * Load data from the storage
   */
  protected function _loadData() {
    $value = driver_mel::gi()->getUser()->getPreference(self::PREF_SCOPE, self::PREF_NAME);
    if (isset($value)) {
      $this->data = $value;
    }
    if (!isset($this->data)) {
      $this->data = json_encode(array(
              "name" => "",
              "created" => time(),
              "files" => array(),
              "folders" => array(),
      ));
      $this->hasChanged = true;
    }
    return true;
  }
}