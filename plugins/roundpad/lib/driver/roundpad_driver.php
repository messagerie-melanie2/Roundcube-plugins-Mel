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

class roundpad_driver
{
  /**
   * JSON serialized data
   *
   * data = {
   *    name: '',
   *    created: 20160905,
   *    files: [
   *      { name: 'my_pad', type: 'etherpad', url: '', created: 20160918 },
   *      { name: 'my_calc', type: 'ethercalc', url: '', created: 20160917 }
   *    ],
   *    folders: [
   *      {
   *        name: 'my_folder',
   *        created: 20160906,
   *        files : [
   *          { name: 'another_pad', type: 'etherpad', url: '', created: 20160906 },
   *        ],
   *        folders: [],
   *      },
   *      {
   *        name: 'my_other_folder',
   *        created: 20160906,
   *        files : [],
   *        folders: [],
   *      }
   *    ],
   * }
   * @var string JSON
   */
  protected $data;
  /**
   * Root folder
   *
   * @var folder_roundpad
   */
  protected $root;
  /**
   * If data has changed
   *
   * @var boolean
   */
  protected $hasChanged;
  /**
   * Driver singleton
   *
   * @var Drive
   */
  private static $driver;
  /**
   * Default constructor
   */
  function __construct() {
    $this->_loadData();
    $this->root = new folder_roundpad();
    $this->root->fromJson($this->data);
  }
  /**
   * Default destructor
   */
  function __destruct() {
    $this->data = $this->root->toJson();
    $this->_saveData();
  }
  /**
   * Return singleton instance to drive
   * @return Driver
   */
  public static function get_driver() {
    if (is_null(self::$driver)) {
      $roundpad_driver = rcmail::get_instance()->config->get('roundpad_driver');
      $classname = $roundpad_driver.'_roundpad';
      include_once $roundpad_driver.'/'.$classname.'.php';
      self::$driver = new $classname();
    }
    return self::$driver;
  }
  /**
   * Generic create file method
   *
   * @param string $file_name
   * @param string $file_type
   * @param string $folder_uri
   * @param string $file_url
   * @param string $file_owner
   */
  public function createFile($file_name, $file_type, $folder_uri, $file_url = null, $file_owner = null) {
    if (empty($file_name) || empty($file_type)) {
      return false;
    }
    if ($file_type == Etherpad::TYPE_ETHERPAD) {
      return $this->createEtherpadFile($file_name, $folder_uri, $file_url, $file_owner);
    }
    else if ($file_type == Etherpad_public::TYPE_ETHERPAD) {
      return $this->createEtherpadPublicFile($file_name, $folder_uri, $file_url, $file_owner);
    }
    else if ($file_type == Ethercalc::TYPE_ETHERCALC) {
      return $this->createEthercalcFile($file_name, $folder_uri, $file_url, $file_owner);
    }
    else {
      return $this->createOtherRoundpadFile($file_name, $folder_uri, $file_url, $file_owner);
    }
  }
  /**
   * Create an etherpad file
   *
   * @param string $file_name
   * @param string $file_url
   * @param string $folder_uri Absolute folder uri
   * @param string $file_url
   * @param string $file_owner
   * @return boolean
   */
  public function createEtherpadFile($file_name, $folder_uri, $file_url = null, $file_owner = null) {
    $folder = $this->_findFolder($folder_uri);
    if (!isset($folder)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
    $file = new Etherpad();
    $file->name = $file_name;
    $file->created = time();
    $file->url = !empty($file_url) ? $file_url : Etherpad::GenerateURL($file_name);
    $file->owner = $file_owner;
    if ($this->_findFolder($folder_uri)->addFile($file)) {
      $this->hasChanged = true;
      return true;
    }
    else {
      return false;
    }
  }
  /**
   * Create an etherpad public file
   *
   * @param string $file_name
   * @param string $file_url
   * @param string $folder_uri Absolute folder uri
   * @param string $file_url
   * @param string $file_owner
   * @return boolean
   */
  public function createEtherpadPublicFile($file_name, $folder_uri, $file_url = null, $file_owner = null) {
    $folder = $this->_findFolder($folder_uri);
    if (!isset($folder)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
    $file = new Etherpad_public();
    $file->name = $file_name;
    $file->created = time();
    $file->url = !empty($file_url) ? $file_url : Etherpad_public::GenerateURL($file_name);
    $file->owner = $file_owner;
    if ($this->_findFolder($folder_uri)->addFile($file)) {
      if (empty($file_url) && rcmail::get_instance()->config->get('etherpad_public_create_pad', false)) {
        $_encoded_file_name = str_replace(rcmail::get_instance()->config->get('etherpad_public_url'), '', $file->url);
        if (!Etherpad_public::CreatePad($_encoded_file_name)) {
          $this->_findFolder($folder_uri)->removeFile($file);
          return false;
        }
      }
      $this->hasChanged = true;
      return true;
    }
    else {
      return false;
    }
  }
  /**
   * Create an ethercalc file
   *
   * @param string $file_name
   * @param string $file_url
   * @param string $folder_uri Absolute folder uri
   * @param string $file_url
   * @param string $file_owner
   * @return boolean
   */
  public function createEthercalcFile($file_name, $folder_uri, $file_url = null, $file_owner = null) {
    $folder = $this->_findFolder($folder_uri);
    if (!isset($folder)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
    $file = new Ethercalc();
    $file->name = $file_name;
    $file->created = time();
    $file->url = !empty($file_url) ? $file_url : Ethercalc::GenerateURL($file_name);
    $file->owner = $file_owner;
    if ($folder->addFile($file)) {
      $this->hasChanged = true;
      return true;
    }
    else {
      return false;
    }
  }
  /**
   * Create an other roundpad file
   *
   * @param string $file_name
   * @param string $file_url
   * @param string $folder_uri Absolute folder uri
   * @param string $file_url
   * @param string $file_owner
   * @return boolean
   */
  public function createOtherRoundpadFile($file_name, $folder_uri, $file_url, $file_owner) {
    $folder = $this->_findFolder($folder_uri);
    if (!isset($folder)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
    if (empty($file_url)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfileurlempty', 'roundpad'));
      return false;
    }
    $file = new other_roundpad();
    $file->name = $file_name;
    $file->created = time();
    $file->url = $file_url;
    $file->owner = $file_owner;
    if ($folder->addFile($file)) {
      $this->hasChanged = true;
      return true;
    }
    else {
      return false;
    }
  }
  /**
   * Edit a file
   *
   * @param file_roundpad $file
   * @param string $file_new_name
   * @param string $file_new_type
   * @param string $file_new_url
   * @param string $file_new_owner
   * @param string $folder_uri
   * @return boolean
   */
  public function editFile($file, $file_new_name, $file_new_type, $file_new_url, $file_new_owner, $folder_uri) {
    $folder = $this->_findFolder($folder_uri);
    if (!isset($folder)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
    list($index, $_file) = $folder->searchFile($file);
    if (isset($_file)) {
      if ($_file->name != $file_new_name) {
        $_file->name = $file_new_name;
        $this->hasChanged = true;
      }
      if ($_file->type != $file_new_type) {
        $_file->type = $file_new_type;
        $this->hasChanged = true;
      }
      if ($_file->url != $file_new_url) {
        list($other_index, $_other_file) = $folder->searchFile($file_new_url);
        if (!isset($_other_file)) {
          $_file->url = $file_new_url;
          $this->hasChanged = true;
        }
        else {
          $this->hasChanged = false;
          return false;
        }
      }
      if ($_file->owner != $file_new_owner) {
        $_file->owner = $file_new_owner;
        $this->hasChanged = true;
      }
      return true;
    }
    return false;
  }
  /**
   * Move a file
   *
   * @param string $folder_uri
   * @param file_roundpad $file
   * @param string $new_folder_uri
   * @return boolean
   */
  public function moveFile($folder_uri, $file, $new_folder_uri) {
    $folder = $this->_findFolder($folder_uri);
    $new_folder = $this->_findFolder($new_folder_uri);
    if (!isset($folder)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
    if (!isset($new_folder)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionnewfoldernotfound', 'roundpad'));
      return false;
    }
    list($index, $_file) = $folder->searchFile($file);
    if (isset($_file)) {
      if ($folder->removeFile($_file)
          && $new_folder->addFile($_file)) {
        $this->hasChanged = true;
        return true;
      }
    }
    return false;
  }
  /**
   * Delete a file
   *
   * @param string $file The file url to remove
   * @param string $folder_uri Absolute URI of the folder
   * @return boolean
   */
  public function deleteFile($file, $folder_uri) {
    $folder = $this->_findFolder($folder_uri);
    if (!isset($folder)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
    list($index, $_file) = $folder->searchFile($file);
    if ($folder->removeFile($file)) {
      if ($_file->owner == rcmail::get_instance()->get_user_name() && $_file->type == Etherpad_public::TYPE_ETHERPAD) {
        $_encoded_file_name = str_replace(rcmail::get_instance()->config->get('etherpad_public_url'), '', $_file->url);
        $ret = $this->deleteEtherpadPublicFile($_encoded_file_name);
      }
      else {
        $ret = true;
      }
      $this->hasChanged = true;
      return $ret;
    }
    else {
      return false;
    }
  }
  /**
   * Delete file from public etherpad
   * 
   * @return boolean
   */
  protected function deleteEtherpadPublicFile($file_name) {
    return Etherpad_public::DeletePad($file_name);
  }
  /**
   * Create a folder
   *
   * @param Folder $folder The folder to create
   * @return boolean
   */
  public function createFolder($folder) {
    list($folder_uri, $folder_name) = $this->_splitFolder($folder);
    $folder_parent = $this->_findFolder($folder_uri);
    if (!isset($folder_parent)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfolderparentnotfound', 'roundpad'));
      return false;
    }
    $_folder = new folder_roundpad();
    $_folder->name = $folder_name;
    $_folder->created = time();
    $_folder->files = array();
    $_folder->folders = array();
    if ($folder_parent->addFolder($_folder)) {
      $this->hasChanged = true;
      return true;
    }
    else {
      return false;
    }
  }
  /**
   * Rename a folder
   *
   * @param string $folder_uri Absolute URI for the folder to rename
   * @param string $new_name New name for the folder
   * @return boolean
   */
  public function renameFolder($folder_uri, $new_name) {
    if ($folder = $this->_findFolder($folder_uri)) {
      if (strpos($new_name, '/') !== false) {
        list($new_uri, $new_name) = $this->_splitFolder($new_name);
      }
      if ($folder->name != $new_name) {
        $folder->name = $new_name;
        $this->hasChanged = true;
      }
      if (isset($new_uri) && $new_uri != $folder_uri) {
        if (substr($new_uri, 0, strlen($folder_uri)) === $folder_uri) {
          $this->hasChanged = false;
          throw new Exception(rcmail::get_instance()->gettext('exceptionfolderhasnotchange', 'roundpad'));
          return false;
        }
        $new_parent = $this->_findFolder($new_uri);
        if (isset($new_parent)) {
          list($old_uri, $old_name) = $this->_splitFolder($folder_uri);
          $old_parent = $this->_findFolder($old_uri);
          if (isset($old_parent) && $old_parent->removeFolder($folder) && $new_parent->addFolder($folder)) {
            $this->hasChanged = true;
          }
          else {
            $this->hasChanged = false;
            return false;
          }
        }
        else {
          $this->hasChanged = false;
          throw new Exception(rcmail::get_instance()->gettext('exceptionfolderparentnotfound', 'roundpad'));
          return false;
        }
      }
      return true;
    }
    else {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
  }
  /**
   * Remove a folder
   *
   * @param string $folder_uri Absolute URI for the folder to remove
   * @return boolean
   */
  public function removeFolder($folder_uri) {
    list($folder_parent_uri, $folder_name) = $this->_splitFolder($folder_uri);
    $folder_parent = $this->_findFolder($folder_parent_uri);
    if (isset($folder_parent)) {
      if ($folder_parent->removeFolder($folder_name)) {
        $this->hasChanged = true;
        return true;
      }
    }
    else {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfolderparentnotfound', 'roundpad'));
    }
    return false;
  }
  /**
   * Return all children folders for a folder path
   *
   * @param string $folder_uri Folder path
   * @param boolean $recursive Is recursive search
   * @param string $root_name Name of the root folder, default is empty
   * @return array of folders path
   */
  public function get_folders($folder_uri = null, $recursive = false, $root_name = "/") {
    if (is_null($folder_uri)) {
      $folder = $this->root;
      $folder_uri = '';
    }
    else {
      $folder = $this->_findFolder($folder_uri);
    }
    return $folder->listFolders($root_name . $folder_uri, $recursive);
  }
  /**
   * List all files of a folder path
   *
   * @param string $folder_uri Folder path
   * @param string $search Name to search
   * @param boolean $all_folders Search in all folders
   * @return array of files
   */
  public function get_files($folder_uri = '/', $search = null, $all_folders = false) {
    $folder = $this->_findFolder($folder_uri);
    return $folder->listFiles($search);
  }
  /**
   * Search a folder object from absolute uri
   *
   * @param string $folder_uri Folder uri
   * @return folder_roundpad
   */
  protected function _findFolder($folder_uri) {
    $_folders = explode('/', $folder_uri);
    $_data = null;
    $current_folder = $this->root;
    foreach ($_folders as $_folder_name) {
      if (!empty($_folder_name)) {
        $res = $current_folder->searchFolder($_folder_name);
        if (!is_null($res)) {
          list($index, $current_folder) = $res;
        }
      }
    }
    return $current_folder;
  }
  /**
   * Split folder to folder uri and folder name
   *
   * @param string $folder Absolute URI of the folder
   * @return array(folder_uri, folder_name)
   */
  protected function _splitFolder($folder) {
    $parts = explode('/', $folder);
    $last = array_pop($parts);
    return array(implode('/', $parts), $last);
  }
  /**
   * Save data to storage
   */
  protected function _saveData() {}
  /**
   * Load data from the storage
   */
  protected function _loadData() {}
}