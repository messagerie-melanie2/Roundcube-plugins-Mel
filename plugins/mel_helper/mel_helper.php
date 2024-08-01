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

    public function twitterAccountExists($username, $proxy = null){

/*        $PROXY_HOST = "pfrie-std.proxy.e2.rie.gouv.fr"; // Proxy server address
        $PROXY_PORT = "8080";    // Proxy server port*/

        $proxy_array = null;

        if ($proxy !== null)
            $proxy_array = [CURLOPT_PROXY => $proxy];

        $content = $this->fetch("", "", "")->_get_url("https://twitter.com/$username", null, null, $proxy_array);

        if($content["httpCode"] === 404) {
            return false;
        } else {
            return true;
        }
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

    public function include_js_annuaire_tree()
    {
        $this->include_script('js/annuaireTree.js');
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
        if (self::stockage_active()) return self::ST_ACTIVE;
        else if (
            !mel::is_internal() 
        &&  !mel::is_auth_strong()
        &&  class_exists('mel_doubleauth')
        &&  !mel_doubleauth::is_double_auth_enable())
            return self::ST_NO_DOUBLE_AUTH;

        return self::ST_NO_RIGHTS;
    }

    public static function color()
    {
        include_once "lib/mel_color_helper.php";
        return new Mel_Color_Helper();
    }

    public static function html_helper()
    {
        include_once "lib/html_helper.php";
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

    public static function settings($only_include = false)
    {
        include_once "lib/mel_settings.php";

        if (!$only_include)
            return settings_helper::Instance();
    }

    public static function Enumerable($arrayLike)
    {
        include_once "lib/mel_linq.php";
        return Mel_Enumerable::from($arrayLike);
    }

    public static function get_service_name($dn)
    {
        $end = ',dc=equipement,dc=gouv,dc=fr';
        $ldap = LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$SEARCH_LDAP);

        if ($ldap->bind4lookup()) {

            if (strpos($dn, $end) === false) $dn .= $end;

            try {
                $result = $ldap->read($dn, '(objectClass=*)', 'cn');

                if (isset($result) && $ldap->count_entries($result) == 1) {
                    $infos = $ldap->get_entries($result);
                    return explode(' (', $infos[0]['cn'][0], 2)[0];
                }
            } catch (\Throwable $th) {
                //throw $th;
            }
        }

        return explode('=', explode(",", $dn, 2)[0])[1];
    }

    public static function clear_folders_cache(&$rc)
    {
        $array = ['', $_SESSION["list_attrib"]["folder_name"] ?? '*', isset($_SESSION["list_attrib"]['folder_filter']) ? $_SESSION["list_attrib"]['folder_filter'] : "mail", null];
        $cache_key = rcube_cache::key_name('mailboxes', $array);
        $rc->storage->clear_cache($cache_key);

        $cache_key = rcube_cache::key_name('mailboxes.list', $array);
        $rc->storage->clear_cache($cache_key);
    }

    public static function array($array = [])
    {
        include_once 'lib/mel_array.php';
        return new MelArray($array);
    }
    
    public static function parse_url($url)
    {
        include_once 'lib/mel_url.php';
        return new mel_url($url);
    }

    public static function load_user_cerbere($user)
    {
        $user->load(['cerbere']);
        return $user->cerbere;
    }

    public static function create_stopwatch()
    {
        include_once "lib/Stopwatch.php";
        return new Stopwatch();
    }

    public static function last_login($userid) {
        $user     = rcube_user::query($userid, driver_mel::gi()->getUser($userid)->server_host);

        if (isset($user)) return $user->data['last_login'];
        else return null;
    }

    public static function send_mail($subject, $mailbody, $from, $recipient, $html = false, $pictures = [], $custom_headers = []) {
        $rc = rcmail::get_instance();

        $mailto = rcube_utils::idn_to_ascii($recipient['email']);
        $to = format_email_recipient($mailto, $recipient['name']);
        $SENDMAIL = new rcmail_sendmail(null, [
            'sendmail'      => true,
            'from'          => $from,
            'mailto'        => $to,
            'dsn_enabled'   => false,
            'charset'       => 'UTF-8',
        ]);

        $headers = array(
            'From' => $from,
            'Date' => $rc->user_date(),
            'Message-ID' => $rc->gen_message_id(),
            'X-Sender' => $from,
            'Subject' => $subject,
            'To' => $to
            //'Content-type' => ($html ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8')
        );

        if (count($custom_headers) > 0) $headers = array_merge($headers, $custom_headers);

        $message = $SENDMAIL->create_message($headers, $mailbody, $html);

        //$message = new Mail_mime("\r\n");
        // $message->setParam('text_encoding', RCUBE_CHARSET);
        // $message->setParam('head_encoding', RCUBE_CHARSET);
        // $message->setParam('head_charset', RCUBE_CHARSET);
        // $message->setParam('text_charset', RCUBE_CHARSET);
        // $message->setParam('html_charset', RCUBE_CHARSET);

        if (count($pictures) > 0)
        {
            foreach ($pictures as $value) {
                $message->addHTMLImage($value['path'], $value['type'], '', true, $value['id']);
            }
        }

        // compose common headers array
        // $headers = array(
        //     'From' => $from,
        //     'Date' => $rc->user_date(),
        //     'Message-ID' => $rc->gen_message_id(),
        //     'X-Sender' => $from,
        //     //'Content-type' => ($html ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8')
        // );
        if ($agent = $rc->config->get('useragent')) {
            $headers['User-Agent'] = $agent;
        }

        //$headers['To'] = format_email_recipient($mailto, $recipient['name']);
        //$headers['Subject'] = $subject;

//        if (count($pictures) <= 0) $headers['Content-type'] = ($html ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8');


        // $message->headers($headers);
        // $message->setHTMLBody($mailbody);
        // new rcmail_sendmail().
        $sent = rcmail::get_instance()->deliver_message($message, $headers['X-Sender'], $mailto, $smtp_error);

        return $sent;
    }

    public static function check_date_past($date_string, $nb_jours) {
        // Convertir la date en un objet DateTime
        $date = new DateTime($date_string);
        
        // Ajouter le nombre de jours spécifié à la date
        $date->add(new DateInterval("P{$nb_jours}D"));
        
        // Récupérer la date et l'heure actuelles
        $maintenant = new DateTime();
        
        // Comparer la date actuelle avec la date calculée
        return $maintenant >= $date;
    }

    public static function include_mail_body()
    {
        include_once "lib/mel_mail.php";
    }

    public static function HtmlPartManager($html) {
        include_once "lib/html_part_manager.php";
        return new HtmlPartManager($html);
    }

    public static function Parse($template) {
        include_once "lib/html_block.php";
        return new HtmlBlock($template);
    }
    
}