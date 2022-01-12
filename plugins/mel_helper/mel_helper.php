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

    public function include_js_debug()
    {
        $this->include_script('js/debug/watch.js');
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

    public static function build_folder_tree(&$arrFolders, $folder, $delm = '/', $path = '')
    {
        include_once "lib/mel_rcmail_action.php";
        return mel_rcmail_action::create_folder_tree($arrFolders, $folder, $delm, $path);
    }

    public static function load_editor_addon($rc)
    {
        return self::get_rc_plugin($rc, "mel_metapage")->include_edited_editor();
    }

    public static function get_maintenance_text($rc)
    {
        return self::get_rc_plugin($rc, "mel_metapage")->get_maintenance_text();
    }

    public static function wash_html($html)
    {
       // Add header with charset spec., washtml cannot work without that
       $html = '<html><head>'
           . '<meta http-equiv="Content-Type" content="text/html; charset='.RCUBE_CHARSET.'" />'
           . '</head><body>' . $html . '</body></html>';
   
       // clean HTML with washhtml by Frederic Motte
       $wash_opts = array(
           'show_washed'   => false,
           'allow_remote'  => 1,
           'charset'       => RCUBE_CHARSET,
           'html_elements' => array('body', 'link'),
           'html_attribs'  => array('rel', 'type'),
       );
   
       // initialize HTML washer
       $washer = new rcube_washtml($wash_opts);
   
       //$washer->add_callback('form', 'rcmail_washtml_callback');
       //$washer->add_callback('style', 'rcmail_washtml_callback');
   
       // Remove non-UTF8 characters (#1487813)
       $html = rcube_charset::clean($html);
   
       $html = $washer->wash($html);
   
       // remove unwanted comments and tags (produced by washtml)
       $html = preg_replace(array('/<!--[^>]+-->/', '/<\/?body>/'), '', $html);
   
       return $html;
    }
    

}