#!/usr/bin/env php
<?php

/**
 * Kolab storage cache testing script
 *
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * Copyright (C) 2014, Kolab Systems AG <contact@kolabsys.com>
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

define('INSTALL_PATH', realpath('.') . '/' );
ini_set('display_errors', 1);
libxml_use_internal_errors(true);

if (!file_exists(INSTALL_PATH . 'program/include/clisetup.php'))
    die("Execute this from the Roundcube installation dir!\n\n");

require_once INSTALL_PATH . 'program/include/clisetup.php';

function print_usage()
{
	print "Usage:  readcache.sh [OPTIONS] FOLDER\n";
	print "-h, --host     IMAP host name\n";
	print "-l, --limit    Limit the number of records to be listed\n";
}

// read arguments
$opts = rcube_utils::get_opt(array(
    'h' => 'host',
    'l' => 'limit',
    'v' => 'verbose',
));

$folder = $opts[0];
$imap_host = $opts['host'];

$rcmail = rcube::get_instance(rcube::INIT_WITH_DB | rcube::INIT_WITH_PLUGINS);

if (empty($imap_host)) {
    $default_host = $rcmail->config->get('default_host');
    if (is_array($default_host)) {
        list($k,$v) = each($default_host);
        $imap_host = is_numeric($k) ? $v : $k;
    }
    else {
        $imap_host = $default_host;
    }

    // strip protocol prefix
    $imap_host = preg_replace('!^[a-z]+://!', '', $imap_host);
}

if (empty($folder) || empty($imap_host)) {
    print_usage();
    exit;
}

// connect to database
$db = $rcmail->get_dbh();
$db->db_connect('r');
if (!$db->is_connected() || $db->is_error())
    die("No DB connection\n");


// resolve folder_id
if (!is_numeric($folder)) {
    if (strpos($folder, '@')) {
        list($mailbox, $domain) = explode('@', $folder);
        list($username, $subpath) = explode('/', preg_replace('!^user/!', '', $mailbox), 2);
        $folder_uri = 'imap://' . urlencode($username.'@'.$domain) . '@' . $imap_host . '/' . $subpath;
    }
    else {
        die("Invalid mailbox identifier! Example: user/john.doe/Calendar@example.org\n");
    }

    print "Resolving folder $folder_uri...";
    $sql_result = $db->query('SELECT * FROM `kolab_folders` WHERE `resource`=?', $folder_uri);
    if ($sql_result && ($folder_data = $db->fetch_assoc($sql_result))) {
        $folder_id = $folder_data['folder_id'];
        print $folder_id;
    }
    print "\n";
}
else {
    $folder_id = intval($folder);
    $sql_result = $db->query('SELECT * FROM `kolab_folders` WHERE `folder_id`=?', $folder_id);
    if ($sql_result) {
        $folder_data = $db->fetch_assoc($sql_result);
    }
}

if (empty($folder_data)) {
    die("Can't find cache mailbox for '$folder'\n");
}

print "Querying cache for folder $folder_id ($folder_data[type])...\n";

$extra_cols = array(
    'event'   => array('dtstart','dtend'),
    'contact' => array('type'),
);

$cache_table = $db->table_name('kolab_cache_' . $folder_data['type']);
$extra_cols_ = $extra_cols[$folder_data['type']] ?: array();
$sql_arr = $db->fetch_assoc($db->query("SELECT COUNT(*) as cnt FROM `$cache_table` WHERE `folder_id`=?", intval($folder_id)));

print "CTag  = " . $folder_data['ctag'] . "\n";
print "Lock  = " . $folder_data['synclock'] . "\n";
print "Count = " . $sql_arr['cnt'] . "\n";
print "----------------------------------------------------------------------------------\n";
print "<MSG>\t<UUID>\t<CHANGED>\t<DATA>\t<XML>\t";
print join("\t", array_map(function($c) { return '<' . strtoupper($c) . '>'; }, $extra_cols_));
print "\n----------------------------------------------------------------------------------\n";

$result = $db->limitquery("SELECT * FROM `$cache_table` WHERE `folder_id`=?", 0, $opts['limit'], intval($folder_id));
while ($result && ($sql_arr = $db->fetch_assoc($result))) {
    print $sql_arr['msguid'] . "\t" . $sql_arr['uid'] . "\t" . $sql_arr['changed'];

    // try to unserialize data block
    $object = @unserialize(@base64_decode($sql_arr['data']));
    print "\t" . ($object === false ? 'FAIL!' : ($object['uid'] == $sql_arr['uid'] ? 'OK' : '!!!'));

    // check XML validity
    $xml = simplexml_load_string($sql_arr['xml']);
    print "\t" . ($xml === false ? 'FAIL!' : 'OK');

    // print extra cols
    array_walk($extra_cols_, function($c) use ($sql_arr) {
        print "\t" . $sql_arr[$c];
    });

    print "\n";
}

print "----------------------------------------------------------------------------------\n";
echo "Done.\n";
