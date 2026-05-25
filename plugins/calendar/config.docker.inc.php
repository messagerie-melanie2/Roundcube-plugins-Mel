<?php
/*
 +-------------------------------------------------------------------------+
 | Configuration for the Calendar plugin                                   |
 | Version 0.7-beta                                                        |
 |                                                                         |
 | Copyright (C) 2010, Lazlo Westerhof - Netherlands                       |
 | Copyright (C) 2011, Kolab Systems AG                                    |
 |                                                                         |
 | This program is free software: you can redistribute it and/or modify    |
 | it under the terms of the GNU Affero General Public License as          |
 | published by the Free Software Foundation, either version 3 of the      |
 | License, or (at your option) any later version.                         |
 |                                                                         |
 | This program is distributed in the hope that it will be useful,         |
 | but WITHOUT ANY WARRANTY; without even the implied warranty of          |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the            |
 | GNU Affero General Public License for more details.                     |
 |                                                                         |
 | You should have received a copy of the GNU Affero General Public License|
 | along with this program. If not, see <http://www.gnu.org/licenses/>.    |
 |                                                                         |
 +-------------------------------------------------------------------------+
 | Author: Lazlo Westerhof <hello@lazlo.me>                                |
 |         Thomas Bruederli <bruederli@kolabsys.com>                       |
 +-------------------------------------------------------------------------+
*/

// backend type (database, google, kolab, mel)
$config['calendar_driver'] = $_ENV['RC_CALENDAR_DRIVER'] ?? "mel";

// default calendar view (agendaDay, agendaWeek, month)
$config['calendar_default_view'] = $_ENV['RC_CALENDAR_DEFAULT_VIEW'] ?? "agendaWork";

// show a birthdays calendar from the user's address book(s)
$config['calendar_contact_birthdays'] = $_ENV['RC_CALENDAR_CONTACT_BIRTHDAYS'] ?? false;

// mapping of Roundcube date formats to calendar formats (long/short/agenda)
// should be in sync with 'date_formats' in main config
$config['calendar_date_format_sets'] = $_ENV['RC_CALENDAR_DATE_FORMAT_SETS'] ?? [
  'yyyy-MM-dd' => ['MMM d yyyy',   'M-d',  'ddd MM-dd'],
  'dd-MM-yyyy' => ['d MMM yyyy',   'd-M',  'ddd dd-MM'],
  'yyyy/MM/dd' => ['MMM d yyyy',   'M/d',  'ddd MM/dd'],
  'MM/dd/yyyy' => ['MMM d yyyy',   'M/d',  'ddd MM/dd'],
  'dd/MM/yyyy' => ['d MMM yyyy',   'd/M',  'ddd dd/MM'],
  'dd.MM.yyyy' => ['dd. MMM yyyy', 'd.M',  'ddd dd.MM.'],
  'd.M.yyyy'   => ['d. MMM yyyy',  'd.M',  'ddd d.MM.'],
  'dd MM yyyy' => ['d MMM yyyy',   'd M',  'ddd dd MM'],
];

// general date format (only set if different from default date format and not user configurable)
// $config['calendar_date_format'] = "yyyy-MM-dd";

// time format  (only set if different from default date format)
// $config['calendar_time_format'] = "HH:mm";

// short date format (used for column titles)
$config['calendar_date_short'] = $_ENV['RC_CALENDAR_DATE_SHORT'] ?? 'd M';

// long date format (used for calendar title)
 $config['calendar_date_long'] = $_ENV['RC_CALENDAR_DATE_LONG'] ?? 'd F yy';

// date format used for agenda view
// $config['calendar_date_agenda'] = 'ddd MM-dd';

// timeslots per hour (1, 2, 3, 4, 6)
$config['calendar_timeslots'] = $_ENV['RC_CALENDAR_TIMESLOTS'] ?? 2;

// show this number of days in agenda view
$config['calendar_agenda_range'] = $_ENV['RC_CALENDAR_AGENDA_RANGE'] ?? 7;

// section in agenda view
$config['calendar_agenda_sections'] = $_ENV['RC_CALENDAR_AGENDA_SECTIONS'] ?? 'day';

// first day of the week (0-6)
$config['calendar_first_day'] = $_ENV['RC_CALENDAR_FIRST_DAY'] ?? 1;

// first hour of the calendar (0-23)
$config['calendar_first_hour'] = $_ENV['RC_CALENDAR_FIRST_HOUR'] ?? 8;

// working hours begin
$config['calendar_work_start'] = $_ENV['RC_CALENDAR_WORK_START'] ?? 8;

// working hours end
$config['calendar_work_end'] = $_ENV['RC_CALENDAR_WORK_END'] ?? 18;

// show line at current time of the day
$config['calendar_time_indicator'] = $_ENV['RC_CALENDAR_TIME_INDICATOR'] ?? true;

// default alarm settings for new events.
// this is only a preset when a new event dialog opens
// possible values are <empty>, DISPLAY, EMAIL
$config['calendar_default_alarm_type'] = $_ENV['RC_CALENDAR_DEFAULT_ALARM_TYPE'] ?? '';

// default alarm offset for new events.
// use ical-style offset values like "-1H" (one hour before) or "+30M" (30 minutes after)
$config['calendar_default_alarm_offset'] = $_ENV['RC_CALENDAR_DEFAULT_ALARM_OFFSET'] ?? '-15M';

// how to colorize events:
// 0: according to calendar color
// 1: according to category color
// 2: calendar for outer, category for inner color
// 3: category for outer, calendar for inner color
$config['calendar_event_coloring'] = $_ENV['RC_CALENDAR_EVENT_COLORING'] ?? 3;

// event categories
$config['calendar_categories'] = $_ENV['RC_CALENDAR_CATEGORIES'] ?? [];

// enable users to invite/edit attendees for shared events organized by others
$config['calendar_allow_invite_shared'] = $_ENV['RC_CALENDAR_ALLOW_INVITE_SHARED'] ?? false;

// allow users to accecpt iTip invitations who are no explicitly listed as attendee.
// this can be the case if invitations are sent to mailing lists or alias email addresses.
$config['calendar_allow_itip_uninvited'] = $_ENV['RC_CALENDAR_ALLOW_ITIP_UNINVITED'] ?? true;

// controls the visibility/default of the checkbox controlling the sending of iTip invitations
// 0 = hidden  + disabled
// 1 = hidden  + active
// 2 = visible + unchecked
// 3 = visible + active
$config['calendar_itip_send_option'] = $_ENV['RC_CALENDAR_ITIP_SEND_OPTION'] ?? 3;

// Action taken after iTip request is handled. Possible values:
// 0 - no action
// 1 - move to Trash
// 2 - delete the message
// 3 - flag as deleted
// 4 - folder_name - move the message to the specified folder
// 5 - PAMELA - flag rdvtraite + read
$config['calendar_itip_after_action'] = $_ENV['RC_CALENDAR_ITIP_AFTER_ACTION'] ?? 5;


// enable asynchronous free-busy triggering after data changed
$config['calendar_freebusy_trigger'] = $_ENV['RC_calendar_date_long'] ?? false;

// free-busy information will be displayed for user calendars if available
// 0 - no free-busy information
// 1 - enabled in all views
// 2 - only in quickview
$config['calendar_include_freebusy_data'] = $_ENV['RC_calendar_date_long'] ?? 1;

// SMTP server host used to send (anonymous) itip messages
$config['calendar_itip_smtp_server'] = $_ENV['RC_CALENDAR_ITIP_SMTP_SERVER'] ?? null;

// SMTP username used to send (anonymous) itip messages
$config['calendar_itip_smtp_user'] = $_ENV['RC_CALENDAR_ITIP_SMTP_USER'];

// SMTP password used to send (anonymous) itip messages
$config['calendar_itip_smtp_pass'] = $_ENV['RC_CALENDAR_ITIP_SMTP_PASS'];

// show virtual invitation calendars (Kolab driver only)
$config['kolab_invitation_calendars'] = $_ENV['RC_KOLAB_INVITATION_CALENDARS'] ?? false;

// show configure appointment button
$config['enable_appointment'] = $_ENV['RC_ENABLE_APPOINTMENT'] ?? true;

// Driver to provide a resource directory ('ldap' is the only implementation yet).
// Leave empty or commented to disable resources support.
// $config['calendar_resources_driver'] = 'ldap';

// LDAP directory configuration to find avilable resources for events
// $config['calendar_resources_directory'] = array(/* ldap_public-like address book configuration */);

// Base URL to build fully qualified URIs to access calendars via CALDAV
// The following replacement variables are supported:
// %h - Current HTTP host
// %u - Current webmail user name
// %n - Calendar owner
// %i - Calendar id
$config['calendar_caldav_url'] = $_ENV['RC_CALENDAR_CALDAV_URL'];

// PAMELA - Configuration des url pour les calendriers externes
// Associer un nom de service a une expression régulière pour valider l'url
$config['calendar_external_urls'] = $_ENV['RC_CALENDAR_EXTERNAL_URLS'] ?? [];

// PAMELA - Commande de synchronisation des calendriers externes
// Remplace %%username%% par le nom d'utilisateur connecté
$config['calendar_external_command'] = $_ENV['RC_CALENDAR_EXTERNAL_COMMAND'];
