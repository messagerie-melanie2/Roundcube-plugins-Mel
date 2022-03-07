<?php

/**
 * Plugin Mél Notifications
 *
 * Gestion des notifications dans le Bnum
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
class mel_notification extends rcube_plugin
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
     * @var array
     */
    private $exceptions = [];

    /**
     * @var boolean
     */
    private $notified = false;
    
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
                // Ajouter la conf pour le js
                $this->rc->output->set_env('notifications_refresh_interval',    $this->rc->config->get('notifications_refresh_interval', 60));
                $this->rc->output->set_env('notifications_show_duration',       $this->rc->config->get('notifications_show_duration', 3));
                $this->rc->output->set_env('notifications_categories',          $this->rc->config->get('notifications_categories', []));
                $this->rc->output->set_env('notifications_icons',               $this->rc->config->get('notifications_icons', []));
                $this->rc->output->set_env('notifications_set_read_on_click',   $this->rc->config->get('notifications_set_read_on_click', false));
                
                // Charger le js
                $this->include_script('notifications.js');
                
                // Charge le css
                $this->include_stylesheet($this->local_skin_path() . '/notifications.css');
                
                // Ajouter le texte
                $this->add_texts('localization/', true);
            }
            
            // Liste des actions js
            $this->register_action('plugin.notifications_action',   [$this, 'action']);
            $this->register_action('plugin.notifications_refresh',  [$this, 'refresh']);
        }
        else if ($this->rc->task == 'mail') {
            // Cas particulier des mails pour les notifications
            if ($this->rc->output->type == 'html'
                    && !isset($_GET['_extwin'])
                    && !isset($_GET['_framed'])
                    && !in_array($this->rc->task.'.'.$this->rc->action, $nojs_actions)) {
                // Charger le js en dehors de la metapage
                $this->include_script('notifications.js');
            }

            // Gestion des notifications sur les mails
            if ($this->rc->action == 'refresh') {
                // Ajouter le texte
                $this->add_texts('localization/', false);

                // Get folders to skip checking for
                $exceptions = ['drafts_mbox', 'models_mbox', 'sent_mbox', 'trash_mbox', 'junk_mbox'];
                foreach ($exceptions as $folder) {
                    $folder = $this->rc->config->get($folder);
                    if (strlen($folder) && $folder != 'INBOX') {
                        $this->exceptions[] = $folder;
                    }
                }
                $this->add_hook('new_messages', [$this, 'notify_mail']);
            }
        }
        
        if ($this->rc->task == 'settings') {
            // add hooks for Notifications settings
            $this->add_hook('preferences_sections_list',    [$this, 'preferences_sections_list']);
            $this->add_hook('preferences_list',             [$this, 'preferences_list']);
            $this->add_hook('preferences_save',             [$this, 'preferences_save']);
        }
    }
    
    /**
     * Gestion des actions sur les notifications (passage en lu, suppression, ...)
     */
    public function action()
    {
        // Récupère les params
        $uid = rcube_utils::get_input_value('_uid', rcube_utils::INPUT_POST);
        $uids = rcube_utils::get_input_value('_uids', rcube_utils::INPUT_POST);
        $act = rcube_utils::get_input_value('_act', rcube_utils::INPUT_POST);
        $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GPC);
        
        if (!isset($uids)) {
            $uids = [$uid];
        }
        
        $ret = true;
        $_res_uids = [];
        
        // Traitement de l'action par uid
        foreach ($uids as $uid) {
            $uid = base64_decode($uid);
            switch($act) {
                case 'read':
                    $ret &= driver_mel::gi()->getUser(null, false)->readNotification($uid);
                    break;
                    
                case 'unread':
                    $ret &= driver_mel::gi()->getUser(null, false)->readNotification($uid, false);
                    break;
            
                case 'del':
                    $ret &= driver_mel::gi()->getUser(null, false)->deleteNotification($uid);
                    break;
            }
            $_res_uids[] = $uid;
        }
        
        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
        
        // Traitement du retour
        $result = [
            'action'    => 'plugin.notifications_action',
            'uids'      => $_res_uids,
            'act'       => $act,
            'success'   => $ret,
            'unlock'    => $unlock,
        ];
        echo json_encode($result);
        exit();
    }
    
    /**
     * Gestion du refresh pour les notifications
     */
    public function refresh()
    {
        // Récupère les params
        $last = rcube_utils::get_input_value('_last', rcube_utils::INPUT_GET);
        
        // Liste des notifications à retourner
        $notifications = [];
        
        // Traitement du last
        if (isset($last)) {
            $last = intval($last);
        }
        
        $notifs = driver_mel::gi()->getUser(null, false)->getNotifications($last);
        
        if (is_array($notifs)) {
            foreach ($notifs as $notif) {
                $notifications[] = [
                    'uid'       => $notif->uid,
                    'from'      => $notif->from,
                    'title'     => $notif->title,
                    'content'   => $notif->content,
                    'created'   => $notif->created,
                    'modified'  => $notif->modified,
                    'category'  => $notif->category,
                    'action'    => unserialize($notif->action),
                    'isread'    => $notif->isread,                    
                ];
            }
        }
        
        header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
        
        // Traitement du retour
        $result = [
            'action'        => 'plugin.notifications_refresh',
            'last'          => time(),
            'notifications' => $notifications,
        ];
        echo json_encode($result);
        exit();
    }
    
    /**
     * Handler for new message action (new_messages hook)
     */
    public function notify_mail($args)
    {
        // Already notified or unexpected input
        if ($this->notified || empty($args['diff']['new'])) {
            return $args;
        }
        
        $mbox      = $args['mailbox'];
        $storage   = $this->rc->get_storage();
        $delimiter = $storage->get_hierarchy_delimiter();
        
        // Skip exception (sent/drafts) folders (and their subfolders)
        foreach ($this->exceptions as $folder) {
            if (strpos($mbox.$delimiter, $folder.$delimiter) === 0) {
                return $args;
            }
        }
        
        // Check if any of new messages is UNSEEN
        $deleted = $this->rc->config->get('skip_deleted') ? 'UNDELETED ' : '';
        $search  = $deleted . 'UNSEEN UID ' . $args['diff']['new'];
        $unseen  = $storage->search_once($mbox, $search);
        
        if ($unseen->count()) {
            $this->notified = true;
            
            // PAMELA - Gestion de la mailbox
            if (strpos($mbox, driver_mel::gi()->getBalpLabel()) === 0) {
                $tmp = explode($_SESSION['imap_delimiter'], $mbox, 3);
                $content = driver_mel::gi()->getUser($tmp[1])->fullname;
                $mailbox = $tmp[1];
                
                if (isset($tmp[2])) {
                    $content = $content . " > " . $tmp[2];
                }
            }
            else {
                $content = driver_mel::gi()->getUser()->fullname;
                $mailbox = driver_mel::gi()->getUser()->uid;
                
                if ($mbox != 'INBOX') {
                    $content = $content . " > " . $mbox;
                }
            }
            
            $this->rc->output->set_env('newmail_notifier_timeout', $this->rc->config->get('newmail_notifier_desktop_timeout'));
            $this->rc->output->command('plugin.push_notification',
                [
                    'uid'       => \LibMelanie\Lib\UUID::v4(),
                    'category'  => 'mail',
                    'title'     => $this->gettext('New message'),
                    'content'   => $content,
                    'created'   => time(),
                    'modified'  => time(),
                    'mailbox'   => $mailbox,
                    'isread'    => false,
                    'local'     => true,
                ]
            );
        }
        return $args;
    }

    /**
     * Handler for preferences_sections_list hook.
     * Adds Notifications settings sections into preferences sections list.
     *
     * @param array Original parameters
     *
     * @return array Modified parameters
     */
    public function preferences_sections_list($p)
    {
        $p['list']['notifications'] = [
            'id'      => 'notifications',
            'section' => $this->gettext('notifications'),
        ];
        return $p;
    }

    /**
     * Handler for preferences_list hook.
     * Adds options blocks into Notifications settings sections in Preferences.
     *
     * @param array Original parameters
     *
     * @return array Modified parameters
     */
    public function preferences_list($p)
    {
        if ($p['section'] != 'notifications') {
            return $p;
        }
    }

    /**
     * Handler for preferences_save hook.
     * Executed on Notifications settings form submit.
     *
     * @param array Original parameters
     *
     * @return array Modified parameters
     */
    public function preferences_save($p)
    {
        if ($p['section'] == 'notifications') {

        }

        return $p;
    }
}
            