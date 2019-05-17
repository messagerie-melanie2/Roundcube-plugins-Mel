<?php
/**
 * Plugin Roundpad
 *
 * Other roundpad class
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
 * Class for others files
 *
 * @property string $name Name of the file
 * @property string $type Kind of file
 * @property timestamp $created Date of creation for the file
 * @property string $url Url of the file
 * @property string $owner Owner of the file
 */
class other_roundpad extends file_roundpad
{
  /**
   * Constant type for other
   */
  const TYPE_OTHER = 'other';

  /**
   * Other roundpad constructor
   * Set type to other
   * @param string $json
   */
  public function __construct($json = null) {
    parent::__construct($json);
    $this->setProperty('type', self::TYPE_OTHER);
  }
}