<?php
/**
 * Plugin Annuaire
 * 
 * plugin annuaire pour roundcube
 * 
 * Permet d'afficher l'annuaire de Mél dans l'interface des contacts
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

require_once 'lib/drivers/driver_annuaire.php';

class annuaire extends rcube_plugin
{
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
     *
     * @var string
     */
    private $server;

    /**
     *
     * @var string
     */
    private $base_dn;

    /**
     *
     * @var string
     */
    private $filter;

    /**
     *
     * @var string
     */
    private $source;

    /**
     * Initialisation du plugin
     *
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->rc = rcmail::get_instance();

        // register actions
        $this->register_action('plugin.annuaire', [
            $this,
            'annuaire_actions'
        ]);

        if ($this->rc->task == 'addressbook') {
            // use jQuery for draggable item
            $this->require_plugin('jqueryui');

            // Chargement de la conf
            $this->load_config();

            $this->rc->output->set_env('annuaire_source', $this->rc->config->get('annuaire_source'));

            $this->include_script('directorylist.js');
        } else if ($this->rc->task == 'mail' && $this->rc->action == 'compose') {
            // Chargement de la conf
            $this->load_config();

            $this->rc->output->set_env('annuaire_source', $this->rc->config->get('annuaire_source'));

            $this->include_script('directorylist.js');
            $this->include_script('annuaire.js');
            $this->include_stylesheet($this->local_skin_path() . '/annuaire.css');

            // register UI objects
            $this->rc->output->add_handlers(array(
                'annuaire_list' => array(
                    $this,
                    'annuaire_list'
                )
            ));
        } else if ($this->rc->task == 'settings' && $this->rc->action == 'plugin.mel_moncompte') {
            $fid = rcube_utils::get_input_value('_fid', rcube_utils::INPUT_GPC);
            if ($fid == 'rcmgestionlists' || $fid == 'gestionnairelistes') {
                // Chargement de la conf
                $this->load_config();

                $this->rc->output->set_env('annuaire_source', $this->rc->config->get('annuaire_source'));

                $this->include_script('directorylist.js');
                $this->include_script('annuaire.js');
                $this->include_stylesheet($this->local_skin_path() . '/annuaire.css');

                // register UI objects
                $this->rc->output->add_handlers(array(
                    'annuaire_list' => array(
                        $this,
                        'annuaire_list'
                    )
                ));
            }
        } else if ($this->rc->task == 'settings' && ($this->rc->action == 'plugin.mel_resources_bal' || $this->rc->action == 'plugin.mel_resources_agendas' || $this->rc->action == 'plugin.mel_resources_contacts' || $this->rc->action == 'plugin.mel_resources_tasks')) {
            // Chargement de la conf
            $this->load_config();

            $this->rc->output->set_env('annuaire_source', $this->rc->config->get('annuaire_source'));

            $this->include_script('directorylist.js');
            $this->include_script('annuaire.js');
            $this->include_stylesheet($this->local_skin_path() . '/annuaire.css');

            // register UI objects
            $this->rc->output->add_handlers(array(
                'annuaire_list' => array(
                    $this,
                    'annuaire_list'
                )
            ));
        }
    }

    /**
     * Plugin action handler
     */
    function annuaire_actions()
    {
        driver_annuaire::get_instance()->setBaseDn(rcube_utils::get_input_value('_base', rcube_utils::INPUT_GPC));
        driver_annuaire::get_instance()->setSource(rcube_utils::get_input_value('_source', rcube_utils::INPUT_GPC));
        driver_annuaire::get_instance()->setAlias(rcube_utils::get_input_value('_alias', rcube_utils::INPUT_GPC));
        $find = rcube_utils::get_input_value('_find', rcube_utils::INPUT_GPC);
        $search = rcube_utils::get_input_value('_q', rcube_utils::INPUT_GPC);
        $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GPC);

        // load localization
        $this->add_texts('localization/', true);

        // Chargement de la conf
        $this->load_config();

        // Set the filter
        driver_annuaire::get_instance()->get_filter_from_search($search);

        if ($this->rc->task == 'addressbook' && !driver_annuaire::get_instance()->issetBaseDn() && !isset($search) && !isset($find)) {
            driver_annuaire::get_instance()->setBaseDn($this->rc->config->get('annuaire_base_dn', null));
            $source = $this->rc->config->get('annuaire_source', null);

            $this->include_script('annuaire.js');

            // add list of address sources to client env
            $js_list = $this->rc->get_address_sources();

            // count all/writeable sources
            $writeable = 0;
            $count = 0;
            foreach ($js_list as $sid => $s) {
                $count ++;
                if (! $s['readonly']) {
                    $writeable ++;
                }
                // unset hidden sources
                if ($s['hidden'] && $sid != $source) {
                    unset($js_list[$sid]);
                }
            }

            $this->rc->output->set_env('address_sources', $js_list);
            $this->rc->output->set_env('writable_source', 0);

            $_SESSION['addressbooks_count'] = $count;
            $_SESSION['addressbooks_count_writeable'] = $writeable;

            // register UI objects
            $this->rc->output->add_handlers(array(
                'annuaire_list' => array(
                    $this,
                    'annuaire_list'
                ),
                'annuaire_frame' => array(
                    $this,
                    'annuaire_frame'
                ),
                'directorylist' => 'rcmail_directory_list'
            ));

            $this->rc->output->include_script('list.js');
            $this->rc->output->set_pagetitle($this->gettext('annuaire'));
            $this->rc->output->set_env('source', $source);
            $this->rc->output->send('annuaire.annuaire');
        } else if (driver_annuaire::get_instance()->issetBaseDn() || driver_annuaire::get_instance()->issetSource() || isset($search) || isset($find)) {
            if (driver_annuaire::get_instance()->getSource() == $this->rc->config->get('annuaire_source', null)) {
                if (driver_annuaire::get_instance()->issetBaseDn()) {
                    $base_dn = driver_annuaire::get_instance()->getBaseDn();
                    $base_dn = rcube_ldap::dn_decode($base_dn);
                    driver_annuaire::get_instance()->setBaseDn($base_dn);
                } else {
                    driver_annuaire::get_instance()->setBaseDn($this->rc->config->get('annuaire_base_dn', null));
                }

                if (isset($find)) {
                    $find = rcube_ldap::dn_decode($find);
                    // Get recursive elements list
                    $elements = driver_annuaire::get_instance()->get_recurse_elements($find);
                } else {
                    // Get elements
                    $elements = driver_annuaire::get_instance()->get_elements(isset($search) && ! empty($search) && strlen($search) >= 3);
                }

                $id = rcube_ldap::dn_encode(driver_annuaire::get_instance()->getBaseDn()) . '-' . driver_annuaire::get_instance()->getSource();
                if (driver_annuaire::get_instance()->issetAlias()) {
                    $id .= '-' . driver_annuaire::get_instance()->getAlias();
                }
            } else {
                $search_mode = (int) $this->rc->config->get('addressbook_search_mode');
                $elements = [];

                $contacts = $this->rc->get_address_book(driver_annuaire::get_instance()->getSource());

                // Lister les groupes
                if ($contacts->groups) {
                    foreach ($contacts->list_groups($search, $search_mode) as $group) {
                        $contacts->reset();
                        $contacts->set_group($group['ID']);

                        // group (distribution list) with email address(es)
                        if ($group['email']) {
                            $name = $group['name'];
                            $classname = 'list';
                            foreach ((array) $group['email'] as $i => $email) {
                                $row_id = 'G' . $group['ID'] . '-' . $i;
                                $email_format = format_email_recipient($email, $name);

                                $html = driver_annuaire::get_instance()->get_html([
                                    'name' => $name,
                                    'description' => $email,
                                    'class' => $classname,
                                    'title' => $email_format
                                ]);
                                $elements[] = array(
                                    'id' => $row_id,
                                    'email' => $email,
                                    'mail' => $email_format,
                                    'classes' => [
                                        $classname,
                                        'object'
                                    ],
                                    'html' => $html
                                );
                            }
                        } // show group with count
                        else if (($result = $contacts->count()) && $result->count) {
                            $row_id = 'E' . $group['ID'];
                            $name = $group['name'];
                            $classname = 'list';

                            if (! empty($name)) {
                                $html = driver_annuaire::get_instance()->get_html([
                                    'name' => $name,
                                    'description' => intval($result->count),
                                    'class' => $classname,
                                    'title' => $name
                                ]);
                                $elements[] = array(
                                    'id' => $row_id,
                                    'mail' => null,
                                    'name' => $name,
                                    'classes' => [
                                        $classname,
                                        'object'
                                    ],
                                    'html' => $html
                                );
                            }
                        }
                    }
                    $contacts->reset();
                    $contacts->set_group(0);
                }

                // set list properties
                $contacts->set_pagesize($this->rc->config->get('addressbook_pagesize', $this->rc->config->get('pagesize', 50)));

                if (isset($search)) {
                    // get contacts for this user with search
                    $result = $contacts->search([
                        'name',
                        'email'
                    ], $search, $search_mode);
                } else {
                    // get contacts for this user
                    $result = $contacts->list_records($this->rc->config->get('contactlist_fields'));
                }

                while ($row = $result->next()) {
                    $name = rcube_addressbook::compose_list_name($row);

                    // add record for every email address of the contact
                    $emails = $contacts->get_col_values('email', $row, true);
                    foreach ($emails as $i => $email) {
                        $row_id = $row['ID'] . '-' . $i;
                        $email_format = format_email_recipient($email, $name);
                        $classname = $row['_type'] == 'group' ? 'list' : 'person';

                        $html = driver_annuaire::get_instance()->get_html([
                            'name' => $name,
                            'description' => $email,
                            'class' => $classname,
                            'title' => $email_format
                        ]);
                        $elements[] = array(
                            'id' => $row_id,
                            'email' => $email,
                            'mail' => $email_format,
                            'classes' => [
                                $classname,
                                'object'
                            ],
                            'html' => $html
                        );
                    }
                }
                $id = driver_annuaire::get_instance()->getSource();
            }
            // send output
            header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
            // Return the result to the ajax command
            if (isset($search) && $this->rc->task == 'addressbook') {
                echo json_encode([
                    'action' => 'plugin.annuaire',
                    'elements' => $elements,
                    'source' => driver_annuaire::get_instance()->getSource(),
                    'unlock' => $unlock
                ]);
            } else if (isset($find)) {
                echo json_encode([
                    'action' => 'plugin.annuaire',
                    'find' => rcube_ldap::dn_encode($find) . '-' . driver_annuaire::get_instance()->getSource(),
                    'elements' => $elements,
                    'unlock' => $unlock
                ]);
            } else {
                echo json_encode([
                    'action' => 'plugin.annuaire',
                    'elements' => $elements,
                    'search' => isset($search),
                    'id' => $id,
                    'unlock' => $unlock
                ]);
            }
            exit();
        } else {
            // Chargement de la conf
            $this->load_config();
            $this->rc->output->set_env('annuaire_source', $this->rc->config->get('annuaire_source'));

            $elements = [];
            foreach ($this->rc->get_address_sources(false, true) as $j => $source) {
                $id = strval(strlen($source['id']) ? $source['id'] : $j);

                if ($id == 'all') {
                    // ne pas ajouter le carnet virtuel tous les contacts
                    continue;
                }

                if ($id == $this->rc->config->get('annuaire_source', null)) {
                    // Add annuaire element
                    $base_dn = $this->rc->config->get('annuaire_base_dn', null);
                    $id = rcube_ldap::dn_encode($base_dn) . '-' . $id;
                    $classes = [
                        'folder',
                        'container',
                        'annuaire'
                    ];
                } else {
                    $classes = [
                        'folder',
                        'container',
                        'addressbook'
                    ];
                }
                $html = driver_annuaire::get_instance()->get_html([
                    'id' => $id,
                    'name' => $source['name'],
                    'description' => '',
                    'class' => 'folder',
                    'title' => $source['name']
                ]);
                $elements[] = [
                    'id' => $id,
                    'dn' => $base_dn,
                    'classes' => $classes,
                    'collapsed' => true,
                    'html' => $html,
                    'children' => [
                        [
                            'id' => $id . '-child',
                            'classes' => [
                                'child'
                            ],
                            'html' => '<span></span>'
                        ]
                    ]
                ];
            }
            // send output
            header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
            // Return the result to the ajax command
            echo json_encode([
                'action' => 'plugin.annuaire',
                'elements' => $elements,
                'unlock' => $unlock
            ]);
            exit();
        }
    }

    /**
     * Affiche initial la liste de l'annuaire
     *
     * @param array $attrib
     * @return string
     */
    public function annuaire_list($attrib)
    {
        // add id to message list table if not specified
        if (!strlen($attrib['id']))
            $attrib['id'] = 'annuaire-list';

        if ($this->rc->task == 'addressbook') {
            $results = driver_annuaire::get_instance()->get_elements();
            $this->rc->output->set_env('annuaire_list', $results);
        }

        // create XHTML table
        $out = html::tag('ul', $attrib, '');

        // set client env
        $this->rc->output->add_gui_object('annuaire_list', $attrib['id']);
        $this->rc->output->include_script('treelist.js');

        return $out;
    }

    /**
     * Gestion de la frame
     *
     * @param array $attrib
     * @return string
     */
    public function annuaire_frame($attrib)
    {
        if (! $attrib['id'])
            $attrib['id'] = 'annuaire-frame';

        $attrib['name'] = $attrib['id'];

        $this->rc->output->set_env('contentframe', $attrib['name']);
        $this->rc->output->set_env('blankpage', $attrib['src'] ? $this->rc->output->abs_url($attrib['src']) : 'program/resources/blank.gif');

        return $this->rc->output->frame($attrib);
    }
}