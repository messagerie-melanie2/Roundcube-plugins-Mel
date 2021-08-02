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

        if ($rcmail->task == 'mail' && $rcmail->action == 'compose') {
            if ($rcmail->config->get('ismobile', false)) {
                $skin_path = 'skins/mel_larry_mobile';
            } else {
                $skin_path = $this->local_skin_path();
            }
            $this->load_config();
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

            $rcmail->output->set_env('timezone', $rcmail->config->get('timezone', date_default_timezone_get()));
            $rcmail->output->set_env('max_days', $rcmail->config->get('remise_max_days', 30));
            if (isset($_SESSION['envoi_differe_timestamp']) && $timestamp = intval($_SESSION['envoi_differe_timestamp'])) {
                $timestamp = $timestamp / 1000;
                $date_utc = new \DateTime("now", new \DateTimeZone("UTC"));
                if ($date_utc->getTimestamp() < $timestamp) {
                    // On récupère la timezone de l'utilisateur
                    $timezone = $rcmail->config->get('timezone', date_default_timezone_get());

                    $date = new \DateTime('@'.$timestamp);
                    $date->setTimeZone(new DateTimeZone($timezone));

                    $rcmail->output->set_env('envoi_differe_date', $date->format('d/m/Y H:i'));
                    $rcmail->output->set_env('envoi_differe_timestamp', $_SESSION['envoi_differe_timestamp']);
                }
                else {
                    $_SESSION['envoi_differe_timestamp'] = null;
                }
            }
        } else if ($rcmail->task == 'mail' && $rcmail->action == 'send') {
            $this->add_hook('message_before_send', array($this, 'message_before_send'));
        }
    }

    /**
     * Add timestamps and modify date in header
     */
    function message_before_send($args)
    {
        $timestamp = rcube_utils::get_input_value('envoi_differe', rcube_utils::INPUT_GPC);
        $save = rcube_utils::get_input_value('save_envoi_differe', rcube_utils::INPUT_GPC);

        if ($timestamp) {
            $this->load_config();
            $this->add_texts('localization/', true);
            $rcmail = rcmail::get_instance();
            $timestamp = $timestamp / 1000;
            // On récupère la timezone de l'utilisateur
            $timezone = $rcmail->config->get('timezone', date_default_timezone_get());

            $currentDate = new DateTime();
            $date = new DateTime("@$timestamp");

            $date->setTimeZone(new DateTimeZone($timezone));
            $dateFormat = $date->format('r');
            $date->setTimeZone(new DateTimeZone('UTC'));
            $currentDate->setTimeZone(new DateTimeZone('UTC'));

            $currentDateTimestamp = $currentDate->getTimestamp();
            $dateTimestamp = $date->getTimestamp();

            // MANTIS 0006201: Limiter la durée d'une remise différée
            $max_is_seconds = ($rcmail->config->get('remise_max_days', 30) + 1) * 24 * 60 * 60;

            if (($dateTimestamp - $currentDateTimestamp) > $max_is_seconds) {
                $args['abort'] = true;
                $args['error'] = str_replace('%%max_days%%', $rcmail->config->get('remise_max_days', 30), $this->gettext('max_days_error'));
            }
            // On vérifie que la date correspond bien à une date future
            else if ($dateTimestamp > $currentDateTimestamp) {
                if ($save == 'true') {
                    $_SESSION['envoi_differe_timestamp'] = rcube_utils::get_input_value('envoi_differe', rcube_utils::INPUT_GPC);
                }
                else if (isset($_SESSION['envoi_differe_timestamp'])) {
                    $_SESSION['envoi_differe_timestamp'] = null;
                }
                // $args['message']->headers(array('X-DateEnvoiDiffere' => $dateTimestamp, 'X-StatusEnvoiDiffere' => 'true', 'Date' => $dateFormat), true);
                $args['message']->headers(array('X-DateEnvoiDiffere' => $dateTimestamp, 'Date' => $dateFormat), true);
            }
        }
        else if (isset($_SESSION['envoi_differe_timestamp']) && (!isset($save) || $save != 'true')) {
            // Désactivation de l'envoi différé pour les envois suivants
            $_SESSION['envoi_differe_timestamp'] = null;
        }
        return $args;
    }
}
