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


use LibMelanie\Ldap\Ldap as Ldap;
use LibMelanie\Config\Ldap as Config;

class valideAbsence {

	/**
	 * Modif du gestionnaire d'absence
	 */

	static function changeAbsence() {

		$date_deb = trim(rcube_utils::get_input_value('abs_date_debut', rcube_utils::INPUT_POST));
		$date_fin = trim(rcube_utils::get_input_value('abs_date_fin', rcube_utils::INPUT_POST));
		$case_intra = trim(rcube_utils::get_input_value('abs_texte_intra', rcube_utils::INPUT_POST));
		$case_inter = trim(rcube_utils::get_input_value('abs_texte_inter', rcube_utils::INPUT_POST));
		$msg_intra = trim(rcube_utils::get_input_value('abs_msg_mel', rcube_utils::INPUT_POST));
		$radio_inter = trim(rcube_utils::get_input_value('abs_reponse', rcube_utils::INPUT_POST));
		$msg_inter = trim(rcube_utils::get_input_value('abs_msg_inter', rcube_utils::INPUT_POST));

		// Renseigner les valeurs des attributs
		// Message d'absence pour les destinataires internes
		// MANTIS 3992: Combinsaison "pas de date" et "non activation" mal pris en compte

		$info[Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_response')][0] = '50~ RAIN:' .
				//((isset($date_deb) && $date_deb != '') ? ' DDEB:' : '') .
				' DDEB:' .
				valideAbsence::formatDate($date_deb) .
				//((isset($date_fin) && $date_fin != '') ? ' DFIN:' : '') .
				' DFIN:' .
				((isset($case_intra) && $case_intra == '1' ) ? '' : '0/') .
				valideAbsence::formatDate($date_fin) .
				' TEXTE:' . $msg_intra;

		// Message d'absence pour les destinataires externes
		// DFIN:AAAAMMJJ (actif) ou 0/AAAAMMJJ (non actif)
		// MANTIS 3992: Combinsaison "pas de date" et "non activation" mal pris en compte

		$info[Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_response')][1] = '60~ RAEX:' .
				//((isset($date_deb) && $date_deb != '') ? ' DDEB:' : '') .
		    ' DDEB:' .
				valideAbsence::formatDate($date_deb) .
				//((isset($date_fin) && $date_fin != '') ? ' DFIN:' : '') .
				' DFIN:' .
				((isset($case_inter) && $case_inter == '1' ) ? '' : '0/') .
				valideAbsence::formatDate($date_fin) .
				' TEXTE:' . ((isset($radio_inter) && $radio_inter == 'abs_texte_nodiff') ? $msg_intra : $msg_inter);

		// Connection LDAP
		$user_infos = mel::get_user_infos(Moncompte::get_current_user_name());

		$user_dn = $user_infos['dn'];

		$auth = Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($user_dn, Moncompte::get_current_user_password());
		if(Ldap::GetInstance(Config::$MASTER_LDAP)->modify($user_dn, $info)) {
			rcmail::get_instance()->output->show_message('Les données personnelles ont été modifiées.', 'confirmation');
		} else {
			$err = Ldap::GetInstance(Config::$MASTER_LDAP)->getError();
			rcmail::get_instance()->output->show_message('Echec de la modification des données personnelles : ' . $err, 'error');
		}
	}

	/**
	 * Formate la date de Moncompte gestionnaire absence au format LDAP
	 * @param unknown $date
	 * @return string
	 */


	function formatDate($date) {

		$res = explode('/', $date);
		return $res[2] . $res[1] . $res[0];

	}
}







