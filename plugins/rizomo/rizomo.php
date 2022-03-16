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
        
        // Liste des actions pour lesquels on ne load pas le js
        $nojs_actions = [
            'mail.compose',
        ];
        
        // Ne proposer les actions et le js uniquement dans la page meta
        if ((!isset($_GET['_is_from']) || $_GET['_is_from'] != 'iframe') 
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
        
        if ($this->rc->task == 'settings') {
            // Ajouter le texte
            $this->add_texts('localization/', false);

            // add hooks for Notifications settings
            $this->add_hook('preferences_sections_list',    [$this, 'preferences_sections_list']);
            $this->add_hook('preferences_list',             [$this, 'preferences_list']);
            $this->add_hook('preferences_save',             [$this, 'preferences_save']);
        }
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
}
            