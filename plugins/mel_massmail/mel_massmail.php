<?php
/**
 * Plugin Mél Mass Mails
 * plugin mel_massmail pour roundcube
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
class mel_massmail extends rcube_plugin {
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
   * Initialisation du plugin
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $this->rc = rcmail::get_instance();

    // Définition des hooks
    $this->add_hook('message_sent', array(
        $this,
        'message_sent'
    ));

    // Charge la configuration
    $this->load_config();
  }

  /**
   * Hook pour la gestion des envoies massifs
   * Voir
   * https://psi2appli.appli.i2/mantis/view.php?id=3033
   * https://psi2appli.appli.i2/mantis/view.php?id=3453
   *
   * @param array $args
   * @return array
   */
  public function message_sent($args) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "mel::message_sent(" . var_export($args, true) . ")");
    // MANTIS 0004388: Ne pas faire de blocage sur envois massifs depuis Internet si l'auth s'est faite avec la double auth
    if (mel::is_internal() || isset($_SESSION['mel_doubleauth_2FA_login'])) {
      return $args;
    }
    // Configuration des intervals d'envois maximum autorisé
    $send_conf = $this->rc->config->get('max_emitted_messages_configuration', array(
        // <temps_minute> => <nombre_denvois_max>,
        5 => 500,
        60 => 1500,
        600 => 4000
    ));
    // Récupération des destinataires du message
    if (isset($args['headers']['To']) && $args['headers']['To'] != 'undisclosed-recipients:;') {
      $to = explode(',', $args['headers']['To']);
    } else {
      $to = array();
    }
    if (isset($args['headers']['Cc'])) {
      $cc = explode(',', $args['headers']['Cc']);
    } else {
      $cc = array();
    }
    if (isset($args['headers']['Bcc'])) {
      $bcc = explode(',', $args['headers']['Bcc']);
    } else {
      $bcc = array();
    }
    // Compte le nombre de destinataires
    $nb = count($to) + count($cc) + count($bcc);
    // Configuration des destinataires du mail d'alerte
    $mail_dest = $this->rc->config->get('alert_message_dest', null);
    // Configuration de la valeur pour griller un mot de passe
    $pwdgrille = $this->rc->config->get('grilled_password_prefix', null);
    // Récupération de l'uid de l'utilisateur connecté
    $uid = $this->rc->get_user_name();
    // Récupération de l'adresse ip
    $ip_address = isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : $_SERVER['REMOTE_ADDR'];
    // Insert le nombre de destinataire dans la table mailcount
    $request = "INSERT INTO pamela_mailcount VALUES (?,?,?,?);";
    $result = $this->rc->db->query($request, $uid, date("Y-m-d H:i:s", time()), $nb, $ip_address);
    if ($result) {
      // Parcour la configuration, pour chaque interval d'envois
      foreach ($send_conf as $k => $s) {
        $time = time() - intval($k) * 60;
        $request = "SELECT sum(nb_dest) as sum FROM pamela_mailcount WHERE uid = '" . $uid . "' AND send_time > '" . date("Y-m-d H:i:s", $time) . "';";
        $result = $this->rc->db->query($request, $uid, date("Y-m-d H:i:s", $time));
        if ($result && ($arr = $this->rc->db->fetch_assoc($result))) {
          $mail_count = $arr['sum'];
          // Si le nombre de mail envoyé dans le lapse de temps est supérieur au nombre autorisé, on envoie un mail et on bloque le compte (grillage de mot de passe)
          if (intval($mail_count) >= intval($s)) {
            $ldap_error = false;
            if (LibMelanie\Ldap\Ldap::Authentification($uid, $this->rc->get_user_password(), LibMelanie\Config\Ldap::$MASTER_LDAP)) {
              $user = LibMelanie\Ldap\Ldap::GetUserInfos($uid, null, array(
                  'userpassword',
                  'sambantpassword'
              ), LibMelanie\Config\Ldap::$MASTER_LDAP);
              $entry = array();
              if (strpos($user['userpassword'][0], $pwdgrille) === false) {
                if (!empty($user['sambantpassword'])) {
                  $entry['sambantpassword'] = $pwdgrille . $user['sambantpassword'][0];
                }
                if (!empty($user['userpassword'])) {
                  if (preg_match('/^\{(.*?)\}(.*)$/', $user['userpassword'][0], $matches, PREG_OFFSET_CAPTURE) !== false) {
                    $entry['userpassword'] = '{' . $pwdgrille . $matches[1][0] . '}' . $matches[2][0];
                  } else {
                    $entry['userpassword'] = $pwdgrille;
                  }
                  if (LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$MASTER_LDAP)->modify($user['dn'], $entry)) {
                    // On detruit la session pour deconnecter l'utilisateur
                    unset($_SESSION);
                    session_destroy();
                    $_SESSION = array();
                  } else {
                    $ldap_error = LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$MASTER_LDAP)->getError();
                  }
                } else {
                  $ldap_error = 'No user password';
                }
              }
            } else {
              $ldap_error = LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$MASTER_LDAP)->getError();
            }
            // MANTIS 0004387: Avertir les adm Amédée lors des blocages de comptes
            $mailOpM2 = $this->_search_operators_mel_by_dn($uid);
            if (isset($mailOpM2)) {
              $mail_dest .= ", " . $mailOpM2;
            }
            // MANTIS 0006182: Loguer au niveau warning les grillages de compte sur trop d'émissions
            mel_logs::get_instance()->log(mel_logs::WARN, "[mel_massmail] '$uid' bloqué ($mail_count courriels en $k minutes, limite à $s). Dernière IP : $ip_address.");
            if ($ldap_error) {
              mel_logs::get_instance()->log(mel_logs::ERROR, "[mel_massmail] Erreur LDAP de grillage pour le compte '$uid' : $ldap_error");
            }
            // MANTIS 0004601: Mauvaise encodage des messages d'alerte pour les mass mails
            $headers = array();
            $headers[] = "MIME-Version: 1.0";
            $headers[] = 'Content-Type: text/plain; charset=UTF-8';
            $headers[] = 'Content-Transfer-Encoding: 8bit';
            // Modifier le message
            $mail_subject = "[ALERTE] Blocage du compte '" . $uid . "' à cause d'un trop grand nombre d'emissions de courriels depuis Internet ($mail_count envois en $k minutes)";
            $mail_text = "Le compte '$uid' vient d'être bloqué car il a émis trop de courriels depuis Internet via Mél ($mail_count courriels en $k minutes, dépassant la limite de $s envois autorisés). La dernière adresse IP utilisée pour un envoi est $ip_address.
              
Il est possible que cette activité inhabituelle soit due à la prise de contrôle de la boite aux lettres par un tiers, par exemple dans le cadre d'une campagne de phishing.

Nous vous invitons à vérifier auprès de l'utilisateur s'il est ou non à l'origine de ces envois.

1/ Si ces envois sont légitimes
- Réinitialiser le mot de passe de l'utilisateur depuis Amédée.
- Inviter l'utilisateur à activer la double authentification*, qui permet de lever les seuils d'envoi depuis Internet

2/ Si ces envois sont dus à une compromission de la boite aux lettres
- Réinitialiser le mot de passe de l'utilisateur dans Amédée
- Tenter avec l'utilisateur de comprendre l'origine de la compromission. Dans le cas d'un phishing, transmettre si possible en pièce jointe le courriel malveillant à l'assitance via SPS https://portail.centre-serveur.din.developpement-durable.gouv.fr/projects/assistance-messagerie-collaborative
- Sensibiliser l'utilisateur sur le choix et la sécurisation de son mot de passe
- Inviter l'utilisateur à activer la double authentification*, dans le but d'une meilleure sécurisation de son compte

* Le guide d'utilisation de la double authentification est disponible à l'adresse suivante : https://fabrique-numerique.gitbook.io/bnum/tutoriels/apprendre-a/activer-lauthentification-a-deux-facteurs" . ($ldap_error ? "\r\n\r\nPour le PNE:\r\nUne erreur LDAP ($ldap_error) s'est produite, le mot de passe n'a pas pu être grillé automatiquement, merci de le faire au plus vite." : "");

            // Envoi du message d'information
            \LibMelanie\Mail\Mail::mail($mail_dest, $mail_subject, $mail_text, $headers, null, 'bnum');
            // On detruit la session pour deconnecter l'utilisateur
            unset($_SESSION);
            session_destroy();
            $_SESSION = array();
            break;
          }
        }
      }
    }
    return $args;
  }
  
  /**
   * Rechercher les opérateurs Mél d'un utilisateur
   * Voir Mantis #4387 (https://mantis.pneam.cp2i.e2.rie.gouv.fr/mantis/view.php?id=4387)
   * @param string $uid Uid de l'utilisateur
   */
  private function _search_operators_mel_by_dn($uid) {
    // Récupération du DN en fonction de l'UID
    $user_infos = LibMelanie\Ldap\Ldap::GetUserInfos($uid);
    $base_dn = $user_infos['dn'];
    // Initialisation du filtre LDAP
    $filter = "(&(objectClass=groupOfNames)(mineqRDN=ACL.Opérateurs Mélanie2))";
    $mail = null;
    // Récupération de l'instance depuis l'ORM
    $ldap = LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$SEARCH_LDAP);
    if ($ldap->bind4lookup()) {
      do {
        // Search LDAP
        $result = $ldap->ldap_list($base_dn, $filter, ['mail', 'mailpr']);
        // Form DN
        $base_dn = substr($base_dn, strpos($base_dn, ',') + 1);
      } while ((!isset($result) || $ldap->count_entries($result) === 0) && $base_dn != 'dc=equipement,dc=gouv,dc=fr');
      if (isset($result) && $ldap->count_entries($result) > 0) {
        $infos = $ldap->get_entries($result);
        $mail = $infos[0]['mailPR'][0] ?: $infos[0]['mail'][0];
      }
    }
    return $mail;
  }
}
