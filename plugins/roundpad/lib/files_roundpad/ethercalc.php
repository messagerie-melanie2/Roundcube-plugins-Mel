<?php
/**
 * Plugin Roundpad
 *
 * Ethercalc class
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

/**
 * Class for ethercalc files
 *
 * @property string $name Name of the file
 * @property string $type Kind of file
 * @property timestamp $created Date of creation for the file
 * @property string $url Url of the file
 * @property string $owner Owner of the file
 */
class Ethercalc extends file_roundpad
{
  /**
   * Constant type for ethercalc
   */
  const TYPE_ETHERCALC = 'ethercalc';

  /**
   * Ethercalc constructor
   * Set type to ethercalc
   * @param string $json
   */
  public function __construct($json = null) {
    parent::__construct($json);
    $this->setProperty('type', self::TYPE_ETHERCALC);
  }
  /**
   * Generate an ethercalc URL based on the name
   * @param string $name
   * @return string
   */
  public static function GenerateURL($name) {
    $ethercalc_url = rcmail::get_instance()->config->get('ethercalc_url');
    $name = urlencode(str_replace(' ', '_', $name));
    return $ethercalc_url . $name . '_' . uniqid();
  }
}