<?php
declare(strict_types=1);

/**
 * Hook Roundcube "startup".
 *
 * Initialise le singleton {@see Glitchtip} une seule fois par requête, à partir
 * de la configuration du plugin (DSN, environnement, activation des logs,
 * taux d'échantillonnage des traces, niveau de log).
 *
 * @param bnum_glitchtip $plugin Instance du plugin, utilisée pour lire la configuration.
 * @param array $args Arguments transmis par Roundcube pour ce hook.
 * @return array Les arguments inchangés, tels que reçus.
 */
return static function (bnum_glitchtip $plugin, array $args): array {
    if (Glitchtip::Instance()->isInitialized()) return $args;
    
    Glitchtip::Instance()->init((string) $plugin->get_config('php_dsn'), [
        'environment' => (string) $plugin->get_config('env', 'dev'),
        'enable_logs' => (bool) $plugin->get_config('enable_logs', false),
        'traces_sample_rate' => (float) $plugin->get_config('traces_sample_rate', 0.01),
        'log_level' => (string) $plugin->get_config('log_level', 'error'),
        'error_types' => $plugin->get_config('error_types'),
    ]);

    return $args;
};
