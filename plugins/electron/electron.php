<?php

/**
 * Plugin Mél Electron
 *
 * Plugin d'affichage de Mél dans un client Electron en lien avec le plugin Mél_archivage
 * Les messages sont téléchargés sur le poste de l'utilisateur
 * Puis copié dans un dossier configuré dans le dossier d'archive
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

        $this->load_config();
        $this->charset = $rcmail->config->get('mel_archivage_charset', RCUBE_CHARSET);

        $rcmail->output->set_env('iselectron', $this->isElectron());

        if ($rcmail->task == 'settings' || $rcmail->task == 'mail') {

            $username = $rcmail->get_user_name();
            $account = rcube_utils::get_input_value('_account', rcube_utils::INPUT_GET);

            $account ? $rcmail->output->set_env('account_electron', $account) : $rcmail->output->set_env('account_electron', $username);

            $skin_path = $this->local_skin_path();
            $this->include_stylesheet($skin_path . '/css/electron.css');

            $this->add_texts('localization/', true);
            $this->register_action('plugin.import_message', array($this, 'import_message'));
            $this->register_action('plugin.create_folder', array($this, 'create_folder'));

            if ($this->isElectron()) {
                $this->include_script('electron.js');

                if ($this->api->output->type == 'html' && $rcmail->task == 'mail') {
                    $import = html::tag('li', array(
                        'role' => 'menuitem'
                    ), $this->api->output->button(array(
                        'label' => 'electron.import_button',
                        'type' => 'link',
                        'classact' => 'active',
                        'command' => 'plugin_import_archive',
                    )));

                    $this->api->add_content($import, 'mailboxoptions');
                } else if ($rcmail->task == 'settings') {
                    $this->add_hook('settings_actions', array($this, 'settings_actions'));
                    $this->api->register_action('plugin.electron', $this->ID, array(
                        $this,
                        'settings'
                    ));
                }
            }
        }
    }


    /**
     * Adds Electron section in Settings
     */
    function settings_actions($args)
    {
        $args['actions'][] = array(
            'action' => 'plugin.electron',
            'label'  => 'electron.electron',
            'title'  => 'electron.electron_title',
        );
        return $args;
    }

    function settings()
    {
        $rcmail = rcmail::get_instance();
        // Ajout du css
        $this->include_stylesheet($this->local_skin_path() . '/mel_frame.css');
        // Chargement du template d'affichage
        $rcmail->output->send('electron.electron');
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

    public function import_message()
    {
        $folder = rcube_utils::get_input_value('_folder', rcube_utils::INPUT_POST);
        $message = rcube_utils::get_input_value('_message', rcube_utils::INPUT_POST, true);
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);

        $imported = 0;
        if (!empty($message)) {
            $imported = (int)$this->rcmail_save_message($folder, $message);
        }

        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);

        $result = array('action' => 'plugin.import_message', 'data' => $imported, 'uid' => $uid);
        echo json_encode($result);
        exit;
    }

    public function rcmail_save_message($folder, $message)
    {
        if (strncmp($message, 'From ', 5) === 0) {
            // Extract the mbox from_line
            $pos = strpos($message, "\n");
            $from = substr($message, 0, $pos);
            $message = substr($message, $pos + 1);

            // Read the received date, support only known date formats

            // RFC4155: "Sat Jan  3 01:05:34 1996"
            $mboxdate_rx = '/^([a-z]{3} [a-z]{3} [0-9 ][0-9] [0-9]{2}:[0-9]{2}:[0-9]{2} [0-9]{4})/i';
            // Roundcube/Zipdownload: "12-Dec-2016 10:56:33 +0100"
            $imapdate_rx = '/^([0-9]{1,2}-[a-z]{3}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2} [0-9+-]{5})/i';

            if (($pos = strpos($from, ' ', 6)) && ($dt_str = substr($from, $pos + 1))
                && (preg_match($mboxdate_rx, $dt_str, $m) || preg_match($imapdate_rx, $dt_str, $m))
            ) {
                try {
                    $date = new DateTime($m[0], new DateTimeZone('UTC'));
                } catch (Exception $e) {
                    // ignore
                }
            }
        }

        // unquote ">From " lines in message body
        $message = preg_replace('/\n>([>]*)From /', "\n\\1From ", $message);
        $message = rtrim($message);
        $rcmail = rcmail::get_instance();

        if ($rcmail->storage->save_message($folder, $message, '', false, array(), $date)) {
            return true;
        }

        rcube::raise_error("Failed to import message to $folder", true, false);
        return false;
    }
}
