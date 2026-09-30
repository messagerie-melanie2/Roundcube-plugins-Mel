<?php
declare(strict_types = 1);

namespace Bnum;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_FUNCTION)]
final class DistantAppLog {
    public function __construct(
        public bool $onlyDistantAppLog = true
    ) {}
}

/**
 * Niveaux de journalisation disponibles, du plus verbeux au plus critique.
 *
 * Chaque cas est "backed" par une chaîne de caractères (`string`), utilisable
 * directement comme valeur sérialisable (ex. écriture dans un fichier de log,
 * transmission via une API, stockage en base).
 */
enum LogLevel: string
{
    /** Traçage très fin, utilisé pour du débogage approfondi (flux d'exécution détaillé). */
    case Trace = 'trace';

    /** Informations de débogage utiles au développement, non destinées à la production. */
    case Debug = 'debug';

    /** Événement normal du fonctionnement de l'application. */
    case Info = 'info';

    /** Situation anormale mais non bloquante, qui mérite une attention. */
    case Warn = 'warn';

    /** Erreur empêchant une opération de se dérouler correctement. */
    case Error = 'error';

    /** Erreur critique compromettant le fonctionnement global de l'application. */
    case Fatal = 'fatal';
}

final class LogManager
{
    private readonly \rcmail $rc;
    public function __construct() {
        $this->rc = \rcmail::get_instance();
    }

    private function _execHook(string $key, array $args): array {
        return  $this->rc->plugins->exec_hook($key, $args);
    }

    private function _updateOffset(array &$data): void {
        $data['_bnum.log.offset'] = ((int)$data['_bnum.log.offset'] ?? 0) + 1;
    }

    /**
     * Récupère le nom de la fonction ou de la méthode qui a appelé la fonction courante.
     *
     * @param int $offset Augmentez cette valeur si vous encapsulez cet appel dans d'autres sous-fonctions.
     * @return string Le nom de l'appelant (ex: "MaClasse::maMethode" ou "maFonction" ou "main")
     */
    #[\NoDiscard("lecture de la pile sans effet de bord : sans utiliser le nom retourné, l'appel est inutile et coûte un debug_backtrace()")]
    private function _getCallingMethod(int $offset = 0): string
    {
        // On prend le niveau 2 (l'appelant direct) + l'offset si nécessaire
        $level = 2 + $offset;

        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, $level + 1);

        if (!isset($trace[$level])) {
            return 'main';
        }

        $caller = $trace[$level];
        $name = $caller['function'] ?? 'unknown';

        // Si c'est une méthode de classe, on ajoute le namespace et la classe
        if (isset($caller['class'])) {
            return $caller['class'] . '::' . $name;
        }

        return $name;
    }

    /**
     * Récupère la configuration de l'attribut ImportantLog sur l'appelant, si présent.
     */
    #[\NoDiscard("lecture de la pile sans effet de bord : sans utiliser le nom retourné, l'appel est inutile et coûte un debug_backtrace()")]
    private function _getCallerImportantData(int $offset = 0): ?bool
    {
        $level = 2 + $offset;
        $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, $level + 1);

        if (!isset($trace[$level])) {
            return null;
        }

        $caller = $trace[$level];
        $function = $caller['function'] ?? null;
        $class = $caller['class'] ?? null;

        try {
            $reflection = null;
            if ($class !== null && method_exists($class, $function)) {
                $reflection = new \ReflectionMethod($class, $function);
            } elseif ($function !== null && function_exists($function)) {
                $reflection = new \ReflectionFunction($function);
            }

            if ($reflection !== null) {
                $attributes = $reflection->getAttributes(DistantAppLog::class);
                if (!empty($attributes)) {
                    /** @var DistantAppLog $instance */
                    $instance = $attributes[0]->newInstance();
                    return $instance->onlyDistantAppLog;
                }
            }
        } catch (\ReflectionException $th) {
            $this->captureError($th);
        }

        return null;
    }

    #[\NoDiscard("Le résultat doit conditionner le log et ne doit pas servir à générer des effets de bord")]
    public function isLogLevel(LogLevel $level): bool {
        $plugin = $this->_execHook('bnum.log.isLogLevel', ['result' => false, 'level' => $level]) ?? ['result' => false];

        return $plugin['result'] ?? false;
    }

    public function log(LogLevel $level, string $message, array $pluginsData = []): void {
        if (!$this->isLogLevel($level)) return;

        $offset = (int)$pluginsData['_bnum.log.offset'] ?? 0;

        // Récupération dynamique de l'attribut
        $onlyImportant = $this->_getCallerImportantData($offset);
        
        if ($onlyImportant !== null) {
            $pluginsData['_bnum.log.can_distant_app'] = true;
            $pluginsData['_bnum.log.only_distant_app'] = $onlyImportant;
        } else {
            $pluginsData['_bnum.log.can_distant_app'] = false;
            $pluginsData['_bnum.log.only_distant_app'] = false; // Valeur par défaut si pas d'attribut
        }

        $this->_execHook('bnum.log', ['level' => $level, 'message' => $message, 'data' => $pluginsData, 'caller' => $this->_getCallingMethod($offset)]);
    }

    public function logTrace(string $message, array $pluginsData = []): void {
        $this->_updateOffset($pluginsData);
        $this->log(LogLevel::Trace, $message, $pluginsData);
    }

    public function logDebug(string $message, array $pluginsData = []): void {
        $this->_updateOffset($pluginsData);
        $this->log(LogLevel::Debug, $message, $pluginsData);
    }

    public function logInfo(string $message, array $pluginsData = []): void {
        $this->_updateOffset($pluginsData);
        $this->log(LogLevel::Info, $message, $pluginsData);
    }

    public function logWarning(string $message, array $pluginsData = []): void {
        $this->_updateOffset($pluginsData);
        $this->log(LogLevel::Warn, $message, $pluginsData);
    }

    public function logError(string $message, array $pluginsData = []): void {
        $this->_updateOffset($pluginsData);
        $this->log(LogLevel::Error, $message, $pluginsData);
    }

    public function logFatal(string $message, array $pluginsData = []): void {
        $this->_updateOffset($pluginsData);
        $this->log(LogLevel::Fatal, $message, $pluginsData);
    }

    public function captureError(\Throwable $error, array $pluginsData = []): void {
        $this->_execHook('bnum.log.captureError', ['error' => $error, 'data' => $pluginsData]);
    }

    private static ?LogManager $_instance;
    public static function GetInstance(): LogManager {
        return (self::$_instance??=new LogManager());
    }
}
