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
	    return in_array($level, $this->log_level);
	}

	/**
	 * After login user
	 */
	public function login_after($args)
	{
	    $this->log(self::INFO, "[login] Connexion réussie de l'utilisateur <".rcmail::get_instance()->get_user_name().">");
	    return $args;
	}
	/**
	 * Login failed
	 */
	public function login_failed($args)
	{
		$this->log(self::INFO, "[login] Echec de connexion pour l'utilisateur <".$args['user']."> Code erreur : ".$args['code']);
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
	 * @param string $level voir mel_log::
	 * @param string $message
	 */
	public function log($level, $message)
	{
	    if (in_array($level, $this->log_level)) {
	        $ip = $this->_get_address_ip();
	        $procid = getmypid();
	        $username = rcmail::get_instance()->get_user_name();
	        $mineqprovenance = $_SERVER["HTTP_X_MINEQPROVENANCE"];
	        $courrielleur = isset($_GET['_courrielleur']) ? " {Courrielleur}" : " {Web}";
	        $doubleauth = isset($_SESSION['mel_doubleauth_2FA_login']) ? " [doubleauth]" : "";
	        rcmail::get_instance()->write_log($this->log_file, "[$level] $ip ($mineqprovenance)$doubleauth PROC[$procid]$courrielleur $username - $message");
	    }
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
