<?php
class Workspace {
  private $_uid;
  private $_workspace;
  private $_logo;
  private $_title;
  private $_description;
  private $_hashtag;
  private $_users;
  private $_is_public;
  private $_creator;
  private $_created;
  private $_modified;
  private $_settings;
  private $_objects;
  
  public function __construct($uid, $load = false) {
    if ($uid !== null) {
      $this->_uid = $uid;
      $this->_workspace = driver_mel::gi()->workspace([driver_mel::gi()->getUser()]);
      $this->_workspace->uid = $uid;
      
      if ($load) $this->load();
    }
  }

  private function _from_workspace($workspace) {
    $this->_workspace = $workspace;
    $this->_uid = $this->_workspace->uid;

    unset($this->_title);
    unset($this->_description);
    unset($this->_hashtag);
    unset($this->_users);
    unset($this->_is_public);
    unset($this->_creator);
    unset($this->_created);
    unset($this->_modified);
    unset($this->_settings);
    unset($this->_objects);
    unset($this->_logo);

    return $this;
  }

  public function load() {
    $this->_workspace->load();

    return $this;
  }

  public function save() {
    $this->_workspace->save();
  
    return $this;
  }

  public function uid() {
    return $this->_uid;
  }

  public function logo($newLogo = null) {
    $ret = $this;
    
    if (isset($newLogo)) {
      $this->_workspace->logo = $newLogo;
      $this->_logo = $newLogo;
    }
    else if(isset($this->_logo)) $ret = $this->_logo;
    else {
      $this->_logo = $this->_workspace->logo;
      $ret = $this->logo();
    }

    return $ret;
  }  

  public static function FromWorkspace($workspace) {
    $wsp = new Workspace(null);

    return $wsp->_from_workspace($workspace);
  }

}