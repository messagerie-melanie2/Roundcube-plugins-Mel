<?php

/**
 * Xcal based Kolab format class wrapping libkolabxml bindings
 *
 * Base class for xcal-based Kolab groupware objects such as event, todo, journal
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

abstract class kolab_format_xcal extends kolab_format
{
    public $CTYPE = 'application/calendar+xml';

    public static $fulltext_cols = array('title', 'description', 'location', 'attendees:name', 'attendees:email', 'categories');

    public static $scheduling_properties = array('start', 'end', 'location');

    protected $_scheduling_properties = null;

    protected $sensitivity_map = array(
        'public'       => kolabformat::ClassPublic,
        'private'      => kolabformat::ClassPrivate,
        'confidential' => kolabformat::ClassConfidential,
    );

    protected $role_map = array(
        'REQ-PARTICIPANT' => kolabformat::Required,
        'OPT-PARTICIPANT' => kolabformat::Optional,
        'NON-PARTICIPANT' => kolabformat::NonParticipant,
        'CHAIR' => kolabformat::Chair,
    );

    protected $cutype_map = array(
        'INDIVIDUAL' => kolabformat::CutypeIndividual,
        'GROUP'      => kolabformat::CutypeGroup,
        'ROOM'       => kolabformat::CutypeRoom,
        'RESOURCE'   => kolabformat::CutypeResource,
        'UNKNOWN'    => kolabformat::CutypeUnknown,
    );

    protected $rrule_type_map = array(
        'MINUTELY' => RecurrenceRule::Minutely,
        'HOURLY' => RecurrenceRule::Hourly,
        'DAILY' => RecurrenceRule::Daily,
        'WEEKLY' => RecurrenceRule::Weekly,
        'MONTHLY' => RecurrenceRule::Monthly,
        'YEARLY' => RecurrenceRule::Yearly,
    );

    protected $weekday_map = array(
        'MO' => kolabformat::Monday,
        'TU' => kolabformat::Tuesday,
        'WE' => kolabformat::Wednesday,
        'TH' => kolabformat::Thursday,
        'FR' => kolabformat::Friday,
        'SA' => kolabformat::Saturday,
        'SU' => kolabformat::Sunday,
    );

    protected $alarm_type_map = array(
        'DISPLAY' => Alarm::DisplayAlarm,
        'EMAIL' => Alarm::EMailAlarm,
        'AUDIO' => Alarm::AudioAlarm,
    );

    protected $status_map = array(
        'NEEDS-ACTION' => kolabformat::StatusNeedsAction,
        'IN-PROCESS'   => kolabformat::StatusInProcess,
        'COMPLETED'    => kolabformat::StatusCompleted,
        'CANCELLED'    => kolabformat::StatusCancelled,
        'TENTATIVE'    => kolabformat::StatusTentative,
        'CONFIRMED'    => kolabformat::StatusConfirmed,
        'DRAFT'        => kolabformat::StatusDraft,
        'FINAL'        => kolabformat::StatusFinal,
    );

    protected $part_status_map = array(
        'UNKNOWN'      => kolabformat::PartNeedsAction,
        'NEEDS-ACTION' => kolabformat::PartNeedsAction,
        'TENTATIVE'    => kolabformat::PartTentative,
        'ACCEPTED'     => kolabformat::PartAccepted,
        'DECLINED'     => kolabformat::PartDeclined,
        'DELEGATED'    => kolabformat::PartDelegated,
        'IN-PROCESS'   => kolabformat::PartInProcess,
        'COMPLETED'    => kolabformat::PartCompleted,
      );


    /**
     * Convert common xcard properties into a hash array data structure
     *
     * @param array Additional data for merge
     *
     * @return array  Object data as hash array
     */
    public function to_array($data = array())
    {
        // read common object props
        $object = parent::to_array($data);

        $status_map = array_flip($this->status_map);
        $sensitivity_map = array_flip($this->sensitivity_map);

        $object += array(
            'sequence'    => intval($this->obj->sequence()),
            'title'       => $this->obj->summary(),
            'location'    => $this->obj->location(),
            'description' => $this->obj->description(),
            'url'         => $this->obj->url(),
            'status'      => $status_map[$this->obj->status()],
            'sensitivity' => $sensitivity_map[$this->obj->classification()],
            'priority'    => $this->obj->priority(),
            'categories'  => self::vector2array($this->obj->categories()),
            'start'       => self::php_datetime($this->obj->start()),
        );

        if (method_exists($this->obj, 'comment')) {
            $object['comment'] = $this->obj->comment();
        }

        // read organizer and attendees
        if (($organizer = $this->obj->organizer()) && ($organizer->email() || $organizer->name())) {
            $object['organizer'] = array(
                'email' => $organizer->email(),
                'name' => $organizer->name(),
            );
        }

        $role_map = array_flip($this->role_map);
        $cutype_map = array_flip($this->cutype_map);
        $part_status_map = array_flip($this->part_status_map);
        $attvec = $this->obj->attendees();
        for ($i=0; $i < $attvec->size(); $i++) {
            $attendee = $attvec->get($i);
            $cr = $attendee->contact();
            if ($cr->email() != $object['organizer']['email']) {
                $delegators = $delegatees = array();
                $vdelegators = $attendee->delegatedFrom();
                for ($j=0; $j < $vdelegators->size(); $j++) {
                    $delegators[] = $vdelegators->get($j)->email();
                }
                $vdelegatees = $attendee->delegatedTo();
                for ($j=0; $j < $vdelegatees->size(); $j++) {
                    $delegatees[] = $vdelegatees->get($j)->email();
                }

                $object['attendees'][] = array(
                    'role' => $role_map[$attendee->role()],
                    'cutype' => $cutype_map[$attendee->cutype()],
                    'status' => $part_status_map[$attendee->partStat()],
                    'rsvp' => $attendee->rsvp(),
                    'email' => $cr->email(),
                    'name' => $cr->name(),
                    'delegated-from' => $delegators,
                    'delegated-to' => $delegatees,
                );
            }
        }

        if ($object['start'] instanceof DateTime) {
            $start_tz = $object['start']->getTimezone();
        }

        // read recurrence rule
        if (($rr = $this->obj->recurrenceRule()) && $rr->isValid()) {
            $rrule_type_map = array_flip($this->rrule_type_map);
            $object['recurrence'] = array('FREQ' => $rrule_type_map[$rr->frequency()]);

            if ($intvl = $rr->interval())
                $object['recurrence']['INTERVAL'] = $intvl;

            if (($count = $rr->count()) && $count > 0) {
                $object['recurrence']['COUNT'] = $count;
            }
            else if ($until = self::php_datetime($rr->end(), $start_tz)) {
                $refdate = $this->get_reference_date();
                if ($refdate && $refdate instanceof DateTime && !$refdate->_dateonly) {
                    $until->setTime($refdate->format('G'), $refdate->format('i'), 0);
                }
                $object['recurrence']['UNTIL'] = $until;
            }

            if (($byday = $rr->byday()) && $byday->size()) {
                $weekday_map = array_flip($this->weekday_map);
                $weekdays = array();
                for ($i=0; $i < $byday->size(); $i++) {
                    $daypos = $byday->get($i);
                    $prefix = $daypos->occurence();
                    $weekdays[] = ($prefix ? $prefix : '') . $weekday_map[$daypos->weekday()];
                }
                $object['recurrence']['BYDAY'] = join(',', $weekdays);
            }

            if (($bymday = $rr->bymonthday()) && $bymday->size()) {
                $object['recurrence']['BYMONTHDAY'] = join(',', self::vector2array($bymday));
            }

            if (($bymonth = $rr->bymonth()) && $bymonth->size()) {
                $object['recurrence']['BYMONTH'] = join(',', self::vector2array($bymonth));
            }

            if ($exdates = $this->obj->exceptionDates()) {
                for ($i=0; $i < $exdates->size(); $i++) {
                    if ($exdate = self::php_datetime($exdates->get($i), $start_tz)) {
                        $object['recurrence']['EXDATE'][] = $exdate;
                    }
                }
            }
        }

        if ($rdates = $this->obj->recurrenceDates()) {
            for ($i=0; $i < $rdates->size(); $i++) {
                if ($rdate = self::php_datetime($rdates->get($i), $start_tz)) {
                    $object['recurrence']['RDATE'][] = $rdate;
                }
            }
        }

        // read alarm
        $valarms = $this->obj->alarms();
        $alarm_types = array_flip($this->alarm_type_map);
        $object['valarms'] = array();
        for ($i=0; $i < $valarms->size(); $i++) {
            $alarm = $valarms->get($i);
            $type  = $alarm_types[$alarm->type()];

            if ($type == 'DISPLAY' || $type == 'EMAIL' || $type == 'AUDIO') {  // only some alarms are supported
                $valarm = array(
                    'action'      => $type,
                    'summary'     => $alarm->summary(),
                    'description' => $alarm->description(),
                );

                if ($type == 'EMAIL') {
                    $valarm['attendees'] = array();
                    $attvec = $alarm->attendees();
                    for ($j=0; $j < $attvec->size(); $j++) {
                        $cr = $attvec->get($j);
                        $valarm['attendees'][] = $cr->email();
                    }
                }
                else if ($type == 'AUDIO') {
                    $attach = $alarm->audioFile();
                    $valarm['uri'] = $attach->uri();
                }

                if ($start = self::php_datetime($alarm->start())) {
                    $object['alarms']  = '@' . $start->format('U');
                    $valarm['trigger'] = $start;
                }
                else if ($offset = $alarm->relativeStart()) {
                    $prefix = $offset->isNegative() ? '-' : '+';
                    $value  = '';
                    $time   = '';

                    if      ($w = $offset->weeks())     $value .= $w . 'W';
                    else if ($d = $offset->days())      $value .= $d . 'D';
                    else if ($h = $offset->hours())     $time  .= $h . 'H';
                    else if ($m = $offset->minutes())   $time  .= $m . 'M';
                    else if ($s = $offset->seconds())   $time  .= $s . 'S';

                    // assume 'at event time'
                    if (empty($value) && empty($time)) {
                        $prefix = '';
                        $time   = '0S';
                    }

                    $object['alarms']  = $prefix . $value . $time;
                    $valarm['trigger'] = $prefix . 'P' . $value . ($time ? 'T' . $time : '');

                    if ($alarm->relativeTo() == kolabformat::End) {
                        $valarm['related'] == 'END';
                    }
                }

                // read alarm duration and repeat properties
                if (($duration = $alarm->duration()) && $duration->isValid()) {
                    $value = $time = '';

                    if      ($w = $duration->weeks())     $value .= $w . 'W';
                    else if ($d = $duration->days())      $value .= $d . 'D';
                    else if ($h = $duration->hours())     $time  .= $h . 'H';
                    else if ($m = $duration->minutes())   $time  .= $m . 'M';
                    else if ($s = $duration->seconds())   $time  .= $s . 'S';

                    $valarm['duration'] = 'P' . $value . ($time ? 'T' . $time : '');
                    $valarm['repeat']   = $alarm->numrepeat();
                }

                $object['alarms']  .= ':' . $type;  // legacy property
                $object['valarms'][] = array_filter($valarm);
            }
        }

        $this->get_attachments($object);

        return $object;
    }


    /**
     * Set common xcal properties to the kolabformat object
     *
     * @param array  Event data as hash array
     */
    public function set(&$object)
    {
        $this->init();

        $is_new = !$this->obj->uid();
        $old_sequence = $this->obj->sequence();
        $reschedule = $is_new;

        // set common object properties
        parent::set($object);

        // set sequence value
        if (!isset($object['sequence'])) {
            if ($is_new) {
                $object['sequence'] = 0;
            }
            else {
                $object['sequence'] = $old_sequence;

                // increment sequence when updating properties relevant for scheduling.
                // RFC 5545: "It is incremented [...] each time the Organizer makes a significant revision to the calendar component."
                if ($this->check_rescheduling($object)) {
                    $object['sequence']++;
                }
            }
        }
        $this->obj->setSequence(intval($object['sequence']));

        if ($object['sequence'] > $old_sequence) {
            $reschedule = true;
        }

        $this->obj->setSummary($object['title']);
        $this->obj->setLocation($object['location']);
        $this->obj->setDescription($object['description']);
        $this->obj->setPriority($object['priority']);
        $this->obj->setClassification($this->sensitivity_map[$object['sensitivity']]);
        $this->obj->setCategories(self::array2vector($object['categories']));
        $this->obj->setUrl(strval($object['url']));

        if (method_exists($this->obj, 'setComment')) {
            $this->obj->setComment($object['comment']);
        }

        // process event attendees
        $attendees = new vectorattendee;
        foreach ((array)$object['attendees'] as $i => $attendee) {
            if ($attendee['role'] == 'ORGANIZER') {
                $object['organizer'] = $attendee;
            }
            else if ($attendee['email'] != $object['organizer']['email']) {
                $cr = new ContactReference(ContactReference::EmailReference, $attendee['email']);
                $cr->setName($attendee['name']);

                // set attendee RSVP if missing
                if (!isset($attendee['rsvp'])) {
                    $object['attendees'][$i]['rsvp'] = $attendee['rsvp'] = $reschedule;
                }

                $att = new Attendee;
                $att->setContact($cr);
                $att->setPartStat($this->part_status_map[$attendee['status']]);
                $att->setRole($this->role_map[$attendee['role']] ? $this->role_map[$attendee['role']] : kolabformat::Required);
                $att->setCutype($this->cutype_map[$attendee['cutype']] ? $this->cutype_map[$attendee['cutype']] : kolabformat::CutypeIndividual);
                $att->setRSVP((bool)$attendee['rsvp']);

                if (!empty($attendee['delegated-from'])) {
                    $vdelegators = new vectorcontactref;
                    foreach ((array)$attendee['delegated-from'] as $delegator) {
                        $vdelegators->push(new ContactReference(ContactReference::EmailReference, $delegator));
                    }
                    $att->setDelegatedFrom($vdelegators);
                }
                if (!empty($attendee['delegated-to'])) {
                    $vdelegatees = new vectorcontactref;
                    foreach ((array)$attendee['delegated-to'] as $delegatee) {
                        $vdelegatees->push(new ContactReference(ContactReference::EmailReference, $delegatee));
                    }
                    $att->setDelegatedTo($vdelegatees);
                }

                if ($att->isValid()) {
                    $attendees->push($att);
                }
                else {
                    rcube::raise_error(array(
                        'code' => 600, 'type' => 'php',
                        'file' => __FILE__, 'line' => __LINE__,
                        'message' => "Invalid event attendee: " . json_encode($attendee),
                    ), true);
                }
            }
        }
        $this->obj->setAttendees($attendees);

        if ($object['organizer']) {
            $organizer = new ContactReference(ContactReference::EmailReference, $object['organizer']['email']);
            $organizer->setName($object['organizer']['name']);
            $this->obj->setOrganizer($organizer);
        }

        if ($object['start'] instanceof DateTime) {
            $start_tz = $object['start']->getTimezone();
        }

        // save recurrence rule
        $rr = new RecurrenceRule;
        $rr->setFrequency(RecurrenceRule::FreqNone);

        if ($object['recurrence'] && !empty($object['recurrence']['FREQ'])) {
            $freq     = $object['recurrence']['FREQ'];
            $bysetpos = explode(',', $object['recurrence']['BYSETPOS']);

            $rr->setFrequency($this->rrule_type_map[$freq]);

            if ($object['recurrence']['INTERVAL'])
                $rr->setInterval(intval($object['recurrence']['INTERVAL']));

            if ($object['recurrence']['BYDAY']) {
                $byday = new vectordaypos;
                foreach (explode(',', $object['recurrence']['BYDAY']) as $day) {
                    $occurrence = 0;
                    if (preg_match('/^([\d-]+)([A-Z]+)$/', $day, $m)) {
                        $occurrence = intval($m[1]);
                        $day = $m[2];
                    }

                    if (isset($this->weekday_map[$day])) {
                        // @TODO: libkolabxml does not support BYSETPOS, neither we.
                        // However, we can convert most common cases to BYDAY
                        if (!$occurrence && $freq == 'MONTHLY' && !empty($bysetpos)) {
                            foreach ($bysetpos as $pos) {
                                $byday->push(new DayPos(intval($pos), $this->weekday_map[$day]));
                            }
                        }
                        else {
                            $byday->push(new DayPos($occurrence, $this->weekday_map[$day]));
                        }
                    }
                }
                $rr->setByday($byday);
            }

            if ($object['recurrence']['BYMONTHDAY']) {
                $bymday = new vectori;
                foreach (explode(',', $object['recurrence']['BYMONTHDAY']) as $day)
                    $bymday->push(intval($day));
                $rr->setBymonthday($bymday);
            }

            if ($object['recurrence']['BYMONTH']) {
                $bymonth = new vectori;
                foreach (explode(',', $object['recurrence']['BYMONTH']) as $month)
                    $bymonth->push(intval($month));
                $rr->setBymonth($bymonth);
            }

            if ($object['recurrence']['COUNT'])
                $rr->setCount(intval($object['recurrence']['COUNT']));
            else if ($object['recurrence']['UNTIL'])
                $rr->setEnd(self::get_datetime($object['recurrence']['UNTIL'], null, true, $start_tz));

            if ($rr->isValid()) {
                // add exception dates (only if recurrence rule is valid)
                $exdates = new vectordatetime;
                foreach ((array)$object['recurrence']['EXDATE'] as $exdate)
                    $exdates->push(self::get_datetime($exdate, null, true, $start_tz));
                $this->obj->setExceptionDates($exdates);
            }
            else {
                rcube::raise_error(array(
                    'code' => 600, 'type' => 'php',
                    'file' => __FILE__, 'line' => __LINE__,
                    'message' => "Invalid event recurrence rule: " . json_encode($object['recurrence']),
                ), true);
            }
        }

        $this->obj->setRecurrenceRule($rr);

        // save recurrence dates (aka RDATE)
        if (!empty($object['recurrence']['RDATE'])) {
            $rdates = new vectordatetime;
            foreach ((array)$object['recurrence']['RDATE'] as $rdate)
                $rdates->push(self::get_datetime($rdate, null, true, $start_tz));
            $this->obj->setRecurrenceDates($rdates);
        }

        // save alarm(s)
        $valarms = new vectoralarm;
        $valarm_hashes = array();
        if ($object['valarms']) {
            foreach ($object['valarms'] as $valarm) {
                if (!array_key_exists($valarm['action'], $this->alarm_type_map)) {
                    continue;  // skip unknown alarm types
                }

                // Get rid of duplicates, some CalDAV clients can set them
                $hash = serialize($valarm);
                if (in_array($hash, $valarm_hashes)) {
                    continue;
                }
                $valarm_hashes[] = $hash;

                if ($valarm['action'] == 'EMAIL') {
                    $recipients = new vectorcontactref;
                    foreach (($valarm['attendees'] ?: array($object['_owner'])) as $email) {
                        $recipients->push(new ContactReference(ContactReference::EmailReference, $email));
                    }
                    $alarm = new Alarm(
                        strval($valarm['summary'] ?: $object['title']),
                        strval($valarm['description'] ?: $object['description']),
                        $recipients
                    );
                }
                else if ($valarm['action'] == 'AUDIO') {
                    $attach = new Attachment;
                    $attach->setUri($valarm['uri'] ?: 'null', 'unknown');
                    $alarm = new Alarm($attach);
                }
                else {
                    // action == DISPLAY
                    $alarm = new Alarm(strval($valarm['summary'] ?: $object['title']));
                }

                if (is_object($valarm['trigger']) && $valarm['trigger'] instanceof DateTime) {
                    $alarm->setStart(self::get_datetime($valarm['trigger'], new DateTimeZone('UTC')));
                }
                else if (preg_match('/^@([0-9]+)$/', $valarm['trigger'], $m)) {
                    $alarm->setStart(self::get_datetime($m[1], new DateTimeZone('UTC')));
                }
                else {
                    // Support also interval in format without PT, e.g. -10M
                    if (preg_match('/^([-+]*)([0-9]+[DHMS])$/', strtoupper($valarm['trigger']), $m)) {
                        $valarm['trigger'] = $m[1] . ($m[2][strlen($m[2])-1] == 'D' ? 'P' : 'PT') . $m[2];
                    }

                    try {
                        $period   = new DateInterval(preg_replace('/[^0-9PTWDHMS]/', '', $valarm['trigger']));
                        $duration = new Duration($period->d, $period->h, $period->i, $period->s, $valarm['trigger'][0] == '-');
                    }
                    catch (Exception $e) {
                        // skip alarm with invalid trigger values
                        rcube::raise_error($e, true);
                        continue;
                    }

                    $related = strtoupper($valarm['related']) == 'END' ? kolabformat::End : kolabformat::Start;
                    $alarm->setRelativeStart($duration, $related);
                }

                if ($valarm['duration']) {
                    try {
                        $d = new DateInterval($valarm['duration']);
                        $duration = new Duration($d->d, $d->h, $d->i, $d->s);
                        $alarm->setDuration($duration, intval($valarm['repeat']));
                    }
                    catch (Exception $e) {
                        // ignore
                    }
                }

                $valarms->push($alarm);
            }
        }
        // legacy support
        else if ($object['alarms']) {
            list($offset, $type) = explode(":", $object['alarms']);

            if ($type == 'EMAIL' && !empty($object['_owner'])) {  // email alarms implicitly go to event owner
                $recipients = new vectorcontactref;
                $recipients->push(new ContactReference(ContactReference::EmailReference, $object['_owner']));
                $alarm = new Alarm($object['title'], strval($object['description']), $recipients);
            }
            else {  // default: display alarm
                $alarm = new Alarm($object['title']);
            }

            if (preg_match('/^@(\d+)/', $offset, $d)) {
                $alarm->setStart(self::get_datetime($d[1], new DateTimeZone('UTC')));
            }
            else if (preg_match('/^([-+]?)P?T?(\d+)([SMHDW])/', $offset, $d)) {
                $days = $hours = $minutes = $seconds = 0;
                switch ($d[3]) {
                    case 'W': $days  = 7*intval($d[2]); break;
                    case 'D': $days    = intval($d[2]); break;
                    case 'H': $hours   = intval($d[2]); break;
                    case 'M': $minutes = intval($d[2]); break;
                    case 'S': $seconds = intval($d[2]); break;
                }
                $alarm->setRelativeStart(new Duration($days, $hours, $minutes, $seconds, $d[1] == '-'), $d[1] == '-' ? kolabformat::Start : kolabformat::End);
            }

            $valarms->push($alarm);
        }
        $this->obj->setAlarms($valarms);

        $this->set_attachments($object);
    }

    /**
     * Return the reference date for recurrence and alarms
     *
     * @return mixed DateTime instance of null if no refdate is available
     */
    public function get_reference_date()
    {
        if ($this->data['start'] && $this->data['start'] instanceof DateTime) {
            return $this->data['start'];
        }

        return self::php_datetime($this->obj->start());
    }

    /**
     * Callback for kolab_storage_cache to get words to index for fulltext search
     *
     * @return array List of words to save in cache
     */
    public function get_words($obj = null)
    {
        $data = '';
        $object = $obj ?: $this->data;

        foreach (self::$fulltext_cols as $colname) {
            list($col, $field) = explode(':', $colname);

            if ($field) {
                $a = array();
                foreach ((array)$object[$col] as $attr)
                    $a[] = $attr[$field];
                $val = join(' ', $a);
            }
            else {
                $val = is_array($object[$col]) ? join(' ', $object[$col]) : $object[$col];
            }

            if (strlen($val))
                $data .= $val . ' ';
        }

        $words = rcube_utils::normalize_string($data, true);

        // collect words from recurrence exceptions
        if (is_array($object['exceptions'])) {
            foreach ($object['exceptions'] as $exception) {
                $words = array_merge($words, $this->get_words($exception));
            }
        }

        return array_unique($words);
    }

    /**
     * Callback for kolab_storage_cache to get object specific tags to cache
     *
     * @return array List of tags to save in cache
     */
    public function get_tags($obj = null)
    {
        $tags = array();
        $object = $obj ?: $this->data;

        if (!empty($object['valarms'])) {
            $tags[] = 'x-has-alarms';
        }

        // create tags reflecting participant status
        if (is_array($object['attendees'])) {
            foreach ($object['attendees'] as $attendee) {
                if (!empty($attendee['email']) && !empty($attendee['status']))
                    $tags[] = 'x-partstat:' . $attendee['email'] . ':' . strtolower($attendee['status']);
            }
        }

        // collect tags from recurrence exceptions
        if (is_array($object['exceptions'])) {
            foreach ($object['exceptions'] as $exception) {
                $tags = array_merge($tags, $this->get_tags($exception));
            }
        }

        if (!empty($object['status'])) {
          $tags[] = 'x-status:' . strtolower($object['status']);
        }

        return array_unique($tags);
    }

    /**
     * Identify changes considered relevant for scheduling
     * 
     * @param array Hash array with NEW object properties
     * @param array Hash array with OLD object properties
     *
     * @return boolean True if changes affect scheduling, False otherwise
     */
    public function check_rescheduling($object, $old = null)
    {
        $reschedule = false;

        if (!is_array($old)) {
            $old = $this->data['uid'] ? $this->data : $this->to_array();
        }

        foreach ($this->_scheduling_properties ?: self::$scheduling_properties as $prop) {
            $a = $old[$prop];
            $b = $object[$prop];
            if ($object['allday'] && ($prop == 'start' || $prop == 'end') && $a instanceof DateTime && $b instanceof DateTime) {
                $a = $a->format('Y-m-d');
                $b = $b->format('Y-m-d');
            }
            if ($prop == 'recurrence' && is_array($a) && is_array($b)) {
                unset($a['EXCEPTIONS'], $b['EXCEPTIONS']);
                $a = array_filter($a);
                $b = array_filter($b);

                // advanced rrule comparison: no rescheduling if series was shortened
                if ($a['COUNT'] && $b['COUNT'] && $b['COUNT'] < $a['COUNT']) {
                  unset($a['COUNT'], $b['COUNT']);
                }
                else if ($a['UNTIL'] && $b['UNTIL'] && $b['UNTIL'] < $a['UNTIL']) {
                  unset($a['UNTIL'], $b['UNTIL']);
                }
            }
            if ($a != $b) {
                $reschedule = true;
                break;
            }
        }

        return $reschedule;
    }

    /**
     * Clones into an instance of libcalendaring's extended EventCal class
     *
     * @return mixed EventCal object or false on failure
     */
    public function to_libcal()
    {
        static $error_logged = false;

        if (class_exists('kolabcalendaring')) {
            return new EventCal($this->obj);
        }
        else if (!$error_logged) {
            $error_logged = true;
            rcube::raise_error(array(
                'code'    => 900,
                'message' => "Required kolabcalendaring module not found"
            ), true);
        }

        return false;
    }
}
