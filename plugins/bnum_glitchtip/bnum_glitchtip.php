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

    /**
         * Hook "fatal_error".
         *
         * ⚠️ Ce hook n'est PAS déclenché nativement par Roundcube (aucun appel de hook
         * n'existe à cet endroit dans une installation standard). Il suppose que le core
         * Roundcube a été modifié pour appeler les hooks juste avant l'exit() de
         * `rcmail_fatal_error()` (dans `program/include/iniset.php`) ; sans cette
         * modification côté core, ce hook ne sera jamais invoqué.
         *
         * Une fois déclenché, il capture l'erreur fatale PHP en cours (via
         * {@see Glitchtip::captureFatalError()}) et force son envoi synchrone vers
         * Glitchtip, car le shutdown handler du SDK Sentry (enregistré trop tard,
         * pendant le hook `startup`) n'aurait pas le temps de s'exécuter avant l'exit()
         * du core.
         *
         * @see php/hooks/fatal_error.php Implémentation du hook.
         **/
    public function hook_fatal_error(array $args): array {
        $factory = include __DIR__ . '/php/hooks/fatal_error.php';
        return (Closure::bind($factory, null, self::class))($this, $args);
    }

    public function hook_write_log(array $args): array {
        $factory = include __DIR__ . '/php/hooks/write_log.php';
        return (Closure::bind($factory, null, self::class))($this, $args);
    }

    /**
         * Initialise paresseusement le singleton {@see Glitchtip} à partir de la
         * configuration du plugin (DSN, environnement, activation des logs, taux
         * d'échantillonnage des traces, niveau de log, `error_types`).
         *
         * N'a aucun effet si le SDK est déjà initialisé ({@see Glitchtip::isInitialized()}) :
         * elle peut donc être appelée sans risque à plusieurs reprises.
         *
         * Appelée depuis les hooks `startup`, `init` et `fatal_error` afin de garantir
         * que le SDK est prêt avant toute utilisation, quel que soit le point d'entrée.
         *
         * @return void
         **/
    private function _ensureGlitchtipIsInitialized(): void {
        $factory = include __DIR__ . '/php/functions/ensure_glitchtip_initialized.php';
        (Closure::bind($factory, null, self::class))($this);
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
        * Fonction statique du plugin exposant `captureException()`.
        *
        * Remonte une exception comme erreur (Issue) avec sa stacktrace, via {@see Glitchtip::captureException()}.
        *
        * @param \Throwable $throwable Exception à remonter.
        * @param array $extra Données de contexte associées à l'erreur.
        * @param array $tags Tags indexés, filtrables dans GlitchTip.
        * @return string|null Identifiant de l'événement, ou `null` s'il n'a pas été envoyé.
        **/
    public static function captureException(Throwable $throwable, array $extra = [ ], array $tags = [ ]): string {
        $factory = include __DIR__ . '/php/functions/capture_exception.php';
        return (Closure::bind($factory, null, self::class))($throwable, $extra, $tags);
    }

    /**
         * Fonction statique du plugin exposant `isLogLevel()`.
         *
         * Permet de vérifier si un niveau de log donné est actif, via {@see Glitchtip::isLogLevel()}.
         *
         * @param LogLevel $level Niveau de log à vérifier (ex: "debug", "info", "error"...).
         * @return bool
         **/
    #[NoDiscard('Vérification sans effet de bord, le résultat doit conditionner le log')]
    public static function isLogLevel(LogLevel $level): bool {
        return self::__rcpclBody_BGT_LogsTrait_isLogLevel($level);
    }

    public function hook_bnum_log_is_log_level(array $args): array {
        if ($args['result'] === true) return $args;

		$level = $args['level'];
        $args['result'] = Glitchtip::Instance()->isLogLevel($level?->value ?? EMPTY_STRING);

        return $args;
    }

    public function hook_bnum_log(array $args): array {
        if (!$args['data'] || $args['data']['_bnum.log.can_distant_app'] === false) return $args;

        Glitchtip::Instance()->log($args['level']->value, $args['message'], context:$args['data'] ?? [], attributes:['plugin.caller' => $args['caller']]);
        return $args;
    }

    public function hook_log_capture_error(array $args): array {
        Glitchtip::Instance()->captureException($args['error'], $args['data']['extra'] ?? [], $args['data']['tags'] ?? []);
        return $args;
    }

    public function init(): void {

        $this->load_config();


        $this->add_hook('startup', [$this, 'hook_startup']);
        $this->add_hook('fatal_error', [$this, 'hook_fatal_error']);
        $this->add_hook('write_log', [$this, 'hook_write_log']);

        if (class_exists('bnum', autoload:false)) {
			$this->add_hook('bnum.log.isLogLevel', [$this, 'hook_bnum_log_is_log_level']);
			$this->add_hook('bnum.log', [$this, 'hook_bnum_log']);
            $this->add_hook('bnum.log.captureError', [$this, 'hook_log_capture_error']);
		}

        $initFactory = include __DIR__ . '/php/init/init.php';
        (Closure::bind($initFactory, null, self::class))($this);
    }
}
