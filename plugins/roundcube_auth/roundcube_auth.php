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

abstract class RedirectTypeEnum
{
    const NORMAL = "NORMAL";
    const LOGOUT = "LOGOUT";
    const OIDC = "OIDC";
    const KERBEROS = "KERB";
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
    private $enabled = '1';
    private $selected_auth = AuthTypeEnum::PASSWORD;
    // private $redirect_query;
    private $auth_helper;
    private $oidc_helper;

    private $kerb_enabled;
    private $kerb_keyword;
    private $oidc_enabled;
    private $oidc_keyword;
    private $oidc_exp_delay;
    private $oidc_act_delay;
    private $refresh_actions;
    private $config_init = false;

    /**
     * Plugin initialization
     */
    function init()
    {
        // Get Roundcube instance
        $rcmail = rcmail::get_instance();

        // Load plugin's config file
        $this->load_config();

        // Add plugin's functions to Roundcube
        $this->add_hook('startup', array($this, 'startup'));
        $this->add_hook('authenticate', array($this, 'authenticate'));
        $this->add_hook('login_after', array($this, 'login_after'));

        // Add OIDC/CAS login button
        $this->add_hook('template_object_loginform',  array($this, 'loginform'));

        // Get variables from config
        if($this->kerb_enabled = $rcmail->config->get('auth_kerb_enabled'))
        {
            $this->kerb_keyword = $rcmail->config->get('auth_kerb_keyword');
        }
        if($this->oidc_enabled = $rcmail->config->get('auth_oidc_enabled'))
        {
            $this->oidc_keyword = $rcmail->config->get('auth_oidc_keyword');
            $this->oidc_exp_delay = $rcmail->config->get('oidc_exp_delay');//, TODO_DEFAULT_VALUE);
            $this->oidc_act_delay = $rcmail->config->get('oidc_act_delay');//, TODO_DEFAULT_VALUE);
        }
        $this->refresh_actions = $rcmail->config->get('refresh_actions');
        $this->config_init = true;

        // JS link
        $this->include_script('roundcube_auth.js');
    }

    function loginform($args)
    {
        // Get Roundcube instance
        $rcmail = rcmail::get_instance();

        if($rcmail->config->get('auth_oidc_link_enabled', false))
        {
            $name = $rcmail->config->get('auth_oidc_link_name', 'OpenIDConnect');

            $oidcbutton = "<p class='formbuttons'><input id='rcmlogin_oidc' class='button mainaction' type='submit' value='Connexion via $name'></p>";
            $oidclink = "<p class='formbuttons'><a href='?oidc=1'>Connexion via $name </a></p>";

            // Add the login link
            $args['content'] = $args['content'] . $oidcbutton . $oidclink;
        }

        return $args;
    }

    /**
     * @see https://gist.github.com/tott/7684443
     * Check if a given ip is in a network
     * @param  string $ip    IP to check in IPV4 format eg. 127.0.0.1
     * @param  string $range IP/CIDR netmask eg. 127.0.0.0/24, also 127.0.0.1 is accepted and /32 assumed
     * @return boolean true if the ip is in this range / false if not.
     */
    function ip_in_range($ip, $range)
    {
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

    function str_contains($haystack, $needle)
    {
        return $needle !== '' && mb_strpos($haystack, $needle) !== false;
    }
    
    function contains($str, array $arr)
    {
        foreach($arr as $a)
        {
            if($this->str_contains($str,$a) !== false) return true;
        }
        return false;
    }

    /**
     * 
     */
    function storeQuery()
    {
        if(empty($_SESSION['redirect_query']) == false)
        {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] Redirection Query is already stored : ".$_SESSION['redirect_query']);
        }
        else
        {
            // if the query contains these values, we do no store it
            $avoid = ['task=login', 'task=logout', 'kerb=1'];

            if(empty($_SERVER['QUERY_STRING']) == false && $this->contains($_SERVER['QUERY_STRING'], $avoid) == false)
            {
                // if the query contains these values, we remove them before storing it
                $replace = ['&_action=refresh'];

                $_SESSION['redirect_query'] = str_replace($replace, [''], $_SERVER['QUERY_STRING']);

                mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] Redirection Query has been stored : ".$_SESSION['redirect_query']);
            }
            else
            {
                mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] Redirection Query NOT stored : ".$_SERVER['QUERY_STRING']);  
            }
        }
    }

    // query : usually $_SERVER['QUERY_STRING']
    // type : RedirectionTypeEnum (NORMAL, LOGOUT, OIDC, KERBEROS)
    // rcmail : rcmail instance
    function redirect($query, $type, $rcmail)
    {
        // Query variables
        $location = 'Location: ./?';
        $prefixQuery = '&';
        $finalQuery = $emptyQuery = "";

        // Build query depending on type
        switch($type)
        {
            case RedirectTypeEnum::NORMAL:
                //
                $finalQuery = $location . $query;
            break;
            
            case RedirectTypeEnum::LOGOUT:
                // Logout task and CRSF token
                $logout = "_task=logout&_token=" . $rcmail->get_request_token();
                // Query content if not empty
                $query = !empty($query) ? $prefixQuery . $query : $emptyQuery;
                // 
                $finalQuery = $location . $logout . $query;
            break;
            
            case RedirectTypeEnum::OIDC:
                // OIDC query
                $oidc = $this->oidc_keyword . "=1";
                // Query content if not empty
                //$query = !empty($query) ? $prefixQuery . $query : $emptyQuery;
                // 
                $finalQuery = $location . $oidc;// . $query;
            break;

            case RedirectTypeEnum::KERBEROS:
                // OIDC query
                $kerb = $this->kerb_keyword . "=1";
                // Query content if not empty
                //$query = !empty($query) ? $prefixQuery . $query : $emptyQuery;
                // 
                $finalQuery = $location . $kerb;// . $query;
            break;
        }
        
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Trying to redirect to $finalQuery");
        //
        if(!empty($finalQuery))
        {
            // Do the redirection and exit
            header($finalQuery);
            // exit; // TODO exit
        }
    }

    private function onError($msg_log, $msg_user, $error)
    {
        mel_logs::get_instance()->log(mel_logs::ERROR, "[RC_Auth] $msg_log : " . $error->getMessage());
        
        // header('Location: ?_task=logout&_logout_msg=' . $msg_user . '&_token=' . $rcmail->get_request_token());
        $this->redirect("", RedirectTypeEnum::LOGOUT, rcmail::get_instance());
        // $rcmail->output->command('plugin.auth_logout', $msg_user);
        // rcmail::get_instance()->output->command('plugin.auth_logout', $msg_user);
    }

    private function select_auth()
    {
        // Get Roundcube instance
        $rcmail = rcmail::get_instance();
        $cfg = $rcmail->config->all();

        // Store (default) auth
        $auth = AuthTypeEnum::PASSWORD;

        // OIDC only
        if($this->oidc_enabled)
        {
            if(false) // TODO check if cookie contains OIDC
            {
                $auth = AuthTypeEnum::OIDC;
            }
        }

        // OIDC with Kerberos
        if($this->kerb_enabled)
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
        $user->load(['cerbere']); // TODO config plugin

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

    private function reconnect_oidc($reason, $rcmail)
    {
        mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] Reconnexion OIDC déclenchée ($reason)");

        // Delete stored things
        $rcmail->kill_session();
        // $rcmail->logout_actions();

        // Store the redirection query
        $this->storeQuery();

        // Force re-auth
        // // $this->redirect(""/* $_SERVER['QUERY_STRING'] */, RedirectTypeEnum::OIDC, $rcmail);
        // $rcmail->output->command('plugin.auth_redirect', $this->oidc_keyword . "=" . $this->enabled);
    }

    private function check_token_expiration($rcmail)
    {
        $expiration_time = $_SESSION['idtoken_exp'];
        $expiration_delay =  $this->oidc_exp_delay;
        //
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Expiration validity check");
        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Expiration delay : " . strval(time() - $expiration_time) ."/$expiration_delay ($expiration_time)");

        // Si on a atteint ou dépassé le délai d'expiration du token, on relance l'auth OIDC (utilisateur présent)
        if(isset($expiration_time) && (time() - $expiration_time) > $expiration_delay)
        {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] reconnect_oidc ". json_encode($args));
            $this->reconnect_oidc("Expiration du token", $rcmail);
        }
    }

    /**
     * Startup hook handler
     */
    function startup($args)
    {
        // Get Roundcube instance
        $rcmail = rcmail::get_instance();

        // Prepare variables
        $kerb_query = $_GET[$this->kerb_keyword];
        //$kerb_param = $_SERVER['REMOTE_USER']; //TODO
        $oidc_query = $_GET[$this->oidc_keyword];
        $oidc_param = $_GET['code'];

        // User not logged in && GET request only (to avoid triggering on login POST and making a loop)
        if(empty($_SESSION['user_id']) && $_SERVER['REQUEST_METHOD'] === 'GET')
        {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Startup - Authentication process");

            // Variables
            $oidc = false;

            // Kerberos (triggered by query)
            if($this->kerb_enabled && isset($kerb_query))
            {
                mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [Kerberos] Déclenchement");
                mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] PHP - REMOTE_USER : " . $_SERVER['REMOTE_USER']);

                if(!empty($_SERVER['REMOTE_USER']) && $kerb_query == $this->enabled)
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
            else if($this->oidc_enabled && isset($oidc_query))
            {/*
                if(isset($oidc_param))
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [OIDC] Déclenchement déjà réalisé");
                }
                else*/
                if($oidc_query == $this->enabled)
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [OIDC] Déclenchement en cours");
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

                // Store the redirection query
                $this->storeQuery();
    
                switch($selected_auth)
                {   
                    case AuthTypeEnum::KERBEROS:
                        // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Redirection vers $kerb_keyword=$enabled");
                        $this->redirect("", RedirectTypeEnum::KERBEROS, $rcmail); // todo add task login ?
                    break;

                    case AuthTypeEnum::OIDC:
                        // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Redirection vers $oidc_keyword=$enabled");
                        $this->redirect("", RedirectTypeEnum::OIDC, $rcmail); // todo add task login ?
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
                mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] Incoming with query : ".$_SERVER['QUERY_STRING']);

                if(isset($oidc_param))  // retour de connexion OIDC (oidc=1&code=...)
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [OIDC] Retour de la connexion OIDC");

                    // Retrieve (and move) the redirection query
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] Retrieving RQ : ".$_SESSION['redirect_query']);
                    $_COOKIE['redirect_query'] = $_SESSION['redirect_query'];
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] Retrieving RQ : ".$_COOKIE['redirect_query']);

                    // Trigger login action
                   $args['action'] = 'login';
                }
                else // déclenchement de connexion OIDC à effectuer
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] [OIDC] Déclenchement de la connexion OIDC");

                    // Store the redirection query
                    $this->storeQuery();
                }
              
                // Dans les deux cas, on exécute le code suivant
                //      soit pour crééer un nouvel objet TokenHelper et déclencher l'auth
                //      soit pour recréer cet objet et récupérer l'auth
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
                        $rcmail->config->get('oidc_proxy', ''),
                        $rcmail->config->get('oidc_redirect', '')
                    );
                    
                    $timezone = rcube_utils::get_input_value('_timezone', rcube_utils::INPUT_GPC);
                    if (!isset($_SESSION['timezone']) && isset($timezone) && is_string($timezone) && $timezone !== '_default_') {
                        $_SESSION['timezone'] = $timezone;
                        rcube_utils::setcookie('_timezone', $timezone);
                    } 

                    // Authenticate
                    $this->oidc_helper->doAuth();
                }
                catch (\Exception $e)
                {
                    $this->onError(
                        "Authentification OIDC - Erreur lors de l'appel au provider (Cerbère)", 
                        "Erreur lors de la connexion à Cerbère (code 1)",
                    $e);
                }

            }

            //endregion =================================
        }

        // Si la dernière connexion n'était pas en OIDC, on ne déclenche pas la mécanique inactivité/expiration
        else if(isset($_SESSION['auth_type']) && $_SESSION['auth_type'] == 'oidc')
        {
            // Lors de la déconnexion ou de la connexion OIDC, on ne déclenche pas la mécanique inactivité/expiration
            if($rcmail->task != 'logout' && $oidc_query != $this->enabled)
            {
                // Action automatique (refresh)
                if (in_array($rcmail->action, $this->refresh_actions))
                {
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Refresh à " . time()); // TODO REMOVE
    
                    $activity_time = $_SESSION['last_user_action'];
                    $inactivity_delay = $this->oidc_act_delay;
                    //
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Inactivity delay check");
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Inactivity delay : " . strval(time() - $activity_time) ."/$inactivity_delay ($activity_time)");
    
                    // Si le délai d'inactivité a été atteint
                    if(isset($activity_time) && (time() - $activity_time) > $inactivity_delay)
                    {
                        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] reconnect_oidc ". json_encode($args));
                        $this->reconnect_oidc("Inactivité utilisateur", $rcmail);
                    }
                    else
                    {
                        // Si le token est proche de l'expiration, on relance l'auth OIDC (utilisateur présent)
                        $this->check_token_expiration($rcmail);
                    }
                }
                
                // Action de l'utilisateur
                else if ($rcmail->output->type == 'html')
                {
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Action utilisateur à " . time()); // TODO REMOVE
    
                    // Stockage du timestamp de la dernière action utilisateur
                    $_SESSION['last_user_action'] = time();

                    // Si le token est proche de l'expiration, on relance l'auth OIDC (utilisateur présent)
                    $this->check_token_expiration($rcmail);
                }
            }
        }

        mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] Return args : " . implode(',', $args));
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
                // $user = json_decode(json_encode($this->oidc_helper->getUserInfo()), true);
                // mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] OIDC - User information : ". json_encode($user));

                // Get ID Token
                $token = $this->oidc_helper->getOIDC()->getIdTokenPayload();

                // Parse fields
                $uid = $token->{$rcmail->config->get('oidc_field_uid')};
                $eidas = $token->{$rcmail->config->get('oidc_field_eidas')};
                $exp = $token->{'exp'};

                if($this->check_ldap_oidc($uid))
                {
                    // Remove previously stored values
                    unset($_SESSION['eidas']);
                    unset($_SESSION['auth_type']);
                    unset($_SESSION['idtoken']);
                    unset($_SESSION['idtoken_exp']);

                    // Store new values
                    $_SESSION['eidas'] = $eidas;
                    $_SESSION['auth_type'] = 'oidc';
                    $_SESSION['idtoken'] = $token; //rcmail::get_instance()->encrypt($token);
                    $_SESSION['idtoken_exp'] = time();
    
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] OIDC - Stockage du token pour $uid et de son expiration $exp.");
    
                    // Set token as password
                    $password = $this->oidc_helper->getToken(TokenTypeEnum::ID_TOKEN);
                
                    // Modify args values
                    $args['user'] = $uid;
                    $args['pass'] = $password;
                    $args['cookiecheck'] = true;
                    $args['valid'] = true;
                    $args['eidas'] = $eidas;

                    // L'URL de la requête est stockée dans $_COOKIE['redirect_query']
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] Stored query for login_after : ".$_SESSION['redirect_query']);
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] Stored query for login_after : ".$_COOKIE['redirect_query']);

                    // Garder/stocker le login (cf. 'Gestion du keep login' dans 'mel_ldap_auth.php')
                    $_POST['_keeplogin'] = true;

                    // Display args values
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] OIDC - Login args : " . json_encode($args));
                }
                else
                {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[RC_Auth] OIDC - Utilisateur non autorisé à se connecter en OIDC (LDAP).");
                }
            }
            catch (\Exception $e)
            {
                $this->onError(
                    "Authentification OIDC - Erreur lors du traitement des informations reçues", 
                    "Erreur lors de la connexion à Cerbère (code 2)",
                $e);
            }
        }

        return $args;
    }

    /**
     * Post-login hook handler
     */
    function login_after($args)
    {
        if(empty($_COOKIE['redirect_query']) == false)
        {
            // Extract elements from the query
            parse_str($_COOKIE['redirect_query'] , $args);

            mel_logs::get_instance()->log(mel_logs::DEBUG, "[RC_Auth] [OIDC] login_after : ".json_encode($args));
        }
        
        // Roundcube will redirect to that URL
        return $args;
    }

}
