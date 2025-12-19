<?php 
class bnum_mail extends bnum_plugin {
  public $task = 'mail|settings';

  function init() {
    // PAMELA - 0008128 - Plusieurs signatures
    // Charger le JS uniquement pour la tâche "mail"
    if ($this->rc()->task === 'mail') {
      $this->include_script('js/lib/main.js');
    }

    if ($this->is_index_action()) {
        $this->load_config();

        $config = $this->get_config('search_scope');

        if (isset($config) && !$this->rc()->output->get_env('search_scope')) $this->rc()->output->set_env('search_scope', $config);
    }
    else if ($this->get_current_action() === 'show' && $this->get_input('_extwin') == '1') {
      $this->include_script_from_plugin('mel_metapage', 'js/functions.js');
    }

    $this->add_hook('messages_list', [$this, 'hook_message_list']);
  }

  public function hook_message_list($args) {
    if ($args['cols'] && is_array($args['cols'])) {
      $this->load_config();
      // Gestion des colonnes additionnels
      $args['cols'] = array_merge($args['cols'], $this->get_config('additional_columns', ['priority']));
    }

    return $args;
  }
}
