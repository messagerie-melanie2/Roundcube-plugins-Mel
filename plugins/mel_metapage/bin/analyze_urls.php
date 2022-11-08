#!/usr/bin/env php
<?php
/**
 * Fichier pour analyser les urls bloquées et sortir les noms de domaines les plus utilisés
 */

$eol = "\r\n";
$exclude_domains = [
    'web.app',
    'cutt.ly',
    't.co',
    'bit.ly',
    'google.com',
    'com.au',
    'com.br',
    'co.uk',
    'googleapis.com',
    'com.ua',
    'firebasestorage.googleapis.com',
    'co.za',
    'ow.ly',
    'www.google.com',
    'tumblr.com',
    'amazonaws.com',
    's3.amazonaws.com',
    'spotify.com',
    'wl.spotify.com',
];

$config = [];


include_once __DIR__ . '/../config.inc.php';

$domainsList = [];

$urls = $config["mel_suspect_url"];

foreach ($urls as $url) {
    if (strpos($url, '://')) {
        $url = explode('://', $url, 2)[1];
    }
    if (strpos($url, '/')) {
        $url = explode('/', $url, 2)[0];
    }
    $url = trim($url, " \t\n\r\0\x0B.");
    $domains = explode('.', $url);

    while (count($domains) > 1) {
        $domain = implode('.', $domains);
        if (isset($domainsList[$domain])) {
            $domainsList[$domain]++;
        }
        else {
            $domainsList[$domain] = 1;
        }
        array_shift($domains);
    }
}
arsort($domainsList);

// Ne pas garder les domaines en un exemplaire
$domainsList = array_diff($domainsList, [1]);

echo "Resultat = ";
var_export($domainsList);
echo "$eol$eol";

echo '$config["mel_suspect_url"] = [' . "$eol";
foreach (array_keys($domainsList) as $key) {
    if (!in_array($key, $exclude_domains)) {
        echo "  '$key',$eol";
    }
}
echo "];$eol";
