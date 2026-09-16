<?php
declare(strict_types=1);

trait BGT_LogsTrait
{
    /**
     * Fonction statique du plugin exposant `logTrace()`.
     *
     * Enregistre un message de niveau "trace" via {@see Glitchtip::log()}.
     *
     * @param string $message Message à journaliser.
     * @param array $context Données de contexte associées au message.
     * @param array $attibutes Attributs additionnels transmis à Sentry/GlitchTip.
     * @return void
     */
    public static function logTrace(string $message, array $context = [], array $attibutes = []): void
    {
        Glitchtip::Instance()->log('trace', $message, Constants::LOG_OFFSET, $context, $attibutes);
    }

    /**
     * Fonction statique du plugin exposant `logDebug()`.
     *
     * Enregistre un message de niveau "debug" via {@see Glitchtip::log()}.
     *
     * @param string $message Message à journaliser.
     * @param array $context Données de contexte associées au message.
     * @param array $attibutes Attributs additionnels transmis à Sentry/GlitchTip.
     * @return void
     */
    public static function logDebug(string $message, array $context = [], array $attibutes = []): void
    {
        Glitchtip::Instance()->log('debug', $message, Constants::LOG_OFFSET, $context, $attibutes);
    }

    /**
     * Fonction statique du plugin exposant `logInfo()`.
     *
     * Enregistre un message de niveau "info" via {@see Glitchtip::log()}.
     *
     * @param string $message Message à journaliser.
     * @param array $context Données de contexte associées au message.
     * @param array $attibutes Attributs additionnels transmis à Sentry/GlitchTip.
     * @return void
     */
    public static function logInfo(string $message, array $context = [], array $attibutes = []): void
    {
        Glitchtip::Instance()->log('info', $message, Constants::LOG_OFFSET, $context, $attibutes);
    }

    /**
     * Fonction statique du plugin exposant `logWarning()`.
     *
     * Enregistre un message de niveau "warn" via {@see Glitchtip::log()}.
     *
     * @param string $message Message à journaliser.
     * @param array $context Données de contexte associées au message.
     * @param array $attibutes Attributs additionnels transmis à Sentry/GlitchTip.
     * @return void
     */
    public static function logWarning(string $message, array $context = [], array $attibutes = []): void
    {
        Glitchtip::Instance()->log('warn', $message, Constants::LOG_OFFSET, $context, $attibutes);
    }

    /**
     * Fonction statique du plugin exposant `logError()`.
     *
     * Enregistre un message de niveau "error" via {@see Glitchtip::log()}.
     *
     * @param string $message Message à journaliser.
     * @param array $context Données de contexte associées au message.
     * @param array $attibutes Attributs additionnels transmis à Sentry/GlitchTip.
     * @return void
     */
    public static function logError(string $message, array $context = [], array $attibutes = []): void
    {
        Glitchtip::Instance()->log('error', $message, Constants::LOG_OFFSET, $context, $attibutes);
    }

    /**
     * Fonction statique du plugin exposant `logFatal()`.
     *
     * Enregistre un message de niveau "fatal" via {@see Glitchtip::log()}.
     *
     * @param string $message Message à journaliser.
     * @param array $context Données de contexte associées au message.
     * @param array $attibutes Attributs additionnels transmis à Sentry/GlitchTip.
     * @return void
     */
    public static function logFatal(string $message, array $context = [], array $attibutes = []): void
    {
        Glitchtip::Instance()->log('fatal', $message, Constants::LOG_OFFSET, $context, $attibutes);
    }

    /**
     * Fonction statique du plugin exposant `isLogLevel()`.
     *
     * Permet de vérifier si un niveau de log donné est actif, via {@see Glitchtip::isLogLevel()}.
     *
     * @param LogLevel $level Niveau de log à vérifier (ex: "debug", "info", "error"...).
     * @return bool
     */
    public static function isLogLevel(LogLevel $level): bool
    {
        return Glitchtip::Instance()->isLogLevel($level->value);
    }
}
