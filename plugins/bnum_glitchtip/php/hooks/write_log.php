<?php
declare(strict_types=1);

/**
 * Hook Roundcube "write_log".
 *
 * Relaie les lignes de log internes de Roundcube vers {@see Glitchtip}, si
 * l'option de configuration `enable_logs_hooks` est activée. Le niveau est
 * déduit du nom du canal (`error` si celui-ci contient "error", `info` sinon).
 *
 * @param bnum_glitchtip $plugin Instance du plugin, utilisée pour lire la configuration.
 * @param array $args Arguments transmis par Roundcube (`name` : nom du canal, `line` : contenu de la ligne).
 * @return array Les arguments inchangés, tels que reçus.
 */
return static function (bnum_glitchtip $plugin, array $args): array {
    if (!$plugin->get_config('enable_logs_hooks', false)) return $args;

    $channel = (string) ($args['name'] ?? 'console');
    $line = (string) ($args['line'] ?? '');

    $level = str_contains($channel, 'error') ? 'error' : 'info';

    Glitchtip::Instance()->log($level, $line, ['channel' => $channel]);

    return $args;
};
