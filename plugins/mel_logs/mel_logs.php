<?php
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
	const DEBUG = 'DEBUG';
	const INFO = 'INFO';
	const ERROR = 'ERROR';
	const WARN = 'WARN';
	const TRACE = 'TRACE';

	/**
	 * Fichier de log
	 * @var string
	 */
	private $log_file;

	/**
	 * Tableau contenant les différents niveaux de logs acceptés
	 * @var array
	 */
	private $log_level;

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
	private static $login_errors = [
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
	    $this->log_level = explode('|', rcmail::get_instance()->config->get('mel_logs_level'));
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
	}
	/**
	 * Récupération de l'instance
	 * @return mel_logs
	 */
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
	public static function gi() {
		return self::get_instance();
	}

	/**
	 * Test si l'instance de mel_log permet de logger a ce niveau
	 * @param string $level voir mel_log::
	 * @return boolean
	 */
	public static function is($level) {
      return self::get_instance()->is_level($level);
	}

  /**
   * Test si le niveau de log est le bon
   * @param string $level
   * @return boolean
   */
	public function is_level($level) {
		$rcmail = rcmail::get_instance();

		// Est-ce qu'on est sur un utilisateur en debug ?
		if (in_array($level, [self::DEBUG, self::ERROR, self::INFO])
				&& in_array($rcmail->get_user_name(), $rcmail->config->get('mel_logs_debug_users', []))) {
			return true;
		}

		// Est-ce qu'on est sur un utilisateur en trace ?
		if (in_array($level, [self::TRACE, self::DEBUG, self::ERROR, self::INFO])
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
	 * @param string $level voir mel_log::
	 * @param string $message
	 */
	public function log($level, $message)
	{
		// Fichier de log général
	    if (in_array($level, $this->log_level)) {
			$this->write_log($this->log_file, $level, $message);
	    }

		// Fichier de log spécifique
		$rcmail = rcmail::get_instance();
		$username = $this->_current_username();
		if (in_array($level, [self::TRACE, self::DEBUG, self::ERROR, self::INFO])
				&& in_array($username, $rcmail->config->get('mel_logs_trace_users', []))) {
			$this->write_log($username, $level, $message);
		}
		else if (in_array($level, [self::DEBUG, self::ERROR, self::INFO])
				&& in_array($username, $rcmail->config->get('mel_logs_debug_users', []))) {
			$this->write_log($username, $level, $message);
		}
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
	public function l($level, $message) {
		return $this->log($level, $message);
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
}
