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

class valideAcces {
	
	/**
	 * Modification de l'acces par internet
	 */
	static function changeAcces() {
		
		$case_internet = rcube_utils::get_input_value('chk_aiu', rcube_utils::INPUT_POST);

		$info = array();
		if ( !empty($_POST['chk_aiu']) && $case_internet == '1') {
			$info['mineqMelAccesInternetU'] = 1;        // Activer l'Acces Internet U
			$message = rcmail::get_instance()->gettext('inter_acces_ok', 'mel_moncompte');
		} else {
			$info['mineqMelAccesInternetU'] = 0;        // Désactiver l'Acces Internet U
			$message = rcmail::get_instance()->gettext('inter_acces_nok', 'mel_moncompte');
		}
			
		$user_infos = mel::get_user_infos(Moncompte::get_current_user_name());
		$user_dn = $user_infos['dn'];
		
		$auth = Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($user_dn, Moncompte::get_current_user_password());
		
		if(Ldap::GetInstance(Config::$MASTER_LDAP)->modify($user_dn, $info)) {
			rcmail::get_instance()->output->show_message($message, 'confirmation');
		} else {
			$err = Ldap::GetInstance(Config::$MASTER_LDAP)->getError();
			rcmail::get_instance()->output->show_message("Echec de la modification de l'accès par internet : " . $err, 'error');
		}
		
	}
		
}


