<?php
/**
 * Fichier de login pour remplacer le login Horde
 * Permet la récupération des pièces jointes depuis le Courrielleur
 *
 * @version @package_version@
 *
 * @author PNE Annuaire et Messagerie/MEDDE
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
// Configuration des logs
define('LOG_PATH', '/var/log/roundcube');
define('LOG_FILE', 'attachment.log');
define('SESSION_PATH', '/m2/sessions');

// Configuration du nom de l'application pour l'ORM
if (!defined('CONFIGURATION_APP_LIBM2')) {
  define('CONFIGURATION_APP_LIBM2', 'roundcube');
}
// Inclusion de l'ORM
@include_once 'includes/libm2.php';
// Inclusion de rcube_utils
require_once 'program/lib/Roundcube/rcube_utils.php';
// Inclusion des vendors (pour l'ORM)
require_once 'vendor/autoload.php';

if (!is_internal()) {
  header('HTTP/1.0 403 Forbidden');
  write_log("[ERROR] login.php Not internal, forbidden");
  echo 'You are forbidden!';
}
else {
  // Récupération des paramètres
  $username = rcube_utils::get_input_value("horde_user", rcube_utils::INPUT_GPC);
  $password = rcube_utils::get_input_value("horde_pass", rcube_utils::INPUT_GPC);

  // Positionner le path de la sesion
  session_save_path(SESSION_PATH);

  // Démarrage de session
  session_start();

  // Est-ce qu'une session en cours existe ?
  if (isset($_SESSION["user_uid"])) {
    write_log("[INFO] Session déjà en cours pour '$_SESSION[user_uid]'");
    echo "Session déjà en cours pour '$_SESSION[user_uid]'\r\n";
  }

  if (isset($username)
      && isset($password)
      && \LibMelanie\Ldap\Ldap::Authentification($username, $password)) {
    // Authentification OK
    // Positionne l'utilisateur en session
    $_SESSION["user_uid"] = $username;
    write_log("[INFO] Login success for '$username'");
    echo "Auth OK";
  }
  else {
    // Authentification NOK
    // Detruit la session
    unset($_SESSION["user_uid"]);
    write_log("[ERROR] Bad login or password for '$username'");
    session_destroy();
    echo "Auth KO";
  }
}

/**
 * Ecriture dans un fichier de log
 * @param unknown $message
 */
function write_log($message) {
  // Récupèration de l'adresse IP
  $addrip = get_address_ip();
  // Récupération du process ID
  $procid = getmypid();
  // Récupération de la date
  $time = @date('[d/M/Y:H:i:s]');
  // try to open specific log file for writing
  $logfile = LOG_PATH.'/'.LOG_FILE;

  if ($fp = @fopen($logfile, 'a')) {
    fwrite($fp, "$time $addrip [$procid] $message\r\n");
    fflush($fp);
    fclose($fp);
    return true;
  }
}

/**
 * Retourne l'adresse ip
 * @return string
 */
function get_address_ip() {
  if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
    $ip = $_SERVER['HTTP_CLIENT_IP'];
  } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
  } else {
    $ip = $_SERVER['REMOTE_ADDR'];
  }
  return $ip;
}

/**
 * Défini si on est dans une instance interne ou extene de l'application
 * Permet la selection de la bonne url
 */
function is_internal() {
  return (!isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) || strcasecmp($_SERVER["HTTP_X_MINEQPROVENANCE"], "intranet") === 0);
}
