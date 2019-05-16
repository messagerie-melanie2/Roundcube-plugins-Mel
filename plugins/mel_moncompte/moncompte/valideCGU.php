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

class valideCGUinter {
	
	/**
	 * CGU pour surf authentifie
	 */
	static function changeCGUinter() {
		
		$case_cgu = rcube_utils::get_input_value('chk_cgu', rcube_utils::INPUT_POST);

		if ( !empty($case_cgu)) {			
			$user_infos = mel::get_user_infos(rcmail::get_instance()->get_user_name());
			$user_dn = $user_infos['dn'];
			
			$auth = Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($user_dn, Moncompte::get_current_user_password());
			
			$base = 'dc=equipement,dc=gouv,dc=fr';
			$filter = 'uid=' . rcmail::get_instance()->get_user_name();
			
			$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->search($base, $filter, array('info'));
			
			$_ldapEntree = Ldap::GetInstance(Config::$AUTH_LDAP)->get_entries($ldap_res);
			
			if ((strpos($user_dn, 'ou=departements,ou=organisation,dc=equipement,dc=gouv,dc=fr') !== false)
			   || (strpos($user_dn, 'ou=DDEA,ou=melanie,ou=organisation,dc=equipement,dc=gouv,dc=fr') !== false)) {
				$info['mineqAccesInternet'] = 'DDI-INTERNET-STANDARD';
			} else {
				$info['mineqAccesInternet'] = 'ACCESINTERNET';
			}
			
			if (isset($_ldapEntree[0]['info'][0])) {
				foreach($_ldapEntree[0]['info'] as $i => $val) {
			
					if (stripos($_ldapEntree[0]['info'][$i], 'AccesInternet.Profil') !== false) {
						$prof = explode(':',$_ldapEntree[0]['info'][$i]);
						$info['mineqAccesInternet'] = trim($prof['1']);
					}
			
					if (stripos($_ldapEntree[0]['info'][$i], 'AccesInternet.AcceptationCGUts') !== false) {
						unset($_ldapEntree[0]['info'][$i]);
					}
			
				}

				foreach($_ldapEntree[0]['info'] as $i => $val) {
					$info['info'][$i] = trim($_ldapEntree[0]['info'][$i]);
					$info['info'] = array_values($info['info']);
				}
			}
			$info['info'][] = 'AccesInternet.AcceptationCGUts: ' . gmstrftime('%Y%m%d%H%M%S', time()) . 'Z';
			$mes = rcmail::get_instance()->gettext('inter_CGU_validee', 'mel_moncompte');
			
		} else {
			
			$mes = rcmail::get_instance()->gettext('inter_CGU_unvalidee', 'mel_moncompte');
		}

		if(Ldap::GetInstance(Config::$MASTER_LDAP)->modify($user_dn, $info)) {
			rcmail::get_instance()->output->show_message($mes, 'confirmation');
		} else {
			$err = Ldap::GetInstance(Config::$MASTER_LDAP)->getError();
			rcmail::get_instance()->output->show_message($mes, 'error');
		}
	}
	
}

