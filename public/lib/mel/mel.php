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

if (!defined('RCMAIL_VERSION')) {
    define('RCMAIL_VERSION', '1.6.19');
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
include_once INSTALL_PATH.'plugins/bnum_glitchtip/bnum_glitchtip.php';

if (class_exists('bnum_glitchtip', autoload:false)) {
    function getConfig(): array {
        require_once INSTALL_PATH."/plugins/bnum_glitchtip/config.inc.php";
        return $config;
    }

    $config = getConfig();

    $dsn = $config['php_dsn'];
    $options = ['enable_logs' => (bool)$config['enable_logs'], 
                'log_level' => (string)$config['log_level'],
                'traces_sample_rate' => (float)$config['traces_sample_rate'],
                'environment' => (string)$config['env'],
                'error_types' => $config['error_types']
                ];

    Glitchtip::Instance()->init($dsn, $options);

    register_shutdown_function(fn() => Glitchtip::Instance()->flush());
}

enum GlitchtipState {
    case All;
    case OnlyDistant;
    case OnlyLocal;
}

final class GlitchtipData {
    public function __construct(
        public readonly string $log_level,
        public readonly GlitchtipState $state = GlitchtipState::All
    )
    {}
}

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

    protected function redirect_to_rc($task, $action = '', $args = [])
    {
        if (!empty($action)) $action = "&_action=$action";

        $others = '';

        if (!empty($args))
        {
            foreach ($args as $key => $value) {
                // Encodage systématique pour éviter l'injection de paramètres GET
                // supplémentaires (une valeur contenant "&_task=" pourrait sinon
                // altérer la requête) et pour transporter correctement les
                // caractères spéciaux.
                $others .= "&$key=".urlencode($value);
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

    protected function log(string $message, ?GlitchtipData $data = null): void {
        if (isset($data) 
            && ($data->state === GlitchtipState::All || $data->state === GlitchtipState::OnlyDistant) 
            && class_exists('bnum_glitchtip', autoload:false)) {
            Glitchtip::Instance()->log($data->log_level, $message);
        }

        if (isset($data) && ($data->state === GlitchtipState::OnlyDistant)) return;
        utils::log($message);
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

    public static function l(string $message, ?GlitchtipData $data = null): void {
        MelEmpty::Instance()->log($message, $data);
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

final class MelEmpty extends AMel
{

    public function __construct()
    {
        return parent::__construct();
    }

    #[Override]
    public function run(...$args)
    {
        
    }

    private static ?MelEmpty $_instance;
    public static function Instance(): MelEmpty {
        return (self::$_instance??=new MelEmpty());
    }
}
