<?php

/**
 * Kolab Event model class
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

class kolab_format_event extends kolab_format_xcal
{
    public $CTYPEv2 = 'application/x-vnd.kolab.event';

    public static $scheduling_properties = array('start', 'end', 'allday', 'recurrence', 'location', 'status', 'cancelled');

    protected $objclass = 'Event';
    protected $read_func = 'readEvent';
    protected $write_func = 'writeEvent';

    /**
     * Default constructor
     */
    function __construct($data = null, $version = 3.0)
    {
        parent::__construct(is_string($data) ? $data : null, $version);

        // got an Event object as argument
        if (is_object($data) && is_a($data, $this->objclass)) {
            $this->obj = $data;
            $this->loaded = true;
        }

        // copy static property overriden by this class
        $this->_scheduling_properties = self::$scheduling_properties;
    }

    /**
     * Set event properties to the kolabformat object
     *
     * @param array  Event data as hash array
     */
    public function set(&$object)
    {
        // set common xcal properties
        parent::set($object);

        // do the hard work of setting object values
        $this->obj->setStart(self::get_datetime($object['start'], null, $object['allday']));
        $this->obj->setEnd(self::get_datetime($object['end'], null, $object['allday']));
        $this->obj->setTransparency($object['free_busy'] == 'free');

        $status = kolabformat::StatusUndefined;
        if ($object['free_busy'] == 'tentative')
            $status = kolabformat::StatusTentative;
        if ($object['cancelled'])
            $status = kolabformat::StatusCancelled;
        else if ($object['status'] && array_key_exists($object['status'], $this->status_map))
            $status = $this->status_map[$object['status']];
        $this->obj->setStatus($status);

        // save (recurrence) exceptions
        if (is_array($object['recurrence']) && is_array($object['recurrence']['EXCEPTIONS']) && !isset($object['exceptions'])) {
            $object['exceptions'] = $object['recurrence']['EXCEPTIONS'];
        }

        if (is_array($object['exceptions'])) {
            $recurrence_id_format = libkolab::recurrence_id_format($object);
            $vexceptions = new vectorevent;
            foreach ($object['exceptions'] as $i => $exception) {
                $exevent = new kolab_format_event;
                $exevent->set($compacted = $this->compact_exception($exception, $object));  // only save differing values

                // get value for recurrence-id
                $recurrence_id = null;
                if (!empty($exception['recurrence_date']) && is_a($exception['recurrence_date'], 'DateTime')) {
                    $recurrence_id = $exception['recurrence_date'];
                    $compacted['_instance'] = $recurrence_id->format($recurrence_id_format);
                }
                else if (!empty($exception['_instance']) && strlen($exception['_instance']) > 4) {
                    $recurrence_id = rcube_utils::anytodatetime($exception['_instance'], $object['start']->getTimezone());
                    $compacted['recurrence_date'] = $recurrence_id;
                }

                $exevent->obj->setRecurrenceID(self::get_datetime($recurrence_id ?: $exception['start'], null,  $object['allday']), (bool)$exception['thisandfuture']);

                $vexceptions->push($exevent->obj);

                // write cleaned-up exception data back to memory/cache
                $object['exceptions'][$i] = $this->expand_exception($exevent->data, $object);
                $object['exceptions'][$i]['_instance'] = $compacted['_instance'];
            }
            $this->obj->setExceptions($vexceptions);

            // link with recurrence.EXCEPTIONS for compatibility
            if (is_array($object['recurrence'])) {
                $object['recurrence']['EXCEPTIONS'] = &$object['exceptions'];
            }
        }

        if ($object['recurrence_date'] && $object['recurrence_date'] instanceof DateTime) {
            if ($object['recurrence']) {
                // unset recurrence_date for master events with rrule
                $object['recurrence_date'] = null;
            }
            $this->obj->setRecurrenceID(self::get_datetime($object['recurrence_date'], null, $object['allday']), (bool)$object['thisandfuture']);
        }

        // cache this data
        $this->data = $object;
        unset($this->data['_formatobj']);
    }

    /**
     *
     */
    public function is_valid()
    {
        return !$this->formaterror && (($this->data && !empty($this->data['start']) && !empty($this->data['end'])) ||
            (is_object($this->obj) && $this->obj->isValid() && $this->obj->uid()));
    }

    /**
     * Convert the Event object into a hash array data structure
     *
     * @param array Additional data for merge
     *
     * @return array  Event data as hash array
     */
    public function to_array($data = array())
    {
        // return cached result
        if (!empty($this->data))
            return $this->data;

        // read common xcal props
        $object = parent::to_array($data);

        // read object properties
        $object += array(
            'end'         => self::php_datetime($this->obj->end()),
            'allday'      => $this->obj->start()->isDateOnly(),
            'free_busy'   => $this->obj->transparency() ? 'free' : 'busy',  // TODO: transparency is only boolean
            'attendees'   => array(),
        );

        // derive event end from duration (#1916)
        if (!$object['end'] && $object['start'] && ($duration = $this->obj->duration()) && $duration->isValid()) {
            $interval = new DateInterval('PT0S');
            $interval->d = $duration->weeks() * 7 + $duration->days();
            $interval->h = $duration->hours();
            $interval->i = $duration->minutes();
            $interval->s = $duration->seconds();
            $object['end'] = clone $object['start'];
            $object['end']->add($interval);
        }
        // make sure end date is specified (#5307) RFC5545 3.6.1
        else if (!$object['end'] && $object['start']) {
            $object['end'] = clone $object['start'];
        }

        // organizer is part of the attendees list in Roundcube
        if ($object['organizer']) {
            $object['organizer']['role'] = 'ORGANIZER';
            array_unshift($object['attendees'], $object['organizer']);
        }

        // status defines different event properties...
        $status = $this->obj->status();
        if ($status == kolabformat::StatusTentative)
          $object['free_busy'] = 'tentative';
        else if ($status == kolabformat::StatusCancelled)
          $object['cancelled'] = true;

        // this is an exception object
        if ($this->obj->recurrenceID()->isValid()) {
            $object['thisandfuture'] = $this->obj->thisAndFuture();
            $object['recurrence_date'] = self::php_datetime($this->obj->recurrenceID());
        }
        // read exception event objects
        if (($exceptions = $this->obj->exceptions()) && is_object($exceptions) && $exceptions->size()) {
            $recurrence_exceptions = array();
            $recurrence_id_format = libkolab::recurrence_id_format($object);
            for ($i=0; $i < $exceptions->size(); $i++) {
                if (($exobj = $exceptions->get($i))) {
                    $exception = new kolab_format_event($exobj);
                    if ($exception->is_valid()) {
                        $exdata = $exception->to_array();

                        // fix date-only recurrence ID saved by old versions
                        if ($exdata['recurrence_date'] && $exdata['recurrence_date']->_dateonly && !$object['allday']) {
                            $exdata['recurrence_date']->setTimezone($object['start']->getTimezone());
                            $exdata['recurrence_date']->setTime($object['start']->format('G'), intval($object['start']->format('i')), intval($object['start']->format('s')));
                        }

                        $recurrence_id = $exdata['recurrence_date'] ?: $exdata['start'];
                        $exdata['_instance'] = $recurrence_id->format($recurrence_id_format);
                        $recurrence_exceptions[] = $this->expand_exception($exdata, $object);
                    }
                }
            }
            $object['exceptions'] = $recurrence_exceptions;

            // also link with recurrence.EXCEPTIONS for compatibility
            if (is_array($object['recurrence'])) {
                $object['recurrence']['EXCEPTIONS'] = &$object['exceptions'];
            }
        }

        return $this->data = $object;
    }

    /**
     * Getter for a single instance from a recurrence series or stored subcomponents
     *
     * @param mixed The recurrence-id of the requested instance, either as string or a DateTime object
     * @return array Event data as hash array or null if not found
     */
    public function get_instance($recurrence_id)
    {
        $result = null;
        $object = $this->to_array();

        $recurrence_id_format = libkolab::recurrence_id_format($object);
        $instance_id = $recurrence_id instanceof DateTime ? $recurrence_id->format($recurrence_id_format) : strval($recurrence_id);

        if ($object['recurrence_date'] instanceof DateTime) {
            if ($object['recurrence_date']->format($recurrence_id_format) == $instance_id) {
                $result = $object;
            }
        }

        if (!$result && is_array($object['exceptions'])) {
            foreach ($object['exceptions'] as $exception) {
                if ($exception['_instance'] == $instance_id) {
                    $result = $exception;
                    $result['isexception'] = 1;
                    break;
                }
            }
        }

        // TODO: compute instances from recurrence rule and return the matching instance
        // clone from plugins/calendar/drivers/kolab/kolab_calendar::get_recurring_events()

        return $result;
    }

    /**
     * Callback for kolab_storage_cache to get object specific tags to cache
     *
     * @return array List of tags to save in cache
     */
    public function get_tags($obj = null)
    {
        $tags = parent::get_tags($obj);
        $object = $obj ?: $this->data;

        foreach ((array)$object['categories'] as $cat) {
            $tags[] = rcube_utils::normalize_string($cat);
        }

        return array_unique($tags);
    }

    /**
     * Remove some attributes from the exception container
     */
    private function compact_exception($exception, $master)
    {
        $forbidden = array('recurrence','exceptions','organizer','_attachments');

        foreach ($forbidden as $prop) {
            if (array_key_exists($prop, $exception)) {
                unset($exception[$prop]);
            }
        }

        // preserve this property for date serialization
        if (!isset($exception['allday'])) {
            $exception['allday'] = $master['allday'];
        }

        return $exception;
    }

    /**
     * Copy attributes not specified by the exception from the master event
     */
    private function expand_exception($exception, $master)
    {
        // Note: If an exception has no attendees it means there's "no attendees
        // for this occurrence", not "attendees are the same as in the event" (#5300)

        $forbidden    = array('exceptions', 'attendees', 'allday');
        $is_recurring = !empty($master['recurrence']);

        foreach ($master as $prop => $value) {
            if (empty($exception[$prop]) && !empty($value) && $prop[0] != '_'
                && !in_array($prop, $forbidden)
                && ($is_recurring || in_array($prop, array('uid','organizer')))
            ) {
                $exception[$prop] = $value;
                if ($prop == 'recurrence') {
                    unset($exception[$prop]['EXCEPTIONS']);
                }
            }
        }

        return $exception;
    }
}
