<?php
/**
 * Plugin Mél double authentification
 *
 * plugin mel_doubleauth pour roundcube
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
require_once 'PHPGangsta/GoogleAuthenticator.php';

class mel_doubleauth extends rcube_plugin {
    /**
     *
     * @var rcmail
     */
    private $rc;
    
    private $_number_recovery_codes = 4;
    
    /**
     * Expiration du cookie : calcul pour 30 jours (60*60*24*30)
     */
    private static $expire_cookie = 2592000;
    
    /**
     * Initialisation du plugin
     *
     * @see rcube_plugin::init()
     */
    function init() {
        global $config;
        
        $this->rc = rcmail::get_instance();
        $this->load_config();
        
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path().'/mel_doubleauth.css');
        
        // hooks
        if (!$this->is_internal()) { // Connexion intranet => pas de double auth
            $this->add_hook('login_after', array($this, 'login_after'));
            $this->add_hook('send_page', array($this, 'check_2FAlogin'));
            $this->add_hook('render_page', array($this, 'popup_msg_enrollment'));
        }
        
        $this->add_texts('localization/', true);
        
        // check code with ajax
        $this->register_action('plugin.mel_doubleauth-checkcode', array($this, 'checkCode'));
        
        // add user with ajax
        $this->register_action('plugin.mel_doubleauth-adduser', array($this, 'addUser'));
        $this->register_action('plugin.mel_doubleauth-removeuser', array($this, 'removeUser'));
        
        // config
        $this->register_action('mel_doubleauth', array($this, 'mel_doubleauth_init'));
        if ($this->rc->task == 'settings'){
            $this->register_action('plugin.mel_doubleauth-save', array($this, 'mel_doubleauth_save'));
        }
        $this->include_script('mel_doubleauth.js');
        $this->include_script('qrcode.min.js');
    }
    
    // Use the form login, but removing inputs with jquery and action (see twofactor_gauthenticator_form.js)
    function login_after($args)
    {
        if ($this->is_internal()) { // Connexion intranet => pas de double auth
            return $args;
        }
        
        $_SESSION['mel_doubleauth_login'] = time();
        
        $config_2FA = self::__get2FAconfig();
        
        if(isset($_COOKIE['roundcube_login'])){
            // Vérifier la présence du cookies
            if (isset($_COOKIE['roundcube_doubleauth'])) {
                $info_doubleauth = explode('###', $_COOKIE['roundcube_doubleauth']);
                if(count($info_doubleauth) == 4){
                    // test d'expiration cookies
                    if($info_doubleauth[2] > time()){
                        // envoi des infos au webservice pour vérification
                        if(self::__ValidateCookie($this->rc->user->get_username(),$info_doubleauth[1],$info_doubleauth[2],$info_doubleauth[3])){
                            mel_logs::get_instance()->log(mel_logs::DEBUG, "__ValidateCookie : true");
                            // mettre à jour le cookie et la base de données dynalogin
                            $expiration = self::$expire_cookie + time();
                            setcookie('roundcube_doubleauth', $info_doubleauth[0] . "###" . $info_doubleauth[1] . "###" . $expiration . "###roundcube", $expiration);
                            // envoi des données au webservice pour sauvegarde en base
                            self::__modifyCookie($info_doubleauth[0] , $info_doubleauth[1], intval($expiration),"roundcube");
                            $this->__goingRoundcubeTask('mail');
                        }else{
                            mel_logs::get_instance()->log(mel_logs::DEBUG, "__ValidateCookie : false");
                            unset($_COOKIE['roundcube_doubleauth']);
                            setcookie('roundcube_doubleauth', null, - 1);
                        }
                    }else{
                        mel_logs::get_instance()->log(mel_logs::DEBUG, "__ValidateCookie : expire");
                        unset($_COOKIE['roundcube_doubleauth']);
                        setcookie('roundcube_doubleauth', null, - 1);
                    }
                }else{
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "__ValidateCookie : pas correct");
                    unset($_COOKIE['roundcube_doubleauth']);
                    setcookie('roundcube_doubleauth', null, - 1);
                }
            }
        }else{
            mel_logs::get_instance()->log(mel_logs::DEBUG, "cookie login : pas présent");
            unset($_COOKIE['roundcube_doubleauth']);
            setcookie('roundcube_doubleauth', null, - 1);
        }
        
        if(!$config_2FA['activate'])
        {
            if($this->rc->config->get('force_enrollment_users'))
            {
                $this->__goingRoundcubeTask('settings', 'plugin.mel_doubleauth');
            }
            return $args;
        }
        
        $this->rc->output->set_pagetitle($this->gettext('mel_doubleauth'));
        
        $this->add_texts('localization', true);
        $this->include_script('mel_doubleauth_form.js');
        
        $this->rc->output->send('login');
    }
    
    // capture webpage if someone try to use ?_task=mail|addressbook|settings|... and check auth code
    function check_2FAlogin($p)
    {
        if ($this->is_internal()) { // Connexion intranet => pas de double auth
            return $p;
        }
        
        $config_2FA = self::__get2FAconfig();
        
        if($config_2FA['activate'])
        {
            $code = rcube_utils::get_input_value('_code_2FA', rcube_utils::INPUT_POST);
            
            if($code)
            {
                if(self::__checkCode($code) || self::__isRecoveryCode($code))
                {
                    if(self::__isRecoveryCode($code))
                    {
                        self::__consumeRecoveryCode($code);
                    }
                    
                    if(isset($_COOKIE['roundcube_login'])){
                        // création d'un cookie pour la sauvegarde de l'authentification.
                        $expiration = self::$expire_cookie + time();
                        setcookie('roundcube_doubleauth', $this->rc->user->get_username() . "###" . $code . "###" . $expiration . "###roundcube", $expiration);
                        // envoi des données au webservice pour sauvegarde en base
                        self::__addCookie($this->rc->user->get_username() , $code, intval($expiration),"roundcube");
                    }else{
                        unset($_COOKIE['roundcube_doubleauth']);
                        setcookie('roundcube_doubleauth', null, - 1);
                    }
                    $this->__goingRoundcubeTask('mail');
                }
                else
                {
                    $this->__exitSession();
                }
            }
            // we're into some task but marked with login...
            elseif($this->rc->task !== 'login' && ! $_SESSION['mel_doubleauth_2FA_login'] >= $_SESSION['mel_doubleauth_login'])
            {
                $this->__exitSession();
            }
            
        }
        elseif($this->rc->config->get('force_enrollment_users') && ($this->rc->task !== 'settings' || $this->rc->action !== 'plugin.mel_doubleauth'))
        {
            if($this->rc->task !== 'login')	// resolve some redirection loop with logout
            {
                $this->__goingRoundcubeTask('settings', 'plugin.mel_doubleauth');
            }
        }
        
        return $p;
    }
    
    
    // ripped from new_user_dialog plugin
    function popup_msg_enrollment()
    {
        $config_2FA = self::__get2FAconfig();
        
        if(!$config_2FA['activate']
            && $this->rc->config->get('force_enrollment_users') && $this->rc->task == 'settings' && $this->rc->action == 'plugin.mel_doubleauth')
        {
            // add overlay input box to html page
            $this->rc->output->add_footer(html::tag('form', array(
                'id' => 'enrollment_dialog',
                'method' => 'post'),
                html::tag('h3', null, $this->gettext('enrollment_dialog_title')) .
                $this->gettext('enrollment_dialog_msg')
                ));
            
            $this->rc->output->add_script(
                "$('#enrollment_dialog').show().dialog({ modal:true, resizable:false, closeOnEscape: true, width:420 });", 'docready'
                );
        }
    }
    
    
    // show config
    function mel_doubleauth_init()
    {
        $this->add_texts('localization/', true);
        if ($this->rc->task == 'settings' && $this->rc->action == 'plugin.mel_doubleauth')
        {
            $this->register_handler('plugin.body', array($this, 'mel_doubleauth_form'));
        }
        $this->rc->output->set_pagetitle($this->gettext('mel_doubleauth'));
        $this->rc->output->send('plugin');
    }
    
    // save config
    function mel_doubleauth_save()
    {
        $this->add_texts('localization/', true);
        $this->register_handler('plugin.body', array($this, 'mel_doubleauth_form'));
        $this->rc->output->set_pagetitle($this->gettext('mel_doubleauth'));
        
        // POST variables
        $activate = rcube_utils::get_input_value('2FA_activate', rcube_utils::INPUT_POST);
        $recovery_codes = rcube_utils::get_input_value('2FA_recovery_codes', rcube_utils::INPUT_POST);
        
        // remove recovery codes without value
        $recovery_codes = array_values(array_diff($recovery_codes, array('')));
        
        $data = self::__get2FAconfig();
        $data['secret'] = $secret;
        $data['activate'] = $activate ? true : false;
        $data['recovery_codes'] = $recovery_codes;
        self::__set2FAconfig($data);
        
        // if we can't save time into SESSION, the plugin logouts
        $_SESSION['mel_doubleauth_2FA_login'] = time();
        
        $this->rc->output->show_message($this->gettext('successfully_saved'), 'confirmation');
        
        $this->rc->overwrite_action('plugin.mel_doubleauth');
        $this->rc->output->send('plugin');
    }
    
    
    // form config
    public function mel_doubleauth_form()
    {
        $this->add_texts('localization/', true);
        $this->rc->output->set_env('product_name', $this->rc->config->get('product_name'));
        
        $data = self::__get2FAconfig();
        
        // Fields will be positioned inside of a table
        $table = new html_table(array('cols' => 3));
        
        // infor
        // 		$table->add('title', 'Informations :');
        $table->add(array('class' => 'texte_explic', 'colspan' => '3'), $this->gettext('msg_infor'));
        $table->add(array( 'colspan' => '3'),'<br />');
        
        // secret base
        $field_id = '2FA_secret';
        $input_descsecret = new html_inputfield(array('name' => $field_id, 'id' => $field_id, 'type' => 'hidden', 'value' => $data['secret']));
        $html_secret = $input_descsecret->show();
        $table->add(array( 'colspan' => '3'), $html_secret);
        
        if($data['activate'] == null){
            // Activate/deactivate
            $field_id = '2FA_activate_button';
            $bouton_active = new html_inputfield(array('name' => $field_id, 'id' => $field_id, 'type' => 'button', 'class' => 'button mainaction', 'value' => $this->gettext('activate')));
            $table->add(array('width'=>'20px'),'<span class="cercle">1</span>');
            $table->add(array('width'=>'20%'),  html::label($field_id, $this->Q($this->gettext('label_activate'))));
            // $checked = $data['activate'] ? null: 1; // :-?
            $table->add(null, $bouton_active->show());
            $table->add(null, "");
            $table->add(array('colspan' => '2'), $this->gettext('info_activer'));
            
            $field_id = '2FA_activate';
            $input_descsecret = new html_inputfield(array('name' => $field_id, 'id' => $field_id, 'type' => 'hidden', 'value' => '1', 'readonly' => 'readonly'));
            $html_secret = $input_descsecret->show();
            $table->add(array( 'colspan' => '3'), $html_secret);
            
            
            $html_recovery_codes = '';
            $i=0;
            for($i = 0; $i < $this->_number_recovery_codes; $i++)
            {
                $value = isset($data['recovery_codes'][$i]) ? $data['recovery_codes'][$i] : '';
                $html_recovery_codes .= ' <input type="hidden" readonly = "readonly" name="2FA_recovery_codes[]" value="'.$value.'" maxlength="10"> &nbsp; ';
            }
            // $html_recovery_codes .= '<input type="button" class="button mainaction" id="2FA_show_recovery_codes" value="'.$this->gettext('show_recovery_codes').'">';
            $table->add(array('colspan' => '3'), $html_recovery_codes);
            
            // Build the table with the divs around it
            $out = html::div(array('class' => 'settingsbox', 'style' => 'margin: 0;'),
                html::div(array('id' => 'prefs-title', 'class' => 'boxtitle'), $this->gettext('mel_doubleauth') . ' - ' . $this->rc->user->data['username']) .
                html::div(array('class' => 'boxcontent'), $table->show()
                    )
                );
        }else{
            $table->add(array('colspan' => '3'), $this->gettext('info_active_ok'));
            $html_check_code = '<input type="text" id="2FA_code_to_check" maxlength="10">&nbsp;&nbsp;<input type="button" class="button mainaction" id="2FA_check_code" value="'.$this->gettext('check_code').'">';
            $table->add(array('colspan' => '3'), $this->gettext('info_check_code'));
            $table->add(array('colspan' => '3'),$html_check_code);
            $table->add(array( 'colspan' => '3'),'<br />');
            // recovery codes
            $table->add(array('class' => 'title','colspan'=>'3'), $this->gettext('recovery_codes'));
            
            $html_recovery_codes = '';
            $html_recovery_codes .= '<input type="button" class="button mainaction" id="2FA_show_recovery_codes" value="'.$this->gettext('show_recovery_codes').'">';
            $i=0;
            for($i = 0; $i < $this->_number_recovery_codes; $i++)
            {
                $value = isset($data['recovery_codes'][$i]) ? $data['recovery_codes'][$i] : '';
                $html_recovery_codes .= ' <input type="password" readonly = "readonly" name="2FA_recovery_codes[]" value="'.$value.'" maxlength="10"> &nbsp; ';
            }
            $table->add(array('colspan' => '3'), $html_recovery_codes);
            
            $table->add(array( 'colspan' => '3'),'<br />');
            $table->add(array('colspan' => '3'), $this->gettext('info_desactiver'));
            
            $field_id = '2FA_desactivate_button';
            $bouton_active = new html_inputfield(array('name' => $field_id, 'id' => $field_id, 'type' => 'button', 'class' => 'button mainaction', 'value' => $this->gettext('desactivate')));
            // $checked = $data['activate'] ? null: 1; // :-?
            $table->add(array('colspan' => '3'), $bouton_active->show());
            
            
            $out = html::div(array('class' => 'settingsbox', 'style' => 'margin: 0;'),
                html::div(array('id' => 'prefs-title', 'class' => 'boxtitle'), $this->gettext('mel_doubleauth') . ' - ' . $this->rc->user->data['username']) .
                html::div(array('class' => 'boxcontent'), $table->show()
                    )
                );
        }
        
        
        // Construct the form
        $this->rc->output->add_gui_object('mel_doubleauthform', 'mel_doubleauth-form');
        
        $out = $this->rc->output->form_tag(array(
            'id' => 'mel_doubleauth-form',
            'name' => 'mel_doubleauth-form',
            'method' => 'post',
            'action' => './?_task=settings&_action=plugin.mel_doubleauth-save',
        ), $out);
        
        return $out;
    }
    
    
    // used with ajax
    function checkCode() {
        $code = rcube_utils::get_input_value('code', rcube_utils::INPUT_GET);
        mel_logs::get_instance()->log(mel_logs::DEBUG, "***** checkCode ***** : " . $code);
        
        if(self::__checkCode($code)) {
            echo $this->gettext('code_ok');
        } else {
            echo $this->gettext('code_ko');
        }
        exit;
    }
    
    // used with ajax
    function addUser() {
        $unlock = trim(rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GET));
        mel_logs::get_instance()->log(mel_logs::DEBUG, "***** addUser ***** : " . $this->rc->user->get_username());
        
        $secret = self::__addUser();
        $result = array(
            'action' => 'plugin.mel_doubleauth-adduser',
            'code' => $secret,
            'unlock' => $unlock
        );
        echo json_encode($result);
        exit;
    }
    
    // used with ajax
    function removeUser() {
        $unlock = trim(rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GET));
        mel_logs::get_instance()->log(mel_logs::DEBUG, "***** removeUser ***** : " . $this->rc->user->get_username());
        self::__removeUser();
        $result = array(
            'action' => 'plugin.mel_doubleauth-removeuser');
        echo json_encode($result);
        exit;
    }
    
    //------------- static methods
    /**
     * Return if the double auth is enable for this session for the user
     * 
     * @return boolean
     */
    public static function is_double_auth_enable() {
      return isset($_SESSION['mel_doubleauth_2FA_login']);
    }
    
    
    //------------- private methods
    
    // redirect to some RC task and remove 'login' user pref
    private function __goingRoundcubeTask($task='mail', $action=null) {
        
        $_SESSION['mel_doubleauth_2FA_login'] = time();
        header('Location: ?_task='.$task . ($action ? '&_action='.$action : '') );
        exit;
    }
    
    private function __exitSession() {
        unset($_SESSION['mel_doubleauth_login']);
        unset($_SESSION['mel_doubleauth_2FA_login']);
        
        header('Location: ?_task=logout&_token='.$this->rc->get_request_token());
        exit;
    }
    
    private function __get2FAconfig()
    {
        $user = $this->rc->user;
        
        $arr_prefs = $user->get_prefs();
        $pref_name = 'mel_doubleauth';
        
        if (!isset($arr_prefs[$pref_name])) {
          $pref_name = 'melanie2_doubleauth';
        }
        
        // Connexion au serveur de webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            // MANTIS 
            //"cache_wsdl" => WSDL_CACHE_NONE,
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl')
        ));
        try {
            $response = $client->isActivated($this->rc->user->get_username());
        }
        catch(Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__get2FAconfig : Erreur web service : ".$e->getMessage());
        }
        $arr_prefs[$pref_name]['activate'] = $response;
        $arr_prefs[$pref_name]['secret'] = ($response) ? '*************' : '';
        
        return $arr_prefs[$pref_name];
    }
    
    // we can set array to NULL to remove
    private function __set2FAconfig($data)
    {
        $user = $this->rc->user;
        
        $arr_prefs = $user->get_prefs();
        if ($data["activate"] === false ) {
            // Connexion au serveur de webservice
            try {
                $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
                    // MANTIS
                    //"cache_wsdl" => WSDL_CACHE_NONE,
                    "cache_wsdl" => WSDL_CACHE_BOTH,
                    "connection_timeout" => 5,
                    "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
                    "login" => $this->rc->user->get_username(),
                    "password" => $this->rc->get_user_password()
                ));
                $response = $client->removeUser($this->rc->user->get_username());
                $arr_prefs['mel_doubleauth'] = null;
            }
            catch(Exception $e) {
                mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__get2FAconfig : Erreur web service : ".$e->getMessage());
            }
        } else {
            unset($data["secret"]);
            unset($data["activate"]);
            $arr_prefs['mel_doubleauth'] = $data;
        }
        
        return $user->save_prefs($arr_prefs);
    }
    
    private function __isRecoveryCode($code)
    {
        $prefs = self::__get2FAconfig();
        return in_array($code, $prefs['recovery_codes']);
    }
    
    private function __consumeRecoveryCode($code)
    {
        $prefs = self::__get2FAconfig();
        $prefs['recovery_codes'] = array_values(array_diff($prefs['recovery_codes'], array($code)));
        
        self::__set2FAconfig($prefs);
    }
    
    // returns boolean
    private function __checkCode($code)
    {
        // Connexion au serveur de webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            // MANTIS
            //"cache_wsdl" => WSDL_CACHE_NONE,
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl')
        ));
        return $client->validateOTP($this->rc->user->get_username(), $code);
    }
    
    // returns string
    private function __addUser()
    {
        // Connexion au serveur de webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            // MANTIS
            //"cache_wsdl" => WSDL_CACHE_NONE,
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
            "login" => $this->rc->user->get_username(),
            "password" => $this->rc->get_user_password()
        ));
        return $client->addUser($this->rc->user->get_username());
    }
    
    // returns boolean
    private function __removeUser()
    {
        // Connexion au serveur de webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            // MANTIS
            //"cache_wsdl" => WSDL_CACHE_NONE,
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
            "login" => $this->rc->user->get_username(),
            "password" => $this->rc->get_user_password()
        ));
        return $client->removeUser($this->rc->user->get_username());
    }
    
    // returns boolean
    private function __ValidateCookie($username,$code,$date_validitee,$application)
    {
        // Connexion au serveur de webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            // MANTIS
            //"cache_wsdl" => WSDL_CACHE_NONE,
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl')
        ));
        return $client->validateCookie($username,$code,$date_validitee,$application);
    }
    
    // return boolean
    private function __addCookie($username, $code, $expiration,$application){
        // Connexion au serveur de webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            // MANTIS
            //"cache_wsdl" => WSDL_CACHE_NONE,
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
            "login" => $this->rc->user->get_username(),
            "password" => $this->rc->get_user_password()
        ));
        return $client->addCookie($username,$code,intval($expiration),$application,$_SERVER ['HTTP_USER_AGENT']);
    }
    
    // returns boolean
    private function __modifyCookie($username, $code, $expiration,$application)
    {
        // Connexion au serveur de webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            // MANTIS
            //"cache_wsdl" => WSDL_CACHE_NONE,
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
            "login" => $this->rc->user->get_username(),
            "password" => $this->rc->get_user_password()
        ));
        return $client->modifyCookie($username, $code, $expiration,$application,$_SERVER ['HTTP_USER_AGENT']);
    }
    
    /**
     * Défini si on est dans une instance interne ou extene de l'application
     * Permet la selection de la bonne url
     */
    private function is_internal() {
      return mel::is_internal() && !$this->rc->config->get('is_preprod');
    }
    
    /**
     * Replacing specials characters to a specific encoding type
     *
     * @param string  Input string
     * @param string  Replace mode for tags: show|remove|strict
     * @param boolean Convert newlines
     *
     * @return string The quoted string
     */
    private function Q($str, $mode='strict', $newlines=true) {
        return rcube_utils::rep_specialchars_output($str, 'html', $mode, $newlines);
    }
}

