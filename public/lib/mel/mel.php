<?php
$root = realpath(dirname(dirname(dirname($_SERVER["SCRIPT_FILENAME"]))));

if (file_exists("$root/bnum/index.php")) $root = "$root/bnum";

if (!defined('INSTALL_PATH')) {
    define('INSTALL_PATH', "$root/");
}
if (!defined('RCMAIL_CONFIG_DIR')) {
    define('RCMAIL_CONFIG_DIR', getenv('ROUNDCUBE_CONFIG_DIR') ?: (INSTALL_PATH . (strpos($root, '/bnum/') !== false ? '../' : '') . 'config'));
}

if (!defined('RCUBE_LOCALIZATION_DIR')) {
    define('RCUBE_LOCALIZATION_DIR', INSTALL_PATH . 'program/localization/');
}

define('RCUBE_INSTALL_PATH', INSTALL_PATH);
define('RCUBE_CONFIG_DIR',  RCMAIL_CONFIG_DIR.'/');
require_once 'imel.php';
require_once INSTALL_PATH.'program/lib/Roundcube/bootstrap.php';
require_once INSTALL_PATH.
'program/lib/Roundcube/rcube_utils.php';
require_once INSTALL_PATH.'program/lib/Roundcube/rcube_config.php';
require_once INSTALL_PATH.'program/lib/Roundcube/rcube.php';
require_once INSTALL_PATH.'program/lib/Roundcube/rcube_session.php';
require_once INSTALL_PATH.'program/lib/Roundcube/session/php.php';
require_once INSTALL_PATH.'plugins/mel/mel.php';
require_once '../lib/utils.php';
abstract class AMel implements IMel {
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

    protected function get_website_url()
    {
        //parse_url( $_SERVER[ 'REQUEST_URI' ], PHP_URL_PATH );
        $path = explode('/', parse_url( $_SERVER[ 'REQUEST_URI' ], PHP_URL_PATH ));
        $count = count($path);

        for ($i=$count-1; $i > 0 ; --$i) { 
            if ($i === $count - 4)
            {
                $path = $path[$i];
                break;
            }
        }

        if (is_array($path)) $path = '';

        return $_SERVER['REQUEST_SCHEME'].'://'.$_SERVER['HTTP_HOST']."/$path";
    }

    protected function redirect_to_rc($task, $action = '', $args)
    {
        if (!empty($action)) $action = "&_action=$action";

        $others = '';

        if (!empty($args))
        {
            foreach ($args as $key => $value) {
                $others .= "&$key=$value";
            }
        }

        $this->redirect($this->get_website_url()."?_task=$task$action$others");
    }

    protected function redirect($url)
    {
        header("Location: $url");
        exit();
    }

    protected function get_input($key, $default = null)
    {
        return utils::get_input_value($key, utils::INPUT_GET) ?? $default;
    }

    protected function include_file($path)
    {
        include_once INSTALL_PATH.$path;
    }

    protected function require_file($path)
    {
        require_once INSTALL_PATH.$path;
    }

    protected function get_config($plugin_name)
    {
        require_once INSTALL_PATH."/plugins/$plugin_name/config.inc.php";
        return $config;
    }

    protected function gi(){
        return driver_mel::gi();
    }

    protected function get_user($username = null)
    {
        return $this->gi()->getUser($username);
    }

    protected function get_user_from_mail($email)
    {
        return $this->gi()->getUser(null, true, false, null, $email);
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

class ConfigMel extends AMel {
    private $loaded_config;

    public function __construct() {
        parent::__construct();
        $this->loaded_config = [];
    }

    public function load_config($plugin_name, $fname = 'config.inc.php')
    {
        if (in_array($fname, $this->loaded_config)) {
            return true;
        }

        $this->loaded_config[] = $fname;

        $fpath = INSTALL_PATH."plugins/$plugin_name/$fname";
        $rcube = rcube::get_instance();

        if (($is_local = is_file($fpath)) && !$rcube->config->load_from_file($fpath)) {
            rcube::raise_error([
                    'code' => 527, 'file' => __FILE__, 'line' => __LINE__,
                    'message' => "Failed to load config from $fpath"
                ], true, false
            );
            return false;
        }
        else if (!$is_local) {
            // Search plugin_name.inc.php file in any configured path
            return $rcube->config->load_from_file($plugin_name . '.inc.php');
        }

        return true;
    }

    public function run(...$args) {}

    public function conf($conf, $df = null) {
        return rcube::get_instance()->config->get($conf, $df);
    }
}