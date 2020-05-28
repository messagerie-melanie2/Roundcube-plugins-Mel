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
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());
		// Chargement des informations supplémenaires nécessaires
		$user->load(['is_agriculture', 'liens_import', 'has_bureautique']);
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
		// Est-ce que c'est un utilisateur de l'agriculture ?
		if ($user->is_agriculture) {
			rcmail::get_instance()->output->set_env('moncompte_ministere', 'agri');
			$user_dn = str_replace('AGRI.Lien: ', '', $user->liens_import);
			if (\mel::is_internal()) {
				rcmail::get_instance()->output->set_env('moncompte_dn_agri', 'https://annuaire.agricoll.national.agri/agricoll-liniddm/entry/edit/agentpassword/' . $user_dn);
			}
			else {
				rcmail::get_instance()->output->set_env('moncompte_dn_agri', 'https://annuaire.agricoll.agriculture.gouv.fr/agricoll-liniddm/entry/edit/agentpassword/' . $user_dn);
			}
			// Envoi de la page agri
			rcmail::get_instance()->output->send('mel_moncompte.changepassword_agri');
		}
		else {
			rcmail::get_instance()->output->set_env('moncompte_data_bureautique', $user->has_bureautique);
			rcmail::get_instance()->output->set_env('moncompte_username', Moncompte::get_current_user_name());
			// Envoi de la page
			rcmail::get_instance()->output->send('mel_moncompte.changepassword');
		}
	}
	
	/**
	* Modification des données de l'utilisateur depuis l'annuaire
	*/
	public static function change() {
		$username = trim(rcube_utils::get_input_value('_changepassword_username', rcube_utils::INPUT_POST));
		$old_pwd = trim(rcube_utils::get_input_value('_changepassword_oldpassword', rcube_utils::INPUT_POST));
		$new_pwd = trim(rcube_utils::get_input_value('_changepassword_newpassword', rcube_utils::INPUT_POST));
		$new_pwd_confirm = trim(rcube_utils::get_input_value('_changepassword_newpassword_confirm', rcube_utils::INPUT_POST));
		
		if ($new_pwd == $new_pwd_confirm) {
			try {
				// Récupération des certificats depuis la conf
				$wsamande_cacert = rcmail::get_instance()->config->get('ws_amande_cacert', null);
				$wsamande_verify_peer = rcmail::get_instance()->config->get('ws_amande_verify_peer', true);
				// Configuration SSL pour le WS
				$ssl_config = array(
					'ssl' => array(
						'verify_peer'       => $wsamande_verify_peer,
						'verify_peer_name'  => $wsamande_verify_peer,
						'allow_self_signed' => true
					)
				);
				if (isset($wsamande_cacert)) {
					$ssl_config['ssl']['cafile'] = $wsamande_cacert;
				}
				// Stream context pour les problèmes de certificat
				$streamContext = stream_context_create($ssl_config);
				// Récupération de l'url de ws depuis la conf
				$config_serveurws = rcmail::get_instance()->config->get('ws_changepass');
				// Connexion à WS Amande
				$client_chpwd = new \SoapClient(
					$config_serveurws, 
					array(
						"cache_wsdl" => WSDL_CACHE_NONE,
						'stream_context'  =>  $streamContext,
					)
				);
					
				// Appel a la méthode de modification du mot de passe
				$ret = $client_chpwd->changePasswordMelanie2($username, $old_pwd, $new_pwd, true);
				if ($ret->code === 0) {
					// Succès du changement de mot de passe
					$_SESSION['password'] = rcmail::get_instance()->encrypt($new_pwd);
					rcmail::get_instance()->output->show_message('mel_moncompte.changepassword_confirm', 'confirmation');
					rcmail::get_instance()->output->add_script("parent.$('#changepasswordframe').dialog('close');");
				} else {
					if ($ret->code >= 500 && $ret->code <= 599) {
						// Message d'erreur à l'utilisateur
						rcmail::get_instance()->output->show_message($ret->message, 'error');
						mel_logs::get_instance()->log(mel_logs::ERROR, 'changepassword_convention_error ' . $ret->message);
					} else {
						// Echec du changement du mot de passe
						rcmail::get_instance()->output->show_message($ret->message, 'error');
						mel_logs::get_instance()->log(mel_logs::ERROR, 'changepassword_modification_error ' . $ret->message);
					}
				}
			} catch (Exception $ex) {
				// Echec du changement du mot de passe
				// Erreur d'appel au service Web
				rcmail::get_instance()->output->show_message('mel_moncompte.changepassword_appel_error', 'error');
				mel_logs::get_instance()->log(mel_logs::ERROR, 'changepassword_appel_error ' . $ex->getMessage() . $ex->getTraceAsString());
			}
			
		}
	}	
}