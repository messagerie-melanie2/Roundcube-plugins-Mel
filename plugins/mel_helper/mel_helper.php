<?php
class mel_helper extends rcube_plugin
{
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
    public function fetch($user_agent, $ssl_verify_peer)
    {
        include_once "lib/mel_fetch.php";
        return new mel_fetch($user_agent, $ssl_verify_peer);
    }

    public function include_amel_lib()
    {
        include_once "lib/amel_lib.php";
    }

    public static function get_rc_plugin($rc, $name)
    {
        return $rc->plugins->get_plugin($name);
    } 

    public static function load_helper($rc)
    {
        return self::get_rc_plugin($rc, "mel_helper");
    }


}