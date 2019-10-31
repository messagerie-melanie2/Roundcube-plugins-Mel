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

class valideInfos {

	/**
	 * Modification des infos personnelles
	 */
	static function changeInfos() {

		$adresse = trim(rcube_utils::get_input_value('addr', rcube_utils::INPUT_POST));
		$codepos = trim(rcube_utils::get_input_value('codpos', rcube_utils::INPUT_POST));
		$ville = trim(rcube_utils::get_input_value('ville', rcube_utils::INPUT_POST));
		$tel = trim(rcube_utils::get_input_value('numtel', rcube_utils::INPUT_POST));
		$fax = trim(rcube_utils::get_input_value('numfax', rcube_utils::INPUT_POST));
		$mobile = trim(rcube_utils::get_input_value('nummob', rcube_utils::INPUT_POST));
		$bureau = trim(rcube_utils::get_input_value('bur', rcube_utils::INPUT_POST));
		
		if (!empty($tel)) $tel = valideInfos::format_tel($tel, 'téléphone');
		if (!empty($fax)) $fax = valideInfos::format_tel($fax, 'fax');
		if (!empty($mobile)) $mobile = valideInfos::format_tel($mobile, 'mobile');
		
// 		if (valideInfos::format_tel($tel) || valideIvalideInfos::format_tel($fax) || nfos::format_tel($mobile) {
// 			exit();
// 		}
		
		if (!empty($codepos) && strlen($codepos) !== 5) {
			$codepos = array();

			rcmail::get_instance()->output->show_message('mel_moncompte.info_err_postal', 'error');
			mel_logs::get_instance()->log(mel_logs::ERROR, 'changepassword_convention_error ' . $ret->message);
		}
		
		$infosperso = array();
		$infosperso['street'] = (!empty($adresse)) ? $adresse : array();
		$infosperso['postalcode'] = (!empty($codepos)) ? $codepos : array();
		$infosperso['l'] = (!empty($ville)) ? $ville : array();
		$infosperso['telephonenumber'] = (!empty($tel)) ? $tel : array();
		$infosperso['facsimiletelephonenumber'] = (!empty($fax)) ? $fax : array();
		$infosperso['mobile'] = (!empty($mobile)) ? $mobile : array();
		$infosperso['roomnumber'] = (!empty($bureau)) ? $bureau : array();
		
		$user_infos = mel::get_user_infos(Moncompte::get_current_user_name());
		
		$user_dn = $user_infos['dn'];
		
		$auth = Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($user_dn, Moncompte::get_current_user_password());
		if(Ldap::GetInstance(Config::$MASTER_LDAP)->modify($user_dn, $infosperso)) {
			rcmail::get_instance()->output->show_message('mel_moncompte.info_modif_ok', 'confirmation');
		} else {
			$err = Ldap::GetInstance(Config::$MASTER_LDAP)->getError();
			rcmail::get_instance()->output->show_message('mel_moncompte.info_modif_nok' . $err, 'error');
		}
	}
	
	/**
	 * Verifie la validite du numero de tel
	 * @param unknown $numero
	 * @param unknown $type
	 * @return string
	 */
	static function format_tel($numero, $type) {
	
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
	



