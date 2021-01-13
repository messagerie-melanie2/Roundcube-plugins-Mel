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
        $this->add_hook('identity_select',      array($this, 'identity_select'));
        $this->add_hook('message_before_send',  array($this, 'message_before_send'));
        $this->add_hook('check_recent',         array($this, 'check_recent'));
        $this->add_hook('messages_list',        array($this, 'messages_list'));

        $this->add_hook('config_get',           array($this, 'config_get'));

        $this->add_hook('mel_is_inbox',         array($this, 'is_inbox'));
        $this->add_hook('mel_target_folder',    array($this, 'target_folder'));
        $this->add_hook('mel_folder_cache',     array($this, 'folder_cache'));
        $this->add_hook('m2_set_folder_name',   array($this, 'set_folder_name'));

        // MANTIS 0004276: Reponse avec sa bali depuis une balp, quels "Elements envoyés" utiliser
        if ($this->rc->task == 'mail') {
            $this->register_action('plugin.refresh_store_target_selection', array($this,'refresh_store_target_selection'));
        }

        // Chargement de l'account passé en Get
        $this->get_account = mel::get_account();
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
                
                $balp_label = driver_mel::gi()->getBalpLabel();
                if (isset($balp_label) && strpos($folder, $balp_label) === 0) {
                    $delim = $_SESSION['imap_delimiter'];
                    $osDelim = driver_mel::gi()->objectShareDelimiter();
                    $data = explode($delim, $folder, 3);
                    $_objects = driver_mel::gi()->getUser()->getObjectsShared();
                    if (count($_objects) >= 1 && isset($_objects[$this->rc->get_user_name() . $osDelim . $data[1]])) {
                        $_object = $_objects[$this->rc->get_user_name() . $osDelim . $data[1]];
                        if (isset($_object->mailbox) && $_object->mailbox->uid == $data[1]) {
                            $mailbox = $_object->mailbox;
                            // Récupération de la configuration de la boite pour l'affichage
                            $args['user'] = $_object->uid;
                            $args['host'] = driver_mel::gi()->getRoutage($mailbox);
                            $this->get_account = urlencode($args['user']) . '@' . $args['host'];
                            $this->mel->set_account($this->get_account);
                        }
                    }

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
                if (!empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
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
                if (!empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    $drafts_mbox = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal() . $_SESSION['imap_delimiter'] . $drafts_mbox;
                }
                else if (isset($_POST['_store_target']) && strpos($_POST['_store_target'], driver_mel::gi()->getBalpLabel()) === 0) {
                    $_target = explode($_SESSION['imap_delimiter'], rcube_utils::get_input_value('_store_target', rcube_utils::INPUT_POST), 3);
                    $drafts_mbox = implode($_SESSION['imap_delimiter'], [$_target[0], $_target[1], $drafts_mbox]);
                }
                $args['result'] = $drafts_mbox;
                break;
            case 'junk_mbox':
                $junk_mbox = $args['result'];
                if (!empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    $junk_mbox = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal() . $_SESSION['imap_delimiter'] . $junk_mbox;
                }
                $args['result'] = $junk_mbox;
                break;
            case 'trash_mbox':
                $trash_mbox = $args['result'];
                if (!empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    $trash_mbox = $_SESSION['trash_folders'][$this->mel->get_user_bal()];
                }
                $args['result'] = $trash_mbox;
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
     * Change target folder for Corbeille
     *
     * @param array $args
     */
    public function target_folder($args) {
        if (strpos($args['target'], driver_mel::gi()->getBalpLabel()) === 0 && strpos($args['target'], driver_mel::gi()->getMboxTrash() . '-individuelle') !== false) {
            $args['target'] = driver_mel::gi()->getMboxTrash();
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
        // else if ($args['folder'] == 'INBOX' && !empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
        //     $args['folder'] = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal();
        // }
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
                    'id' => $this->rc->get_user_name(),
                    'name' => driver_mel::gi()->getUser()->fullname,
                    'virtual' => true,
                    'order' => $order,
                    'folders' => $folders,
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
                            'id' => $_object->uid,
                            'name' => $mailbox->fullname,
                            'virtual' => true,
                            'order' => $order,
                            'folders' => $this->render_mailboxlist($folders, $mailbox->uid, $delimiter),
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
    private function render_mailboxlist($list, $balp_name, $delim) {
        if (mel_logs::is(mel_logs::DEBUG)) {
            mel_logs::gi()->l(mel_logs::DEBUG, "mel::render_mailboxlist()");
        }
        // On est sur une balp
        $driver_mel = driver_mel::gi();
        $balp_label = $driver_mel->getBalpLabel();
        if (isset($balp_label)) {
            unset($list['INBOX']);
            $folders = $list[$balp_label]['folders'];
            // Gestion de l'INBOX
            $folders[$balp_name]['class'] = 'INBOX';
            $subfolders = $folders[$balp_name]['folders'];
            $folders[$balp_name]['folders'] = [];
            // Merge les subfolders directement à la racine
            $folders = array_merge($folders, $subfolders);
            $result = [];
            $result[$balp_name] = $folders[$balp_name];
            unset($folders[$balp_name]);
            // Gestion des Brouillons
            $dratfs_mbox = $this->rc->config->get('drafts_mbox');
            if (isset($folders[$dratfs_mbox])) {
                $folders[$dratfs_mbox]['class'] = $dratfs_mbox;
                $result[$dratfs_mbox] = $folders[$dratfs_mbox];
                unset($folders[$dratfs_mbox]);
            }
            // Gestion des Elements envoyées
            $sent_mbox = $this->rc->config->get('sent_mbox');
            if (isset($folders[$sent_mbox]) && $sent_mbox != 'INBOX') {
                $folders[$sent_mbox]['class'] = $sent_mbox;
                $result[$sent_mbox] = $folders[$sent_mbox];
                unset($folders[$sent_mbox]);
            }
            // Gestion des Indésirables
            $junk_mbox = $this->rc->config->get('junk_mbox');
            if (isset($folders[$junk_mbox])) {
                $folders[$junk_mbox]['class'] = $junk_mbox;
                $result[$junk_mbox] = $folders[$junk_mbox];
                unset($folders[$junk_mbox]);
            }
            // Gestion de la corbeille individuelle et de la corbeille partagée
            $trash_mbox = $this->rc->config->get('trash_mbox');
            if (!isset($folders[$trash_mbox]) && isset($list[$trash_mbox])) {
                $trash_mbox_indiv = $trash_mbox . '-individuelle';
                $folders[$trash_mbox_indiv] = $list[$trash_mbox];
                $folders[$trash_mbox_indiv]['id'] = $balp_label . $delim . $balp_name . $delim . $trash_mbox_indiv;
                $folders[$trash_mbox_indiv]['class'] = $trash_mbox;
                $result[$trash_mbox_indiv] = $folders[$trash_mbox_indiv];
                unset($folders[$trash_mbox_indiv]);
                $_SESSION['trash_folders'][$balp_name] = $balp_label . $delim . $balp_name . $delim . $trash_mbox_indiv;
            }
            else if (isset($folders[$trash_mbox])) {
                $folders[$trash_mbox]['class'] = $trash_mbox;
                $result[$trash_mbox] = $folders[$trash_mbox];
                unset($folders[$trash_mbox]);
                $_SESSION['trash_folders'][$balp_name] = $balp_label . $delim . $balp_name . $delim . $trash_mbox;
            }
            $list = array_merge($result, $folders);
        }
        return $list;
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