<?php

// Require composer autoload for direct installs
@include __DIR__ . '/vendor/autoload.php';

// Include the helper class (wrapping Jumbojett\OpenIDConnectClient)
@include __DIR__ . '/cerbere_token_helper.php';

// Include Mel ORM library
@include_once 'includes/libm2.php';

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
class roundcube_oidc extends rcube_plugin
{
    private $redirect_query;
    private $tokenHelper;

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

    /**
     * Startup hook handler
     */
    function startup($args)
    {
        // TODO remove
        //mel_logs::get_instance()->log(mel_logs::INFO, "roundcube_oidc - startup");
        mel_logs::get_instance()->log(mel_logs::DEBUG, "roundcube_oidc - startup");

        if(empty($_SESSION['user_id']))
        {
            // Get Roundcube instance
            $rcmail = rcmail::get_instance();
            $auth = false;

            // TODO remove
            //mel_logs::get_instance()->log(mel_logs::INFO, "roundcube_oidc - pre-auth (KRB=" . $_SERVER['REMOTE_USER'] . " - OIDC=" . isset($_GET['oidc']));
            mel_logs::get_instance()->log(mel_logs::DEBUG, "roundcube_oidc - pre-auth (KRB=" . $_SERVER['REMOTE_USER'] . " - OIDC=" . isset($_GET['oidc']));

            //region =========== AUTH methods ===========

            // Auth OIDC triggered by Kerberos (with LDAP field)
            if($rcmail->config->get('oidc_auth_kerberos') /*&& isset($_GET['kerb'])*/ && !empty($_SERVER['REMOTE_USER']))
            {
                //mel_logs::get_instance()->log(mel_logs::INFO, "Connexion OIDC avec déclenchement Kerberos/LDAP...");
                mel_logs::get_instance()->log(mel_logs::DEBUG, "Connection OIDC avec déclenchement Kerberos/LDAP...");

                //mel_logs::get_instance()->log(mel_logs::INFO, "Valeur du champ REMOTE_USER (Kerberos) :" . $_SERVER['REMOTE_USER']);
                mel_logs::get_instance()->log(mel_logs::DEBUG, "Valeur du champ REMOTE_USER (Kerberos) :" . $_SERVER['REMOTE_USER']);
                
                // Transformation de 'prenom.nom@REALM' en 'prenom.nom' seulement 
                $user_uid = explode("@",$_SERVER['REMOTE_USER'])[0];
                
                // Récupération de l'utilisateur
                $user = driver_mel::get_instance()->getUser($user_uid);
    
                // Chargement de l'attribut du LDAP
                $user->load('cerbere');
    
                //mel_logs::get_instance()->log(mel_logs::INFO, "Valeur du champ AUTH.Cerbere pour $user_uid : $user->cerbere");
                mel_logs::get_instance()->log(mel_logs::DEBUG, "Valeur du champ AUTH.Cerbere pour $user_uid : $user->cerbere");
    
                // Si l'utilisateur est autorisé à se connecter par OIDC Cerbère
                if($user->cerbere != null && $user->cerbere >= 1)
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "Tentative de connexion OIDC Cerbère pour l'utilisateur $user_uid après vérification Kerberos et LDAP.");
                    
                    $auth = true;
                }
            }
            // Auth OIDC only (without LDAP field)
            else if($rcmail->config->get('oidc_auth_standalone') && isset($_GET['oidc']))
            {
                //mel_logs::get_instance()->log(mel_logs::INFO, "Connexion OIDC direct...");
                mel_logs::get_instance()->log(mel_logs::DEBUG, "Connection OIDC direct...");

                $auth = true;
            }

            //endregion =================================

            //region ========== AUTH execution ==========

            mel_logs::get_instance()->log(mel_logs::INFO, "Connection déclenchée : $auth");
                    
            if($auth)
            {
                // Trigger login action
                $args['action'] = 'login';
    
                // Setup a new TokenHelper (wrapping OIDC)
                $this->tokenHelper = new CerbereTokenHelper(
                    $rcmail->config->get('oidc_url'),
                    $rcmail->config->get('oidc_client'),
                    $rcmail->config->get('oidc_secret'),
                    explode(" ", $rcmail->config->get('oidc_scope')),
                    false, // host verification
                    false, // peer verification
                    $rcmail->config->get('oidc_proxy')
                );

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
        if($this->tokenHelper != null)
        {
            // Get Roundcube
            $rcmail = rcmail::get_instance();
            
            try
            {
                // Get user information
                //$user = json_decode(json_encode($this->tokenHelper->getUserInfo()), true);

                // Get ID Token
                $token = $this->tokenHelper->getOIDC()->getIdTokenPayload();

                // Parse fields
                $uid = $token->{$rcmail->config->get('oidc_field_uid')};
                $eidas = $token->{$rcmail->config->get('oidc_field_eidas')};

                // Store eidas value
                unset($_SESSION['eidas']);
                $_SESSION['eidas'] = $eidas;

                // Get modified ID token
                // $password = $this->tokenHelper->modifyTokenID(
                //     $this->tokenHelper->getToken(TokenTypeEnum::ID_TOKEN), $user['uid'], ModificationTypeEnum::APPEND_CONTENT/*_JSON*/, false, false
                // );

                $password = $this->tokenHelper->getToken(TokenTypeEnum::ID_TOKEN);

                // mel_logs::get_instance()->log(mel_logs::ERROR, "roundcube_oidc user/pass");
                // mel_logs::get_instance()->log(mel_logs::ERROR, $uid);
                // mel_logs::get_instance()->log(mel_logs::ERROR, $password);
                // mel_logs::get_instance()->log(mel_logs::ERROR, $eidas);
            }
            catch (\Exception $e)
            {
                // TODO improve
                echo 'OIDC Authentication Failed <br/>' . $e->getMessage();
                mel_logs::get_instance()->log(mel_logs::ERROR, "OIDC Authentication Failed <br/>" . $e->getMessage());
            }
            
            // Modify args values
            // mel_logs::get_instance()->log(mel_logs::DEBUG, "roundcube_oidc - ajout de l'eidas dans args : ".$eidas);
            $args['user'] = $uid;
            $args['pass'] = $password;
            $args['cookiecheck'] = true;
            $args['valid'] = true;
            $args['eidas'] = $eidas;
        }

        return $args;
    }

    /**
     * Post-login hook handler
     */
    function login_after($args)
    {
        // Redirect to the previous QUERY_STRING
        if ($this->redirect_query)
        {
            header('Location: ./?' . $this->redirect_query);
            exit;
        }

        return $args;
    }
}

