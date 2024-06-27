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
			$this->rc->output->set_env('fid', $fid);
			if (class_exists($classname)) {
				if (isset($_POST[strtolower($classname)])) {
					$classname::change();
				}
				$classname::load($this->plugin);
			}
			else {
				$this->rc->output->set_pagetitle($this->plugin->gettext('moncompte'));
				$this->rc->output->send();
			}
			return;
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
		$pages = $this->rc->config->get('mel_moncompte_pages', ['informationspersonnelles','changepassword','gestionnaireabsence','accesinternet','synchronisationmobile','gestionnairelistes', 'suspectsurls']);
		// Génération de l'affichage
		foreach ($pages as $page) {
			$class = ucfirst(strtolower($page));
			include_once __DIR__.'/'.$class.'.php';
			if ($class::isEnabled()) {
				$result[] = array('id' => $page, 'name' => $this->plugin->gettext($page), 'class' => '');
			}
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

		// Génération du select html
		$html_select = new html_select($attrib);
		$html_select->add($user->fullname, $user->uid);

		// Récupération de la liste des objets auquels l'utilisateur a accès en gestionnaire
		$_objects = $user->getObjectsSharedGestionnaire();
		// Parcours la liste des boites et ajoute les options
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
			return rcmail::get_instance()->get_user_name();
		}
	}
	
	/**
	 * Retourne le password de l'utilisateur
	 * Transformé si besoin pour le pam MCE
	 * 
	 * @return string
	 */
	public static function get_current_user_password() {
		// Récupération des informations sur l'utilisateur connecté
		$user = driver_mel::gi()->getUser();

		// MANTIS 0005002: [MAA] Modification de mdp pour les BALF
		$password = rcmail::get_instance()->get_user_password();
		if ($user->uid != self::get_current_user_name()
				&& rcmail::get_instance()->config->get('moncompte_agri_auth_delegated', false)
				&& $user->load(['is_agriculture']) 
				&& $user->is_agriculture) {
			$value = str_replace('AGRI.Lien: uid=', '', $user->liens_import);
			$value = explode(',', $value, 2);
			$password = '{"uid":"' . $value[0] . '","password":"' . $password . '"}';
			mel_logs::get_instance()->log(mel_logs::INFO, "[Moncompte] moncompte::get_current_user_password() user : " . self::get_current_user_name() . " password : " . '{"uid":"' . $liensImport[0] . '","password":"password"}');
		}
		return $password;
	}
}
