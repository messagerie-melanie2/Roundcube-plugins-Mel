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

use LibMelanie\Api\Mce\Users\Outofoffice;

/**
* Classe de modification de l'absence de l'utilisateur
*/
class Gestionnaireabsence extends Moncompteobject {
	/**
	* Est-ce que cet objet Mon compte doit être affiché
	* 
	* @return boolean true si l'objet doit être affiché false sinon
	*/
	public static function isEnabled() {
		return rcmail::get_instance()->config->get('enable_moncompte_abs', true);
	}
	
	/**
	* Chargement des données de l'utilisateur depuis l'annuaire
	*/
	public static function load() {
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());
		// Authentification
		if ($user->authentification(rcmail::get_instance()->get_user_password(), true)) {
			// Chargement des informations supplémenaires nécessaires
			$user->load(['outofoffices']);		
			// Message interne
			if (isset($user->outofoffices[Outofoffice::TYPE_INTERNAL])) {
				rcmail::get_instance()->output->set_env('moncompte_absence_debut_interne', $user->outofoffices[Outofoffice::TYPE_INTERNAL]->start_date);
				rcmail::get_instance()->output->set_env('moncompte_absence_fin_interne', $user->outofoffices[Outofoffice::TYPE_INTERNAL]->start_date);
				rcmail::get_instance()->output->set_env('moncompte_absence_status_interne', $user->outofoffices[Outofoffice::TYPE_INTERNAL]->enable ? 'checked' : '');
				rcmail::get_instance()->output->set_env('moncompte_absence_texte_interne', $user->outofoffices[Outofoffice::TYPE_INTERNAL]->message);
			}
			// Message externe
			if (isset($user->outofoffices[Outofoffice::TYPE_EXTERNAL])) {
				rcmail::get_instance()->output->set_env('moncompte_absence_status_externe', $user->outofoffices[Outofoffice::TYPE_EXTERNAL]->enable ? 'checked' : '');
				rcmail::get_instance()->output->set_env('moncompte_absence_texte_externe', $user->outofoffices[Outofoffice::TYPE_EXTERNAL]->message);
			}
			// Gestion du meme message interne/externe
			if (isset($user->outofoffices[Outofoffice::TYPE_INTERNAL]) 
					&& isset($user->outofoffices[Outofoffice::TYPE_EXTERNAL]) 
					&& $user->outofoffices[Outofoffice::TYPE_EXTERNAL]->enable
					&& $user->outofoffices[Outofoffice::TYPE_EXTERNAL]->message == $user->outofoffices[Outofoffice::TYPE_INTERNAL]->message) {
				rcmail::get_instance()->output->set_env('moncompte_abs_radio_same', 'checked');
				rcmail::get_instance()->output->set_env('moncompte_absence_texte_externe_style', 'display: none;');
			} else {
				rcmail::get_instance()->output->set_env('moncompte_abs_radio_diff', 'checked');
			}
		}
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
		rcmail::get_instance()->output->send('mel_moncompte.absence');
	}
	
	/**
	* Modification des données de l'utilisateur depuis l'annuaire
	*/
	public static function change() {
		$date_debut = trim(rcube_utils::get_input_value('absence_date_debut', rcube_utils::INPUT_POST));
		$date_fin = trim(rcube_utils::get_input_value('absence_date_fin', rcube_utils::INPUT_POST));
		$status_interne = trim(rcube_utils::get_input_value('absence_status_interne', rcube_utils::INPUT_POST));
		$status_externe = trim(rcube_utils::get_input_value('absence_texte_externe', rcube_utils::INPUT_POST));
		$message_interne = trim(rcube_utils::get_input_value('absence_message_interne', rcube_utils::INPUT_POST));
		$radio_externe = trim(rcube_utils::get_input_value('absence_reponse_externe', rcube_utils::INPUT_POST));
		$message_externe = trim(rcube_utils::get_input_value('absence_message_externe', rcube_utils::INPUT_POST));

		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name());
		// Authentification
		if ($user->authentification(rcmail::get_instance()->get_user_password(), true)) {
			// Chargement des informations supplémenaires nécessaires
			$user->load(['outofoffices']);
			// Mise a jour des message d'absence
			$outofoffice_interne = new Outofoffice();
			$outofoffice_interne->type = Outofoffice::TYPE_INTERNAL;
			$outofoffice_interne->enable = (isset($status_interne) && $status_interne == '1' );
			$outofoffice_interne->start = isset($date_debut) ? new \DateTime($date_debut) : null;
			$outofoffice_interne->end = isset($date_fin) ? new \DateTime($date_fin) : null;
			$outofoffice_interne->message = $message_interne;
			
			$outofoffice_externe = new Outofoffice();
			$outofoffice_externe->type = Outofoffice::TYPE_EXTERNAL;
			$outofoffice_externe->enable = (isset($status_externe) && $status_externe == '1' );
			$outofoffice_externe->start = isset($date_debut) ? new \DateTime($date_debut) : null;
			$outofoffice_externe->end = isset($date_fin) ? new \DateTime($date_fin) : null;
			$outofoffice_externe->message = isset($radio_externe) && $radio_externe == 'abs_texte_nodiff' ? $message_interne : $message_externe;

			$user->outofoffices = [$outofoffice_interne, $outofoffice_externe];

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
}