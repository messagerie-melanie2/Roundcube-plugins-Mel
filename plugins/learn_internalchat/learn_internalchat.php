<?php 
class learn_internalchat extends bnum_plugin {
  public const TASK_NAME = 'chatplugin';
  public $task = '.*';

  function init() {
    if ($this->get_current_task() === self::TASK_NAME){
      $this->register_task(self::TASK_NAME); 
      
      $this->load_config();
      
      {
        $addToJavascript = true;
        $this->add_texts('localization/', $addToJavascript);
      }

      $this->register_action('index', 'action_index');
    }
  }

  public function action_index() : void {
    $this->include_module('main.js', 'js/lib');
    $this->include_css('style.css');

    $this->rc()->output->set_env('max_user', $this->get_config('max_user'));
    $this->rc()->output->send('learn_internal_chat.index');
  }
}
