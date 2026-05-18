<?php
use MelVisio\Driver;

final class dnum extends Driver
{
    public function __construct(\mel_visio $plugin) {
        parent::__construct($plugin);
    }

    protected function _p_init(): void
    {
        parent::_p_init();

        $is_top_context = $_SERVER['REQUEST_METHOD'] === 'GET' && $this->rc()->task === 'bnum' && $this->_is_index();
        if ($is_top_context) {
            $this->_p_plugin()->load_script_module_driver('dnum_top_context');
        }
    }

    private function _is_index(): bool {
        return $this->rc()->action === EMPTY_STRING || $this->rc()->action === 'index';
    }
}
