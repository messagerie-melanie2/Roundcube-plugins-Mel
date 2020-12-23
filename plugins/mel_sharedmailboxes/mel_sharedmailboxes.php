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

class mel_sharedmailboxes extends rcube_plugin {
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
        $this->add_hook('managesieve_connect',  array($this, 'managesieve_connect'));
        $this->add_hook('message_before_send',  array($this, 'message_before_send'));
        $this->add_hook('identity_select',      array($this, 'identity_select'));
        $this->add_hook('render_mailboxlist',   array($this, 'render_mailboxlist'));
        $this->add_hook('folders_list',         array($this, 'folders_list'));
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
            if ($this->rc->action == 'compose') {
                $hidden_account = new html_hiddenfield(array('id' => '_compose_hidden_account', 'name' => '_account'));
                $this->api->add_content($hidden_account->show($this->get_account), 'composeoptions');
            }
        }

        // ajouter les boites partagées
        if ($this->api->output->type == 'html') {
            // Tableau pour la conf du chargement des boites partagées
            // task => [action => needs_gestionnaire ?]
            $list_tasks = [
                'mail' => [
                    '' => false,
                    'show' => false
                ],
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
                if ($user->is_objectshare) {
                    $username = $user->objectshare->user_uid;
                }
                else {
                    $user->load();
                    $username = $user->uid;
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
                if ($this->rc->task == 'mail') {
                    // First list of mailboxes list
                    $this->api->add_content(html::tag('ul', array(
                            "class" => "treelist listing folderlist sharesmailboxesul",
                            "id" => "sharesmailboxesul-first"
                    ), $content_first), 'folderlistheader-first');
                    // Last list of mailboxes list
                    $this->api->add_content(html::tag('ul', array(
                        "class" => "treelist listing folderlist sharesmailboxesul",
                        "id" => "sharesmailboxesul-last"
                    ), $content_last), 'folderlistheader-last');
                }
                elseif ($this->rc->task == 'settings') {
                    $this->api->add_content(html::tag('div', array(
                                "class" => "sharesmailboxeshide",
                                "id" => "sharesmailboxeslist-settings"
                        ), html::tag('ul', array(
                                "class" => "sharesmailboxesul",
                                "id" => "sharesmailboxesul"
                        ), $content)), 'folderlistheader-settings');
                }
                // Reset de la recherche en session
                $this->reset_session();
            }
        }
        // Modification de l'affichage des dossiers imap
        $this->set_defaults_folders();
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
            else {
                // MANTIS 3187: Erreur lorsque l'on charge la page de roundcube après être allé sur une boite partagée
                $balp_label = driver_mel::gi()->getBalpLabel();
                if (isset($balp_label) && strpos($_SESSION['mbox'], $balp_label) === 0) {
                    $_SESSION['mbox'] = 'INBOX';
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
     * ** IMAP ***
     */
    /**
     * Gestion de l'affichage des boites mails
     * Hook pour la gestion des boites partagées
     *
     * @param array $args
     * @return array
     */
    public function render_mailboxlist($args) {
        if (!empty($this->get_account)) {
            if (mel_logs::is(mel_logs::DEBUG)) {
                mel_logs::gi()->l(mel_logs::DEBUG, "mel::render_mailboxlist()");
            }
            if (driver_mel::gi()->getUser($this->mel->get_username(), false)->is_objectshare) {
                // On est sur une balp
                $balp_label = driver_mel::gi()->getBalpLabel();
                if (isset($balp_label)) {
                    $balp_name = $this->mel->get_user_bal();
                    $list = $args['list'];
                    foreach ($list as $key => $value) {
                        if ($key == 'INBOX') {
                            $list[$key]['id'] = $balp_label . $this->rc->get_storage()->delimiter . $balp_name;
                            $list[$key]['name'] = 'INBOX';
                            $list[$key]['class'] = 'INBOX';
                        }
                        else if ($key == $balp_label) {
                            if (isset($value['folders'][$balp_name])) {
                                $list = array_merge($list, $value['folders'][$balp_name]['folders']);
                                unset($list[$key]);
                            }
                        }
                        elseif ($key != 'Corbeille') {
                            unset($list[$key]);
                        }
                    }
                }
                $args['list'] = $list;
            }
        }
        return $args;
    }

    /**
     * Modification de la liste des dossiers
     * MANTIS 3934: Mauvaise présentation des dossiers
     *
     * @param array $args
     * @return array
     */
    public function folders_list($args) {
        if (!empty($this->get_account) && isset($args['list']['Corbeille'])) {
            $corbeille = $args['list']['Corbeille'];
            unset($args['list']['Corbeille']);
            $args['list']['Corbeille'] = $corbeille;
        }
        return $args;
    }

    /**
     * Réécriture du nom de dossier
     * Utilisé pour les boites partagées
     *
     * @param array $args
     * @return array
     */
    public function set_folder_name($args) {
        if (!empty($this->get_account)) {
            if (mel_logs::is(mel_logs::DEBUG)) {
                mel_logs::gi()->l(mel_logs::DEBUG, "mel::set_folder_name()");
            }
            if ($args['folder'] == 'INBOX' && driver_mel::gi()->getUser($this->mel->get_username(), false)->is_objectshare) {
                // On est sur une balp
                $balp_label = driver_mel::gi()->getBalpLabel();
                if (isset($balp_label)) {
                    $balp_name = $this->mel->get_user_bal();
                    $args['folder'] = $balp_label . $this->rc->get_storage()->delimiter . strtolower($balp_name);
                    // Change le mailbox d'environnement
                    $mbox = $this->rc->output->get_env('mailbox');
                    if ($mbox == 'INBOX') {
                        $this->rc->output->set_env('mailbox', $args['folder']);
                    }
                }
            }
        }
        return $args;
    }

    /**
     * Reset de la session pour les valeurs de recherche
     * C'est a faire car sinon cela pose problème quand plusieurs boites sont ouvertes dans des onglets
     * Voir MANTIS 3541: Sortir la recherche de la session
     *
     * @link https://psi2appli.appli.i2/mantis/view.php?id=3541
     */
    private function reset_session() {
        unset($_SESSION['search']);
        unset($_SESSION['search_filter']);
    }

    /**
     * Association entre les identités Roundcube et les bal MCE
     * Retourne le résultat en env
     */
    private function assoc_identity_bal() {
        $result = array();
        $identities = $this->rc->user->list_identities();
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
                    }
                    else {
                        $hostname = driver_mel::gi()->getRoutage($mailbox);
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
    private function set_defaults_folders() {
        global $CONFIG;
        $driver_mel = driver_mel::gi();
        $balp_label = $driver_mel->getBalpLabel();
        $draft_mbox = $driver_mel->getMboxDraft();
        $sent_mbox = $driver_mel->getMboxSent();
        $junk_mbox = $driver_mel->getMboxJunk();
        $trash_mbox = $driver_mel->getMboxTrash();
        
        /* PAMELA - Gestion des boites partagées */
        if (isset($balp_label) && !empty($this->get_account) && $driver_mel->getUser($this->mel->get_share_objet(), false)->is_objectshare) {
            $delimiter = $this->rc->get_storage()->delimiter;
            $draft_mbox = isset($draft_mbox) ? $balp_label . $delimiter . $this->mel->get_user_bal() . $delimiter . $draft_mbox : null;
            $sent_mbox = isset($sent_mbox) ? $balp_label . $delimiter . $this->mel->get_user_bal() . $delimiter . $sent_mbox : null;
            $junk_mbox = isset($junk_mbox) ? $balp_label . $delimiter . $this->mel->get_user_bal() . $delimiter . $junk_mbox : null;
        }
        if (isset($sent_mbox)) {
            $CONFIG['sent_mbox'] = $sent_mbox;
            $this->rc->config->set('sent_mbox', $sent_mbox);
        }
        if (isset($junk_mbox)) {
            $CONFIG['junk_mbox'] = $junk_mbox;
            $this->rc->config->set('junk_mbox', $junk_mbox);
        }
        if (isset($trash_mbox)) {
            $CONFIG['trash_mbox'] = $trash_mbox;
            $this->rc->config->set('trash_mbox', $trash_mbox);
        }
        if (isset($draft_mbox)) {
            $CONFIG['drafts_mbox'] = $draft_mbox;
            $this->rc->config->set('drafts_mbox', $draft_mbox);
            $this->rc->config->set('default_folders', array(
                    $draft_mbox,
                    $sent_mbox,
                    $junk_mbox,
                    $trash_mbox
            ));
        }
    }
}