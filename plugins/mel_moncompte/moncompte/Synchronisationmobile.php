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
 * Classe de gestion de l'accés à la synchronisation mobile de l'utilisateur
 */
class Synchronisationmobile extends Moncompteobject {
	/**
	 * Est-ce que cet objet Mon compte doit être affiché
	 * 
	 * @return boolean true si l'objet doit être affiché false sinon
	 */
	public static function isEnabled() {
		return rcmail::get_instance()->config->get('enable_moncompte_cgu', true);
	}
	
	/**
	* Chargement des données de l'utilisateur depuis l'annuaire
	*/
	public static function load($plugin = null) {
		rcmail::get_instance()->output->add_handlers([
			'validecgumobile' => array(__CLASS__, 'valideCGUmobile'),
		]);
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
		rcmail::get_instance()->output->send('mel_moncompte.synchronisationmobile');
	}
	
	/**
	 * Modification des données de l'utilisateur depuis l'annuaire
	 */
	public static function change() {
		$check_cgu_mobile = trim(rcube_utils::get_input_value('check_cgu_mobile', rcube_utils::INPUT_POST));
		if (isset($check_cgu_mobile) && $check_cgu_mobile == '1') {
			$date = gmstrftime('%Y%m%d%H%M%S', time()) . 'Z';
			// Récupération de l'utilisateur
			$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.synchronisationmobile');
			// Liste des attributs à charger
			$attributes = [
				'acces_synchro_admin_profil',
				'acces_synchro_user_profil',
				'acces_synchro_user_datetime',
			];
			// Authentification
			if ($user->authentification(Moncompte::get_current_user_password(), true)
					&& $user->load($attributes)) {
				$user->acces_synchro_user_profil = $user->acces_synchro_admin_profil;
				$user->acces_synchro_user_datetime = gmstrftime('%Y%m%d%H%M%S', time()) . 'Z';
				// Enregistrement de l'utilisateur avec les nouvelles données
				$ret = $user->save();
				if (!is_null($ret)) {
					// Ok
					rcmail::get_instance()->output->show_message('mel_moncompte.cgu_mobile_success', 'confirmation');
					return true;
				}
				else {
					// Erreur
					$err = \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError();
					rcmail::get_instance()->output->show_message('mel_moncompte.cgu_mobile_error' . $err, 'error');
					return false;
				}
			}
			else {
				// Erreur d'auth
				rcmail::get_instance()->output->show_message('mel_moncompte.cgu_mobile_error', 'error');
				return false;
			}
		}
		else {
			// Case non coché
			rcmail::get_instance()->output->show_message('mel_moncompte.cgu_mobile_fake', 'error');
			return false;
		}
	}

	/**
	 * Handler for CGU mobile
	 * 
	 * @param array $attrib
	 * @return string
	 */
	public static function valideCGUmobile($attrib) {
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.synchronisationmobile');

		// Authentification
		if ($user->authentification(Moncompte::get_current_user_password(), true)) {
			// Chargement des informations supplémenaires nécessaires
			$user->load(['acces_synchro_admin_profil', 'acces_synchro_user_profil', 'acces_synchro_user_datetime', 'acces_synchro_admin_datetime']);	

			$table = new html_table();
			$hidden = new html_hiddenfield(array('value' => '1', 'name' => 'synchronisationmobile'));

			$html = html::tag('fieldset', array(),
					html::tag('legend', array('style' => 'font-style:bold;'), rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_legende'))
			);
			if (isset($user->acces_synchro_admin_profil)) {
				// Profil a change
				if ($user->acces_synchro_user_profil != $user->acces_synchro_admin_profil && isset($user->acces_synchro_user_datetime)) {
					$table->add(array('class' => 'texte_explic', 'colspan' => '2'), rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_texte')
							. html::tag('p', array('style' => 'font-style:bold;'),
									html::a(array('href' => './fic/201409 - CGU Terminaux mobiles.pdf'),
									rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_charte'))));
					$table->add_row();

					$checkbox = new html_checkbox(array('value' => '1', 'name' => 'check_cgu_mobile', 'id' => 'check_cgu_mobile'));
					$table->add(array(), $checkbox->show());
					$table->add(array(), html::label(array('for' => 'check_cgu_mobile'), str_replace(array('%%getProfilMob%%'), array($user->acces_synchro_admin_profil),
						rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_profil_change'))));


					$save = new html_inputfield(array('type' => 'submit', 'class' => 'button mainaction', 'value' => rcmail::get_instance()->gettext('save')));
					$html .= $hidden->show() . $table->show() . $save->show();

				} else {
					// CGU non acceptees
					if (!isset($user->acces_synchro_user_datetime)) {
						$table->add(array('class' => 'texte_explic', 'colspan' => '2'), rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_texte')
								. html::tag('p', array('style' => 'font-style:bold;'),
										html::a(array('href' => './fic/201409 - CGU Terminaux mobiles.pdf'),
											rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_charte'))));
						$table->add_row();

						$checkbox = new html_checkbox(array('value' => '1', 'name' => 'check_cgu_mobile', 'id' => 'check_cgu_mobile'));
						$table->add(array(), $checkbox->show());
						$table->add(array(),
								html::label(array('for' => 'check_cgu_mobile'),
										str_replace('%%getProfilMob%%',
												$user->acces_synchro_admin_profil,
												rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_accept'))));
						$save = new html_inputfield(array('type' => 'submit', 'class' => 'button mainaction', 'value' => rcmail::get_instance()->gettext('save')));
						$html .= $hidden->show() . $table->show() . $save->show();

					} else {
						// CGU deja acceptees
						$table->add(array('class' => 'texte_explic'), rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_texte')
								. html::tag('p', array('style' => 'font-style:bold;'),
										html::a(array('href' => './fic/201409 - CGU Terminaux mobiles.pdf'),
										rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_charte'))));
						$table->add_row();
						$table->add(array(), str_replace('%%getProfilMob%%', $user->acces_synchro_admin_profil,
								str_replace(array('%%getTSMob%%', '%%getProfilMobU%%'), array(date('d/m/Y à H:i', strtotime($user->acces_synchro_user_datetime)), $user->acces_synchro_user_profil),
								rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_ok'))));
						$html .= $hidden->show() . $table->show();
					}
				}
			} else {
				// Non autorise
				$table->add(array('class' => 'texte_explic'), rcmail::get_instance()->gettext('mel_moncompte.cgu_mobile_no'));
				$html .= $table->show();
			}
			return $html;
		}
		return null;
	}
}
