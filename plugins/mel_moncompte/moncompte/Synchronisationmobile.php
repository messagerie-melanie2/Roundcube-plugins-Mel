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
* Classe de gestion de l'accés à la synchronisation mobile de l'utilisateur
*/
class Synchronisationmobile extends Moncompteobject {
	/**
	* Est-ce que cet objet Mon compte doit être affiché
	* 
	* @return boolean true si l'objet doit être affiché false sinon
	*/
	public static function isEnabled() {
		return rcmail::get_instance()->config->get('enable_moncompte_cgu', true);
	}
	
	/**
	* Chargement des données de l'utilisateur depuis l'annuaire
	*/
	public static function load() {
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
	}
	
	/**
	* Modification des données de l'utilisateur depuis l'annuaire
	*/
	public static function change() {

	}	
}