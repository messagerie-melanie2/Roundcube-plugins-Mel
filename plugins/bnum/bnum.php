<?php 
if (!defined('EMPTY_STRING')) {
    define('EMPTY_STRING', '');
}

include_once 'bnum_plugin.php';
class bnum extends bnum_plugin {
  public $task = '.*';

  function init() {
    $this->load_config();
  }
}
