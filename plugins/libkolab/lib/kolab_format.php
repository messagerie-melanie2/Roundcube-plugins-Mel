<?php

/**
 * Kolab format model class wrapping libkolabxml bindings
 *
 * Abstract base class for different Kolab groupware objects read from/written
 * to the new Kolab 3 format using the PHP bindings of libkolabxml.
 *
 * @version @package_version@
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * Copyright (C) 2012, Kolab Systems AG <contact@kolabsys.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

abstract class kolab_format
{
    public static $timezone;

    public /*abstract*/ $CTYPE;
    public /*abstract*/ $CTYPEv2;

    protected /*abstract*/ $objclass;
    protected /*abstract*/ $read_func;
    protected /*abstract*/ $write_func;

    protected $obj;
    protected $data;
    protected $xmldata;
    protected $xmlobject;
    protected $formaterror;
    protected $loaded = false;
    protected $version = '3.0';

    const KTYPE_PREFIX = 'application/x-vnd.kolab.';
    const PRODUCT_ID   = 'Roundcube-libkolab-1.1';

    // mapping table for valid PHP timezones not supported by libkolabxml
    // basically the entire list of ftp://ftp.iana.org/tz/data/backward
    protected static $timezone_map = array(
        'Africa/Asmera' => 'Africa/Asmara',
        'Africa/Timbuktu' => 'Africa/Abidjan',
        'America/Argentina/ComodRivadavia' => 'America/Argentina/Catamarca',
        'America/Atka' => 'America/Adak',
        'America/Buenos_Aires' => 'America/Argentina/Buenos_Aires',
        'America/Catamarca' => 'America/Argentina/Catamarca',
        'America/Coral_Harbour' => 'America/Atikokan',
        'America/Cordoba' => 'America/Argentina/Cordoba',
        'America/Ensenada' => 'America/Tijuana',
        'America/Fort_Wayne' => 'America/Indiana/Indianapolis',
        'America/Indianapolis' => 'America/Indiana/Indianapolis',
        'America/Jujuy' => 'America/Argentina/Jujuy',
        'America/Knox_IN' => 'America/Indiana/Knox',
        'America/Louisville' => 'America/Kentucky/Louisville',
        'America/Mendoza' => 'America/Argentina/Mendoza',
        'America/Porto_Acre' => 'America/Rio_Branco',
        'America/Rosario' => 'America/Argentina/Cordoba',
        'America/Virgin' => 'America/Port_of_Spain',
        'Asia/Ashkhabad' => 'Asia/Ashgabat',
        'Asia/Calcutta' => 'Asia/Kolkata',
        'Asia/Chungking' => 'Asia/Shanghai',
        'Asia/Dacca' => 'Asia/Dhaka',
        'Asia/Katmandu' => 'Asia/Kathmandu',
        'Asia/Macao' => 'Asia/Macau',
        'Asia/Saigon' => 'Asia/Ho_Chi_Minh',
        'Asia/Tel_Aviv' => 'Asia/Jerusalem',
        'Asia/Thimbu' => 'Asia/Thimphu',
        'Asia/Ujung_Pandang' => 'Asia/Makassar',
        'Asia/Ulan_Bator' => 'Asia/Ulaanbaatar',
        'Atlantic/Faeroe' => 'Atlantic/Faroe',
        'Atlantic/Jan_Mayen' => 'Europe/Oslo',
        'Australia/ACT' => 'Australia/Sydney',
        'Australia/Canberra' => 'Australia/Sydney',
        'Australia/LHI' => 'Australia/Lord_Howe',
        'Australia/NSW' => 'Australia/Sydney',
        'Australia/North' => 'Australia/Darwin',
        'Australia/Queensland' => 'Australia/Brisbane',
        'Australia/South' => 'Australia/Adelaide',
        'Australia/Tasmania' => 'Australia/Hobart',
        'Australia/Victoria' => 'Australia/Melbourne',
        'Australia/West' => 'Australia/Perth',
        'Australia/Yancowinna' => 'Australia/Broken_Hill',
        'Brazil/Acre' => 'America/Rio_Branco',
        'Brazil/DeNoronha' => 'America/Noronha',
        'Brazil/East' => 'America/Sao_Paulo',
        'Brazil/West' => 'America/Manaus',
        'Canada/Atlantic' => 'America/Halifax',
        'Canada/Central' => 'America/Winnipeg',
        'Canada/East-Saskatchewan' => 'America/Regina',
        'Canada/Eastern' => 'America/Toronto',
        'Canada/Mountain' => 'America/Edmonton',
        'Canada/Newfoundland' => 'America/St_Johns',
        'Canada/Pacific' => 'America/Vancouver',
        'Canada/Saskatchewan' => 'America/Regina',
        'Canada/Yukon' => 'America/Whitehorse',
        'Chile/Continental' => 'America/Santiago',
        'Chile/EasterIsland' => 'Pacific/Easter',
        'Cuba' => 'America/Havana',
        'Egypt' => 'Africa/Cairo',
        'Eire' => 'Europe/Dublin',
        'Europe/Belfast' => 'Europe/London',
        'Europe/Tiraspol' => 'Europe/Chisinau',
        'GB' => 'Europe/London',
        'GB-Eire' => 'Europe/London',
        'Greenwich' => 'Etc/GMT',
        'Hongkong' => 'Asia/Hong_Kong',
        'Iceland' => 'Atlantic/Reykjavik',
        'Iran' => 'Asia/Tehran',
        'Israel' => 'Asia/Jerusalem',
        'Jamaica' => 'America/Jamaica',
        'Japan' => 'Asia/Tokyo',
        'Kwajalein' => 'Pacific/Kwajalein',
        'Libya' => 'Africa/Tripoli',
        'Mexico/BajaNorte' => 'America/Tijuana',
        'Mexico/BajaSur' => 'America/Mazatlan',
        'Mexico/General' => 'America/Mexico_City',
        'NZ' => 'Pacific/Auckland',
        'NZ-CHAT' => 'Pacific/Chatham',
        'Navajo' => 'America/Denver',
        'PRC' => 'Asia/Shanghai',
        'Pacific/Ponape' => 'Pacific/Pohnpei',
        'Pacific/Samoa' => 'Pacific/Pago_Pago',
        'Pacific/Truk' => 'Pacific/Chuuk',
        'Pacific/Yap' => 'Pacific/Chuuk',
        'Poland' => 'Europe/Warsaw',
        'Portugal' => 'Europe/Lisbon',
        'ROC' => 'Asia/Taipei',
        'ROK' => 'Asia/Seoul',
        'Singapore' => 'Asia/Singapore',
        'Turkey' => 'Europe/Istanbul',
        'UCT' => 'Etc/UCT',
        'US/Alaska' => 'America/Anchorage',
        'US/Aleutian' => 'America/Adak',
        'US/Arizona' => 'America/Phoenix',
        'US/Central' => 'America/Chicago',
        'US/East-Indiana' => 'America/Indiana/Indianapolis',
        'US/Eastern' => 'America/New_York',
        'US/Hawaii' => 'Pacific/Honolulu',
        'US/Indiana-Starke' => 'America/Indiana/Knox',
        'US/Michigan' => 'America/Detroit',
        'US/Mountain' => 'America/Denver',
        'US/Pacific' => 'America/Los_Angeles',
        'US/Samoa' => 'Pacific/Pago_Pago',
        'Universal' => 'Etc/UTC',
        'W-SU' => 'Europe/Moscow',
        'Zulu' => 'Etc/UTC',
    );

    /**
     * Factory method to instantiate a kolab_format object of the given type and version
     *
     * @param string Object type to instantiate
     * @param float  Format version
     * @param string Cached xml data to initialize with
     * @return object kolab_format
     */
    public static function factory($type, $version = '3.0', $xmldata = null)
    {
        if (!isset(self::$timezone))
            self::$timezone = new DateTimeZone('UTC');

        if (!self::supports($version))
            return PEAR::raiseError("No support for Kolab format version " . $version);

        $type = preg_replace('/configuration\.[a-z._]+$/', 'configuration', $type);
        $suffix = preg_replace('/[^a-z]+/', '', $type);
        $classname = 'kolab_format_' . $suffix;
        if (class_exists($classname))
            return new $classname($xmldata, $version);

        return PEAR::raiseError("Failed to load Kolab Format wrapper for type " . $type);
    }

    /**
     * Determine support for the given format version
     *
     * @param float Format version to check
     * @return boolean True if supported, False otherwise
     */
    public static function supports($version)
    {
        if ($version == '2.0')
            return class_exists('kolabobject');
        // default is version 3
        return class_exists('kolabformat');
    }

    /**
     * Convert the given date/time value into a cDateTime object
     *
     * @param mixed         Date/Time value either as unix timestamp, date string or PHP DateTime object
     * @param DateTimeZone  The timezone the date/time is in. Use global default if Null, local time if False
     * @param boolean       True of the given date has no time component
     * @param DateTimeZone  The timezone to convert the date to before converting to cDateTime
     *
     * @return cDateTime The libkolabxml date/time object
     */
    public static function get_datetime($datetime, $tz = null, $dateonly = false, $dest_tz = null)
    {
        // use timezone information from datetime or global setting
        if (!$tz && $tz !== false) {
            if ($datetime instanceof DateTime)
                $tz = $datetime->getTimezone();
            if (!$tz)
                $tz = self::$timezone;
        }

        $result = new cDateTime();

        try {
            // got a unix timestamp (in UTC)
            if (is_numeric($datetime)) {
                $datetime = new DateTime('@'.$datetime, new DateTimeZone('UTC'));
                if ($tz) $datetime->setTimezone($tz);
            }
            else if (is_string($datetime) && strlen($datetime)) {
                $datetime = $tz ? new DateTime($datetime, $tz) : new DateTime($datetime);
            }
            else if ($datetime instanceof DateTime) {
                $datetime = clone $datetime;
            }
        }
        catch (Exception $e) {}

        if ($datetime instanceof DateTime) {
            if ($dest_tz instanceof DateTimeZone && $dest_tz !== $datetime->getTimezone()) {
                $datetime->setTimezone($dest_tz);
                $tz = $dest_tz;
            }

            $result->setDate($datetime->format('Y'), $datetime->format('n'), $datetime->format('j'));

            if ($dateonly) {
                // Dates should be always in local time only
                return $result;
            }

            $result->setTime($datetime->format('G'), $datetime->format('i'), $datetime->format('s'));

            // libkolabxml throws errors on some deprecated timezone names
            $utc_aliases = array('UTC', 'GMT', '+00:00', 'Z', 'Etc/GMT', 'Etc/UTC');

            if ($tz && in_array($tz->getName(), $utc_aliases)) {
                $result->setUTC(true);
            }
            else if ($tz !== false) {
                $tzid = $tz->getName();
                if (array_key_exists($tzid, self::$timezone_map))
                    $tzid = self::$timezone_map[$tzid];
                $result->setTimezone($tzid);
            }
        }

        return $result;
    }

    /**
     * Convert the given cDateTime into a PHP DateTime object
     *
     * @param cDateTime    The libkolabxml datetime object
     * @param DateTimeZone The timezone to convert the date to
     *
     * @return DateTime PHP datetime instance
     */
    public static function php_datetime($cdt, $dest_tz = null)
    {
        if (!is_object($cdt) || !$cdt->isValid()) {
            return null;
        }

        $d = new DateTime;
        $d->setTimezone($dest_tz ?: self::$timezone);

        try {
            if ($tzs = $cdt->timezone()) {
                $tz = new DateTimeZone($tzs);
                $d->setTimezone($tz);
            }
            else if ($cdt->isUTC()) {
                $d->setTimezone(new DateTimeZone('UTC'));
            }
        }
        catch (Exception $e) { }

        $d->setDate($cdt->year(), $cdt->month(), $cdt->day());

        if ($cdt->isDateOnly()) {
            $d->_dateonly = true;
            $d->setTime(12, 0, 0);  // set time to noon to avoid timezone troubles
        }
        else {
            $d->setTime($cdt->hour(), $cdt->minute(), $cdt->second());
        }

        return $d;
    }

    /**
     * Convert a libkolabxml vector to a PHP array
     *
     * @param object vector Object
     * @return array Indexed array containing vector elements
     */
    public static function vector2array($vec, $max = PHP_INT_MAX)
    {
        $arr = array();
        for ($i=0; $i < $vec->size() && $i < $max; $i++)
            $arr[] = $vec->get($i);
        return $arr;
    }

    /**
     * Build a libkolabxml vector (string) from a PHP array
     *
     * @param array Array with vector elements
     * @return object vectors
     */
    public static function array2vector($arr)
    {
        $vec = new vectors;
        foreach ((array)$arr as $val) {
            if (strlen($val))
                $vec->push($val);
        }
        return $vec;
    }

    /**
     * Parse the X-Kolab-Type header from MIME messages and return the object type in short form
     *
     * @param string X-Kolab-Type header value
     * @return string Kolab object type (contact,event,task,note,etc.)
     */
    public static function mime2object_type($x_kolab_type)
    {
        return preg_replace(
            array('/dictionary.[a-z.]+$/', '/contact.distlist$/'),
            array( 'dictionary',            'distribution-list'),
            substr($x_kolab_type, strlen(self::KTYPE_PREFIX))
        );
    }


    /**
     * Default constructor of all kolab_format_* objects
     */
    public function __construct($xmldata = null, $version = null)
    {
        $this->obj = new $this->objclass;
        $this->xmldata = $xmldata;

        if ($version)
            $this->version = $version;

        // use libkolab module if available
        if (class_exists('kolabobject'))
            $this->xmlobject = new XMLObject();
    }

    /**
     * Check for format errors after calling kolabformat::write*()
     *
     * @return boolean True if there were errors, False if OK
     */
    protected function format_errors()
    {
        $ret = $log = false;
        switch (kolabformat::error()) {
            case kolabformat::NoError:
                $ret = false;
                break;
            case kolabformat::Warning:
                $ret = false;
                $uid = is_object($this->obj) ? $this->obj->uid() : $this->data['uid'];
                $log = "Warning @ $uid";
                break;
            default:
                $ret = true;
                $log = "Error";
        }

        if ($log && !isset($this->formaterror)) {
            rcube::raise_error(array(
                'code' => 660,
                'type' => 'php',
                'file' => __FILE__,
                'line' => __LINE__,
                'message' => "kolabformat $log: " . kolabformat::errorMessage(),
            ), true);

            $this->formaterror = $ret;
        }

        return $ret;
    }

    /**
     * Save the last generated UID to the object properties.
     * Should be called after kolabformat::writeXXXX();
     */
    protected function update_uid()
    {
        // get generated UID
        if (!$this->data['uid']) {
            if ($this->xmlobject) {
                $this->data['uid'] = $this->xmlobject->getSerializedUID();
            }
            if (empty($this->data['uid'])) {
                $this->data['uid'] = kolabformat::getSerializedUID();
            }
            $this->obj->setUid($this->data['uid']);
        }
    }

    /**
     * Initialize libkolabxml object with cached xml data
     */
    protected function init()
    {
        if (!$this->loaded) {
            if ($this->xmldata) {
                $this->load($this->xmldata);
                $this->xmldata = null;
            }
            $this->loaded = true;
        }
    }

    /**
     * Get constant value for libkolab's version parameter
     *
     * @param float Version value to convert
     * @return int Constant value of either kolabobject::KolabV2 or kolabobject::KolabV3 or false if kolabobject module isn't available
     */
    protected function libversion($v = null)
    {
        if (class_exists('kolabobject')) {
            $version = $v ?: $this->version;
            if ($version <= '2.0')
                return kolabobject::KolabV2;
            else
                return kolabobject::KolabV3;
        }

        return false;
    }

    /**
     * Determine the correct libkolab(xml) wrapper function for the given call
     * depending on the available PHP modules
     */
    protected function libfunc($func)
    {
        if (is_array($func) || strpos($func, '::'))
            return $func;
        else if (class_exists('kolabobject'))
            return array($this->xmlobject, $func);
        else
            return 'kolabformat::' . $func;
    }

    /**
     * Direct getter for object properties
     */
    public function __get($var)
    {
        return $this->data[$var];
    }

    /**
     * Load Kolab object data from the given XML block
     *
     * @param string XML data
     * @return boolean True on success, False on failure
     */
    public function load($xml)
    {
        $this->formaterror = null;
        $read_func = $this->libfunc($this->read_func);

        if (is_array($read_func))
            $r = call_user_func($read_func, $xml, $this->libversion());
        else
            $r = call_user_func($read_func, $xml, false);

        if (is_resource($r))
            $this->obj = new $this->objclass($r);
        else if (is_a($r, $this->objclass))
            $this->obj = $r;

        $this->loaded = !$this->format_errors();
    }

    /**
     * Write object data to XML format
     *
     * @param float Format version to write
     * @return string XML data
     */
    public function write($version = null)
    {
        $this->formaterror = null;

        $this->init();
        $write_func = $this->libfunc($this->write_func);
        if (is_array($write_func))
            $this->xmldata = call_user_func($write_func, $this->obj, $this->libversion($version), self::PRODUCT_ID);
        else
            $this->xmldata = call_user_func($write_func, $this->obj, self::PRODUCT_ID);

        if (!$this->format_errors())
            $this->update_uid();
        else
            $this->xmldata = null;

        return $this->xmldata;
    }

    /**
     * Set properties to the kolabformat object
     *
     * @param array  Object data as hash array
     */
    public function set(&$object)
    {
        $this->init();

        if (!empty($object['uid']))
            $this->obj->setUid($object['uid']);

        // set some automatic values if missing
        if (method_exists($this->obj, 'setCreated')) {
            // Always set created date to workaround libkolabxml (>1.1.4) bug
            $created = $object['created'] ?: new DateTime('now');
            $created->setTimezone(new DateTimeZone('UTC')); // must be UTC
            $this->obj->setCreated(self::get_datetime($created));
            $object['created'] = $created;
        }

        $object['changed'] = new DateTime('now', new DateTimeZone('UTC'));
        $this->obj->setLastModified(self::get_datetime($object['changed']));

        // Save custom properties of the given object
        if (isset($object['x-custom']) && method_exists($this->obj, 'setCustomProperties')) {
            $vcustom = new vectorcs;
            foreach ((array)$object['x-custom'] as $cp) {
                if (is_array($cp))
                    $vcustom->push(new CustomProperty($cp[0], $cp[1]));
            }
            $this->obj->setCustomProperties($vcustom);
        }
        // load custom properties from XML for caching (#2238) if method exists (#3125)
        else if (method_exists($this->obj, 'customProperties')) {
            $object['x-custom'] = array();
            $vcustom = $this->obj->customProperties();
            for ($i=0; $i < $vcustom->size(); $i++) {
                $cp = $vcustom->get($i);
                $object['x-custom'][] = array($cp->identifier, $cp->value);
            }
        }
    }

    /**
     * Convert the Kolab object into a hash array data structure
     *
     * @param array Additional data for merge
     *
     * @return array  Kolab object data as hash array
     */
    public function to_array($data = array())
    {
        $this->init();

        // read object properties into local data object
        $object = array(
            'uid'     => $this->obj->uid(),
            'changed' => self::php_datetime($this->obj->lastModified()),
        );

        // not all container support the created property
        if (method_exists($this->obj, 'created')) {
            $object['created'] = self::php_datetime($this->obj->created());
        }

        // read custom properties
        if (method_exists($this->obj, 'customProperties')) {
            $vcustom = $this->obj->customProperties();
            for ($i=0; $i < $vcustom->size(); $i++) {
                $cp = $vcustom->get($i);
                $object['x-custom'][] = array($cp->identifier, $cp->value);
            }
        }

        // merge with additional data, e.g. attachments from the message
        if ($data) {
            foreach ($data as $idx => $value) {
                if (is_array($value)) {
                    $object[$idx] = array_merge((array)$object[$idx], $value);
                }
                else {
                    $object[$idx] = $value;
                }
            }
        }

        return $object;
    }

    /**
     * Object validation method to be implemented by derived classes
     */
    abstract public function is_valid();

    /**
     * Callback for kolab_storage_cache to get object specific tags to cache
     *
     * @return array List of tags to save in cache
     */
    public function get_tags()
    {
        return array();
    }

    /**
     * Callback for kolab_storage_cache to get words to index for fulltext search
     *
     * @return array List of words to save in cache
     */
    public function get_words()
    {
        return array();
    }

    /**
     * Utility function to extract object attachment data
     *
     * @param array Hash array reference to append attachment data into
     */
    public function get_attachments(&$object, $all = false)
    {
        $this->init();

        // handle attachments
        $vattach = $this->obj->attachments();
        for ($i=0; $i < $vattach->size(); $i++) {
            $attach = $vattach->get($i);

            // skip cid: attachments which are mime message parts handled by kolab_storage_folder
            if (substr($attach->uri(), 0, 4) != 'cid:' && $attach->label()) {
                $name    = $attach->label();
                $key     = $name . (isset($object['_attachments'][$name]) ? '.'.$i : '');
                $content = $attach->data();
                $object['_attachments'][$key] = array(
                    'id'       => 'i:'.$i,
                    'name'     => $name,
                    'mimetype' => $attach->mimetype(),
                    'size'     => strlen($content),
                    'content'  => $content,
                );
            }
            else if ($all && substr($attach->uri(), 0, 4) == 'cid:') {
                $key = $attach->uri();
                $object['_attachments'][$key] = array(
                    'id'       => $key,
                    'name'     => $attach->label(),
                    'mimetype' => $attach->mimetype(),
                );
            }
            else if (in_array(substr($attach->uri(), 0, 4), array('http','imap'))) {
                $object['links'][] = $attach->uri();
            }
        }
    }

    /**
     * Utility function to set attachment properties to the kolabformat object
     *
     * @param array  Object data as hash array
     * @param boolean True to always overwrite attachment information
     */
    protected function set_attachments($object, $write = true)
    {
        // save attachments
        $vattach = new vectorattachment;
        foreach ((array) $object['_attachments'] as $cid => $attr) {
            if (empty($attr))
                continue;
            $attach = new Attachment;
            $attach->setLabel((string)$attr['name']);
            $attach->setUri('cid:' . $cid, $attr['mimetype'] ?: 'application/octet-stream');
            if ($attach->isValid()) {
                $vattach->push($attach);
                $write = true;
            }
            else {
                rcube::raise_error(array(
                    'code' => 660,
                    'type' => 'php',
                    'file' => __FILE__,
                    'line' => __LINE__,
                    'message' => "Invalid attributes for attachment $cid: " . var_export($attr, true),
                ), true);
            }
        }

        foreach ((array) $object['links'] as $link) {
            $attach = new Attachment;
            $attach->setUri($link, 'unknown');
            $vattach->push($attach);
            $write = true;
        }

        if ($write) {
            $this->obj->setAttachments($vattach);
        }
    }

    /**
     * Unified way of updating/deleting attachments of edited object
     *
     * @param array $object Kolab object data
     * @param array $old    Old version of Kolab object
     */
    public static function merge_attachments(&$object, $old)
    {
        $object['_attachments'] = (array) $old['_attachments'];

        // delete existing attachment(s)
        if (!empty($object['deleted_attachments'])) {
            foreach ($object['_attachments'] as $idx => $att) {
                if ($object['deleted_attachments'] === true || in_array($att['id'], $object['deleted_attachments'])) {
                    $object['_attachments'][$idx] = false;
                }
            }
        }

        // in kolab_storage attachments are indexed by content-id
        foreach ((array) $object['attachments'] as $attachment) {
            $key = null;

            // Roundcube ID has nothing to do with the storage ID, remove it
            // for uploaded/new attachments
            // FIXME: Roundcube uses 'data', kolab_format uses 'content'
            if ($attachment['content'] || $attachment['path'] || $attachment['data']) {
                unset($attachment['id']);
            }

            if ($attachment['id']) {
                foreach ((array) $object['_attachments'] as $cid => $att) {
                    if ($att && $attachment['id'] == $att['id']) {
                        $key = $cid;
                    }
                }
            }
            else {
                // find attachment by name, so we can update it if exists
                // and make sure there are no duplicates
                foreach ((array) $object['_attachments'] as $cid => $att) {
                    if ($att && $attachment['name'] == $att['name']) {
                        $key = $cid;
                    }
                }
            }

            if ($key && $attachment['_deleted']) {
                $object['_attachments'][$key] = false;
            }
            // replace existing entry
            else if ($key) {
                $object['_attachments'][$key] = $attachment;
            }
            // append as new attachment
            else {
                $object['_attachments'][] = $attachment;
            }
        }

        unset($object['attachments']);
        unset($object['deleted_attachments']);
    }
}
