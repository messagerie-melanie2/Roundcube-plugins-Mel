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
 * Classe de modification de l'absence de l'utilisateur
 */
class Gestionnairelistes extends Moncompteobject {
	/**
	 * Est-ce que cet objet Mon compte doit être affiché
	 * 
	 * @return boolean true si l'objet doit être affiché false sinon
	 */
	public static function isEnabled() {
		return rcmail::get_instance()->config->get('enable_moncompte_lists', true);
	}
	
	/**
	 * Chargement des données de l'utilisateur depuis l'annuaire
	 */
	public static function load($plugin = null) {
		rcmail::get_instance()->output->add_handlers(array(
			'liste_listes' 		=> array(__CLASS__, 'readUserListes'),
			'listes_upload_csv' => array(__CLASS__, 'rcmail_upload_csv_form'),
			'searchform'        => array(rcmail::get_instance()->output, 'search_form')
		));
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.moncompte'));
		rcmail::get_instance()->output->send('mel_moncompte.listes');
	}
	
	/**
	 * Modification des données de l'utilisateur depuis l'annuaire
	 */
	public static function change() {

	}

	/**
	 * Récupère la liste des groupes de l'utilisateur
	 * Le retour dans un objet Select HTML
	 * 
	 * @param array $attrib
	 * 
	 * @return string HTML
	 */
	public static function readUserListes($attrib) {
		$select_listes = new html_select($attrib);
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.userlistes');
		// Authentification
		if ($user->authentification(Moncompte::get_current_user_password(), true)) {
			$groups = $user->getGroups(['fullname','dn']);
			if (is_array($groups)) {
				// Tri des groupes par ordre alphabetique
				usort($groups, function($a, $b) {
					return strcasecmp($a->fullname, $b->fullname);
				});
				// Parcours les groupes pour les ajouter au select
				foreach ($groups as $group) {
					$select_listes->add($group->fullname, $group->dn);
				}
			}
		}
		return $select_listes->show();
	}

	/**
	 * Handler pour l'upload de fichiers csv
	 * 
	 * @param array $attrib
	 * @return string HTML
	 */
	public static function rcmail_upload_csv_form($attrib) {
		// set defaults
		$attrib += array('id' => 'rcmUploadform', 'buttons' => 'yes');

		// find max filesize value
		$max_filesize = parse_bytes(ini_get('upload_max_filesize'));
		$max_postsize = parse_bytes(ini_get('post_max_size'));

		if ($max_postsize && $max_postsize < $max_filesize) {
			$max_filesize = $max_postsize;
		}
		$max_filesize = rcmail::get_instance()->show_bytes($max_filesize);

		$input  = new html_inputfield(array('type' => 'file', 'name' => '_listes_csv', 'size' => $attrib['size']));
		$button = new html_inputfield(array('type' => 'button'));
		$hidden_dn_list = new html_hiddenfield(array('id' => 'hidden_dn_list', 'name' => '_dn_list'));
		$hidden_current_username = new html_hiddenfield(array('id' => 'hidden_current_username', 'name' => '_current_username', 'value' => Moncompte::get_current_user_name()));

		$content = $hidden_dn_list->show() . $hidden_current_username->show() . html::div(null, $input->show())
				. html::div('hint', rcmail::get_instance()->gettext(array('name' => 'maxuploadsize', 'vars' => array('size' => $max_filesize))));

		if (rcube_utils::get_boolean($attrib['buttons'])) {
			$content .= html::div('buttons',
				$button->show(rcmail::get_instance()->gettext('close'), array(
					'class'   => 'button',
					'onclick' => "$('#$attrib[id]').hide()"
				))
				. ' ' .
				$button->show(rcmail::get_instance()->gettext('upload'), array(
					'class'   => 'button mainaction',
					'onclick' => rcmail_output::JS_OBJECT_NAME . ".command('upload-listes-csv', this.form)"
				))
			);
		}

		$out = html::div($attrib,
			rcmail::get_instance()->output->form_tag(array(
					'id'      => $attrib['id'] . 'Frm',
					'name'    => 'uploadform',
					'method'  => 'post',
					'enctype' => 'multipart/form-data'
				),
				$content
			)
		);
		rcmail::get_instance()->output->add_gui_object('uploadform', $attrib['id'].'Frm');
		return $out;
	}

	/**
	 * Récupère la liste des membres d'une liste en JSON (seulement si l'utilisateur est auth et owner)
	 */
	public static function readListeMembers() {
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);
		$islistdyn = false;
		$list_emails = [];

		if (isset($dn_list)) {
			// Récupération de l'utilisateur
			$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.userlistes');
			// Authentification
			if ($user->authentification(Moncompte::get_current_user_password(), true)) {
				$group = driver_mel::gi()->getGroup($dn_list, false, true, 'webmail.moncompte.grouplistes');
				if ($group->load(['owners', 'members_email', 'is_dynamic', 'liens_import']) 
						&& $group->isOwner($user)) {
					$list_emails = array_map('strtolower', $group->members_email);
					sort($list_emails);
					$islistdyn = $group->is_dynamic || !empty($group->liens_import);
				}
			}
		}
		$result = array('action' => 'plugin.listes_membres', 'data' => $list_emails, 'dn_list' => $dn_list, 'is_listdyn' => $islistdyn, 'unlock' => $unlock);
		if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($list_emails, true));
		echo json_encode($result);
		exit;
	}

	/**
	 * Ajout d'un membre externe au groupe en fonction de son adresse e-mail (il peut quand même être interne)
	 */
	public static function addExterneMember() {
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$new_smtp = rcube_utils::get_input_value('_new_smtp', rcube_utils::INPUT_POST);
		$unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);
		$list_emails = [];
		$list_members = [];

		if (isset($dn_list)) {
			// Récupération de l'utilisateur
			$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.userlistes');
			// Authentification
			if ($user->authentification(Moncompte::get_current_user_password(), true)) {
				$group = driver_mel::gi()->getGroup($dn_list, false, true, 'webmail.moncompte.grouplistes');
				if ($group->load(['owners', 'members', 'members_email', 'is_dynamic', 'liens_import']) 
						&& $group->isOwner($user)) {
					if (!$group->is_dynamic && empty($group->liens_import)) {
						$list_emails = array_map('strtolower', is_array($group->members_email) ? $group->members_email : []);
						$list_members = is_array($group->members) ? $group->members : [];
						if ($group->authentification(null, true)) {
							$new_member = driver_mel::gi()->member();
							$new_member->email = $new_smtp;
							if ($new_member->load(['uid'])) {
								if (!isset($list_members[$new_member->uid])) {
									$list_members[$new_member->uid] = $new_member;
									$group->members = $list_members;
								}
							}
							if (!in_array($new_smtp, $list_emails)) {
								$list_emails[] = strtolower($new_smtp);
								sort($list_emails);
								$group->members_email = $list_emails;
							}
							$ret = $group->save();
							if (is_null($ret)) {
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::addExterneMember() group->save() ERROR : " . \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError());
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::addExterneMember() group->save() DN : " . $dn_list);
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::addExterneMember() group->save() OBJECT : " . var_export(array('mineqmelmembres' => $list_emails, 'memberuid' => array_keys($list_members)), true));
							}
						}
					}
					
				}
			}
		}
		$result = array('action' => 'plugin.listes_add_externe', 'data' => $list_emails, 'dn_list' => $dn_list, 'unlock' => $unlock);
		if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($list_emails, true));
		echo json_encode($result);
		exit;
	}

	/**
	 * Suppression d'un membre de la liste
	 */
	public static function RemoveMember(){
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$address = rcube_utils::get_input_value('_address', rcube_utils::INPUT_POST);
		$unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);
		$list_emails = [];
		$list_members = [];

		if (isset($dn_list)) {
			// Récupération de l'utilisateur
			$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.userlistes');
			// Authentification
			if ($user->authentification(Moncompte::get_current_user_password(), true)) {
				$group = driver_mel::gi()->getGroup($dn_list, false, true, 'webmail.moncompte.grouplistes');
				if ($group->load(['owners', 'members', 'members_email', 'is_dynamic', 'liens_import']) 
						&& $group->isOwner($user)) {
					if (!$group->is_dynamic && empty($group->liens_import)) {
						$list_emails = array_map('strtolower', is_array($group->members_email) ? $group->members_email : []);
						$list_members = is_array($group->members) ? $group->members : [];
						if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($list_members, true));
						if ($group->authentification(null, true)) {
							$member_to_delete = driver_mel::gi()->member();
							$member_to_delete->email = $address;
							if ($member_to_delete->load(['uid'])) {
								$member_uid = strtolower($member_to_delete->uid);
								// MANTIS 3570: Problème dans la suppression d'un membre d'une liste
								if (isset($list_members[$member_uid])) {
									unset($list_members[$member_uid]);
									$group->members = array_values($list_members);
								}
							}
							// MANTIS 3570: Problème dans la suppression d'un membre d'une liste
							foreach ($list_emails as $key => $value) {
								if (strtolower($value) == strtolower($address)) {
									unset($list_emails[$key]);
									$group->members_email = array_values($list_emails);
								}
							}
							$ret = $group->save();
							if (is_null($ret)) {
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::RemoveMember() ldap_modify ERROR : " . \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError());
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::RemoveMember() ldap_modify DN : " . $dn_list);
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::RemoveMember() ldap_modify OBJECT : " . var_export(array('mineqmelmembres' => $list_emails, 'memberuid' => array_keys($list_members)), true));
							}
						}
					}
				}
			}
		}
		sort($list_emails);
		$result = array('action' => 'plugin.listes_remove', 'data' => $list_emails, 'dn_list' => $dn_list, 'unlock' => $unlock);
		echo json_encode($result);
		exit;
	}

	/**
	 * Vide la liste des membres du groupe
	 */
	public static function RemoveAllMembers() {
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);

		if (isset($dn_list)) {
			// Récupération de l'utilisateur
			$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.userlistes');
			// Authentification
			if ($user->authentification(Moncompte::get_current_user_password(), true)) {
				$group = driver_mel::gi()->getGroup($dn_list, false, true, 'webmail.moncompte.grouplistes');
				if ($group->load(['owners', 'members', 'members_email', 'is_dynamic', 'liens_import']) 
						&& $group->isOwner($user) 
						&& !$group->is_dynamic
						&& empty($group->liens_import)
						&& $group->authentification(null, true)) {
					$group->members = [];
					$group->members_email = [];
					$ret = $group->save();
					if (is_null($ret)) {
						mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::RemoveAllMembers() ldap_modify ERROR : " . \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError());
						mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::RemoveAllMembers() ldap_modify DN : " . $dn_list);
					}
				}
			}
		}
		$result = array('action' => 'plugin.listes_remove_all', 'data' => [], 'dn_list' => $dn_list, 'unlock' => $unlock);
		echo json_encode($result);
		exit;
	}

	/**
	 * Export de la liste des membres du groupe
	 */
	public static function ExportMembers() {
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_GET);

		if (isset($dn_list)) {
			// Récupération de l'utilisateur
			$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.userlistes');
			// Authentification
			if ($user->authentification(Moncompte::get_current_user_password(), true)) {
				$group = driver_mel::gi()->getGroup($dn_list, false, true, 'webmail.moncompte.grouplistes');
				if ($group->load(['owners', 'fullname', 'members_email', 'is_dynamic', 'liens_import']) 
						&& $group->isOwner($user) && !$group->is_dynamic && empty($group->liens_import)) {
					$members = implode("\r\n", $group->members_email);

					$export = '# Export le ' . date('d/m/y') . "\r\n"
							. '# dn: ' . $dn_list . "\r\n"
							. '# cn: ' . $group->fullname . "\r\n"
							. '#' . "\r\n"
							. $members;
				}
			}
		}
		header('Content-Type: application/csv');
		header('Content-disposition: attachment; filename=Export_liste_' . date('d/m/y') . '.csv');
		header('Content-Length: ' . strlen($export));
		echo $export;
		exit;
	}

	/**
	 * Upload d'un fichier CSV pour importer des membres du groupe
	 */
	public function uploadCSVMembers() {
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$list_emails = [];
		
		if (isset($dn_list)) {
			// Récupération de l'utilisateur
			$user = driver_mel::gi()->getUser(Moncompte::get_current_user_name(), true, true, null, null, 'webmail.moncompte.userlistes');
			// Authentification
			if ($user->authentification(Moncompte::get_current_user_password(), true)) {
				$group = driver_mel::gi()->getGroup($dn_list, false, true, 'webmail.moncompte.grouplistes');
				if ($group->load(['owners', 'fullname', 'members_email', 'is_dynamic', 'liens_import']) 
						&& $group->isOwner($user) && !$group->is_dynamic && empty($group->liens_import)) {
					if ($filepath = $_FILES['_listes_csv']['tmp_name']) {
						$lines = file($filepath);
						$members = [];
						$addr_error = [];
						foreach ($lines as $line) {
							if (strpos($line, '#') === 0) {
								continue;
							}
							$line = trim(str_replace(["\"", ",", ";"], "", $line));
							if (rcube_utils::check_email($line)) {
								$members[] = $line;
							} else {
								$addr_error[] = $line;
							}
						}
						$list_emails = array_map('strtolower', is_array($group->members_email) ? $group->members_email : []);
						$list_members = is_array($group->members) ? $group->members : [];
						$members = array_map('strtolower', $members);
						foreach ($members as $member) {
							if (!in_array($member, $list_emails)) {
								
								$list_emails[] = $member;
							}
							$member_to_add = driver_mel::gi()->member();
							$member_to_add->email = $member;
							if ($member_to_add->load(['uid']) 
									&& !isset($list_members[$member_to_add->uid])) {
								$list_members[$member_to_add->uid] = $member_to_add;
							}
						}
						sort($list_emails);
						$group->members_email = $list_emails;
						$group->members = $list_members;
						if ($group->authentification(null, true)) {
							$ret = $group->save();
							if (is_null($ret)) {
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::uploadCSVMembers() ldap_modify ERROR : " . \LibMelanie\Ldap\Ldap::GetInstance(\LibMelanie\Config\Ldap::$MASTER_LDAP)->getError());
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::uploadCSVMembers() ldap_modify DN : " . $dn_list);
							}
						}
					}
				}
			}
		}
		$result = array('action' => 'plugin.listes_upload_csv', 'data' => $list_emails, 'dn_list' => $dn_list, 'addr_error' => $addr_error);
		rcmail::get_instance()->output->command('plugin.import_listes_csv_success', $result);
		rcmail::get_instance()->output->send('iframe');
	}
}
