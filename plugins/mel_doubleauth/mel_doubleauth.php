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

    /**
     * Configuration du nombre de code de récupération
     */
    const NUMBER_RECOVERY_CODES = 4;
        
    /**
     * Expiration du cookie : calcul pour 30 jours (60*60*24*30)
     */
    const EXPIRE_COOKIE = 2592000;
    
    /**
     * Initialisation du plugin
     *
     * @see rcube_plugin::init()
     */
    function init() {
        $this->rc = rcmail::get_instance();
        $this->load_config();
        
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/mel_doubleauth.css');
        
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
        if ($this->rc->task == 'settings') {
            $this->register_action('plugin.mel_doubleauth-save', array($this, 'mel_doubleauth_save'));
        }
        $this->include_script('mel_doubleauth.js');
        $this->include_script('qrcode.min.js');
    }
    
    // Use the form login, but removing inputs with jquery and action (see twofactor_gauthenticator_form.js)
    /**
     * Hook login_after
     * Permet d'afficher la demande de double authentification en js
     * Permet également de valider si le cookie double authentification n'est pas déjà en place
     * 
     * @param array $args
     */
    function login_after($args)
    {
        if ($this->is_internal()) { 
            // Connexion intranet => pas de double auth
            return $args;
        }
        
        $_SESSION['mel_doubleauth_login'] = time();
        
        $config_2FA = $this->__get2FAconfig();
        
        if (isset($_COOKIE['roundcube_login'])) {
            // Vérifier la présence du cookies
            if (isset($_COOKIE['roundcube_doubleauth'])) {
                $info_doubleauth = explode('###', $_COOKIE['roundcube_doubleauth']);
                if (count($info_doubleauth) == 4) {
                    // test d'expiration cookies
                    if ($info_doubleauth[2] > time()) {
                        // envoi des infos au webservice pour vérification
                        if ($this->__ValidateCookie($this->rc->user->get_username(), $info_doubleauth[1], $info_doubleauth[2], $info_doubleauth[3])) {
                            mel_logs::get_instance()->log(mel_logs::DEBUG, "__ValidateCookie : true");
                            // mettre à jour le cookie et la base de données dynalogin
                            $expiration = self::EXPIRE_COOKIE + time();
                            rcube_utils::setcookie('roundcube_doubleauth', $info_doubleauth[0] . "###" . $info_doubleauth[1] . "###" . $expiration . "###roundcube", $expiration);
                            // envoi des données au webservice pour sauvegarde en base
                            $this->__modifyCookie($info_doubleauth[0], $info_doubleauth[1], intval($expiration), "roundcube");
                            $this->__goingRoundcubeTask($this->rc->config->get('default_task', 'mail'));
                        } else {
                            mel_logs::get_instance()->log(mel_logs::DEBUG, "__ValidateCookie : false");
                            unset($_COOKIE['roundcube_doubleauth']);
                            rcube_utils::setcookie('roundcube_doubleauth', null, - 1);
                        }
                    } else {
                        mel_logs::get_instance()->log(mel_logs::DEBUG, "__ValidateCookie : expire");
                        unset($_COOKIE['roundcube_doubleauth']);
                        rcube_utils::setcookie('roundcube_doubleauth', null, - 1);
                    }
                } else {
                    mel_logs::get_instance()->log(mel_logs::DEBUG, "__ValidateCookie : pas correct");
                    unset($_COOKIE['roundcube_doubleauth']);
                    rcube_utils::setcookie('roundcube_doubleauth', null, - 1);
                }
            }
        } else {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "cookie login : pas présent");
            unset($_COOKIE['roundcube_doubleauth']);
            rcube_utils::setcookie('roundcube_doubleauth', null, - 1);
        }
        
        if (!$config_2FA['activate']) {
            if ($this->rc->config->get('force_enrollment_users')) {
                $this->__goingRoundcubeTask('settings', 'plugin.mel_doubleauth');
            }
            return $args;
        }
        
        $this->rc->output->set_pagetitle($this->gettext('mel_doubleauth'));
        
        $this->add_texts('localization', true);
        $this->include_script('mel_doubleauth_form.js');
        
        $this->rc->output->send('login');
    }
    
    /**
     * Interception du positionnement du code par l'utilisateur
     * Permet également d'empêcher les connexion aux autres tasks sans double authentification
     * 
     * @param array $p
     * 
     * @return array
     */
    function check_2FAlogin($p)
    {
        if ($this->is_internal()) {
            // Connexion intranet => pas de double auth
            return $p;
        }
        
        $config_2FA = $this->__get2FAconfig();
        
        if ($config_2FA['activate']) {
            $code = rcube_utils::get_input_value('_code_2FA', rcube_utils::INPUT_POST);
            
            if ($code) {
                if ($this->__checkCode($code) || $this->__isRecoveryCode($code)) {
                    if ($this->__isRecoveryCode($code)) {
                        $this->__consumeRecoveryCode($code);
                    }
                    
                    if (isset($_COOKIE['roundcube_login'])) {
                        // création d'un cookie pour la sauvegarde de l'authentification.
                        $expiration = self::EXPIRE_COOKIE + time();
                        rcube_utils::setcookie('roundcube_doubleauth', $this->rc->user->get_username() . "###" . $code . "###" . $expiration . "###roundcube", $expiration);
                        // envoi des données au webservice pour sauvegarde en base
                        $this->__addCookie($this->rc->user->get_username(), $code, intval($expiration),"roundcube");
                    } else {
                        unset($_COOKIE['roundcube_doubleauth']);
                        rcube_utils::setcookie('roundcube_doubleauth', null, - 1);
                    }
                    $this->__goingRoundcubeTask($this->rc->config->get('default_task', 'mail'));
                }
                else {
                    $this->__exitSession();
                }
            }
            // we're into some task but marked with login...
            else if ($this->rc->task !== 'login' && !$_SESSION['mel_doubleauth_2FA_login'] >= $_SESSION['mel_doubleauth_login']) {
                $this->__exitSession();
            }
        }
        else if ($this->rc->config->get('force_enrollment_users') 
                && ($this->rc->task !== 'settings' || $this->rc->action !== 'plugin.mel_doubleauth')
                && $this->rc->task !== 'login') {
            $this->__goingRoundcubeTask('settings', 'plugin.mel_doubleauth');
        }
        
        return $p;
    }
    
    /**
     * Afficher la popup d'enrollement si la double authentification n'est pas activée
     */
    function popup_msg_enrollment()
    {
        $config_2FA = $this->__get2FAconfig();
        
        if (!$config_2FA['activate']
                && $this->rc->config->get('force_enrollment_users') 
                && $this->rc->task == 'settings' 
                && $this->rc->action == 'plugin.mel_doubleauth') {

            // add overlay input box to html page
            $this->rc->output->add_footer(
                html::tag('form', array(
                        'id' => 'enrollment_dialog',
                        'method' => 'post'
                    ),
                    html::tag('h3', null, $this->gettext('enrollment_dialog_title')) .
                    $this->gettext('enrollment_dialog_msg')
                )
            );
            
            $this->rc->output->add_script(
                "$('#enrollment_dialog').show().dialog({ modal:true, resizable:false, closeOnEscape: true, width:420 });", 'docready'
            );
        }
    }
        
    /**
     * Afficher la configuration de la double authentification
     */
    function mel_doubleauth_init()
    {
        $this->add_texts('localization/', true);

        if ($this->rc->task == 'settings' && $this->rc->action == 'plugin.mel_doubleauth') {
            $this->register_handler('plugin.body', array($this, 'mel_doubleauth_form'));
        }

        $this->rc->output->set_pagetitle($this->gettext('mel_doubleauth'));
        $this->rc->output->send('plugin');
    }
    
    /**
     * Enregistrement de la configuration de double authentification
     */
    function mel_doubleauth_save()
    {
        $this->add_texts('localization/', true);
        $this->register_handler('plugin.body', array($this, 'mel_doubleauth_form'));
        $this->rc->output->set_pagetitle($this->gettext('mel_doubleauth'));
        
        // POST variables
        $activate = rcube_utils::get_input_value('2FA_activate', rcube_utils::INPUT_POST);
        $recovery_codes = (array)rcube_utils::get_input_value('2FA_recovery_codes', rcube_utils::INPUT_POST);
        
        // remove recovery codes without value
        $recovery_codes = array_values(array_diff($recovery_codes, array('')));
        
        $data = $this->__get2FAconfig();
        $data['secret'] = null;
        $data['activate'] = $activate ? true : false;
        $data['recovery_codes'] = $recovery_codes;
        $this->__set2FAconfig($data);
        
        // if we can't save time into SESSION, the plugin logouts
        $_SESSION['mel_doubleauth_2FA_login'] = time();
        
        $this->rc->output->show_message($this->gettext('successfully_saved'), 'confirmation');
        
        $this->rc->overwrite_action('plugin.mel_doubleauth');
        $this->rc->output->send('plugin');
    }
    
    /**
     * Construction du formulaire de configuration pour la double authentification
     * 
     * @return string HTML
     */
    public function mel_doubleauth_form()
    {
        $this->add_texts('localization/', true);
        $this->rc->output->set_env('product_name', $this->rc->config->get('product_name'));
        
        $data = $this->__get2FAconfig();
        
        // Fields will be positioned inside of a table
        $table = new html_table(['cols' => 3]);
        
        // info
        $table->add(['class' => 'texte_explic', 'colspan' => '3'], $this->gettext('msg_infor'));
        $table->add(['colspan' => '3'],'<br />');
        
        // secret base
        $field_id = '2FA_secret';
        $input_descsecret = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'hidden', 'value' => $data['secret']]);
        $html_secret = $input_descsecret->show();
        $table->add(['colspan' => '3'], $html_secret);
        
        if ($data['activate'] == null) {

            // Activate/deactivate
            $field_id = '2FA_activate_button';
            $bouton_active = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'button', 'class' => 'button mainaction', 'value' => $this->gettext('activate')]);
            $table->add(['width' => '20px'], '<span class="cercle">1</span>');
            $table->add(['width' => '20%'],  html::label($field_id, $this->Q($this->gettext('label_activate'))));

            // $checked = $data['activate'] ? null: 1; // :-?
            $table->add(null, $bouton_active->show());
            $table->add(null, "");
            $table->add(['colspan' => '2'], $this->gettext('info_activer'));
            
            $field_id = '2FA_activate';
            $input_descsecret = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'hidden', 'value' => '1', 'readonly' => 'readonly']);
            $html_secret = $input_descsecret->show();
            $table->add(['colspan' => '3'], $html_secret);
            
            $html_recovery_codes = '';

            for ($i = 0; $i < self::NUMBER_RECOVERY_CODES; $i++) {
                $value = isset($data['recovery_codes'][$i]) ? $data['recovery_codes'][$i] : '';
                $html_recovery_codes .= ' <input type="hidden" readonly = "readonly" name="2FA_recovery_codes[]" value="'.$value.'" maxlength="10"> &nbsp; ';
            }

            $table->add(['colspan' => '3'], $html_recovery_codes);
            
            // Build the table with the divs around it
            $out = html::div(['class' => 'settingsbox', 'style' => 'margin: 0;'],
                html::div(['id' => 'prefs-title', 'class' => 'boxtitle'], $this->gettext('mel_doubleauth') . ' - ' . $this->rc->user->data['username']) .
                html::div(['class' => 'boxcontent'], $table->show())
            );

        } else {

            $table->add(['colspan' => '3'], $this->gettext('info_active_ok'));
            $html_check_code = '<input type="text" id="2FA_code_to_check" maxlength="10">&nbsp;&nbsp;<input type="button" class="button mainaction" id="2FA_check_code" value="' . $this->gettext('check_code') . '">';
            $table->add(['colspan' => '3'], $this->gettext('info_check_code'));
            $table->add(['colspan' => '3'], $html_check_code);
            $table->add(['colspan' => '3'], '<br />');

            // recovery codes
            $table->add(['class' => 'title', 'colspan' => '3'], $this->gettext('recovery_codes'));
            $html_recovery_codes = '<input type="button" class="button mainaction" id="2FA_show_recovery_codes" value="' . $this->gettext('show_recovery_codes').'">';
            
            for ($i = 0; $i < self::NUMBER_RECOVERY_CODES; $i++) {
                $value = isset($data['recovery_codes'][$i]) ? $data['recovery_codes'][$i] : '';
                $html_recovery_codes .= ' <input type="password" readonly = "readonly" name="2FA_recovery_codes[]" value="'.$value.'" maxlength="10"> &nbsp; ';
            }

            $table->add(['colspan' => '3'], $html_recovery_codes);
            $table->add(['colspan' => '3'], '<br />');
            $table->add(['colspan' => '3'], $this->gettext('info_desactiver'));
            
            $field_id = '2FA_desactivate_button';
            $bouton_active = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'button', 'class' => 'button mainaction', 'value' => $this->gettext('desactivate')]);
            // $checked = $data['activate'] ? null: 1; // :-?
            $table->add(['colspan' => '3'], $bouton_active->show());
            
            $out = html::div(['class' => 'settingsbox', 'style' => 'margin: 0;'],
                html::div(['id' => 'prefs-title', 'class' => 'boxtitle'], $this->gettext('mel_doubleauth') . ' - ' . $this->rc->user->data['username']) .
                html::div(['class' => 'boxcontent'], $table->show())
            );
        }
        
        // Construct the form
        $this->rc->output->add_gui_object('mel_doubleauthform', 'mel_doubleauth-form');
        
        $out = $this->rc->output->form_tag([
            'id' => 'mel_doubleauth-form',
            'name' => 'mel_doubleauth-form',
            'method' => 'post',
            'action' => './?_task=settings&_action=plugin.mel_doubleauth-save',
        ], $out);
        
        return $out;
    }
    
    //------------- appels ajax
    /**
     * Appel Ajax pour valider un code
     */
    public function checkCode()
    {
        $code = rcube_utils::get_input_value('code', rcube_utils::INPUT_GET);
        mel_logs::get_instance()->log(mel_logs::DEBUG, "***** checkCode ***** : " . $code);
        
        if ($this->__checkCode($code)) {
            echo $this->gettext('code_ok');
        } else {
            echo $this->gettext('code_ko');
        }

        exit;
    }
    
    /**
     * Appel Ajax pour l'ajout d'un utilisateur
     */
    public function addUser()
    {
        mel_logs::get_instance()->log(mel_logs::DEBUG, "***** addUser ***** : " . $this->rc->user->get_username());
        
        $data = [
            'action'    => 'plugin.mel_doubleauth-adduser',
            'code'      => $this->__addUser(),
            'unlock'    => trim(rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GET)),
        ];
        echo json_encode($data);

        exit;
    }
    
    /**
     * Appel Ajax pour la suppression d'un utilisateur
     */
    public function removeUser()
    {
        mel_logs::get_instance()->log(mel_logs::DEBUG, "***** removeUser ***** : " . $this->rc->user->get_username());

        $data = [
            'action' => 'plugin.mel_doubleauth-removeuser',
            'result' => $this->__removeUser(),
            'unlock' => trim(rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GET)),
        ];            
        echo json_encode($data);

        exit;
    }
    
    //------------- static methods
    /**
     * Return if the double auth is enable for this session for the user
     * 
     * @return boolean
     */
    public static function is_double_auth_enable()
    {
      return isset($_SESSION['mel_doubleauth_2FA_login']);
    }
    
    
    //------------- private methods    
    /**
     * Redirige vers la tache roundcube demandée
     */
    private function __goingRoundcubeTask($task = 'mail', $action = null) 
    {
        $_SESSION['mel_doubleauth_2FA_login'] = time();
        header('Location: ?_task=' . $task . (isset($action) ? '&_action=' . $action : ''));
        exit;
    }
    
    /**
     * Destruction de la session de l'utilisateur (via Logout)
     */
    private function __exitSession()
    {
        unset($_SESSION['mel_doubleauth_login']);
        unset($_SESSION['mel_doubleauth_2FA_login']);
        
        header('Location: ?_task=logout&_token='.$this->rc->get_request_token());

        exit;
    }
    
    /**
     * Récupérer la configuration de double authentification
     * 
     * @return boolean
     */
    private function __get2FAconfig()
    {
        if (!isset($_SESSION['2FA_config'])) {
            $user = $this->rc->user;
        
            $arr_prefs = $user->get_prefs();
            $pref_name = 'mel_doubleauth';
            
            if (!isset($arr_prefs[$pref_name])) {
              $pref_name = 'melanie2_doubleauth';
            }
    
            // Récupération si la double auth est activé pour l'utilisateur courant
            $response = $this->__isActivated();
    
            $arr_prefs[$pref_name]['activate'] = $response;
            $arr_prefs[$pref_name]['secret'] = ($response) ? '*************' : '';

            // MANTIS 0005754: Réduire les appels au webservice de double auth
            $_SESSION['2FA_config'] = $arr_prefs[$pref_name];
        }
        
        return $_SESSION['2FA_config'];
    }
    
    /**
     * Positionner la configuration de double authentification
     * 
     * @param array $data
     * 
     * @return boolean
     */
    private function __set2FAconfig($data)
    {
        $user = $this->rc->user;
        
        $arr_prefs = $user->get_prefs();

        if ($data["activate"] === false) {
            // Désactiver la double authentification
            $res = $this->__removeUser();
            $arr_prefs['mel_doubleauth'] = null;
        } else {
            // Mise a jour des paramètres de double authentification
            unset($data["secret"]);
            unset($data["activate"]);
            $arr_prefs['mel_doubleauth'] = $data;
            $res = true;
        }
        
        if ($res && $user->save_prefs($arr_prefs)) {
            // MANTIS 0005754: Réduire les appels au webservice de double auth
            $_SESSION['2FA_config'] = $arr_prefs['mel_doubleauth'];
            return true;
        }
        else {
            return false;
        }
    }
    
    /**
     * Test si le code est un code de récupération de l'utilisateur
     * 
     * @param string $code
     * 
     * @return boolean
     */
    private function __isRecoveryCode($code)
    {
        $prefs = $this->__get2FAconfig();
        return in_array($code, $prefs['recovery_codes']);
    }
    
    /**
     * Utilisation d'un code de récupération
     * 
     * @param string $code
     * 
     * @return boolean
     */
    private function __consumeRecoveryCode($code)
    {
        $prefs = $this->__get2FAconfig();
        $prefs['recovery_codes'] = array_values(array_diff($prefs['recovery_codes'], array($code)));
        
        $this->__set2FAconfig($prefs);
    }
    
    /**
     * Validation du code OTP
     * 
     * @param string $code
     * 
     * @return boolean
     */
    private function __checkCode($code)
    {
        // Données de connexion au webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl')
        ));

        // Try/Catch pour le webservice
        try {
            // Connexion au serveur de webservice
            $res = $client->validateOTP($this->rc->user->get_username(), $code);
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__checkCode : Erreur web service : " . $e->getMessage());
            $res = false;
        }
        return $res;
    }

    /**
     * Est-ce que la double authentification est activée pour cet utilisateur ?
     * 
     * @return boolean
     */
    private function __isActivated() {
        // Données de connexion au webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl')
        ));

        // Try/Catch pour le webservice
        try {
            // Connexion au serveur de webservice
            $res = $client->isActivated($this->rc->user->get_username());
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__get2FAconfig : Erreur web service : " . $e->getMessage());
            $res = false;
        }
        return $res;
    }
    
    /**
     * Création de l'utilisateur
     * 
     * @return boolean
     */
    private function __addUser()
    {
        // Données de connexion au webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
            "login" => $this->rc->user->get_username(),
            "password" => $this->rc->get_user_password()
        ));

        // Try/Catch pour le webservice
        try {
            // Connexion au serveur de webservice
            $res = $client->addUser($this->rc->user->get_username());
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__addUser : Erreur web service : " . $e->getMessage());
            $res = false;
        }
        return $res;
        
    }
    
    /**
     * Suppression de l'utilisateur
     * 
     * @return boolean
     */
    private function __removeUser()
    {
        // Données de connexion au webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
            "login" => $this->rc->user->get_username(),
            "password" => $this->rc->get_user_password()
        ));

        // Try/Catch pour le webservice
        try {
            // Connexion au serveur de webservice
            $res = $client->removeUser($this->rc->user->get_username());
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__removeUser : Erreur web service : " . $e->getMessage());
            $res = false;
        }
        return $res;
    }
    
    /**
     * Validation du cookie
     * 
     * @param string $username
     * @param string $code
     * @param string $date_validitee
     * @param string $application
     * 
     * @return boolean
     */
    private function __ValidateCookie($username, $code, $date_validitee, $application)
    {
        // Données de connexion au webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl')
        ));

        // Try/Catch pour le webservice
        try {
            // Connexion au serveur de webservice
            $res = $client->validateCookie($username, $code, $date_validitee, $application);
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__ValidateCookie : Erreur web service : " . $e->getMessage());
            $res = false;
        }
        return $res;
    }
    
    /**
     * Création du cookie
     * 
     * @param string $username
     * @param string $code
     * @param integer $expiration
     * @param string $application
     * 
     * @return boolean
     */
    private function __addCookie($username, $code, $expiration, $application)
    {
        // Données de connexion au webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
            "login" => $this->rc->user->get_username(),
            "password" => $this->rc->get_user_password()
        ));

        // Try/Catch pour le webservice
        try {
            // Connexion au serveur de webservice
            $res = $client->addCookie($username, $code, intval($expiration), $application, $_SERVER['HTTP_USER_AGENT']);
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__addCookie : Erreur web service : " . $e->getMessage());
            $res = false;
        }
        return $res;
    }
    
    /**
     * Modification du cookie
     * 
     * @param string $username
     * @param string $code
     * @param integer $expiration
     * @param string $application
     * 
     * @return boolean
     */
    private function __modifyCookie($username, $code, $expiration, $application)
    {
        // Données de connexion au webservice
        $client = new SoapClient($this->rc->config->get('dynalogin_websvc'), array(
            "cache_wsdl" => WSDL_CACHE_BOTH,
            "connection_timeout" => 5,
            "stream_context" => $this->rc->config->get('dynalogin_websvc_ssl'),
            "login" => $this->rc->user->get_username(),
            "password" => $this->rc->get_user_password()
        ));
        
        // Try/Catch pour le webservice
        try {
            // Connexion au serveur de webservice
            $res = $client->modifyCookie($username, $code, intval($expiration), $application, $_SERVER['HTTP_USER_AGENT']);
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__modifyCookie : Erreur web service : " . $e->getMessage());
            $res = false;
        }
        return $res;
    }
    
    /**
     * Défini si on est dans une instance interne ou extene de l'application
     * Permet la selection de la bonne url
     * 
     * @return boolean
     */
    private function is_internal()
    {
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
    private function Q($str, $mode='strict', $newlines=true)
    {
        return rcube_utils::rep_specialchars_output($str, 'html', $mode, $newlines);
    }
}

