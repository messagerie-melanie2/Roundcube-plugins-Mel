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
* Classe de gestion de l'accés internet de l'utilisateur
*/
class Accesinternet extends Moncompteobject {
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
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());
		// Liste des attributs à charger
		$attributes = [
			'internet_access_admin',
			'internet_access_user',
		];
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
		// Authentification
		if ($user->authentification(Moncompte::get_current_user_password(), true)
				&& $user->load($attributes)) {
			// Charger les attributs nécessaires
			$user->load($attributes);
			if ($user->internet_access_admin) {
				if ($user->internet_access_user && mel::is_internal()) {
					rcmail::get_instance()->output->send('mel_moncompte.accesinternet_active_intranet');
				}
				else if ($user->internet_access_user) {
					rcmail::get_instance()->output->send('mel_moncompte.accesinternet_active_internet');
				}
				else if (mel::is_internal()) {
					rcmail::get_instance()->output->send('mel_moncompte.accesinternet_desactive');
				}
			}
		}
		rcmail::get_instance()->output->send('mel_moncompte.accesinternet_interdit');
	}
	
	/**
	 * Modification des données de l'utilisateur depuis l'annuaire
	 */
	public static function change() {
		$acces_internet_enable = trim(rcube_utils::get_input_value('accesinternetenable', rcube_utils::INPUT_POST));
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());
		// Liste des attributs à charger
		$attributes = [
			'internet_access_user',
		];
		// Authentification
		if ($user->authentification(Moncompte::get_current_user_password(), true)
				&& $user->load($attributes)) {
			$user->internet_access_user = $acces_internet_enable;
			// Enregistrement de l'utilisateur avec les nouvelles données
			if ($user->save()) {
				// Ok
				if ($user->internet_access_user) {
					rcmail::get_instance()->output->show_message('mel_moncompte.acces_internet_enable_ok', 'confirmation');
				}
				else {
					rcmail::get_instance()->output->show_message('mel_moncompte.acces_internet_disable_ok', 'confirmation');
				}
				return true;
			}
			else {
				// Erreur
				$err = \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError();
				rcmail::get_instance()->output->show_message('mel_moncompte.acces_internet_nok' . $err, 'error');
				return false;
			}
		}
		else {
			// Erreur d'auth
			rcmail::get_instance()->output->show_message('mel_moncompte.acces_internet_nok', 'error');
			return false;
		}
	}	
}