<?php
/**
 * Plugin Mél LDAP Auth
 * plugin mel_ldap_authpour roundcube
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
// Chargement de la librairie ORM
@include_once 'includes/libm2.php';
class mel_ldap_auth extends rcube_plugin {
  /**
   *
   * @var string
   */
  public $task = '.*';

  /**
   *
   * @var rcmail
   */
  private $rc;

  /**
   * Expiration du cookie : calcul pour 500 jours (60*60*24*500)
   */
  private static $expire_cookie = 51840000;

  /**
   * Initialisation du plugin
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $this->rc = rcmail::get_instance();

    // Définition des hooks
    $this->add_hook('authenticate', array(
        $this,
        'authenticate'
    ));

    // Charge la configuration
    $this->load_config();
  }

  /**
   * Find user credentials In LDAP.
   */
  public function authenticate($args) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::authenticate()");

    // MANTIS 3193: Mécanisme pour permettre l'authentification transparente depuis le Courrielleur
    if (!isset($args['user']) || strlen($args['user']) === 0) {
      $args['user'] = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_GPC));
    }
    if (!isset($args['pass']) || strlen($args['pass']) === 0) {
      $args['pass'] = rcube_utils::get_input_value('_pass', rcube_utils::INPUT_GPC, true, $this->rc->config->get('password_charset', 'ISO-8859-1'));
    }
    // get username and host
    $host = $args['host'];
    $user = $args['user'];
    $pass = $args['pass'];

    // Gérer une liste d'adresse IP non acceptées
    $banned_ip = (array)$this->rc->config->get('banned_ip_list', array());
    if (count($banned_ip) > 0 && in_array($this->_get_address_ip(), $banned_ip)) {
      $args['abort'] = true;
      $args['valid'] = false;
      $args['error'] = 503;
      return $args;
    }

    // Pour le courrielleur ne pas vérifier les cookies
    if (isset($_GET['_courrielleur'])) {
      $args['cookiecheck'] = false;
    }

    if (strlen($user) === 0 || strlen($pass) === 0) {
      // Suppression du cookie
      unset($_COOKIE['roundcube_login']);
      rcube_utils::setcookie('roundcube_login', null, -1);
      $args['abort'] = true;
      $args['valid'] = false;
      return $args;
    }

    // Gérer les changements d'utilisateurs avec le cookie
    if (isset($_COOKIE['roundcube_login'])) {
      $login = explode('###', $_COOKIE['roundcube_login']);
      if ($user != $login[0]) {
        // Suppression du cookie
        unset($_COOKIE['roundcube_login']);
        rcube_utils::setcookie('roundcube_login', null, -1);
      }
    }

    if ($this->rc->config->get('enable_auth_protection', false)) {
      // Controle du nb de connexions en echecs
      // =====================================
      $CptEchec_nbtm = $this->rc->config->get('auth_protection_fails', 7); // Nombre de tentatives avant blocage
      $CptEchec_nbhreset = $this->rc->config->get('auth_protection_duration', 10); // Nombre de mn avant deblocage

      $CptEchec_count = 0;
      $auth_ok = false;

      $query = "SELECT * FROM pamela_tentativescnx where uid = ?";
      $result = $this->rc->db->query($query, $user);
      if ($result && ($arr = $this->rc->db->fetch_assoc($result))) {
        $CptEchec_tde = $arr['lastcnx'];
        if ((time() - $CptEchec_tde) > ($CptEchec_nbhreset * 60)) {
          $query = "DELETE FROM pamela_tentativescnx WHERE uid = ?";
          $this->rc->db->query($query, $user);
          $arr = null;
        } else {
          $CptEchec_count = $arr['nbtentatives'];
          if (mel_logs::is(mel_logs::INFO))
            mel_logs::get_instance()->log(mel_logs::INFO, '< ' . $user . ' > a ' . $CptEchec_count . ' tentative(s) de connexion !');
        }
      }
    }

    if ($this->rc->config->get('enable_auth_protection', false) && $CptEchec_count > $CptEchec_nbtm) {
      if (mel_logs::is(mel_logs::INFO))
        mel_logs::get_instance()->log(mel_logs::INFO, "Refus de connexion: Le compte <$user> est bloque");
      $args['abort'] = true;
      $args['error'] = 11;
    } else {
      // Récupération des données de l'utilisateur depuis le cache
      $_user_mce = driver_mel::gi()->getUser($args['user']);
      // MANTIS 0004868: Permetttre la connexion M2web avec l'adresse mail comme identifiant
      $args['user'] = $_user_mce->uid;
      if (isset($_user_mce) && $_user_mce->authentification($pass)) {
        $auth_ok = true;
        // Ne lister que les bal qui ont l'accès internet activé si l'accés se fait depuis Internet
        $_user_mce->load(['internet_access_enable']);
        if (!mel::is_internal() && !$_user_mce->internet_access_enable) {
          $args['error'] = 491;
          $args['abort'] = true;
          // Suppression du cookie
          unset($_COOKIE['roundcube_login']);
          rcube_utils::setcookie('roundcube_login', null, -1);
        } else {
          // Pas de connexion pour les externes sans espace
          if ($_user_mce->is_external) {
            $workspaces = $_user_mce->getSharedWorkspaces(null, null, 1);
            if (count($workspaces) === 0) {
              $args['error'] = 493;
              $args['abort'] = true;
              // Suppression du cookie
              unset($_COOKIE['roundcube_login']);
              rcube_utils::setcookie('roundcube_login', null, -1);
            }
          }
          if (!$args['abort']) {
            $hostname = driver_mel::gi()->getRoutage($_user_mce, 'authenticate');
            if (isset($hostname)) {
              if (driver_mel::gi()->isSsl($hostname)) {
                $args['host'] = "ssl://" . $hostname;
              }
              else {
                $args['host'] = $hostname;
              }
              // Gestion du keep login
              if (isset($_POST['_keeplogin'])) {
                // Création du cookie avec le login / cn
                rcube_utils::setcookie('roundcube_login', $user . "###" . $_user_mce->fullname, self::$expire_cookie + time());
                $_SESSION['_keeplogin'] = true;
  
                // Suppression du cooke error login
                unset($_COOKIE['roundcube_error_login']);
                rcube_utils::setcookie('roundcube_error_login', null, -1);
              } else if (!isset($_SESSION['auth_type'])) {
                // Suppression du cookie
                unset($_COOKIE['roundcube_login']);
                rcube_utils::setcookie('roundcube_login', null, -1);
                $_SESSION['_keeplogin'] = false;
              }
              // Toujours valider la connexion pour éviter les erreurs csrf sur l'auth
              $args['valid'] = true;
            } else if ($_user_mce->is_external) {
              // Toujours valider la connexion pour éviter les erreurs csrf sur l'auth
              $args['valid'] = true;
            } else {
              $args['abort'] = true;
              $args['error'] = 49;
              // Suppression du cookie
              unset($_COOKIE['roundcube_login']);
              rcube_utils::setcookie('roundcube_login', null, -1);
            }
          }
        }
      } else {
        $args['abort'] = true;
        $args['error'] = 49;
        if (isset($_COOKIE['roundcube_error_login']) && $_COOKIE['roundcube_error_login'] >= 3) {
          // Suppression du cookie
          unset($_COOKIE['roundcube_login']);
          rcube_utils::setcookie('roundcube_login', null, -1);

          // Suppression du cooke error login
          unset($_COOKIE['roundcube_error_login']);
          rcube_utils::setcookie('roundcube_error_login', null, -1);
        }
        else {
          $error_login = $_COOKIE['roundcube_error_login'] | 0;
          rcube_utils::setcookie('roundcube_error_login', ++$error_login, self::$expire_cookie + time());
        }
        
        // 0004988: En mode courrielleur, temporiser les échecs d'authentification
        if (isset($_GET['_courrielleur'])) {
          sleep(10);
        }
      }
    }
    if (!$auth_ok && $this->rc->config->get('enable_auth_protection', false) && (!isset($_GET['_courrielleur']) || !mel::is_internal())) {
      $CptEchec_count++;

      // Ne refaire la requête que si c'est nécessaire
      $query = "SELECT count(*) FROM pamela_tentativescnx WHERE uid = ?";
      $result = $this->rc->db->query($query, $user);
      $arr = $this->rc->db->fetch_assoc($result);
      $count = $arr['count'];

      if ($count > 0) {
        // MANTIS 4028: Après 7 échecs de connexion le compte est bloqué 10min depuis la première tentative
        $query = "UPDATE pamela_tentativescnx SET nbtentatives = ?, lastcnx = ? WHERE uid = ?;";
        $this->rc->db->query($query, $CptEchec_count, time(), $user);
      } else {
        $query = "INSERT INTO pamela_tentativescnx (uid, lastcnx, nbtentatives) VALUES (?, ?, ?);";
        $this->rc->db->query($query, $user, time(), $CptEchec_count);
      }

      if ($args['error'] == 11) {
        if (mel_logs::is(mel_logs::INFO))
          mel_logs::get_instance()->log(mel_logs::INFO, "Blocage du compte <$user>");
        // MANTIS 0006881: retour test d'intrusion : comptes bloqués
        if ($CptEchec_count == $CptEchec_nbtm + 1) {
          mail(driver_mel::gi()->getUser($user)->email_send, "ATTENTION: Verrouillage de l'acces web pour <$user>", "Votre compte est bloque suite a un trop grand nombre de tentatives de connexion ($CptEchec_nbtm) avec un mauvais mot de passe. Il sera debloque automatiquement dans $CptEchec_nbhreset mn.\r\n\r\nContacter votre cellule informatique si vous n'etes pas a l'origine de ce blocage ...");
        }
        
        // Exécuter la fin de la connexion pour permettre de personnaliser le message d'erreur
        $this->rc->output->show_message($this->rc->gettext('error_block', 'mel'), 'warning');

        // log failed login
        $this->rc->log_login($user, true, $args['error']);

        $this->rc->plugins->exec_hook('login_failed', array(
            'code' => $args['error'],
            'host' => $args['host'],
            'user' => $args['user']
        ));

        $this->rc->kill_session();

        // parse main template (default)
        $this->rc->output->send($this->rc->task);
      }
    }
    return $args;
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
}
