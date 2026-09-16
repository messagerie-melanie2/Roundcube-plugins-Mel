<?php
declare(strict_types=1);


$beforePluginFactory = include __DIR__ . '/php/loader.php';
$beforePluginFactory();

require_once __DIR__ . '/php/functions/logs.php';

class bnum_glitchtip extends bnum_plugin {
    use BGT_LogsTrait {
        BGT_LogsTrait::logTrace as private __rcpclBody_BGT_LogsTrait_logTrace;
        BGT_LogsTrait::logDebug as private __rcpclBody_BGT_LogsTrait_logDebug;
        BGT_LogsTrait::logInfo as private __rcpclBody_BGT_LogsTrait_logInfo;
        BGT_LogsTrait::logWarning as private __rcpclBody_BGT_LogsTrait_logWarning;
        BGT_LogsTrait::logError as private __rcpclBody_BGT_LogsTrait_logError;
        BGT_LogsTrait::logFatal as private __rcpclBody_BGT_LogsTrait_logFatal;
        BGT_LogsTrait::isLogLevel as private __rcpclBody_BGT_LogsTrait_isLogLevel;
    }

    public $task = '.*';

    public function hook_startup(array $args): array {
        $factory = include __DIR__ . '/php/hooks/startup.php';
        return (Closure::bind($factory, null, self::class))($this, $args);
    }

    public function hook_write_log(array $args): array {
        $factory = include __DIR__ . '/php/hooks/write_log.php';
        return (Closure::bind($factory, null, self::class))($this, $args);
    }

    /**
         * Fonction statique du plugin exposant `logTrace()`.
         *
         * Enregistre un message de niveau "trace" via {@see Glitchtip::log()}.
         *
         * @param string $message Message à journaliser.
         * @param array $context Données de contexte associées au message.
         * @param array $attibutes Attributs additionnels transmis à Sentry/GlitchTip.
         * @return void
         **/
    public static function logTrace(string $message, array $context = [ ], array $attibutes = [ ]): void {
        self::__rcpclBody_BGT_LogsTrait_logTrace($message, $context, $attibutes);
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
         **/
    public static function logDebug(string $message, array $context = [ ], array $attibutes = [ ]): void {
        self::__rcpclBody_BGT_LogsTrait_logDebug($message, $context, $attibutes);
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
         **/
    public static function logInfo(string $message, array $context = [ ], array $attibutes = [ ]): void {
        self::__rcpclBody_BGT_LogsTrait_logInfo($message, $context, $attibutes);
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
         **/
    public static function logWarning(string $message, array $context = [ ], array $attibutes = [ ]): void {
        self::__rcpclBody_BGT_LogsTrait_logWarning($message, $context, $attibutes);
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
         **/
    public static function logError(string $message, array $context = [ ], array $attibutes = [ ]): void {
        self::__rcpclBody_BGT_LogsTrait_logError($message, $context, $attibutes);
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
         **/
    public static function logFatal(string $message, array $context = [ ], array $attibutes = [ ]): void {
        self::__rcpclBody_BGT_LogsTrait_logFatal($message, $context, $attibutes);
    }

    /**
         * Fonction statique du plugin exposant `isLogLevel()`.
         *
         * Permet de vérifier si un niveau de log donné est actif, via {@see Glitchtip::isLogLevel()}.
         *
         * @param LogLevel $level Niveau de log à vérifier (ex: "debug", "info", "error"...).
         * @return bool
         **/
    public static function isLogLevel(LogLevel $level): bool {
        return self::__rcpclBody_BGT_LogsTrait_isLogLevel($level);
    }

    public function init(): void {

        $this->load_config();


        $this->add_hook('startup', [$this, 'hook_startup']);
        $this->add_hook('write_log', [$this, 'hook_write_log']);

        $initFactory = include __DIR__ . '/php/init/init.php';
        (Closure::bind($initFactory, null, self::class))($this);
    }
}
