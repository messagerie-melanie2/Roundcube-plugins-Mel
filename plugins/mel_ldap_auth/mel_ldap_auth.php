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
      setcookie('roundcube_login', null, -1);
      $args['abort'] = true;
      $args['valid'] = false;
      return $args;
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
      $infos = mel::get_user_infos($user);
      // MANTIS 0004868: Permetttre la connexion M2web avec l'adresse mail comme identifiant
      $args['user'] = $infos['uid'][0];
      if (LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$AUTH_LDAP)->authenticate($infos['dn'], $pass)) {
        $auth_ok = true;
        // Ne lister que les bal qui ont l'accès internet activé si l'accés se fait depuis Internet
        if (!$this->is_internal() && (!isset($infos['mineqmelaccesinterneta']) || $infos['mineqmelaccesinterneta'][0] != 1 || !isset($infos['mineqmelaccesinternetu']) || $infos['mineqmelaccesinternetu'][0] != 1)) {
          $args['error'] = 491;
          $args['abort'] = true;
          // Suppression du cookie
          unset($_COOKIE['roundcube_login']);
          setcookie('roundcube_login', null, -1);
        } else {
          if (isset($infos) && isset($infos['mineqmelroutage']) && count($infos['mineqmelroutage']) > 0) {
            // MANTIS 3925: mineqMelRoutage multivalué
            foreach ($infos['mineqmelroutage'] as $melroutage) {
              if (strpos($melroutage, '%') !== false) {
                $tmp = explode('@', $melroutage);
                $args['host'] = "ssl://" . $tmp[1];
                break;
              }
            }
            // Gestion du keep login
            if (isset($_POST['_keeplogin'])) {
              // Création du cookie avec le login / cn
              setcookie('roundcube_login', $user . "###" . $infos['cn'][0], self::$expire_cookie + time());
              $_SESSION['_keeplogin'] = true;
            } else {
              // Suppression du cookie
              unset($_COOKIE['roundcube_login']);
              setcookie('roundcube_login', null, -1);
              $_SESSION['_keeplogin'] = false;
            }
          } else {
            $args['abort'] = true;
            $args['error'] = 49;
            // Suppression du cookie
            unset($_COOKIE['roundcube_login']);
            setcookie('roundcube_login', null, -1);
          }
        }
      } else {
        $args['abort'] = true;
        $args['error'] = 49;
        // Suppression du cookie
        unset($_COOKIE['roundcube_login']);
        setcookie('roundcube_login', null, -1);
      }
    }
    if (!$auth_ok && $this->rc->config->get('enable_auth_protection', false)) {
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
        $infos = mel::get_user_infos($user);
        if (mel_logs::is(mel_logs::INFO))
          mel_logs::get_instance()->log(mel_logs::INFO, "Blocage du compte <$user>");
        mail($infos['mineqmelmailemission'][0], "ATTENTION: Verrouillage de l'acces web pour <$user>", "Votre compte est bloque suite a un trop grand nombre de tentatives de connexion ($CptEchec_nbtm) avec un mauvais mot de passe. Il sera debloque automatiquement dans $CptEchec_nbhreset mn.\r\n\r\nContacter votre cellule informatique si vous n'etes pas a l'origine de ce blocage ...");

        // Exécuter la fin de la connexion pour permettre de personnaliser le message d'erreur
        $this->rc->output->show_message($this->gettext('error_block'), 'warning');

        // log failed login
        $this->rc->log_login($user, true, $args['error']);

        $this->rc->plugins->exec_hook('login_failed', array(
            'code' => $error_code,
            'host' => $auth['host'],
            'user' => $auth['user']
        ));

        $this->rc->kill_session();

        // parse main template (default)
        $this->rc->output->send($this->rc->task);
      }
    }
    return $args;
  }
  
  /**
   * Défini si on est dans une instance interne ou extene de l'application
   * Permet la selection de la bonne url
   */
  private function is_internal() {
    return (! isset($_SERVER["HTTP_X_MINEQPROVENANCE"]) || strcasecmp($_SERVER["HTTP_X_MINEQPROVENANCE"], "intranet") === 0);
  }
}