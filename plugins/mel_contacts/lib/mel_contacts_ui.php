<?php

/**
 * Kolab address book UI
 *
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * Copyright (C) 2012, Kolab Systems AG <contact@kolabsys.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
class mel_contacts_ui
{
    private $plugin;
    private $rc;

    /**
     * Class constructor
     *
     * @param mel_contacts $plugin Plugin object
     */
    public function __construct($plugin)
    {
        $this->rc     = rcube::get_instance();
        $this->plugin = $plugin;

        $this->init_ui();
    }

    /**
     * Adds folders management functionality to Addressbook UI
     */
    private function init_ui()
    {
        if (!empty($this->rc->action) && !preg_match('/^plugin\.book/', $this->rc->action)) {
            return;
        }

        // Include script
        $this->plugin->include_script('mel_contacts.js');

        if (empty($this->rc->action)) {
            // Include stylesheet (for directorylist)
            $this->plugin->include_stylesheet($this->plugin->local_skin_path().'/mel_contacts.css');

            // Add actions on address books
            $options = array('book-create', 'book-edit', 'book-delete');
            $idx     = 0;

            if ($this->rc->config->get('addressbook_carddav_url')) {
              $options[] = 'book-showurl';
            }

            foreach ($options as $command) {
                $content = html::tag('li', $idx ? null : array('class' => 'separator_above'),
                    $this->plugin->api->output->button(array(
                        'label'    => 'mel_contacts.'.str_replace('-', '', $command),
                        'domain'   => $this->ID,
                        'classact' => 'active',
                        'command'  => $command
                )));
                $this->plugin->api->add_content($content, 'groupoptions');
                $idx++;
            }
            
            // Link to Settings/Folders
            $content = html::tag('li', array('class' => 'separator_above'),
                    $this->plugin->api->output->button(array(
                        'label'    => 'mel_contacts.manageresources',
                        'type'     => 'link',
                        'classact' => 'active',
                        'command'  => 'plugin.mel_resources_contacts',
                        'task'     => 'settings',
                    )));
            $this->plugin->api->add_content($content, 'groupoptions');

            $this->rc->output->add_label('mel_contacts.bookdeleteconfirm',
                'mel_contacts.bookdeleting', 'mel_contacts.bookshowurl',
                'mel_contacts.carddavurldescription');
        }
        // book create/edit form
        else {
            $this->rc->output->add_label('mel_contacts.nobooknamewarning',
                'mel_contacts.booksaving');
        }
    }


    /**
     * Handler for address book create/edit action
     */
    public function book_edit()
    {
        $this->rc->output->add_handler('bookdetails', array($this, 'book_form'));
        $this->rc->output->send('mel_contacts.bookedit');
    }


    /**
     * Handler for 'bookdetails' object returning form content for book create/edit
     *
     * @param array $attr Object attributes
     *
     * @return string HTML output
     */
    public function book_form($attrib)
    {
        $action = trim(rcube_utils::get_input_value('_act', rcube_utils::INPUT_GPC));
        $folder = trim(rcube_utils::get_input_value('_source', rcube_utils::INPUT_GPC, true)); // UTF8

        $hidden_fields[] = array('name' => '_source', 'value' => $folder);
        
        if ($this->rc->action == 'plugin.book-save') {
            // save error
            $name      = trim(rcube_utils::get_input_value('_name', rcube_utils::INPUT_GPC, true)); // UTF8
            $old       = trim(rcube_utils::get_input_value('_oldname', rcube_utils::INPUT_GPC, true)); // UTF7-IMAP

            $hidden_fields[] = array('name' => '_oldname', 'value' => $old);
        }
        else if ($action == 'edit') {
            $name      = trim(rcube_utils::get_input_value('_name', rcube_utils::INPUT_GPC, true)); // UTF8
            $hidden_fields[] = array('name' => '_oldname', 'value' => $name);
        }
        else { // create
            $path_imap = $folder;
            $name      = '';
            $folder    = '';
        }

        $form   = array();

        // General tab
        $form['props'] = array(
            'name' => $this->rc->gettext('properties'),
        );
        
        $foldername = new html_inputfield(array('name' => '_name', 'id' => '_name', 'size' => 30));
        $foldername = $foldername->show($name);

        $form['props']['fieldsets']['location'] = array(
            'name'  => $this->rc->gettext('location'),
            'content' => array(
                'name' => array(
                    'label' => $this->plugin->gettext('bookname'),
                    'value' => $foldername,
                ),
            ),
        );
        
        if ($action != 'create') {
            $form['sharing'] = array(
                'name'    => $this->Q($this->plugin->gettext('tabsharing')),
                'content' => html::tag('iframe', array(
                    'src' => $this->rc->url(array('_action' => 'plugin.contacts-acl', 'id' => $folder, 'framed' => 1)),
                    'width' => '100%',
                    'height' => 350,
                    'border' => 0,
                    'style' => 'border:0'),
                        ''),
            );
            $form['groupsharing'] = array(
                'name'    => $this->Q($this->plugin->gettext('tabsharinggroup')),
                'content' => html::tag('iframe', array(
                    'src' => $this->rc->url(array('_action' => 'plugin.contacts-acl-group', 'id' => $folder, 'framed' => 1)),
                    'width' => '100%',
                    'height' => 350,
                    'border' => 0,
                    'style' => 'border:0'),
                        ''),
            );
        }

        // Allow plugins to modify address book form content (e.g. with ACL form)
        $plugin = $this->rc->plugins->exec_hook('addressbook_form',
            array('form' => $form, 'options' => $options, 'name' => $folder));

        $form = $plugin['form'];

        // Set form tags and hidden fields
        list($form_start, $form_end) = $this->get_form_tags($attrib, 'plugin.book-save', null, $hidden_fields);

        unset($attrib['form']);

        // return the complete edit form as table
        $out = "$form_start\n";

        // Create form output
        foreach ($form as $tab) {
            if (!empty($tab['fieldsets']) && is_array($tab['fieldsets'])) {
                $content = '';
                foreach ($tab['fieldsets'] as $fieldset) {
                    $subcontent = $this->get_form_part($fieldset);
                    if ($subcontent) {
                      $content .= html::tag('fieldset', null, html::tag('legend', null, $this->Q($fieldset['name'])) . $subcontent) ."\n";
                    }
                }
            }
            else {
                $content = $this->get_form_part($tab);
            }

            if ($content) {
              $out .= html::tag('fieldset', null, html::tag('legend', null, $this->Q($tab['name'])) . $content) ."\n";
            }
        }

        $out .= "\n$form_end";

        return $out;
    }


    private function get_form_part($form)
    {
        $content = '';

        if (is_array($form['content']) && !empty($form['content'])) {
            $table = new html_table(array('cols' => 2, 'class' => 'propform'));
            foreach ($form['content'] as $col => $colprop) {
                $colprop['id'] = '_'.$col;
                $label = !empty($colprop['label']) ? $colprop['label'] : $this->rc->gettext($col);

                $table->add('title', sprintf('<label for="%s">%s</label>', $colprop['id'], $this->Q($label)));
                $table->add(null, $colprop['value']);
            }
            $content = $table->show();
        }
        else {
            $content = $form['content'];
        }

        return $content;
    }


    private function get_form_tags($attrib, $action, $id = null, $hidden = null)
    {
        $form_start = $form_end = '';

        $request_key = $action . (isset($id) ? '.'.$id : '');
        $form_start = $this->rc->output->request_form(array(
            'name'    => 'form',
            'method'  => 'post',
            'task'    => $this->rc->task,
            'action'  => $action,
            'request' => $request_key,
            'noclose' => true,
        ) + $attrib);

        if (is_array($hidden)) {
            foreach ($hidden as $field) {
                $hiddenfield = new html_hiddenfield($field);
                $form_start .= $hiddenfield->show();
            }
        }

        $form_end = !strlen($attrib['form']) ? '</form>' : '';

        $EDIT_FORM = !empty($attrib['form']) ? $attrib['form'] : 'form';
        $this->rc->output->add_gui_object('editform', $EDIT_FORM);

        return array($form_start, $form_end);
    }
    
    /**
     * Replacing specials characters to a specific encoding type
     *
     * @param string  Input string
     * @param string  Replace mode for tags: show|remove|strict
     * @param boolean Convert newlines
     *
     * @return string The quoted string
     */
    private function Q($str, $mode='strict', $newlines=true) {
        return rcube_utils::rep_specialchars_output($str, 'html', $mode, $newlines);
    }

}
