<?php

// Require composer autoload for direct installs
@include __DIR__ . '/vendor/autoload.php';

// Include the helper classes
// @include __DIR__ . '/auth_helper.php';
@include __DIR__ . '/oidc_helper.php';

// Include Mel ORM library
@include_once 'includes/libm2.php';

/**
 * AuthTypeEnum
 *
 * Authentication types
 * @see AuthHelper
 *
 * @author Tom-Brian GARCIA
 * @category "Enum" PHP class
 */
abstract class AuthTypeEnum
{
    const PASSWORD = "PASSWORD";
    const KERBEROS = "KERBEROS";
    const OIDC = "OIDC";
}

/**
 * Roundcube OIDC
 *
 * Login to roundcube with OpenID Connect provider
 *
 * @license	MIT License: <http://opensource.org/licenses/MIT>
 * @author Varun Patil
 * @category  Plugin for RoundCube WebMail
 * 
 * -----------------------------------
 * 
 * @author Tom-Brian GARCIA
 * Modifications :
 *      - Avoid getting or transmitting (clear) password
 *      - Get and transmit the id_token to SASL
 *      - Rewrited the plugin to use hooks (with add_hook)
 *      - Added Kerberos support (and LDAP call)
 */
class roundcube_auth extends rcube_plugin
{
    private $selected_auth = AuthTypeEnum::PASSWORD;
    private $redirect_query;
    private $auth_helper;
    private $oidc_helper;

    /**
     * Plugin initialization
     */
    function init()
    {
        // Load plugin's config file
        $this->load_config();

        // Add plugin's functions to Roundcube
        $this->add_hook('startup', array($this, 'startup'));
        $this->add_hook('authenticate', array($this, 'authenticate'));
        $this->add_hook('login_after', array($this, 'login_after'));
    }

    function redirect($query)
    {
        if ($query)
        {
            header('Location: ./?' . $query);
            exit;
        }
    }

    private function select_auth()
    {
        // Get Roundcube instance
        $rcmail = rcmail::get_instance();

        // Store (default) auth
        $auth = AuthTypeEnum::PASSWORD;

        // OIDC only
        if($rcmail->config->get('oidc_auth_standalone'))
        {
            if(false) // TODO check if cookie contains OIDC
            {
                $auth = AuthTypeEnum::OIDC;
            }
        }

        // OIDC with Kerberos
        if($rcmail->config->get('oidc_auth_kerberos'))
        {
            if(false) // TODO check if cookie contains Kerberos
            {
                $auth = AuthTypeEnum::KERBEROS;
            }
            else
            {
                // TODO use a config param (Browser "list")
                // TODO check OS (Windows, Linux) ?
                if(strpos($_SERVER['HTTP_USER_AGENT'], "Firefox") !== false) // =~ str_contains()
                {
                    $auth = AuthTypeEnum::KERBEROS;
                }
                else
                {
                    // TODO use a config param (Intra header)
                    // TODO filter using IP address (RP or Client) => MTE only ?
                    if($_SERVER["HTTP_X_MINEQPROVENANCE"] == "intranet")
                    {
                        $auth = AuthTypeEnum::KERBEROS;
                    }
                }
            }
        }

        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Détermination de la méthode d'auth...");
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] PHP - User-Agent : " . $_SERVER['HTTP_USER_AGENT']);
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] PHP - Provenance : " . $_SERVER["HTTP_X_MINEQPROVENANCE"]);
        mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Auth déterminée : $auth");
        return $auth;
    }

    private function check_ldap_oidc($user_uid)
    {        
        // Récupération de l'utilisateur
        $user = driver_mel::get_instance()->getUser($user_uid);

        // Chargement de l'attribut du LDAP
        $user->load('cerbere'); // TODO config plugin

        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] LDAP - AUTH.Cerbere pour $user_uid : $user->cerbere");

        // Si l'utilisateur est autorisé à se connecter par OIDC
        mel_logs::get_instance()->log(mel_logs::DEBUG, $user); // TODO remove
        if($user->cerbere != null && $user->cerbere >= 1)
        {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] LDAP - AUTH.Cerbere autorisée");
            return true;
        }
        else
        {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] LDAP - AUTH.Cerbere refusée");
            return false;
        }
    }

    /**
     * Startup hook handler
     */
    function startup($args)
    {
        // TODO remove
        //mel_logs::get_instance()->log(mel_logs::INFO, "roundcube_auth - startup");
        mel_logs::get_instance()->log(mel_logs::DEBUG, "roundcube_auth - startup");

        if(empty($_SESSION['user_id'])) // User not logged in
        {
            // Get Roundcube instance
            $rcmail = rcmail::get_instance();

            // Variables
            $oidc = false;
            $enabled = '1';

            $keyword_kerberos = 'kerb'; // TODO put in config
            $query_kerberos = $_GET[$keyword_kerberos];
            $rcube_kerberos = $rcmail->config->get('oidc_auth_kerberos');

            $keyword_oidc = 'oidc'; // TODO put in config
            $query_oidc = $_GET[$keyword_oidc];
            $rcube_oidc = $rcmail->config->get('oidc_auth_standalone');

            // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] ----- KERB ----- ");
            // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] GET['kerb'] - " . $_GET['kerb']);
            // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] isset(GET['kerb']) - " . isset($_GET['kerb']));
            // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] config->get('oidc_auth_kerberos') - " . $rcmail->config->get('oidc_auth_kerberos'));

            // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] ----- OIDC ----- ");
            // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] GET['oidc'] - " . $_GET['oidc']);
            // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] isset(GET['oidc']) - " . isset($_GET['oidc']));
            // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] config->get('oidc_auth_standalone') - " . $rcmail->config->get('oidc_auth_standalone'));

            // Kerberos (triggered by query)
            // if($rcmail->config->get('oidc_auth_kerberos') && isset($_GET['kerb']) && $_GET['kerb'] == '1')
            if($rcube_kerberos && isset($query_kerberos))
            {
                mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [Kerberos] Déclenchement");
                mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] PHP - REMOTE_USER : " . $_SERVER['REMOTE_USER']);

                if(!empty($_SERVER['REMOTE_USER']) && $query_kerberos == $enabled)
                {
                    $selected_auth = AuthTypeEnum::KERBEROS;
                
                    // Transformation de 'prenom.nom@REALM' en 'prenom.nom' seulement 
                    $user_uid = explode("@",$_SERVER['REMOTE_USER'])[0];

                    // Vérification de l'attribut LDAP autorisant ou non la connexion OIDC
                    $oidc = $this->check_ldap_oidc($user_uid);
                }
                else
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [Kerberos] Échec du déclenchement");
                    // $selected_auth = AuthTypeEnum::PASSWORD;
                }
            }

            // OIDC (triggered by query)
            // else if($rcmail->config->get('oidc_auth_standalone') && isset($_GET['oidc']) && $_GET['oidc'] == '1')
            else if($rcube_oidc && isset($query_oidc))
            {
                mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [OIDC] Déclenchement");

                if($query_oidc == $enabled)
                {
                    $selected_auth = AuthTypeEnum::OIDC;
                    $oidc = true;
                }
                else
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [OIDC] Échec du déclenchement");
                    // $selected_auth = AuthTypeEnum::PASSWORD;
                }
            }

            else
            {    
                // Détermine la méthode d'auth
                $selected_auth = $this->select_auth();
                mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Selected : " . $selected_auth);
    
                switch($selected_auth)
                {
                    case AuthTypeEnum::KERBEROS:
                        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Redirection vers $keyword_kerberos=$enabled");
                        $this->redirect($keyword_kerberos."=".$enabled); // todo add task login ?
                        break;

                    case AuthTypeEnum::OIDC:
                        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Redirection vers $keyword_oidc=$enabled");
                        $this->redirect($keyword_oidc."=".$enabled); // todo add task login ?
                        break;

                    case AuthTypeEnum::PASSWORD:
                    default:
                        // do nothing
                        // $this->redirect("_task=login");
                        break;

                }
            }
            
            //region ========== OIDC execution ==========

            if($oidc)
            {
                mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [OIDC] Lancement/Execution");
                mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [OIDC] Connexion OIDC");

                // Trigger login action
                $args['action'] = 'login';

                try
                {    
                    // Setup a new TokenHelper (wrapping OIDC)
                    $this->oidc_helper = new OIDC_Helper(
                        $rcmail->config->get('oidc_url'),
                        $rcmail->config->get('oidc_client'),
                        $rcmail->config->get('oidc_secret'),
                        explode(" ", $rcmail->config->get('oidc_scope')),
                        false, // host verification (TODO enable)
                        false, // peer verification (TODO enable)
                        $rcmail->config->get('oidc_proxy')
                    );
                }
                catch (\Exception $e)
                {
                    // TODO improve
                    echo '(1) OIDC Authentication Failed <br/>' . $e->getMessage();
                    mel_logs::get_instance()->log(mel_logs::ERROR, "(1) OIDC Authentication Failed <br/>" . $e->getMessage());
                }

                // Store the redirection query
                $this->redirect_query = $_SERVER['QUERY_STRING'];
            }

            //endregion =================================
        }

        return $args;
    }

    /**
     * Authenticate hook handler
     */
    function authenticate($args)
    {
        if($this->oidc_helper != null)
        {
            // Get Roundcube instance
            $rcmail = rcmail::get_instance();
            
            try
            {
                // Get user information
                //$user = json_decode(json_encode($this->tokenHelper->getUserInfo()), true);

                // Get ID Token
                $token = $this->oidc_helper->getOIDC()->getIdTokenPayload();

                // Parse fields
                $uid = $token->{$rcmail->config->get('oidc_field_uid')};
                $eidas = $token->{$rcmail->config->get('oidc_field_eidas')};

                // TODO
                // check if OIDC is allowed for this user (in case of direct connection)
                // $this->check_ldap_oidc($uid);
                // => if false, modify selected_auth / if conditions should not pass

                // Remove previous eidas value
                unset($_SESSION['eidas']);

                // Store eidas value
                $_SESSION['eidas'] = $eidas;

                // Set token as password
                $password = $this->oidc_helper->getToken(TokenTypeEnum::ID_TOKEN);
            
                // Modify args values
                // mel_logs::get_instance()->log(mel_logs::DEBUG, "roundcube_oidc - ajout de l'eidas dans args : ".$eidas);
                $args['user'] = $uid;
                $args['pass'] = $password;
                $args['cookiecheck'] = true;
                $args['valid'] = true;
                $args['eidas'] = $eidas;
            }
            catch (\Exception $e)
            {
                // TODO improve
                echo '(2) OIDC Authentication Failed <br/>' . $e->getMessage();
                mel_logs::get_instance()->log(mel_logs::ERROR, "(2) OIDC Authentication Failed <br/>" . $e->getMessage());
            }
        }

        return $args;
    }

    /**
     * Post-login hook handler
     */
    function login_after($args)
    {
        // Redirect to the previous QUERY_STRING
        $this->redirect($this->redirect_query);
        // if ($this->redirect_query)
        // {
        //     header('Location: ./?' . $this->redirect_query);
        //     exit;
        // }

        return $args;
    }

}

