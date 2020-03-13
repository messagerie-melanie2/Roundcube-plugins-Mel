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
  * Classe d'affichage et de modification des informations personnelles de l'utilisateur
  */
class Informationspersonnelles extends Moncompteobject {
	/**
     * Est-ce que cet objet Mon compte doit être affiché
	 * 
	 * @return boolean true si l'objet doit être affiché false sinon
     */
	public static function isEnabled() {

	}
	
	/**
	 * Chargement des données de l'utilisateur depuis l'annuaire
	 */
    public static function load() {
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());

		// Positionnement des données
		rcmail::get_instance()->output->set_env('moncompte_data_matricule', $user->employee_number);
		rcmail::get_instance()->output->set_env('moncompte_data_ministere', $user->ministere);
		rcmail::get_instance()->output->set_env('moncompte_data_vpnprofil', $user->vpn_profile_name);
		rcmail::get_instance()->output->set_env('moncompte_data_street', $user->street);
		rcmail::get_instance()->output->set_env('moncompte_data_codepostal', $user->postalcode);
		rcmail::get_instance()->output->set_env('moncompte_data_ville', $user->locality);
		rcmail::get_instance()->output->set_env('moncompte_data_observation', $user->);
		rcmail::get_instance()->output->set_env('moncompte_data_descr', $user->description);
		rcmail::get_instance()->output->set_env('moncompte_data_tel', $user->phonenumber);
		rcmail::get_instance()->output->set_env('moncompte_data_fax', $user->faxnumber);
		rcmail::get_instance()->output->set_env('moncompte_data_mobile', $user->mobilephone);
		rcmail::get_instance()->output->set_env('moncompte_data_bureau', $user->roomnumber);
		rcmail::get_instance()->output->set_env('moncompte_data_fonction', $user->title);
		rcmail::get_instance()->output->set_env('moncompte_data_metier', implode("\n", $user->business_category));
		rcmail::get_instance()->output->set_env('moncompte_data_mission', implode("\n", $user->mission));

		// peut modifier ou pas les infos
		if ($this->myBal->getAutorise() == 'ok') {
			rcmail::get_instance()->output->set_env('moncompte_data_readonly', '');
		} else {
			rcmail::get_instance()->output->set_env('moncompte_data_readonly', 'readonly');
		}

		// Internet A autorise ?
		if ($this->myBal->getAccesInternetAdmin() == '1') {
			rcmail::get_instance()->output->set_env('moncompte_data_internetA', 'oui');
		} else {
			rcmail::get_instance()->output->set_env('moncompte_data_internetA', 'non');
		}

		// Internet U autorise ?
		if ($this->myBal->getAccesInternetUser() == '1') {
			rcmail::get_instance()->output->set_env('moncompte_data_internetU', 'oui');
		} else {
			rcmail::get_instance()->output->set_env('moncompte_data_internetU', 'non');
		}

		// Compte bureautique
		if ($this->myBal->getBureautique() == '1') {
			rcmail::get_instance()->output->set_env('moncompte_data_bureautique', 'oui');
		}
		else {
			rcmail::get_instance()->output->set_env('moncompte_data_bureautique', 'non');
		}
    }

	/**
	 * Modification des données de l'utilisateur depuis l'annuaire
	 */
    public static function change() {
		// Récupérer les données
		$data = [
			'street' => trim(rcube_utils::get_input_value('adresse', rcube_utils::INPUT_POST)),
			'postalcode' => trim(rcube_utils::get_input_value('code_postal', rcube_utils::INPUT_POST)),
			'locality' => trim(rcube_utils::get_input_value('ville', rcube_utils::INPUT_POST)),
			'phonenumber' => trim(rcube_utils::get_input_value('telephone', rcube_utils::INPUT_POST)),
			'faxnumber' => trim(rcube_utils::get_input_value('fax', rcube_utils::INPUT_POST)),
			'mobilephone' => trim(rcube_utils::get_input_value('mobile', rcube_utils::INPUT_POST)),
			'roomnumber' => trim(rcube_utils::get_input_value('bureau', rcube_utils::INPUT_POST)),
		];
		// Formatter les numéros de téléphone
		if (!empty($data['phonenumber'])) $data['phonenumber'] = self::format_tel($data['phonenumber'], 'téléphone');
		if (!empty($data['faxnumber'])) $data['faxnumber'] = self::format_tel($data['faxnumber'], 'fax');
		if (!empty($data['mobilephone'])) $data['mobilephone'] = self::format_tel($data['mobilephone'], 'mobile');

		// Gestion du code postal
		if (!empty($data['postalcode']) && strlen($data['postalcode']) !== 5) {
			rcmail::get_instance()->output->show_message('mel_moncompte.info_err_postal', 'error');
			mel_logs::get_instance()->log(mel_logs::ERROR, 'Erreur de code postal : ' . $data['postalcode']);
			unset($data['postalcode']);
		}

		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());
		// Authentification
		if ($user->authentification(rcmail::get_instance()->get_user_password(), true)) {
			// Alimentation des données
			foreach ($data as $name => $value) {
				$user->$name = $value;
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