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
        $this->add_hook('config_get', array($this,'config_get'));

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
                else {
                    $folder = $this->rc->storage->get_folder();
                }
                
                $balp_label = driver_mel::gi()->getBalpLabel();
                if (isset($balp_label) && strpos($folder, $balp_label) === 0) {
                    $delim = $this->rc->storage->get_hierarchy_delimiter();
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
                            // Gestion de la corbeille individuelle
                            if ($folder == $balp_label.$delim.$_object->mailbox->uid.$delim.driver_mel::gi()->getMboxTrash() . '-individuelle') {
                                $this->rc->storage->set_folder(driver_mel::gi()->getMboxTrash());
                            }
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
     * Modify the user configuration to adapt to mobile skin
     *
     * @param array $args
     */
    public function config_get($args) {
        switch ($args['name']) {
            case 'sent_mbox':
                $sent_mbox = $args['result'];
                if (!empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                    $sent_mbox = driver_mel::gi()->getBalpLabel() . $_SESSION['imap_delimiter'] . $this->mel->get_user_bal() . $_SESSION['imap_delimiter'] . $sent_mbox;
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
            if (isset($folders[$driver_mel->getMboxDraft()])) {
                $folders[$driver_mel->getMboxDraft()]['class'] = $driver_mel->getMboxDraft();
                $result[$driver_mel->getMboxDraft()] = $folders[$driver_mel->getMboxDraft()];
                unset($folders[$driver_mel->getMboxDraft()]);
            }
            // Gestion des Elements envoyées
            if (isset($folders[$driver_mel->getMboxSent()])) {
                $folders[$driver_mel->getMboxSent()]['class'] = $driver_mel->getMboxSent();
                $result[$driver_mel->getMboxSent()] = $folders[$driver_mel->getMboxSent()];
                unset($folders[$driver_mel->getMboxSent()]);
            }
            // Gestion des Indésirables
            if (isset($folders[$driver_mel->getMboxJunk()])) {
                $folders[$driver_mel->getMboxJunk()]['class'] = $driver_mel->getMboxJunk();
                $result[$driver_mel->getMboxJunk()] = $folders[$driver_mel->getMboxJunk()];
                unset($folders[$driver_mel->getMboxJunk()]);
            }
            // Gestion de la corbeille individuelle et de la corbeille partagée
            if (!isset($folders[$driver_mel->getMboxTrash()]) && isset($list[$driver_mel->getMboxTrash()])) {
                $folders[$driver_mel->getMboxTrash()] = $list[$driver_mel->getMboxTrash()];
                $folders[$driver_mel->getMboxTrash()]['id'] = $balp_label . $delim . $balp_name . $delim . $driver_mel->getMboxTrash() . '-individuelle';
                $folders[$driver_mel->getMboxTrash()]['class'] = $driver_mel->getMboxTrash();
                $result[$driver_mel->getMboxTrash()] = $folders[$driver_mel->getMboxTrash()];
                unset($folders[$driver_mel->getMboxTrash()]);
            }
            else if (isset($folders[$driver_mel->getMboxTrash()])) {
                $folders[$driver_mel->getMboxTrash()]['class'] = $driver_mel->getMboxTrash();
                $result[$driver_mel->getMboxTrash()] = $folders[$driver_mel->getMboxTrash()];
                unset($folders[$driver_mel->getMboxTrash()]);
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
            $driver_mel = driver_mel::gi();
            $balp_label = $driver_mel->getBalpLabel();
            $sent_mbox = $driver_mel->getMboxSent();

            /* PAMELA - Gestion des boites partagées */
            if (isset($balp_label) && !empty($this->get_account) && $this->get_account != $this->rc->user->get_username()) {
                $delimiter = $_SESSION['imap_delimiter'];
                $sent_mbox = isset($sent_mbox) ? $balp_label . $delimiter . $this->mel->get_user_bal() . $delimiter . $sent_mbox : null;
            }

            $_SESSION['compose_data_'.$COMPOSE_ID]['param']['sent_mbox'] = $sent_mbox;
        }
    }
}