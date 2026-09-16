<?php
declare(strict_types=1);


$beforePluginFactory = include __DIR__ . '/php/loader.php';
$beforePluginFactory();

require_once __DIR__ . '/php/functions/logs.php';

/**
 * Plugin bnum_glitchtip — intégration Sentry/GlitchTip pour Roundcube-Mel.
 *
 * Hooks utilisés :
 * - startup     : initialisation du SDK Sentry pour la requête courante
 * - write_log   : relai des logs internes Roundcube vers Glitchtip
 * - fatal_error : hook projet (core), capture des erreurs fatales PHP avant l'exit()
 */
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

    public function hook_fatal_error(array $args): array {
        $factory = include __DIR__ . '/php/hooks/fatal_error.php';
        return (Closure::bind($factory, null, self::class))($this, $args);
    }

    /**
         * Initialise le singleton {@see Glitchtip} à partir de la configuration du
         * plugin, si ce n'est pas déjà fait.
         *
         * Centralise le bloc lecture de config + {@see Glitchtip::init()} partagé par
         * les hooks `startup`, `fatal_error` et le point d'entrée `init()` du plugin.
         *
         * @return void
         **/
    public function ensure_glitchtip_initialized(): void {
        if (Glitchtip::Instance()->isInitialized()) return;

        Glitchtip::Instance()->init((string) $this->get_config('php_dsn'), [
            'environment' => (string) $this->get_config('env', 'dev'),
            'enable_logs' => (bool) $this->get_config('enable_logs', false),
            'traces_sample_rate' => (float) $this->get_config('traces_sample_rate', 0.01),
            'log_level' => (string) $this->get_config('log_level', 'error'),
            'error_types' => $this->get_config('error_types'),
        ]);
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


        $this->add_hooks([
            'startup'     => [$this, 'hook_startup'],
            'write_log'   => [$this, 'hook_write_log'],
            'fatal_error' => [$this, 'hook_fatal_error'],
        ]);

        $initFactory = include __DIR__ . '/php/init/init.php';
        (Closure::bind($initFactory, null, self::class))($this);
    }
}
