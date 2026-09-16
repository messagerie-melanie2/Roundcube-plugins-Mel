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
    $plugin->ensure_glitchtip_initialized();

    return $args;
};
