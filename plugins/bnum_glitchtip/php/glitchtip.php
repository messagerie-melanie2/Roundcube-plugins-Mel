<?php
declare(strict_types=1);

use Sentry\SentrySdk;
use Sentry\Tracing\Transaction;
use Sentry\Tracing\TransactionContext;

/**
 * Singleton gérant l'intégration Sentry/GlitchTip du plugin.
 *
 * Centralise l'initialisation du SDK Sentry, la gestion d'une transaction par
 * requête et l'envoi des logs applicatifs, en respectant le niveau de log
 * configuré.
 */
final class Glitchtip
{
    static private ?Glitchtip $instance = null;

    /**
     * Retourne l'instance unique de {@see Glitchtip} (création à la volée si nécessaire).
     *
     * @return Glitchtip L'instance du singleton.
     */
    static public function Instance(): Glitchtip {
        if (!isset(self::$instance)) self::$instance = new Glitchtip();
        return self::$instance;
    }

    private const LEVELS = ['trace' => 0, 'debug' => 1, 'info' => 2, 'warn' => 3, 'error' => 4, 'fatal' => 5];

    private bool $initialized = false;
    private bool $logsEnabled = false;
    private int $logLevel = self::LEVELS['error'];
    private ?Transaction $transaction = null;
    private string $env = 'unknown';

    private function __construct()
    {

    }

    /**
     * Initialise le SDK Sentry pour la requête courante.
     *
     * N'a d'effet que lors du premier appel (les appels suivants sont ignorés
     * tant que le singleton n'a pas été réinitialisé).
     *
     * @param string $dsn DSN Sentry/GlitchTip à utiliser.
     * @param array $options Options d'initialisation : `enable_logs` (bool), `log_level` (string),
     *                        `environment` (string), `traces_sample_rate` (float).
     * @return void
     */
    public function init(string $dsn, array $options = []): void {
        if ($this->initialized) return;

        $this->logsEnabled = (bool) ($options['enable_logs'] ?? false);
        $this->logLevel = self::LEVELS[$options['log_level'] ?? 'error'] ?? self::LEVELS['error'];
        $this->env = $options['environment'];

        $error_types = $options['error_types'] ?? null;

        if ($error_types !== null) $error_types = (int) $error_types;
        
        \Sentry\init([
            'dsn' => $dsn,
            'environment' => $options['environment'] ?? 'dev',
            'enable_logs' => $this->logsEnabled,
            'traces_sample_rate' => (float) ($options['traces_sample_rate'] ?? 0.01),
            'error_types' => $error_types,
        ]);

        $this->initialized = true;
    }

    /**
     * Indique si le SDK Sentry a déjà été initialisé via {@see init()}.
     *
     * @return bool `true` si `init()` a déjà été appelé avec succès, `false` sinon.
     */
    public function isInitialized(): bool {
        return $this->initialized;
    }

    /**
     * Capture l'erreur fatale PHP courante (E_ERROR/E_PARSE) via error_get_last() et
     * force son envoi synchrone vers Glitchtip avant que le process ne se termine.
     *
     * Utilisée depuis le hook `fatal_error`, déclenché par le core juste avant l'exit()
     * de rcmail_fatal_error() — le flush différé habituel ({@see __destruct()}) n'aurait
     * pas le temps de s'exécuter dans ce contexte.
     *
     * @return void
     */
    public function captureFatalError(): void {
        if (!$this->initialized) return;

        \Sentry\captureLastError();

        $client = \Sentry\SentrySdk::getCurrentHub()->getClient();
        if ($client !== null) {
            $client->flush(5);
        }
    }

    /**
     * Démarre une transaction Sentry pour la requête courante, si aucune n'est déjà en cours.
     *
     * @param string $name Nom de la transaction.
     * @param string $op Type d'opération Sentry (ex: "http.server").
     * @return Transaction|null La transaction en cours (nouvellement créée ou déjà existante),
     *                          ou `null` si le SDK n'est pas initialisé.
     */
    public function startTransaction(string $name, string $op = 'http.server'): ?Transaction {
        if (!$this->initialized || isset($this->transaction)) return $this->transaction;

        $context = new TransactionContext();
        $context->setName($name);
        $context->setOp($op);

        $this->transaction = \Sentry\startTransaction($context);
        SentrySdk::getCurrentHub()->setSpan($this->transaction);

        return $this->transaction;
    }

    /**
     * Termine la transaction Sentry en cours, si une transaction a été démarrée.
     *
     * @return void
     */
    public function finishTransaction(): void {
        if (!isset($this->transaction)) return;

        $this->transaction->finish();
        $this->transaction = null;
    }

    /**
     * Envoie un message au logger Sentry, si les logs sont activés et si le
     * niveau du message atteint le seuil configuré.
     *
     * @param string $level Niveau du message ("trace", "debug", "info", "warn", "error" ou "fatal").
     * @param string $message Message à journaliser.
     * @param array $context Données de contexte associées au message.
     * @param array $attributes Attributs additionnels transmis à Sentry.
     * @return void
     */
    public function sentryLog(string $level, string $message, array $context = [], array $attributes = []): void {
        if (!$this->initialized || !$this->logsEnabled) return;
        if (!function_exists('Sentry\\logger')) return;

        $rank = self::LEVELS[$level] ?? null;
        if ($rank === null || $rank < $this->logLevel) return;

        \Sentry\logger()->$level($message, $context, $attributes);
    }

    /**
     * Journalise un message en préfixant automatiquement le nom de la fonction/méthode appelante
     * et en renseignant l'attribut `service.name` (basé sur l'environnement) si celui-ci est absent.
     *
     * @param string $level Niveau du message ("trace", "debug", "info", "warn", "error" ou "fatal").
     * @param string $message Message à journaliser.
     * @param int $offset Décalage de profondeur de pile pour la résolution de l'appelant
     *                     (voir {@see Constants::LOG_OFFSET} et {@see _get_calling_method()}).
     * @param array $context Données de contexte associées au message.
     * @param array $attributes Attributs additionnels transmis à Sentry.
     * @return void
     */
    public function log(string $level, string $message, int $offset = 1, array $context = [], array $attributes = []): void {
        $caller = $this->_get_calling_method($offset);

        if (!array_key_exists('service.name', $attributes)) {
            $attributes['service.name'] = $this->env;
        }

        $this->sentryLog($level, "[$caller] $message", $context, $attributes);
    }

    /**
     * Vérifie si un niveau de log donné est actif par rapport au seuil configuré.
     *
     * @param string $level Niveau à vérifier ("trace", "debug", "info", "warn", "error" ou "fatal").
     * @return bool `true` si ce niveau serait effectivement journalisé, `false` sinon
     *              (niveau inconnu ou en dessous du seuil configuré).
     */
    public function isLogLevel(string $level): bool {
        $rank = self::LEVELS[$level] ?? null;
        if ($rank === null || $rank < $this->logLevel) return false;

        return true;
    }


    /**
     * Force l'envoi immédiat des logs Sentry en attente.
     *
     * @return void
     */
    public function flush(): void {
        if (!$this->initialized) return;

        \Sentry\logger()->flush();
    }

    /**
     * Termine la transaction en cours et force l'envoi des logs en attente
     * à la destruction de l'instance.
     */
    public function __destruct() {
        $this->finishTransaction();
        $this->flush();
    }

    /**
     * Récupère le nom de la fonction ou de la méthode qui a appelé la fonction courante.
     * 
     * @param int $offset Augmentez cette valeur si vous encapsulez cet appel dans d'autres sous-fonctions.
     * @return string Le nom de l'appelant (ex: "MaClasse::maMethode" ou "maFonction" ou "main")
     */
    private function _get_calling_method(int $offset = 0): string 
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
}
