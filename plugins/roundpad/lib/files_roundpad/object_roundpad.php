<?php
/**
 * Plugin Roundpad
 *
 * object_roundpad class
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

class object_roundpad
{
  /**
   * List of properties available in this kind of file
   * @var array
   */
  protected $properties = array();
  /**
   * List of objects for properties
   * @var array
   */
  protected $objects = array();
  /**
   * Data for properties
   * @var array
  */
  protected $data;
  /**
   * Folder parent
   * @var folder_roundpad
   */
  public $parent;

  /**
   * Default public constructor for the object class
   */
  public function __construct($data = null, $parent = null) {
    $this->data = array();
    if (isset($data)) {
      if (is_string($data)) {
        $this->fromJson($data);
      }
      else if (is_array($data)) {
        $this->fromArray($data);
      }
    }
    $this->parent = $parent;
  }

  /**
   * Convert this object to json for storage
   * @return string JSON result
   */
  public function toJson() {
    return json_encode($this->toArray());
  }
  /**
   * Convert json object to file object
   * @param string $json The JSON data
   */
  public function fromJson($json) {
    $this->fromArray(json_decode($json, true));
  }

  /**
   * Convert array object to this current object
   * @param array $data
   */
  public function fromArray($data) {
    $this->data = array();
    foreach ($this->properties as $prop) {
      if (isset($data[$prop])) {
        if (isset($this->objects[$prop])) {
          if ($this->objects[$prop]['type'] == 'list') {
            $this->data[$prop] = array();
            foreach ($data[$prop] as $fdata) {
              $object = new $this->objects[$prop]['class']($fdata, $this);
              $this->data[$prop][] = $object;
            }
          }
          else {
            $object = new $this->objects[$prop]['class']($data[$prop], $this);
            $this->data[$prop] = $object;
          }
        }
        else {
          $this->data[$prop] = $data[$prop];
        }
      }
    }
  }
  /**
   * Convert this object to array for storage/json
   * @return array
   */
  public function toArray() {
    $result = array();
    // Get all not-null data properties
    foreach ($this->properties as $prop) {
      if (isset($this->data[$prop])) {
        if (is_array($this->data[$prop])) {
          $result[$prop] = array();
          foreach ($this->data[$prop] as $key => $value) {
            if ($value instanceof object_roundpad) {
              $result[$prop][$key] = $value->toArray();
            }
            else {
              $result[$prop][$key] = $value;
            }
          }
        }
        else if ($this->data[$prop] instanceof object_roundpad) {
          $result[$prop] = $this->data[$prop]->toArray();
        }
        else {
          $result[$prop] = $this->data[$prop];
        }
      }
    }
    return $result;
  }

  // // PROTECTED METHODS
  /**
   * Get property value, used by magical getter
   *
   * @param string $name The property name
   * @return multitype:|NULL null if property does not exist, or the property value if so
   */
  protected function getProperty($name) {
    if (in_array($name, $this->properties) && isset($this->data[$name])) {
      return $this->data[$name];
    }
    else {
      return null;
    }
  }
  /**
   * Set property value, used by magical setter
   *
   * @param string $name The property name
   * @param mutitype $value The property value
   * @return boolean true if property exists and is set to the value
   */
  protected function setProperty($name, $value) {
    if (in_array($name, $this->properties)) {
      $this->data[$name] = $value;
      return true;
    }
    else {
      return false;
    }
  }
  /**
   * Return if the property value is set, used by magical issetter
   *
   * @param string $name The property name
   * @return boolean true if the property's data is set, false otherwise
   */
  protected function issetProperty($name) {
    return in_array($name, $this->properties) && isset($this->data[$name]);
  }
  /**
   * Unset the property value
   *
   * @param string $name The property name
   * @return boolean true if property exists and is unset, false otherwise
   */
  protected function unsetProperty($name) {
    if (in_array($name, $this->properties) && isset($this->data[$name])) {
      unset($this->data[$name]);
      return true;
    }
    else {
      return false;
    }
  }

  // // MAGICALS SETTER,GETTER,...
  public function __get($name) {
    return $this->getProperty($name);
  }

  public function __set($name, $value) {
    return $this->setProperty($name, $value);
  }

  public function __isset($name) {
    return $this->issetProperty($name);
  }

  public function __unset($name) {
    return $this->unsetProperty($name);
  }

  public function __toString() {
    return $this->toJson();
  }
}