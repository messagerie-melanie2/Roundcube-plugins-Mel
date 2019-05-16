<?php

@include_once 'includes/libm2.php';
include_once 'BalAbsence.php';

use LibMelanie\Ldap\Ldap as Ldap;
use LibMelanie\Config\Ldap as Config;

class Bal {


	var $_balAbsence;    	// Objet Gestionnaire Absence (BalAbsence.php)
	var $_ldapEntree;	 	// Tableau des valeurs des attributs Ldap lus

	// Gestion de l'acces Internet:
	// - autorisation prÃ©alable par l'administrateur
	// - activation par l'utilisateur
	var $_accesInternetAdmin;	// AccÃšs Internet autorisÃ© par Admin
	var $_accesInternetUser;	// AccÃšs Internet activÃ© par User


	// 02/02/10 publication des photos Ader et Intranet
	var $_publicationPhotoAder;     // Publier la photo sur Ader
	var $_publicationPhotoIntranet; // Publier la photo sur Intranet
	var $_entreeAvecPhoto;	    // Que les BALI ont des photos

	// 24/08/10 rajout infos perso
	var $_matricule;
	var $_ministere;

	/**
	 *
	 * @var rcmail
	 */
	private $rc;
	/**
	 *
	 * @var Moncompte
	 */
	private $plugin;

	/**
	 *
	 * @var string
	 */
	private $user_dn;

	/*---------------------------------------------------------------------
	* Initialisation de l'objet BAL
	*/


	function Bal($plugin)
	{


		$this->rc = $plugin->rc;
		$this->plugin = $plugin;

		// Initialiser l'objet Gestionnaire Absence
		$this->_balAbsence = new BalAbsence();

		// Lire les attributs de cette Bal
		$this->readLdapBal();
	}


	/*----------------------------------------------------------------------
	* Lire les attributs Ldap de la Boite
	* Utiliser une connexion authentifiÃ©e (car restriction de lecture)
	*/
	function readLdapBal()
	{

		// Liste des attributs de l'utilisateur Ã  lire
		$ldap_attrs = $this->rc->config->get('ldap_attributes');
		
    if (Ldap::Authentification(Moncompte::get_current_user_name(), Moncompte::get_current_user_password(), Config::$MASTER_LDAP)) {

			$filter = Ldap::GetInstance(Config::$MASTER_LDAP)->getConfig('get_user_infos_filter');
			$filter = str_replace('%%username%%',Moncompte::get_current_user_name(), $filter);

			$base_dn = Ldap::GetInstance(Config::$MASTER_LDAP)->getConfig('base_dn');

			$ldap_res = Ldap::GetInstance(Config::$MASTER_LDAP)->search($base_dn, $filter, $ldap_attrs);

			$_ldapEntree = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($ldap_res);
		}

		if (mel_logs::is(mel_logs::TRACE)) mel_logs::get_instance()->log(mel_logs::TRACE, var_export($_ldapEntree[0], true));

		// nomenclatures mineqZone et mineqVpnProfil

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_vpnprofil')][0])) {

			$baseDNVPN = 'ou=mineqVpnProfil,ou=nomenclatures,ou=ressources,dc=equipement,dc=gouv,dc=fr';
			$filtre_vpn = 'mineqvpnprofil=' . $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_vpnprofil')][0];

			$search_vpn = Ldap::GetInstance(Config::$MASTER_LDAP)->search($baseDNVPN, $filtre_vpn, array('description'));
			$nom_vpn = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($search_vpn);

		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_zone')][0])) {

			$baseDNZone = 'ou=mineqZone,ou=nomenclatures,ou=ressources,dc=equipement,dc=gouv,dc=fr';
			$filtre_zone = 'mineqzone=' . $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_zone')][0];

			$search_zone = Ldap::GetInstance(Config::$MASTER_LDAP)->search($baseDNZone, $filtre_zone, array('description'));
			$nom_zone = Ldap::GetInstance(Config::$MASTER_LDAP)->get_entries($search_zone);

		}

		// --------------------------------------------


		// Recuperer les messages d'absence pour les destinataires mel et int
		for ($i = 0; $i < 2; $i++) {
			if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_response')][$i])) {
				// PAMELA 26/06/09 stripos -> strpos et rajouter ' ' et :
				if ( strpos($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_response')][$i],
						' RAIN:') === false)  {
						// RAEX: renseigner message absence destinataires externes
				$this->_balAbsence->setInfoInternet($_ldapEntree[0]
						[Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_response')]
						[$i]);
				}
				else
				{
					// RAIN: renseigner message absence destinataires internes
					$this->_balAbsence->setInfoMelanie ($_ldapEntree[0]
							[Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_response')]
							[$i]);
				}
			}
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accesinterneta')][0])) {
			$this->_accesInternetAdmin = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accesinterneta')][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accesinternetu')][0])) {
		$this->_accesInternetUser = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accesinternetu')][0];
		}

		// 02/02/10 Publication des photos Ader et Intranet
		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_photo_publiader')][0])) {
			$this->_publicationPhotoAder = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_photo_publiader')][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_photo_publiintra')][0])) {
		$this->_publicationPhotoIntranet = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_photo_publiintra')][0];
		}

		// 24/08/10 infos perso -------------------------

		/* Autorisation de modifier les infos ? */
		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_majinfoperso')][0])) {

			$this->_autorise = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_majinfoperso')][0];
		}




		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_employeenumber')][0])) {
				$this->_matricule = $_ldapEntree[0]
		[Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_employeenumber')]
		[0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_zone')][0])) {
				//             $this->_ministere = $_ldapEntree[0]['mineqzone'][0];
				$this->_ministere = $nom_zone['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_description')][0];
		}

		if (isset($_ldapEntree[0]['mineqvpnprofil'][0])) {
			$this->_vpnprofil = $nom_vpn['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_description')][0];
		}


		if (isset($_ldapEntree[0]['street'][0])) {
		$this->_adresse = $_ldapEntree[0]['street'][0];
		}

				if (isset($_ldapEntree[0]['postalcode'][0])) {
		$this->_codepostal = $_ldapEntree[0]['postalcode'][0];
		}

		if (isset($_ldapEntree[0]['l'][0])) {
		$this->_ville = $_ldapEntree[0]['l'][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_description')][0])) {
		$this->_description = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_description')][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_phonenumber')][0])) {
		             $this->_numtel = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_phonenumber')][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_faxnumber')][0])) {
		$this->_numfax = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_faxnumber')][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mobilephone')][0])) {
		$this->_nummobile = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mobilephone')][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_roomnumber')][0])) {
		$this->_bureau = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_roomnumber')][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_title')][0])) {
		$this->_fonction = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_title')][0];
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_businesscat')][0])) {
			$this->_metier = '';
			for ($i= 0; $i < $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_businesscat')]['count']; $i++) {
				$this->_metier .= $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_businesscat')][$i] . "\n";
			}
		}

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mission')][0])) {
			$this->_mission = '';
			for ($i= 0; $i < $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mission')]['count']; $i++) {
				$this->_mission .= $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mission')][$i] . "\n";
			}
		}

		//$this->_infoCGUprofil = 'ACCESINTERNET';
		
		$user_dn = $_ldapEntree[0]['dn'];
		
		if ((strpos($user_dn, 'ou=departements,ou=organisation,dc=equipement,dc=gouv,dc=fr') !== false)
		|| ((strpos($user_dn, 'ou=DDEA,ou=melanie,ou=organisation,dc=equipement,dc=gouv,dc=fr') !== false))) {
			$this->_infoCGUprofil = 'DDI-INTERNET-STANDARD';
		} else {
			$this->_infoCGUprofil = 'ACCESINTERNET';
		}
		
		if (isset($_ldapEntree[0]['info'][0])) {
			foreach($_ldapEntree[0]['info'] as $i => $val) {

				if (strpos($_ldapEntree[0]['info'][$i], 'OBSERVATION') !== false) {

				$res = explode(':',$_ldapEntree[0]['info'][$i]);
				$this->_info = $res['1'];
				}
				//23/08/11 CGU
				if (stripos($_ldapEntree[0]['info'][$i], 'AccesInternet.AcceptationCGUts') !== false) {

				$rests = explode(':',$_ldapEntree[0]['info'][$i]);
				$splitts = str_split($rests[1], 14);
					$this->_infoCGUts = preg_match('/^[0-9]{14}[zZ]$/', trim($rests[1]));
					$this->_ts = trim($rests[1]);
				}

				if (stripos($_ldapEntree[0]['info'][$i], 'AccesInternet.Profil') !== false) {

				$prof = explode(':',$_ldapEntree[0]['info'][$i]);
				$this->_infoCGUprofil = $prof['1'];
						}
				//fin ----------------------
			}
		}
		// PAMELA 05/02/13 CGU Mobiles
		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accessynchrou')][0])) {
		$this->_infoCGUMobts = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accessynchrou')][0];
		}
		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accessynchroa')][0])) {
			$profilA = explode('Z--', $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accessynchroa')][0]);

		    if (isset($profilA[1])) {
		    	$this->_getProfilMob = $profilA[1];
			} else {
				$this->_getProfilMob = $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_accessynchroa')][0];
			}
		}
		// fin Mobiles -------------

		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_sambasid')][0]) && $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_sambasid')][0] !== '') {

			$this->_bureautique = true;
		} else {
		$this->_bureautique = false;
		}

		// infos perso --------------



		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_type_entree')][0])
		//Essai lolo
		//	&& $_ldapEntree[0]['mineqtypeentree'][0] == "BALI") {
			&& ($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_type_entree')][0] == "BALI" || $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_type_entree')][0] == "PERS"))
		{
			$this->_entreeAvecPhoto = 1;
		} else {
			$this->_entreeAvecPhoto = 0;
	    }

	    //PAMELA 12/12/12 modif gestionnaire absence si bal desactivee
	    if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_remise')][0]) && $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_mel_remise')][0] == 'NULL') {
	    	$this->_balactive = false;
		} else {
			$this->_balactive = true;
		}

		//Publication photo

		if (isset($_ldapEntree['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_photo')]['0']) && $_ldapEntree['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_photo')]['0'] !== '') {

			$this->_contenuphoto = "data:image/jpeg;base64," . base64_encode($_ldapEntree['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_photo')]['0']);

		} else {
			if (isset($_ldapEntree['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_gender')]['0']) && !empty($_ldapEntree['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_gender')]['0'])) {
				$this->_contenuphoto = './fic/avatar' . strtolower($_ldapEntree['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_gender')]['0']) . '.png';
			} else { $this->_contenuphoto = ''; }
		}
        
		//mineqLiensImport pour Agriculture, affichages differents
		if (isset($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_liens_import')]['0'])) {
		    foreach($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_liens_import')] as $i => $val) {
		        if (strpos($_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_liens_import')][$i], 'AGRI.Lien:') !== false) {
		            $this->_agri_import = 1;
		            $recup_dn = explode(': ', $_ldapEntree[0][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_liens_import')][$i]);
		            $this->rc->output->set_env('moncompte_dn_agri', 'https://annuaire.agricoll.national.agri/agricoll-liniddm/entry/edit/agentpassword/' . $recup_dn[1]);
		            break;
		        } else {
		            $this->_agri_import = 0;
		        }
		    }
		}
		
		//---------------- fin de readLdapBal() --------------
	}

	/*---------------------------------------------------------------------
	* Rendre le statut de l'acces Internet (autorisÃ© ou non) par administrat.
	*/
			function getAccesInternetAdmin ()
			{
				if (isset($this->_accesInternetAdmin)) {
					return $this->_accesInternetAdmin;
				}
				else {
					return '0';			// non autorisÃ©
				}
			}

			/*---------------------------------------------------------------------
			* Rendre le statut de l'acces Internet (active ou non) par utilisateur.
			*/
			function getAccesInternetUser ()
			{
				if (isset($this->_accesInternetUser)) {
					return $this->_accesInternetUser;
				}
				else {
					return '0';			// non activÃ
				}
			}

	/*---------------------------------------------------------------------
	* 02/02/10
	* Rendre le statut de la publication de la Photo sur Ader.
	* /
					*/
	function getPublicationAder ()
	{
		if (isset($this->_publicationPhotoAder)) {
			return $this->_publicationPhotoAder;
		} else {
			return '0';			// non autorise
		}
	}

	/*---------------------------------------------------------------------
	* 02/02/10
	* Rendre le statut de la publication de la Photo sur Intranet.
    */
	function getPublicationIntranet ()
	{
	if (isset($this->_publicationPhotoIntranet)) {
		return $this->_publicationPhotoIntranet;
		}
		else {
			return '0';			// non autorise
		}
	}

 	/*---------------------------------------------------------------------
 	* 02/02/10
 	* Rendre le support des photos (uniquement si BALI)
 	*/
	function getPhotoSupport ()
	{
		return $this->_entreeAvecPhoto;
	}

     /*---------------------------------------------------------------------
     * Rendre le message d'absence pour les destinataires internes.
     */

   	function getMsgMelanie()
   	{
    	if ( isset ($this->_balAbsence) && !$this->_balactive) {
	    	if (!strpos($this->_balAbsence->getMsgMelanie(), '<---------->   ' === false)) {

		    	$search = array('Message administrateur de messagerie', 'Fin du message administrateur');
		    	$repl = '';
		    	$str = $this->_balAbsence->getMsgMelanie();
		    	$tmp = str_replace($search, $repl, $str);
		    	$tmp = preg_replace("(\r\n|\n|\r)",'',$tmp);

		    	$messagemel = explode('<---------->   ', $tmp);
		    	if (isset($messagemel[1])) {
			    	return $messagemel[1];
				}
			} else {
				return '';
			}
		} elseif ( isset ($this->_balAbsence) && $this->_balactive) {
			return $this->_balAbsence->getMsgMelanie();
		}
}


 /*----------------------------------------------------------------------
 * Rendre le message d'absence pour les destinataires externes.
 */

	function getMsgInternet()
	{
		if ( isset ($this->_balAbsence) && !$this->_balactive) {

			if (!strpos($this->_balAbsence->getMsgInternet(), '<---------->   ' === false)) {

				$search = array('Message administrateur de messagerie', 'Fin du message administrateur');
				$repl = '';
				$str = $this->_balAbsence->getMsgInternet();
				$tmp = str_replace($search, $repl, $str);
				$tmp = preg_replace("(\r\n|\n|\r)",'',$tmp);
				$messageint = explode('<---------->   ', $tmp);
				if (isset($messageint[1])) {
					return $messageint[1];
				}
			} else {
				return '';
			}
		} elseif ( isset ($this->_balAbsence) && $this->_balactive) {
			return $this->_balAbsence->getMsgInternet();
		}
	}

    	/*----------------------------------------------------------------------
    	PAMELA 12/12/12 modif gestionnaire absence si bal desactivee
    	*/
    	function getMsgAmedeeMel()
    	{
			if ( isset ($this->_balAbsence) && !$this->_balactive) {
				if (!strpos($this->_balAbsence->getMsgMelanie(), '<---------->   ' === false)) {
					$search = array('Message administrateur de messagerie', 'Fin du message administrateur');
					$repl = '';
					$search = array('Message administrateur de messagerie', 'Fin du message administrateur');
					$repl = '';
					$str = $this->_balAbsence->getMsgMelanie();
					$tmp = str_replace($search, $repl, $str);
					$tmp = preg_replace("(\r\n|\n|\r)",'',$tmp);

					$amedeemel = explode('<---------->   ', $tmp);
					return $amedeemel[0];
				} else {
					return $this->_balAbsence->getMsgMelanie();
				}
			}
    	}

    	/*----------------------------------------------------------------------
    	PAMELA 12/12/12 modif gestionnaire absence si bal desactivee
    	*/
    function getMsgAmedeeInt()
    {
		if ( isset ($this->_balAbsence) && !$this->_balactive) {
			if (!strpos($this->_balAbsence->getMsgInternet(), '<---------->   ' === false)) {

				$search = array('Message administrateur de messagerie', 'Fin du message administrateur');
				$repl = '';
				$str = $this->_balAbsence->getMsgInternet();
				$tmp = str_replace($search, $repl, $str);
				$tmp = preg_replace("(\r\n|\n|\r)",'',$tmp);

				$amedeeint = explode('<---------->   ', $tmp);
				return $amedeeint[0];
			} else {
				return $this->_balAbsence->getMsgInternet();
		    }
		}
	}



    /*---------------------------------------------------------------------
     * Rendre le status d'absence pour les destinataires internes.
     */
function getStatusMelanie()
{
	if ( isset ($this->_balAbsence)) {
		return $this->_balAbsence->getStatusMelanie();
	} else {
		return '';
	}
}

    /*---------------------------------------------------------------------
    * Rendre le status d'absence pour les destinataires externes.
    */
function getStatusInternet()
{
	if ( isset ($this->_balAbsence)) {
		return $this->_balAbsence->getStatusInternet();
	} else {
		return '';
	}
}
    /*---------------------------------------------------------------------
     * Faut-il utiliser le mÃªme message pour la rÃ©ponse Internet et MÃ©lanie.
     */
function doesInternetUseSameMsg ()
{
	if ( isset ($this->_balAbsence)) {
		if ( $this->_balAbsence->getStatusInternet() ) {
			return (strcmp($this->_balAbsence->getMsgMelanie(),
			$this->_balAbsence->getMsgInternet()) == 0);
		}
	}
	return false;
}

     /*---------------------------------------------------------------------
     * Rendre les dates de dÃ©but et de fin d'activation d'absence (internes).
     */
function getDatesMelanie (&$start_date, &$stop_date)
{
	if ( isset ($this->_balAbsence)) {
		$this->_balAbsence->getDatesMelanie($start_date, $stop_date);
	}
}

     /*----------------------------------------------------------------------
     * Rendre les dates de dÃ©but et de fin d'activation d'absence (externes).
     */
function getDatesInternet (&$start_date, &$stop_date)
{
	if ( isset ($this->_balAbsence)) {
		$this->_balAbsence->getDatesInternet($start_date, $stop_date);
	}
}


     // 24/08/10 rajout infos perso
      /*---------------------------------------------------------------------
      Autorise a modifier ? */
function getAutorise()
{
	if (isset($this->_autorise) && ($this->_autorise !== '1')) {
		return 'nok';
	} else {
		return 'ok';
	}
}

    /*---------------------------------------------------------------------
     */
function getMatricule()
{
	if (isset($this->_matricule)) {
		return $this->_matricule;
	} else {
		return 'non renseigné';
	}
}

      /*---------------------------------------------------------------------
      */
function getMinistere()
{
	if (isset($this->_ministere)) {
		return $this->_ministere;
	} else {
		return 'non renseigné';
	}
}

      /*---------------------------------------------------------------------
      */
function getVpnProfil()
{
	if (isset($this->_vpnprofil)) {
		return $this->_vpnprofil;
	} else {
		return 'aucun';
	}
}

      /*---------------------------------------------------------------------*/
function getAdresse()
{
	if (isset($this->_adresse)) {
		return $this->_adresse;
	} else {
		return '';
	}
}

      /*---------------------------------------------------------------------*/
function getCodePostal()
{
	if (isset($this->_codepostal)) {
		return $this->_codepostal;
	} else {
		return '';
	}
}

      	/*---------------------------------------------------------------------*/
function getVille()
{
	if (isset($this->_ville)) {
		return $this->_ville;
	} else {
		return '';
	}
}

      	/*---------------------------------------------------------------------*/
function getDescription()
{
	if (isset($this->_description)) {
		return str_replace("\n",'<br />', $this->_description);
	} else {
		return '';
	}
}

      	/*---------------------------------------------------------------------*/
function getNumTel()
{
	if (isset($this->_numtel)) {
		return $this->_numtel;
	} else {
		return '';
	}
}

        /*---------------------------------------------------------------------*/
function getNumFax()
{
	if (isset($this->_numfax)) {
		return $this->_numfax;
	} else {
		return '';
	}
}

        /*---------------------------------------------------------------------*/
function getNumMobile()
{
	if (isset($this->_nummobile)) {
		return $this->_nummobile;
	} else {
		return '';
	}
}

      	/*---------------------------------------------------------------------*/
function getBureau()
{
	if (isset($this->_bureau)) {
		return $this->_bureau;
	} else {
		return '';
	}
}

      			/*---------------------------------------------------------------------*/
function getFonction()
{
	if (isset($this->_fonction)) {
		return $this->_fonction;
	} else {
		return '';
	}
}

      			/*---------------------------------------------------------------------*/
function getMetier()
{
	if (isset($this->_metier)) {
		return $this->_metier;
	} else {
		return '';
	}
}

      			/*---------------------------------------------------------------------*/
function getMission()
{
	if (isset($this->_mission)) {
		return $this->_mission;
	} else {
		return '';
	}
}

/*---------------------------------------------------------------------*/
function getInfo()
{
	if (isset($this->_info)) {
		return $this->_info;
	} else {
		return '';
	}
}

/*---------------------------------------------------------------------*/
function getBureautique()
{
	if (isset($this->_bureautique)) {
		return $this->_bureautique;
	} else {
		return false;
}
}



// infos perso ------------------------------

//23/08/11 CGU

function isTS()
{
	if (isset($this->_infoCGUts)) {
		return $this->_infoCGUts;
	} else {
		return '0';
	}
}

function retTS()
{
	if (isset($this->_ts)) {
		return $this->_ts;
	}
}

function getTS()
{
	if (isset($this->_ts)) {
		$traduc = strtotime($this->_ts);
		return date(' d\/m\/Y \à H\hi',$traduc);
	}
}

 function getProfil()
{
	if (isset($this->_infoCGUprofil)) {
		$base_cgu = 'ou=mineqAccesinternet,ou=nomenclatures,ou=ressources,dc=equipement,dc=gouv,dc=fr';
		$filtre_cgu = 'mineqAccesInternet=' . $this->_infoCGUprofil;

		$ldap_res = Ldap::GetInstance(Config::$AUTH_LDAP)->search($base_cgu, $filtre_cgu, array('description'));
		$nom_cgu = Ldap::GetInstance(Config::$AUTH_LDAP)->get_entries($ldap_res);

		if ($nom_cgu == false) {
			return '';
		}
		return $nom_cgu['0'][Ldap::GetInstance(Config::$SEARCH_LDAP)->getMapping('user_description')][0];
	}
}
				// fin CGU ---------------------------------------

				// PAMELA 05/02/13 CGU Mobiles ------------
	
function isTSMob()
{
	if (isset($this->_infoCGUMobts)) {
		return $this->_infoCGUMobts;
	} else {
		return '0';
	}
}

function retTSMob()
{
	if (isset($this->_infoCGUMobts)) {
		return $this->_infoCGUMobts;
	}
}

function getTSMob()
{
 	if (isset($this->_infoCGUMobts)) {

		$restsmob = explode('--', $this->_infoCGUMobts);

		/*
		$tzpref = rcmail::get_instance()->config->get('timezone', 'GMT');
			if (isset($tzpref) && (!empty($tzpref))) {
				$date = new DateTime($restsmob[0], new DateTimeZone('GMT'));
				$date->setTimezone(new DateTimeZone($tzpref));
				return $date->format('d\/m\/Y') . ' &agrave; ' . $date->format('H\hi');
		} else {
			$traduc = strtotime($restsmob[0]);
			return date(' d\/m\/Y \Ã  H\hi',$traduc);
		}
		*/

		$traduc = strtotime($restsmob[0]);
		return date(' d\/m\/Y \à  H\hi',$traduc);
	}
}

function getProfilMobA()
{
	if (isset($this->_getProfilMob)) {
		return $this->_getProfilMob;
	} else {
		return 'STANDARD';
	}
}

function isProfilMobA() {

	if (isset($this->_getProfilMob)) {
		return true;
	} else {
		return false;
	}
}

function getProfilMobU()
{
	if (isset($this->_infoCGUMobts)) {
		$restsmob = explode('--', $this->_infoCGUMobts);
		return $restsmob[1];
	}
}


// fin CGU Mobiles --------------------

//mineqLiensImport pour Agriculture, affichages differents
function getAgri()
{
    if (isset($this->_agri_import)) {
        return $this->_agri_import;
    }
}

//PAMELA 12/12/12 modif gestionnaire absence si bal desactivee

function isBalActive() {

	if ($this->_balactive) {
		return true;
	} else {
		return false;
	}
}

	function retourPhoto() {
		if (isset($this->_contenuphoto)) {
			return $this->_contenuphoto;
		}
	}


    /*----------------------------------------------------------------------
    * Lire les listes de distribution gÃ©rÃ©es par cet utilisateur
    * charger ces listes dans $_SESSION['moncompte']
    * Retour: 0= succÃšs, code erreur ldap
     */

/*
     function readUserListes($ldap_cnx)
     {
     // Ne pas utiliser le userDN stockÃ© lors du Hook authenticate
     // mais le dnBal de la boite gÃ©rÃ©e
     $userDN = $_SESSION['moncompte']['dnBal'];
     $baseDN = $_SESSION['PAMELA']['BaseLDAP'];

         Horde::logMessage('Bal::readUserListes: ' . $userDN,
     		__FILE__, __LINE__, PEAR_LOG_DEBUG);

         $ldap_attrs = array ('cn', 'dn');
         $ldap_filter= '(&(objectclass=mineqMelListe)(owner='. $userDN. '))';


     		$entries = @ldap_search($ldap_cnx,
     		$baseDN,
     		$ldap_filter,
     		$ldap_attrs);

     			if ( $entries == false) {
     			$err = ldap_errno($ldap_cnx);
             Horde::logMessage('ldap_search failed: ' . ldap_err2str($err),
             __FILE__, __LINE__, PEAR_LOG_INFO);
             return $err;
     		}

     		$nbLists = @ldap_count_entries($ldap_cnx, $entries);


     		if ( $nbLists > 0) {
     		// cet utilisateur gÃšre des listes
     		$_SESSION['moncompte']['gereliste'] = 1;

     			// determiner quelle est la liste Ã  selectionner
     			$selectedList = 0;  // par dÃ©faut: la premiÃšre liste

     			if ( isset($_SESSION['moncompte']['selectedList']) ) {
     			$selectedList = $_SESSION['moncompte']['selectedList'];
     			}

     			$userLists = @ldap_get_entries($ldap_cnx, $entries);
     			for ($i = 0; $i < $nbLists; $i++)
     				{

     				if ($i== $selectedList )
     					$selected = '1';
     				else
     					$selected = '0';

     				$dnList = $userLists[$i]['dn'];
     				$cnList = $userLists[$i]['cn'];


     				// Lire les membres de cette liste
     				$listMailMembers= array();	// mail des membres

     				$readList = ldap_read($ldap_cnx,
     				$dnList,
     				"objectclass=mineqmelliste");
     				if ( $readList) {
     				$aList = ldap_get_entries($ldap_cnx, $readList);

     				if ( $aList && isset($aList[0]['mineqmelmembres'])) {
     				$listMailMembers = $aList[0]['mineqmelmembres'];
     				asort($listMailMembers);
     				}
     				}

     				// Enregistrer la liste
		 $_SESSION['moncompte']['lists'][$dnList] =
		 array ('dn' => $dnList,
		 //PAMELA passage en utf8
		 //		                           'cn' => utf8_decode($cnList[0]),
		 'cn' => $cnList[0],
		 'selected' => $selected,
		 'members' => $listMailMembers
		 		);
		 }
		 }

		 @ldap_free_result($entries);
		 return 0;
							}
*/

							/*----------------------------------------------------------------------
							* Lire les BALP dont cet utilisateur est gestionnaire (:G)
		 * charger ces listes dans $_SESSION['moncompte']
		 * Retour: 0= succÃšs, code erreur ldap
		 	*/
/*

		 	function readUserBALP($ldap_cnx)
		 	{
		 	// Mettre la BALI du user dans la liste des BAL gÃ©rÃ©es
		 		$_SESSION['moncompte']['balsG'][$_SESSION['PAMELA']['uidLogin']] =
		 				array ('dn' => $_SESSION['PAMELA']['dnBal'],
		 		'cn' => $_SESSION['PAMELA']['nomBal'],
		 		'uid' => $_SESSION['PAMELA']['uidLogin']
     				);

         // Lire le userDN stockÃ© lors du Hook authenticate
         $userUID= $_SESSION['PAMELA']['uidLogin'];
         	$baseDN = 'ou=organisation,'.$_SESSION['PAMELA']['BaseLDAP'];

         	$ldap_attrs = array ('cn', 'dn', 'uid');
         	// PAMELA 18/10/10 ne pas afficher les BALA
         	//         $ldap_filter= '(&(!(mineqtypeentree=BALI))(!(uid='.$userUID.'))(mineqmelpartages='.$userUID.':G))';
         	$ldap_filter= '(&(!(mineqtypeentree=BALI))(!(mineqtypeentree=BALA))(!(uid='.$userUID.'))(mineqmelpartages='.$userUID.':G))';

         	$entries = @ldap_search($ldap_cnx,
         		$baseDN,
         		$ldap_filter,
					$ldap_attrs);

         		if ( $entries == false) {
             $err = ldap_errno($ldap_cnx);
             Horde::logMessage('ldap_search failed: ' . ldap_err2str($err),
             		__FILE__, __LINE__, PEAR_LOG_INFO);
             		return $err;
         	}

         	$nbBalps = @ldap_count_entries($ldap_cnx, $entries);


         if ( $nbBalps > 0)
         	{
         	// cet utilisateur est gestionnaire de BALP
         	$balpLists = @ldap_get_entries($ldap_cnx, $entries);

         	for ($i = 0; $i < $nbBalps; $i++)
         	{
         	$dnBalp = $balpLists[$i]['dn'];
         	$cnBalp = $balpLists[$i]['cn'][0];
         	$uidBalp= $balpLists[$i]['uid'][0];

         	// Enregistrer la boite gÃ©rÃ©e par cet utilisateur
         	$_SESSION['moncompte']['balsG'][$uidBalp] =
         	array ('dn' => $dnBalp,
         		//PAMELA passage en utf8
         		//		                           'cn' => utf8_decode($cnBalp),
         		'cn' => $cnBalp,
         		'uid' => $uidBalp
         	);
         	}
         	}


         	@ldap_free_result($entries);
         	return 0;
    }

    */
}
