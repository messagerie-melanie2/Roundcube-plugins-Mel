<?php
if (!defined('INSTALL_PATH')) {
    define('INSTALL_PATH', $_SERVER['DOCUMENT_ROOT'].'/');
}
if (!defined('RCMAIL_CONFIG_DIR')) {
    define('RCMAIL_CONFIG_DIR', getenv('ROUNDCUBE_CONFIG_DIR') ?: (INSTALL_PATH . 'config'));
}

if (!defined('RCUBE_LOCALIZATION_DIR')) {
    define('RCUBE_LOCALIZATION_DIR', INSTALL_PATH . 'program/localization/');
}

define('RCUBE_INSTALL_PATH', INSTALL_PATH);
define('RCUBE_CONFIG_DIR',  RCMAIL_CONFIG_DIR.'/');
require_once 'imel.php';
require_once INSTALL_PATH.'program/lib/Roundcube/bootstrap.php';
require_once INSTALL_PATH.'program/lib/Roundcube/rcube_utils.php';
require_once INSTALL_PATH.'program/lib/Roundcube/rcube_config.php';
require_once INSTALL_PATH.'program/lib/Roundcube/rcube.php';
require_once INSTALL_PATH.'program/lib/Roundcube/rcube_session.php';
require_once INSTALL_PATH.'program/lib/Roundcube/session/php.php';
require_once '../lib/utils.php';
abstract class Mel implements IMel {
    static $session;
    static $plugins = [];

    protected $config;
    public function __construct() {
        $this->config = new rcube_config('');
    }

    protected function isConnected() {
        if (self::$session === null)
        {
            rcube::get_instance()->session_init();
            self::$session = true;
        }
        return !empty(rcube::get_instance()->get_user_id());
    }

    protected function redirect_to_rc($task, $action = '', ...$args)
    {
        if (!empty($action)) $action = "&_action=$action";

        $others = '';

        if (!empty($args))
        {
            foreach ($args as $key => $value) {
                $others .= "&$key=$value";
            }
        }

        $this->redirect("/?_task=$task$action$others");
    }

    protected function redirect($url)
    {
        header("Location: $url");
        exit();
    }

    public abstract function run(...$args);

    public static function addPlugin($plugin)
    {
        self::$plugins[] = $plugin;
    }

    public static function start() {
        $count = count(self::$plugins);
        for ($i=0; $i < $count; ++$i) { 
            self::$plugins[$i]->run();
        }
    }
}