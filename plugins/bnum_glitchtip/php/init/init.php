<?php
declare(strict_types=1);

/**
 * Point d'entrée `init()` du plugin.
 *
 * Initialise {@see Glitchtip} avec la configuration du plugin si ce n'est pas
 * déjà fait, puis, pour les requêtes GET, injecte le script front-end
 * (`js/index.js`) et expose les variables nécessaires (`js_dsn`, `enable_logs`,
 * `env`) dans `rcmail.env` côté client.
 *
 * @param bnum_glitchtip $plugin Instance du plugin.
 * @return void
 */
return static function (bnum_glitchtip $plugin): void {
    $env = (string) $plugin->get_config('env', 'dev');
    $enable_logs = (bool) $plugin->get_config('enable_logs', false);

    $plugin->ensure_glitchtip_initialized();

    if($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $plugin->include_script('js/index.js');
            $plugin->set_env('js_dsn', $plugin->get_config('js_dsn'));
            $plugin->set_env('enable_logs', $enable_logs);
            $plugin->set_env('env', $env);
        }catch(Error $e) {}
    }
};
