<?php

/**
 * iCalendar functions for the libcalendaring plugin
 *
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * Copyright (C) 2013-2015, Kolab Systems AG <contact@kolabsys.com>
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

use \Sabre\VObject;
use \Sabre\VObject\DateTimeParser;

/**
 * Class to parse and build vCalendar (iCalendar) files
 *
 * Uses the Sabre VObject library, version 3.x.
 *
 */
class libvcalendar implements Iterator
{
    private $timezone;
    private $attach_uri = null;
    private $prodid = '-//Roundcube libcalendaring//Sabre//Sabre VObject//EN';
    private $type_component_map = array('event' => 'VEVENT', 'task' => 'VTODO');
    private $attendee_keymap = array(
        'name'   => 'CN',
        'status' => 'PARTSTAT',
        'role'   => 'ROLE',
        'cutype' => 'CUTYPE',
        'rsvp'   => 'RSVP',
        'delegated-from'  => 'DELEGATED-FROM',
        'delegated-to'    => 'DELEGATED-TO',
        'schedule-status' => 'SCHEDULE-STATUS',
        'schedule-agent'  => 'SCHEDULE-AGENT',
        'sent-by'         => 'SENT-BY',
    );
    private $organizer_keymap = array(
        'name'            => 'CN',
        'schedule-status' => 'SCHEDULE-STATUS',
        'schedule-agent'  => 'SCHEDULE-AGENT',
        'sent-by'         => 'SENT-BY',
    );
    private $iteratorkey = 0;
    private $charset;
    private $forward_exceptions;
    private $vhead;
    private $fp;
    private $vtimezones = array();

    public $method;
    public $agent = '';
    public $objects = array();
    public $freebusy = array();


    /**
     * Default constructor
     */
    function __construct($tz = null)
    {
        $this->timezone = $tz;
        $this->prodid = '-//Roundcube libcalendaring ' . RCUBE_VERSION . '//Sabre//Sabre VObject ' . VObject\Version::VERSION . '//EN';
    }

    /**
     * Setter for timezone information
     */
    public function set_timezone($tz)
    {
        $this->timezone = $tz;
    }

    /**
     * Setter for URI template for attachment links
     */
    public function set_attach_uri($uri)
    {
        $this->attach_uri = $uri;
    }

    /**
     * Setter for a custom PRODID attribute
     */
    public function set_prodid($prodid)
    {
        $this->prodid = $prodid;
    }

    /**
     * Setter for a user-agent string to tweak input/output accordingly
     */
    public function set_agent($agent)
    {
        $this->agent = $agent;
    }

    /**
     * Free resources by clearing member vars
     */
    public function reset()
    {
        $this->vhead = '';
        $this->method = '';
        $this->objects = array();
        $this->freebusy = array();
        $this->vtimezones = array();
        $this->iteratorkey = 0;

        if ($this->fp) {
            fclose($this->fp);
            $this->fp = null;
        }
    }

    /**
    * Import events from iCalendar format
    *
    * @param  string vCalendar input
    * @param  string Input charset (from envelope)
    * @param  boolean True if parsing exceptions should be forwarded to the caller
    * @return array List of events extracted from the input
    */
    public function import($vcal, $charset = 'UTF-8', $forward_exceptions = false, $memcheck = true)
    {
        // TODO: convert charset to UTF-8 if other

        try {
            // estimate the memory usage and try to avoid fatal errors when allowed memory gets exhausted
            if ($memcheck) {
                $count = substr_count($vcal, 'BEGIN:VEVENT') + substr_count($vcal, 'BEGIN:VTODO');
                $expected_memory = $count * 70*1024;  // assume ~ 70K per event (empirically determined)

                if (!rcube_utils::mem_check($expected_memory)) {
                    throw new Exception("iCal file too big");
                }
            }

            $vobject = VObject\Reader::read($vcal, VObject\Reader::OPTION_FORGIVING | VObject\Reader::OPTION_IGNORE_INVALID_LINES);
            if ($vobject)
                return $this->import_from_vobject($vobject);
        }
        catch (Exception $e) {
            if ($forward_exceptions) {
                throw $e;
            }
            else {
                rcube::raise_error(array(
                    'code' => 600, 'type' => 'php',
                    'file' => __FILE__, 'line' => __LINE__,
                    'message' => "iCal data parse error: " . $e->getMessage()),
                    true, false);
            }
        }

        return array();
    }

    /**
    * Read iCalendar events from a file
    *
    * @param  string File path to read from
    * @param  string Input charset (from envelope)
    * @param  boolean True if parsing exceptions should be forwarded to the caller
    * @return array List of events extracted from the file
    */
    public function import_from_file($filepath, $charset = 'UTF-8', $forward_exceptions = false)
    {
        if ($this->fopen($filepath, $charset, $forward_exceptions)) {
            while ($this->_parse_next(false)) {
                // nop
            }

            fclose($this->fp);
            $this->fp = null;
        }

        return $this->objects;
    }

    /**
     * Open a file to read iCalendar events sequentially
     *
     * @param  string File path to read from
     * @param  string Input charset (from envelope)
     * @param  boolean True if parsing exceptions should be forwarded to the caller
     * @return boolean True if file contents are considered valid
     */
    public function fopen($filepath, $charset = 'UTF-8', $forward_exceptions = false)
    {
        $this->reset();

        // just to be sure...
        @ini_set('auto_detect_line_endings', true);

        $this->charset = $charset;
        $this->forward_exceptions = $forward_exceptions;
        $this->fp = fopen($filepath, 'r');

        // check file content first
        $begin = fread($this->fp, 1024);
        if (!preg_match('/BEGIN:VCALENDAR/i', $begin)) {
            return false;
        }

        fseek($this->fp, 0);
        return $this->_parse_next();
    }

    /**
     * Parse the next event/todo/freebusy object from the input file
     */
    private function _parse_next($reset = true)
    {
        if ($reset) {
            $this->iteratorkey = 0;
            $this->objects = array();
            $this->freebusy = array();
        }

        $next = $this->_next_component();
        $buffer = $next;

        // load the next component(s) too, as they could contain recurrence exceptions
        while (preg_match('/(RRULE|RECURRENCE-ID)[:;]/i', $next)) {
            $next = $this->_next_component();
            $buffer .= $next;
        }

        // parse the vevent block surrounded with the vcalendar heading
        if (strlen($buffer) && preg_match('/BEGIN:(VEVENT|VTODO|VFREEBUSY)/i', $buffer)) {
            try {
                $this->import($this->vhead . $buffer . "END:VCALENDAR", $this->charset, true, false);
            }
            catch (Exception $e) {
                if ($this->forward_exceptions) {
                    throw new VObject\ParseException($e->getMessage() . " in\n" . $buffer);
                }
                else {
                    // write the failing section to error log
                    rcube::raise_error(array(
                        'code' => 600, 'type' => 'php',
                        'file' => __FILE__, 'line' => __LINE__,
                        'message' => $e->getMessage() . " in\n" . $buffer),
                        true, false);
                }

                // advance to next
                return $this->_parse_next($reset);
            }

            return count($this->objects) > 0;
        }

        return false;
    }

    /**
     * Helper method to read the next calendar component from the file
     */
    private function _next_component()
    {
        $buffer = '';
        $vcalendar_head = false;
        while (($line = fgets($this->fp, 1024)) !== false) {
            // ignore END:VCALENDAR lines
            if (preg_match('/END:VCALENDAR/i', $line)) {
                continue;
            }
            // read vcalendar header (with timezone defintion)
            if (preg_match('/BEGIN:VCALENDAR/i', $line)) {
                $this->vhead = '';
                $vcalendar_head = true;
            }

            // end of VCALENDAR header part
            if ($vcalendar_head && preg_match('/BEGIN:(VEVENT|VTODO|VFREEBUSY)/i', $line)) {
                $vcalendar_head = false;
            }

            if ($vcalendar_head) {
                $this->vhead .= $line;
            }
            else {
                $buffer .= $line;
                if (preg_match('/END:(VEVENT|VTODO|VFREEBUSY)/i', $line)) {
                    break;
                }
            }
        }

        return $buffer;
    }

    /**
     * Import objects from an already parsed Sabre\VObject\Component object
     *
     * @param object Sabre\VObject\Component to read from
     * @return array List of events extracted from the file
     */
    public function import_from_vobject($vobject)
    {
        $seen = array();
        $exceptions = array();

        if ($vobject->name == 'VCALENDAR') {
            $this->method = strval($vobject->METHOD);
            $this->agent  = strval($vobject->PRODID);

            foreach ($vobject->getComponents() as $ve) {
                if ($ve->name == 'VEVENT' || $ve->name == 'VTODO') {
                    // convert to hash array representation
                    $object = $this->_to_array($ve);

                    // temporarily store this as exception
                    if (!empty($object['recurrence_date'])) {
                        $exceptions[] = $object;
                    }
                    else if (empty($seen[$object['uid']])) {
                        $seen[$object['uid']] = true;
                        $this->objects[] = $object;
                    }
                }
                else if ($ve->name == 'VFREEBUSY') {
                    $this->objects[] = $this->_parse_freebusy($ve);
                }
            }

            // add exceptions to the according master events
            foreach ($exceptions as $exception) {
                $uid = $exception['uid'];

                // make this exception the master
                if (empty($seen[$uid])) {
                    $seen[$uid] = true;
                    $this->objects[] = $exception;
                }
                else {
                    foreach ($this->objects as $i => $object) {
                        // add as exception to existing entry with a matching UID
                        if ($object['uid'] == $uid) {
                            $this->objects[$i]['exceptions'][] = $exception;

                            if (!empty($object['recurrence'])) {
                                $this->objects[$i]['recurrence']['EXCEPTIONS'] = &$this->objects[$i]['exceptions'];
                            }
                            break;
                        }
                    }
                }
            }
        }

        return $this->objects;
    }

    /**
     * Getter for free-busy periods
     */
    public function get_busy_periods()
    {
        $out = array();
        foreach ((array)$this->freebusy['periods'] as $period) {
            if ($period[2] != 'FREE') {
                $out[] = $period;
            }
        }

        return $out;
    }

    /**
     * Helper method to determine whether the connected client is an Apple device
     */
    private function is_apple()
    {
        return stripos($this->agent, 'Apple') !== false
            || stripos($this->agent, 'Mac OS X') !== false
            || stripos($this->agent, 'iOS/') !== false;
    }

    /**
     * Convert the given VEvent object to a libkolab compatible array representation
     *
     * @param object Vevent object to convert
     * @return array Hash array with object properties
     */
    private function _to_array($ve)
    {
        $event = array(
            'uid'     => self::convert_string($ve->UID),
            'title'   => self::convert_string($ve->SUMMARY),
            '_type'   => $ve->name == 'VTODO' ? 'task' : 'event',
            // set defaults
            'priority' => 0,
            'attendees' => array(),
            'x-custom' => array(),
        );

        // Catch possible exceptions when date is invalid (Bug #2144)
        // We can skip these fields, they aren't critical
        foreach (array('CREATED' => 'created', 'LAST-MODIFIED' => 'changed', 'DTSTAMP' => 'changed') as $attr => $field) {
            try {
                if (empty($event[$field]) && !empty($ve->{$attr})) {
                    $event[$field] = $ve->{$attr}->getDateTime();
                }
            } catch (Exception $e) {}
        }

        // map other attributes to internal fields
        foreach ($ve->children as $prop) {
            if (!($prop instanceof VObject\Property))
                continue;

            $value = strval($prop);

            switch ($prop->name) {
            case 'DTSTART':
            case 'DTEND':
            case 'DUE':
                $propmap = array('DTSTART' => 'start', 'DTEND' => 'end', 'DUE' => 'due');
                $event[$propmap[$prop->name]] = self::convert_datetime($prop);
                break;

            case 'TRANSP':
                $event['free_busy'] = strval($prop) == 'TRANSPARENT' ? 'free' : 'busy';
                break;

            case 'STATUS':
                if ($value == 'TENTATIVE')
                    $event['free_busy'] = 'tentative';
                else if ($value == 'CANCELLED')
                    $event['cancelled'] = true;
                else if ($value == 'COMPLETED')
                    $event['complete'] = 100;

                $event['status'] = $value;
                break;

            case 'COMPLETED':
                if (self::convert_datetime($prop)) {
                    $event['status'] = 'COMPLETED';
                    $event['complete'] = 100;
                }
                break;

            case 'PRIORITY':
                if (is_numeric($value))
                    $event['priority'] = $value;
                break;

            case 'RRULE':
                $params = !empty($event['recurrence']) && is_array($event['recurrence']) ? $event['recurrence'] : array();
                // parse recurrence rule attributes
                foreach ($prop->getParts() as $k => $v) {
                    $params[strtoupper($k)] = is_array($v) ? implode(',', $v) : $v;
                }
                if (!empty($params['UNTIL'])) {
                    $params['UNTIL'] = date_create($params['UNTIL']);
                }
                if (empty($params['INTERVAL'])) {
                    $params['INTERVAL'] = 1;
                }

                $event['recurrence'] = array_filter($params);
                break;

            case 'EXDATE':
                if (!empty($value)) {
                    $exdates = array_map(function($_) { return is_array($_) ? $_[0] : $_; }, self::convert_datetime($prop, true));
                    if (!empty($event['recurrence']['EXDATE'])) {
                        $event['recurrence']['EXDATE'] = array_merge($event['recurrence']['EXDATE'], $exdates);
                    }
                    else {
                        $event['recurrence']['EXDATE'] = $exdates;
                    }
                }
                break;

            case 'RDATE':
                if (!empty($value)) {
                    $rdates = array_map(function($_) { return is_array($_) ? $_[0] : $_; }, self::convert_datetime($prop, true));
                    if (!empty($event['recurrence']['RDATE'])) {
                        $event['recurrence']['RDATE'] = array_merge($event['recurrence']['RDATE'], $rdates);
                    }
                    else {
                        $event['recurrence']['RDATE'] = $rdates;
                    }
                }
                break;

            case 'RECURRENCE-ID':
                $event['recurrence_date'] = self::convert_datetime($prop);
                if ($prop->offsetGet('RANGE') == 'THISANDFUTURE' || $prop->offsetGet('THISANDFUTURE') !== null) {
                    $event['thisandfuture'] = true;
                }
                break;

            case 'RELATED-TO':
                $reltype = $prop->offsetGet('RELTYPE');
                if ($reltype == 'PARENT' || $reltype === null) {
                    $event['parent_id'] = $value;
                }
                break;

            case 'SEQUENCE':
                $event['sequence'] = intval($value);
                break;

            case 'PERCENT-COMPLETE':
                $event['complete'] = intval($value);
                break;

            case 'LOCATION':
            case 'DESCRIPTION':
            case 'URL':
            case 'COMMENT':
                $event[strtolower($prop->name)] = self::convert_string($prop);
                break;

            case 'CATEGORY':
            case 'CATEGORIES':
                if (!empty($event['categories'])) {
                    $event['categories'] = array_merge((array) $event['categories'], $prop->getParts());
                }
                else {
                    $event['categories'] = $prop->getParts();
                }
                break;

            case 'CLASS':
            case 'X-CALENDARSERVER-ACCESS':
                $event['sensitivity'] = strtolower($value);
                break;

            case 'X-MICROSOFT-CDO-BUSYSTATUS':
                if ($value == 'OOF') {
                    $event['free_busy'] = 'outofoffice';
                }
                else if (in_array($value, array('FREE', 'BUSY', 'TENTATIVE'))) {
                    $event['free_busy'] = strtolower($value);
                }
                break;

            case 'ATTENDEE':
            case 'ORGANIZER':
                $params = array('RSVP' => false);
                foreach ($prop->parameters() as $pname => $pvalue) {
                    switch ($pname) {
                        case 'RSVP': $params[$pname] = strtolower($pvalue) == 'true'; break;
                        case 'CN':   $params[$pname] = self::unescape($pvalue); break;
                        default:     $params[$pname] = strval($pvalue); break;
                    }
                }
                $attendee = self::map_keys($params, array_flip($this->attendee_keymap));
                $attendee['email'] = preg_replace('!^mailto:!i', '', $value);

                if ($prop->name == 'ORGANIZER') {
                    $attendee['role'] = 'ORGANIZER';
                    $attendee['status'] = 'ACCEPTED';
                    $event['organizer'] = $attendee;

                    if (array_key_exists('schedule-agent', $attendee)) {
                        $schedule_agent = $attendee['schedule-agent'];
                    }
                }
                else if (empty($event['organizer']) || $attendee['email'] != $event['organizer']['email']) {
                    $event['attendees'][] = $attendee;
                }
                break;

            case 'ATTACH':
                $params = self::parameters_array($prop);
                if (substr($value, 0, 4) == 'http' && !strpos($value, ':attachment:')) {
                    $event['links'][] = $value;
                }
                else if (strlen($value) && strtoupper($params['VALUE']) == 'BINARY') {
                    $attachment = self::map_keys($params, array('FMTTYPE' => 'mimetype', 'X-LABEL' => 'name', 'X-APPLE-FILENAME' => 'name'));
                    $attachment['data'] = $value;
                    $attachment['size'] = strlen($value);
                    $event['attachments'][] = $attachment;
                }
                break;

            default:
                if (substr($prop->name, 0, 2) == 'X-')
                    $event['x-custom'][] = array($prop->name, strval($value));
                break;
            }
        }

        // check DURATION property if no end date is set
        if (empty($event['end']) && $ve->DURATION) {
            try {
                $duration = new DateInterval(strval($ve->DURATION));
                $end = clone $event['start'];
                $end->add($duration);
                $event['end'] = $end;
            }
            catch (\Exception $e) {
                trigger_error(strval($e), E_USER_WARNING);
            }
        }

        // validate event dates
        if ($event['_type'] == 'event') {
            $event['allday'] = !empty($event['start']->_dateonly);

            // events may lack the DTEND property, set it to DTSTART (RFC5545 3.6.1)
            if (empty($event['end'])) {
                $event['end'] = clone $event['start'];
            }
            // shift end-date by one day (except Thunderbird)
            else if ($event['allday'] && is_object($event['end'])) {
                $event['end']->sub(new \DateInterval('PT23H'));
            }

            // sanity-check and fix end date
            if (!empty($event['end']) && $event['end'] < $event['start']) {
                $event['end'] = clone $event['start'];
            }
        }

        // make organizer part of the attendees list for compatibility reasons
        if (!empty($event['organizer']) && is_array($event['attendees']) && $event['_type'] == 'event') {
            array_unshift($event['attendees'], $event['organizer']);
        }

        // find alarms
        foreach ($ve->select('VALARM') as $valarm) {
            $action  = 'DISPLAY';
            $trigger = null;
            $alarm   = array();

            foreach ($valarm->children as $prop) {
                $value = strval($prop);

                switch ($prop->name) {
                case 'TRIGGER':
                    foreach ($prop->parameters as $param) {
                        if ($param->name == 'VALUE' && $param->getValue() == 'DATE-TIME') {
                            $trigger = '@' . $prop->getDateTime()->format('U');
                            $alarm['trigger'] = $prop->getDateTime();
                        }
                        else if ($param->name == 'RELATED') {
                            $alarm['related'] = $param->getValue();
                        }
                    }
                    if (!$trigger && ($values = libcalendaring::parse_alarm_value($value))) {
                        $trigger = $values[2];
                    }

                    if (empty($alarm['trigger'])) {
                        $alarm['trigger'] = rtrim(preg_replace('/([A-Z])0[WDHMS]/', '\\1', $value), 'T');
                        // if all 0-values have been stripped, assume 'at time'
                        if ($alarm['trigger'] == 'P') {
                            $alarm['trigger'] = 'PT0S';
                        }
                    }
                    break;

                case 'ACTION':
                    $action = $alarm['action'] = strtoupper($value);
                    break;

                case 'SUMMARY':
                case 'DESCRIPTION':
                case 'DURATION':
                    $alarm[strtolower($prop->name)] = self::convert_string($prop);
                    break;

                case 'REPEAT':
                    $alarm['repeat'] = intval($value);
                    break;

                case 'ATTENDEE':
                    $alarm['attendees'][] = preg_replace('!^mailto:!i', '', $value);
                    break;

                case 'ATTACH':
                    $params = self::parameters_array($prop);
                    if (strlen($value) && (preg_match('/^[a-z]+:/', $value) || strtoupper($params['VALUE']) == 'URI')) {
                        // we only support URI-type of attachments here
                        $alarm['uri'] = $value;
                    }
                    break;
                }
            }

            if ($action != 'NONE') {
                // store first alarm in legacy property
                if ($trigger && empty($event['alarms'])) {
                    $event['alarms'] = $trigger . ':' . $action;
                }

                if (!empty($alarm['trigger'])) {
                    $event['valarms'][] = $alarm;
                }
            }
        }

        // assign current timezone to event start/end
        if (!empty($event['start']) && $event['start'] instanceof DateTime) {
            $this->_apply_timezone($event['start']);
        }
        else {
            unset($event['start']);
        }

        if (!empty($event['end']) && $event['end'] instanceof DateTime) {
            $this->_apply_timezone($event['end']);
        }
        else {
            unset($event['end']);
        }

        // some iTip CANCEL messages only contain the start date
        if (empty($event['end']) && !empty($event['start']) && $this->method == 'CANCEL') {
            $event['end'] = clone $event['start'];
        }

        // T2531: Remember SCHEDULE-AGENT in custom property to properly
        // support event updates via CalDAV when SCHEDULE-AGENT=CLIENT is used
        if (isset($schedule_agent)) {
            $event['x-custom'][] = array('SCHEDULE-AGENT', $schedule_agent);
        }

        // minimal validation
        if (empty($event['uid']) || ($event['_type'] == 'event' && empty($event['start']) != empty($event['end']))) {
            throw new VObject\ParseException('Object validation failed: missing mandatory object properties');
        }

        return $event;
    }

    /**
     * Apply user timezone to DateTime object
     */
    private function _apply_timezone(&$date)
    {
        if (empty($this->timezone)) {
            return;
        }

        // For date-only we'll keep the date and time intact
        if (!empty($date->_dateonly)) {
            $dt = new DateTime(null, $this->timezone);
            $dt->setDate($date->format('Y'), $date->format('n'), $date->format('j'));
            $dt->setTime($date->format('G'), $date->format('i'), 0);
            $date = $dt;
        }
        else {
            $date->setTimezone($this->timezone);
        }
    }

    /**
     * Parse the given vfreebusy component into an array representation
     */
    private function _parse_freebusy($ve)
    {
        $this->freebusy = array('_type' => 'freebusy', 'periods' => array());
        $seen = array();

        foreach ($ve->children as $prop) {
            if (!($prop instanceof VObject\Property))
                continue;

            $value = strval($prop);

            switch ($prop->name) {
            case 'CREATED':
            case 'LAST-MODIFIED':
            case 'DTSTAMP':
            case 'DTSTART':
            case 'DTEND':
                $propmap = array(
                    'DTSTART' => 'start',
                    'DTEND' => 'end',
                    'CREATED' => 'created',
                    'LAST-MODIFIED' => 'changed',
                    'DTSTAMP' => 'changed'
                );
                $this->freebusy[$propmap[$prop->name]] = self::convert_datetime($prop);
                break;

            case 'ORGANIZER':
                $this->freebusy['organizer'] = preg_replace('!^mailto:!i', '', $value);
                break;

            case 'FREEBUSY':
                // The freebusy component can hold more than 1 value, separated by commas.
                $periods = explode(',', $value);
                $fbtype = strval($prop['FBTYPE']) ?: 'BUSY';

                // skip dupes
                if (!empty($seen[$value.':'.$fbtype])) {
                    break;
                }

                $seen[$value.':'.$fbtype] = true;

                foreach ($periods as $period) {
                    // Every period is formatted as [start]/[end]. The start is an
                    // absolute UTC time, the end may be an absolute UTC time, or
                    // duration (relative) value.
                    list($busyStart, $busyEnd) = explode('/', $period);

                    $busyStart = DateTimeParser::parse($busyStart);
                    $busyEnd = DateTimeParser::parse($busyEnd);
                    if ($busyEnd instanceof \DateInterval) {
                        $tmp = clone $busyStart;
                        $tmp->add($busyEnd);
                        $busyEnd = $tmp;
                    }

                    if ($busyEnd && $busyEnd > $busyStart)
                        $this->freebusy['periods'][] = array($busyStart, $busyEnd, $fbtype);
                }
                break;

            case 'COMMENT':
                $this->freebusy['comment'] = $value;
            }
        }

        return $this->freebusy;
    }

    /**
     *
     */
    public static function convert_string($prop)
    {
        return strval($prop);
    }

    /**
     *
     */
    public static function unescape($prop)
    {
        return str_replace('\,', ',', strval($prop));
    }

    /**
     * Helper method to correctly interpret an all-day date value
     */
    public static function convert_datetime($prop, $as_array = false)
    {
        if (empty($prop)) {
            return $as_array ? array() : null;
        }
        else if ($prop instanceof VObject\Property\iCalendar\DateTime) {
            if (count($prop->getDateTimes()) > 1) {
                $dt = array();
                $dateonly = !$prop->hasTime();
                foreach ($prop->getDateTimes() as $item) {
                    $item->_dateonly = $dateonly;
                    $dt[] = $item;
                }
            }
            else {
                $dt = $prop->getDateTime();
                if (!$prop->hasTime()) {
                    $dt->_dateonly = true;
                }
            }
        }
        else if ($prop instanceof VObject\Property\iCalendar\Period) {
            $dt = array();
            foreach ($prop->getParts() as $val) {
                try {
                    list($start, $end) = explode('/', $val);
                    $start = DateTimeParser::parseDateTime($start);

                    // This is a duration value.
                    if ($end[0] === 'P') {
                        $dur = DateTimeParser::parseDuration($end);
                        $end = clone $start;
                        $end->add($dur);
                    }
                    else {
                        $end = DateTimeParser::parseDateTime($end);
                    }
                    $dt[] = array($start, $end);
                }
                catch (Exception $e) {
                    // ignore single date parse errors
                }
            }
        }
        else if ($prop instanceof \DateTime) {
            $dt = $prop;
        }

        // force return value to array if requested
        if ($as_array && !is_array($dt)) {
            $dt = empty($dt) ? array() : array($dt);
        }

        return $dt;
    }


    /**
     * Create a Sabre\VObject\Property instance from a PHP DateTime object
     *
     * @param object  VObject\Document parent node to create property for
     * @param string  Property name
     * @param object  DateTime
     * @param boolean Set as UTC date
     * @param boolean Set as VALUE=DATE property
     */
    public function datetime_prop($cal, $name, $dt, $utc = false, $dateonly = null, $set_type = false)
    {
        if ($utc) {
            $dt->setTimeZone(new \DateTimeZone('UTC'));
            $is_utc = true;
        }
        else {
            $is_utc = ($tz = $dt->getTimezone()) && in_array($tz->getName(), array('UTC','GMT','Z'));
        }
        $is_dateonly = $dateonly === null ? !empty($dt->_dateonly) : (bool) $dateonly;
        $vdt = $cal->createProperty($name, $dt, null, $is_dateonly ? 'DATE' : 'DATE-TIME');

        if ($is_dateonly) {
            $vdt['VALUE'] = 'DATE';
        }
        else if ($set_type) {
            $vdt['VALUE'] = 'DATE-TIME';
        }

        // register timezone for VTIMEZONE block
        if (!$is_utc && !$dateonly && $tz && ($tzname = $tz->getName())) {
            $ts = $dt->format('U');
            if (!empty($this->vtimezones[$tzname])) {
                $this->vtimezones[$tzname][0] = min($this->vtimezones[$tzname][0], $ts);
                $this->vtimezones[$tzname][1] = max($this->vtimezones[$tzname][1], $ts);
            }
            else {
                $this->vtimezones[$tzname] = array($ts, $ts);
            }
        }

        return $vdt;
    }

    /**
     * Copy values from one hash array to another using a key-map
     */
    public static function map_keys($values, $map)
    {
        $out = array();
        foreach ($map as $from => $to) {
            if (isset($values[$from]))
                $out[$to] = is_array($values[$from]) ? join(',', $values[$from]) : $values[$from];
        }
        return $out;
    }

    /**
     *
     */
    private static function parameters_array($prop)
    {
        $params = array();
        foreach ($prop->parameters() as $name => $value) {
            $params[strtoupper($name)] = strval($value);
        }
        return $params;
    }


    /**
     * Export events to iCalendar format
     *
     * @param  array   Events as array
     * @param  string  VCalendar method to advertise
     * @param  boolean Directly send data to stdout instead of returning
     * @param  callable Callback function to fetch attachment contents, false if no attachment export
     * @param  boolean Add VTIMEZONE block with timezone definitions for the included events
     * @return string  Events in iCalendar format (http://tools.ietf.org/html/rfc5545)
     */
    public function export($objects, $method = null, $write = false, $get_attachment = false, $with_timezones = true)
    {
        $this->method = $method;

        // encapsulate in VCALENDAR container
        $vcal = new VObject\Component\VCalendar();
        $vcal->VERSION = '2.0';
        $vcal->PRODID = $this->prodid;
        $vcal->CALSCALE = 'GREGORIAN';

        if (!empty($method)) {
            $vcal->METHOD = $method;
        }

        // write vcalendar header
        if ($write) {
            echo preg_replace('/END:VCALENDAR[\r\n]*$/m', '', $vcal->serialize());
        }

        foreach ($objects as $object) {
            $this->_to_ical($object, !$write?$vcal:false, $get_attachment);
        }

        // include timezone information
        if ($with_timezones || !empty($method)) {
            foreach ($this->vtimezones as $tzid => $range) {
                $vt = self::get_vtimezone($tzid, $range[0], $range[1], $vcal);
                if (empty($vt)) {
                    continue;  // no timezone information found
                }

                if ($write) {
                    echo $vt->serialize();
                }
                else {
                    $vcal->add($vt);
                }
            }
        }

        if ($write) {
            echo "END:VCALENDAR\r\n";
            return true;
        }
        else {
            return $vcal->serialize();
        }
    }

    /**
     * Build a valid iCal format block from the given event
     *
     * @param  array    Hash array with event/task properties from libkolab
     * @param  object   VCalendar object to append event to or false for directly sending data to stdout
     * @param  callable Callback function to fetch attachment contents, false if no attachment export
     * @param  object   RECURRENCE-ID property when serializing a recurrence exception
     */
    private function _to_ical($event, $vcal, $get_attachment, $recurrence_id = null)
    {
        $type = !empty($event['_type']) ? $event['_type'] : 'event';

        $cal = $vcal ?: new VObject\Component\VCalendar();
        $ve = $cal->create($this->type_component_map[$type]);
        $ve->UID = $event['uid'];

        // set DTSTAMP according to RFC 5545, 3.8.7.2.
        $dtstamp = !empty($event['changed']) && empty($this->method) ? $event['changed'] : new DateTime('now', new \DateTimeZone('UTC'));
        $ve->DTSTAMP = $this->datetime_prop($cal, 'DTSTAMP', $dtstamp, true);

        // all-day events end the next day
        if (!empty($event['allday']) && !empty($event['end'])) {
            $event['end'] = clone $event['end'];
            $event['end']->add(new \DateInterval('P1D'));
            $event['end']->_dateonly = true;
        }
        if (!empty($event['created'])) {
            $ve->add($this->datetime_prop($cal, 'CREATED', $event['created'], true));
        }
        if (!empty($event['changed'])) {
            $ve->add($this->datetime_prop($cal, 'LAST-MODIFIED', $event['changed'], true));
        }
        if (!empty($event['start'])) {
            $ve->add($this->datetime_prop($cal, 'DTSTART', $event['start'], false, !empty($event['allday'])));
        }
        if (!empty($event['end'])) {
            $ve->add($this->datetime_prop($cal, 'DTEND', $event['end'], false, !empty($event['allday'])));
        }
        if (!empty($event['due'])) {
            $ve->add($this->datetime_prop($cal, 'DUE', $event['due'], false));
        }

        // we're exporting a recurrence instance only
        if (!$recurrence_id && !empty($event['recurrence_date']) && $event['recurrence_date'] instanceof DateTime) {
            $recurrence_id = $this->datetime_prop($cal, 'RECURRENCE-ID', $event['recurrence_date'], false, !empty($event['allday']));
            if (!empty($event['thisandfuture'])) {
                $recurrence_id->add('RANGE', 'THISANDFUTURE');
            }
        }

        if ($recurrence_id) {
            $ve->add($recurrence_id);
        }

        $ve->add('SUMMARY', $event['title']);

        if (!empty($event['location'])) {
            $ve->add($this->is_apple() ? new vobject_location_property($cal, 'LOCATION', $event['location']) : $cal->create('LOCATION', $event['location']));
        }
        if (!empty($event['description'])) {
            $ve->add('DESCRIPTION', strtr($event['description'], array("\r\n" => "\n", "\r" => "\n"))); // normalize line endings
        }

        if (isset($event['sequence'])) {
            $ve->add('SEQUENCE', $event['sequence']);
        }

        if (!empty($event['recurrence']) && !$recurrence_id) {
            $exdates = $rdates = null;
            if (isset($event['recurrence']['EXDATE'])) {
                $exdates = $event['recurrence']['EXDATE'];
                unset($event['recurrence']['EXDATE']);  // don't serialize EXDATEs into RRULE value
            }
            if (isset($event['recurrence']['RDATE'])) {
                $rdates = $event['recurrence']['RDATE'];
                unset($event['recurrence']['RDATE']);  // don't serialize RDATEs into RRULE value
            }

            if (!empty($event['recurrence']['FREQ'])) {
                $ve->add('RRULE', libcalendaring::to_rrule($event['recurrence'], !empty($event['allday'])));
            }

            // add EXDATEs each one per line (for Thunderbird Lightning)
            if (is_array($exdates)) {
                foreach ($exdates as $exdate) {
                    if ($exdate instanceof DateTime) {
                        $ve->add($this->datetime_prop($cal, 'EXDATE', $exdate));
                    }
                }
            }
            // add RDATEs
            if (is_array($rdates)) {
                foreach ($rdates as $rdate) {
                    $ve->add($this->datetime_prop($cal, 'RDATE', $rdate));
                }
            }
        }

        if (!empty($event['categories'])) {
            $cat = $cal->create('CATEGORIES');
            $cat->setParts((array)$event['categories']);
            $ve->add($cat);
        }

        if (!empty($event['free_busy'])) {
            $ve->add('TRANSP', $event['free_busy'] == 'free' ? 'TRANSPARENT' : 'OPAQUE');

            // for Outlook clients we provide the X-MICROSOFT-CDO-BUSYSTATUS property
            if (stripos($this->agent, 'outlook') !== false) {
                $ve->add('X-MICROSOFT-CDO-BUSYSTATUS', $event['free_busy'] == 'outofoffice' ? 'OOF' : strtoupper($event['free_busy']));
            }
        }

        if (!empty($event['priority'])) {
            $ve->add('PRIORITY', $event['priority']);
        }

        if (!empty($event['cancelled'])) {
            $ve->add('STATUS', 'CANCELLED');
        }
        else if (!empty($event['free_busy']) && $event['free_busy'] == 'tentative') {
            $ve->add('STATUS', 'TENTATIVE');
        }
        else if (!empty($event['complete']) && $event['complete'] == 100) {
            $ve->add('STATUS', 'COMPLETED');
        }
        else if (!empty($event['status'])) {
            $ve->add('STATUS', $event['status']);
        }

        if (!empty($event['sensitivity']))
            $ve->add('CLASS', strtoupper($event['sensitivity']));

        if (!empty($event['complete'])) {
            $ve->add('PERCENT-COMPLETE', intval($event['complete']));
        }

        // Apple iCal and BusyCal required the COMPLETED date to be set in order to consider a task complete
        if (
            (!empty($event['status']) && $event['status'] == 'COMPLETED')
            || (!empty($event['complete']) && $event['complete'] == 100)
        ) {
            $completed = !empty($event['changed']) ? $event['changed'] : new DateTime('now - 1 hour');
            $ve->add($this->datetime_prop($cal, 'COMPLETED', $completed, true));
        }

        if (!empty($event['valarms'])) {
            foreach ($event['valarms'] as $alarm) {
                $va = $cal->createComponent('VALARM');
                $va->action = $alarm['action'];
                if ($alarm['trigger'] instanceof DateTime) {
                    $va->add($this->datetime_prop($cal, 'TRIGGER', $alarm['trigger'], true, null, true));
                }
                else {
                    $alarm_props = array();
                    if (!empty($alarm['related']) && strtoupper($alarm['related']) == 'END') {
                        $alarm_props['RELATED'] = 'END';
                    }
                    $va->add('TRIGGER', $alarm['trigger'], $alarm_props);
                }

                if (!empty($alarm['action']) && $alarm['action'] == 'EMAIL') {
                    if (!empty($alarm['attendees'])) {
                        foreach ((array) $alarm['attendees'] as $attendee) {
                            $va->add('ATTENDEE', 'mailto:' . $attendee);
                        }
                    }
                }
                if (!empty($alarm['description'])) {
                    $va->add('DESCRIPTION', $alarm['description']);
                }
                if (!empty($alarm['summary'])) {
                    $va->add('SUMMARY', $alarm['summary']);
                }
                if (!empty($alarm['duration'])) {
                    $va->add('DURATION', $alarm['duration']);
                    $va->add('REPEAT', !empty($alarm['repeat']) ? intval($alarm['repeat']) : 0);
                }
                if (!empty($alarm['uri'])) {
                    $va->add('ATTACH', $alarm['uri'], array('VALUE' => 'URI'));
                }
                $ve->add($va);
            }
        }
        // legacy support
        else if (!empty($event['alarms'])) {
            $va = $cal->createComponent('VALARM');
            list($trigger, $va->action) = explode(':', $event['alarms']);
            $val = libcalendaring::parse_alarm_value($trigger);
            if (!empty($val[3])) {
                $va->add('TRIGGER', $val[3]);
            }
            else if ($val[0] instanceof DateTime) {
                $va->add($this->datetime_prop($cal, 'TRIGGER', $val[0], true, null, true));
            }
            $ve->add($va);
        }

        // Find SCHEDULE-AGENT
        if (!empty($event['x-custom'])) {
            foreach ((array) $event['x-custom'] as $prop) {
                if ($prop[0] === 'SCHEDULE-AGENT') {
                    $schedule_agent = $prop[1];
                }
            }
        }

        if (!empty($event['attendees'])) {
            foreach ((array) $event['attendees'] as $attendee) {
                if ($attendee['role'] == 'ORGANIZER') {
                    if (empty($event['organizer']))
                        $event['organizer'] = $attendee;
                }
                else if (!empty($attendee['email'])) {
                    if (isset($attendee['rsvp'])) {
                        $attendee['rsvp'] = $attendee['rsvp'] ? 'TRUE' : null;
                    }

                    $mailto   = $attendee['email'];
                    $attendee = array_filter(self::map_keys($attendee, $this->attendee_keymap));

                    if (isset($schedule_agent) && !isset($attendee['SCHEDULE-AGENT'])) {
                        $attendee['SCHEDULE-AGENT'] = $schedule_agent;
                    }

                    $ve->add('ATTENDEE', 'mailto:' . $mailto, $attendee);
                }
            }
        }

        if (!empty($event['organizer'])) {
            $organizer = array_filter(self::map_keys($event['organizer'], $this->organizer_keymap));

            if (isset($schedule_agent) && !isset($organizer['SCHEDULE-AGENT'])) {
                $organizer['SCHEDULE-AGENT'] = $schedule_agent;
            }

            $ve->add('ORGANIZER', 'mailto:' . $event['organizer']['email'], $organizer);
        }

        if (!empty($event['url'])) {
            foreach ((array) $event['url'] as $url) {
                if (!empty($url)) {
                    $ve->add('URL', $url);
                }
            }
        }

        if (!empty($event['parent_id'])) {
            $ve->add('RELATED-TO', $event['parent_id'], array('RELTYPE' => 'PARENT'));
        }

        if (!empty($event['comment'])) {
            $ve->add('COMMENT', $event['comment']);
        }

        $memory_limit = parse_bytes(ini_get('memory_limit'));

        // export attachments
        if (!empty($event['attachments'])) {
            foreach ((array)$event['attachments'] as $attach) {
                // check available memory and skip attachment export if we can't buffer it
                // @todo: use rcube_utils::mem_check()
                if (is_callable($get_attachment) && $memory_limit > 0 && ($memory_used = function_exists('memory_get_usage') ? memory_get_usage() : 16*1024*1024)
                    && $attach['size'] && $memory_used + $attach['size'] * 3 > $memory_limit) {
                    continue;
                }
                // embed attachments using the given callback function
                if (is_callable($get_attachment) && ($data = call_user_func($get_attachment, $attach['id'], $event))) {
                    // embed attachments for iCal
                    $ve->add('ATTACH',
                        $data,
                        array_filter(array('VALUE' => 'BINARY', 'ENCODING' => 'BASE64', 'FMTTYPE' => $attach['mimetype'], 'X-LABEL' => $attach['name'])));
                    unset($data);  // attempt to free memory
                }
                // list attachments as absolute URIs
                else if (!empty($this->attach_uri)) {
                    $ve->add('ATTACH',
                        strtr($this->attach_uri, array(
                            '{{id}}'       => urlencode($attach['id']),
                            '{{name}}'     => urlencode($attach['name']),
                            '{{mimetype}}' => urlencode($attach['mimetype']),
                        )),
                        array('FMTTYPE' => $attach['mimetype'], 'VALUE' => 'URI'));
                }
            }
        }

        if (!empty($event['links'])) {
            foreach ((array) $event['links'] as $uri) {
                $ve->add('ATTACH', $uri);
            }
        }

        // add custom properties
        if (!empty($event['x-custom'])) {
            foreach ((array) $event['x-custom'] as $prop) {
                $ve->add($prop[0], $prop[1]);
            }
        }

        // append to vcalendar container
        if ($vcal) {
            $vcal->add($ve);
        }
        else {   // serialize and send to stdout
            echo $ve->serialize();
        }

        // append recurrence exceptions
        if (!empty($event['recurrence']) && !empty($event['recurrence']['EXCEPTIONS'])) {
            foreach ($event['recurrence']['EXCEPTIONS'] as $ex) {
                $exdate = !empty($ex['recurrence_date']) ? $ex['recurrence_date'] : $ex['start'];
                $recurrence_id = $this->datetime_prop($cal, 'RECURRENCE-ID', $exdate, false, !empty($event['allday']));
                if (!empty($ex['thisandfuture'])) {
                    $recurrence_id->add('RANGE', 'THISANDFUTURE');
                }
                $this->_to_ical($ex, $vcal, $get_attachment, $recurrence_id);
            }
        }
    }

    /**
     * Returns a VTIMEZONE component for a Olson timezone identifier
     * with daylight transitions covering the given date range.
     *
     * @param string Timezone ID as used in PHP's Date functions
     * @param integer Unix timestamp with first date/time in this timezone
     * @param integer Unix timestap with last date/time in this timezone
     * @param VObject\Component\VCalendar Optional VCalendar component
     *
     * @return mixed A Sabre\VObject\Component object representing a VTIMEZONE definition
     *               or false if no timezone information is available
     */
    public static function get_vtimezone($tzid, $from = 0, $to = 0, $cal = null)
    {
        // TODO: Consider using tzurl.org database for better interoperability e.g. with Outlook

        if (!$from) $from = time();
        if (!$to)   $to = $from;
        if (!$cal)  $cal = new VObject\Component\VCalendar();

        if (is_string($tzid)) {
            try {
                $tz = new \DateTimeZone($tzid);
            }
            catch (\Exception $e) {
                return false;
            }
        }
        else if (is_a($tzid, '\\DateTimeZone')) {
            $tz = $tzid;
        }

        if (empty($tz) || !is_a($tz, '\\DateTimeZone')) {
            return false;
        }

        $year = 86400 * 360;
        $transitions = $tz->getTransitions($from - $year, $to + $year);

        // Make sure VTIMEZONE contains at least one STANDARD/DAYLIGHT component
        // when there's only one transition in specified time period (T5626)
        if (count($transitions) == 1) {
            // Get more transitions and use OFFSET from the previous to last
            $more_transitions = $tz->getTransitions(0, $to + $year);
            if (count($more_transitions) > 1) {
                $index  = count($more_transitions) - 2;
                $tzfrom = $more_transitions[$index]['offset'] / 3600;
            }
        }

        $vt = $cal->createComponent('VTIMEZONE');
        $vt->TZID = $tz->getName();

        $std = null; $dst = null;
        foreach ($transitions as $i => $trans) {
            $cmp = null;

            if (!isset($tzfrom)) {
                $tzfrom = $trans['offset'] / 3600;
                continue;
            }

            if ($trans['isdst']) {
                $t_dst = $trans['ts'];
                $dst = $cal->createComponent('DAYLIGHT');
                $cmp = $dst;
            }
            else {
                $t_std = $trans['ts'];
                $std = $cal->createComponent('STANDARD');
                $cmp = $std;
            }

            if ($cmp) {
                $dt = new DateTime($trans['time']);
                $offset = $trans['offset'] / 3600;

                $cmp->DTSTART = $dt->format('Ymd\THis');
                $cmp->TZOFFSETFROM = sprintf('%+03d%02d', floor($tzfrom), ($tzfrom - floor($tzfrom)) * 60);
                $cmp->TZOFFSETTO   = sprintf('%+03d%02d', floor($offset), ($offset - floor($offset)) * 60);

                if (!empty($trans['abbr'])) {
                    $cmp->TZNAME = $trans['abbr'];
                }

                $tzfrom = $offset;
                $vt->add($cmp);
            }

            // we covered the entire date range
            if ($std && $dst && min($t_std, $t_dst) < $from && max($t_std, $t_dst) > $to) {
                break;
            }
        }

        // add X-MICROSOFT-CDO-TZID if available
        $microsoftExchangeMap = array_flip(VObject\TimeZoneUtil::$microsoftExchangeMap);
        if (array_key_exists($tz->getName(), $microsoftExchangeMap)) {
            $vt->add('X-MICROSOFT-CDO-TZID', $microsoftExchangeMap[$tz->getName()]);
        }

        return $vt;
    }


    /*** Implement PHP 5 Iterator interface to make foreach work ***/

    function current()
    {
        return $this->objects[$this->iteratorkey];
    }

    function key()
    {
        return $this->iteratorkey;
    }

    function next()
    {
        $this->iteratorkey++;

        // read next chunk if we're reading from a file
        if (empty($this->objects[$this->iteratorkey]) && $this->fp) {
            $this->_parse_next(true);
        }

        return $this->valid();
    }

    function rewind()
    {
        $this->iteratorkey = 0;
    }

    function valid()
    {
        return !empty($this->objects[$this->iteratorkey]);
    }

}


/**
 * Override Sabre\VObject\Property\Text that quotes commas in the location property
 * because Apple clients treat that property as list.
 */
class vobject_location_property extends VObject\Property\Text
{
    /**
     * List of properties that are considered 'structured'.
     *
     * @var array
     */
    protected $structuredValues = array(
        // vCard
        'N',
        'ADR',
        'ORG',
        'GENDER',
        'LOCATION',
        // iCalendar
        'REQUEST-STATUS',
    );
}
