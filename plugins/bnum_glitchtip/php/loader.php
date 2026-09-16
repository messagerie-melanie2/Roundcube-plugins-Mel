<?php
declare(strict_types=1);

/**
 * Bootstrap du plugin.
 *
 * Charge l'autoloader Composer ainsi que les fichiers `glitchtip.php` et
 * `helpers/constants.php`, nécessaires au fonctionnement du plugin.
 *
 * @return void
 */
return static function (): void {
    require_once __DIR__.'/../vendor/autoload.php';
    require_once __DIR__.'/helpers/LogLevel.php';
    require_once __DIR__.'/helpers/constants.php';
    require_once __DIR__.'/glitchtip.php';
};
