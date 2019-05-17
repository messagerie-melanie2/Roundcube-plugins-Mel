<?php
/**
 * Plugin Roundpad
 *
 * Driver to handle etherpad or ethercalc links
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

class roundcube_roundpad extends roundpad_driver
{
  /**
   * Save data to storage
   */
  protected function _saveData() {
    if ($this->hasChanged) {
      return rcmail::get_instance()->user->save_prefs(array('roundpad_data' => $this->data));
    }
    return true;
  }
  /**
   * Load data from the storage
   */
  protected function _loadData() {
    $this->data = rcmail::get_instance()->config->get('roundpad_data', null);
    return true;
  }
}