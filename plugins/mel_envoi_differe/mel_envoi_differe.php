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
     *
     * @var string
     */
    public $task = 'bureau|mail|addressbook|stockage|calendar|tasks|discussion|chat';

    /**
     * Méthode d'initialisation du plugin mel_envoi_differe
     */
    function init()
    {
        $rcmail = rcmail::get_instance();
 	$skin_path = $this->local_skin_path();

        $this->load_config();
        $this->add_hook('refresh', array($this, 'refresh'));

        // Command
        $this->register_action('plugin.disconnection', array($this, 'disconnection'));
        
        if ($rcmail->task == 'mail' && $rcmail->action == 'compose') {
            
            $this->include_script('mel_envoi_differe.js');
            $this->add_texts('localization/', true);
            $this->include_stylesheet($skin_path . '/css/mel_envoi_differe.css');

            $this->add_button(array(
                'type'     => 'link',
                'label'    => 'buttontext',
                'command'  => 'display_mel_envoi_differe',
                'class'    => 'mel_envoi_differe disabled',
                'id'       => 'mel_envoi_differe',
                'classact' => 'mel_envoi_differe',
                'inner'    => 'icofont-clock-time',
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

        $deconnection_enabled = $rcmail->config->get('remise_enable_deconnection_right', false);
        // Si le droit à la déconnexion est activé, on check par dn
        if ($deconnection_enabled) {
            $user = driver_mel::gi()->getUser();
            $deconnection_right_ldap_enabled_dn = $rcmail->config->get('deconnection_right_ldap_enabled_dn', []);
            if (count($deconnection_right_ldap_enabled_dn)) {
                $deconnection_enabled = false;
                // Parcourir les dn autorisés et valider l'activation
                foreach ($rcmail->config->get('deconnection_right_ldap_enabled_dn', []) as $allowed_dn) {
                    if (strpos($user->dn, $allowed_dn) !== false) {
                        $deconnection_enabled = true;
                    }
                }
            }
            // Parcourir les dn interdits et bloquer l'activation
            foreach ($rcmail->config->get('deconnection_right_ldap_disabled_dn', []) as $forbidden_dn) {
                if (strpos($user->dn, $forbidden_dn) !== false) {
                    $deconnection_enabled = false;
                }
            }
        }

        // Droit à la déconnexion
        if ($deconnection_enabled
                && $rcmail->output->type == 'html' 
                && !$rcmail->output->env['framed']) {
            $this->add_texts('localization/', ['disco_popup_title', 'disco_popup_description', 
                'disco_button_continue', 'disco_button_continue_with_remise_differe',
                'disco_button_disconnect'
            ]);
            
            $this->include_stylesheet($skin_path . '/css/mel_envoi_differe.css');
            $this->include_script('deconnection_right_popup.js');
            if ($this->is_deconnection_right_enable()) {
                // Afficher le popup ?
                $rcmail->output->set_env('deconnection_right_popup', true);
            }
        }
    }

    /**
     * Fonction refresh pour le popup de droit à la déconnexion
     */
    function refresh() 
    {
        if ($this->is_deconnection_right_enable()) {
            $this->add_texts('localization/', ['disco_popup_title', 'disco_popup_description', 
                'disco_button_continue', 'disco_button_continue_with_remise_differe',
                'disco_button_disconnect'
            ]);
            // Afficher le popup ?
            rcmail::get_instance()->output->command('plugin.deconnection_right_popup');
        }
    }

    /**
     * Continuer la sans déconnexion avec ou sans remise différée
     */
    function disconnection() 
    {
        $_SESSION['disconnexion_popup'] = true;
        $act = rcube_utils::get_input_value('_act', rcube_utils::INPUT_GPC);
        if ($act == 'continue_with_remise_differe') {
            $rcmail = rcmail::get_instance();
            $this->add_texts('localization/', ['disco_remise_differe_enabled']);

            // Get config values
            $timezone = $rcmail->config->get('timezone', date_default_timezone_get());
            $open_days = $rcmail->config->get('remise_open_days', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
            $open_hours = explode('-', $rcmail->config->get('remise_open_hours', '08:00-19:00'), 2);

            // Date now
            $date = new \DateTime('now');
            $date->setTimezone(new \DateTimeZone($timezone));

            $nbDay = $this->_get_number_of_days($date, $open_days, $open_hours);

            $date->add(new \DateInterval('P'.$nbDay.'D'));
            $_SESSION['envoi_differe_timestamp'] = strtotime($date->format('m/d/Y') . ' ' . $open_hours[0]) * 1000;
            $rcmail->output->show_message(str_replace('%%date%%', $date->format('d/m/Y') . ' ' . $open_hours[0], $this->gettext('disco_remise_differe_enabled')), 'confirmation');
        }
    }

    /**
     * Récupère le nombre de jours jusqu'au prochain jour ouvré
     * 
     * @param DateTime $date date du jour
     * @param array $open_days liste des jours ouvrés configurés
     * @param array $open_hours liste des heures ouvrées configurées
     * 
     * @return integer Nombre de jours
     */
    private function _get_number_of_days($date, $open_days, $open_hours)
    {
        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        $day = $date->format('D');

        $aKey = array_search($day, $days);
        $key = array_search($day, $open_days);

        $nbDay = 0;

        if ($key === false || $date->format('H:i') > $open_hours[1]) {
            // Cas ou on est un jour non ouvré ou après l'heure ouvré du dernier jour ouvré
            for ($nbDay = 1; $nbDay + $aKey < count($days); $nbDay++) {
                if (in_array($days[$nbDay + $aKey], $open_days)) {
                    break;
                }
            }
        }
        else if ($date->format('H:i') <= $open_hours[0]) {
            // On est le dernier jour ouvré mais avant l'heure ouvré
            $nbDay = 0;
        }
        else {
            // On est après l'heure ouvré d'un jour ouvré classique
            $nbDay = 1;
        }

        return $nbDay;
    }

    /**
     * Est-ce que le pop up de droit à la déconnexion doit s'afficher ?
     * 
     * @return boolean
     */
    private function is_deconnection_right_enable() 
    {
        $show_popup = false;
        $rcmail = rcmail::get_instance();

        $timezone = $rcmail->config->get('timezone', date_default_timezone_get());
        $open_days = $rcmail->config->get('remise_open_days', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

        $date = new \DateTime('now');
        $date->setTimezone(new \DateTimeZone($timezone));

        if (!in_array($date->format('D'), $open_days)) {
            // On n'est pas dans un jour ouvré
            $show_popup = true;
        }
        else {
            $open_hours = explode('-', $rcmail->config->get('remise_open_hours', '08:00-19:00'), 2);
            if ($date->format('H:i') < $open_hours[0] || $date->format('H:i') > $open_hours[1]) {
                // On est hors des plages horaires
                $show_popup = true;
            }
            else {
                $_SESSION['disconnexion_popup'] = null;
            }
        }
        
        return $show_popup && !isset($_SESSION['disconnexion_popup']);
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
