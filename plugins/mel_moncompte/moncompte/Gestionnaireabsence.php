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

use LibMelanie\Api\Defaut\Users\Outofoffice;

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
		if ($user->authentification(Moncompte::get_current_user_password(), true)) {
			// Chargement des informations supplémenaires nécessaires
			$user->load(['outofoffices']);
			// Message interne
			$internal_oof = $user->outofoffices[Outofoffice::TYPE_INTERNAL];
			if (isset($internal_oof)) {
				rcmail::get_instance()->output->set_env('moncompte_absence_debut_interne', isset($internal_oof->start) ? $internal_oof->start->format('d/m/Y') : null);
				rcmail::get_instance()->output->set_env('moncompte_absence_fin_interne', isset($internal_oof->end) ? $internal_oof->end->format('d/m/Y') : null);
				rcmail::get_instance()->output->set_env('moncompte_absence_status_interne', $internal_oof->enable ? 'checked' : '');
				rcmail::get_instance()->output->set_env('moncompte_absence_texte_interne', $internal_oof->message);
			}
			// Message externe
			$external_oof = $user->outofoffices[Outofoffice::TYPE_EXTERNAL];
			if (isset($external_oof)) {
				rcmail::get_instance()->output->set_env('moncompte_absence_status_externe', $external_oof->enable ? 'checked' : '');
				rcmail::get_instance()->output->set_env('moncompte_absence_texte_externe', $external_oof->message);
			}
			// Gestion du meme message interne/externe
			if (isset($internal_oof) 
					&& isset($external_oof) 
					&& $external_oof->enable
					&& $external_oof->message == $internal_oof->message) {
				rcmail::get_instance()->output->set_env('moncompte_abs_radio_same', 'checked');
				rcmail::get_instance()->output->set_env('moncompte_absence_texte_externe_style', 'display: none;');
			} else {
				rcmail::get_instance()->output->set_env('moncompte_abs_radio_diff', 'checked');
			}
		}
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
		rcmail::get_instance()->output->send('mel_moncompte.gestionnaireabsence');
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
		if ($user->authentification(Moncompte::get_current_user_password(), true)) {
			// Chargement des informations supplémenaires nécessaires
			$user->load(['outofoffices']);
			// Mise a jour des message d'absence
			$outofoffice_interne = driver_mel::gi()->users_outofoffice();
			$outofoffice_interne->type = Outofoffice::TYPE_INTERNAL;
			$outofoffice_interne->enable = (isset($status_interne) && $status_interne == '1' );
			$outofoffice_interne->start = isset($date_debut) ? \DateTime::createFromFormat('d/m/Y', $date_debut) : null;
			$outofoffice_interne->end = isset($date_fin) ? \DateTime::createFromFormat('d/m/Y', $date_fin) : null;
			$outofoffice_interne->message = $message_interne;
			$outofoffice_interne->order = 50;
			
			$outofoffice_externe = driver_mel::gi()->users_outofoffice();
			$outofoffice_externe->type = Outofoffice::TYPE_EXTERNAL;
			$outofoffice_externe->enable = (isset($status_externe) && $status_externe == '1' );
			$outofoffice_externe->start = isset($date_debut) ? \DateTime::createFromFormat('d/m/Y', $date_debut) : null;
			$outofoffice_externe->end = isset($date_fin) ? \DateTime::createFromFormat('d/m/Y', $date_fin) : null;
			$outofoffice_externe->message = isset($radio_externe) && $radio_externe == 'abs_texte_nodiff' ? $message_interne : $message_externe;
			$outofoffice_externe->order = 60;

			$user->outofoffices = [$outofoffice_interne, $outofoffice_externe];

			// Enregistrement de l'utilisateur avec les nouvelles données
			if ($user->save()) {
				// Ok
				rcmail::get_instance()->output->show_message('mel_moncompte.absence_ok', 'confirmation');
				return true;
			}
			else {
				// Erreur
				$err = \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError();
				rcmail::get_instance()->output->show_message(rcmail::get_instance()->gettext('mel_moncompte.absence_nok') . ' : ' . $err, 'error');
				return false;
			}
		}
		else {
			// Erreur d'auth
			rcmail::get_instance()->output->show_message('mel_moncompte.absence_nok', 'error');
			return false;
		}
	}	
}