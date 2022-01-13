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

abstract class AuthCheckType
{
    const KERB_COOKIES = "kerb_cookies"; // bool
    const KERB_BROWSERS = "kerb_browsers"; // array (browser => bool)
    const KERB_HEADERS = "kerb_headers"; // array (header => value)
    const KERB_SUBNETS = "kerb_subnets"; // array (subnet => bool)
}

class AuthCheck
{
    public /*string*/ $name;
    public /*bool*/ $enabled;
    public /*array*/ $values;
    public /*bool*/ $triggering;

    public function getEnabledString($bool = true)
    {
        if($bool) { return ($this->enabled ? 'true' : 'false'); }
        else { return ($this->enabled ? 'activée' : 'désactivée'); }
    }

    public function getTriggeringString($bool = true)
    {
        if($bool) { return ($this->triggering ? 'true' : 'false'); }
        else { return ($this->triggering ? 'validée' : 'non-validée'); }
    }

    public function __construct(/*string*/ $name, /*bool*/ $enabled, /*array*/ $values = [], /*bool*/ $triggering = false)
    {
        $this->name = $name;
        $this->enabled = $enabled;
        $this->values = $values;
        $this->triggering = $triggering;
    }

    public function __toString()
    {
        $string = "La méthode de vérification $this->name est ";
        if($this->enabled)
        {
            $string .= $this->getEnabledString(false);
            $string .= ".(Déclenchement : " . $this->getTriggeringString() . ").";
            $string .= "\r\nValeurs : " . print_r($this->values, true);
        }
        else
        {
            $string .= $this->getEnabledString(false);
        }
        return $string;
    }
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

    /**
     * @see https://gist.github.com/tott/7684443
     * Check if a given ip is in a network
     * @param  string $ip    IP to check in IPV4 format eg. 127.0.0.1
     * @param  string $range IP/CIDR netmask eg. 127.0.0.0/24, also 127.0.0.1 is accepted and /32 assumed
     * @return boolean true if the ip is in this range / false if not.
     */
    function ip_in_range( $ip, $range ) {
    	if ( strpos( $range, '/' ) == false ) {
    		$range .= '/32';
    	}
    	// $range is in IP/CIDR format eg 127.0.0.1/24
    	list( $range, $netmask ) = explode( '/', $range, 2 );
    	$range_decimal = ip2long( $range );
    	$ip_decimal = ip2long( $ip );
    	$wildcard_decimal = pow( 2, ( 32 - $netmask ) ) - 1;
    	$netmask_decimal = ~ $wildcard_decimal;
    	return ( ( $ip_decimal & $netmask_decimal ) == ( $range_decimal & $netmask_decimal ) );
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
        $cfg = $rcmail->config->all();

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
            $cookiesCheck = isset($cfg[AuthCheckType::KERB_COOKIES]) && ($cfg[AuthCheckType::KERB_COOKIES] == true)
                // new AuthCheck(name, enabled, values, triggering)
                ? new AuthCheck(AuthCheckType::KERB_COOKIES, true, [/* TODO get cookie name ? */], false) 
                : new AuthCheck(AuthCheckType::KERB_COOKIES, false);

            $browsersCheck = isset($cfg[AuthCheckType::KERB_BROWSERS]) 
            // new AuthCheck(name, enabled, values, triggering)
                ? new AuthCheck(AuthCheckType::KERB_BROWSERS, true, $cfg[AuthCheckType::KERB_BROWSERS], false) 
                : new AuthCheck(AuthCheckType::KERB_BROWSERS, false);

            $headersCheck = isset($cfg[AuthCheckType::KERB_HEADERS])
            // new AuthCheck(name, enabled, values, triggering) 
                ? new AuthCheck(AuthCheckType::KERB_HEADERS, true, $cfg[AuthCheckType::KERB_HEADERS], false) 
                : new AuthCheck(AuthCheckType::KERB_HEADERS, false);

            $subnetsCheck = isset($cfg[AuthCheckType::KERB_SUBNETS]) 
                // new AuthCheck(name, enabled, values, triggering)        
                ? new AuthCheck(AuthCheckType::KERB_SUBNETS, true, $cfg[AuthCheckType::KERB_SUBNETS], true) 
                : new AuthCheck(AuthCheckType::KERB_SUBNETS, false);

            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Méthodes de vérification actives :");
            foreach([$cookiesCheck, $browsersCheck, $headersCheck, $subnetsCheck] as $check)
            {
                mel_logs::get_instance()->log(mel_logs::DEBUG, $check);
            }
            
            // Cookies
            if($cookiesCheck->enabled)
            {
                mel_logs::get_instance()->log(mel_logs::ERROR, "[RC_Auth] Kerberos - !!! NOT_YET_IMPLEMENTED !!!.");
                mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Kerberos - !!! NOT_YET_IMPLEMENTED !!!.");
                // TODO implement
                // $cookiesCheck->triggering = true;
            }
            else { mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Kerberos - Pas de vérification sur les cookies du client."); }
            
            // Browsers
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Kerberos - User-Agent : " . $_SERVER['HTTP_USER_AGENT']);
            
            if($browsersCheck->enabled)
            {
                $browserCheckResults = [];

                foreach($browsersCheck->values as $browser => $enable)
                {
                    $enable_str = $enable ? "autorisé" : "bloqué";
                    $browser_str = ($browser == " ") ? "ALL" : $browser;
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "Vérification de la règle de type Browser : $browser ($enable_str)");
                    
                    if(strpos($_SERVER['HTTP_USER_AGENT'], $browser) !== false)
                    {
                        mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Kerberos - Le client utilise un navigateur $enable_str par la règle $browser_str !");
                        //$browsersCheck->triggering = $enable;
                        array_push($browserCheckResults, $enable);
                    }
                }

                // Returns true only if all checks are true
                $browsersCheck->triggering = !in_array(false, $browserCheckResults, true);
            }
            else { mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Kerberos - Pas de vérification sur le navigateur du client."); }
            
            // Headers            
            if($headersCheck->enabled)
            {
                foreach($headersCheck->values as $header => $value)
                {
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Kerberos - Valeur de \$_SERVER[$header] : $_SERVER[$header]");
                    
                    if($_SERVER[$header] == $value)
                    {
                        mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Kerberos - Le client arrive avec la valeur attendue pour $header !");
                        $headersCheck->triggering = true;
                    }
                }
            }
            else { mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Kerberos - Pas de vérification sur les headers."); }
            
            // Subnets            
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Kerberos - REMOTE_ADDR : " . $_SERVER['REMOTE_ADDR']);
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Kerberos - HTTP_X_FORWARDED_FOR : " . $_SERVER['HTTP_X_FORWARDED_FOR']);
            
            if($subnetsCheck->enabled)
            {
                $subnetsCheckResults = [];

                foreach($subnetsCheck->values as $subnet => $enable)
                {
                    $enable_str = $enable ? "autorisé" : "bloqué";
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "Vérification de la règle de type Subnet $subnet ($enable_str)");
                    
                    if($this->ip_in_range($_SERVER['REMOTE_ADDR'], $subnet) || 
                        $this->ip_in_range($_SERVER['HTTP_X_FORWARDED_FOR'], $subnet))
                    {
                        mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Kerberos - Le client arrive avec une IP dans un subnet $enable_str par la règle $subnet !");
                        //$subnetsCheck->triggering = $enable;
                        array_push($subnetsCheckResults, $enable);
                    }
                }

                // Returns true only if all checks are true
                $browsersCheck->triggering = !in_array(false, $subnetsCheckResults, true);
            }
            else { mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Kerberos - Pas de vérification sur l'adresse IP du client."); }

            // Sum all checks
            $checks = [];
            foreach([$cookiesCheck, $browsersCheck, $headersCheck, $subnetsCheck] as $check)
            {
                if($check->enabled)
                {
                    mel_logs::get_instance()->log(mel_logs::DEBUG, $check);
                    array_push($checks, $check->triggering);
                }
            }

            // If 'checks' array is empty, do not use Kerberos (=> no checks have been enabled)
            // If one of the 'checks' element is enabled AND false, do not use Kerberos (=> at least one check is false)
            if(!empty($checks) && in_array(false, $checks, true) === false)
            {
                $auth = AuthTypeEnum::KERBEROS; 
            }
        }

        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Détermination de la méthode d'auth...");
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

        // User not logged in && GET request only (to avoid triggering on login POST and making a loop)
        if(empty($_SESSION['user_id']) && $_SERVER['REQUEST_METHOD'] === 'GET')
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

                if($this->check_ldap_oidc($uid))
                {
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
                else
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] OIDC - Utilisateur non autorisé à se connecter en OIDC (LDAP).");
                }
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

