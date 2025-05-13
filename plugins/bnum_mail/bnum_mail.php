<?php 
class bnum_mail extends bnum_plugin {
  public $task = 'mail';

  function init() {
    if ($this->is_index_action()) {
        $this->load_config();

        $config = $this->get_config('search_scope');

        if (isset($config) && !$this->rc()->output->get_env('search_scope')) $this->rc()->output->set_env('search_scope', $config);
    }
  }
}
