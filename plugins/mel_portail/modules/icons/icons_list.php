<?php

$files = scandir(__DIR__ . '/list/');

echo "en,fr\r\n";
foreach ($files as $file) {
    if (strpos($file, '.') !== 0) {
        $tmp = explode(' - ', $file, 2);
        $name = str_replace('.png', '', $tmp[1]);
        echo "$name,\r\n";
    }
}