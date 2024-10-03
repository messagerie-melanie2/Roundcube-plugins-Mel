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
include_once __DIR__.'/../mel_metapage/bnum_plugin.php';
class mel_doubleauth extends bnum_plugin {
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
    public function init() {
        $this->rc = rcmail::get_instance();
        $this->load_config();
        
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/mel_doubleauth.css');
        
        // hooks
        if (!$this->is_internal()) { // Connexion intranet => pas de double auth
            $this->add_hook('login_after', array($this, 'login_after'));
            $this->add_hook('logout_after', array($this, 'logout_after'));
            $this->add_hook('send_page', array($this, 'check_2FAlogin'));
            $this->add_hook('render_page', array($this, 'popup_msg_enrollment'));
        }
        else {
            // Si on est internal on considère qu'on s'est connecté avec la double auth (en cas de changement de VPN)
            $_SESSION['mel_doubleauth_login'] = time();
            $_SESSION['mel_doubleauth_2FA_login'] = time();
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
            $this->register_action('plugin.mel.doubleauth.get', array($this, 'actions_get'));
            $this->register_action('plugin.mel.doubleauth.set', array($this, 'actions_set'));
            $this->register_action('plugin.mel.doubleauth.send_otp', array($this, 'send_otp'));
            $this->register_action('plugin.mel.doubleauth.verify_code', array($this, 'verify_code'));
        }
        else if ($this->rc->task === 'login') {
            $this->register_action('plugin.da.try_connect', array($this, 'otp_forgotten_connect'));
        }

        $this->include_script('mel_doubleauth.js');
        $this->include_script('qrcode.min.js');

        $user = driver_mel::gi()->getUser();
        if ($user) {
          $user->load(['double_authentification_forcee', 'double_authentification_date_butoir']);
          if ($user->double_authentification_forcee) {
            if (!$this->__isActivated()) {
            $this->rc->output->set_env("double_authentification_forcee", $user->double_authentification_forcee);
            $this->rc->output->set_env("double_authentification_date_butoir", $user->double_authentification_date_butoir);
            }
          }
        }
      }
        
    /**
     * Hook login_after
     * Permet d'afficher la demande de double authentification en js
     * Permet également de valider si le cookie double authentification n'est pas déjà en place
     * 
     * @param array $args
     */
    public function login_after($args)
    {
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "doubleauth_login_after");
        if ($this->is_auth_strong()) return $args;
        
        $_SESSION['mel_doubleauth_login'] = time();
        
        $config_2FA = $this->__get2FAconfig();
        
        if (!$this->login_after_check_deadline($config_2FA)) return $args;

        $url = rcube_utils::get_input_value('_url', rcube_utils::INPUT_GPC);

        if (isset($url) && (strpos($url, 'login') !== false || strpos($url, 'logout') !== false)) $url = '';

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

                            if (isset($url) && $url !== '') $this->__goingToUrl($url);
                            else $this->__goingRoundcubeTask($this->rc->config->get('default_task', 'mail'));
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
        $this->setup_module();
        $this->include_script('mel_doubleauth_form.js');


        $this->rc->output->set_env('double_authentification_adresse_recuperation', driver_mel::gi()->getUser()->double_authentification_adresse_recuperation);
       $this->rc->output->set_env("_url", $url);
        
        $this->rc->output->send('login');
    }

    private function login_after_check_deadline($config_2FA, $user = null){
        $return = true;

        $user = $user ?? driver_mel::gi()->getUser();
        if ($user) {
            $user->load(['double_authentification_forcee', 'double_authentification_date_butoir', 'double_authentification_date_grace']);
            $deadline = $user->double_authentification_date_grace;

            if (!$deadline || $deadline < $user->double_authentification_date_butoir) $deadline = $user->double_authentification_date_butoir;

            if ($user->double_authentification_forcee && 
                !$config_2FA['activate'] && 
                (!$deadline || new DateTime() > $deadline)) {
                $this->__exitSession($this->gettext('logout_2fa_needed_not_secure'));
                $return = false;
            }
        }
        else {
            $this->__exitSession($this->gettext('logout_2fa_needed_unknown'));
            $return = false;
        }


        return $return;
    }

    private function _date_grace_enabled($user = null) {
        $return = false;
        $user = $user ?? driver_mel::gi()->getUser();

        if ($user) {
            $user->load(['double_authentification_date_grace']);

            $deadline = $user->double_authentification_date_grace;

            $return = $deadline && new DateTime() <= $deadline;
        }

        return $return;
    }

    /**
     * Hook logout_after
     * 
     * @param array $args
     */
    public function logout_after($args)
    {
        $message = rcube_utils::get_input_value('_logout_msg', rcube_utils::INPUT_GET);

        if (isset($message)) {
            $this->rc->output->show_message($message);
            $this->rc->output->set_env('da_logout_message', $message);
        }

        return $args;
    }
    
    /**
     * Interception du positionnement du code par l'utilisateur
     * Permet également d'empêcher les connexion aux autres tasks sans double authentification
     * 
     * @param array $p
     * 
     * @return array
     */
    public function check_2FAlogin($p)
    {
        //mel_logs::get_instance()->log(mel_logs::DEBUG, "doubleauth_check_2FAlogin");
        if ($this->is_auth_strong()) {
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
                    $url = rcube_utils::get_input_value('_url', rcube_utils::INPUT_GPC);

                    if (isset($url) && (strpos($url, 'login') !== false || strpos($url, 'logout') !== false)) $url = '';

                    if (isset($url) && $url !== '') $this->__goingToUrl($url);
                    else $this->__goingRoundcubeTask($this->rc->config->get('default_task', 'mail'));
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
        // MANTIS 0005292: La double authentification doit être obligatoire pour certains comptes
        else if ($this->rc->task !== 'login' && $this->rc->task !== 'logout') {
            $user = driver_mel::gi()->getUser();
            if (isset($user)) {
                $user->load(['double_authentification']);
                if ($user->double_authentification) {
                    mel_logs::get_instance()->log(mel_logs::INFO, "[login] Echec de connexion pour l'utilisateur <".$user->uid."> Code erreur : 492 (Double authentification obligatoire)");
                    $this->__exitSession($this->gettext('logout_2fa_needed'));
                }
                // Continuer à proposer l'enrollment si besoin
                else if ($this->rc->config->get('force_enrollment_users') 
                        && ($this->rc->task !== 'settings' || $this->rc->action !== 'plugin.mel_doubleauth')) {
                    $this->__goingRoundcubeTask('settings', 'plugin.mel_doubleauth');
                }
            }
        }
        
        return $p;
    }
    
    /**
     * Afficher la popup d'enrollement si la double authentification n'est pas activée
     */
    public function popup_msg_enrollment()
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
    public function mel_doubleauth_init()
    {
        $this->add_texts('localization/', true);

        if ($this->rc->task == 'settings' && $this->rc->action == 'plugin.mel_doubleauth') {
            $this->register_handler('plugin.body', array($this, 'mel_doubleauth_form'));
        }

        $this->rc->output->set_env('email_code_expiration', $this->rc->config->get('code_expiration', 30*60));
        
        $this->rc->output->set_pagetitle($this->gettext('mel_doubleauth'));
        //$this->load_js_page('resend');
        $this->rc->output->send('plugin');
    }
    
    /**
     * Enregistrement de la configuration de double authentification
     */
    public function mel_doubleauth_save()
    {
        $this->add_texts('localization/', true);
        $this->register_handler('plugin.body', array($this, 'mel_doubleauth_form'));
        $this->rc->output->set_pagetitle($this->gettext('mel_doubleauth'));
        
        // POST variables
        $activate = rcube_utils::get_input_value('p2FA_activate', rcube_utils::INPUT_POST);
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

        /**
         * Create a bootstrap row
         */
        function row($content, $class = 'row') { return html::div(['class' => "$class"], $content); }

        /**
         * Create a bootstrap col
         */
        function col($content, $class = 'col-sm my-auto') { return html::div(['class' => "$class"], $content); }

        /**
         * Create a bootstrap col in one row
         */
        function rowcol($content, $rowclass = 'row', $colclass = 'col-sm my-auto', $rowid = null) { 
            return html::div(['class' => "$rowclass"], html::div(['class' => "$colclass", 'id' => $rowid], $content)); 
        }
        
        $data = $this->__get2FAconfig();
        
        // info
        $div_container = rowcol(html::span(['class' => 'texte_explic'], $this->gettext('msg_infor')));

        // secret base
        $field_id = 'p2FA_secret';
        $input_descsecret = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'hidden', 'value' => $data['secret']]);

        $hidden_fields = $input_descsecret->show();
        
        if (!$data['activate']) {
            // Activate/deactivate
            $field_id = 'p2FA_activate_button';
            $bouton_active = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'button', 'class' => 'button mainaction', 'value' => $this->gettext('activate')]);

            $div_container .= row(
                col(html::span(['class' => 'cercle'], '1'), 'col-sm-1 my-auto') . 
                col(html::label($field_id, $this->Q($this->gettext('label_activate'))), 'col-sm-2 my-auto') .
                col($bouton_active->show(), 'col-sm-3')
            );

            $div_container .= row(
                col(' ', 'col-sm-1') . 
                col($this->gettext('info_activer'))
            );
            
            $field_id = 'p2FA_activate';
            $input_descsecret = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'hidden', 'value' => '1', 'readonly' => 'readonly']);

            $hidden_fields .= $input_descsecret->show();
            
            $html_recovery_codes = '';

            for ($i = 0; $i < self::NUMBER_RECOVERY_CODES; $i++) {
                $value = isset($data['recovery_codes'][$i]) ? $data['recovery_codes'][$i] : '';
                $html_recovery_codes .= ' <input type="hidden" readonly = "readonly" name="2FA_recovery_codes[]" value="'.$value.'" maxlength="10"> &nbsp; ';
            }

            $hidden_fields .= $html_recovery_codes;
        } else {
            $html_check_code = '<input type="text" id="2FA_code_to_check" class="form-control" maxlength="10" aria-labelledby="info_check_code">&nbsp;&nbsp;<input type="button" class="button mainaction" id="2FA_check_code" value="' . $this->gettext('check_code') . '">';

            $div_container .= rowcol($this->gettext('info_active_ok'));
            $div_container .= rowcol($this->gettext('info_check_code'), 'row', 'col-sm my-auto','info_check_code');
            $div_container .= rowcol($html_check_code);
            $div_container .= rowcol('<br>');

            // recovery codes
            $div_container .= rowcol($this->gettext('recovery_codes'));

            $html_recovery_codes = '<input type="button" class="button mainaction" id="2FA_show_recovery_codes" value="' . $this->gettext('show_recovery_codes').'">';
            
            for ($i = 0; $i < self::NUMBER_RECOVERY_CODES; $i++) {
                $value = isset($data['recovery_codes'][$i]) ? $data['recovery_codes'][$i] : '';
                $html_recovery_codes .= ' <input type="password" class="form-control" readonly = "readonly" name="2FA_recovery_codes[]" value="'.$value.'" maxlength="10"> &nbsp; ';
            }

            $div_container .= rowcol($html_recovery_codes);
            $div_container .= rowcol('<br>');

            if (!!driver_mel::gi()->getUser()->double_authentification_adresse_recuperation && !!driver_mel::gi()->getUser()->double_authentification_adresse_valide) {
                $div_container .= html::div(['id' => 'mail-group'], 
                    row(
                        col(html::p(['style' => 'height: 100%;display: flex;align-items: center;'], 'Votre email de récupération : '), 'col-2').
                        col(html::div(['class' => 'input-group'],
                        html::tag('input', ['id' => 'mail-da-input', 'style' => 'text-align:center;','class' => 'disabled form-control', 'disabled' => 'disabled', 'value' => driver_mel::gi()->getUser()->double_authentification_adresse_recuperation]).
                        html::div(['class' => 'input-group-append'],
                            html::tag('button', ['id' => 'start-button-modal', 'class' => 'disabled btn btn-primary', 'disabled' => 'disabled'], 'Changer l\'adresse de récupération')
                        )
                    ), 'col-4')
                    )
                );
            }
            else {
                $div_container .= html::div(['id' => 'mail-group'], 
                row(
                    col(html::p(['style' => 'height: 100%;display: flex;align-items: center;'], 'Veuillez entrer une adresse de récupération !'), 'col-3').
                    col(
                        html::tag('button', ['id' => 'start-button-modal', 'class' => 'disabled btn btn-primary', 'disabled' => 'disabled'], 'Définir une adresse de récupération !')
                ))
            );
            }

            $div_container .= rowcol('<br>');
            $div_container .= rowcol($this->gettext('info_desactiver'));

            $field_id = '2FA_desactivate_button';
            $bouton_active = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'button', 'class' => 'button mainaction', 'value' => $this->gettext('desactivate')]);

            $div_container .= rowcol($bouton_active->show());
        }

        $field_id = '_username';
        $input_username = new html_inputfield(['name' => $field_id, 'id' => $field_id, 'type' => 'hidden', 'value' => $this->rc->user->data['username'], 'readonly' => 'readonly']);

        $hidden_fields .= $input_username->show();

        // Build the table with the divs around it
        $out = $hidden_fields . 
            html::tag('fieldset', ['class' => 'main'], 
                html::tag('legend', ['id' => 'prefs-title'], $this->gettext('mel_doubleauth')) .
                html::div(['class' => 'table'], $div_container)
        );
        
        // Construct the form
        $this->rc->output->add_gui_object('mel_doubleauthform', 'mel_doubleauth-form');
        
        $form = $this->rc->output->form_tag([
            'id' => 'mel_doubleauth-form',
            'name' => 'mel_doubleauth-form',
            'method' => 'post',
            'action' => './?_task=settings&_action=plugin.mel_doubleauth-save',
        ], $out);
        
        return html::div(['class' => 'formcontent'], $form);
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
    
    public function actions_get() {
        $autorized_props = ['double_authentification_adresse_recuperation', 'double_authentification_adresse_valide', 'NUMBER_RECOVERY_CODES'];
        $prop = rcube_utils::get_input_value('_prop', rcube_utils::INPUT_GET);

        if (in_array($prop, $autorized_props)) {
            switch ($prop) {
                case 'NUMBER_RECOVERY_CODES':
                    $prop = self::NUMBER_RECOVERY_CODES;
                    break;
                
                default:
                    $prop = driver_mel::gi()->getUser()->$prop;
                    break;
            }
        }
        else throw new Exception("Denied !", 1);

        echo json_encode($prop);
        exit;
    }

    public function actions_set() {
        $autorized_props = ['double_authentification_adresse_recuperation'];
        $prop = rcube_utils::get_input_value('_prop', rcube_utils::INPUT_POST);
        $value = rcube_utils::get_input_value('_val', rcube_utils::INPUT_POST);

        if (in_array($prop, $autorized_props)) {
            driver_mel::gi()->getUser()->$prop = $value;
            echo 'true';
        }
        else throw new Exception("Denied !", 1);

        exit;
    }

    public function send_otp() {
        $this->require_plugin('mel_helper');
        mel_helper::include_mail_body();
        $otp = rand(100000, 999999) + '';
        $expire = $this->rc->config->get('code_expiration', 30*60);
        $cid = 'bnumlogo';
        driver_mel::gi()->getUser()->token_otp = $otp;
        driver_mel::gi()->getUser()->token_otp_expire = time() + $expire;
        driver_mel::gi()->getUser()->double_authentification_adresse_valide = false;
        $mail = driver_mel::gi()->getUser()->double_authentification_adresse_recuperation;

        $bodymail = new MailBody('mel_doubleauth.email', [
            'code' => $otp,
            'bnum.change_password' => 'https://mel.din.developpement-durable.gouv.fr/changepassword/index.php',
            'url.internal.security' => 'https://mel.din.developpement-durable.gouv.fr/aide/doc/bnum/#15-Configuration:l4GIVl2g7xdGSnhdT7Cdwd',
            'expiration' => $expire/60,
            'logobnum' => __DIR__.'/skins/mel_elastic/pictures/logobnum.png'//MailBody::load_image(__DIR__.'/skins/elastic/pictures/logobnum.png', 'png')
        ]);

        $subject = $bodymail->subject();
        $message = $bodymail->body();

        $is_html = true;
        $sent = mel_helper::send_mail($subject, $message, driver_mel::gi()->getUser()->email, ['email' => $mail, 'name' => driver_mel::gi()->getUser()->name], $is_html, [['path' => __DIR__.'/skins/mel_elastic/pictures/logobnum.png', 'id' => $cid, 'type' => 'image/png']]);
        
        echo json_encode(isset($mail) ? $sent : -1);
        exit;
    }

    public function verify_code($echo = true) {
        $return = 0;
        $token = rcube_utils::get_input_value('_token', rcube_utils::INPUT_GP) + '';

        if (driver_mel::gi()->getUser()->token_otp_expire > time()) {
            if ($token === driver_mel::gi()->getUser()->token_otp) {
                driver_mel::gi()->getUser()->double_authentification_adresse_valide = true;
                $return = 1;
            }
        }
        else $return = -1;

        if ($echo){
            echo $return;
            exit;
        }
        else {
            return $return;
        }

    }

    public function otp_forgotten_connect() {
        $send_to_page = false;
        $code = $this->verify_code($send_to_page);

        switch ($code) {
            case 1:
                $this->__goingRoundcubeTask('settings', 'plugin.mel_doubleauth', ['_force_bnum' => 1]);
                break;
            case 0:
                $this->__exitSession('Le code n\'est pas bon !');
                break;
            case -1:
                $this->__exitSession('Le code a expiré !');
                break;
            default:
                $this->__exitSession('Une erreur est survenue....');
                break;
        }
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
    private function __goingRoundcubeTask($task = 'mail', $action = null, $other_params = null) 
    {
        if (is_array($other_params))
        {
            $tmp = '';
            foreach ($other_params as $key => $value) {
                $tmp .= "&$key=$value";
            }
            $other_params = $tmp;
        }

        $this->__goingToUrl("?_task=$task". (isset($action) ? "&_action=$action" : ''). ($other_params ?? ''));
    }

    private function __goingToUrl($url)
    {
        $_SESSION['mel_doubleauth_2FA_login'] = time();

        if (isset($url) && $url !== "" && strpos($url, '_task=') !== false && $url[0] !== '?') $url = "?$url";

        header("Location: $url");
        exit;
    }
    
    /**
     * Destruction de la session de l'utilisateur (via Logout)
     * 
     * @param string $message
     */
    private function __exitSession($message = null)
    {
        unset($_SESSION['mel_doubleauth_login']);
        unset($_SESSION['mel_doubleauth_2FA_login']);
        
        if (isset($message)) {
            header('Location: ?_task=logout&_logout_msg=' . $message . '&_token=' . $this->rc->get_request_token());
        }
        else {
            header('Location: ?_task=logout&_token=' . $this->rc->get_request_token());
        }
        

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
            $arr_prefs['mel_doubleauth'] = $data;
            unset($arr_prefs['mel_doubleauth']["activate"]);
            $res = true;
        }
        
        if ($res && $user->save_prefs($arr_prefs)) {
            // MANTIS 0005754: Réduire les appels au webservice de double auth
            $_SESSION['2FA_config'] = $data;
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
        mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__checkCode()");
        // Gérer le mode bouchon
        if ($this->rc->config->get('dynalogin_mode_bouchon', false)) {
            return $this->rc->config->get('dynalogin_bouchon_checkCode', true);
        }

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
            mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__checkCode() result:$res");
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "mel_doubleauth::__checkCode() error:" . $e->getMessage());
            $res = false;
        }
        return $res;
    }

    /**
     * Est-ce que la double authentification est activée pour cet utilisateur ?
     * 
     * @return boolean
     */
    private function __isActivated()
    {
        mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__isActivated()");
        // Gérer le mode bouchon
        if ($this->rc->config->get('dynalogin_mode_bouchon', false)) {
            return $this->rc->config->get('dynalogin_bouchon_isActivated', true);
        }

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
            mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__isActivated() result:$res");
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "mel_doubleauth::__isActivated() error:" . $e->getMessage());
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
        mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__addUser()");
        // Gérer le mode bouchon
        if ($this->rc->config->get('dynalogin_mode_bouchon', false)) {
            return $this->rc->config->get('dynalogin_bouchon_addUser', true);
        }

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
            mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__addUser() result:$res");
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "mel_doubleauth::__addUser() error:" . $e->getMessage());
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
        mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__removeUser()");
        // Gérer le mode bouchon
        if ($this->rc->config->get('dynalogin_mode_bouchon', false)) {
            rcube_utils::setcookie('roundcube_doubleauth', null, - 1);
            return $this->rc->config->get('dynalogin_bouchon_removeUser', true);
        }

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

            // On supprime le cookie de double auth
            rcube_utils::setcookie('roundcube_doubleauth', null, - 1);

            mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__removeUser() result:$res");
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "mel_doubleauth::__removeUser() error:" . $e->getMessage());
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
        mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__ValidateCookie($username, $date_validitee, $application)");
        // Gérer le mode bouchon
        if ($this->rc->config->get('dynalogin_mode_bouchon', false)) {
            return $this->rc->config->get('dynalogin_bouchon_ValidateCookie', true);
        }

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
            mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__ValidateCookie() result:$res");
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "mel_doubleauth::__ValidateCookie() error:" . $e->getMessage());
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
        mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__addCookie($username, $expiration, $application)");
        // Gérer le mode bouchon
        if ($this->rc->config->get('dynalogin_mode_bouchon', false)) {
            return $this->rc->config->get('dynalogin_bouchon_addCookie', true);
        }

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
            mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__addCookie() result:$res");
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::ERROR, "mel_doubleauth::__addCookie() error:" . $e->getMessage());
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
        mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__modifyCookie($username, $expiration, $application)");
        // Gérer le mode bouchon
        if ($this->rc->config->get('dynalogin_mode_bouchon', false)) {
            return $this->rc->config->get('dynalogin_bouchon_modifyCookie', true);
        }

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
            mel_logs::get_instance()->log(mel_logs::INFO, "mel_doubleauth::__modifyCookie() result:$res");
        }
        catch (Exception $e) {
            mel_logs::get_instance()->log(mel_logs::DEBUG, "mel_doubleauth::__modifyCookie() error:" . $e->getMessage());
            $res = false;
        }
        return $res;
    }
    
    /**
     * Défini si on est dans une instance interne ou externe de l'application
     * Permet la selection de la bonne url
     * 
     * @return boolean
     */
    private function is_internal()
    {
        return mel::is_internal() && !$this->rc->config->get('is_preprod');
    }

    /**
     * Définit si on est dans une situation où l'auth est assez forte
     * Permet de ne pas déclencher la double auth
     * 
     * @return boolean
     */
    private function is_auth_strong() 
    {
      return $this->_date_grace_enabled() || (mel::is_auth_strong() && $this->rc->config->get('is_auth_strong', true));
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

