#!/usr/bin/env php
<?php

/**
 * Generate a number contacts with random data
 *
 * @version 3.1
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

if (!file_exists(INSTALL_PATH . 'program/include/clisetup.php'))
    die("Execute this from the Roundcube installation dir!\n\n");

require_once INSTALL_PATH . 'program/include/clisetup.php';

function print_usage()
{
    print "Usage:  randomcontacts.sh [OPTIONS] USERNAME FOLDER\n";
    print "Create random contact that for then given user in the specified folder.\n";
    print "-n, --num      Number of contacts to be created, defaults to 50\n";
    print "-h, --host     IMAP host name\n";
    print "-p, --password IMAP user password\n";
}

// read arguments
$opts = rcube_utils::get_opt(array(
    'n' => 'num',
    'h' => 'host',
    'u' => 'user',
    'p' => 'pass',
    'v' => 'verbose',
));

$opts['username'] = !empty($opts[0]) ? $opts[0] : $opts['user'];
$opts['folder'] = $opts[1];

$rcmail = rcube::get_instance(rcube::INIT_WITH_DB | rcube::INIT_WITH_PLUGINS);
$rcmail->plugins->load_plugins(array('libkolab'));
ini_set('display_errors', 1);


if (empty($opts['host'])) {
    $opts['host'] = $rcmail->config->get('default_host');
    if (is_array($opts['host']))  // not unique
        $opts['host'] = null;
}

if (empty($opts['username']) || empty($opts['folder']) || empty($opts['host'])) {
    print_usage();
    exit;
}

// prompt for password
if (empty($opts['pass'])) {
    $opts['pass'] = rcube_utils::prompt_silent("Password: ");
}

// parse $host URL
$a_host = parse_url($opts['host']);
if ($a_host['host']) {
    $host = $a_host['host'];
    $imap_ssl = (isset($a_host['scheme']) && in_array($a_host['scheme'], array('ssl','imaps','tls'))) ? TRUE : FALSE;
    $imap_port = isset($a_host['port']) ? $a_host['port'] : ($imap_ssl ? 993 : 143);
}
else {
    $host = $opts['host'];
    $imap_port = 143;
}

// instantiate IMAP class
$IMAP = $rcmail->get_storage();

// try to connect to IMAP server
if ($IMAP->connect($host, $opts['username'], $opts['pass'], $imap_port, $imap_ssl)) {
    print "IMAP login successful.\n";
    $user = rcube_user::query($opts['username'], $host);
    $rcmail->user = $user ?: new rcube_user(null, array('username' => $opts['username'], 'host' => $host));
}
else {
    die("IMAP login failed for user " . $opts['username'] . " @ $host\n");
}

// get contacts folder
$folder = kolab_storage::get_folder($opts['folder']);
if (!$folder || empty($folder->type)) {
    die("Invalid Address Book " . $opts['folder'] . "\n");
}

$format = new kolab_format_contact;

$num = $opts['num'] ? intval($opts['num']) : 50;
echo "Creating $num contacts in " . $folder->get_resource_uri() . "\n";

for ($i=0; $i < $num; $i++) {
    // generate random names
    $contact = array(
        'surname' => random_string(rand(1,2)),
        'firstname' => random_string(rand(1,2)),
        'organization' => random_string(rand(0,2)),
        'profession' => random_string(rand(1,2)),
        'email' => array(),
        'phone' => array(),
        'address' => array(),
        'notes' => random_string(rand(10,200)),
    );

    // randomly add email addresses
    $em = rand(1,3);
    for ($e=0; $e < $em; $e++) {
        $type = array_rand($format->emailtypes);
        $contact['email'][] = array(
            'address' => strtolower(random_string(1) . '@' . random_string(1) . '.tld'),
            'type' => $type,
        );
    }

    // randomly add phone numbers
    $ph = rand(1,4);
    for ($p=0; $p < $ph; $p++) {
        $type = array_rand($format->phonetypes);
        $contact['phone'][] = array(
            'number' => '+'.rand(2,8).rand(1,9).rand(1,9).rand(0,9).rand(0,9).rand(0,9).rand(0,9).rand(0,9).rand(0,9).rand(0,9).rand(0,9),
            'type' => $type,
        );
    }

    // randomly add addresses
    $ad = rand(0,2);
    for ($a=0; $a < $ad; $a++) {
        $type = array_rand($format->addresstypes);
        $contact['address'][] = array(
            'street' => random_string(rand(1,3)),
            'locality' => random_string(rand(1,2)),
            'code' => rand(1000, 89999),
            'country' => random_string(1),
            'type' => $type,
        );
    }

    $contact['name'] = $contact['firstname'] . ' ' . $contact['surname'];

    if ($folder->save($contact, 'contact')) {
        echo ".";
    }
    else {
        echo "x";
        break;  // abort on error
    }
}

echo " done.\n";



function random_string($len)
{
    $words = explode(" ", "The Hough transform is named after Paul Hough who patented the method in 1962. It is a technique which can be used to isolate features of a particular shape within an image. Because it requires that the desired features be specified in some parametric form, the classical Hough transform is most commonly used for the de- tection of regular curves such as lines, circles, ellipses, etc. A generalized Hough transform can be employed in applications where a simple analytic description of a features is not possible. Due to the computational complexity of the generalized Hough algorithm, we restrict the main focus of this discussion to the classical Hough transform. Despite its domain restrictions, the classical Hough transform hereafter referred to without the classical prefix retains many applications, as most manufac- tured parts and many anatomical parts investigated in medical imagery contain feature boundaries which can be described by regular curves. The main advantage of the Hough transform technique is that it is tolerant of gaps in feature boundary descriptions and is relatively unaffected by image noise.");
    for ($i = 0; $i < $len; $i++) {
        $str .= $words[rand(0,count($words)-1)] . " ";
    }

    return rtrim($str);
}
