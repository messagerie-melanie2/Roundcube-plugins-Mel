<?php
/**
 * Plugin Mél Shared Mailboxes
 *
 * Permet d'afficher les boites partagées dans le webmail
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

class mel_sharedmailboxes_imap extends rcube_plugin {
    /**
     *
     * @var string
     */
    public $task = '.*';
    /**
     *
     * @var rcmail
     */
    private $rc;
    /**
     * @var mel
     */
    private $mel;
    /**
     * Stocke le _account passé en get
     *
     * @var string
     */
    private $get_account;

    /**
     * Connexion au folder precedent, 
     * si on change de boite on doit refaire une connexion au storage
     * 
     * @var string
     */
    private $prev_folder;

    /**
     * Initialisation du plugin
     *
     * @see rcube_plugin::init()
     */
    function init() {
        $this->rc = rcmail::get_instance();
        $this->require_plugin('mel_logs');
        $this->require_plugin('mel');
        $this->mel = $this->rc->plugins->get_plugin('mel');

        // Hooks
        $this->add_hook('storage_connect',      array($this, 'storage_connect'));
        $this->add_hook('managesieve_connect',  array($this, 'managesieve_connect'));
        $this->add_hook('identity_select',      array($this, 'identity_select'));
        $this->add_hook('message_before_send',  array($this, 'message_before_send'));
        $this->add_hook('check_recent',         array($this, 'check_recent'));
        $this->add_hook('messages_list',        array($this, 'messages_list'));

        $this->add_hook('config_get',           array($this, 'config_get'));

        $this->add_hook('mel_is_inbox',         array($this, 'is_inbox'));
        $this->add_hook('mel_folder_cache',     array($this, 'folder_cache'));
        $this->add_hook('m2_set_folder_name',   array($this, 'set_folder_name'));

        $this->add_hook('mel_move_message',     array($this, 'move_message'));
        $this->add_hook('mel_copy_message',     array($this, 'copy_message'));
    
        $this->add_hook('render_mailboxlist',   array($this, 'render_mailboxlist'));
        
        $this->add_hook('preferences_list',     array($this, 'prefs_list'));
        $this->add_hook('preferences_save',     array($this, 'prefs_save'));

        // MANTIS 0004276: Reponse avec sa bali depuis une balp, quels "Elements envoyés" utiliser
        if ($this->rc->task == 'mail') {
            $this->register_action('plugin.refresh_store_target_selection', array($this,'refresh_store_target_selection'));
        }

        // Chargement de l'account passé en Get
        $this->get_account = mel::get_account();
        // Gestion de la connexion pour les dossiers
        if ($this->rc->task == 'settings' && $this->rc->action == 'edit-folder') {
            $this->get_user_from_folder(rcube_utils::get_input_value('_path', rcube_utils::INPUT_GET));
        }
        else if ($this->rc->task == 'settings' && $this->rc->action == 'save-folder') {
            $this->get_user_from_folder(rcube_utils::get_input_value('_parent', rcube_utils::INPUT_POST));
        }
        // Chargement de l'ui
        $this->init_ui();
    }

    /**
     * Initializes plugin's UI (localization, js script)
     */
    private function init_ui() {
        if ($this->ui_initialized) {
            return;
        }
        // MANTIS 0004276: Reponse avec sa bali depuis une balp, quels "Elements envoyés" utiliser
        if ($this->rc->task == 'mail' && $this->rc->action == 'compose') {
            $this->assoc_identity_bal();
            // Ajout d'un champ hidden pour stocker l'account
            $hidden_account = new html_hiddenfield(array('id' => '_compose_hidden_account', 'name' => '_account'));
            $this->api->add_content($hidden_account->show($this->get_account), 'composeoptions');
            // Modification de l'affichage des dossiers imap
            $this->set_compose_sent_folder();
        }
        // Folders list handler
        else if ($this->rc->task == 'mail' && empty($this->rc->action)) {
            $this->include_stylesheet('../mel_larry/css/sharedmailboxes.css');
            // $this->include_script('sharedmailboxes.js');
            $this->rc->output->add_handler('mailboxlist_mel', array($this, 'folder_list'));

        }
        // ajouter les boites partagées
        if ($this->api->output->type == 'html') {
            // Tableau pour la conf du chargement des boites partagées
            // task => [action => needs_gestionnaire ?]
            $list_tasks = [
                'settings' => [
                    'plugin.managesieve' => true,
                    'folders' => false,
                    'plugin.mel_resources_agendas' => true,
                    'plugin.mel_resources_contacts' => true,
                    'plugin.mel_resources_tasks' => true,
                ],
            ];
  
            // Définition des valeurs par défaut en session
            $_SESSION['page'] = 1;
    
            if (isset($list_tasks[$this->rc->task]) && isset($list_tasks[$this->rc->task][$this->rc->action])) {
                $user = driver_mel::gi()->getUser($this->mel->get_share_objet(), false);
                if (!$user->is_objectshare) {
                    $user->load();
                }
                // Récupération de la liste des balp de l'utilisateur courant
                if ($list_tasks[$this->rc->task][$this->rc->action]) {
                    // Boites gestionnaires ?
                    $_objects = [driver_mel::gi()->getUser()] + driver_mel::gi()->getUser()->getObjectsSharedGestionnaire();
                }
                else {
                    $_objects = [driver_mel::gi()->getUser()] + driver_mel::gi()->getUser()->getObjectsShared();
                }
                // Affichage du nom de l'utilisateur et du menu déroulant de balp
                if ($this->rc->task == 'settings') {
                    $_fullName = $user->is_objectshare ? $user->objectshare->mailbox->fullname : $user->fullname;
                    $this->api->add_content(html::tag('div', array(
                            "class" => "folderlist-header-m2-settings",
                            "id" => "folderlist-header-m2-settings"
                    ), html::tag('span', array(
                            "title" => $this->gettext('mailboxchangetext')
                    ), $_fullName)), 'folderlistheader-settings');
                }
                // Récupération des préférences de l'utilisateur
                $hidden_mailboxes = $this->rc->config->get('hidden_mailboxes', array());
                $i = 0;
                if (count($_objects) >= 1) {
                    $sort_bal = $this->rc->config->get('sort_bal', []);
                    foreach ($_objects as $key => $_object) {
                        // Gestion du order
                        $order = array_search(driver_mel::gi()->mceToRcId($_object->uid), $sort_bal);
                        if ($order === false) {
                            if ($_object->uid == $this->rc->get_user_name())
                                $order = 1000;
                            else
                                $order = 2000;
                        }
                        $_objects[$key]->order = $order;
                    }
                    // trier la liste
                    uasort($_objects, function ($a, $b) {
                        if ($a->order === $b->order)
                            return strcmp(strtolower($a->fullname), strtolower($b->fullname));
                        else
                            return strnatcmp($a->order, $b->order);
                    });
                    $content = "";
                    if ($this->rc->task == 'mail') {
                        $content_first = "";
                        $content_last = "";
                        $last = false;
                    }
                    foreach ($_objects as $_object) {
                        $i++;
                        if ($this->rc->task == 'mail' 
                            && isset($hidden_mailboxes[$_object->uid])) {
                            continue;
                        }
                        $uid = urlencode($_object->uid);
                        $cn = $_object->fullname;
                        $mailbox = $_object;
                        if (isset($_object->mailbox)) {
                            $mailbox = $_object->mailbox;
                            // Ne lister que les bal qui ont l'accès internet activé si l'accés se fait depuis Internet
                            $mailbox->load(['internet_access_enable']);
                            if (!mel::is_internal() && !$mailbox->internet_access_enable) {
                                continue;
                            }
                            // Récupération de la configuration de la boite pour l'affichage
                            $hostname = driver_mel::gi()->getRoutage($mailbox);
                            if (isset($hostname)) {
                                $uid = urlencode($uid . "@" . $hostname);
                            }
                            $cn = $mailbox->fullname;
                        }
                        $current_mailbox = empty($this->get_account) && $_object->uid == $this->rc->get_user_name() || urlencode($this->get_account) == $uid;
                        if ($this->rc->task == 'mail') {
                            // Récupération de la mbox pour une balp depuis le driver
                            $mbox = driver_mel::gi()->getMboxFromBalp($mailbox->uid);
                            $_account_url = $mailbox->uid == $this->rc->get_user_name() ? "" : "&_account=" . $uid;
                            if (isset($mbox)) {
                                $href = $current_mailbox ? "#" : "?_task=mail&_mbox=" . urlencode($mbox) . $_account_url;
                            }
                            else {
                                $href = $current_mailbox ? "#" : "?_task=mail$_account_url";
                            }
                            // MANTIS 3987: La gestion des BALP ne conserve pas le paramètre _courrielleur=1
                            if (isset($_GET['_courrielleur']) && !$current_mailbox) {
                                $href .= "&_courrielleur=1";
                            }
                            $treetoggle = $current_mailbox ? 'expanded' : 'collapsed';
                            $content = html::tag('li', array(
                                    "id" => rcube_utils::html_identifier($uid, true),
                                    "class" => "mailbox box liitem" . ($i != count($_objects) ? " liborder" : "") . ($current_mailbox ? ' current' : '')
                                ), html::tag('a', array(
                                    "href" => $href,
                                    "title" => $_object->email_send),
                                    html::tag('span', array(
                                        "class" => "button-inner-m2"
                                    ), $cn) .
                                    html::div(['class' => 'treetoggle ' . $treetoggle], ' ') .
                                    html::tag('span', ['class' => 'unreadcount'], '')
                                )
                            );
                            if ($last) {
                                $content_last .= $content;
                            }
                            else {
                                $content_first .= $content;
                                $last = $current_mailbox;
                            }
                        }
                        else if (!$current_mailbox) {
                            if ($uid == $this->rc->get_user_name()) {
                                $href = "?_task=" . $this->rc->task . "&_action=" . $this->rc->action;
                            }
                            else {
                                $href = "?_task=" . $this->rc->task . "&_action=" . $this->rc->action . "&_account=" . $uid;
                            }
                            // MANTIS 3987: La gestion des BALP ne conserve pas le paramètre _courrielleur=1
                            if (isset($_GET['_courrielleur'])) {
                                $href .= "&_courrielleur=1";
                            }
                            $content .= html::tag('li', array(
                                    "class" => "mailbox box liitem" . ($i != count($_objects) ? " liborder" : "")
                                ), html::tag('a', array(
                                    "href" => $href,
                                    "title" => $_object->email_send), 
                                    html::tag('span', array(
                                    "class" => "button-inner-m2"
                                    ), $cn)
                                )
                            );
                        }
                    }
                }
                // Affiche les données sur la bal
                if ($this->rc->task == 'settings') {
                    $this->api->add_content(html::tag('div', array(
                                "class" => "sharesmailboxeshide",
                                "id" => "sharesmailboxeslist-settings"
                        ), html::tag('ul', array(
                                "class" => "sharesmailboxesul",
                                "id" => "sharesmailboxesul"
                        ), $content)), 'folderlistheader-settings');
                }
            }
        }
        $this->ui_initialized = true;
    }

    /**
     * Rafraichissement de la liste des dossiers dans la page compose
     */
    public function refresh_store_target_selection() {
        $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GET);

        $attrib = array(
                'name'      => '_store_target',
                'maxlength' => '30',
                'style'     => 'max-width:12em',
                'tabindex'  => '4',
        );
        $select = $this->rc->folder_selector(array_merge($attrib, array(
                'noselection'   => '- ' . $this->rc->gettext('dontsave') . ' -',
                'folder_filter' => 'mail',
                'folder_rights' => 'w',
        )));

        $result = array(
                'action' => 'plugin.refresh_store_target_selection',
                'select_html' => $select->show($this->rc->config->get('sent_mbox'), $attrib),
                'unlock' => $unlock,
        );
        echo json_encode($result);
        exit;
    }

    /**
     * Connect to IMAP server
     * Utilise les identifiants de la balp si nécessaire
     */
    public function storage_connect($args) {
        if ($args['driver'] == 'imap') {
            if (mel_logs::is(mel_logs::DEBUG))
                mel_logs::gi()->l(mel_logs::DEBUG, "mel::storage_connect()");
            /* PAMELA - Gestion des boites partagées */
            if (!empty($this->get_account)) {
                $args['user'] = $this->mel->get_share_objet();
                $args['host'] = $this->mel->get_host();
            }
            else if ($this->rc->task != 'mail' || !empty($this->rc->action)) {
                if ($this->rc->task == 'mail' && $this->rc->action == 'send' && isset($_POST['_store_target'])) {
                    $folder = rcube_utils::get_input_value('_store_target', rcube_utils::INPUT_POST);
                }
                else if ($this->rc->task == 'settings' && $this->rc->action == 'edit-folder') {
                    $folder = rcube_utils::get_input_value('_path', rcube_utils::INPUT_GET);
                }
                else if (isset($_GET['_mbox']) || isset($_POST['_mbox'])) {
                    $folder = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GPC);
                    if (strpos($folder, driver_mel::gi()->getBalpLabel()) !== 0 
                            || strpos($folder, driver_mel::gi()->getMboxTrash() . '-individuelle') === false) {
                        $folder = $this->rc->storage->get_folder();
                    }
                }
                else {
                    $folder = $this->rc->storage->get_folder();
                }

                $ret = $this->get_user_from_folder($folder);
                if (isset($ret)) {
                    // Récupération de la configuration de la boite pour l'affichage
                    $args['user'] = $ret['user'];
                    $args['host'] = $ret['host'];
                }
            }
            // Utiliser les proxy imap ?
            if ($this->rc->config->get('use_imap_proxy', false)) {
                $args['host'] = $this->rc->config->get('imap_proxy', null);
            }
        }
        return $args;
    }


    /**
     * Récupère la configuration user/host en fonction du folder
     * 
     * @param string $folder Nom du folder
     * 
     * @return null|array null si pas de configuration, ['user', 'host'] sinon 
     */
    private function get_user_from_folder($folder) {
        $ret = null;
        $balp_label = driver_mel::gi()->getBalpLabel();
        if (isset($balp_label) && strpos($folder, $balp_label) === 0) {
            $delimiter = $_SESSION['imap_delimiter'];
            $osDelim = driver_mel::gi()->objectShareDelimiter();
            $data = explode($delimiter, $folder, 3);
            $_objects = driver_mel::gi()->getUser()->getObjectsShared();
            if (count($_objects) >= 1 && isset($_objects[$this->rc->get_user_name() . $osDelim . $data[1]])) {
                $_object = $_objects[$this->rc->get_user_name() . $osDelim . $data[1]];
                if (isset($_object->mailbox) && $_object->mailbox->uid == $data[1]) {
                    $mailbox = $_object->mailbox;
                    // Récupération de la configuration de la boite pour l'affichage
                    $ret = [
                        'user' => $_object->uid,
                        'host' => driver_mel::gi()->getRoutage($mailbox),
                    ];
                    $this->get_account = urlencode($ret['user']) . '@' . $ret['host'];
                    $this->mel->set_account($this->get_account);
                }
            }
        }
        return $ret;
    }

    /**
     * Connect to sieve server
     * Utilise les identifiants de la balp si nécessaire
     */
    public function managesieve_connect($args) {
        /* PAMELA - Gestion des boites partagées */
        if (!empty($this->get_account)) {
            if (mel_logs::is(mel_logs::DEBUG))
                mel_logs::gi()->l(mel_logs::DEBUG, "mel::managesieve_connect()");
            $args['user'] = $this->mel->get_user_bal();
            // Ajouter également l'host pour les règles sieve
            $args['host'] = $this->mel->get_host();
        }
        else if (isset($_GET['_mbox'])) {
            $folder = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET);
            $balp_label = driver_mel::gi()->getBalpLabel();
            if (isset($balp_label) && strpos($folder, $balp_label) === 0) {
                $delimiter = $_SESSION['imap_delimiter'];
                $osDelim = driver_mel::gi()->objectShareDelimiter();
                $data = explode($delimiter, $folder, 3);
                $_objects = driver_mel::gi()->getUser()->getObjectsShared();
                if (count($_objects) >= 1 && isset($_objects[$this->rc->get_user_name() . $osDelim . $data[1]])) {
                    $_object = $_objects[$this->rc->get_user_name() . $osDelim . $data[1]];
                    if (isset($_object->mailbox) && $_object->mailbox->uid == $data[1]) {
                        $mailbox = $_object->mailbox;
                        // Récupération de la configuration de la boite pour l'affichage
                        $args['user'] = $_object->uid;
                        $args['host'] = driver_mel::gi()->getRoutage($mailbox);
                    }
                }
            }
        }
        return $args;
    }

    /**
     * Select the good identity
     * Lors de l'écriture d'un mail, l'identité liée à la boite mail est sélectionnée
     */
    public function identity_select($args) {
        if (mel_logs::is(mel_logs::DEBUG))
            mel_logs::gi()->l(mel_logs::DEBUG, "mel::identity_select()");

        // Gestion de l'identité par défaut en fonction de l'account
        if ($this->rc->task == "mail" && $this->rc->action == "compose") {
            // Parcour les identités pour définir celle par défaut
            foreach ($args['identities'] as $key => $identity) {
                if ($identity['uid'] == $this->mel->get_share_objet()) {
                    $args['selected'] = $key;
                    break;
                }
            }
        }
        return $args;
    }

    /**
     * Check recent BALP Inbox folders list
     *
     * @param array $args
     */
    public function check_recent($args) {
        if (in_array('INBOX', $args['folders'])) {
            // Récupération des préférences de l'utilisateur
            $hidden_mailboxes = $this->rc->config->get('hidden_mailboxes', []);
            $_objects = driver_mel::gi()->getUser()->getObjectsShared();
            if (count($_objects) >= 1) {
                foreach ($_objects as $_object) {
                    if (isset($hidden_mailboxes[$_object->uid])) {
                        continue;
                    }
                    if (isset($_object->mailbox)) {
                        $mailbox = $_object->mailbox;
                        // Ne lister que les bal qui ont l'accès internet activé si l'accés se fait depuis Internet
                        $mailbox->load(['internet_access_enable']);
                        if (!mel::is_internal() && !$mailbox->internet_access_enable) {
                            continue;
                        }
                        $args['folders'][] = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $mailbox->uid;
                    }
                }
            }
            // Ajout des 5 derniers dossiers visités
            $i = 1;
            $folders = array_reverse($_SESSION['folders'], true);
            foreach ($folders as $folder => $status) {
                if (!in_array($folder, $args['folders'])) {
                    $args['folders'][] = $folder;
                    $i++;
                    if ($i == 5) {
                        break;
                    }
                }
            }
            // Tri par boite
            usort($args['folders'], function($a, $b) {
                if (strpos($a, driver_mel::gi()->getBalpLabel()) === 0) {
                    if (strpos($b, driver_mel::gi()->getBalpLabel()) === 0) {
                        return ($a < $b) ? -1 : 1;
                    }
                    else {
                        return 1;
                    }
                }
                else if (strpos($b, driver_mel::gi()->getBalpLabel()) === 0) {
                    return -1;
                }
                else {
                    return ($a < $b) ? -1 : 1;
                }
            });
        }
        return $args;
    }

    /**
     * Messages list header for Corbeille mbox
     *
     * @param array $args
     */
    public function messages_list($args) {
        if ($this->rc->storage->get_folder() == driver_mel::gi()->getMboxTrash()) {
            $trash_mbox = $this->rc->config->get('trash_mbox');
            if ($trash_mbox != driver_mel::gi()->getMboxTrash()) {
                foreach ($args['messages'] as $key => $message) {
                    if ($args['messages'][$key]->folder == driver_mel::gi()->getMboxTrash()) {
                        $args['messages'][$key]->folder = $trash_mbox;
                    }
                }
                $this->rc->output->set_env('mailbox', $trash_mbox);
            }
        }
        return $args;
    }

    /**
     * Modify the user configuration to adapt to mobile skin
     *
     * @param array $args
     */
    public function config_get($args) {
        switch ($args['name']) {
            case 'sent_mbox':
                $sent_mbox = $args['result'];
                if (!empty($args['result']) && !empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    if ($sent_mbox == 'INBOX') {
                        $sent_mbox = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal();
                    }
                    else {
                        $sent_mbox = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal() . $_SESSION['imap_delimiter'] . $sent_mbox;
                    }
                }
                $args['result'] = $sent_mbox;
                break;
            case 'drafts_mbox':
                $drafts_mbox = $args['result'];
                if (!empty($args['result']) && !empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    $drafts_mbox = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal() . $_SESSION['imap_delimiter'] . $drafts_mbox;
                }
                else if (!empty($args['result']) && isset($_POST['_store_target']) && strpos($_POST['_store_target'], driver_mel::gi()->getBalpLabel()) === 0) {
                    $_target = explode($_SESSION['imap_delimiter'], rcube_utils::get_input_value('_store_target', rcube_utils::INPUT_POST), 3);
                    $drafts_mbox = implode($_SESSION['imap_delimiter'], [$_target[0], $_target[1], $drafts_mbox]);
                }
                $args['result'] = $drafts_mbox;
                break;
            case 'junk_mbox':
                $junk_mbox = $args['result'];
                if (!empty($args['result']) && !empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    $junk_mbox = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal() . $_SESSION['imap_delimiter'] . $junk_mbox;
                }
                $args['result'] = $junk_mbox;
                break;
            case 'trash_mbox':
                $trash_mbox = $args['result'];
                if (!empty($args['result']) && !empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    $trash_mbox = $_SESSION['trash_folders'][$this->mel->get_user_bal()];
                }
                else if (!empty($args['result']) && isset($_POST['_mbox']) && strpos($_POST['_mbox'], driver_mel::gi()->getBalpLabel()) === 0) {
                    $tmp = explode($_SESSION['imap_delimiter'], rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST));
                    if (isset($_SESSION['trash_folders'][$tmp[1]])) {
                        $trash_mbox = $_SESSION['trash_folders'][$tmp[1]];
                    }
                }
                $args['result'] = $trash_mbox;
                break;
            case 'models_mbox':
                $models_mbox = rcube_charset::convert($args['result'], RCUBE_CHARSET, 'UTF7-IMAP');
                if (!empty($args['result']) && !empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    $models_mbox = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal() . $_SESSION['imap_delimiter'] . $models_mbox;
                }
                $args['result'] = $models_mbox;
                break;
        }
        return $args;
    }

    /**
     * Is current mbox is Inbox for BALP
     *
     * @param array $args
     */
    public function is_inbox($args) {
        if (!$args['isInbox'] && strpos($args['mbox'], driver_mel::gi()->getBalpLabel()) === 0) {
            $exp = explode($_SESSION['imap_delimiter'], $args['mbox']);
            $args['isInbox'] = count($exp) === 2;
            if (!$args['isInbox'] && isset($args['smart']) && $args['smart']) {
                $args['isInbox'] = $args['mbox'] != $this->rc->config->get('sent_mbox') && $args['mbox'] != $this->rc->config->get('drafts_mbox');
            }
        }
        return $args;
    }

    /**
     * Move message from folder to folder or mailboxe to mailboxe
     *
     * @param array $args
     */
    public function move_message($args) {
        $mbox  = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST, true);
        if (isset($mbox)) {
            if (strpos($args['target'], driver_mel::gi()->getBalpLabel()) === 0 && strpos($mbox, driver_mel::gi()->getBalpLabel()) === 0) {
                $targetTmp = explode($_SESSION['imap_delimiter'], $args['target'], 3);
                $mboxTmp = explode($_SESSION['imap_delimiter'], $mbox, 3);
                $args['continue'] = $targetTmp[1] == $mboxTmp[1];
            }
            else if (strpos($args['target'], driver_mel::gi()->getBalpLabel()) === 0 || strpos($mbox, driver_mel::gi()->getBalpLabel()) === 0) {
                $args['continue'] = false;
            }
            if (!$args['continue']) {
                $messages = [];
                $storages = [];
                $args['success'] = false;
                // Move from mailboxe to mailboxe
                foreach (rcmail::get_uids(null, null, $multifolder, rcube_utils::INPUT_POST) as $mbox => $uids) {
                    if ($mbox === $args['target']) {
                        $args['count'] += is_array($uids) ? count($uids) : 1;
                    }
                    else {
                        // Récupérer l'eml et l'envoyer sur l'autre dossier
                        $this->rc->storage->set_folder($mbox);
                        $messages[$mbox] = [];
                        foreach ($uids as $uid) {
                            $messages[$mbox][$uid] = $this->rc->storage->get_raw_body($uid);
                        }
                        $storages[$mbox] = clone $this->rc->storage;
                        $storages[$mbox]->conn = clone $this->rc->storage->conn;
                    }
                }
                // Envoyer les eml vers la target
                $this->rc->storage->set_folder($args['target']);
                $this->rc->storage->connect($_SESSION['storage_host'], 
                    $_SESSION['username'], 
                    $this->rc->decrypt($_SESSION['password']), 
                    $_SESSION['storage_port'], 
                    $_SESSION['storage_ssl']);

                foreach ($messages as $mbox => $list) {
                    foreach ($list as $uid => $item) {
                        if ($this->rc->storage->save_message($args['target'], $item)) {
                            $storages[$mbox]->delete_message($uid, $mbox);
                            $args['count']++;
                            $args['success'] = true;
                        }
                    }
                }
                unset($storages);
                unset($messages);
            }
        }
        if (strpos($args['target'], driver_mel::gi()->getBalpLabel()) === 0 && strpos($args['target'], driver_mel::gi()->getMboxTrash() . '-individuelle') !== false) {
            $args['target'] = driver_mel::gi()->getMboxTrash();
        }
        return $args;
    }

    /**
     * Copy message from folder to folder or mailboxe to mailboxe
     *
     * @param array $args
     */
    public function copy_message($args) {
        $mbox  = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_POST, true);
        if (isset($mbox)) {
            if (strpos($args['target'], driver_mel::gi()->getBalpLabel()) === 0 && strpos($mbox, driver_mel::gi()->getBalpLabel()) === 0) {
                $targetTmp = explode($_SESSION['imap_delimiter'], $args['target'], 3);
                $mboxTmp = explode($_SESSION['imap_delimiter'], $mbox, 3);
                $args['continue'] = $targetTmp[1] == $mboxTmp[1];
            }
            else if (strpos($args['target'], driver_mel::gi()->getBalpLabel()) === 0 || strpos($mbox, driver_mel::gi()->getBalpLabel()) === 0) {
                $args['continue'] = false;
            }
            if (!$args['continue']) {
                $messages = [];
                // Copy from mailboxe to mailboxe
                foreach (rcmail::get_uids(null, null, $multifolder, rcube_utils::INPUT_POST) as $mbox => $uids) {
                    if ($mbox === $args['target']) {
                        $args['copied']++;
                    }
                    else {
                        // Récupérer l'eml et l'envoyer sur l'autre dossier
                        $this->rc->storage->set_folder($mbox);
                        foreach ($uids as $uid) {
                            $messages[$uid] = $this->rc->storage->get_raw_body($uid);
                        }
                        $args['sources'][] = $mbox;
                    }
                }
                // Envoyer les eml vers la target
                $this->rc->storage->set_folder($args['target']);
                $this->rc->storage->connect($_SESSION['storage_host'], 
                    $_SESSION['username'], 
                    $this->rc->decrypt($_SESSION['password']), 
                    $_SESSION['storage_port'], 
                    $_SESSION['storage_ssl']);

                foreach ($messages as $uid => $message) {
                    if ($this->rc->storage->save_message($args['target'], $message)) {
                        $args['copied']++;
                    }
                }
                unset($messages);
            }
        }
        if (strpos($args['target'], driver_mel::gi()->getBalpLabel()) === 0 && strpos($args['target'], driver_mel::gi()->getMboxTrash() . '-individuelle') !== false) {
            $args['target'] = driver_mel::gi()->getMboxTrash();
        }
        return $args;
    }

    /**
     * Render mailboxlist
     *
     * @param array $args
     */
    public function render_mailboxlist($args) {
        $display = $this->rc->config->get('mailboxes_display', 'default');
        if ($display == 'unified') {
            $_folders = [];
            foreach ($this->rc->config->get('default_folders', 
                    [   'INBOX',
                        'sent',
                        'drafts',
                        'models',
                        'junk',
                        'trash']) as $default_folder) {
                $folder_mbox = $this->rc->config->get($default_folder.'_mbox');
                if ($folder_mbox == 'INBOX' && $default_folder != 'INBOX') {
                    continue;
                }
                $folder = [
                    'id'        => 'virtual'. $default_folder,
                    'class'     => $default_folder,
                    'name'      => $this->rc->gettext(strtolower($default_folder)),
                    'virtual'   => true,
                    'folders'   => [],
                ];

                foreach ($args['list'] as $mailbox => $folders) {
                    if ($default_folder == 'INBOX') {
                        if ($mailbox == $this->rc->user->get_username()) {
                            $key = 'INBOX';
                        }
                        else {
                            foreach ($folders['folders'] as $key => $f) {
                                break;
                            }
                        }
                    }
                    else if ($default_folder == 'trash') {
                        if ($mailbox == $this->rc->user->get_username()) {
                            $key = $folder_mbox;
                        }
                        else if (isset($folders['folders'][$folder_mbox])) {
                            $key = $folder_mbox;
                        }
                        else if (isset($folders['folders'][$folder_mbox.'-individuelle'])) {
                            $key = $folder_mbox.'-individuelle';
                        }
                    }
                    else {
                        $key = $folder_mbox;
                    }
                    if (!isset($folders['folders'][$key])) {
                        continue;
                    }
                    $folder['folders'][$mailbox.$default_folder] = $folders['folders'][$key];
                    $folder['folders'][$mailbox.$default_folder]['name'] = $folders['name'];
                    $folder['folders'][$mailbox.$default_folder]['realname'] = true;
                    unset($args['list'][$mailbox]['folders'][$key]);
                }
                $_folders['virtual'. $default_folder] = $folder;
            }
            $args['list'] = array_merge($_folders, $args['list']);
        }
        return $args;
    }

    /**
     * Handler for user preferences form (preferences_list hook)
     */
    function prefs_list($args) {
        if ($args['section'] == 'mailbox') {
            // Check that configuration is not disabled
            $dont_override = (array)$this->rc->config->get('dont_override', array());

            $key = 'mel_mailboxes_display';
            if (!in_array($key, $dont_override)) {
                $config_key = 'mailboxes_display';
                $field_id = "_" . $key;
                $value = $this->rc->config->get($config_key, 'mail');
                $input = new html_select(array(
                    'name' => $field_id,
                    'id' => $field_id,
                ));
                foreach (['default', 'subfolders', 'unified'] as $type) {
                    $input->add($this->rc->gettext($type.'_pref_text', 'mel'), $type);
                }

                $args['blocks']['main']['options'][$key] = array(
                    'title' => html::label($field_id, rcube::Q($this->rc->gettext($key, 'mel'))),
                    'content' => $input->show($value),
                );
            }
        }
        return $args;
    }

    /**
     * Handler for user preferences save (preferences_save hook)
     */
    public function prefs_save($args) {
        if ($args['section'] == 'mailbox') {
            // Check that configuration is not disabled
            $dont_override = ( array ) $this->rc->config->get('dont_override', array());
            $key = 'mel_mailboxes_display';
            if (!in_array($key, $dont_override)) {
                $config_key = 'mailboxes_display';
                $args['prefs'][$config_key] = rcube_utils::get_input_value('_' . $key, rcube_utils::INPUT_POST);
            }
        }
        return $args;
    }

    /**
     * Change folder name for Corbeille individuelle
     *
     * @param array $args
     */
    public function set_folder_name($args) {
        if (strpos($args['folder'], driver_mel::gi()->getBalpLabel()) === 0 && strpos($args['folder'], driver_mel::gi()->getMboxTrash() . '-individuelle') !== false) {
            $args['folder'] = driver_mel::gi()->getMboxTrash();
        }
        if (isset($this->prev_folder) && $this->prev_folder != $args['folder']) {
            $relog = false;
            if (strpos($args['folder'], driver_mel::gi()->getBalpLabel()) === 0 && strpos($this->prev_folder, driver_mel::gi()->getBalpLabel()) === 0) {
                $folderTmp = explode($_SESSION['imap_delimiter'], $args['folder'], 3);
                $prevFolderTmp = explode($_SESSION['imap_delimiter'], $this->prev_folder, 3);
                $relog = $folderTmp[1] != $prevFolderTmp[1];
            }
            else if (strpos($args['folder'], driver_mel::gi()->getBalpLabel()) === 0 || strpos($this->prev_folder, driver_mel::gi()->getBalpLabel()) === 0) {
                $relog = true;
            }
            if ($relog) {
                $this->prev_folder = $args['folder'];
                $this->get_account = null;
                $this->rc->storage->set_folder($args['folder']);
                $this->rc->storage->connect($_SESSION['storage_host'], 
                    $_SESSION['username'], 
                    $this->rc->decrypt($_SESSION['password']), 
                    $_SESSION['storage_port'], 
                    $_SESSION['storage_ssl']);
            }
        }
        $this->prev_folder = $args['folder'];
        return $args;
    }

    /**
     * Change folder name for Corbeille individuelle
     *
     * @param array $args
     */
    public function folder_cache($args) {
        if ($args['folder'] == driver_mel::gi()->getMboxTrash()) {
            $args['folder'] = $this->rc->config->get('trash_mbox');
        }
        return $args;
    }

    /**
     * Connect to smtp
     * Stock l'identité utilisé avant que le message soit envoyé
     * Utilisé pour la connexion smtp
     */
    public function message_before_send($args) {
        if (mel_logs::is(mel_logs::DEBUG))
            mel_logs::gi()->l(mel_logs::DEBUG, "mel::message_before_send()");

        $_SESSION['m2_from_identity'] = $args['from'];
        $_SESSION['m2_uid_identity'] = null;
        // Parcour les identités pour réécrire le from avec le realname
        $identities = $this->rc->user->list_identities();
        $headers = [];
        $found = false;
        foreach ($identities as $identity) {
            if (strtolower($args['from']) == strtolower($identity['email'])) {
                $found = true; 
                $_SESSION['m2_uid_identity'] = $identity['uid'];
                if (isset($args['message']->_headers['From'])) {
                    // Si on retrouve l'identité on met à jour le From des headers pour formatter avec le realname
                    $headers['From'] = '"' . $identity['realname'] . '" <' . $identity['email'] . '>';
                    break;
                }
            }
        }
        if (!empty($headers)) {
            $headers = driver_mel::gi()->setHeadersMessageBeforeSend($headers);
            $args['message']->headers($headers, true);
        }
        if (!$found) {
            $args['abort'] = true;
        }
        return $args;
    }

    /**
     * Return folders list in HTML
     *
     * @param array $attrib Named parameters
     *
     * @return string HTML code for the gui object
     */
    public function folder_list($attrib)
    {
        static $a_mailboxes;

        $attrib += array('maxlength' => 100, 'realnames' => false, 'unreadwrap' => ' (%s)');

        $type = $attrib['type'] ? $attrib['type'] : 'ul';
        unset($attrib['type']);

        if ($type == 'ul' && !$attrib['id']) {
            $attrib['id'] = 'rcmboxlist';
        }

        if (empty($attrib['folder_name'])) {
            $attrib['folder_name'] = '*';
        }

        // get current folder
        $storage   = $this->rc->get_storage();
        $mbox_name = $storage->get_folder();

        // build the folders tree
        if (empty($a_mailboxes)) {
            // Récupération des préférences de l'utilisateur
            $hidden_mailboxes = $this->rc->config->get('hidden_mailboxes', array());
            $sort_bal = $this->rc->config->get('sort_bal', []);

            $delimiter = $storage->get_hierarchy_delimiter();
            $a_mailboxes = array();
            $env_mailboxes = array();
            $folders = array();

            if (!isset($hidden_mailboxes[$this->rc->get_user_name()])) {
                // Gestion du order
                $order = array_search(driver_mel::gi()->mceToRcId($this->rc->get_user_name()), $sort_bal);
                if ($order === false) {
                    $order = 1000;
                }

                // get mailbox list
                $a_folders = $storage->list_folders_subscribed(
                    '', $attrib['folder_name'], $attrib['folder_filter']);

                foreach ($a_folders as $folder) {
                    $this->rc->build_folder_tree($folders, $folder, $delimiter);
                }

                $a_mailboxes[$this->rc->get_user_name()] = [ 
                    'id'        => $this->rc->get_user_name(),
                    'name'      => driver_mel::gi()->getUser()->fullname,
                    'virtual'   => true,
                    'class'     => 'container',
                    'realname'  => true,
                    'order'     => $order,
                    'folders'   => $this->render_sharedmailboxlist($folders, $this->rc->get_user_name(), $delimiter, false),
                ];
            }

            // Parcourir toutes les boites partagées de l'utilisateur
            $_SESSION['trash_folders'];
            $_objects = driver_mel::gi()->getUser()->getObjectsShared();
            if (count($_objects) >= 1) {
                foreach ($_objects as $_object) {
                    if (isset($hidden_mailboxes[$_object->uid])) {
                        continue;
                    }
                    // Gestion du order
                    $order = array_search(driver_mel::gi()->mceToRcId($_object->uid), $sort_bal);
                    if ($order === false) {
                        $order = 2000;
                    }
                    $mailbox = $_object;
                    if (isset($_object->mailbox)) {
                        $mailbox = $_object->mailbox;
                        // Ne lister que les bal qui ont l'accès internet activé si l'accés se fait depuis Internet
                        $mailbox->load(['internet_access_enable']);
                        if (!mel::is_internal() && !$mailbox->internet_access_enable) {
                            continue;
                        }
                        // Récupération de la configuration de la boite pour l'affichage
                        $hostname = driver_mel::gi()->getRoutage($mailbox);
                        // Environnement
                        $env_mailboxes[$mailbox->uid] = $_object->uid . '@' . $hostname;
                    }

                    if ($storage->connect($hostname, 
                                $_object->uid, 
                                $this->rc->decrypt($_SESSION['password']), 
                                $_SESSION['storage_port'], 
                                $_SESSION['storage_ssl'])) {
                        // Gestion du cache des folders
                        $this->mel->set_account(urlencode($_object->uid) . '@' . $hostname);
                        // get mailbox list
                        $a_folders = $storage->list_folders_subscribed(
                            '', $attrib['folder_name'], $attrib['folder_filter']);

                        $folders = array();

                        foreach ($a_folders as $folder) {
                            // if ($folder == 'INBOX' || $folder == 'Corbeille' || $folder == driver_mel::gi()->getBalpLabel()) {
                            //     continue;
                            // }
                            $this->rc->build_folder_tree($folders, $folder, $delimiter);
                        }

                        $a_mailboxes[$_object->uid] = [ 
                            'id'        => $_object->uid,
                            'name'      => $mailbox->fullname,
                            'class'     => 'container',
                            'realname'  => true,
                            'virtual'   => true,
                            'order'     => $order,
                            'folders'   => $this->render_sharedmailboxlist($folders, $mailbox->uid, $delimiter),
                        ];
                    }
                }
                $this->mel->get_account = mel::get_account();
            }
            // Env
            $this->rc->output->set_env('balp_label', driver_mel::gi()->getBalpLabel());
            $this->rc->output->set_env('sharedmailboxes', $env_mailboxes);
            
            // trier la liste
            uasort($a_mailboxes, function ($a, $b) {
                if ($a['order'] === $b['order'])
                    return strcmp(strtolower($a['name']), strtolower($b['name']));
                else
                    return strnatcmp($a['order'], $b['order']);
            });
        }

        // allow plugins to alter the folder tree or to localize folder names
        $hook = $this->rc->plugins->exec_hook('render_mailboxlist', array(
            'list'      => $a_mailboxes,
            'delimiter' => $delimiter,
            'type'      => $type,
            'attribs'   => $attrib,
        ));

        $a_mailboxes = $hook['list'];
        $attrib      = $hook['attribs'];

        if ($type == 'select') {
            $attrib['is_escaped'] = true;
            $select = new html_select($attrib);

            // add no-selection option
            if ($attrib['noselection']) {
                $select->add(html::quote($this->rc->gettext($attrib['noselection'])), '');
            }

            $this->rc->render_folder_tree_select($a_mailboxes, $mbox_name, $attrib['maxlength'], $select, $attrib['realnames']);
            $out = $select->show($attrib['default']);
        }
        else {
            $js_mailboxlist = array();
            $tree = $this->rc->render_folder_tree_html($a_mailboxes, $mbox_name, $js_mailboxlist, $attrib);

            if ($type != 'js') {
                $out = html::tag('ul', $attrib, $tree, html::$common_attrib);

                $this->rc->output->include_script('treelist.js');
                $this->rc->output->add_gui_object('mailboxlist', $attrib['id']);
                $this->rc->output->set_env('unreadwrap', $attrib['unreadwrap']);
                $this->rc->output->set_env('collapsed_folders', (string) $this->rc->config->get('collapsed_folders'));
            }

            $this->rc->output->set_env('mailboxes', $js_mailboxlist);

            // we can't use object keys in javascript because they are unordered
            // we need sorted folders list for folder-selector widget
            $this->rc->output->set_env('mailboxes_list', array_keys($js_mailboxlist));
        }

        // add some labels to client
        $this->rc->output->add_label('purgefolderconfirm', 'deletemessagesconfirm');

        return $out;
    }

    /**
     * Gestion de l'affichage des boites mails
     *
     * @param array $list
     * @return array
     */
    private function render_sharedmailboxlist($list, $mailbox, $delimiter, $is_balp = true) {
        if (mel_logs::is(mel_logs::DEBUG)) {
            mel_logs::gi()->l(mel_logs::DEBUG, "mel_sharedmailboxes_imap::render_sharedmailboxlist()");
        }
        // On est sur une balp
        $driver_mel = driver_mel::gi();

        if ($is_balp) {
            // Gestion des boites partagées
            $balp_label = $driver_mel->getBalpLabel();
            if (isset($balp_label)) {
                unset($list['INBOX']);
                $folders = $list[$balp_label]['folders'];
                // Gestion de l'INBOX
                $folders[$mailbox]['class'] = 'INBOX';
                $subfolders = $folders[$mailbox]['folders'];
                $folders[$mailbox]['folders'] = [];
                // Merge les subfolders directement à la racine
                $folders = array_merge($folders, $subfolders);
            }
        }
        else {
            // Gestion de la boite individuelle
            $folders = $list;
        }

        $_folders = [];
        foreach ($this->rc->config->get('default_folders', 
                [   'INBOX',
                    'sent',
                    'drafts',
                    'models',
                    'junk',
                    'trash']) as $default_folder) {
            if ($default_folder == 'INBOX') {
                if ($is_balp) {
                    $folder = $mailbox;
                }
                else {
                    $folder = 'INBOX';
                }
            }
            else if ($default_folder == 'trash' && $is_balp) {
                $folder = $this->rc->config->get($default_folder.'_mbox');
                if (!isset($folders[$folder]) && isset($list[$folder])) {
                    $trash_mbox_indiv = $folder . '-individuelle';
                    $folders[$trash_mbox_indiv] = $list[$folder];
                    $folders[$trash_mbox_indiv]['id'] = $balp_label . $delimiter . $mailbox . $delimiter . $trash_mbox_indiv;
                    $folders[$trash_mbox_indiv]['class'] = $folder;
                    $_folders[$trash_mbox_indiv] = $folders[$trash_mbox_indiv];
                    unset($folders[$trash_mbox_indiv]);
                    $_SESSION['trash_folders'][$mailbox] = $balp_label . $delimiter . $mailbox . $delimiter . $trash_mbox_indiv;
                }
                else if (isset($folders[$folder])) {
                    $folders[$folder]['class'] = $folder;
                    $_folders[$folder] = $folders[$folder];
                    unset($folders[$folder]);
                    $_SESSION['trash_folders'][$mailbox] = $balp_label . $delimiter . $mailbox . $delimiter . $folder;
                }
                continue;
            }
            else {
                $folder = $this->rc->config->get($default_folder.'_mbox');
                if ($folder == 'INBOX') {
                    continue;
                }
                $folders[$folder]['class'] = $folder;
            }
            $_folders[$folder] = $folders[$folder];
            unset($folders[$folder]);
        }

        $display = $this->rc->config->get('mailboxes_display', 'default');
        if ($display == 'default' || $display == 'unified') {
            $_folders = array_merge($_folders, $folders);
        }
        else if ($display == 'subfolders') {
            $_folders['subfolders'] = [
                'id'        => $is_balp ? $balp_label . $delimiter . $mailbox . $delimiter . 'subfolders' : 'subfolders',
                'name'      => $this->rc->gettext('mel.subfolders'),
                'virtual'   => true,
                'folders'   => $folders,
            ];
        }
        return $_folders;
    }

    /**
     * Association entre les identités Roundcube et les bal MCE
     * Retourne le résultat en env
     */
    private function assoc_identity_bal() {
        $result = array();
        $identities = $this->rc->user->list_identities();
        // Gestion du dossier courant pour l'account
        if (strpos($_SESSION['mbox'], driver_mel::gi()->getBalpLabel()) === 0) {
            $tmp = explode($_SESSION['imap_delimiter'], $_SESSION['mbox'], 3);
            $account = $tmp[1];
        }
        // Lister les boites auxquelles l'utilisateur a accés
        $mailboxes = array_merge([driver_mel::gi()->getUser()], driver_mel::gi()->getUser()->getObjectsSharedEmission());

        foreach ($identities as $id) {
            foreach ($mailboxes as $mailbox) {
                if (isset($mailbox->email_send) && !empty($mailbox->email_send)) {
                    $mail = $mailbox->email_send;
                }
                else if (isset($mailbox->email_send_list) && !empty($mailbox->email_send_list)) {
                    $mail = $mailbox->email_send_list[0];
                }
                else {
                    continue;
                }
                
                if (strcasecmp(strtolower($mail), strtolower($id['email'])) === 0) {
                    $uid = $mailbox->uid;
                    if ($mailbox instanceof \LibMelanie\Api\Defaut\ObjectShare) {
                        $hostname = driver_mel::gi()->getRoutage($mailbox->mailbox);
                        if (isset($account) && $account == $mailbox->mailbox->uid) {
                            $this->get_account = urlencode($uid) . "@" . $hostname;
                            $this->mel->set_account($this->get_account);
                        }
                    }
                    if (isset($hostname)) {
                        $uid = urlencode(urlencode($uid) . "@" . $hostname);
                    }
                    $result[$id['identity_id']] = $uid;
                }
            }
        }
        $this->rc->output->set_env('identities_to_bal', $result);
    }

    /**
     * Modification des folders par défaut dans les préférences
     */
    private function set_compose_sent_folder() {
        // Gestion du folder sent
        $COMPOSE_ID   = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GET);
        $COMPOSE      = null;

        if ($COMPOSE_ID && $_SESSION['compose_data_'.$COMPOSE_ID])
            $COMPOSE =& $_SESSION['compose_data_'.$COMPOSE_ID];

        if (isset($COMPOSE)) {
            $_SESSION['compose_data_'.$COMPOSE_ID]['param']['sent_mbox'] = $this->rc->config->get('sent_mbox');
        }
    }
}