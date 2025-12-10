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

require_once __DIR__ . '/../standard/standard.php';

class standard_no_ldap_driver_mel extends standard_driver_mel
{
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

    if ($username == rcmail::get_instance()->user->get_username()) {
      $user = $this->user();
      $user->uid = $username;
      $user->email = rcmail::get_instance()->get_user_email();
      $user->name = $username;
      $user->fullname = $username;
      $user->firstname = $username;
      $user->surname = $username;

      return $user;
    }
    else {
      return null;
    }
  }
}
