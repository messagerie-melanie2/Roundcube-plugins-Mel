<?php
class mel_helper extends rcube_plugin
{

    public const ST_NO_DOUBLE_AUTH = "nodoubleauth";
    public const ST_NO_RIGHTS = "norights";
    public const ST_ACTIVE = "active";

    /**
     * @var string
     */
    public $task = '.*';

    /**
     * @var rcmail
     */
    private $rc;

    /**
     * (non-PHPdoc)
     * @see rcube_plugin::init()
     */
    public function init()
    {
        $this->setup();
    }

    /**
     * Enregistre les différentes actions, configs et boutons.
     *
     * @return void
     */
    function setup()
    {
        $this->rc = rcmail::get_instance();
        $this->load_config();
    }

    /**
     * Récupère un objet mel_fetch qui permet de faire des get ainsi que des post facilement.
     *
     * @param [any] $user_agent
     * @param [any] $ssl_verify_peer
     * @return mel_fetch
     */
    public function fetch($user_agent, $ssl_verify_peer, $ssl_verify_host)
    {
        include_once "lib/mel_fetch.php";
        return new mel_fetch($user_agent, $ssl_verify_peer, $ssl_verify_host);
    }

    /**
     * Inclue amel_lib.php
     *
     * @return void
     */
    public function include_amel_lib()
    {
        include_once "lib/amel_lib.php";
    }

    public function include_utilities()
    {
        include_once "lib/mel_utils.php";
        return "mel_utils";
    }

    /**
     * Récupère un plugin.
     *
     * @param rcmail $rc
     * @param string $name - Nom du plugin.
     * @return rcube_plugin
     */
    public static function get_rc_plugin($rc, $name)
    {
        return $rc->plugins->get_plugin($name);
    } 

    /**
     * Récupère un objet de type mel_helper.
     *
     * @param rcmail $rc
     * @return mel_helper
     */
    public static function load_helper($rc)
    {
        return self::get_rc_plugin($rc, "mel_helper");
    }
    
    public static function stockage_active()
    {
        return driver_mel::get_instance()->userHasAccessToStockage();
    }

    public static function why_stockage_not_active()
    {
        if (!mel::is_internal() 
        && class_exists('mel_doubleauth')
        && !mel_doubleauth::is_double_auth_enable())
            return self::ST_NO_DOUBLE_AUTH;
        else if (!self::stockage_active())
            return self::ST_NO_RIGHTS;

        return self::ST_ACTIVE;
    }

    public static function color()
    {
        include_once "lib/mel_color_helper.php";
        return new Mel_Color_Helper();
    }


}