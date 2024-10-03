<?php

include_once __DIR__.'/lib/Notification.php';

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
     * Valeurs par défaut pour les prefs
     * 
     * @var array
     */
    public $defaults = [
        'notifications_refresh_interval'        => 120,
        'notifications_show_duration'           => 10,
        'notifications_desktop_duration'        => 5,
        'notifications_categories'              => [],
        'notifications_icons'                   => [],
        'notifications_material_icons'          => [],
        'notifications_set_read_on_click'       => false,
        'notifications_set_read_on_panel_close' => false,
        'notifications_sound_on_new_mail'       => false
    ];
    
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
                $this->rc->output->set_env('notifications_refresh_interval',        $this->rc->config->get('notifications_refresh_interval',        $this->defaults['notifications_refresh_interval']));
                $this->rc->output->set_env('notifications_show_duration',           $this->rc->config->get('notifications_show_duration',           $this->defaults['notifications_show_duration']));
                $this->rc->output->set_env('notifications_desktop_duration',        $this->rc->config->get('notifications_desktop_duration',        $this->defaults['notifications_desktop_duration']));
                $this->rc->output->set_env('notifications_categories',              $this->rc->config->get('notifications_categories',              $this->defaults['notifications_categories']));
                $this->rc->output->set_env('notifications_icons',                   $this->rc->config->get('notifications_icons',                   $this->defaults['notifications_icons']));
                $this->rc->output->set_env('notifications_material_icons',          $this->rc->config->get('notifications_material_icons',          $this->defaults['notifications_material_icons']));
                $this->rc->output->set_env('notifications_set_read_on_click',       $this->rc->config->get('notifications_set_read_on_click',       $this->defaults['notifications_set_read_on_click']));
                $this->rc->output->set_env('notifications_set_read_on_panel_close', $this->rc->config->get('notifications_set_read_on_panel_close', $this->defaults['notifications_set_read_on_panel_close']));
                $this->rc->output->set_env('notifications_sound_on_new_mail',       $this->rc->config->get('notifications_sound_on_new_mail',       $this->defaults['notifications_sound_on_new_mail']));
                $this->rc->output->set_env('notifications_settings',                $this->rc->config->get('notifications_settings',                []));
                
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
            $this->register_action('plugin.notification_test',   [$this, 'test']);
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

        if (class_exists('mel_metapage')) $this->include_script('side_notifications.js');
        
        if ($this->rc->task == 'settings') {
            // Ajouter le texte
            $this->add_texts('localization/', false);

            // add hooks for Notifications settings
            $this->add_hook('preferences_sections_list',    [$this, 'preferences_sections_list']);
            $this->add_hook('preferences_list',             [$this, 'preferences_list']);
            $this->add_hook('preferences_save',             [$this, 'preferences_save']);
        }
    }

    public function test()
    {
        $this->notify("suggestion", "GOUBIER Arnaud a ajouté une nouvelle suggestion", "Ceci est un test de notification lancé par rotomeca !", 
          [
              'href' => "./?_task=workspace&_action=workspace&_uid=",
              'text' => $this->gettext("mel_workspace.open"),
              'title' => $this->gettext("mel_workspace.click_for_open"),
              'command' => "event.click"
          ]);
        // echo json_encode($a);
        // exit;
    }

    public function test_mail()
    {
      $this->add_texts('localization/', true);

      $args = [
        'mailbox' => "INBOX", 'is_current' => false, 'diff' => [
          'new' => "1",
        ],
        'abort' => false
      ];
      $this->notify_mail($args);
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
                    $content = $content . " > " . rcube_charset::utf7imap_to_utf8($mbox);
                }
            }
            
            $this->rc->output->set_env('newmail_notifier_timeout', $this->rc->config->get('newmail_notifier_desktop_timeout'));

            $action = NotificationActionBase::Create(
                /*text*/      'Ouvrir le mail', 
                /*title*/     'Cliquez ici pour ouvrir pour aller voir !', 
                /*href*/      "./?_task=mail&_mbox=$mbox", 
                /*iscommand*/ false);

            (new CommandNotification(
                /*category*/ ENotificationType::Mail(), 
                /*title*/    $this->gettext('New message'), 
                /*content*/  $content, 
                /*action*/   $action
                )
            )->add_extra('mailbox', $mailbox)->notify_local();
            
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

        $no_override = array_flip((array) $this->rc->config->get('dont_override'));

        $p['blocks']['general']['name'] = $this->gettext('mainoptions');

        if (!isset($no_override['notifications_show_duration'])) {
            if (empty($p['current'])) {
                $p['blocks']['general']['content'] = true;
                return $p;
            }

            $field_id = 'rcmfd_show_duration';
            $default = $this->rc->config->get('notifications_show_duration', $this->defaults['notifications_show_duration']);

            $select = new html_select(['name' => '_show_duration', 'id' => $field_id]);
            for ($i=1; $i<=60; $i++) { 
                $select->add("$i", $i);
            }

            $p['blocks']['general']['options']['show_duration'] = [
                'title'   => html::label($field_id, rcube::Q($this->gettext('show_duration'))),
                'content' => $select->show($default),
            ];
        }

        if (!isset($no_override['notifications_desktop_duration'])) {
            if (empty($p['current'])) {
                $p['blocks']['general']['content'] = true;
                return $p;
            }

            $field_id = 'rcmfd_desktop_duration';
            $default = $this->rc->config->get('notifications_desktop_duration', $this->defaults['notifications_desktop_duration']);

            $select = new html_select(['name' => '_desktop_duration', 'id' => $field_id]);
            for ($i=1; $i<=60; $i++) { 
                $select->add("$i", $i);
            }

            $p['blocks']['general']['options']['desktop_duration'] = [
                'title'   => html::label($field_id, rcube::Q($this->gettext('desktop_duration'))),
                'content' => $select->show($default),
            ];
        }

        if (!isset($no_override['notifications_set_read_on_click'])) {
            if (empty($p['current'])) {
                $p['blocks']['general']['content'] = true;
                return $p;
            }

            $field_id = 'rcmfd_set_read_on_click';
            $default = $this->rc->config->get('notifications_set_read_on_click', $this->defaults['notifications_set_read_on_click']);

            $checkbox = new html_checkbox(['name' => '_set_read_on_click', 'id' => $field_id, 'value' => 1]);

            $p['blocks']['general']['options']['set_read_on_click'] = [
                'title'   => html::label($field_id, rcube::Q($this->gettext('set_read_on_click'))),
                'content' => $checkbox->show($default ? 1 : 0),
            ];
        }

        if (!isset($no_override['notifications_set_read_on_panel_close'])) {
            if (empty($p['current'])) {
                $p['blocks']['general']['content'] = true;
                return $p;
            }

            $field_id = 'rcmfd_set_read_on_panel_close';
            $default = $this->rc->config->get('notifications_set_read_on_panel_close', $this->defaults['notifications_set_read_on_panel_close']);

            $checkbox = new html_checkbox(['name' => '_set_read_on_panel_close', 'id' => $field_id, 'value' => 1]);

            $p['blocks']['general']['options']['set_read_on_panel_close'] = [
                'title'   => html::label($field_id, rcube::Q($this->gettext('set_read_on_panel_close'))),
                'content' => $checkbox->show($default ? 1 : 0),
            ];
        }

        if (!isset($no_override['notifications_sound_on_new_mail'])) {
            $field_id = 'rcmfd_notifications_sound_on_new_mail';
            $default = $this->rc->config->get('notifications_sound_on_new_mail', $this->defaults['notifications_sound_on_new_mail'] ?? false);

            $checkbox = new html_checkbox(['name' => '_notifications_sound_on_new_mail', 'id' => $field_id, 'value' => 1]);

            $p['blocks']['general']['options']['notifications_sound_on_new_mail'] = [
                'title'   => html::label($field_id, rcube::Q($this->gettext('notifications_sound_on_new_mail'))),
                'content' => $checkbox->show($default ? 1 : 0),
            ];
        }    
        
        $p['blocks']['general']['options']['test_sound'] = [
            'title' => '<div style="display: flex;height: 100%;"><span style="align-self: center;">Tester le son de notification d\'un nouveau mail</span></div>',
            'content' => '<div id="notification-sound-container">test</div>'
        ];

        $this->include_script('sound.js');

        // Block avancé pour les notifications
        $p['blocks']['list']['name'] = $this->gettext('Notifications settings');

        $table = new html_table_bnum(['id' => 'notificationssettings', 'cols' => 4]);

        // Add headers
        foreach (['notifications', 'inside_notification', 'desktop_notification', 'notifications_center'] as $name) {
            $table->add_header(['class' => $name, 'scope' => 'col'], $this->gettext($name));
        }

        $notifications_settings = $this->rc->config->get('notifications_settings', []);
        
        // Add rows
        foreach ($this->rc->config->get('notifications_categories', $this->defaults['notifications_categories']) as $key => $name) {
            // Configuration courante
            $config = isset($notifications_settings[$key]) ? $notifications_settings[$key] : [];

            // Colonne avec le nom du settings
            $table->add_col_header(['scope' => 'row'], $name, true);

            // Parcours les configurations
            foreach (['inside_notification', 'desktop_notification', 'notifications_center'] as $setting) {
                if (isset($config[$setting])) {
                    $value = $config[$setting] ? 1 : 0;
                }
                else {
                    $value = 1;
                }
                $checkbox = new html_checkbox(['name' => '_' . $setting . '_' . $key, 'value' => 1]);
                $table->add([], $checkbox->show($value));
            }

            // Traiter les boites mails de l'utilisateur en plus
            if ($key == 'mail' && in_array('mel_sharedmailboxes', $this->rc->plugins->active_plugins)) {
                $config_mailboxes = isset($config['mailboxes']) ? $config['mailboxes'] : [];
                $current_key = driver_mel::gi()->getUser()->uid;
                $config_mailbox = isset($config_mailboxes[$current_key]) ? $config_mailboxes[$current_key] : [];

                // Ajouter la BALI
                $table->add_col_header(['scope' => 'row'], $this->gettext('mailbox') . driver_mel::gi()->getUser()->fullname, true);

                // Parcours les configurations
                foreach (['inside_notification', 'desktop_notification', 'notifications_center'] as $setting) {
                    if (isset($config_mailbox[$setting])) {
                        $value = $config_mailbox[$setting] ? 1 : 0;
                    }
                    else {
                        $value = 1;
                    }
                    $checkbox = new html_checkbox(['name' => '_' . $setting . '_' . $key . '_' . driver_mel::gi()->mceToRcId($current_key), 'value' => 1]);
                    $table->add([], $checkbox->show($value));
                }

                // Ajouter les boites partagées
                $objects = $this->rc->plugins->get_plugin('mel_sharedmailboxes')->get_user_sharedmailboxes_list();
                foreach ($objects as $object) {
                    $current_key = $object->mailbox->uid;
                    $config_mailbox = isset($config_mailboxes[$current_key]) ? $config_mailboxes[$current_key] : [];

                    // Colonne avec le nom du settings
                    $table->add_col_header(['scope' => 'row'], $this->gettext('mailbox') . $object->mailbox->fullname, true);

                    // Parcours les configurations
                    foreach (['inside_notification', 'desktop_notification', 'notifications_center'] as $setting) {
                        if (isset($config_mailbox[$setting])) {
                            $value = $config_mailbox[$setting] ? 1 : 0;
                        }
                        else {
                            $value = 1;
                        }
                        $checkbox = new html_checkbox(['name' => '_' . $setting . '_' . $key . '_' . driver_mel::gi()->mceToRcId($current_key), 'value' => 1]);
                        $table->add([], $checkbox->show($value));
                    }
                }
            }
        }

        $p['blocks']['list']['options']['notifications_settings'] = [
            'content' => $table->show(),
        ];

        return $p;
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
            // Paramètres globaux
            $p['prefs']['notifications_show_duration'] = intval(rcube_utils::get_input_value('_show_duration', rcube_utils::INPUT_POST));
            $p['prefs']['notifications_desktop_duration'] = intval(rcube_utils::get_input_value('_desktop_duration', rcube_utils::INPUT_POST));
            $p['prefs']['notifications_set_read_on_panel_close'] = rcube_utils::get_input_value('_set_read_on_panel_close', rcube_utils::INPUT_POST) == "1";
            $p['prefs']['notifications_set_read_on_click'] = rcube_utils::get_input_value('_set_read_on_click', rcube_utils::INPUT_POST) == "1";
            $p['prefs']['notifications_sound_on_new_mail'] = rcube_utils::get_input_value('_notifications_sound_on_new_mail', rcube_utils::INPUT_POST) == "1";


            // Paramètres spécifiques des notifications
            $p['prefs']['notifications_settings'] = [];

            foreach ($this->rc->config->get('notifications_categories', $this->defaults['notifications_categories']) as $key => $name) {
                $settings = [];
                // Parcours les configurations
                foreach (['inside_notification', 'desktop_notification', 'notifications_center'] as $setting) {
                    $settings[$setting] = rcube_utils::get_input_value('_' . $setting . '_' . $key, rcube_utils::INPUT_POST) == "1";
                }

                // Cas des boites mails
                if ($key == 'mail' && in_array('mel_sharedmailboxes', $this->rc->plugins->active_plugins)) {
                    $current_key = driver_mel::gi()->getUser()->uid;

                    $settings['mailboxes'] = [
                        $current_key => [],
                    ];

                    // Parcours les configurations
                    foreach (['inside_notification', 'desktop_notification', 'notifications_center'] as $setting) {
                        $settings['mailboxes'][$current_key][$setting] = rcube_utils::get_input_value('_' . $setting . '_' . $key . '_' . driver_mel::gi()->mceToRcId($current_key), rcube_utils::INPUT_POST) == "1";
                    }

                    // Ajouter les boites partagées
                    $objects = $this->rc->plugins->get_plugin('mel_sharedmailboxes')->get_user_sharedmailboxes_list();
                    foreach ($objects as $object) {
                        $current_key = $object->mailbox->uid;
                        $settings['mailboxes'][$current_key] = [];

                        // Parcours les configurations
                        foreach (['inside_notification', 'desktop_notification', 'notifications_center'] as $setting) {
                            $settings['mailboxes'][$current_key][$setting] = rcube_utils::get_input_value('_' . $setting . '_' . $key . '_' . driver_mel::gi()->mceToRcId($current_key), rcube_utils::INPUT_POST) == "1";
                        }
                    }
                }
                // Ajouter la conf aux settings
                $p['prefs']['notifications_settings'][$key] = $settings;
            }
        }
        return $p;
    }

    public static function notify($category, $title, $content, $action = null, $user = null)
    {
        $user = driver_mel::gi()->getUser($user);

        $notification = driver_mel::gi()->notification([$user]);

        $notification->category = $category;
        $notification->title = $title;
        $notification->content = $content;

        if ($action !== null) {
            if (isset($action->title)) $action = $action->get();
            $notification->action = serialize($action);
        }

        // Ajouter la notification au User
        return $user->addNotification($notification);
    }
}
            