<?php
/**
 * Fichier de téléchargement des pièces jointes dans horde vfs
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

// Developpement ?
define('DEV', false);

// Configuration du nom de l'application pour l'ORM
if (!defined('CONFIGURATION_APP_LIBM2')) {
  define('CONFIGURATION_APP_LIBM2', 'roundcube');
}

if (DEV) {
  $dir = str_replace('/services/download', '', dirname($_SERVER['SCRIPT_FILENAME']));
}
else {
  $dir = __DIR__.'/../..';
}

// Inclusion de l'ORM
@include_once 'includes/libm2.php';
// Inclusion des vendors (pour l'ORM)
require_once $dir.'/bnum/vendor/autoload.php';

if (!is_internal()) {
  header('HTTP/1.0 403 Forbidden');
  write_log("[ERROR] /services/download/index.php Not internal, forbidden");
  echo 'You are forbidden!';
}
else {
  // Positionner le path de la sesion
  // session_save_path(SESSION_PATH);

  // Démarrage de session
  session_start();

  // Test si l'utilisateur en session est valide
  if (isset($_SESSION["user_uid"]) && !empty($_SESSION["user_uid"])) {
    $username = $_SESSION["user_uid"];
    // Récupération des paramètres
    $vfsKey = rcube_utils::get_input_value("vfsKey", rcube_utils::INPUT_GET);
    $module = rcube_utils::get_input_value("module", rcube_utils::INPUT_GET);
    $file = rcube_utils::get_input_value("file", rcube_utils::INPUT_GET);
    $fn = rcube_utils::get_input_value("fn", rcube_utils::INPUT_GET);
    $actionID = rcube_utils::get_input_value("actionID", rcube_utils::INPUT_GET);
    $type = rcube_utils::get_input_value("type", rcube_utils::INPUT_GET);
    // Test si les paramètres sont correctement positionnés
    if (isset($vfsKey)
        && isset($module)
        && isset($file)
        && isset($fn)
        && isset($actionID)) {
      // On ne gère que le calendrier pour l'instant
      if ($module == "kronolith") {
        // On ne gère que l'action download file
        if ($actionID == "download_file") {
          list($res, $message, $attachment) = getAttachment($username, $vfsKey, $file);
          if (!$res) {
            // Erreur d'action
            header('HTTP/1.0 404 Not found');
            write_log("[ERROR] GetAttachment error for '$username' : '$message'");
            echo $message;
          }
          else {
            if (isset($type)
                && !empty($type)) {
              header("Content-Type: application/$type");
            }
            else {
              header("Content-Type: application/octet-steam");
            }
            header('Content-Disposition: attachment; filename="'.$file.'"');
            write_log("[ERROR] Attachment '$file' downloaded for '$username'");
            echo $attachment->data;
          }
        }
        else {
          // Erreur d'action
          header('HTTP/1.0 404 Not found');
          write_log("[ERROR] Bad action '$actionID' for '$username'");
          echo 'Bad action';
        }
      }
      else {
        // Erreur de module
        header('HTTP/1.0 404 Not found');
        write_log("[ERROR] Bad module '$module' for '$username'");
        echo 'Bad module';
      }
    }
    else {
      // Erreur de paramètre
      header('HTTP/1.0 404 Not found');
      write_log("[ERROR] Bad parameters for '$username'");
      echo 'Bad parameters';
    }
  }
  else {
    header('HTTP/1.0 403 Forbidden');
    write_log("[ERROR] User is forbidden");
    echo 'You are forbidden!';
  }
}

/**
 * Fonction pour la récupération d'une pièce jointe via l'ORM
 * Valide dans un premier temps que l'utilisateur a bien les droits sur la pièce jointe
 * @param string $username
 * @param string $vfsKey
 * @param string $file
 *
 * @return [boolean, string, \LibMelanie\Api\Mel\Attachment]
 */
function getAttachment($username, $vfsKey, $file) {
  // Récupération de la pièce jointe
  $attachment = new \LibMelanie\Api\Mel\Attachment();
  $attachment->path = $vfsKey;
  $attachment->name = $file;
  $attachment->type = \LibMelanie\Api\Mel\Attachment::TYPE_BINARY;
  $attachment->isfolder = false;
  // Est-ce que la pièce jointe est trouvée
  if (!$attachment->load()) {
    // Return error, message, object
    return [false, "Attachment '$file' does not exist!", null];
  }
  // La pièce joint a correctement été récupérée
  return [true, "Ok", $attachment];
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

/**
 * Utility class providing common functions
 *
 * @package    Framework
 * @subpackage Utils
 */
class rcube_utils
{
    // define constants for input reading
    const INPUT_GET    = 1;
    const INPUT_POST   = 2;
    const INPUT_COOKIE = 4;
    const INPUT_GP     = 3; // GET + POST
    const INPUT_GPC    = 7; // GET + POST + COOKIE

    /**
     * Read input value and make sure it is a string.
     *
     * @param string $fname      Field name to read
     * @param int    $source     Source to get value from (see self::INPUT_*)
     * @param bool   $allow_html Allow HTML tags in field value
     * @param string $charset    Charset to convert into
     *
     * @return string Request parameter value
     * @see self::get_input_value()
     */
    public static function get_input_string($fname, $source, $allow_html = false, $charset = null)
    {
        $value = self::get_input_value($fname, $source, $allow_html, $charset);

        return is_string($value) ? $value : '';
    }

    /**
     * Read request parameter value and convert it for internal use
     * Performs stripslashes() and charset conversion if necessary
     *
     * @param string $fname      Field name to read
     * @param int    $source     Source to get value from (see self::INPUT_*)
     * @param bool   $allow_html Allow HTML tags in field value
     * @param string $charset    Charset to convert into
     *
     * @return string|array|null Request parameter value or NULL if not set
     */
    public static function get_input_value($fname, $source, $allow_html = false, $charset = null)
    {
        $value = null;

        if (($source & self::INPUT_GET) && isset($_GET[$fname])) {
            $value = $_GET[$fname];
        }

        if (($source & self::INPUT_POST) && isset($_POST[$fname])) {
            $value = $_POST[$fname];
        }

        if (($source & self::INPUT_COOKIE) && isset($_COOKIE[$fname])) {
            $value = $_COOKIE[$fname];
        }

        return self::parse_input_value($value, $allow_html, $charset);
    }

    /**
     * Parse/validate input value. See self::get_input_value()
     * Performs stripslashes() and charset conversion if necessary
     *
     * @param string $value      Input value
     * @param bool   $allow_html Allow HTML tags in field value
     * @param string $charset    Charset to convert into
     *
     * @return string Parsed value
     */
    public static function parse_input_value($value, $allow_html = false, $charset = null)
    {
        if (empty($value)) {
            return $value;
        }

        if (is_array($value)) {
            foreach ($value as $idx => $val) {
                $value[$idx] = self::parse_input_value($val, $allow_html, $charset);
            }

            return $value;
        }

        // remove HTML tags if not allowed
        if (!$allow_html) {
            $value = strip_tags($value);
        }

        return $value;
    }
}
