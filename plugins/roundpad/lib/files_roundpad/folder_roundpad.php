<?php
/**
 * Plugin Roundpad
 *
 * folder_roundpad class
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
 * @property string $name Name of the folder
 * @property timestamp $created Date of creation for the file
 * @property file_roundpad[] $files List of files in the current folder
 * @property folder_roundpad[] $folders List of folders in the current folder
 */
class folder_roundpad extends object_roundpad
{
  /**
   * List of properties available in this kind of folder
   * @var array
   */
  protected $properties = array('name', 'created', 'files', 'folders');
  /**
   * List of objects for properties
   * @var array
   */
  protected $objects = array(
          'files' => array('type' => 'list', 'class' => 'file_roundpad'),
          'folders' => array('type' => 'list', 'class' => 'folder_roundpad'),
  );
  /**
   * Add file to folder
   * @param file_roundpad $file The file to add
   * @return boolean true if ok, false otherwise
   */
  public function addFile($file) {
    $res = $this->searchFile($file);
    if (!is_null($res)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfilealreadyexists', 'roundpad'));
      return false;
    }
    $resByName = $this->searchFileByName($file);
    if (!is_null($resByName)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfilenamealreadyexists', 'roundpad'));
      return false;
    }
    $files = $this->getProperty('files');
    if (!is_array($files)) {
      $files = array();
      $this->setProperty('files', $files);
    }
    $file->parent = $this;
    $files[] = $file;
    return $this->setProperty('files', $files);
  }
  /**
   * Remove file from folder
   * @param file_roundpad $file The file to remove
   * @return boolean true if ok, false otherwise
   */
  public function removeFile($file) {
    $res = $this->searchFile($file);
    if (is_null($res)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfilenotfound', 'roundpad'));
      return false;
    }
    $files = $this->getProperty('files');
    list($index, $f) = $res;
    unset($files[$index]);
    return $this->setProperty('files', $files);
  }
  /**
   * Search file from folder
   * @param file_roundpad $file The file to search
   * @return null|array Null if not found, array with index and file otherwise
   */
  public function searchFile($file) {
    foreach ($this->getProperty('files') as $index => $_f) {
      if ($file instanceof file_roundpad && strtolower($_f->url) == strtolower($file->url) || strtolower($_f->url) == strtolower($file)) {
        return array($index, $_f);
      }
    }
    return null;
  }
  /**
   * Search file by name from folder
   * @param file_roundpad $file The file to search
   * @return null|array Null if not found, array with index and file otherwise
   */
  public function searchFileByName($file) {
    foreach ($this->getProperty('files') as $index => $_f) {
      if ($file instanceof file_roundpad && strtolower($_f->name) == strtolower($file->name) || strtolower($_f->name) == strtolower($file)) {
        return array($index, $_f);
      }
    }
    return null;
  }
  /**
   * Add folder to current folder
   * @param folder_roundpad|string $folder The folder or folder name to add
   * @return boolean true if ok, false otherwise
   */
  public function addFolder($folder) {
    $res = $this->searchFolder($folder);
    if (!is_null($res)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfolderalreadyexists', 'roundpad'));
      return false;
    }
    else {
      $folders = $this->getProperty('folders');
      if (!is_array($folders)) {
        $folders = array();
        $this->setProperty('folders', $folders);
      }
      if (is_string($folder)) {
        $folder_name = $folder;
        $folder = new folder_roundpad();
        $folder->name = $folder_name;
        $folder->created = time();
        $folder->files = array();
        $folder->folders = array();
      }
      $folder->parent = $this;
      $folders[] = $folder;
      return $this->setProperty('folders', $folders);
    }
  }
  /**
   * Remove folder from current folder
   * @param folder_roundpad|string $folder The folder or folder name to remove
   * @return boolean true if ok, false otherwise
   */
  public function removeFolder($folder) {
    $res = $this->searchFolder($folder);
    if (is_null($res)) {
      throw new Exception(rcmail::get_instance()->gettext('exceptionfoldernotfound', 'roundpad'));
      return false;
    }
    else {
      $folders = $this->getProperty('folders');
      list($index, $f) = $res;
      unset($folders[$index]);
      return $this->setProperty('folders', $folders);
    }
  }
  /**
   * Search folder in current folder
   * @param folder_roundpad|string $folder The folder or folder name to search
   * @return null|array Null if not found, array with index and folder otherwise
   */
  public function searchFolder($folder) {
    if ($folder instanceof folder_roundpad) {
      $folder_name = $folder->name;
    }
    else {
      $folder_name = $folder;
    }
    foreach ($this->getProperty('folders') as $index => $_f) {
      if ($_f->name == $folder_name) {
        return array($index, $_f);
      }
    }
    return null;
  }
  /**
   * Return list of children folders for this current folder
   * @param string $path Current path URL
   * @param boolean $recursive Is recursive search
   * @return array of folders
   */
  public function listFolders($path, $recursive = false) {
    $folders_list = array($path);
    foreach ($this->getProperty('folders') as $folder) {
      $folders_list[] = $path . '/' . $folder->name;
      if ($recursive) {
        $folders_list = array_merge($folders_list, $folder->listFolders($path . '/' . $folder->name, true));
      }
    }
    return $folders_list;
  }
  /**
   * Return list of all files of current folder
   *
   * @param string $search Name to search
   * @return array of files
   */
  public function listFiles($search = null) {
    $files_list = array();
    foreach ($this->getProperty('files') as $file) {
      $addFile = false;
      if (!isset($search)) {
        $addFile = true;
      }
      else {
        if (is_array($search)) {
          foreach ($search as $key => $value) {
            if ($key == 'class') {
              $addFile = $value == $file->type;
            }
            else {
              $addFile = stripos($file->name, $search['name']) !== false;
            }
          }
        }
      }
      if ($addFile) {
        $_f = $file->toArray();
        $_f['path'] = $file->getParentPath();
        $files_list[] = $_f;
      }
    }
    return $files_list;
  }

  /**
   * Return path of folder based on parent path
   *
   * @return string
   */
  public function getPath() {
    if (isset($this->parent)) {
      return $this->parent->getPath() . $this->getProperty('name') . '/';
    }
    else {
      return '/';
    }
  }
  /**
   * Return path of parent folder based on parent path
   *
   * @return string
   */
  public function getParentPath() {
    if (isset($this->parent)) {
      return $this->parent->getPath();
    }
    else {
      return null;
    }
  }
}