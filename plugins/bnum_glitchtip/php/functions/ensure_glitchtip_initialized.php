<?php
declare(strict_types=1);

/**
 * Implémentation de `_ensureGlitchtipIsInitialized()`.
 *
 * Initialise paresseusement le singleton {@see Glitchtip} à partir de la
 * configuration du plugin (`php_dsn`, `env`, `enable_logs`, `traces_sample_rate`,
 * `log_level`, `error_types`). Ne fait rien si le SDK est déjà initialisé
 * ({@see Glitchtip::isInitialized()}), ce qui permet de l'appeler sans risque
 * depuis plusieurs points d'entrée (hooks `startup`, `init`, `fatal_error`).
 *
 * @param bnum_glitchtip $plugin Instance du plugin, utilisée pour lire la configuration.
 * @return void
 */
return static function (bnum_glitchtip $plugin): void {
    if (Glitchtip::Instance()->isInitialized()) return;

    Glitchtip::Instance()->init((string) $plugin->get_config('php_dsn'), [
        'environment' => (string) $plugin->get_config('env', 'dev'),
        'enable_logs' => (bool) $plugin->get_config('enable_logs', false),
        'traces_sample_rate' => (float) $plugin->get_config('traces_sample_rate', 0.01),
        'log_level' => (string) $plugin->get_config('log_level', 'error'),
        'error_types' => $plugin->get_config('error_types'),
    ]);
};