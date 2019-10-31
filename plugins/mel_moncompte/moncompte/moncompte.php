<?php
/**
 * Plugin Mél Moncompte
 *
 * plugin mel_moncompte pour roundcube
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

include_once 'Bal.php';

use LibMelanie\Ldap\Ldap as Ldap;
use LibMelanie\Config\Ldap as Config;

/**
 * Classe de gestion pour Mon compte
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 *
 */
class Moncompte {
	/**
	 * @var  rcmail The one and only instance
	 */
	public $rc;
	/**
	 * @var rcube_plugin Plugin courant
	 */
	private $plugin;

	/**
	 *
	 * @var Bal
	 */
	private $myBal;

	// Construct
	public function __construct($plugin) {
		// Chargement de l'instance rcmail
		$this->rc = rcmail::get_instance();
		// Récupération du plugin courant
		$this->plugin = $plugin;
	}

	/**
	 * Initialisation de l'interface Mon compte
	 */
	public function init()
	{
		$fid = rcube_utils::get_input_value('_fid', rcube_utils::INPUT_GPC);
		if (isset($fid)) {

			$this->rc->output->add_handler('moncompte_balp_list', array($this, 'moncompte_balp_list'));

			switch ($fid) {
				case 'rcmmodifmdp':
				    $this->myBal = new Bal($this);
				    if ($this->myBal->getAgri() == '1') {
				        $this->rc->output->set_env('moncompte_ministere', 'agri');
				        $this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));
				        $this->rc->output->send('mel_moncompte.agripasswd');
				    } else {
    					if (isset($_POST['_changepassword_username'])) {
    						include_once 'validePassword.php';
    						validePassword::changePassword();
    					}
    					$this->rc->output->set_env('moncompte_pwd_user', Moncompte::get_current_user_name());
    					$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));
    					$this->rc->output->send('mel_moncompte.changepassword');
    					break;
				    }

				case 'rcminfoperso':
					if (isset($_POST['hidden_infos'])) {
						include_once 'valideInfosPerso.php';
						valideInfos::changeInfos();
					}
					$this->myBal = new Bal($this);

					$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));

					$this->rc->output->set_env('moncompte_data_matricule', $this->myBal->getMatricule());
					$this->rc->output->set_env('moncompte_data_ministere', $this->myBal->getMinistere());
					$this->rc->output->set_env('moncompte_data_vpnprofil', $this->myBal->getVpnProfil());
					$this->rc->output->set_env('moncompte_data_street', $this->myBal->getAdresse());
					$this->rc->output->set_env('moncompte_data_codepostal', $this->myBal->getCodePostal());
					$this->rc->output->set_env('moncompte_data_ville', $this->myBal->getVille());
					$this->rc->output->set_env('moncompte_data_observation', $this->myBal->getInfo());
					$this->rc->output->set_env('moncompte_data_descr', $this->myBal->getDescription());
					$this->rc->output->set_env('moncompte_data_tel', $this->myBal->getNumTel());
					$this->rc->output->set_env('moncompte_data_fax', $this->myBal->getNumFax());
					$this->rc->output->set_env('moncompte_data_mobile', $this->myBal->getNumMobile());
					$this->rc->output->set_env('moncompte_data_bureau', $this->myBal->getBureau());
					$this->rc->output->set_env('moncompte_data_fonction', $this->myBal->getFonction());
					$this->rc->output->set_env('moncompte_data_metier', $this->myBal->getMetier());
					$this->rc->output->set_env('moncompte_data_mission', $this->myBal->getMission());

					// peut modifier ou pas les infos
					if ($this->myBal->getAutorise() == 'ok') {
						$this->rc->output->set_env('moncompte_data_readonly', '');
					} else {
						$this->rc->output->set_env('moncompte_data_readonly', 'readonly');
					}

					// Internet A autorise ?
					if ($this->myBal->getAccesInternetAdmin() == '1') {
						$this->rc->output->set_env('moncompte_data_internetA', 'oui');
					} else {
						$this->rc->output->set_env('moncompte_data_internetA', 'non');
					}

					// Internet U autorise ?
					if ($this->myBal->getAccesInternetUser() == '1') {
						$this->rc->output->set_env('moncompte_data_internetU', 'oui');
					} else {
						$this->rc->output->set_env('moncompte_data_internetU', 'non');
					}

					// Compte bureautique
					if ($this->myBal->getBureautique() == '1') {
						$this->rc->output->set_env('moncompte_data_bureautique', 'oui');
					}
					else {
						$this->rc->output->set_env('moncompte_data_bureautique', 'non');
					}

					$this->rc->output->send('mel_moncompte.infoperso');
					break;

				case 'rcmaccesinternet':

					if (isset($_POST['hidden_aiu'])) {
						include_once 'valideAcces.php';
						valideAcces::changeAcces();
					}

					if (isset($_POST['hidden_cgu'])) {
						include_once 'valideCGU.php';
						valideCGUinter::changeCGUinter();
					}

					if (isset($_POST['hidden_cgu_mob'])) {
						include_once 'valideCGUmob.php';
						valideCGUMob::changeCGUMob();
					}

					$this->myBal = new Bal($this);

					$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));

					// Internet A autorise ?
					if ($this->myBal->getAccesInternetAdmin() == '1') {
						$this->rc->output->set_env('moncompte_inter_internetA', 'oui');
					} else {
						$this->rc->output->set_env('moncompte_inter_internetA', 'non');
					}

					// Internet U autorise ?
					if ($this->myBal->getAccesInternetUser() == '1') {
						$this->rc->output->set_env('moncompte_inter_internetU_box', 'checked');

					} else {
						$this->rc->output->set_env('moncompte_inter_internetU_box', '');
					}

					// Compte bureautique et acces intranet ?
					if (($this->myBal->getBureautique()) && mel::is_internal()) {
						$this->rc->output->set_env('moncompte_inter_autorise', true);
					} else {
						$this->rc->output->set_env('moncompte_inter_autorise', false);
					}


					$this->rc->output->add_handlers(array('validecguinter' => array($this, 'valideCGUinter'),  //nom de rc:objet, nom de la methode
							'validecgumob' => array($this, 'valideCGUmob'),
					)
					);

					$this->rc->output->send('mel_moncompte.accesinternet');
					break;

				case 'rcmphoto':

					if (isset($_POST['hidden_photo'])) {
						include_once 'validePhoto.php';
						validePhoto::changePhoto();
					}

					$this->myBal = new Bal($this);
					$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));

					// BALI ou PERS
					if ($this->myBal->getPhotoSupport() == 1) {
						$this->rc->output->set_env('moncompte_photo_ok', true);
					} else {
						$this->rc->output->set_env('moncompte_photo_ok', false);
					}

					$photo = $this->myBal->retourPhoto();
					$this->rc->output->set_env('moncompte_photo_value', $photo);

					if ($this->myBal->getPublicationIntranet() == '1') {
						$this->rc->output->set_env('moncompte_photo_intra', 'checked');
					} else {
						$this->rc->output->set_env('moncompte_photo_intra', '');
						$this->rc->output->set_env('moncompte_photo_aff_ader', 'display:none;');
					}

					if ($this->myBal->getPublicationAder() == '1') {
						$this->rc->output->set_env('moncompte_photo_ader', 'checked');
					} else {
						$this->rc->output->set_env('moncompte_photo_ader', '');
					}

					$this->rc->output->send('mel_moncompte.photo');
					break;

				case 'rcmgestionabs':
					if (isset($_POST['abs_date_fin'])) {
						include_once 'valideAbsence.php';
						valideAbsence::changeAbsence();
					}

					$this->myBal = new Bal($this);
					$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));

					$start_date = ''; $stop_date = '';
					$this->myBal->getDatesMelanie($start_date, $stop_date);

					if (is_array($start_date)) {
						$this->rc->output->set_env('moncompte_abs_deb_intra', implode('/', $start_date));
					}
					if (is_array($stop_date)) {
						$this->rc->output->set_env('moncompte_abs_fin_intra', implode('/', $stop_date));
					}

					$this->rc->output->set_env('moncompte_abs_status_intra', $this->myBal->getStatusMelanie() ? 'checked' : '');
					$this->rc->output->set_env('moncompte_abs_status_inter', $this->myBal->getStatusInternet() ? 'checked' : '');
					$this->rc->output->set_env('moncompte_abs_texte_intra', $this->myBal->getMsgMelanie());
					$this->rc->output->set_env('moncompte_abs_texte_inter', $this->myBal->getMsgInternet());

					if ($this->myBal->doesInternetUseSameMsg()) {
						$this->rc->output->set_env('moncompte_abs_radio_same', 'checked');
						$this->rc->output->set_env('moncompte_abs_texte_inter_style', 'display: none;');
					} else {
						$this->rc->output->set_env('moncompte_abs_radio_diff', 'checked');
					}

					$this->rc->output->send('mel_moncompte.absence');
					break;

				case 'rcmstatszp':
					$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));
					$this->rc->output->add_handlers(array('statszp' => array($this, 'statsZP'),));
					$this->rc->output->send('mel_moncompte.zpstats');
					break;

				case 'rcmgestionlists':
					$this->rc->output->add_handlers(array(
  					'liste_listes' => array($this, 'readUserListes'),
  					'listes_upload_csv' => array($this, 'rcmail_upload_csv_form'),
  					'searchform'          => array($this->rc->output, 'search_form')
					));
					$this->rc->output->send('mel_moncompte.listes');
					break;
				default:
				case '':
					$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));
					$this->rc->output->send();
					break;
			}
		}
		else {
			// register UI objects
			$this->rc->output->add_handlers(array(
					'mel_moncompte_options_list'    => array($this, 'options_list'),
					'mel_moncompte_option_frame'    => array($this, 'option_frame'),
			));
			$this->rc->output->include_script('list.js');
			$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));
			$this->rc->output->send('mel_moncompte.moncompte');
		}
	}

	/**
	 * Affiche la liste des éléments de mon compte
	 * @param array $attrib
	 * @return string
	 */
	public function options_list($attrib) {
		// add id to message list table if not specified
		if (!strlen($attrib['id']))
			$attrib['id'] = 'rcmoptionslist';

		// define list of cols to be displayed
		$a_show_cols = array('name');
		
		$result = array();
		
		// Ajout du menu Accet Internet
		if ($this->rc->config->get('enable_moncompte_cgu', true)) {
		    $result[] = array('id' => 'rcmaccesinternet', 'name' => $this->plugin->gettext('accesinternet'), 'class' => '');
		}
		// Ajout du menu Gestionnaire d'absence
		if ($this->rc->config->get('enable_moncompte_abs', true)) {
		    $result[] = array('id' => 'rcmgestionabs', 'name' => $this->plugin->gettext('gestionabs'), 'class' => '');
		}
		// Ajout du menu gestion des Listes
		if ($this->rc->config->get('enable_moncompte_lists', true)) {
		    $result[] = array('id' => 'rcmgestionlists', 'name' => $this->plugin->gettext('gestionlists'), 'class' => '');
		}
		// Ajout du menu informations personnelles
		if ($this->rc->config->get('enable_moncompte_infos', true)) {
		    $result[] = array('id' => 'rcminfoperso', 'name' => $this->plugin->gettext('infoperso'), 'class' => '');
		}
		// Ajout du menu modification du mot de passe
		if ($this->rc->config->get('enable_moncompte_mdp', true)) {
		    $result[] = array('id' => 'rcmmodifmdp', 'name' => $this->plugin->gettext('modifmdp'), 'class' => '');
		}
		// Ajout du menu gestion de la photo
		if ($this->rc->config->get('enable_moncompte_photo', true)) {
		    $result[] = array('id' => 'rcmphoto', 'name' => $this->plugin->gettext('photo'), 'class' => '');
		}

		// create XHTML table
		$out = $this->rc->table_output($attrib, $result, $a_show_cols, 'id');

		// set client env
		$this->rc->output->add_gui_object('mel_moncompte_options_list', $attrib['id']);

		return $out;
	}
	/**
	 * Gestion de la frame
	 * @param array $attrib
	 * @return string
	 */
	public function option_frame($attrib) {
		if (!$attrib['id'])
			$attrib['id'] = 'rcmoptionframe';

		$attrib['name'] = $attrib['id'];

		$this->rc->output->set_env('contentframe', $attrib['name']);
		$this->rc->output->set_env('blankpage', $attrib['src'] ?
				$this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');

		return $this->rc->output->frame($attrib);
	}
	/**
	 *
	 * @param unknown $attrib
	 * @return string
	 */
	public function valideCGUinter($attrib) {

		//		if (($this->myBal->getBureautique()) && mel::is_internal()) {
		if (mel::is_internal()) {
			$tab = new html_table();

	// CGU pour DDI

			$user = mel::get_user_infos(Moncompte::get_current_user_name());
			$userDN = $user['dn'];
			if ((strpos($userDN, 'ou=departements,ou=organisation,dc=equipement,dc=gouv,dc=fr') !== false)
			|| ((strpos($userDN, 'ou=DDEA,ou=melanie,ou=organisation,dc=equipement,dc=gouv,dc=fr') !== false))) {
				$tab->add(array('class' => 'texte_explic', 'colspan' => '2'),
						$this->plugin->gettext('inter_CGU-DDI_texte')
						. html::tag('p', array('style' => 'font-style:bold;'), html::a(array('href' => "./fic/Charte des usages de l'Internet en DDI V3.4.pdf"), $this->plugin->gettext('inter_CGU_dl2')))
						. $this->plugin->gettext('inter_CGU-DDI_texte2')
				);
			} else {
				$tab->add(array('class' => 'texte_explic', 'colspan' => '2'),
						$this->plugin->gettext('inter_CGU_texte')
						. html::tag('p', array('style' => 'font-style:bold;'), html::a(array('href' => './fic/CGU_Charte_Internet.pdf'), $this->plugin->gettext('inter_CGU_dl')))
				);
			}
// ---------------  
			$tab->add_row();
			$ts = new html_hiddenfield(array('value' => '1', 'name' => 'hidden_cgu'));

			if ($this->myBal->isTS() == '0') {
				$checkbox = new html_checkbox(array('value' => gmstrftime('%Y%m%d%H%M%S', time()) . 'Z','name' => 'chk_cgu', 'id' => 'chk_cgu'));
				$tab->add(array(), $checkbox->show());
				$tab->add(array(), html::label(array('for' => 'chk_cgu'), str_replace('%%getProfil%%', $this->myBal->getProfil(), $this->plugin->gettext('inter_CGU_accept'))));
				$enreg = new html_inputfield(array('type' => 'submit', 'class' => 'button mainaction', 'value' => $this->rc->gettext('save')));
				$html_button = $enreg->show();
			} else {
				$tab->add(array(), str_replace(array('%%getTS%%', '%%getProfil%%'), array($this->myBal->getTS(), $this->myBal->getProfil()), $this->plugin->gettext('inter_CGU_date')));

				$html_button = '';
			}

			$html = html::tag('fieldset', array(),
					html::tag('legend', array('style' => 'font-style:bold;'), $this->plugin->gettext('inter_CGU_legend'))
					. html::tag('br')
					. $ts->show()
					. $tab->show()
					. $html_button
			);
		} else {
			$html = '';
		}

		return $html;
	}
	/**
	 *
	 * @param unknown $attrib
	 * @return string
	 */
	public function valideCGUmob($attrib) {
		$tab = new html_table();
		$ts = new html_hiddenfield(array('value' => '1', 'name' => 'hidden_cgu_mob'));

		$html = html::tag('fieldset', array(),
				html::tag('legend', array('style' => 'font-style:bold;'), $this->plugin->gettext('inter_CGUmob_legend'))
		);
		if ($this->myBal->isProfilMobA()) {

			// Profil a change
			if (($this->myBal->getProfilMobU() != $this->myBal->getProfilMobA()) && ($this->myBal->isTSMob() != '0')) {

				$tab->add(array('class' => 'texte_explic', 'colspan' => '2'), $this->plugin->gettext('inter_CGUmob_texte')
						. html::tag('p', array('style' => 'font-style:bold;'),
								html::a(array('href' => './fic/201409 - CGU Terminaux mobiles.pdf'),
										$this->plugin->gettext('inter_CGUmob_dl'))));
				$tab->add_row();

				$chkbox = new html_checkbox(array('value' => gmstrftime('%Y%m%d%H%M%S', time()) . 'Z', 'name' => 'chk_cgu_mob', 'id' => 'chk_cgu_mob'));
				$tab->add(array(), $chkbox->show());
				$tab->add(array(), html::label(array('for' => 'chk_cgu_mob'), str_replace(array('%%getProfilMob%%'), array($this->myBal->getProfilMobA()),
						$this->plugin->gettext('inter_CGUmob_profil_change'))));


				$enreg = new html_inputfield(array('type' => 'submit', 'class' => 'button mainaction', 'value' => $this->rc->gettext('save')));
				$html .= $ts->show() . $tab->show() . $enreg->show();

			} else {
				// CGU non acceptees
				if ($this->myBal->isTSMob() == '0') {

					$tab->add(array('class' => 'texte_explic', 'colspan' => '2'), $this->plugin->gettext('inter_CGUmob_texte')
							. html::tag('p', array('style' => 'font-style:bold;'),
									html::a(array('href' => './fic/201409 - CGU Terminaux mobiles.pdf'),
											$this->plugin->gettext('inter_CGUmob_dl'))));
					$tab->add_row();

					$chkbox = new html_checkbox(array('value' => gmstrftime('%Y%m%d%H%M%S', time()) . 'Z', 'name' => 'chk_cgu_mob', 'id' => 'chk_cgu_mob'));
					$tab->add(array(), $chkbox->show());
					$tab->add(array(),
							html::label(array('for' => 'chk_cgu_mob'),
									str_replace('%%getProfilMob%%',
											$this->myBal->getProfilMobA(),
											$this->plugin->gettext('inter_CGUmob_accept'))));
					$enreg = new html_inputfield(array('type' => 'submit', 'class' => 'button mainaction', 'value' => $this->rc->gettext('save')));
					$html .= $ts->show() . $tab->show() . $enreg->show();

				} else {
					// CGU deja acceptees
					$tab->add(array('class' => 'texte_explic'), $this->plugin->gettext('inter_CGUmob_texte')
							. html::tag('p', array('style' => 'font-style:bold;'),
									html::a(array('href' => './fic/201409 - CGU Terminaux mobiles.pdf'),
											$this->plugin->gettext('inter_CGUmob_dl'))));
					$tab->add_row();
					$tab->add(array(), str_replace('%%getProfilMob%%', $this->myBal->getProfilMobA(),
							str_replace(array('%%getTSMob%%', '%%getProfilMobU%%'), array($this->myBal->getTSMob(), $this->myBal->getProfilMobU()),
									$this->plugin->gettext('inter_CGUmob_ok'))));
					$html .= $ts->show() . $tab->show();
				}
			}
		} else {
			// Non autorise
			$tab->add(array('class' => 'texte_explic'), $this->plugin->gettext('inter_CGUmob_no'));
			$html .= $tab->show();
		}
		return $html;

	}
	/**
	 *
	 * @param unknown $attrib
	 * @return string
	 */
	public function readUserListes($attrib) {
		$select_listes = new html_select($attrib);

		$base_dn = Ldap::GetInstance(Config::$MASTER_LDAP)->getConfig('base_dn');
		$user = mel::get_user_infos(Moncompte::get_current_user_name());
		$userDN = $user['dn'];
		$filter = '(&(objectclass=mineqMelListe)(owner='. $userDN. '))';
		$ldap_attrs = array ('cn', 'dn');
		$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->search($base_dn, $filter, $ldap_attrs);

		$liste_listes = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($ldap_res);

		if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($liste_listes, true));

		if (is_array($liste_listes)) {
		    if ($liste_listes['count'] > 0) $this->rc->output->set_env('moncompte_listes_exist', 'true');
			unset($liste_listes['count']);
			//Mantis 4937 classer les listes
			function cmp($a, $b) {
			    return strcasecmp($a['cn'][0], $b['cn'][0]);
			}
			usort($liste_listes, 'cmp');
			//if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($liste_listes, true));
			foreach ($liste_listes as $key => $liste) {
				$select_listes->add($liste['cn'][0], $liste['dn']);
			}

		}

		return $select_listes->show();
	}
	/**
	 *
	 */
	public function readListeMembers() {
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);
		$islistdyn = false;
		
		if (isset($dn_list)
		&& $this->isOwnerListe($dn_list)) {
			$res = explode(',', $dn_list, 2);
			if (count($res) == 2) {
				$base_dn = $res[1];
				$filter = $res[0];
				$ldap_attrs = array('mineqmelmembres', 'objectclass');

				$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->list($base_dn, $filter, $ldap_attrs);
				$liste = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($ldap_res);
				$liste_members = $liste[0]['mineqmelmembres'];
				unset($liste_members['count']);
				$islistdyn = in_array('labeledURIObject', $liste[0]['objectclass']);
			}
		}
		if (!is_array($liste_members)) {
			$liste_members = array();
		}
		$liste_members = array_map('strtolower', $liste_members);
		sort($liste_members);
		$result = array('action' => 'plugin.listes_membres', 'data' => $liste_members, 'dn_list' => $dn_list, 'is_listdyn' => $islistdyn, 'unlock' => $unlock);
		if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($liste_members, true));
		echo json_encode($result);
		exit;
	}
	/**
	 *
	 */
	public function addExterneMember() {
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$new_smtp = rcube_utils::get_input_value('_new_smtp', rcube_utils::INPUT_POST);
		$unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);

		$liste_members = array();
		if (isset($dn_list)
		&& $this->isOwnerListe($dn_list)) {
			$res = explode(',', $dn_list, 2);
			if (count($res) == 2) {
				$base_dn = $res[1];
				$filter = $res[0];
				$ldap_attrs = array('mineqmelmembres', 'memberuid', 'objectclass');

				$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->list($base_dn, $filter, $ldap_attrs);
				$liste = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($ldap_res);
				
				if(!in_array('labeledURIObject', $liste[0]['objectclass'])) {
					$liste_members = $liste[0]['mineqmelmembres'];
					$liste_uid = $liste[0]['memberuid'];
					unset($liste_members['count']);
					unset($liste_uid['count']);
					// Bug dans la gestion de la liste
					if (!is_array($liste_members)) {
						$liste_members = [];
					}
					if (!is_array($liste_uid)) {
						$liste_uid = [];
					}
	
					$liste_members = array_map('strtolower', $liste_members);
					if (!in_array(strtolower($new_smtp), $liste_members)) {
						if (Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($this->rc->config->get('liste_admin'), $this->rc->config->get('liste_pwd'))) {
							$member_infos = Ldap::GetUserInfosFromEmail($new_smtp);
							if (isset($member_infos)) {
								$member_uid = $member_infos['uid'][0];
								$liste_uid[] = $member_uid;
							}
							$liste_members[] = strtolower($new_smtp);
							if (!Ldap::GetInstance(Config::$MASTER_LDAP)->modify($dn_list, array('mineqmelmembres' => $liste_members, 'memberuid' => $liste_uid))) {
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::addExterneMember() ldap_modify ERROR : " . Ldap::GetInstance(Config::$MASTER_LDAP)->getError());
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::addExterneMember() ldap_modify DN : " . $dn_list);
								mel_logs::get_instance()->log(mel_logs::ERROR, "moncompte::addExterneMember() ldap_modify OBJECT : " . var_export(array('mineqmelmembres' => $liste_members, 'memberuid' => $liste_uid), true));
							}
						}
					}
				}
			}
		}
		$liste_members = array_map('strtolower', $liste_members);
		sort($liste_members);
		$result = array('action' => 'plugin.listes_add_externe', 'data' => $liste_members, 'dn_list' => $dn_list, 'unlock' => $unlock);
		if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($liste_members, true));
		echo json_encode($result);
		exit;
	}
	/**
	 *
	 */
	public function RemoveMember(){
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$address = rcube_utils::get_input_value('_address', rcube_utils::INPUT_POST);
		$unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);

		$liste_members = array();
		if (isset($dn_list)
		&& $this->isOwnerListe($dn_list)) {
			$res = explode(',', $dn_list, 2);
			if (count($res) == 2) {
				$base_dn = $res[1];
				$filter = $res[0];
				$ldap_attrs = array('mineqmelmembres', 'memberuid', 'objectclass');

				$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->list($base_dn, $filter, $ldap_attrs);
				$liste = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($ldap_res);
				$liste_members = $liste[0]['mineqmelmembres'];
				$liste_uid = $liste[0]['memberuid'];
				unset($liste_members['count']);
				unset($liste_uid['count']);

				if(!in_array('labeledURIObject', $liste[0]['objectclass'])) {
					if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($liste_members, true));
					if (Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($this->rc->config->get('liste_admin'), $this->rc->config->get('liste_pwd'))) {
						$address = strtolower($address);
						$member_infos = Ldap::GetUserInfosFromEmail($address);
						if (isset($member_infos)) {
							$member_uid = strtolower($member_infos['uid'][0]);
							// MANTIS 3570: Problème dans la suppression d'un membre d'une liste
							foreach ($liste_uid as $key => $value) {
								if (strtolower($value) == $member_uid) {
									unset($liste_uid[$key]);
								}
							}
							$liste_uid = array_values($liste_uid);
						}
						// MANTIS 3570: Problème dans la suppression d'un membre d'une liste
						foreach ($liste_members as $key => $value) {
							if (strtolower($value) == $address) {
								unset($liste_members[$key]);
							}
						}
						$liste_members = array_values($liste_members);
						if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($liste_members, true));
						Ldap::GetInstance(Config::$MASTER_LDAP)->modify($dn_list, array('mineqMelMembres' => $liste_members, 'memberUid' => $liste_uid));
						if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, Ldap::GetInstance(Config::$MASTER_LDAP)->getError());
					}
				}
			}
		}
		$liste_members = array_map('strtolower', $liste_members);
		sort($liste_members);
		$result = array('action' => 'plugin.listes_remove', 'data' => $liste_members, 'dn_list' => $dn_list, 'unlock' => $unlock);
		echo json_encode($result);
		exit;

	}
	/**
	 *
	 */
	public function RemoveAllMembers() {
		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);
		$unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_POST);

		if (isset($dn_list)
		&& $this->isOwnerListe($dn_list)) {
			if (Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($this->rc->config->get('liste_admin'), $this->rc->config->get('liste_pwd'))) {
				Ldap::GetInstance(Config::$MASTER_LDAP)->modify($dn_list, array('mineqMelMembres' => array(), 'memberUid' => array()));
				if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, Ldap::GetInstance(Config::$MASTER_LDAP)->getError());
			}
		}
		$result = array('action' => 'plugin.listes_remove_all', 'data' => array(), 'dn_list' => $dn_list, 'unlock' => $unlock);
		echo json_encode($result);
		exit;

	}
	/**
	 *
	 */
	public function ExportMembers() {
		if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, "[ExportMembers] ".var_export($_GET, true));

		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_GET);
		$export = "";
		if (isset($dn_list)
		&& $this->isOwnerListe($dn_list)) {
			$res = explode(',', $dn_list, 2);
			if (count($res) == 2) {
				$base_dn = $res[1];
				$filter = $res[0];
				$ldap_attrs = array('mineqmelmembres', 'cn');

				$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->list($base_dn, $filter, $ldap_attrs);
				$liste = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($ldap_res);
				$members = $liste[0]['mineqmelmembres'];
				unset($members['count']);

				if(!in_array('labeledURIObject', $liste[0]['objectclass'])) {
					$members = implode("\r\n", $members);
	
					$export = '# Export le ' . date('d/m/y') . "\r\n"
							. '# dn: ' . $dn_list . "\r\n"
							. '# cn: ' . $liste[0]['cn'][0] . "\r\n"
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
	 *
	 * @param unknown $dn_list
	 * @return boolean
	 */
	private function isOwnerListe($dn_list) {
		$res = explode(',', $dn_list, 2);
		$liste_listes = array();

		if (count($res) == 2) {
			$base_dn = $res[1];
			$filter = $res[0];

			$user = mel::get_user_infos(self::get_current_user_name());
			$userDN = $user['dn'];
			if (Ldap::GetInstance(Config::$AUTH_LDAP)->authenticate($userDN, self::get_current_user_password())) {
				$filter = '(&(' . $filter . ')(owner='. $userDN. '))';
				$ldap_attrs = array ('dn');
				$ldap_res = Ldap::GetInstance(Config::$AUTH_LDAP)->list($base_dn, $filter, $ldap_attrs);

				$liste_listes = Ldap::GetInstance(Config::$AUTH_LDAP)->get_entries($ldap_res);
				unset($liste_listes['count']);
			}
		}
		return count($liste_listes) == 1;
	}
	/**
	 *
	 * @param unknown $attrib
	 * @return string
	 */
	public function rcmail_upload_csv_form($attrib) {
		// set defaults
		$attrib += array('id' => 'rcmUploadform', 'buttons' => 'yes');

		// find max filesize value
		$max_filesize = parse_bytes(ini_get('upload_max_filesize'));
		$max_postsize = parse_bytes(ini_get('post_max_size'));

		if ($max_postsize && $max_postsize < $max_filesize) {
			$max_filesize = $max_postsize;
		}
		$max_filesize = $this->rc->show_bytes($max_filesize);

		$input  = new html_inputfield(array('type' => 'file', 'name' => '_listes_csv', 'size' => $attrib['size']));
		$button = new html_inputfield(array('type' => 'button'));
		$hidden_dn_list = new html_hiddenfield(array('id' => 'hidden_dn_list', 'name' => '_dn_list'));
		$hidden_current_username = new html_hiddenfield(array('id' => 'hidden_current_username', 'name' => '_current_username', 'value' => Moncompte::get_current_user_name()));

		$content = $hidden_dn_list->show() . $hidden_current_username->show() . html::div(null, $input->show())
		. html::div('hint', $this->rc->gettext(array('name' => 'maxuploadsize', 'vars' => array('size' => $max_filesize))));

		if (rcube_utils::get_boolean($attrib['buttons'])) {
			$content .= html::div('buttons',
					$button->show($this->rc->gettext('close'), array(
							'class'   => 'button',
							'onclick' => "$('#$attrib[id]').hide()"
					))
					. ' ' .
					$button->show($this->rc->gettext('upload'), array(
							'class'   => 'button mainaction',
							'onclick' => rcmail_output::JS_OBJECT_NAME . ".command('upload-listes-csv', this.form)"
					))
			);
		}

		$out = html::div($attrib,
				$this->rc->output->form_tag(array(
						'id'      => $attrib['id'] . 'Frm',
						'name'    => 'uploadform',
						'method'  => 'post',
						'enctype' => 'multipart/form-data'
				),
						$content
				)
		);

		$this->rc->output->add_gui_object('uploadform', $attrib['id'].'Frm');

		return $out;
	}
	/**
	 *
	 */
	public function uploadCSVMembers() {

		$dn_list = rcube_utils::get_input_value('_dn_list', rcube_utils::INPUT_POST);

		if (isset($dn_list) && $this->isOwnerListe($dn_list)) {
			if ($filepath = $_FILES['_listes_csv']['tmp_name']) {
				$lines = file($filepath);
				$members = array();
				$addr_error = array();
				foreach ( $lines as $line)
				{
					if (strpos($line, '#') === 0) {
						continue;
					}
					$line = trim( str_replace (array("\"", ",", ";") , "", $line));
					if (rcube_utils::check_email($line)) {
						$members[] = $line;
					} else {
						$addr_error[] = $line;
					}
				}
				$res = explode(',', $dn_list, 2);

				if (count($res) == 2) {
					$base_dn = $res[1];
					$filter = $res[0];
					$ldap_attrs = array('mineqmelmembres', 'memberuid');

					$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->list($base_dn, $filter, $ldap_attrs);
					$liste = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($ldap_res);
					$liste_members = $liste[0]['mineqmelmembres'];
					$liste_uid = $liste[0]['memberuid'];
					unset($liste_members['count']);
					unset($liste_uid['count']);

					$ismodified = false;
					$liste_members = array_map('strtolower', $liste_members);
					$members = array_map('strtolower', $members);
					foreach ($members as $member) {
						if (!in_array($member, $liste_members)) {
							$liste_members[] = $member;
							$ismodified = true;
							if (count($members) < 5000) {
								$member_infos = Ldap::GetUserInfosFromEmail($member);
								if (isset($member_infos)) {
									$member_uid = $member_infos['uid'][0];
									$liste_uid[] = $member_uid;
								}
							}
						}
					}

					if ($ismodified) {
						if (Ldap::GetInstance(Config::$MASTER_LDAP)->authenticate($this->rc->config->get('liste_admin'), $this->rc->config->get('liste_pwd'))) {
							Ldap::GetInstance(Config::$MASTER_LDAP)->modify($dn_list, array('mineqmelmembres' => $liste_members, 'memberuid' => $liste_uid));
						}
					}
				}
			}
		}
		$liste_members = array_map('strtolower', $liste_members);
		sort($liste_members);
		$result = array('action' => 'plugin.listes_upload_csv', 'data' => $liste_members, 'dn_list' => $dn_list, 'addr_error' => $addr_error);
		$this->rc->output->command('plugin.import_listes_csv_success', $result);
		$this->rc->output->send('iframe');
	}

	/**
	 * Génération de la liste des balp pour l'utilisateur courant
	 * @param array $attrib Liste des paramètres de la liste
	 * @return string HTML
	 */
	public function moncompte_balp_list($attrib) {
		if (!$attrib['id'])
			$attrib['id'] = 'rcmmoncomptebalplist';

		// Récupération de la liste des balp de l'utilisateur
		$balp_list = mel::get_user_balp_gestionnaire($this->rc->get_user_name());
		// AJoute le javascript
		// TODO: a faire en jquery
		//		$attrib['onchange'] = "self.location = self.location + '&_current_username=' + this.value;";
		// Génération du select html
		$html_select = new html_select($attrib);

		$infos = mel::get_user_infos($this->rc->get_user_name());
		$html_select->add($infos['cn'][0], $infos['uid'][0]);

		// Parcour la liste des boites et ajoute les options
		if (is_array($balp_list)) {
			foreach($balp_list as $balp) {
				if (!isset($balp['uid']))
					continue;
				if (strpos($balp['uid'][0], '.-.')) {
					$name = explode('.-.', $balp['uid'][0]);
					$name = $name[1];
				} else {
					$name = $balp['uid'][0];
				}
				$infos = mel::get_user_infos($name);
				$html_select->add($infos['cn'][0], $name);
			}
		}
		return $html_select->show(Moncompte::get_current_user_name());
	}

	/**
	 * Retourne le username courant pour mon compte
	 * Utilise la liste pour le déterminer
	 */
	public static function get_current_user_name() {
		if (isset($_GET['_current_username'])
		    || isset($_POST['_current_username'])) {
			return trim(rcube_utils::get_input_value('_current_username', rcube_utils::INPUT_GPC));
		} else {
			//			return $this->rc->get_user_name();
			return rcmail::get_instance()->get_user_name();
		}
	}
	
	/**
	 * Retourne le password de l'utilisateur
	 * Transformé si besoin pour le pam MCE
	 * @return string
	 */
	public static function get_current_user_password() {
	  // Récupération des informations sur l'utilisateur connecté
	  $user_infos = mel::get_user_infos(rcmail::get_instance()->get_user_name());
	  
	  // MANTIS 0005002: [MAA] Modification de mdp pour les BALF
	  $password = rcmail::get_instance()->get_user_password();
	  if (isset($user_infos['mineqliensimport'])
	      && isset($user_infos['mineqliensimport'][0])
	      && strpos($user_infos['mineqliensimport'][0], 'AGRI.Lien: uid=') === 0
	      && rcmail::get_instance()->get_user_name() != self::get_current_user_name()) {
      $liensImport = str_replace('AGRI.Lien: uid=', '', $user_infos['mineqliensimport'][0]);
      $liensImport = explode(',', $liensImport, 2);
      $password = '{"uid":"' . $liensImport[0] . '","password":"' . $password . '"}';
      mel_logs::get_instance()->log(mel_logs::INFO, "[Moncompte] moncompte::get_current_user_password() user : " . self::get_current_user_name() . " password : " . '{"uid":"' . $liensImport[0] . '","password":"password"}');
    }
    
    return $password;
	}


	/****** PRIVATE ****/
	/**
	 * Méthode appelé pour le changement de mot de passe
	 */
	// 	private function change_password() {
	// 		$this->rc->output->show_message('mel_moncompte.changepassword_confirm', 'confirmation');
	// 	}

	// 	private function change_infoperso() {
	// 		$this->rc->output->show_message('mel_moncompte.changepassword_confirm', 'confirmation');
	// 	}
}