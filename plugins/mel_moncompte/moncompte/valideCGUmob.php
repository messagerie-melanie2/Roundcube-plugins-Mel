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

class valideCGUMob {
	
	/**
	 * CGU pour autoriser les synchros mobiles
	 */
	static function changeCGUMob() {
		
		$case_cgu_mob = rcube_utils::get_input_value('chk_cgu_mob', rcube_utils::INPUT_POST);

		if ( !empty($case_cgu_mob)) {		
			$user_infos = mel::get_user_infos(rcmail::get_instance()->get_user_name());
			$user_dn = $user_infos['dn'];
						
			$auth = Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($user_dn, Moncompte::get_current_user_password());
			
			
			$base = 'dc=equipement,dc=gouv,dc=fr';
			$filter = 'uid=' . rcmail::get_instance()->get_user_name();
			$ldap_attrs = array('mineqmelaccessynchrou','mineqmelaccessynchroa');
			
			$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->search($base, $filter, $ldap_attrs);
			$_ldapEntree = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($ldap_res);
			
			if (isset($_ldapEntree[0]['mineqmelaccessynchroa'][0])) {

				$profil = explode('Z--', $_ldapEntree[0]['mineqmelaccessynchroa'][0]);
		
				if(isset($profil[1])) {
					$info['mineqmelaccessynchrou'] = gmstrftime('%Y%m%d%H%M%S', time()) . 'Z--'
							. $profil[1];
				} else {
					$info['mineqmelaccessynchrou'] = gmstrftime('%Y%m%d%H%M%S', time()) . 'Z--'
							. $_ldapEntree[0]['mineqmelaccessynchroa'][0];
				}
		
			} else {
				$info['mineqmelaccessynchrou'] = gmstrftime('%Y%m%d%H%M%S', time()) . 'Z--STANDARD';
			}
			
			if(Ldap::GetInstance(Config::$MASTER_LDAP)->modify($user_dn, $info)) {
				rcmail::get_instance()->output->show_message(rcmail::get_instance()->gettext('inter_CGUmob_success', 'mel_moncompte'), 'confirmation');
			} else {
				$err = Ldap::GetInstance(Config::$MASTER_LDAP)->getError();
				rcmail::get_instance()->output->show_message(rcmail::get_instance()->gettext('inter_CGUmob_error', 'mel_moncompte') . $err, 'error');
			}
		} else {
			rcmail::get_instance()->output->show_message(rcmail::get_instance()->gettext('inter_CGUmob_fake', 'mel_moncompte'), 'error');
		}
	}
}
