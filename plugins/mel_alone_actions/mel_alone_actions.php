<?php
class mel_alone_actions extends bnum_plugin {
  public $task = '.*';

  function init() {
    if ($this->get_current_task() === 'alone_action') {
      $this->register_task('alone_action');

      $this->create_action('get_folders_icons', [$this, 'get_folder_icons'])
           ->create_action('get_folders_color', [$this, 'get_folder_colors'])
          ->create_action('get_favorite_folders', [$this, 'get_display_folder']);
    }
  }

  function create_action($action, $callback) {
    if ($this->get_current_action() === $action) $this->register_action($action, $callback);

    return $this;
  }

  public function get_folder_colors()
  {
      $prefs = $this->rc()->config->get('folders_colors', []);

      echo json_encode($prefs);
      exit;
  }

  public function get_folder_icons()
  {
      $prefs = $this->rc()->config->get('folders_icons', []);

      echo json_encode($prefs);
      exit;
  }

  public function get_display_folder()
  {
      echo json_encode($this->rc()->config->get('favorite_folders', []));
      exit;
  }

}