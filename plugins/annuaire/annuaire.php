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

// Chargement de la librairie ORM
@include_once 'includes/libm2.php';

use LibMelanie\Ldap\Ldap;

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
     * @var Ldap
     */
    private $ldap;

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
            if ($fid == 'rcmgestionlists') {
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
        } else if ($this->rc->task == 'settings' && ($this->rc->action == 'plugin.mel_resources_agendas')) {
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
        // Recuperation du service
        if (! isset($_SESSION['annuaire_user_service'])) {
            $_SESSION['annuaire_user_service'] = $this->get_user_service($this->rc->user->get_username());
        }
        // Get serveur
        $this->server = LibMelanie\Config\Ldap::$SEARCH_LDAP;

        $this->base_dn = rcube_utils::get_input_value('_base', rcube_utils::INPUT_GPC);
        $this->source = rcube_utils::get_input_value('_source', rcube_utils::INPUT_GPC);
        $find = rcube_utils::get_input_value('_find', rcube_utils::INPUT_GPC);
        $search = rcube_utils::get_input_value('_q', rcube_utils::INPUT_GPC);
        $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GPC);

        // Get instance LDAP from ORM
        $this->ldap = Ldap::GetInstance($this->server);

        // load localization
        $this->add_texts('localization/', true);

        // Chargement de la conf
        $this->load_config();

        // Set the filter
        $this->get_filter_from_search($search);

        if ($this->rc->task == 'addressbook' && ! isset($this->base_dn) && ! isset($search) && ! isset($find)) {
            $this->base_dn = $this->rc->config->get('annuaire_base_dn', null);
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
        } else if (isset($this->base_dn) || isset($this->source) || isset($search) || isset($find)) {
            if ($this->source == $this->rc->config->get('annuaire_source', null)) {
                if (isset($this->base_dn)) {
                    $this->base_dn = rcube_ldap::dn_decode($this->base_dn);
                } else {
                    $this->base_dn = $this->rc->config->get('annuaire_base_dn', null);
                }

                if (isset($find)) {
                    $find = rcube_ldap::dn_decode($find);
                    // Get recursive elements list
                    $elements = $this->get_recurse_elements($find);
                } else {
                    // Get elements
                    $elements = $this->get_elements(isset($search) && ! empty($search) && strlen($search) >= 3);
                }

                $id = rcube_ldap::dn_encode($this->base_dn) . '-' . $this->source;
            } else {
                $search_mode = (int) $this->rc->config->get('addressbook_search_mode');
                $elements = [];

                $contacts = $this->rc->get_address_book($this->source);

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

                                $html = $this->get_html([
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
                                $html = $this->get_html([
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

                        $html = $this->get_html([
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
                $id = $this->source;
            }
            // send output
            header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
            // Return the result to the ajax command
            if (isset($search) && $this->rc->task == 'addressbook') {
                echo json_encode([
                    'action' => 'plugin.annuaire',
                    'elements' => $elements,
                    'source' => $this->source,
                    'unlock' => $unlock
                ]);
            } else if (isset($find)) {
                echo json_encode([
                    'action' => 'plugin.annuaire',
                    'find' => rcube_ldap::dn_encode($find) . '-' . $this->source,
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
                $html = $this->get_html([
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
     * Set the filter from the search and the config
     *
     * @param string $search
     *            The string to search
     */
    private function get_filter_from_search($search = null)
    {
        if (! isset($search) || empty($search) || strlen($search) < 3) {
            $this->filter = $this->rc->config->get('annuaire_default_filter', 'objectclass=*');
        } else {
            if (is_numeric($search)) {
                $searchField = 'telephonenumber';
                $this->filter = "$searchField=*$search";
            } else {
                $searchField = $this->rc->config->get('annuaire_search_field', 'cn');
                $this->filter = "$searchField=$search*";
            }
        }
    }

    /**
     * Get recursive elements from $this->base_dn to $find
     *
     * @param string $find
     *            DN to find
     * @return array
     */
    private function get_recurse_elements($find)
    {
        $_elements = $this->get_elements();

        // Parcours les elements pour trouver le bon
        foreach ($_elements as $key => $_element) {
            if ($find === $_element['dn']) {
                return $_elements;
            } else if (in_array('folder', $_element['classes']) && strpos($find, $_element['dn']) !== false) {
                $this->base_dn = $_element['dn'];
                $_elements[$key]['children'] = $this->get_recurse_elements($find);
                $_elements[$key]['collapsed'] = false;
                break;
            }
        }
        return $_elements;
    }

    /**
     * Get elements to an array based on base_dn and filter
     *
     * @return array
     */
    private function get_elements($search = false)
    {
        $folders = [];
        $lists = [];
        $persons = [];
        $applications = [];
        $services = [];
        $functions = [];
        $units = [];
        $resources = [];
        $this->ldap->anonymous();
        $attributes = [
            'objectclass',
            'ou',
            'cn',
            'description',
            'mineqportee',
            'mineqtypeentree',
            'mineqordreaffichage',
            'mineqpublicationphotointranet',
            'mailpr',
            'uid'
        ];
        if ($search) {
            $sr = $this->ldap->search($this->base_dn, $this->filter, $attributes, 0, 100);
        } else {
            $sr = $this->ldap->ldap_list($this->base_dn, $this->filter, $attributes);
        }

        if ($sr !== false) {
            $infos = $this->ldap->get_entries($sr);

            unset($infos['count']);
            foreach ($infos as $info) {
                if (isset($info['mineqportee']) && ($info['mineqportee'][0] == '00')) {
                    continue;
                } else if (isset($info['mineqportee']) && ($info['mineqportee'][0] == '20')) {
                    if (strpos($info['dn'], $_SESSION['annuaire_user_service']) === false) {
                        continue;
                    }
                }
                $name = '';
                $description = '';
                $class = '';
                $order = '';
                $title = '';
                $id = rcube_ldap::dn_encode($info['dn']) . '-' . $this->source;
                foreach ($info['objectclass'] as $k => $v) {
                    switch ($v) {
                        case 'mineqMelListe':
                        case 'mineqMelListeAbonnement':
                            $name = $info['cn'][0];
                            $email = $info['mailpr'][0];
                            $title = $name;
                            $order = isset($info['mineqordreaffichage'][0]) ? $info['mineqordreaffichage'][0] . $name : $name;
                            $class = 'list';
                            $html = $this->get_html([
                                'name' => $name,
                                'description' => $description,
                                'class' => $class,
                                'title' => $title,
                                'gototree' => $search
                            ]);
                            $lists[] = array(
                                'id' => $id,
                                'dn' => $info['dn'],
                                'email' => $email,
                                'mail' => format_email_recipient($email, $name),
                                'classes' => [
                                    $class,
                                    'object'
                                ],
                                'order' => $order,
                                'html' => $html
                            );
                            break;
                        case 'organizationalUnit':
                            $name = $info['cn'][0];
                            if (empty($name)) {
                                $name = $info['description'][0];
                            }
                            $title = $name;
                            if (strpos($name, ' (')) {
                                $name = explode(' (', trim($name), 2);
                                $description = substr($name[1], 0, strlen($name[1]) - 1);
                                $name = $name[0];
                            }
                            $order = isset($info['mineqordreaffichage'][0]) ? $info['mineqordreaffichage'][0] . $name : $name;
                            $class = 'folder';
                            $html = $this->get_html([
                                'name' => $name,
                                'description' => $description,
                                'class' => $class,
                                'title' => $title,
                                'gototree' => $search
                            ]);
                            $folders[] = array(
                                'id' => $id,
                                'dn' => $info['dn'],
                                'email' => $email,
                                'classes' => [
                                    $class
                                ],
                                'order' => $order,
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
                            );
                            break;
                        case 'mineqMelBoite':
                        case 'mineqMelDP':
                            $name = $info['cn'][0];
                            $email = $info['mailpr'][0];
                            $uid = $info['uid'][0];
                            $title = '[' . $info['mineqtypeentree'][0] . '] ' . $name;
                            $order = isset($info['mineqordreaffichage'][0]) ? $info['mineqordreaffichage'][0] . $name : $name;
                            switch ($info['mineqtypeentree'][0]) {
                                case 'BALI':
                                default:
                                    if (isset($info['mineqpublicationphotointranet'][0]) && $info['mineqpublicationphotointranet'][0]) {
                                        $class = 'person';
                                        $classes = [
                                            $class,
                                            'object'
                                        ];
                                    } else {
                                        $class = 'person nophoto';
                                        $classes = [
                                            'person',
                                            'nophoto',
                                            'object'
                                        ];
                                    }
                                    $html = $this->get_html([
                                        'name'          => $name,
                                        'description'   => $description,
                                        'class'         => $class,
                                        'title'         => $title,
                                        'gototree'      => $search
                                    ]);
                                    $persons[] = array(
                                        'id'        => $id,
                                        'uid'       => $uid,
                                        'dn'        => $info['dn'],
                                        'email'     => $email,
                                        'mail'      => format_email_recipient($email, $name),
                                        'classes'   => $classes,
                                        'order'     => $order,
                                        'html'      => $html
                                    );
                                    break;
                                case 'BALA':
                                    $class = 'application';
                                    $html = $this->get_html([
                                        'name'          => $name,
                                        'description'   => $description,
                                        'class'         => $class,
                                        'title'         => $title,
                                        'gototree'      => $search
                                    ]);
                                    $applications[] = array(
                                        'id'        => $id,
                                        'uid'       => $uid,
                                        'dn'        => $info['dn'],
                                        'email'     => $email,
                                        'mail'      => format_email_recipient($email, $name),
                                        'classes'   => [
                                            $class,
                                            'object'
                                        ],
                                        'order'     => $order,
                                        'html'      => $html
                                    );
                                    break;
                                case 'BALS':
                                    $class = 'service';
                                    $html = $this->get_html([
                                        'name'          => $name,
                                        'description'   => $description,
                                        'class'         => $class,
                                        'title'         => $title,
                                        'gototree'      => $search
                                    ]);
                                    $services[] = array(
                                        'id'        => $id,
                                        'uid'       => $uid,
                                        'dn'        => $info['dn'],
                                        'email'     => $email,
                                        'mail'      => format_email_recipient($email, $name),
                                        'classes'   => [
                                            $class,
                                            'object'
                                        ],
                                        'order'     => $order,
                                        'html'      => $html
                                    );
                                    break;
                                case 'BALF':
                                    $class = 'function';
                                    $html = $this->get_html([
                                        'name'          => $name,
                                        'description'   => $description,
                                        'class'         => $class,
                                        'title'         => $title,
                                        'gototree'      => $search
                                    ]);
                                    $functions[] = array(
                                        'id'        => $id,
                                        'uid'       => $uid,
                                        'dn'        => $info['dn'],
                                        'email'     => $email,
                                        'mail'      => format_email_recipient($email, $name),
                                        'classes'   => [
                                            $class,
                                            'object'
                                        ],
                                        'order'     => $order,
                                        'html'      => $html
                                    );
                                    break;
                                case 'BALU':
                                    $class = 'unit';
                                    $html = $this->get_html([
                                        'name'          => $name,
                                        'description'   => $description,
                                        'class'         => $class,
                                        'title'         => $title,
                                        'gototree'      => $search
                                    ]);
                                    $units[] = array(
                                        'id'        => $id,
                                        'uid'       => $uid,
                                        'dn'        => $info['dn'],
                                        'email'     => $email,
                                        'mail'      => format_email_recipient($email, $name),
                                        'classes'   => [
                                            $class,
                                            'object'
                                        ],
                                        'order'     => $order,
                                        'html'      => $html
                                    );
                                    break;
                                case 'BALR':
                                    $class = 'resource';
                                    $html = $this->get_html([
                                        'name'          => $name,
                                        'description'   => $description,
                                        'class'         => $class,
                                        'title'         => $title,
                                        'gototree'      => $search
                                    ]);
                                    $resources[] = array(
                                        'id'        => $id,
                                        'uid'       => $uid,
                                        'dn'        => $info['dn'],
                                        'email'     => $email,
                                        'mail'      => format_email_recipient($email, $name),
                                        'classes'   => [
                                            $class,
                                            'object'
                                        ],
                                        'order'     => $order,
                                        'html'      => $html
                                    );
                                    break;
                            }

                            break;
                    }
                }
            }
        }
        // Sort folders by name
        usort($folders, function ($a, $b) {
            return strtolower($a['order']) > strtolower($b['order']);
        });
        // Sort lists by name
        usort($lists, function ($a, $b) {
            return strtolower($a['order']) > strtolower($b['order']);
        });
        // Sort persons by name
        usort($persons, function ($a, $b) {
            return strtolower($a['order']) > strtolower($b['order']);
        });
        // Sort applications by name
        usort($applications, function ($a, $b) {
            return strtolower($a['order']) > strtolower($b['order']);
        });
        // Sort services by name
        usort($services, function ($a, $b) {
            return strtolower($a['order']) > strtolower($b['order']);
        });
        // Sort functions by name
        usort($functions, function ($a, $b) {
            return strtolower($a['order']) > strtolower($b['order']);
        });
        // Sort units by name
        usort($units, function ($a, $b) {
            return strtolower($a['order']) > strtolower($b['order']);
        });
        // Sort resources by name
        usort($resources, function ($a, $b) {
            return strtolower($a['order']) > strtolower($b['order']);
        });
        return array_merge($folders, $persons, $services, $functions, $units, $resources, $applications, $lists);
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
        if (! strlen($attrib['id']))
            $attrib['id'] = 'annuaire-list';

        if ($this->rc->task == 'addressbook') {
            $results = $this->get_elements();
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

    /**
     * **** PRIVATE ***
     */
    /**
     * Retourne le contenu html d'un objet
     *
     * @param array $object
     * @return string
     */
    private function get_html($object)
    {
        $content = html::span([
            'id' => 'l:' . $object['id'],
            'class' => 'name',
            'title' => $object['title']
        ], $object['name']);
        $content .= html::span([
            'class' => 'description'
        ], $object['description']);
        if ($object['gototree']) {
            $content .= html::div([
                'class' => 'gototree button',
                'title' => $this->gettext('gototree'),
                'onclick' => rcmail_output::JS_OBJECT_NAME . '.annuaire_gototree(this, event); return false'
            ], '&nbsp;');
        }
        return $content;
    }

    /**
     * Récupère
     *
     * @param string $uid
     *            Uid de l'utilisateur
     */
    private function get_user_service($uid)
    {
        // Récupération du DN en fonction de l'UID
        $user_infos = LibMelanie\Ldap\Ldap::GetUserInfos($uid);
        $base_dn = $user_infos['dn'];
        $base_dn = substr($base_dn, strpos($base_dn, ',') + 1);
        $service = null;
        // Initialisation du filtre LDAP
        $base_filter = "(mineqTypeEntree=NSER)";
        // Récupération de l'instance depuis l'ORM
        $ldap = LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$SEARCH_LDAP);
        if ($ldap->anonymous()) {
            do {
                $tmp = explode(',', $base_dn, 2);
                $filter = "(&(" . $tmp[0] . ")$base_filter)";
                $base_dn = $tmp[1];
                // Search LDAP
                $result = $ldap->ldap_list($base_dn, $filter, [
                    'cn'
                ]);
            } while ((! isset($result) || $ldap->count_entries($result) === 0) && strpos($base_dn, 'ou=') === 0);
            if (isset($result) && $ldap->count_entries($result) == 1) {
                $infos = $ldap->get_entries($result);
                $service = $infos[0]['dn'];
            }
        }
        return $service;
    }
}