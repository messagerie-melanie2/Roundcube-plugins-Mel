<?php
declare(strict_types=1);

use bnum_glitchtip\types\scope;

/**
 * Hook "log_capture_error" émis par mel_logs pour remonter une exception : la relaie
 * vers {@see Glitchtip::captureException()} via `bnum_glitchtip::captureException()`.
 *
 * L'exception arrive dans Glitchtip comme erreur (Issue) avec sa stacktrace, et non
 * comme simple ligne de log : `enable_logs` et `log_level` ne s'appliquent donc pas.
 *
 * @param scope $plugin Instance du plugin.
 * @param array{error: \Throwable} $args Arguments transmis par le hook ; contient `error`, l'exception à remonter.
 * @return array Les arguments inchangés, tels que reçus.
 */
return static function (scope $plugin, array $args): array {
    $plugin->captureException($args['error']);

    return $args;
};
