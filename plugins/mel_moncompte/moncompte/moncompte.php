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
		if (isset($fid) && !empty($fid)) {
			$this->rc->output->add_handler('moncompte_balp_list', array($this, 'moncompte_balp_list'));
			$classname = ucfirst(strtolower($fid));
			include_once __DIR__.'/'.$classname.'.php';
			if (class_exists($classname)) {
				if (isset($_POST[$classname])) {
					$classname::change();
				}
				$classname::load();
			}
			else {
				$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));
				$this->rc->output->send();
			}
			return;

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
						// Compte bureautique
						if ($this->myBal->getBureautique() == '1') {
							$this->rc->output->set_env('moncompte_data_bureautique', 'oui');
						}
						else {
							$this->rc->output->set_env('moncompte_data_bureautique', 'non');
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
				case 'rcminternet':

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

					$this->rc->output->send('mel_moncompte.internet');
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
		// Liste des pages Mon compte à afficher
		$pages = ['informationspersonnelles','changepassword','gestionnaireabsence','gestionnairelistes'];
		// Génération de l'affichage
		foreach ($pages as $page) {
			$class = ucfirst(strtolower($page));
			include_once __DIR__.'/'.$class.'.php';
			if ($class::isEnabled()) {
				$result[] = array('id' => $page, 'name' => $this->plugin->gettext($page), 'class' => '');
			}
		}
		
		// // Ajout du menu informations personnelles
		// if ($this->rc->config->get('enable_moncompte_infos', true)) {
		//     $result[] = array('id' => 'rcminfoperso', 'name' => $this->plugin->gettext('infoperso'), 'class' => '');
		// }
		// // Ajout du menu modification du mot de passe
		// if ($this->rc->config->get('enable_moncompte_mdp', true)) {
		// 	$result[] = array('id' => 'rcmmodifmdp', 'name' => $this->plugin->gettext('modifmdp'), 'class' => '');
		// }
		// // Ajout du menu Accet Internet
		// if ($this->rc->config->get('enable_moncompte_cgu', true)) {
		//     $result[] = array('id' => 'rcmaccesinternet', 'name' => $this->plugin->gettext('accesinternet'), 'class' => '');
		// }		
		// // Ajout du menu gestion des Listes
		// if ($this->rc->config->get('enable_moncompte_lists', true)) {
		//     $result[] = array('id' => 'rcmgestionlists', 'name' => $this->plugin->gettext('gestionlists'), 'class' => '');
		// }
		// // Ajout du menu Accet Internet
		// if ($this->rc->config->get('enable_moncompte_cgu', true)) {
		//     $result[] = array('id' => 'rcminternet', 'name' => $this->plugin->gettext('accesinternet'), 'class' => '');
		// }
		// // Ajout du menu Gestionnaire d'absence
		// if ($this->rc->config->get('enable_moncompte_abs', true)) {
		//     $result[] = array('id' => 'rcmgestionabs', 'name' => $this->plugin->gettext('gestionabs'), 'class' => '');
		// }
		// // Ajout du menu gestion de la photo
		// if ($this->rc->config->get('enable_moncompte_photo', true)) {
		//     $result[] = array('id' => 'rcmphoto', 'name' => $this->plugin->gettext('photo'), 'class' => '');
		// }

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
	 * Génération de la liste des balp pour l'utilisateur courant
	 * @param array $attrib Liste des paramètres de la liste
	 * @return string HTML
	 */
	public function moncompte_balp_list($attrib) {
		if (!$attrib['id']) {
			$attrib['id'] = 'rcmmoncomptebalplist';
		}
		// Récupération de l'utilisateur
		$user = driver_mel::gi()->getUser();
		// AJoute le javascript
		// TODO: a faire en jquery
		//		$attrib['onchange'] = "self.location = self.location + '&_current_username=' + this.value;";
		// Génération du select html
		$html_select = new html_select($attrib);
		$html_select->add($user->fullname, $user->uid);

		// Récupération de la liste des objets auquels l'utilisateur a accès en gestionnaire
		$_objects = $user->getObjectsSharedGestionnaire();
		// Parcour la liste des boites et ajoute les options
		if (is_array($_objects)) {
			foreach ($_objects as $_object) {
				$html_select->add($_object->mailbox->fullname, $_object->mailbox->uid);
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
}