<?php
declare(strict_types=1);

/**
 * Fonction statique du plugin exposant `captureException()`.
 *
 * Remonte une exception comme erreur (Issue) avec sa stacktrace, via {@see Glitchtip::captureException()}.
 *
 * @param \Throwable $throwable Exception à remonter.
 * @param array $extra Données de contexte associées à l'erreur.
 * @param array $tags Tags indexés, filtrables dans GlitchTip.
 * @return string|null Identifiant de l'événement, ou `null` s'il n'a pas été envoyé.
 */
return static function (\Throwable $throwable, array $extra = [], array $tags = []): ?string {
    return Glitchtip::Instance()->captureException($throwable, $extra, $tags);
};