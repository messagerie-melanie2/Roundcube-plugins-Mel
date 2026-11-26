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

  /** Délai minimal (secondes) entre deux contrôles du mot de passe de session. */
  private const int RECHECK_INTERVAL = 600;

  /** Délai (secondes) avant de retenter un contrôle resté indéterminé (panne LDAP ou IMAP). */
  private const int RETRY_INTERVAL = 300;

  /** Nombre de tentatives par contrôle en cas d'erreur technique. */
  private const int MAX_ATTEMPTS = 2;

  /** Pause (microsecondes) entre deux tentatives. */
  private const int RETRY_DELAY = 300000;

  /** Clé de session contenant l'horodatage du prochain contrôle annuaire. */
  private const string SESSION_LDAP_NEXT_CHECK = 'mel_ldap_auth_ldap_next_check';

  /** Clé de session contenant l'horodatage du prochain contrôle IMAP. */
  private const string SESSION_IMAP_NEXT_CHECK = 'mel_ldap_auth_imap_next_check';

  /** Variation aléatoire maximale (secondes) ajoutée à chaque planification de contrôle. */
  private const int CHECK_JITTER = 120;

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

    $this->add_hook('startup', $this->check_connect(...));

    // Charge la configuration
    $this->load_config();
  }

  /**
   * Hook startup : vérifie que le mot de passe stocké en session est toujours
   * valide dans l'annuaire (il a pu être changé via un autre outil).
   *
   * Le contrôle est espacé (voir {@see mel_ldap_auth::is_password_check_due()})
   * et n'a aucun effet de bord sur le compteur de tentatives en échec.
   * Seul un refus explicite de l'annuaire ferme la session : une erreur
   * technique (LDAP injoignable, timeout...) ne déconnecte jamais l'utilisateur,
   * le contrôle est simplement reporté.
   *
   * @param array<string, mixed> $args Arguments du hook startup
   *
   * @return array<string, mixed> Arguments du hook, inchangés
   */
  protected function check_connect(array $args): array {
    if (in_array($this->rc->task, ['login', 'logout'], true)) return $args;
    if (empty($this->rc->user) || empty($this->rc->user->ID)) return $args;

    if (!$this->check_ldap_password()) return $args;

    $this->check_imap_password();

    return $args;
  }

  /**
   * Contrôle le mot de passe de session auprès de l'annuaire, si le contrôle est dû.
   *
   * @return bool `false` si la session vient d'être fermée, `true` sinon
   */
  private function check_ldap_password(): bool {
    if ($this->is_keep_alive_request() || !$this->is_password_check_due()) return true;

    $is_valid = $this->get_session_password_verdict();

    if ($is_valid === null) {
      // Impossible de joindre le ldap
      $this->schedule_check(self::SESSION_LDAP_NEXT_CHECK, self::RETRY_INTERVAL);
      return true;
    }

    if ($is_valid) {
      $this->schedule_check(self::SESSION_LDAP_NEXT_CHECK, self::RECHECK_INTERVAL);
      return true;
    }

    $this->close_session_for_refused_password('l\'annuaire');

    return false;
  }

  /**
   * Contrôle le mot de passe de session auprès du serveur IMAP, si le contrôle est dû.
   *
   * Le prochain contrôle est planifié avec une variation aléatoire pour ne pas
   * synchroniser les sessions entre elles (voir {@see mel_ldap_auth::schedule_check()}).
   */
  private function check_imap_password(): void {
    if (!$this->is_imap_check_due()) return;

    $is_valid = $this->get_session_imap_verdict();

    if ($is_valid === false) {
      $this->close_session_for_refused_password('le serveur IMAP');
      return;
    }

    $this->schedule_check(self::SESSION_IMAP_NEXT_CHECK, $is_valid === null ? self::RETRY_INTERVAL : self::RECHECK_INTERVAL);
  }

  /**
   * Indique si le contrôle IMAP est dû pour la requête en cours.
   *
   * Le contrôle n'est fait que sur une requête du courrier qui utilise de toute
   * façon l'IMAP : la connexion est alors réutilisée, sans connexion
   * supplémentaire. Le keep-alive n'y touche jamais, ni les autres tâches.
   *
   * @return bool `true` si la requête est éligible et l'échéance dépassée
   */
  private function is_imap_check_due(): bool {
    if ($this->rc->task !== 'mail' || $this->is_keep_alive_request()) return false;

    if (!isset($_SESSION[self::SESSION_IMAP_NEXT_CHECK])) {
      // Le mot de passe vient d'être validé par le login.
      $this->schedule_check(self::SESSION_IMAP_NEXT_CHECK, self::RECHECK_INTERVAL);
      return false;
    }

    return time() >= $_SESSION[self::SESSION_IMAP_NEXT_CHECK];
  }

  /**
   * Indique si la requête en cours est un keep-alive : elle ne déclenche aucun
   * contrôle, sinon une page ouverte en arrière-plan sollicite l'annuaire pour rien.
   *
   * @return bool `true` pour une requête keep-alive
   */
  private function is_keep_alive_request(): bool {
    return $this->rc->action === 'keep-alive';
  }

  /**
   * Planifie le prochain contrôle, avec une variation aléatoire pour éviter que
   * toutes les sessions contrôlent l'annuaire ou l'IMAP au même moment.
   *
   * @param string $session_key Clé de session de l'échéance (annuaire ou IMAP)
   * @param int    $delay       Délai de base en secondes
   */
  private function schedule_check(string $session_key, int $delay): void {
    $_SESSION[$session_key] = time() + $delay + random_int(0, self::CHECK_JITTER);
  }

  /**
   * Ferme la session dont le mot de passe vient d'être refusé.
   *
   * La redirection vers le login est assurée par le core : une requête AJAX
   * reçoit la commande `session_error` (voir index.php), et en composition le
   * brouillon est conservé localement par le client.
   *
   * @param string $source Origine du refus, pour la trace (ex. : « l'annuaire »)
   */
  private function close_session_for_refused_password(string $source): void {
    mel_logs::get_instance()->log(mel_logs::INFO, "[mel_ldap_auth] Mot de passe de la session refusé par $source pour <" . $this->rc->user->get_username() . "> : fermeture de la session");
    $this->rc->kill_session();
  }

  /**
   * Vérifie le mot de passe de la session auprès du serveur IMAP.
   *
   * Seul un refus explicite des identifiants (réponse `NO` à l'authentification,
   * soit `rcube_imap_generic::ERROR_NO`) donne `false`. Une panne réseau, TLS ou
   * serveur (`ERROR_BAD`, `ERROR_BYE`...) reste indéterminée pour ne jamais
   * déconnecter l'utilisateur lors d'une indisponibilité.
   *
   * En cas de succès la connexion reste ouverte et est réutilisée par la requête
   * en cours (les propriétés du storage sont déjà posées par `storage_init()`).
   *
   * @return bool|null `true` si valide, `false` si refusé, `null` si indéterminé
   */
  private function get_session_imap_verdict(): ?bool {
    if (empty($_SESSION['storage_host']) || empty($_SESSION['username']) || empty($_SESSION['password'])) return null;

    try {
      $storage = $this->rc->get_storage();

      if ($storage->is_connected()) return true;

      $is_connected = $storage->connect(
        $_SESSION['storage_host'],
        $_SESSION['username'],
        $this->rc->decrypt($_SESSION['password']),
        $_SESSION['storage_port'],
        $_SESSION['storage_ssl']
      );

      if ($is_connected) return true;

      if ($storage->get_error_code() === rcube_imap_generic::ERROR_NO) return false;

      mel_logs::get_instance()->log(mel_logs::WARN, "[mel_ldap_auth] Contrôle IMAP du mot de passe de session indéterminé : " . $storage->get_error_str());
    } catch (\Throwable $th) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_ldap_auth] Erreur inattendue lors du contrôle IMAP du mot de passe de session : " . $th->getMessage());
    }

    return null;
  }

  /**
   * Indique si le prochain contrôle du mot de passe de session est dû.
   *
   * La première requête d'une session planifie simplement le premier contrôle :
   * le mot de passe vient d'être validé par le login.
   *
   * @return bool `true` si l'échéance du contrôle est dépassée
   */
  private function is_password_check_due(): bool {
    if (!isset($_SESSION[self::SESSION_LDAP_NEXT_CHECK])) {
      $this->schedule_check(self::SESSION_LDAP_NEXT_CHECK, self::RECHECK_INTERVAL);
      return false;
    }

    return time() >= $_SESSION[self::SESSION_LDAP_NEXT_CHECK];
  }

  /**
   * Vérifie le mot de passe de la session auprès de l'annuaire, avec une
   * nouvelle tentative uniquement si l'annuaire est injoignable
   * (`Melanie2LdapException`) : un refus explicite est définitif, le retenter
   * n'a pas de sens.
   *
   * @return bool|null `true` si valide, `false` si refusé par l'annuaire,
   *                   `null` si le résultat est indéterminé (erreur technique)
   */
  private function get_session_password_verdict(): ?bool {
    for ($i = 0; $i < self::MAX_ATTEMPTS; ++$i) {
      if ($i > 0) usleep(self::RETRY_DELAY);

      try {
        [$username, $password] = driver_mel::gi()->getBasicAuth();
        if (strlen((string) $username) === 0 || strlen((string) $password) === 0) return null;

        $user = driver_mel::gi()->getUser($username);
        if (!isset($user)) continue;

        return (bool) $user->authentification($password);
      } catch (\LibMelanie\Exceptions\Melanie2LdapException $e) {
        // Annuaire injoignable : erreur transitoire possible, on retente.
        mel_logs::get_instance()->log(mel_logs::WARN, "[mel_ldap_auth] Annuaire injoignable pour le contrôle du mot de passe de session (tentative " . ($i + 1) . "/" . self::MAX_ATTEMPTS . ") : " . $e->getMessage());
      } catch (\Throwable $th) {
        // Erreur inattendue (bug) : inutile de retenter, mais ne jamais bloquer la requête.
        mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_ldap_auth] Erreur inattendue lors du contrôle du mot de passe de session : " . $th->getMessage());
        return null;
      }
    }

    return null;
  }

  /**
   * Hook authenticate
   *
   * Une indisponibilité de l'annuaire ne doit pas finir en erreur fatale :
   * la page 500 pousse l'utilisateur à renvoyer le formulaire avec un jeton
   * périmé, dans une session que rcmail_fatal_error() a enregistrée sans
   * l'IP du client (échec de l'IP check à la requête suivante).
   *
   * @param array $args Arguments du hook authenticate
   *
   * @return array Arguments du hook, connexion abandonnée si le LDAP est injoignable
   */
  public function authenticate($args) {
    try {
      return $this->_authenticate($args);
    }
    catch (\LibMelanie\Exceptions\Melanie2LdapException $e) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_ldap_auth] Authentification impossible pour <" . $args['user'] . "> : " . $e->getMessage());
      // Échec technique : ne pas le compter comme une tentative en échec
      $args['abort'] = true;
      $args['error'] = rcmail::ERROR_STORAGE;
      return $args;
    }
  }

  /**
   * Find user credentials In LDAP.
   */
  private function _authenticate($args) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "mel::authenticate()");

    // MANTIS 3193: Mécanisme pour permettre l'authentification transparente depuis le Courrielleur
    if (!isset($args['user']) || strlen($args['user']) === 0) {
      $args['user'] = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_GPC));
    }
    if (!isset($args['pass']) || strlen($args['pass']) === 0) {
      $args['pass'] = rcube_utils::get_input_value('_pass', rcube_utils::INPUT_GPC, true, $this->rc->config->get('password_charset', 'ISO-8859-1'));
    }

    // Protection contre l'injection de filtre LDAP : un identifiant légitime
    // (uid ou adresse mail) ne contient jamais de métacaractère de filtre LDAP
    if ($this->_contains_ldap_filter_metacharacters($args['user'])) {
      if (mel_logs::is(mel_logs::WARN))
        mel_logs::get_instance()->log(mel_logs::WARN, "[mel_ldap_auth] Identifiant refusé (caractères de filtre LDAP interdits) : <" . $args['user'] . ">");
      // Suppression du cookie
      unset($_COOKIE['roundcube_login']);
      rcube_utils::setcookie('roundcube_login', null, -1);
      $args['abort'] = true;
      $args['valid'] = false;
      $args['error'] = 49;
      return $args;
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

      if (!isset($_user_mce)) return $args;

      //MANTIS 0009619 - Ne plus permettre la connexion directe sur une balp (sufr) avec le mot de passe d'un gestionnaire
      $args = $this->_validate_user_type($_user_mce, $args);

      if ($args['abort'] === true) return $args;

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

    if ($_POST['_keeplogin'] === "keeplogin") {
      $lifetime = $this->rc->config->get('session_lifetime', 0) * 60;
      rcube_utils::setcookie('keep_login', true, $lifetime ? time() + $lifetime * 100 : 0);
    }

    return $args;
  }

  /**
   * Vérifie si le type de compte de l'utilisateur autorise une connexion directe.
   *
   * Seuls les comptes applicatifs et individuels sont autorisés ; les boîtes
   * partagées (BALP) et les autres types de compte en sont exclus
   * (cf. MANTIS 0009619).
   *
   * @param \LibMelanie\Api\Defaut\User $user Utilisateur dont le type est vérifié
   *
   * @return bool `true` si le compte est applicatif ou individuel, `false` sinon
   */
  private function _is_valid_user_type(\LibMelanie\Api\Defaut\User $user): bool {
    return $user->is_applicative || $user->is_individuelle || $user->is_personne;
  }

  /**
   * Valide le type de compte de l'utilisateur avant authentification et
   * abandonne la connexion s'il n'est pas autorisé.
   *
   * Empêche la connexion directe sur une boîte partagée (BALP) avec le mot
   * de passe d'un gestionnaire (cf. MANTIS 0009619) : si
   * {@see mel_ldap_auth::_is_valid_user_type()} renvoie `false`, le refus est
   * journalisé, `$args['abort']` et `$args['valid']` sont positionnés en
   * conséquence et le cookie `roundcube_login` est supprimé.
   *
   * @param \LibMelanie\Api\Defaut\User $user Utilisateur ciblé par la tentative de connexion
   * @param array<string, mixed>        $args Arguments du hook `authenticate`
   *
   * @return array<string, mixed> Arguments du hook, éventuellement modifiés pour abandonner la connexion
   */
  private function _validate_user_type(\LibMelanie\Api\Defaut\User $user, array $args) {
    if (!$this->_is_valid_user_type($user)) {
        if (mel_logs::is(mel_logs::INFO))
          mel_logs::get_instance()->log(mel_logs::INFO, "Refus de connexion: Le compte <$user> n'est pas un compte valide !");
        
        $args['abort'] = true;
        $args['valid'] = false;
        unset($_COOKIE['roundcube_login']);
        rcube_utils::setcookie('roundcube_login', null, -1);
    }

    return $args;
  }

  /**
   * Vérifie si l'identifiant contient un métacaractère de filtre LDAP, afin
   * de refuser toute tentative d'injection de filtre LDAP au moment de
   * l'authentification. S'appuie sur l'échappement de référence de
   * rcube_ldap_generic::quote_string() (core Roundcube) : si l'échappement
   * modifie la chaîne, elle contient un caractère dangereux pour une
   * insertion dans un filtre LDAP.
   *
   * @param string $user Identifiant saisi par l'utilisateur
   *
   * @return boolean
   * @private
   */
  private function _contains_ldap_filter_metacharacters($user) {
    return rcube_ldap_generic::quote_string($user) !== $user;
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
