<?php

/**
 * Plugin Mél
 *
 * Driver specifique pour un openldap standard pour le plugin mel
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

class standard_driver_mel extends driver_mel
{
  /**
   * Namespace for the objets
   */
  protected static $_objectsNS = "\\LibMelanie\\Api\\Standard\\";

  /**
   * Dossier pour l'utilisation des fichiers pour le unexpunge
   */
  protected static $_unexpungeFolder;

  /**
   * Constructeur par défaut
   */
  public function __construct()
  {
    $rcmail = rcmail::get_instance();
    if ($rcmail->config->get('virtual_shared_mailboxes', false)) {
      $this->BALP_LABEL = $rcmail->config->get('virtual_balp_label', $this->BALP_LABEL);
    }
  }

  /**
   * Retourne l'objet User associé à l'utilisateur courant
   * Permet de retourner l'instance User en fonction du driver
   * 
   * @param string $username [Optionnel] Identifiant de l'utilisateur a récupérer, sinon utilise l'utilisateur RC courant
   * @param boolean $load [Optionnel] L'utilisateur doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer l'utilisateur depuis le cache s'il existe ? Oui par défaut
   * @param string $dn [Optionnel] DN de l'utilisateur a récupérer
   * @param string $email [Optionnel] Email de l'utilisateur a récupérer
   * @param string $itemName [Optionnel] Nom de l'objet associé dans la configuration LDAP
   *
   * @return \LibMelanie\Api\Mce\User
   */
  public function &getUser($username = null, $load = true, $fromCache = true, $dn = null, $email = null, $itemName = null)
  {
    if (!isset($username) && !isset($dn) && !isset($email)) {
      $username = rcmail::get_instance()->user->get_username();
    }
    if (!$fromCache) {
      $user = $this->user([null, $itemName]);
      if (isset($username)) {
        $user->uid = $username;
      } else if (isset($dn)) {
        $user->dn = $dn;
      } else if (isset($email)) {
        $user->email = $email;
      }
      if ($load && !$user->load()) {
        $user = null;
      }
      return $user;
    }
    if (!isset(self::$_users)) {
      self::$_users = \mel::getCache('users');
      if (!isset(self::$_users)) {
        self::$_users = [];
      }
    }
    $keyCache = $username . (isset($itemName) ? $itemName : '');
    if (!isset(self::$_users[$keyCache])) {
      self::$_users[$keyCache] = $this->user([null, $itemName]);
      self::$_users[$keyCache]->uid = $username;
      if ($load && !self::$_users[$keyCache]->load()) {
        self::$_users[$keyCache] = null;
      }
      \mel::setCache('users', self::$_users);
    }
    if (isset(self::$_users[$keyCache])) {
      self::$_users[$keyCache]->registerCache('standard_driver_mel', [$this, 'onUserChange']);
    }
    return self::$_users[$keyCache];
  }

  /**
   * Enregistrer les donnés en cache quand un utilisateur change
   */
  public function onUserChange()
  {
    \mel::setCache('users', self::$_users);
  }

  /**
   * Retourne l'objet Group
   * Permet de retourner l'instance Group en fonction du driver
   * 
   * @param string $group_dn [Optionnel] DN du groupe a récupérer
   * @param boolean $load [Optionnel] Le groupe doit-il être chargé ? Oui par défaut
   * @param boolean $fromCache [Optionnel] Récupérer le groupe depuis le cache s'il existe ? Oui par défaut
   * @param string $itemName [Optionnel] Nom de l'objet associé dans la configuration LDAP
   *
   * @return \LibMelanie\Api\Defaut\Group
   */
  public function getGroup($group_dn = null, $load = true, $fromCache = true, $itemName = null)
  {
    if (!$fromCache) {
      $group = $this->group([null, $itemName]);
      $group->dn = $group_dn;
      if ($load && !$group->load()) {
        $group = null;
      }
      return $group;
    }
    if (!isset(self::$_groups)) {
      self::$_groups = [];
    }
    $keyCache = $group_dn . (isset($itemName) ? $itemName : '');
    if (!isset(self::$_groups[$keyCache])) {
      self::$_groups[$keyCache] = $this->group([null, $itemName]);
      self::$_groups[$keyCache]->dn = $group_dn;
      if ($load && !self::$_groups[$keyCache]->load()) {
        self::$_groups[$keyCache] = null;
      }
    }
    return self::$_groups[$keyCache];
  }

  /**
   * Retourne le MBOX par defaut pour une boite partagée donnée
   * Peut être INBOX ou autre chose si besoin
   *
   * @param string $balpname
   * @return string $mbox par defaut
   */
  public function getMboxFromBalp($balpname)
  {
    return 'INBOX';
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
  public function getRoutage($infos, $function = '')
  {
    // Conf dédiée pour le managesieve
    if ($function == 'managesieve_connect') {
      $conf = 'managesieve_host';
    } else {
      $conf = 'default_host';
    }

    // Récupère le hostname depuis la configuration
    $hostname = rcmail::get_instance()->config->get($conf);
    
    return $hostname;
  }

  /**
   * Positionne des headers pour un message avant de l'envoyer
   *
   * @param array $headers Liste des headers a fournir au message
   * @return array $headers Retourne les headers completes
   */
  public function setHeadersMessageBeforeSend($headers)
  {
    return $headers;
  }

  /**
   * Est-ce que l'utilisateur courant a le droit d'accéder au stockage
   *
   * @return boolean true si le stockage doit être affiché, false sinon
   */
  public function userHasAccessToStockage()
  {
    return true;
  }

  /**
   * Est-ce que le mot de passe de l'utilisateur doit changer
   * Si c'est le cas la page de changement de mot de passe sera affichée après le login
   * Le titre de la page est en entrée/sortie
   *
   * @param string $title Titre de la fenetre de changement de mot de passe
   * @return boolean Le mot de passe doit changer
   */
  public function isPasswordNeedsToChange(&$title)
  {
    return false;
  }

  /**
   * Est-ce que le user est bien l'identifiant d'un groupe
   *
   * @param string $user Identifiant de l'objet group
   * @return boolean true si c'est un groupe, false sinon
   */
  public function userIsGroup($user)
  {
    return false;
  }

  /**
   * Méthode permettant de personnaliser l'affichage des contacts
   * 
   * @param array $args Tableau utilisé pour l'affichage du formulaire des contacts
   * 
   * @return array $args personnalisé
   */
  public function contact_form($args)
  {
    // Ajout du Type et de la Category d'un contact
    $args['head_fields']['category'] = ['category'];
    $args['head_fields']['type'] = ['type'];
    if (isset($args['form']['head'])) {
      $args['form']['head']['content']['category'] = array('type' => 'text');
      $args['form']['head']['content']['type'] = array('type' => 'text');
    }
    return $args;
  }

  /**
   * Méthode de création/modification d'un groupe associé à un workspace
   * 
   * @param string $workspace_id Identifiant du workspace
   * @param array $members Liste des membres du groupe
   * 
   * @param boolean $mdrive Est-ce que l'accès au stockage est activé ou non
   * 
   * @return boolean
   */
  public function workspace_group($workspace_id, $members = [], $mdrive = true)
  {
    return false;
  }

  /**
   * Méthode pour vérifier si groupe existe déjà 
   * 
   * @param string $workspace_id Identifiant du workspace
   * 
   * @return boolean
   */
  public function if_group_exist($workspace_id)
  {
    return false;
  }

  /**
   * Méthode de récupération d'un groupe associé à un workspace
   * 
   * @param string $workspace_id Identifiant du workspace
   * 
   * @return null|\LibMelanie\Api\Defaut\Group
   */
  public function get_workspace_group($workspace_id)
  {
    return null;
  }

  /**
   * Création d'un utilisateur externe s'il n'est pas trouvé dans l'annuaire 
   * et que son domaine n'est pas un domaine interne
   * 
   * @param string $email Email de l'utilisateur externe
   * @param \LibMelanie\Api\Defaut\Workspace $workspace Espace de travail
   * 
   * @return boolean true si l'utilisateur a été créé, false sinon
   */
  public function create_external_user($email, $workspace)
  {
    return false;
  }

  /**
   * Lister les ressources par uid ou email
   * 
   * @param string[] $uids Liste des uids des ressources
   * @param string[] $emails Liste des emails des ressources
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources
   */
  public function resources($uids = null, $emails = null)
  {
    return [];
  }

  /**
   * Lister les localités disponibles pour les ressources
   * 
   * @return LibMelanie\Api\Defaut\Resources\Locality[] Liste des localités 
   */
  public function resources_localities()
  {
    return [];
  }

  /**
   * Lister les ressources Flex Office disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  public function resources_flex_office($locality_uid)
  {
    return [];
  }

  /**
   * Lister les ressources Salle disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  public function resources_salle($locality_uid)
  {
    return [];
  }

  /**
   * Lister les ressources Véhicule disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  public function resources_vehicule($locality_uid)
  {
    return [];
  }

  /**
   * Lister les ressources Matériel disponibles pour une localité
   * 
   * @param string $locality_uid Identifiant de la localité
   * 
   * @return LibMelanie\Api\Defaut\Resource[] Liste des ressources Flex Office
   */
  public function resources_materiel($locality_uid)
  {
    return [];
  }

  /**
   * Formate un numéro de téléphone en supprimant les espaces et les tirets,
   * puis en remplaçant le préfixe par un 0 si nécessaire, et enfin en ajoutant
   * des espaces tous les deux chiffres.
   *
   * @param string $phoneNumber Le numéro de téléphone à formater.
   * @return string Le numéro de téléphone formaté.
   */
  protected function formatPhoneNumber($phoneNumber)
  {
    $rcmail = rcmail::get_instance();

    if (isset($phoneNumber)) {
      $phoneNumber = preg_replace('/\s+|-/', '', $phoneNumber); // Remplace un ou plusieurs espace | un tiret par un seul espace

      foreach ($rcmail->config->get('PHONE_PREFIX', ["+33(0)", "+33", "+39", "+49", "+590", "+594", "+596", "+262", "+508", "+681", "+689", "+687"]) as $format) {
        if (strpos($phoneNumber, $format) === 0) // si le début d'une num de tel === un des format, alors il est remplacé par un unique 0
        {
          if ($format === '+33' || $format === '+33(0)') {
            $phoneNumber = '0' . substr($phoneNumber, strlen($format));
            return preg_replace('/(..)/', '$1 ', $phoneNumber);
          } else {
            $phoneNumber = substr($phoneNumber, strlen($format));
            return $format . ' ' .  preg_replace('/(..)/', '$1 ', $phoneNumber);
          }
        }
      }
    }
    return $phoneNumber;
  }
}
