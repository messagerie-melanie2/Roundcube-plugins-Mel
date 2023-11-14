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
require_once 'PasswordApiService.php';
require_once 'PasswordApiException.php';

/**
* Classe de modification de mot de passe de l'utilisateur
*/
final class Changepasswordmiom extends Moncompteobject {

    /**
     * Tableau contenant les divers paramètre d'accès à l'api et au portail.
     * A savoir, l'url d'accès à l'api et ses différent points d'accès aux services,
     * @var array
     */
    static private $apiConfig = array();
    
    /**
     * 
     * @var string
     */
    static private $errorMsg = '';
    
    /**
     * 
     * @var rcube_plugin plugin courant
     */
    static private $plugin;
    
    /**
     * Donne accès au service contenant les méthodes d'authentifaction, de changement du mot de passe, etc...
     * @return PasswordApiService
     */
    static private function getPasswordApiService(){
        return PasswordApiService::getInstance(self::$apiConfig);
    }
    
    /**
     * Ajoute le nom du plugin et le point devant le nom du paramètre,
     * utile pour gettext et send
     * @param string $name Nom du paramètre
     * @return string Nom complet du paramètre
     */
    static private function getParamFullName($name)
    {
        return self::$plugin->ID . '.' . $name;
    }
    
    /**
	* Est-ce que cet objet Mon compte doit être affiché
	* 
	* @return boolean true si l'objet doit être affiché false sinon
	*/
	public static function isEnabled() {
	    $rc = rcmail::get_instance();
	    return $rc->config->get('enable_moncompte_mdp_miom', true)  ;//&& !$rc->output->get_env('ismobile');
	}

	/**
	 * Construction de message d'erreur en fonction du code retour des appels au web service
	 * @param PasswordApiException $e
	 */
	private static function setErrorMsg(PasswordApiException $e)
	{
	    $rc = rcmail::get_instance();
	    $code = $e->getCode();
	    if ($code >= 500)
	        //Erreur interne
	        $msg = $rc->gettext(self::getParamFullName('changepasswordmiom_error500'));
	    else
	        $msg = $e->getMessage();
	    //Le message est construit avec le code et message 
	        self::$errorMsg = $rc->gettext(array('name' => self::getParamFullName('changepasswordmiom_error'),
	        'vars' => array('code' => $code, 'message' => $msg)
	    ));
	}
	
	/**
	 * Authentification de l'utilisateur
	 * @param rcube_plugin $plugin Plugin courant qui appelle cette classe
	 */
	public static function init($plugin){
	    self::$plugin = $plugin;
	    $rc = rcmail::get_instance();
	    //Charger les labels du skin approprié
	    self::$plugin->add_texts('skins/mi_larry/localization/', true);
	    //Obtenir la configuration du plugin mi_auth
	    $mi_auth = $rc->config->get('mi_auth', null);
	    if ($mi_auth != null)
	    {
    	    //Récupérer les paramètres utiles au service
    	    self::$apiConfig = array('api_uri' => $mi_auth['api_uri'],
    	        'portail_uri_changepwd' => $mi_auth['portail_uri'] . $rc->config->get('portail_uri_changepwd'),
    	        'auth_user_endpoint' => $mi_auth['auth_user_endpoint'],
    	        'pwd_user_canchange_endpoint' => $rc->config->get('pwd_user_canchange_endpoint'),
    	        'token_revoke_endpoint' => $rc->config->get('token_revoke_endpoint')
    	    );
    	    $apiService = self::getPasswordApiService();
    	    try {
    	        //Authentifivcation de l'utilisateur
    	        $apiService->authUser($rc->user->get_username(), $rc->get_user_password());
    	        //Vérification que l'utilisateur est autorisé à changer son mot de passe
    	        $apiService->canChange();
    	    } catch (PasswordApiException $e) {
    	        self::setErrorMsg($e);
    	    }
	    }
	    else
	    {
	        //Configuration du plugin mi_auth non chargé
	        self::$errorMsg = $rc->gettext(self::getParamFullName('changepasswordmiom_notfound_mi_auth'));
	    }
	}
	
	/**
	* Affichage de la page permettant d'accéder au changement du mot de passe
	*/
	public static function load($plugin = null) {
	    $rc = rcmail::get_instance();
	    $apiService = self::getPasswordApiService();
	    //Positionner les variables d'environnement utilisées par la page affichée
	    //Indique l'url de changement du mot de passe du portail utilisateur
	    $rc->output->set_env('portaiPwdlUri', self::$apiConfig['portail_uri_changepwd']);
	    //Adresse mail de l'utilisateur
	    $rc->output->set_env('email', $rc->user->get_identity()['email']);
	    //Indique si le bouton d'accès au changement du mot de passe est affiché
        $rc->output->set_env('canChange', $apiService->isCanChange());
        //Message d'erreur
        $rc->output->set_env('errorMsg', self::$errorMsg);
        if ($rc->output->get_env('ismobile'))
        {
            self::$plugin->include_script('skins/mi_larry_mobile/changepasswordmiom.js');
        }
        // Envoi de la page
        $rc->output->send(self::getParamFullName('changepasswordmiom'));
	}
	
	/**
	* Clic sur le bouton d'accès vers le changement du mot de passe
	*/
	public static function change() {
	    $rc = rcmail::get_instance();
	    //Obtention du service
	    $apiService = self::getPasswordApiService();
	    try {
	        //Annuler le token
	        $apiService->tokenRevoke();
	        //Chargement du script qui va rediriger ver la page de changement du mot de passe du portail utilisateur
	        self::$plugin->include_script('skins/mi_larry/changepasswordmiom.js');
	        //Effacer la session
	        $rc->kill_session();
	    } catch (PasswordApiException $e) {
	        self::setErrorMsg($e);
	    }
	    finally {
	        $apiService->setCanChange(false);
	    }
	}	
}
//Initialisation de la classe avec le plugin qui l'appelle
Changepasswordmiom::init($this->plugin);