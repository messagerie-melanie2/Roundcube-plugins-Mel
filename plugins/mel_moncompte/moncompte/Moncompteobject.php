<?php
/**
 * Plugin Mél_Moncompte
 *
 * plugin mel_Moncompte pour roundcube
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

 /**
  * Classe abstraite d'un objet Mon compte
  */
abstract class Moncompteobject {
    /**
     * Est-ce que cet objet Mon compte doit être affiché
     * 
     * @return boolean true si l'objet doit être affiché false sinon
     */
    abstract public static function isEnabled();
    /**
	 * Chargement des données de l'utilisateur depuis l'annuaire
	 */
    abstract public static function load($plugin = null);

	/**
	 * Modification des données de l'utilisateur depuis l'annuaire
	 */
    abstract public static function change();
}