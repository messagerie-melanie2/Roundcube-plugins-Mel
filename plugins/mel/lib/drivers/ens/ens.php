<?php 
/**
 * Plugin Mél
 *
 * Driver specifique au MTES pour le plugin mel
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
include_once __DIR__ . '/../mtes/mtes.php';

class ens_driver_mel extends mtes_driver_mel {
  /**
   * Namespace for the objets
   */
  protected static $_objectsNS = "\\LibMelanie\\Api\\Ens\\";



  // Est-ce que le user est bien l'identifiant d'un groupe
  // @param string $user Identifiant de l'objet group
  // @return boolean true si c'est un groupe, false sinon

  public function userIsGroup($user) {
    return strpos($user, "cn=") === 0 && strpos($user, "ou=posixGroup,ou=groups,dc=ens-lyon,dc=fr") !== false;
    }
}
