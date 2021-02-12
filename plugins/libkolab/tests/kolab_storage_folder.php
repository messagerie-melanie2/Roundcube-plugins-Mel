<?php

/**
 * libkolab/kolab_storage_folder class tests
 *
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * Copyright (C) 2015, Kolab Systems AG <contact@kolabsys.com>
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

class kolab_storage_folder_test extends PHPUnit_Framework_TestCase
{
    public static function setUpBeforeClass()
    {
        // load libkolab plugin
        $rcmail = rcmail::get_instance();
        $rcmail->plugins->load_plugin('libkolab', true, true);

        if (!kolab_format::supports(3)) {
            return;
        }

        if ($rcmail->config->get('tests_username')) {
            $authenticated = $rcmail->login(
                $rcmail->config->get('tests_username'),
                $rcmail->config->get('tests_password'),
                $rcmail->config->get('default_host'),
                false
            );

            if (!$authenticated) {
                throw new Exception('IMAP login failed for user ' . $rcmail->config->get('tests_username'));
            }

            // check for defult groupware folders and clear them
            $imap = $rcmail->get_storage();
            $folders = $imap->list_folders('', '*');

            foreach (array('Calendar','Contacts','Files','Tasks','Notes') as $folder) {
                if (in_array($folder, $folders)) {
                    if (!$imap->clear_folder($folder)) {
                        throw new Exception("Failed to clear folder '$folder'");
                    }
                }
                else {
                    throw new Exception("Default folder '$folder' doesn't exits in test user account");
                }
            }
        }
        else {
            throw new Exception('Missing test account username/password in config-test.inc.php');
        }

        kolab_storage::setup();
    }

    function test_001_folder_type_check()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $folder = new kolab_storage_folder('Calendar', 'event', 'event.default');
        $this->assertTrue($folder->valid);
        $this->assertEquals($folder->get_error(), 0);

        $folder = new kolab_storage_folder('Calendar', 'event', 'mail');
        $this->assertFalse($folder->valid);
        $this->assertEquals($folder->get_error(), kolab_storage::ERROR_INVALID_FOLDER);

        $folder = new kolab_storage_folder('INBOX');
        $this->assertFalse($folder->valid);
        $this->assertEquals($folder->get_error(), kolab_storage::ERROR_INVALID_FOLDER);
    }

    function test_002_get_owner()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $rcmail = rcmail::get_instance();
        $folder = new kolab_storage_folder('Calendar', 'event', 'event');
        $this->assertEquals($folder->get_owner(), $rcmail->config->get('tests_username'));

        $domain = preg_replace('/^.+@/', '@', $rcmail->config->get('tests_username'));

        $shared_ns = kolab_storage::namespace_root('shared');
        $folder = new kolab_storage_folder($shared_ns . 'A-shared-folder', 'event', 'event');
        $this->assertEquals($folder->get_owner(true), 'anonymous' . $domain);

        $other_ns = kolab_storage::namespace_root('other');
        $folder = new kolab_storage_folder($other_ns . 'major.tom/Calendar', 'event', 'event');
        $this->assertEquals($folder->get_owner(true), 'major.tom' . $domain);
    }

    function test_003_get_resource_uri()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $rcmail     = rcmail::get_instance();
        $foldername = 'Calendar';
        $uri        = parse_url($rcmail->config->get('default_host'));
        $hostname   = $uri['host'];

        $folder = new kolab_storage_folder($foldername, 'event', 'event.default');
        $this->assertEquals($folder->get_resource_uri(), sprintf('imap://%s@%s/%s',
            urlencode($rcmail->config->get('tests_username')),
            $hostname,
            $foldername
        ));
    }

    function test_004_get_uid()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $rcmail = rcmail::get_instance();
        $folder = new kolab_storage_folder('Doesnt-Exist', 'event', 'event');

        // generate UID from folder name if IMAP operations fail
        $uid1 = $folder->get_uid();
        $this->assertEquals($folder->get_uid(), $uid1);
        $this->assertEquals($folder->get_error(), kolab_storage::ERROR_IMAP_CONN);
    }

    function test_005_subscribe()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $folder = new kolab_storage_folder('Contacts', 'contact');
        $this->assertTrue($folder->subscribe(true));
        $this->assertTrue($folder->is_subscribed());

        $this->assertTrue($folder->subscribe(false));
        $this->assertFalse($folder->is_subscribed());

        $folder->subscribe(true);
    }

    function test_006_activate()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $folder = new kolab_storage_folder('Calendar', 'event');
        $this->assertTrue($folder->activate(true));
        $this->assertTrue($folder->is_active());

        $this->assertTrue($folder->activate(false));
        $this->assertFalse($folder->is_active());
    }

    function test_010_write_contacts()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $folder = new kolab_storage_folder('Contacts', 'contact');

        $saved = $folder->save(null, 'contact');
        $this->assertFalse($saved);

        $contact = array(
            'name' => 'FN',
            'surname' => 'Last',
            'firstname' => 'First',
            'email' => array(
                array('type' => 'home', 'address' => 'first.last@example.org'),
            ),
            'organization' => 'Company A.G.'
        );

        $saved = $folder->save($contact, 'contact');
        $this->assertTrue((bool)$saved);
    }

    /**
     * @depends test_010_write_contacts
     */
    function test_011_list_contacts()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $folder = new kolab_storage_folder('Contacts', 'contact');
        $this->assertEquals($folder->count(), 1);
    }

    function test_T491_get_uid()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $rcmail = rcmail::get_instance();
        $imap   = $rcmail->get_storage();
        $db     = $rcmail->get_dbh();

        // clear cache
        //$imap->clear_cache('mailboxes.metadata', true);

        // get folder UID
        $folder = new kolab_storage_folder('Calendar', 'event', 'event');
        $uid    = $folder->get_uid();

        // now get folder uniqueid annotations
        $annotations = array(
            'cyrus'   => kolab_storage::UID_KEY_CYRUS,
            'shared'  => kolab_storage::UID_KEY_SHARED,
            'private' => '/private/vendor/kolab/uniqueid',
        );
        foreach ($annotations as $key => $annotation) {
            $meta              = $imap->get_metadata('Calendar', $annotation);
            $annotations[$key] = $meta['Calendar'][$annotation];
        }

        // compare results
        if ($annotations['shared']) {
            $this->assertSame($annotations['shared'], $uid);
        }
        else if ($annotations['cyrus']) {
            $this->assertSame($annotations['cyrus'], $uid);
        }
        else {
            // never use private namespace
            $this->assertTrue($annotations['private'] != $uid);
        }

        // @TODO: check if the cache contains valid entries, not so simple with memcache
        // as the cache key name is quite internal to the rcube_imap class.
    }
}
