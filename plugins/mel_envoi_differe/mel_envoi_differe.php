<?php

/**
 * Plugin Mél Envoi différé
 *
 * Plugin d'envoi de mail différé depuis Roundcube
 * Les messages sont stocké sur un serveur jusqu'au moment de l'envoi
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

class mel_envoi_differe extends rcube_plugin
{
    /**
     * Méthode d'initialisation du plugin mel_envoi_differe
     */
    function init()
    {
        $rcmail = rcmail::get_instance();

        $this->load_config();

        if ($rcmail->task == 'mail' && $rcmail->action == 'compose') {
            if ($rcmail->config->get('ismobile', false)) {
                $skin_path = 'skins/mel_larry_mobile';
            } else {
                $skin_path = $this->local_skin_path();
            }
            $this->include_stylesheet($skin_path . '/css/mel_envoi_differe.css');
            $this->include_script('mel_envoi_differe.js');
            $this->add_texts('localization/', true);

            $this->add_button(array(
                'type'     => 'link',
                'label'    => 'buttontext',
                'command'  => 'display_mel_envoi_differe',
                'class'    => 'button mel_envoi_differe disabled',
                'id'       => 'mel_envoi_differe',
                'classact' => 'button mel_envoi_differe',
                'title'    => 'buttontitle',
                'domain'   => 'mel_envoi_differe'
            ), 'toolbar');

            $this->register_action('plugin.mel_envoi_differe', array($this, 'request_action'));
            $rcmail->output->set_env('timezone', $rcmail->config->get('timezone', null));
        } else if ($rcmail->task == 'mail' && $rcmail->action == 'send') {
            $this->add_hook('message_before_send', array($this, 'message_before_send'));
        }
    }

    /**
     * Affichage du template archivage
     */
    public function request_action()
    {
        $rcmail = rcmail::get_instance();
        $rcmail->output->send('mel_envoi_differe.mel_envoi_differe');
    }

    /**
     * Add timestamps and modify date in header
     */
    function message_before_send($args)
    {
        $timestamp = rcube_utils::get_input_value('envoi_differe', rcube_utils::INPUT_GPC);

        if ($timestamp) {
            $rcmail = rcmail::get_instance();
            $timestamp = $timestamp / 1000;
            // On récupère la timezone de l'utilisateur
            $timezone = $rcmail->config->get('timezone', null);

            $currentDate = new DateTime();
            $date = new DateTime("@$timestamp");

            $date->setTimeZone(new DateTimeZone($timezone));
            $dateFormat = $date->format('r');
            $date->setTimeZone(new DateTimeZone('UTC'));
            $currentDate->setTimeZone(new DateTimeZone('UTC'));

            $currentDateTimestamp = $currentDate->getTimestamp();
            $dateTimestamp = $date->getTimestamp();

            //On vérifie que la date correspond bien à une date future
            if ($dateTimestamp >  $currentDateTimestamp) {
                $args['message']->headers(array('X-DateEnvoiDiffere' => $dateTimestamp, 'Date' => $dateFormat), true);
            }
            return $args;
        }
    }
}
