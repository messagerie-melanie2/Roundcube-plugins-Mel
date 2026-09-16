<?php
declare(strict_types=1);

/**
 * Hook "fatal_error" (projet, déclenché par le core juste avant l'exit() de
 * rcmail_fatal_error() dans program/include/iniset.php).
 *
 * Remonte vers Glitchtip une erreur fatale PHP (E_ERROR/E_PARSE) qui serait sinon
 * perdue : le SDK Sentry enregistre son propre shutdown handler trop tard (pendant le
 * hook `startup`) pour s'exécuter avant l'exit() du core.
 *
 * @param bnum_glitchtip $plugin Instance du plugin, utilisée pour lire la configuration.
 * @param array $args Arguments transmis par le hook ; contient `error` (résultat de error_get_last()).
 * @return array Les arguments inchangés, tels que reçus.
 */
return static function (bnum_glitchtip $plugin, array $args): array {
    $error = $args['error'] ?? null;
    if (!is_array($error)) return $args;

    try {
        $plugin->ensure_glitchtip_initialized();
        Glitchtip::Instance()->captureFatalError();

        mel_logs::gi()->log(
            mel_logs::ERROR,
            "[bnum_glitchtip] Erreur fatale transmise à Glitchtip avant exit : "
                . "{$error['message']} dans {$error['file']}:{$error['line']}"
        );
    } catch (\Throwable $e) {
        // On ne relance jamais depuis ce handler : le core est déjà en train de
        // terminer le script suite à une erreur fatale.
    }

    return $args;
};
