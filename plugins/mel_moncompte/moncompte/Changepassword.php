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
require_once 'Moncompteobject.php';

 /**
  * Classe de modification de mot de passe de l'utilisateur
  */
class Changepassword extends Moncompteobject {
	/**
     * Est-ce que cet objet Mon compte doit être affiché
	 * 
	 * @return boolean true si l'objet doit être affiché false sinon
     */
	public static function isEnabled() {
		return rcmail::get_instance()->config->get('enable_moncompte_mdp', true);
	}
	
	/**
	 * Chargement des données de l'utilisateur depuis l'annuaire
	 */
    public static function load() {
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser();


		// Envoi de la page
		rcmail::get_instance()->output->send('mel_moncompte.changepassword');
    }

	/**
	 * Modification des données de l'utilisateur depuis l'annuaire
	 */
    public static function change() {
		
    }	
}