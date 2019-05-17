<?php
/**
 * Plugin Roundpad
 *
 * file_roundpad class
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
 * Class for support generic file type
 *
 * @property string $name Name of the file
 * @property string $type Kind of file
 * @property timestamp $created Date of creation for the file
 * @property string $url Url of the file
 * @property string $owner Owner of the file
 */
class file_roundpad extends object_roundpad
{
  /**
   * List of properties available in this kind of file
   * @var array
   */
  protected $properties = array('name', 'type', 'created', 'url', 'owner');

  /**
   * Return path of file based on parent folder path
   *
   * @return string
   */
  public function getPath() {
    return $this->parent->getPath() . $this->getProperty('name');
  }
  /**
   * Return path of parent folder based on parent path
   *
   * @return string
   */
  public function getParentPath() {
    return $this->parent->getPath();
  }
}