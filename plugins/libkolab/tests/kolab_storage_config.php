<?php

class kolab_storage_config_test extends PHPUnit_Framework_TestCase
{
    private $params_personal = array(
        'folder'     => 'Archive',
        'uid'        => '9',
        'message-id' => '<1225270@example.org>',
        'date'       => 'Mon, 20 Apr 2015 15:30:30 UTC',
        'subject'    => 'Archived',
    );
    private $url_personal = 'imap:///user/$user/Archive/9?message-id=%3C1225270%40example.org%3E&date=Mon%2C+20+Apr+2015+15%3A30%3A30+UTC&subject=Archived';

    private $params_shared = array(
        'folder'     => 'Shared Folders/shared/Collected',
        'uid'        => '4',
        'message-id' => '<5270122@example.org>',
        'date'       => 'Mon, 20 Apr 2015 16:33:03 +0200',
        'subject'    => 'Shared',
    );
    private $url_shared = 'imap:///shared/Collected/4?message-id=%3C5270122%40example.org%3E&date=Mon%2C+20+Apr+2015+16%3A33%3A03+%2B0200&subject=Shared';

    private $params_other = array(
        'folder'     => 'Other Users/lucy.white/Mailings',
        'uid'        => '378',
        'message-id' => '<22448899@example.org>',
        'date'       => 'Tue, 14 Apr 2015 14:14:30 +0200',
        'subject'    => 'Happy Holidays',
    );
    private $url_other = 'imap:///user/lucy.white%40example.org/Mailings/378?message-id=%3C22448899%40example.org%3E&date=Tue%2C+14+Apr+2015+14%3A14%3A30+%2B0200&subject=Happy+Holidays';

    public static function setUpBeforeClass()
    {
        $rcube = rcmail::get_instance();
        $rcube->plugins->load_plugin('libkolab', true, true);

        if (!kolab_format::supports(3)) {
            return;
        }

        if ($rcube->config->get('tests_username')) {
            $authenticated = $rcube->login(
                $rcube->config->get('tests_username'),
                $rcube->config->get('tests_password'),
                $rcube->config->get('default_host'),
                false
            );

            if (!$authenticated) {
                throw new Exception('IMAP login failed for user ' . $rcube->config->get('tests_username'));
            }

            // check for defult groupware folders and clear them
            $imap    = $rcube->get_storage();
            $folders = $imap->list_folders('', '*');

            foreach (array('Configuration') as $folder) {
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

    function test_001_build_member_url()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $rcube    = rcube::get_instance();
        $email    = $rcube->get_user_email();
        $personal = str_replace('$user', urlencode($email), $this->url_personal);

        // personal namespace
        $url = kolab_storage_config::build_member_url($this->params_personal);
        $this->assertEquals($personal, $url);

        // shared namespace
        $url = kolab_storage_config::build_member_url($this->params_shared);
        $this->assertEquals($this->url_shared, $url);

        // other users namespace
        $url = kolab_storage_config::build_member_url($this->params_other);
        $this->assertEquals($this->url_other, $url);
    }

    function test_002_parse_member_url()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $rcube    = rcube::get_instance();
        $email    = $rcube->get_user_email();
        $personal = str_replace('$user', urlencode($email), $this->url_personal);

        // personal namespace
        $params   = kolab_storage_config::parse_member_url($personal);
        $this->assertEquals($this->params_personal['uid'], $params['uid']);
        $this->assertEquals($this->params_personal['folder'], $params['folder']);
        $this->assertEquals($this->params_personal['subject'], $params['params']['subject']);
        $this->assertEquals($this->params_personal['message-id'], $params['params']['message-id']);

        // shared namespace
        $params = kolab_storage_config::parse_member_url($this->url_shared);
        $this->assertEquals($this->params_shared['uid'], $params['uid']);
        $this->assertEquals($this->params_shared['folder'], $params['folder']);

        // other users namespace
        $params = kolab_storage_config::parse_member_url($this->url_other);
        $this->assertEquals($this->params_other['uid'], $params['uid']);
        $this->assertEquals($this->params_other['folder'], $params['folder']);
    }

    function test_003_build_parse_member_url()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        // personal namespace
        $params = $this->params_personal;
        $params_ = kolab_storage_config::parse_member_url(kolab_storage_config::build_member_url($params));
        $this->assertEquals($params['uid'], $params_['uid']);
        $this->assertEquals($params['folder'], $params_['folder']);

        // shared namespace
        $params = $this->params_shared;
        $params_ = kolab_storage_config::parse_member_url(kolab_storage_config::build_member_url($params));
        $this->assertEquals($params['uid'], $params_['uid']);
        $this->assertEquals($params['folder'], $params_['folder']);

        // other users namespace
        $params = $this->params_other;
        $params_ = kolab_storage_config::parse_member_url(kolab_storage_config::build_member_url($params));
        $this->assertEquals($params['uid'], $params_['uid']);
        $this->assertEquals($params['folder'], $params_['folder']);
    }

    /**
     * Test relation/tag objects creation
     * These objects will be used by following tests
     */
    function test_save()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $config = kolab_storage_config::get_instance();
        $tags   = array(
            array(
                'category' => 'tag',
                'name'     => 'test1',
            ),
            array(
                'category' => 'tag',
                'name'     => 'test2',
            ),
            array(
                'category' => 'tag',
                'name'     => 'test3',
            ),
            array(
                'category' => 'tag',
                'name'     => 'test4',
            ),
        );

        foreach ($tags as $tag) {
            $result = $config->save($tag, 'relation');

            $this->assertTrue(!empty($result));
            $this->assertTrue(!empty($tag['uid']));
        }
    }

    /**
     * Tests "race condition" in tags handling (T133)
     */
    function test_T133()
    {
        if (!kolab_format::supports(3)) {
            $this->markTestSkipped('No Kolab support');
        }

        $config = kolab_storage_config::get_instance();

        // get tags
        $tags = $config->get_tags();
        $this->assertCount(4, $tags);

        // create a tag
        $tag = array(
            'category' => 'tag',
            'name'     => 'new',
        );
        $result = $config->save($tag, 'relation');
        $this->assertTrue(!empty($result));

        // get tags again, make sure it contains the new tag
        $tags = $config->get_tags();
        $this->assertCount(5, $tags);

        // update a tag
        $tag['name'] = 'new-tag';
        $result = $config->save($tag, 'relation');
        $this->assertTrue(!empty($result));

        // get tags again, make sure it contains the new tag
        $tags = $config->get_tags();
        $this->assertCount(5, $tags);
        $this->assertSame('new-tag', $tags[4]['name']);

        // remove a tag
        $result = $config->delete($tag['uid']);
        $this->assertTrue(!empty($result));

        // get tags again, make sure it contains the new tag
        $tags = $config->get_tags();
        $this->assertCount(4, $tags);

        foreach ($tags as $_tag) {
            $this->assertTrue($_tag['uid'] != $tag['uid']);
        }
    }
}
