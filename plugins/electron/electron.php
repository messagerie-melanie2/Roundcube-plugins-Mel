<?php

/**
 * Plugin Mél Electron
 *
 * Plugin d'affichage de Mél dans un client Electron en lien avec le plugin Mél_archivage
 * Les messages sont téléchargés sur le poste de l'utilisateur
 * Puis copié dans un dossier configuré dans 'Mails archive' 
 * Du dossier de l'application Electron 
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

class electron extends rcube_plugin
{
    function init()
    {
        $rcmail = rcmail::get_instance();

        $rcmail->output->set_env('iselectron', $this->isElectron());
        if ($this->isElectron()) {
            $this->include_script('electron.js');
        }
        
        if ($rcmail->task == 'settings' || $rcmail->task == 'mail') {

            $username = $rcmail->get_user_name();
            $account = rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET);

            $account ? $rcmail->output->set_env('username', $account) : $rcmail->output->set_env('username', $username); 
            
            $skin_path = $this->local_skin_path();
            $this->include_stylesheet($skin_path . '/css/electron.css');

            $this->add_texts('localization/', true);
        }
    }

    /**
     * Are we using electron
     *
     * @return boolean
     */
    public function isElectron()
    {
        $useragent = $_SERVER['HTTP_USER_AGENT'];
        $pos = strpos($useragent, 'Mel_Electron');
        if ($pos === false) {
            $isElectron = false;
        } else {
            $isElectron = true;
        }
        return $isElectron;
    }
}
