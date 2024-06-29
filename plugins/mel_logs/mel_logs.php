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

	    return $args;
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
		$username = $rcmail->get_user_name();
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
		$username = rcmail::get_instance()->get_user_name();
		$provenance = rcmail::get_instance()->config->get('provenance');
		$courrielleur = isset($_GET['_courrielleur']) ? " {Courrielleur}" : " {Web}";
		$doubleauth = isset($_SESSION['mel_doubleauth_2FA_login']) ? " [doubleauth]" : "";
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
}
