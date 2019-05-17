<?php
/**
 * Plugin Roundpad
 *
 * Etherpad class
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
 * Class for etherpad files
 *
 * @property string $name Name of the file
 * @property string $type Kind of file
 * @property timestamp $created Date of creation for the file
 * @property string $url Url of the file
 * @property string $owner Owner of the file
 */
class Etherpad extends file_roundpad
{
  /**
   * Constant type for etherpad
   */
  const TYPE_ETHERPAD = 'etherpad';
  /**
   * Maximum length name for an etherpad
   */
  const MAX_LENGTH_NAME = 50;

  /**
   * Etherpad constructor
   * Set type to etherpad
   * @param string $json
   */
  public function __construct($json = null) {
    parent::__construct($json);
    $this->setProperty('type', self::TYPE_ETHERPAD);
  }
  /**
   * Generate an etherpad URL based on the name
   * @param string $name
   * @return string
   */
  public static function GenerateURL($name) {
    $etherpad_url = rcmail::get_instance()->config->get('etherpad_url');
    $uniqid = uniqid();
    $name = urlencode(str_replace(' ', '_', $name));
    if (strlen($name . '_' . $uniqid) > self::MAX_LENGTH_NAME) {
      $name = substr($name, 0, self::MAX_LENGTH_NAME - strlen('_' . $uniqid) - 1);
    }
    return $etherpad_url . $name . '_' . $uniqid;
  }
}