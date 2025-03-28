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

      $this->register_action('index', [$this, 'action_index']);
    }

    $this->add_button([
      'href' => '?_task='. self::TASK_NAME,
      'class'	=> self::TASK_NAME,
      'classsel' => 'button-selected'. self::TASK_NAME,
      'innerclass' => 'inner',
      'label'	=> 'private_chat',
      'title' => 'private_chat',
      'type'       => 'link',
      'domain' => "learn_internalchat"
    ], 'taskbar');
  }

  public function action_index() : void {
    $this->include_module('main.js', 'js/lib');
    $this->include_css('index.css');

    $this->rc()->output->set_env('max_user', $this->get_config('max_user'));
    $this->rc()->output->send('learn_internalchat.index');
  }

  public function action_contact_user() : void {
    $userToContact = $this->get_input('_user', rcube_utils::INPUT_GET);

    if (strpos($userToContact, '@') !== false) $userToContact = $this->get_user_from_email($userToContact);
    else $userToContact = $this->get_user($userToContact);

    $this->sendEncodedExit($userToContact !== null);
  }
}
