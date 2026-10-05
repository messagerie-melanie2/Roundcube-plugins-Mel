<?php
declare(strict_types=1);

use BnumPlugin\Helpers\Loader;

/**
 * Bootstrap du plugin.
 *
 * Charge l'autoloader Composer, les helpers (`LogLevel`, `constants`,
 * `Loader`), `glitchtip.php`, puis `bnum_plugin` s'il n'est pas déjà déclaré.
 *
 * @throws \BnumPlugin\Helpers\RequiredFileNotFoundException Si `bnum_plugin.php` est introuvable.
 *
 * @return void
 */
return static function (): void {
    require_once __DIR__ . '/../vendor/autoload.php';
    require_once __DIR__ . '/helpers/LogLevel.php';
    require_once __DIR__ . '/helpers/constants.php';
    require_once __DIR__ . '/helpers/RequiredFileNotFoundException.php';
    require_once __DIR__ . '/helpers/Loader.php';
    require_once __DIR__ . '/glitchtip.php';

    Loader::ensure_bnum_plugin();
};