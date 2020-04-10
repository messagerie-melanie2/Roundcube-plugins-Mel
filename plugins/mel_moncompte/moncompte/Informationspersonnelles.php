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

use LibMelanie\Api\Mce\Users\Type;

/**
 * Classe d'affichage et de modification des informations personnelles de l'utilisateur
 */
class Informationspersonnelles extends Moncompteobject {
	/**
     * Est-ce que cet objet Mon compte doit être affiché
	 * 
	 * @return boolean true si l'objet doit être affiché false sinon
     */
	public static function isEnabled() {
		return rcmail::get_instance()->config->get('enable_moncompte_infos', true);
	}
	
	/**
	 * Chargement des données de l'utilisateur depuis l'annuaire
	 */
    public static function load() {
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());
		// Liste des attributs à charger
		$attributes = [
			'employee_number',
			'internet_access_admin',
			'ministere',
			'internet_access_user',
			'vpn_profile_name',
			'has_bureautique',
			'street',
			'postalcode',
			'locality',
			'observation',
			'description',
			'phonenumber',
			'faxnumber',
			'mobilephone',
			'roomnumber',
			'title',
			'business_category',
			'mission',
			'photo_src',
			'use_photo_ader',
			'use_photo_intranet',
			'gender',
			'update_personnal_info',
		];
		// Authentification
		if ($user->authentification(rcmail::get_instance()->get_user_password(), true) 
				&& $user->load($attributes)) {
			// Ajouter les attributs à l'environnement pour la template
			foreach ($attributes as $attribute) {
				if ($attribute == 'photo_src' && !isset($user->photo_src)) {
					$value = './fic/avatar' . strtolower($user->gender) . '.png';
				}
				else if ($attribute == 'use_photo_ader') {
					if ($user->$attribute) {
						rcmail::get_instance()->output->set_env('moncompte_photo_ader', 'checked');
					}
					else {
						rcmail::get_instance()->output->set_env('moncompte_photo_ader', '');
					}
				}
				else if ($attribute == 'use_photo_intranet') {
					if ($user->$attribute) {
						rcmail::get_instance()->output->set_env('moncompte_photo_intranet', 'checked');
						rcmail::get_instance()->output->set_env('moncompte_photo_ader_style', '');
					}
					else {
						rcmail::get_instance()->output->set_env('moncompte_photo_intranet', '');
						rcmail::get_instance()->output->set_env('moncompte_photo_ader_style', 'display: none;');
					}
				}
				else {
					if (is_array($user->$attribute)) {
						$value = implode("\n", $user->$attribute);
					}
					else if (is_bool($user->$attribute)) {
						$value = $user->$attribute ? rcmail::get_instance()->gettext('mel_moncompte.info_yes') : rcmail::get_instance()->gettext('mel_moncompte.info_no');
					}
					else {
						$value = $user->$attribute;
					}
				}
				rcmail::get_instance()->output->set_env('moncompte_data_'.$attribute, $value);
			}
			// Gestion du read only
			if ($user->update_personnal_info) {
				rcmail::get_instance()->output->set_env('moncompte_data_readonly', '');
			}
			else {
				rcmail::get_instance()->output->set_env('moncompte_data_readonly', 'readonly');
			}
			// Gestion de la photo
			rcmail::get_instance()->output->set_env('moncompte_data_publication_photo', 
				$user->type == Type::INDIVIDUELLE || $user->type == Type::PERSONNE);
		}
		else {
			// Erreur d'auth
			rcmail::get_instance()->output->show_message('mel_moncompte.info_modif_nok', 'error');
		}
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
		// Envoi de la page
		rcmail::get_instance()->output->send('mel_moncompte.informationspersonnelles');
    }

	/**
	 * Modification des données de l'utilisateur depuis l'annuaire
	 */
    public static function change() {
		// Liste des attributs
		$attributes = [
			'street',
			'postalcode',
			'locality',
			'phonenumber',
			'faxnumber',
			'mobilephone',
			'roomnumber',
			'use_photo_ader',
			'use_photo_intranet',
			'update_personnal_info',
		];
		// Liste des attributs lecture seule
		$attributes_readonly = [
			'use_photo_ader',
			'use_photo_intranet',
		];
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());
		// Authentification
		if ($user->authentification(rcmail::get_instance()->get_user_password(), true)) {
			// Chargement des données
			$user->load($attributes);
			// Readonly ou non ?
			if ($user->update_personnal_info) {
				$_attributes = $attributes;
			}
			else {
				$_attributes = $attributes_readonly;
			}
			// Parcours les attributs
			foreach ($_attributes as $attribute) {
				$data = trim(rcube_utils::get_input_value($attribute, rcube_utils::INPUT_POST));
				if ($attribute == 'phonenumber' || $attribute == 'faxnumber' || $attribute == 'mobilephone') {
					$user->$attribute = self::format_tel($data, $attribute);
				}
				else if ($attribute == 'postalcode') {
					// Gestion du code postal
					if (!empty($data) && strlen($data) !== 5) {
						rcmail::get_instance()->output->show_message('mel_moncompte.info_err_postal', 'error');
						mel_logs::get_instance()->log(mel_logs::ERROR, 'Erreur de code postal : ' . $data);
					}
					else {
						$user->$attribute = $data;
					}
				}
				else {
					$user->$attribute = $data;
				}
			}
			// Enregistrement de l'utilisateur avec les nouvelles données
			if ($user->save()) {
				// Ok
				rcmail::get_instance()->output->show_message('mel_moncompte.info_modif_ok', 'confirmation');
				return true;
			}
			else {
				// Erreur
				$err = \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError();
				rcmail::get_instance()->output->show_message('mel_moncompte.info_modif_nok' . $err, 'error');
				return false;
			}
		}
		else {
			// Erreur d'auth
			rcmail::get_instance()->output->show_message('mel_moncompte.info_modif_nok', 'error');
			return false;
		}
    }

    /**
	 * Verifie la validite du numero de tel
     * 
	 * @param string $numero
	 * @param string $type
	 * @return string
	 */
	private static function format_tel($numero, $type) {
		$numero = str_replace(array(' ','+','-','.'),'',$numero);
		$l = strlen($numero);
	
		if ((preg_match('/^\d*$/',$numero) > 0) && ($l > 9) && ($l < 12)) {
			$numero = substr($numero, -9);
			// Numero metropole
			return '+33' . $numero;
		} else {
			rcmail::get_instance()->output->show_message('mel_moncompte.info_err_tel' . $type, 'error');
			return '';
		}
	}		
}