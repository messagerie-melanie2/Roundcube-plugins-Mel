<?php

if (class_exists('bnum_plugin')) {
    require_once __DIR__.'/vendor/autoload.php';

    class bnum_glitchtip extends bnum_plugin
    {
        public $task = '.*';

        function init()
        {
            $this->load_config();
            $this->add_hook('startup', [$this, 'hook_startup']);

            if($_SERVER['REQUEST_METHOD'] === 'GET') {
                try {
                    $this->include_script('js/index.js');
                    $this->set_env('js_dsn', $this->get_config('js_dsn'));
                }catch(Error $e) {}
            }
        }

        public function hook_startup(?array $args) {
            $dsn = $this->get_config('php_dsn');
            \Sentry\init([
                'dsn' => $dsn,
                'traces_sample_rate' => 0.01, // 1% of transactions
            ]);
            return $args;
        }
    }
}