<?php
class mel_alone_actions extends bnum_plugin {
  public $task = '.*';

  function init() {
    if ($this->get_current_task() === 'alone_action') {
      $this->register_task('alone_action');

      $action = $this->get_current_action();
      $this->register_action($action, [$this, $action]);
      unset($action);
    }
  }

  public function get_folders_color()
  {
      $prefs = $this->rc()->config->get('folders_colors', []);

      echo json_encode($prefs);
      exit;
  }

  public function get_folders_icons()
  {
      $prefs = $this->rc()->config->get('folders_icons', []);

      echo json_encode($prefs);
      exit;
  }

  public function get_favorite_folders()
  {
      echo json_encode($this->rc()->config->get('favorite_folders', []));
      exit;
  }

}