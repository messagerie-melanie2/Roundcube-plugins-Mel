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

        $this->add_hook('render_mailboxlist',   array($this, 'render_mailboxlist'));

        // Chargement de l'account passé en Get
        $this->get_account = mel::get_account();
        // Chargement de l'ui
        $this->init_ui();
    }

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
                mel_logs::gi()->l(mel_logs::DEBUG, "mel_sharedmailboxes_imap::render_mailboxlist()");
            }
        }
        return $args;
    }

    /**
     * Initializes plugin's UI (localization, js script)
     */
    private function init_ui() {
        if ($this->ui_initialized) {
            return;
        }
        $this->ui_initialized = true;
    }
}