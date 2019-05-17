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

// Chargement de la librairie Melanie2
@include_once 'includes/libm2.php';

class melanie2_roundpad extends roundpad_driver
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
      $pref = new LibMelanie\Api\Melanie2\UserPrefs(null);
      $pref->scope = self::PREF_SCOPE;
      $pref->name = self::PREF_NAME;
      $pref->user = rcmail::get_instance()->get_user_name();
      $pref->value = $this->data;
      $ret = $pref->save();
      return !is_null($ret);
    }
    return true;
  }
  /**
   * Load data from the storage
   */
  protected function _loadData() {
    $pref = new LibMelanie\Api\Melanie2\UserPrefs(null);
    $pref->scope = self::PREF_SCOPE;
    $pref->name = self::PREF_NAME;
    $pref->user = rcmail::get_instance()->get_user_name();
    $ret = $pref->load();

    if ($ret) {
      $this->data = $pref->value;
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

    return $ret;
  }
}