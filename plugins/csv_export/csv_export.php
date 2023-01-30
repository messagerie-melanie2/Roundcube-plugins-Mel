<?php

/**
 * Contacts export in csv format
 *
 * @version @package_version@
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * Copyright (C) 2011-2016, Kolab Systems AG <contact@kolabsys.com>
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

class csv_export extends rcube_plugin
{
    public $task = 'addressbook|tasks';


    /**
     * Startup method of a Roundcube plugin
     */
    public function init()
    {
        $rcmail = rcube::get_instance();

        // register hooks
        $this->add_hook('addressbook_export', array($this, 'addressbook_export'));
        $this->add_hook('tasks_export', array($this, 'tasks_export'));

        // Add localization and js script
        if ($this->api->output->type == 'html' && !$rcmail->action) {
            $this->add_texts('localization', true);
            $this->api->output->add_label('export', 'cancel');
            $this->include_script('csv_export.js');
        }
    }

    /**
     * Handler for the addressbook_export hook.
     *
     * @param array $p Hash array with hook parameters
     *
     * @return array Hash array with modified hook parameters
     */
    public function addressbook_export($p)
    {
        if ($_GET['_format'] != 'csv') {
            return $p;
        }
        
        $this->add_texts('localization', true);

        require_once(__DIR__ . '/vcard2csv.php');

        $csv    = new vcard2csv($this);
        $rcmail = rcube::get_instance();

        $CONTACTS = rcmail_action_contacts_index::contact_source(null, true);

        $rcmail->output->nocacheing_headers();

        // send downlaod headers
        $csv->headers();

        if (!$p['result']) {
            exit;
        }

        echo $csv->head();

        while ($row = $p['result']->next()) {
            if ($CONTACTS) {
                rcmail_action_contacts_export::prepare_for_export($row, $CONTACTS);
            }

            echo $csv->record($row['vcard']);
        }

        exit;
    }

    /**
     * Handler for the tasks_export hook.
     *
     * @param array $p Hash array with hook parameters
     *
     * @return array Hash array with modified hook parameters
     */
    public function tasks_export($p)
    {
        if ($_GET['_format'] != 'csv' && $_POST['_format'] != 'csv') {
            return $p;
        }
        
        $this->add_texts('localization', true);

        require_once(__DIR__ . '/event2csv.php');

        $csv    = new event2csv($this);
        $rcmail = rcube::get_instance();

        $rcmail->output->nocacheing_headers();

        // don't kill the connection if download takes more than 30 sec.
        @set_time_limit(300);

        // send downlaod headers
        $csv->headers(preg_replace('/\.ics$/', '.csv', $p['filename']));

        // sent format line
        echo $csv->head();

        foreach ((array) $p['result'] as $record) {
            echo $csv->record($record);
        }

        exit;
    }
}
