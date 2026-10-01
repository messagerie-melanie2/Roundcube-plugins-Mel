<?php

require_once __DIR__.'/php/log_levels.php';
require_once __DIR__.'/php/attributes.php';

use MelLogs\LogLevel;

/**
 * Plugin Mel_logs
 *
 * plugin mel_logs pour roundcube
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
class mel_logs extends rcube_plugin
{

	#[\Deprecated('Utilisez LogLevel::Debug à la place')]
	const DEBUG = LogLevel::Debug->value;
	#[\Deprecated('Utilisez LogLevel::Info à la place')]
	const INFO = LogLevel::Info->value;
	#[\Deprecated('Utilisez LogLevel::Error à la place')]
	const ERROR = LogLevel::Error->value;
	#[\Deprecated('Utilisez LogLevel::Warn à la place')]
	const WARN = LogLevel::Warn->value;
	#[\Deprecated('Utilisez LogLevel::Trace à la place')]
	const TRACE = LogLevel::Trace->value;
	#[\Deprecated('Utilisez LogLevel::Access à la place')]
	const ACCESS = LogLevel::Access->value;

	/** Hook appelé pour transmettre un log aux autres systèmes de logs */
	const EXTRA_LOG_HOOK = 'log.call';

	/** Méthodes de mel_logs à sauter dans la pile pour trouver l'appelant réel */
	private const LOG_ENTRY_POINTS = ['_resolve_extra_log', 'log', 'l'];

	/**
	 * Cache de l'attribut ExtraLog par "Classe::methode" (null = attribut absent)
	 * @var array<string, ?bool>
	 */
	private static array $extra_log_cache = [];

	/**
	 * Fichier de log
	 * @var string
	 */
	private $log_file;

	/**
	 * Tableau contenant les différents niveaux de logs acceptés
	 * @var LogLevel[]
	 */
	private array $log_level;

	/**
	 * Instance courante de la classe
	 * @var mel_logs
	 */
	private static $instance;

	/**
	 * Photographie de la session prise juste avant sa destruction
	 * kill_session() vide $_SESSION avant l'appel du hook logout_after,
	 * les informations de la session ne sont donc plus lisibles à ce moment là
	 * @var array
	 */
	private static $session_context = [];

    /**
     * @var string
     */
	public $task = '.*';

	/**
	 * Liste des erreurs possibles dans la page de login
	 */
	private static array $login_errors = [
		rcmail::ERROR_STORAGE          => 'Erreur de connexion au serveur de stockage.',
		rcmail::ERROR_COOKIES_DISABLED => 'Votre navigateur n\'accepte pas les fichiers témoins.',
		rcmail::ERROR_INVALID_REQUEST  => 'Requête invalide ! Aucune donnée n\'a été enregistrée.',
		rcmail::ERROR_INVALID_HOST     => 'Nom du serveur invalide.',
		rcmail::ERROR_RATE_LIMIT       => 'Trop de tentatives de connexion infructueuses. Ressayez ultérieurement.',
		49 => 'Mauvais identifiant ou mot de passe',
		491 => 'Accès internet non activé pour ce compte',
		492 => 'Double authentification obligatoire',
		493 => 'Utilisateur externe sans espace de travail',
	];

	/**
	 * Constructeur du plugin
	 * Appel le constructeur parent (rcube_plugin)
	 * @param rcube_plugin_api $api Plugin API
	 */
	function __construct($api) {
	    parent::__construct($api);
	    // Chargement de la conf
	    $this->load_config();
	    $this->log_file = rcmail::get_instance()->config->get('log_file');
	    $this->log_level = explode('|', rcmail::get_instance()->config->get('mel_logs_level')) |> $this->to_log_levels(...);
	}

	/**
	 * Convertit les niveaux lus en configuration en LogLevel.
	 *
	 * Les valeurs vides ou inconnues sont ignorées : une erreur de saisie dans
	 * `mel_logs_level` ne doit pas empêcher le webmail de démarrer.
	 *
	 * @param string[] $logs Niveaux issus de `mel_logs_level`
	 *
	 * @return LogLevel[]
	 */
	private function to_log_levels(array $logs): array {
		return array_values(array_filter(array_map(
			fn(string $v): ?LogLevel => LogLevel::tryFrom(strtoupper(trim($v))),
			$logs
		)));
	}

	/**
	 * Convertit un niveau de log textuel en LogLevel.
	 *
	 * @param string $level Niveau (insensible à la casse)
	 *
	 * @return LogLevel
	 *
	 * @throws Exception Si le niveau n'existe pas
	 */
	private function map_log_level(string $level): LogLevel {
		$new = $level |> strtoupper(...) |> LogLevel::tryFrom(...);

		if (!$new) throw new Exception("Le niveau de log '$level' n'existe pas !");

		return $new;
	}

	/**
	 * Initialisation du plugin
	 * @see rcube_plugin::init()
	 */
	function init()
	{
		$this->add_hook('login_after', array($this, 'login_after'));
		$this->add_hook('login_failed', array($this, 'login_failed'));
		$this->add_hook('message_sent', array($this, 'message_sent'));
		$this->add_hook('session_destroy', array($this, 'session_destroy'));
		$this->add_hook('logout_after', array($this, 'logout_after'));

		$this->logOnInit();

		// Log "apache-like" a la fin pour avoir la taille du buffer
		rcmail::get_instance()->add_shutdown_function([$this, 'log_apache_style']);
	}
	/**
	 * Récupération de l'instance
	 * @return mel_logs
	 */
	#[\NoDiscard("Ne pas utiliser le résultat est un non-sens")]
	public static function get_instance() {
	    if (!isset(self::$instance))
	        self::$instance = new self(rcmail::get_instance()->plugins);

	    return self::$instance;
	}

	/**
	 * get_instance short
	 *
	 * @return mel_logs
	 */
	#[\NoDiscard("Ne pas utiliser le résultat est un non-sens")]
	public static function gi() {
		return self::get_instance();
	}

	/**
	 * Test si l'instance de mel_log permet de logger a ce niveau
	 */
	#[\NoDiscard("lecture sans effet de bord : sans utiliser le résultat, l'appel est inutile")]
	public static function is(string|LogLevel $level): bool {
      return self::get_instance()->is_level($level);
	}

	/**
	 * Test si le niveau de log est le bon
	 */
    #[\NoDiscard("lecture sans effet de bord : sans utiliser le résultat, l'appel est inutile")]
	public function is_level(string|LogLevel $logLevel): bool {
		$level = is_string($logLevel) ? $this->map_log_level($logLevel) : $logLevel;
		$rcmail = rcmail::get_instance();

		// Est-ce qu'on est sur un utilisateur en debug ?
		if (in_array($level, [LogLevel::Debug, LogLevel::Error, LogLevel::Info])
				&& in_array($rcmail->get_user_name(), $rcmail->config->get('mel_logs_debug_users', []))) {
			return true;
		}

		// Est-ce qu'on est sur un utilisateur en trace ?
		if (in_array($level, [LogLevel::Trace, LogLevel::Debug, LogLevel::Error, LogLevel::Info])
				&& in_array($rcmail->get_user_name(), $rcmail->config->get('mel_logs_trace_users', []))) {
			return true;
		}

	    return in_array($level, $this->log_level);
	}

	/**
	 * After login user
	 */
	public function login_after($args)
	{
		$method = isset($_SESSION['auth_type']) ? $_SESSION['auth_type'] : "password";
		$eidas = $_SESSION['eidas'];
	    $this->log(self::INFO, "[login] Connexion réussie de l'utilisateur <".rcmail::get_instance()->get_user_name()."> (".$method.") - $eidas");

		// MANTIS 0007937: Logguer les connexions d'une BALP en directe
		if (!driver_mel::gi()->getUser()->is_individuelle && !driver_mel::gi()->getUser()->is_applicative) {
			$this->log(self::INFO, "[login] Connexion directe BALP <".rcmail::get_instance()->get_user_name()."> [" . driver_mel::gi()->getUser()->type . "]");
		}

		// Détail du contexte de connexion (réseau, niveau d'authentification, client, ...)
		$this->log_login_details();

	    return $args;
	}

	/**
	 * Trace détaillée du contexte de la connexion
	 * Complète la ligne "[login] Connexion réussie" sans la modifier
	 */
	private function log_login_details()
	{
		$rc = rcmail::get_instance();

		$eidas = isset($_SESSION['eidas']) ? $_SESSION['eidas'] : '';
		$interne = $this->_is_internal();
		$auth_forte = $interne || in_array($eidas, ['eidas2', 'eidas3']);

		$details = [
			'reseau'      => $interne ? 'intranet' : 'internet',
			'auth'        => isset($_SESSION['auth_type']) ? $_SESSION['auth_type'] : 'password',
			'eidas'       => $eidas !== '' ? $eidas : 'aucun',
			'auth_forte'  => $auth_forte ? 'oui' : 'non',
			'2fa'         => $this->_login_2fa_state($auth_forte),
			'cookie_2fa'  => isset($_COOKIE['roundcube_doubleauth']) ? 'oui' : 'non',
		];

		$message = "[login] Détail connexion <".$rc->get_user_name().">";
		foreach ($details as $key => $value) {
			$message .= " | $key=$value";
		}
		$message .= ' | ua="'.(isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '-').'"';

		$this->log(self::INFO, $message);
	}
	/**
	 * Login failed
	 */
	public function login_failed($args)
	{
		$message = '';
		// Gérer les messages d'erreurs
		if (isset(self::$login_errors[$args['code']])) {
			$message = ' (' . self::$login_errors[$args['code']] . ')';
		}
		$this->log(self::INFO, "[login] Echec de connexion pour l'utilisateur <".$args['user']."> Code erreur : ".$args['code'].$message);
		return $args;
	}
	/**
	 * Hook session_destroy
	 * Appelé par kill_session() alors que la session est encore lisible
	 * On en profite pour photographier la session, et pour tracer les fins de
	 * session qui ne passeront pas par le hook logout_after (session expirée,
	 * ré-authentification forcée par un plugin, ...)
	 */
	public function session_destroy($args)
	{
		$rc = rcmail::get_instance();

		// Purge de session sur la page de login (nouvelle authentification) : aucune
		// session utilisateur ne se termine ici, il ne faut ni photographier ni tracer
		// sous peine de polluer les lignes de log de la connexion qui suit
		if (empty($_SESSION['user_id']) || $rc->task === 'login') {
			return $args;
		}

		self::$session_context = [
			'user'       => $rc->get_user_name() ?: (isset($_SESSION['username']) ? $_SESSION['username'] : ''),
			'login_time' => isset($_SESSION['login_time']) ? $_SESSION['login_time'] : null,
			'host'       => isset($_SESSION['storage_host']) ? $_SESSION['storage_host'] : '-',
			'eidas'      => isset($_SESSION['eidas']) ? $_SESSION['eidas'] : '',
			'auth_type'  => isset($_SESSION['auth_type']) ? $_SESSION['auth_type'] : 'password',
			'doubleauth' => isset($_SESSION['mel_doubleauth_2FA_login']),
			'session'    => $this->_short_session_id(),
		];

		// Sur la tâche logout le hook logout_after prend le relais juste après,
		// ailleurs c'est une fin de session subie (expiration, ré-authentification
		// forcée par un plugin, ...) qui ne sera tracée que d'ici
		if ($rc->task !== 'logout') {
			$this->log(self::INFO, $this->_logout_message($rc->task, $rc->action));
		}

		return $args;
	}

	/**
	 * Hook logout_after
	 * Déconnexion explicite demandée par l'utilisateur
	 */
	public function logout_after($args)
	{
		if (!empty($args['user'])) {
			self::$session_context['user'] = $args['user'];
		}
		if (!empty($args['host'])) {
			self::$session_context['host'] = $args['host'];
		}

		$this->log(self::INFO, $this->_logout_message('explicite'));

		return $args;
	}

	/**
	 * Construit la ligne de log de déconnexion à partir de la photographie de session
	 *
	 * @param string $task tâche en cours (fin de session uniquement)
	 * @param string $action action en cours (fin de session uniquement)
	 *
	 * @return string
	 */
	private function _logout_message($task = null, $action = null)
	{
		$ctx = self::$session_context;

		$user = isset($ctx['user']) ? $ctx['user'] : '';
		$login_time = isset($ctx['login_time']) ? $ctx['login_time'] : null;

		$details = [
			'duree'  => $login_time ? $this->_format_duration(time() - intval($login_time)) : 'inconnue',
			'reseau' => $this->_is_internal() ? 'intranet' : 'internet',
			'auth'   => isset($ctx['auth_type']) ? $ctx['auth_type'] : 'password',
			'eidas'  => !empty($ctx['eidas']) ? $ctx['eidas'] : 'aucun',
			'2fa'    => !empty($ctx['doubleauth']) ? 'validee' : 'non',
			'host'   => isset($ctx['host']) ? $ctx['host'] : '-',
		];

		$message = "[logout] Déconnexion de l'utilisateur <$user>";
		foreach ($details as $key => $value) {
			$message .= " | $key=$value";
		}

		return $message;
	}

	/**
	 * Triggered when a message is finally sent
	 * This hook doesn't have any return values but can be used for logging or notifications.
	 */
	public function message_sent($args)
	{
		$from = $args['headers']['From'];
		$mailto = $args['headers']['To'];
		$mailcc = $args['headers']['Cc'];
		$mailbcc = $args['headers']['Bcc'];
		$msgid = $args['headers']['Message-ID'];
		$this->log(self::INFO, "[message_sent] <$from> to '$mailto' cc '$mailcc' bcc '$mailbcc' msgid '$msgid'");
	}

	/**
	 * Appel la methode de log de roundcube
	 * Log dans un fichier mel
	 *
	 * Si l'appelant porte l'attribut {@see \MelLogs\ExtraLog} (ou si `$data['log.extra.only']`
	 * est fourni) et qu'au moins un plugin écoute le hook `log.call`, le log est aussi
	 * transmis aux autres systèmes de logs. Avec `onlyExtraLog = true`, rien n'est écrit
	 * localement (fichier général et fichiers par utilisateur).
	 *
	 * @param string|LogLevel $logLevel Niveau de log
	 * @param string $message Message à journaliser
	 * @param array{'log.extra.only'?: bool, 'log.offset'?: int, context?: array, attributes?: array} $data
	 *        Données transmises aux plugins écoutant `log.call`. `log.offset` permet de sauter
	 *        des frames supplémentaires si l'appel est encapsulé dans un wrapper.
	 */
	public function log(string|LogLevel $logLevel, string $message, array $data = []): void
	{
		$level = is_string($logLevel) ? $this->map_log_level($logLevel) : $logLevel;
		// Fichier de log général
		if (in_array($level, $this->log_level, true)) {
			$extra = $this->_resolve_extra_log($data);

			if ($extra !== null) {
				$this->_execHook(self::EXTRA_LOG_HOOK, ['level' => $level, 'message' => $message, 'data' => $data, 'caller' => $extra['caller']]);

				// On ne veut que les logs des autres plugins
				if ($extra['only']) return;
			}

			$this->write_log($this->log_file, $level->value, $message);
		}

		// Fichier de log spécifique
		$rcmail = rcmail::get_instance();
		$username = $this->_current_username();
		if (in_array($level, [LogLevel::Trace, LogLevel::Debug, LogLevel::Error, LogLevel::Info], true)
				&& in_array($username, $rcmail->config->get('mel_logs_trace_users', []))) {
			$this->write_log($username, $level->value, $message);
		}
		else if (in_array($level, [LogLevel::Debug, LogLevel::Error, LogLevel::Info], true)
				&& in_array($username, $rcmail->config->get('mel_logs_debug_users', []))) {
			$this->write_log($username, $level->value, $message);
		}
	}

	/**
	 * Exécute un hook Roundcube.
	 *
	 * @param string $key Nom du hook
	 * @param array<string, mixed> $args Arguments du hook
	 *
	 * @return array<string, mixed> Arguments retournés par les handlers
	 */
	private function _execHook(string $key, array $args): array {
		return rcmail::get_instance()->plugins->exec_hook($key, $args);
	}

	/**
	 * Détermine si le log courant doit être transmis aux autres systèmes de logs.
	 *
	 * Ordre volontaire, du moins coûteux au plus coûteux :
	 * 1. aucun plugin n'écoute `log.call` : on sort sans backtrace ni réflexion ;
	 * 2. un seul `debug_backtrace()` sert à la fois au nom de l'appelant et à la lecture de l'attribut ;
	 * 3. la lecture de l'attribut par réflexion est mise en cache par méthode pour la requête.
	 *
	 * Les frames des points d'entrée de mel_logs (`log`, `l`) sont sautées, ce qui rend
	 * le résultat identique que l'on passe par `log()` ou par `l()`.
	 * Limite : l'attribut ne peut pas être lu sur une closure.
	 *
	 * @param array<string, mixed> $data Données passées à {@see log()}
	 *
	 * @return array{only: bool, caller: string}|null `null` si le log ne doit pas être transmis
	 */
	#[\NoDiscard("résolution sans effet de bord : sans utiliser le résultat, l'appel est inutile et coûte un debug_backtrace()")]
	private function _resolve_extra_log(array $data): ?array
	{
		if (empty(rcmail::get_instance()->plugins->handlers[self::EXTRA_LOG_HOOK])) return null;

		$offset = max(0, (int)($data['log.offset'] ?? 0));
		$trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5 + $offset);

		// On saute _resolve_extra_log puis les points d'entrée de mel_logs (log, l)
		$index = 0;
		while (isset($trace[$index])
				&& ($trace[$index]['class'] ?? null) === self::class
				&& in_array($trace[$index]['function'], self::LOG_ENTRY_POINTS, true)) {
			++$index;
		}
		$index += $offset;

		$class = $trace[$index]['class'] ?? null;
		$function = $trace[$index]['function'] ?? null;

		$only = isset($data['log.extra.only']) ? (bool)$data['log.extra.only'] : self::_get_extra_log_attribute($class, $function);
		if ($only === null) return null;

		$caller = $function === null ? 'main' : ($class === null ? $function : "$class::$function");

		return ['only' => $only, 'caller' => $caller];
	}

	/**
	 * Lit l'attribut {@see \MelLogs\ExtraLog} d'une méthode ou d'une fonction, avec cache.
	 *
	 * Les attributs ne changent pas pendant l'exécution : la réflexion n'est faite
	 * qu'une fois par méthode et par requête.
	 *
	 * @param ?string $class Classe de l'appelant (`null` pour une fonction)
	 * @param ?string $function Méthode ou fonction de l'appelant
	 *
	 * @return ?bool Valeur de `onlyExtraLog`, ou `null` si l'attribut est absent
	 */
	#[\NoDiscard("lecture sans effet de bord : sans utiliser le résultat, l'appel est inutile")]
	private static function _get_extra_log_attribute(?string $class, ?string $function): ?bool
	{
		if ($function === null) return null;

		$key = $class === null ? $function : "$class::$function";
		if (array_key_exists($key, self::$extra_log_cache)) return self::$extra_log_cache[$key];

		$reflection = match (true) {
			$class !== null && method_exists($class, $function) => new \ReflectionMethod($class, $function),
			$class === null && function_exists($function) => new \ReflectionFunction($function),
			default => null,
		};

		$attributes = $reflection?->getAttributes(\MelLogs\ExtraLog::class) ?? [];

		return self::$extra_log_cache[$key] = empty($attributes) ? null : $attributes[0]->newInstance()->onlyExtraLog;
	}

	/**
	 * Écriture des logs
	 * 
	 * @param string $log_file nom du fichier
	 * @param string $level voir mel_log::
	 * @param string $message
	 */
	protected function write_log($log_file, $level, $message) 
	{
		$ip = $this->_get_address_ip();
		$procid = getmypid();
		$username = $this->_current_username();
		$provenance = rcmail::get_instance()->config->get('provenance');
		$courrielleur = isset($_GET['_courrielleur']) ? " {Courrielleur}" : " {Web}";
		$doubleauth = $this->_is_doubleauth() ? " [doubleauth]" : "";
		rcmail::get_instance()->write_log($log_file, "[$level] $ip ($provenance)$doubleauth PROC[$procid]$courrielleur $username - $message");
	}

	/**
	 * Short version of log function
	 * 
	 * Appel la methode de log de roundcube
	 * Log dans un fichier mel
	 * @param string $level voir mel_log::
	 * @param string $message
	 * 
	 */
	public function l(string|LogLevel $level, string $message, array $data = []): void {
		$this->log($level, $message, $data);
	}

	public function captureError(\Throwable $th, $writeLogs = false): void {
		$this->_execHook('log.capture_error', ['error' => $th]);

		if ($writeLogs) $this->l(LogLevel::Error, $th->getMessage());
	}

	public static function capture(\Throwable $th, $writeLogs = false): void {
		self::gi()->captureError($th, $writeLogs);
	}

	/******** PRIVATE **********/
	/**
	 * Retourne l'utilisateur courant
	 * Après kill_session() l'utilisateur n'est plus connu de rcmail, on se rabat
	 * alors sur la photographie prise dans le hook session_destroy
	 * @return string
	 * @private
	 */
	private function _current_username()
	{
		$username = rcmail::get_instance()->get_user_name();

		if (empty($username) && !empty(self::$session_context['user'])) {
			$username = self::$session_context['user'];
		}

		return $username;
	}

	/**
	 * La session courante a-t-elle valide la double authentification ?
	 * Après kill_session() l'information n'est plus dans $_SESSION, on se rabat
	 * sur la photographie prise dans le hook session_destroy
	 * @return boolean
	 * @private
	 */
	private function _is_doubleauth()
	{
		if (isset($_SESSION['mel_doubleauth_2FA_login'])) {
			return true;
		}

		return empty(rcmail::get_instance()->get_user_name()) && !empty(self::$session_context['doubleauth']);
	}

	/**
	 * Connexion depuis le réseau interne ?
	 * Copie locale du test de mel::is_internal() : mel_logs est chargé très tôt
	 * et ne doit pas dépendre du plugin mel
	 * @return boolean
	 * @private
	 */
	private function _is_internal()
	{
		if (isset($_GET['internet'])) {
			return false;
		}

		return (bool) rcmail::get_instance()->config->get('is_internal', false);
	}

	/**
	 * État de la double authentification au moment de la connexion
	 * @param boolean $auth_forte
	 * @return string
	 * @private
	 */
	private function _login_2fa_state($auth_forte)
	{
		if (isset($_SESSION['mel_doubleauth_2FA_login'])) {
			return 'validee';
		}

		return $auth_forte ? 'non_requise' : 'en_attente';
	}

	/**
	 * Identifiant court de session, permet de corréler les lignes de log
	 * @return string
	 * @private
	 */
	private function _short_session_id()
	{
		$id = session_id();

		return empty($id) ? '-' : substr($id, 0, 8);
	}

	/**
	 * Formatte une durée en secondes
	 * @param int $seconds
	 * @return string
	 * @private
	 */
	private function _format_duration($seconds)
	{
		if ($seconds < 0) {
			return 'inconnue';
		}

		$hours = intdiv($seconds, 3600);
		$minutes = intdiv($seconds % 3600, 60);
		$seconds = $seconds % 60;

		if ($hours) {
			return sprintf('%dh%02dm%02ds', $hours, $minutes, $seconds);
		}
		if ($minutes) {
			return sprintf('%dm%02ds', $minutes, $seconds);
		}

		return $seconds . 's';
	}

	/**
	 * Retourne l'adresse ip
	 * @return string
	 * @private
	 */
	private function _get_address_ip() {
		if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
			$ip = $_SERVER['HTTP_CLIENT_IP'];
			$ip = "[".$_SERVER['REMOTE_ADDR']."]/[$ip]";
		} elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
			$ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
			$ip = "[".$_SERVER['REMOTE_ADDR']."]/[$ip]";
		} else {
			$ip = $_SERVER['REMOTE_ADDR'];
			$ip = "[$ip]/[".$_SERVER['REMOTE_ADDR']."]";
		}
		return $ip;
	}

	/**
	 * Ajouter une ligne de log au format "apache access"
	 * 
	 * @return void
	 * @private
	 */
	public function log_apache_style(): void {
		$method = $_SERVER['REQUEST_METHOD'] ?? '-';
		$uri    = $this->_sanitize_for_log($_SERVER['REQUEST_URI'] ?? '-');
		$proto  = $_SERVER['SERVER_PROTOCOL'] ?? '-';
		$status = http_response_code() ?: 200;
		$ref    = $this->_sanitize_for_log($_SERVER['HTTP_REFERER'] ?? '-');
		$ua     = $this->_sanitize_for_log($_SERVER['HTTP_USER_AGENT'] ?? '-');
		$body_size = $this->_get_total_output_size(); // taille du buffer courant, avant flush final
	
		$line = sprintf(
			'"%s %s %s" %d %d - "%s" "%s"',
			$method, $uri, $proto, $status, $body_size, $ref, $ua
		);

		// Libérer le client maintenant : il reçoit sa réponse et se déconnecte,
        //    le process PHP continue de tourner en tâche de fond pour finir le log
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        }
	
		$this->log(self::ACCESS, $line);
	}

	/**
	 * Sanitize a string for logging by replacing newlines and carriage returns
	 * 
	 * @param string $value The string to sanitize
	 * @return string The sanitized string
	 * @private
	 */
	private function _sanitize_for_log(string $value): string {
		return str_replace(["\r", "\n"], ['\\r', '\\n'], $value);
	}

	/**
	 * Get the total output size of all output buffers
	 * 
	 * @return int The total output size in bytes
	 * @private
	 */
	private function _get_total_output_size(): int
    {
        $total = 0;
        for ($i = 0, $level = ob_get_level(); $i < $level; $i++) {
            $total += ob_get_length() ?: 0;
        }
        return $total;
    }

	/**
	 * Enregistre un log lors de l'ouverture du bnum
	 * Permet de comptabiliser les connexions journalières.
	 */
	private function logOnInit()
	{
		$rc = rcmail::get_instance();

		if ($rc->task === 'bnum' && $rc->action === '') {
			$today = date('Y-m-d');

			if (!isset($_SESSION['bnum_opened_today']) || $_SESSION['bnum_opened_today'] !== $today) {
				$this->log(self::INFO, "[activity] Ouverture du bnum");
				$_SESSION['bnum_opened_today'] = $today;
			}
		}
	}

	/**
	 * Retourne le nom de l'énumération des niveaux de log.
	 *
	 * @return class-string<LogLevel>
	 */
	public static function LogLevel(): string {
		return LogLevel::class;
	}
}
