<?php 
/**
 * Plugin Mél
 *
 * Driver specifique a la MCE pour le plugin mel
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

include_once __DIR__ . '/../mce/mce.php';

class mce_mi_driver_mel extends mce_driver_mel {
  /**
   * Label utilisé dans les boites partagées pour l'arborescence des dossiers
   * 
   * @var string
   */
  protected $BALP_LABEL = 'Boite partag&AOk-e';

  /**
   * Namespace for the objets
   */
  protected static $_objectsNS = "\\LibMelanie\\Api\\Mi\\";

  /**
   * Dossier pour l'utilisation des fichiers pour le unexpunge
   */
  protected static $_unexpungeFolder = '/var/mce/unexpunge/';
  
  /**
   * Retourne le MBOX par defaut pour une boite partagée donnée
   * Peut être INBOX ou autre chose si besoin
   * 
   * @param string $balpname
   * @return string $mbox par defaut
   */
  public function getMboxFromBalp($balpname) {
    if (isset($balpname)) {
      $delimiter = rcmail::get_instance()->get_storage()->delimiter;
      return $this->BALP_LABEL . $delimiter . $balpname;
    }
    else {
      return 'INBOX';
    }
  }

  /**
   * Est-ce que le user est bien l'identifiant d'un groupe
   *
   * @param string $user Identifiant de l'objet group
   * @return boolean true si c'est un groupe, false sinon
   */
  public function userIsGroup($user) {
    return true;
  }

  /**
   * Récupère et traite les infos de routage depuis l'objet LDAP 
   * pour retourner le hostname de connexion IMAP et/ou SMTP
   * 
   * @param array $infos Entry LDAP
   * @param string $function Nom de la fonction pour personnaliser les retours
   * 
   * @return string $hostname de routage, null si pas de routage trouvé
   */
  public function getRoutage($infos, $function = '') {
    // MANTIS 0006228: [Driver MI] Gérer la connexion sieve au serveur imap en direct
    if ($function == 'managesieve_connect' || $function == 'unexpunge') {
      if (is_array($infos)) {
        $hostname = isset($infos['mailhost']) ? $infos['mailhost'][0] : null;
      }
      else {
        $infos->load(['server_host']);
        $hostname = $infos->server_host;
      }
      return $hostname;
    }
    else {
      // Si ce n'est pas du sieve on reprend la mécanique du driver MCE
      return parent::getRoutage($infos, $function);
    }
  }
}