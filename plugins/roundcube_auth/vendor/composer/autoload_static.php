<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit20eb776344d115aaa7ace2580881f095
{
    public static $files = array (
        'decc78cc4436b1292c6c0d151b19445c' => __DIR__ . '/..' . '/phpseclib/phpseclib/phpseclib/bootstrap.php',
    );

    public static $prefixLengthsPsr4 = array (
        'p' => 
        array (
            'phpseclib\\' => 10,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'phpseclib\\' => 
        array (
            0 => __DIR__ . '/..' . '/phpseclib/phpseclib/phpseclib',
        ),
    );

    public static $prefixesPsr0 = array (
        'R' => 
        array (
            'Roundcube\\Composer' => 
            array (
                0 => __DIR__ . '/..' . '/roundcube/plugin-installer/src',
            ),
        ),
    );

    public static $classMap = array (
        'Composer\\InstalledVersions' => __DIR__ . '/..' . '/composer/InstalledVersions.php',
        'Jumbojett\\OpenIDConnectClient' => __DIR__ . '/..' . '/jumbojett/openid-connect-php/src/OpenIDConnectClient.php',
        'Jumbojett\\OpenIDConnectClientException' => __DIR__ . '/..' . '/jumbojett/openid-connect-php/src/OpenIDConnectClient.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInit20eb776344d115aaa7ace2580881f095::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInit20eb776344d115aaa7ace2580881f095::$prefixDirsPsr4;
            $loader->prefixesPsr0 = ComposerStaticInit20eb776344d115aaa7ace2580881f095::$prefixesPsr0;
            $loader->classMap = ComposerStaticInit20eb776344d115aaa7ace2580881f095::$classMap;

        }, null, ClassLoader::class);
    }
}
