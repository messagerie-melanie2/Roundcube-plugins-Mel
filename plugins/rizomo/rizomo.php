<?php

/**
 * Plugin Rizomo pour le Bnum
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
class rizomo extends rcube_plugin
{
    /**
     * Task courante pour le plugin
     *
     * @var string
     */
    public $task = '?(?!login|logout).*';
    
    /**
     *
     * @var rcmail
     */
    private $rc;
    
    /**
     * Méthode d'initialisation du plugin mel_notification
     */
    public function init()
    {
        $this->rc = rcmail::get_instance();
        
        // Charge la conf du plugin
        $this->load_config();

        $this->add_texts('localization/', true);

        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/rizomo.css');

        // ajout de la tache
        $this->register_task('rizomo');
        
        // Liste des actions pour lesquels on ne load pas le js
        $nojs_actions = [
            'mail.compose',
        ];
        
        // Ne proposer les actions et le js uniquement dans la page meta
        if ((!isset($_GET['_is_from']) || $_GET['_is_from'] != 'iframe') 
                && in_array($this->rc->user->get_username(), $this->rc->config->get('rizomo_users', []))
                && !isset($_GET['_extwin'])
                && !isset($_GET['_framed'])
                && $this->rc->action != 'refresh'
                && !in_array($this->rc->task.'.'.$this->rc->action, $nojs_actions)) {
                    
            if ($this->rc->output->type == 'html') {
                $user_token = $this->rc->config->get('rizomo_user_token', null);
                if (isset($user_token)) {
                    // Ajouter la conf pour le js
                    $this->rc->output->set_env('rizomo_api_url',    $this->rc->config->get('rizomo_api_url', ''));
                    $this->rc->output->set_env('rizomo_user_token', $user_token);
                                    
                    // Charger le js
                    $this->include_script('rizomo.js');
                }
            }
        }

        if (class_exists("mel_metapage")) mel_metapage::add_url_spied($this->rc->config->get('rizomo_url', ''), 'rizomo');
        // Ajoute le bouton en fonction de la skin
        $need_button = 'taskbar';
        if (class_exists("mel_metapage")) {
          $need_button = $this->rc->plugins->get_plugin('mel_metapage')->is_app_enabled('app_rizomo') ? $need_button : 'otherappsbar';
        }

        $button_config = array(
            'command' => 'rizomo',
            'class'	=> 'button-rizomo icon-rizomo rizomo',
            'classsel' => 'button-rizomo button-selected icon-rizomo rizomo',
            'innerclass' => 'button-inner inner',
            'label'	=> 'rizomo.rizomo',
            'title' => 'rizomo.rizomo_title',
            'type'       => 'link'
        );

        $params = $this->rc->plugins->exec_hook('main-nav-bar', [
            'plugin' => 'rizomo',
            'need_button' => $need_button,
            'button' => $button_config
        ]);

        if (isset($params) && isset($params->need_button)) $need_button = $params->need_button;
        if (isset($params) && isset($params->button)) $button_config = $params->button;

        if ($need_button) $this->add_button($button_config, $need_button);
        
        unset($button_config);
        unset($params);
        unset($need_button);
        
        // Si tache = rizomo, on charge l'onglet
        if ($this->rc->task == 'rizomo') {
            $this->register_action('index', array($this, 'action'));
            $this->rc->output->set_env('refresh_interval', 0);

            if ($this->rc->config->get('rizomo_log-in_users', false)) {
                // On lance l'authentification automatique des utilisateurs
                $this->login();
            }
        } 
        else if ($this->rc->task == 'settings' 
                && in_array($this->rc->user->get_username(), $this->rc->config->get('rizomo_users', []))) {
            // add hooks for Notifications settings
            $this->add_hook('preferences_sections_list',    [$this, 'preferences_sections_list']);
            $this->add_hook('preferences_list',             [$this, 'preferences_list']);
            $this->add_hook('preferences_save',             [$this, 'preferences_save']);
        }
    }

    /**
     * Index Rizomo page
     */
    public function action()
    {
        // register UI objects
        $this->rc->output->add_handlers(array(
        		'rizomo_frame'    => array($this, 'rizomo_frame'),
        ));

        $startupUrl =  rcube_utils::get_input_value("_url", rcube_utils::INPUT_GPC); 
        if ($startupUrl !== null && $startupUrl !== "") $this->rc->output->set_env("rizomo_startup_url", $startupUrl);

        // Chargement du template d'affichage
        $this->rc->output->set_pagetitle($this->gettext('rizomo_title'));

        $this->rc->output->set_env('rizomo_gotourl', $this->rc->config->get('rizomo_url', ''));
        
        $this->include_script('rizomo.js');
        $this->rc->output->send('rizomo.rizomo');
    }

    /**
     * Gestion de la frame
     * 
     * @param array $attrib
     * @return string
     */
    public function rizomo_frame($attrib)
    {
    	if (!$attrib['id'])
    		$attrib['id'] = 'rizomo_frame';

    	$attrib['name'] = $attrib['id'];

    	$this->rc->output->set_env('contentframe', $attrib['name']);
    	$this->rc->output->set_env('blankpage', $attrib['src'] ?
        $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');

    	return $this->rc->output->frame($attrib);
    }

    /**
     * Handler for preferences_sections_list hook.
     * Adds Rizomo settings sections into preferences sections list.
     *
     * @param array Original parameters
     *
     * @return array Modified parameters
     */
    public function preferences_sections_list($p)
    {
        $p['list']['rizomo'] = [
            'id'      => 'rizomo',
            'section' => $this->gettext('rizomo'),
        ];
        return $p;
    }

    /**
     * Handler for preferences_list hook.
     * Adds options blocks into Rizomo settings sections in Preferences.
     *
     * @param array Original parameters
     *
     * @return array Modified parameters
     */
    public function preferences_list($p)
    {
        if ($p['section'] != 'rizomo') {
            return $p;
        }

        $no_override = array_flip((array) $this->rc->config->get('dont_override'));

        $p['blocks']['general']['name'] = $this->gettext('mainoptions');

        if (!isset($no_override['rizomo_user_token'])) {
            if (empty($p['current'])) {
                $p['blocks']['general']['content'] = true;
                return $p;
            }

            $url = $this->rc->config->get('rizomo_url', '');

            $p['blocks']['general']['options']['description'] = [
                "content" => strtr($this->gettext('rizomo_procedure'), [
                    '%url' => html::a(['href' => $url, 'target' => '_blank'], $url)
                ])
            ];


            $field_id = 'rcmfd_user_token';
            $default = $this->rc->config->get('rizomo_user_token', '');

            $input = new html_inputfield(['name' => '_user_token', 'id' => $field_id, 'type' => 'password']);

            $p['blocks']['general']['options']['user_token'] = [
                'title'   => html::label($field_id, rcube::Q($this->gettext('user_token'))),
                'content' => $input->show($default),
            ];
        }

        return $p;
    }

    /**
     * Handler for preferences_save hook.
     * Executed on Rizomo settings form submit.
     *
     * @param array Original parameters
     *
     * @return array Modified parameters
     */
    public function preferences_save($p)
    {
        if ($p['section'] == 'rizomo') {
            // Paramètres globaux
            $p['prefs']['rizomo_user_token'] = rcube_utils::get_input_value('_user_token', rcube_utils::INPUT_POST);
        }
        return $p;
    }

    /**
     * Création et authentification d'un utilisateur sur Rizomo
     */
    protected function login() {
        $user = driver_mel::gi()->getUser();
        if ($user->load(['email', 'firstname', 'lastname'])) {
            // Charge la lib cliente
            require_once __DIR__ . '/lib/rizomoclient.php';
            $rizomoClient = new RizomoClient();

            $token = $rizomoClient->createUserToken($user->email);

            // Si le retour a échoué c'est peut être parce que l'utilisateur n'existe pas
            if ($token === false 
                    && $rizomoClient->createUser($user->uid, $user->email, $user->firstname, $user->lastname)) {
                // On crée l'utilisateur puis on retente de générer un token
                $token = $rizomoClient->createUserToken($user->email);
            }

            // Si on a un token
            if (is_string($token)) {
                $this->rc->output->set_env('rizomo_user_token', $token);
            }
        }
    }
}
            