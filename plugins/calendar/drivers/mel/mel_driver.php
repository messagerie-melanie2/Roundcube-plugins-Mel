<?php
/**
 * Mél driver for the Calendar plugin
 *
 * @version @package_version@
 *
 * @author PNE Annuaire et Messagerie/MEDDE
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

use LibMelanie\Config\MappingMce;

// Inclusion de l'ORM
@include_once 'includes/libm2.php';

require_once (dirname(__FILE__) . '/mel_mapping.php');

/**
 * Classe Mél Driver
 * Permet de gérer les calendriers Mél depuis Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> PNE Annuaire et Messagerie/MEDDE
 */
class mel_driver extends calendar_driver {
  const DB_DATE_FORMAT = 'Y-m-d H:i:s';
  const SHORT_DB_DATE_FORMAT = 'Y-m-d';
  const RECURRENCE_ID = '@RECURRENCE-ID';
  const RECURRENCE_DATE = '-XXXXXXXX';

  // features this backend supports
  public $alarms = true;
  public $attendees = true;
  public $freebusy = true;
  public $attachments = true;
  public $undelete = false;
  public $alarm_types = array('DISPLAY');
  public $alarm_absolute = false;
  public $categoriesimmutable = false;

  /**
   *
   * @var rcmail
   */
  private $rc;
  /**
   *
   * @var calendar
   */
  private $cal;
  /**
   * Tableau de calendrier Mél
   *
   * @var LibMelanie\Api\Defaut\Calendar[]
   */
  private $calendars;
  private $has_principal = false;
  private $freebusy_trigger = false;

  // Mél
  /**
   * Utilisateur Mél
   *
   * @var LibMelanie\Api\Defaut\User
   */
  private $user;
  /**
   * Mise en cache des évènements
   * Pour éviter d'aller les chercher plusieurs fois dans la base de données
   *
   * @var array
   */
  private $_cache_events = array();

  /**
   * Default constructor
   */
  public function __construct($cal) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::__construct()");
    $this->cal = $cal;
    $this->rc = $cal->rc;

    // User Mél
    if (! empty($this->rc->user->ID)) {
      $this->user = driver_mel::gi()->getUser();
    }
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task == 'calendar') {
      $this->cal->register_action('calendar-acl', array($this,'calendar_acl'));
      $this->cal->register_action('calendar-acl-group', array($this,'calendar_acl_group'));
    }
  }

  /**
   * ** METHODS PRIVATES ****
   */
  /**
   * Read available calendars for the current user and store them internally
   *
   * @param string $calid id of the calendar to load
   * @access private
   */
  private function _read_calendars($calid = null) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::_read_calendars()");
    if (isset($this->user)) {
      if (isset($calid)) {
        // Charger un calendrier unique
        $calendar = driver_mel::gi()->calendar([$this->user]);
        $calid = driver_mel::gi()->rcToMceId($calid);
        $calendar->id = $calid;
        if ($calendar->load() && $calendar->asRight(LibMelanie\Config\ConfigMelanie::READ)) {
          $this->calendars = array();
          $this->calendars[$calid] = $calendar;
        }
      }
      else {
        $this->calendars = $this->user->getSharedCalendars();
        foreach ($this->calendars as $calendar) {
          if (!$this->has_principal && $calendar->id == $this->user->uid) {
            $this->has_principal = true;
            break;
          }
        }
      }
    }
  }

  /**
   * Génération d'un code couleur aléatoire
   * Utilisé pour générer une premiere couleur pour les agendas si aucune n'est positionnée
   *
   * @return string Code couleur
   * @private
   */
  private function _random_color() {
    mt_srand(( double ) microtime() * 1000000);
    $c = '';
    while (strlen($c) < 6) {
      $c .= sprintf("%02X", mt_rand(0, 255));
    }
    return $c;
  }

  /**
   * ** METHODS PUBLICS ****
   */
  /**
   * Get a list of available calendars from this source
   *
   * @param integer Bitmask defining filter criterias.
   * See FILTER_* constants for possible values.
   * @return array List of calendars
   */
  public function list_calendars($filter = 0, $tree = null, $calid = null) {
    if ($this->rc->task != 'calendar' && $this->rc->task != 'settings' && $this->rc->task != 'login') {
      return;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::list_calendars(filter = $filter)");

    try {
      // Chargement des calendriers si besoin
      if (!isset($this->calendars)) {
        $this->_read_calendars($calid);
      }
      // Récupération des préférences de l'utilisateur
      $hidden_calendars = $this->rc->config->get('hidden_calendars', []);
      $sort_calendars = $this->rc->config->get('sort_agendas', []);
      $color_calendars = $this->rc->config->get('color_calendars', null);
      $active_calendars = $this->rc->config->get('active_calendars', null);
      $alarm_calendars = $this->rc->config->get('alarm_calendars', null);
      $save_prefs = false;

      // attempt to create a default calendar for this user
      if (!$this->has_principal) {
        $default_calendar_name = $this->rc->config->get('default_calendar_name', null);
        if (!isset($default_calendar_name)) {
          $default_calendar_name = $this->user->fullname;
        }
        $this->create_calendar(
          array('id' => $this->user->uid, 'name' => $default_calendar_name, 'color' => $this->_random_color()), 
          true);
      }
      $default_calendar = $this->user->getDefaultCalendar();
      $calendars = [];
      foreach ($this->calendars as $id => $cal) {
        if (isset($hidden_calendars[$cal->id])
            && ! ($filter & self::FILTER_ALL)
            && (count($hidden_calendars) < count($this->calendars)
                || $this->user->uid != $cal->id)) {
          continue;
        }
        $rcId = driver_mel::gi()->mceToRcId($cal->id);
        // Gestion du order
        $order = array_search($rcId, $sort_calendars);
        if ($order === false) {
          if ($cal->id == $this->user->uid)
            $order = 1000;
          else if ($cal->owner == $this->user->uid)
            $order = 2000;
          else
            $order = 3000;
        }
        // Gestion des paramètres du calendrier
        if (is_array($color_calendars) && isset($color_calendars[$cal->id])) {
          $color = $color_calendars[$cal->id];
        }
        else {
          $save_prefs = true;
          $color = $this->_random_color();
          if (!is_array($color_calendars)) {
            $color_calendars = [];
          }
          $color_calendars[$cal->id] = $color;
        }
        // Gestion des calendriers actifs
        if (is_array($active_calendars)) {
          $active = isset($active_calendars[$cal->id]);
        }
        else if ($cal->id == $this->user->uid) {
          $save_prefs = true;
          $active = true;
          $active_calendars = [ $cal->id => 1 ];
        }
        // Gestion des alarmes dans les calendriers
        if (is_array($alarm_calendars)) {
          $alarm = isset($alarm_calendars[$cal->id]);
        }
        else if ($cal->id == $this->user->uid) {
          $alarm = true;
          $alarm_calendars = [ $cal->id => 1 ];
        }
        // Se limiter aux calendriers actifs
        // Se limiter aux calendriers perso
        if (($filter & self::FILTER_ACTIVE) && ! $active || ($filter & self::FILTER_PERSONAL) && $cal->owner != $this->user->uid)
          continue;
        // Gestion des droits du calendrier
        if ($cal->id == $this->user->uid) {
          $rights = 'lrswiktev';
        }
        else if ($cal->owner == $this->user->uid) {
          $rights = 'lrswikxteav';
        }
        else if ($cal->asRight(LibMelanie\Config\ConfigMelanie::WRITE)) {
          $rights = 'lrsw';
        }
        else if ($cal->asRight(LibMelanie\Config\ConfigMelanie::READ)) {
          $rights = 'lrs';
        }
        else {
          $rights = 'l';
        }
        // formatte le calendrier pour le driver
        $calendars[$rcId] = array(
            'id' => $rcId,
            'order' => $order,
            'name' => $cal->name,
            'listname' => $cal->owner == $this->user->uid ? $cal->name : "[" . $cal->owner . "] " . $cal->name,
            'editname' => $this->user->uid == $cal->id ? $this->rc->gettext('personalcalendar', 'mel_larry') : ($cal->owner == $this->user->uid ? $cal->name : "[" . $cal->owner . "] " . $cal->name),
            'color' => $color,
            'showalarms' => $alarm ? 1 : 0,
            'default' => $default_calendar->id == $cal->id,
            'active' => $active,
            'owner' => $cal->owner,
            'children' => false, // TODO: determine if that folder indeed has child folders
            'caldavurl' => '',
            'history' => false,
            'virtual' => false,
            'editable' => $cal->asRight(LibMelanie\Config\ConfigMelanie::WRITE),
            'deletable' => $cal->owner == $this->user->uid && $cal->id != $this->user->uid,
            'rights' => $rights,
            'group' => trim(($cal->owner == $this->user->uid ? 'personnal' : 'shared') . ' ' . ($default_calendar->id == $cal->id ? 'default' : '')),
            'class' => 'user',
    				'caldavurl' => $this->get_caldav_url($cal),
        );
      }

      if ($save_prefs) {
        $this->rc->user->save_prefs(array(
          'color_calendars'   => $color_calendars,
          'active_calendars'  => $active_calendars,
          'alarm_calendars'   => $alarm_calendars));
      }
      

      if (mel_logs::is(mel_logs::TRACE))
        mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::list_calendars() : " . var_export($calendars, true));

        // append the virtual birthdays calendar
      if ($this->rc->config->get('calendar_contact_birthdays', false)) {
        $prefs = $this->rc->config->get('birthday_calendar', array('color' => '87CEFA'));

        $id = self::BIRTHDAY_CALENDAR_ID;
        if (!$active || !in_array($id, $hidden_calendars)) {
          $calendars[$id] = array('id' => $id, 'name' => $this->cal->gettext('birthdays'), 'listname' => $this->cal->gettext('birthdays'), 'color' => $prefs['color'], 'showalarms' => (bool)$this->rc->config->get('calendar_birthdays_alarm_type'), 'active' => isset($active_calendars[$id]), 'group' => 'x-birthdays', 'editable' => false, 'default' => false, 'children' => false);
        }
      }
      uasort($calendars, function ($a, $b) {
        if ($a['order'] === $b['order'])
          return strcmp(strtolower($a['listname']), strtolower($b['listname']));
        else
          return strnatcmp($a['order'], $b['order']);
      });
      // Retourne la concaténation des agendas pour avoir une liste ordonnée
      return $calendars;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::list_calendars() Melanie2DatabaseException");
      return array();
    }
    catch (\Exception $ex) {
      return array();
    }
    return array();
  }

  /**
   * Create a new calendar assigned to the current user
   *
   * @param array Hash array with calendar properties
   * name: Calendar name
   * color: The color of the calendar
   * @param boolean $defaultCalendar Calendrier par défaut ?
   * @return mixed ID of the calendar on success, False on error
   */
  public function create_calendar($prop, $defaultCalendar = false) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::create_calendar()");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::create_calendar() : " . var_export($prop, true));

    try {
      if ($defaultCalendar) {
        $ret = $this->user->createDefaultCalendar($prop['name']);
      }
      else {
        $calendar = driver_mel::gi()->calendar([$this->user]);
        $calendar->name = $prop['name'];
        $calendar->id = isset($prop['id']) ? driver_mel::gi()->rcToMceId($prop['id']) : md5($prop['name'] . time() . $this->user->uid);
        $calendar->owner = $this->user->uid;
        $ret = $calendar->save();
      }
      if ($ret) {
        // Récupération des préférences de l'utilisateur
        $active_calendars = $this->rc->config->get('active_calendars', array());
        $color_calendars = $this->rc->config->get('color_calendars', array());
        $alarm_calendars = $this->rc->config->get('alarm_calendars', array());
        // Display cal
        $active_calendars[$calendar->id] = 1;
        // Color cal
        $color_calendars[$calendar->id] = $prop['color'];
        // Showalarm ?
        if ($prop['showalarms'] == 1) {
          $alarm_calendars[$calendar->id] = 1;
        }
        $this->rc->user->save_prefs(array('color_calendars' => $color_calendars,'active_calendars' => $active_calendars,'alarm_calendars' => $alarm_calendars));

        // Return the calendar id
        return $calendar->id;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::create_calendar() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Update properties of an existing calendar
   *
   * @see calendar_driver::edit_calendar()
   */
  public function edit_calendar($prop) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::edit_calendar()");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::edit_calendar() : " . var_export($prop, true));

    try {
      // birthday calendar properties are saved in user prefs
      if ($prop['id'] == self::BIRTHDAY_CALENDAR_ID) {
        $prefs['birthday_calendar'] = $this->rc->config->get('birthday_calendar', array('color' => '87CEFA'));
        if (isset($prop['color']))
          $prefs['birthday_calendar']['color'] = $prop['color'];
        if (isset($prop['showalarms']))
          $prefs['calendar_birthdays_alarm_type'] = $prop['showalarms'] ? $this->alarm_types[0] : '';
        $this->rc->user->save_prefs($prefs);
        return true;
      }

      // Chargement des calendriers si besoin
      if (! isset($this->calendars)) {
        $this->_read_calendars();
      }
      if (isset($prop['id'])) {
        $id = driver_mel::gi()->rcToMceId($prop['id']);
        if (isset($this->calendars[$id])) {
          $cal = $this->calendars[$id];
          if (isset($prop['name']) && $cal->owner != $cal->id && $cal->owner == $this->user->uid && $prop['name'] != "" && $prop['name'] != $cal->name) {
            $cal->name = $prop['name'];
            $cal->save();
          }
          // Récupération des préférences de l'utilisateur
          $color_calendars = $this->rc->config->get('color_calendars', array());
          $alarm_calendars = $this->rc->config->get('alarm_calendars', array());
          $param_change = false;
          if (! isset($color_calendars[$cal->id]) || $color_calendars[$cal->id] != $prop['color']) {
            $color_calendars[$cal->id] = $prop['color'];
            $param_change = true;
          }
          if (! isset($alarm_calendars[$cal->id]) && $prop['showalarms'] == 1) {
            $alarm_calendars[$cal->id] = 1;
            $param_change = true;
          }
          elseif (isset($alarm_calendars[$cal->id]) && $prop['showalarms'] == 0) {
            unset($alarm_calendars[$cal->id]);
            $param_change = true;
          }
          if ($param_change) {
            $this->rc->user->save_prefs(array('color_calendars' => $color_calendars,'alarm_calendars' => $alarm_calendars));
          }
          return true;
        }
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::edit_calendar() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Set active/subscribed state of a calendar
   * Save a list of hidden calendars in user prefs
   *
   * @see calendar_driver::subscribe_calendar()
   */
  public function subscribe_calendar($prop) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return;
    }
    $id = driver_mel::gi()->rcToMceId($prop['id']);
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::subscribe_calendar($id)");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::subscribe_calendar() : " . var_export($prop, true));
      // Récupération des préférences de l'utilisateur
    $active_calendars = $this->rc->config->get('active_calendars', array());

    if (! $prop['active'])
      unset($active_calendars[$id]);
    else
      $active_calendars[$id] = 1;

    return $this->rc->user->save_prefs(array('active_calendars' => $active_calendars));
  }

  /**
   * Delete the given calendar with all its contents
   *
   * @see calendar_driver::remove_calendar()
   */
  public function delete_calendar($prop) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return false;
    }
    $id = driver_mel::gi()->rcToMceId($prop['id']);
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::remove_calendar($id)");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::remove_calendar() : " . var_export($prop, true));

    try {
      // Chargement des calendriers si besoin
      if (! isset($this->calendars)) {
        $this->_read_calendars();
      }
      if (isset($id) && isset($this->calendars[$id]) && $this->calendars[$id]->owner == $this->user->uid && $this->calendars[$id]->id != $this->user->uid) {
        // Récupération des préférences de l'utilisateur
        $hidden_calendars = $this->rc->config->get('hidden_calendars', array());
        $active_calendars = $this->rc->config->get('active_calendars', array());
        $color_calendars = $this->rc->config->get('color_calendars', array());
        $alarm_calendars = $this->rc->config->get('alarm_calendars', array());
        unset($hidden_calendars[$id]);
        unset($active_calendars[$id]);
        unset($color_calendars[$id]);
        unset($alarm_calendars[$id]);
        $this->rc->user->save_prefs(array('color_calendars' => $color_calendars,'active_calendars' => $active_calendars,'alarm_calendars' => $alarm_calendars,'hidden_calendars' => $hidden_calendars));
        return $this->calendars[$id]->delete();
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::remove_calendar() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Delete all the events in the given calendar
   *
   * @param array Hash array with calendar properties
   * id: Calendar Identifier
   * @return boolean True on success, Fales on failure
   * @see calendar_driver::remove_calendar()
   */
  public function delete_all_events($prop) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return false;
    }
    $id = driver_mel::gi()->rcToMceId($prop['id']);
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::delete_all_events($id)");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::delete_all_events() : " . var_export($prop, true));

    try {
      // Chargement des calendriers si besoin
      if (! isset($this->calendars)) {
        $this->_read_calendars();
      }
      if (isset($id) && isset($this->calendars[$id]) && $this->calendars[$id]->owner == $this->user->uid) {
        $calendar = $this->calendars[$id];
        // Récupération de tous
        $events = $calendar->getAllEvents();
        $result = true;
        // Parcours les évènements et les supprime
        foreach ($events as $event) {
          $result &= $event->delete();
        }
        return $result;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::delete_all_events() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Search for shared or otherwise not listed calendars the user has access
   *
   * @param string Search string
   * @param string Section/source to search
   * @return array List of calendars
   */
  public function search_calendars($query, $source) {
    $_query = $query;
    $_source = $source;
  }

  /**
   * Add a single event to the database
   *
   * @param array Hash array with event properties
   * @see calendar_driver::new_event()
   */
  public function new_event($event, $new = true) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return false;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::new_event(" . $event['title'] . ", $new)");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::new_event() : " . var_export($event, true));

    try {
      // Chargement des calendriers si besoin
      if (!isset($this->calendars)) {
        $this->_read_calendars();
      }
      $event['calendar'] = driver_mel::gi()->rcToMceId($event['calendar']);

      if (!$this->validate($event) || empty($this->calendars) || !isset($this->calendars[$event['calendar']]) || ! $this->calendars[$event['calendar']]->asRight(LibMelanie\Config\ConfigMelanie::WRITE)) {
        return false;
      }
      // Génère l'évènement
      $_event = driver_mel::gi()->event([$this->user, $this->calendars[$event['calendar']]]);
      // Calcul de l'uid de l'évènment
      if (isset($event['uid']) && !empty($event['uid'])) {
        $_event->uid = $event['uid'];
      }
      elseif (isset($event['id'])) {
        $id = $event['id'];
        if (strpos($id, '@DATE-') !== false) {
          $id = explode('@DATE-', $id);
          $id = $id[0];
        }
        else if (strpos($id, self::RECURRENCE_ID) !== false) {
          $id = substr($id, 0, strlen($id) - strlen(self::RECURRENCE_DATE . self::RECURRENCE_ID));
          if (!isset($event['_savemode'])) {
            $event['_savemode'] = 'current';
          }
        }
        $_event->uid = $id;
        $event['uid'] = $id;
      }
      elseif ($new) {
        $_event->uid = $this->cal->generate_uid();
      }
      else {
        return false;
      }
      // MANTIS 0005564: Un évt avec participants, modifié par un participant comme nouvel évt garde l'organisateur initial
      if ($event['copy'] && !empty($event['attendees'])) {
        $identity = $this->rc->user->get_identity();
        foreach ($event['attendees'] as $k => $att) {
          if (strtolower($att['role']) == 'organizer') {
            $event['attendees'][$k]['name'] = $identity['name'];
            $event['attendees'][$k]['email'] = $identity['email'];
          }
          else if (strtolower($att['email']) == strtolower($identity['email'])) {
            // Ne pas garder l'organisateur s'il est dans la liste des participants
            unset($event['attendees'][$k]);
          }
          else {
            $event['attendees'][$k]['status'] = 'NEEDS-ACTION';
          }
        }
      }
      // Chargement de l'évènement pour savoir s'il s'agit d'un évènement privé donc non modifiable
      if (!$new && $_event->load()) {
        $loaded = true;
        // // Test si l'utilisateur est seulement participant
        // $organizer = $_event->organizer;
        // if (isset($organizer) 
        //     && !$organizer->extern
        //     && !empty($organizer->uid)
        //     && ($organizer->uid != $this->rc->get_user_name() 
        //       || $this->currentUserIsOrganiser($organizer))) {
        //   return true;
        // }
        // Test si privé
        $is_private = (($event->class == LibMelanie\Api\Defaut\Event::CLASS_PRIVATE || $event->class == LibMelanie\Api\Defaut\Event::CLASS_CONFIDENTIAL) && $this->calendars[$event->calendar]->owner != $this->user->uid && $event->owner != $this->user->uid && ! $this->calendars[$event->calendar]->asRight(LibMelanie\Config\ConfigMelanie::PRIV));

        if ($is_private) {
          return true;
        }
        $old = $this->_read_postprocess($_event);
      }
      else {
        $loaded = false;
        $_event->uid = str_replace('/', '', $_event->uid);
      }
      if (isset($event['_savemode']) && $event['_savemode'] == 'current') {
        $_exception = driver_mel::gi()->exception([$_event, $this->user, $this->calendars[$event['calendar']]]);
        // Converti les données de l'évènement en exception Mél
        $exceptions = $_event->exceptions;
        // Positionnement de la recurrence_id et de l'uid
        $id = $event['id'];
        if (strpos($id, '@DATE-') !== false) {
          $_instance = explode('@DATE-', $event['id'], 2)[1];
          $recid = date('Ymd', $_instance);
          if (!$new && isset($exceptions[$recid])) {
            $_exception = $exceptions[$recid];
          }
          else {
            $_exception->recurrence_id = date(self::DB_DATE_FORMAT, intval($_instance));
          }
        }
        else if (strpos($id, self::RECURRENCE_ID) !== false) {
          $recid = substr($id, strlen($id) - strlen(self::RECURRENCE_DATE . self::RECURRENCE_ID) + 1, - strlen(self::RECURRENCE_ID));
          if (!$new && isset($exceptions[$recid])) {
            $_exception = $exceptions[$recid];
          }
          else {
            $recIdDT = DateTime::createFromFormat('Ymd His', $recid . ' ' . $event['start']->format('His'));
            $_exception->recurrence_id = $recIdDT->format(self::DB_DATE_FORMAT);
          }
        }
        else if ($event['start'] instanceof DateTime) {
          $_exception->recurrence_id = $event['start']->format(self::DB_DATE_FORMAT);
        }
        $_exception->uid = $event['uid'];
        $_exception->deleted = false;
        $_event->deleted = $loaded ? false : true;
        if (!isset($recid)) {
          $recid = date('Ymd', strtotime($_exception->recurrence_id));
        }
        $exceptions[$recid] = $this->_write_postprocess($_exception, $event, true);
        $_event->exceptions = $exceptions;
        $_event->modified = time();
      }
      else if (isset($event['_savemode']) && $event['_savemode'] == 'future') {
        // Positionnement de la recurrence_id et de l'uid
        $id = $event['id'];
        if (strpos($id, '@DATE-') !== false) {
          $date = explode('@DATE-', $event['id']);
          $date = $date[1];
          $enddate = new \DateTime('@'.$date);
        }
        else {
          // Définition de la date de fin pour la récurrence courante
          $enddate = clone ($event['start']);
        }
        if ($enddate->getTimestamp() == strtotime($_event->start)) {
            // Converti les données de l'évènement en évènement Mél
            $_event = $this->_write_postprocess($_event, $event, false);
        }
        else {
            $enddate->sub(new DateInterval('P1D'));

            $_event->recurrence->enddate = $enddate->format(self::DB_DATE_FORMAT);
            $_event->recurrence->count = '';
            $_event->save();
            // Création de la nouvelle
            $_event = driver_mel::gi()->event([$this->user, $this->calendars[$event['calendar']]]);
            // Converti les données de l'évènement en évènement Mél
            $_event = $this->_write_postprocess($_event, $event, true);
            $_event->uid = $event['uid'] . "-" . strtotime($event['start']->format(self::DB_DATE_FORMAT)) . '@future';
        }
      }
      else if (isset($event['_savemode']) && $event['_savemode'] == 'new') {
        $event['uid'] = $_event->uid;
        // Création de la nouvelle
        $_event = driver_mel::gi()->event([$this->user, $this->calendars[$event['calendar']]]);
        // Converti les données de l'évènement en évènement Mél
        $_event = $this->_write_postprocess($_event, $event, true);
        $_event->uid = $event['uid'] . "-" . strtotime($event['start']->format(self::DB_DATE_FORMAT)) . '@new';
      }
      else {
        if (isset($old) && strpos($event['id'], '@DATE-') !== false) {
          $tmp = explode('@DATE-', $event['id'], 2);
          $date = date(self::DB_DATE_FORMAT, $tmp[1]);
          if ($date == $event['start']->format(self::DB_DATE_FORMAT) && $event['allday'] == $old['allday']) {
            $event['start'] = $old['start'];
            $event['end'] = $old['end'];
          }
        }
        // Converti les données de l'évènement en évènement Mél
        $_event = $this->_write_postprocess($_event, $event, $new);
      }

      if ($_event->save() !== null) {
        // add attachments
        if (is_array($event['attachments'])) {
          foreach ($event['attachments'] as $attachment) {
            $this->add_attachment($attachment, $_event);
            unset($attachment);
          }
        }

        // remove attachments
        if (is_array($event['deleted_attachments'])) {
          foreach ($event['deleted_attachments'] as $attachment) {
            $this->remove_attachment($attachment, $_event->uid);
          }
        }
        return $_event->uid;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::new_event() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::new_event() Exception : " . $ex->getTraceAsString());
      return false;
    }
    return false;
  }

  /**
   * Update an event entry with the given data
   *
   * @param array Hash array with event properties
   * @see calendar_driver::edit_event()
   */
  public function edit_event($event) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return false;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::edit_event()");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::edit_event() : " . var_export($event, true));
    if ($this->new_event($event, false)) {
      if (isset($event['_fromcalendar'])) {
        $deleted_event = $event;
        $deleted_event['calendar'] = $event['_fromcalendar'];
        return $this->remove_event($deleted_event);
      }
      return true;
    }
    return false;
  }

  /**
   * Est-ce que l'utilisateur courant est organisateur ?
   * 
   * @param Organizer $organizer
   * 
   * @return boolean
   */
  protected function currentUserIsOrganiser($organizer) {
    $bal = driver_mel::gi()->user();
    $bal->email = $organizer->email;
    return $bal->load('shares') 
        && isset($bal->shares[$this->rc->get_user_name()])
        && ($bal->shares[$this->rc->get_user_name()]->type == \LibMelanie\Api\Defaut\Users\Share::TYPE_ADMIN 
          || $bal->shares[$this->rc->get_user_name()]->type == \LibMelanie\Api\Defaut\Users\Share::TYPE_SEND
          || $bal->shares[$this->rc->get_user_name()]->type == \LibMelanie\Api\Defaut\Users\Share::TYPE_WRITE);
  }

  /**
   * Move a single event
   *
   * @param array Hash array with event properties
   * @see calendar_driver::move_event()
   */
  public function move_event($event, $resize = false) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return false;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::move_event()");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::move_event() : " . var_export($event, true));

    try {
      // Chargement des calendriers si besoin
      if (!isset($this->calendars)) {
        $this->_read_calendars();
      }

      $event['calendar'] = driver_mel::gi()->rcToMceId($event['calendar']);

      if (!$this->validate($event) || empty($this->calendars) || ! isset($this->calendars[$event['calendar']]) || ! $this->calendars[$event['calendar']]->asRight(LibMelanie\Config\ConfigMelanie::WRITE)) {
        return false;
      }
      // Récupère le timezone
      // Génère l'évènement
      $_event = driver_mel::gi()->event([$this->user, $this->calendars[$event['calendar']]]);
      // Calcul de l'uid de l'évènment
      if (isset($event['uid'])) {
        $_event->uid = $event['uid'];
      }
      elseif (isset($event['id'])) {
        $id = $event['id'];
        if (strpos($id, '@DATE-') !== false) {
          $id = explode('@DATE-', $id);
          $id = $id[0];
        }
        else if (strpos($id, self::RECURRENCE_ID) !== false) {
          $id = substr($id, 0, strlen($id) - strlen(self::RECURRENCE_DATE . self::RECURRENCE_ID));
          if (!isset($event['_savemode'])) {
            $event['_savemode'] = 'current';
          }
        }
        $_event->uid = $id;
        $event['uid'] = $id;
      }
      else {
        return false;
      }
      // Chargement de l'évènement pour savoir s'il s'agit d'un évènement privé donc non modifiable
      if ($_event->load()) {
        // Test si l'utilisateur est seulement participant
        // $organizer = $_event->organizer;
        // if (isset($organizer) 
        //     && !$organizer->extern
        //     && !empty($organizer->uid)
        //     && ($organizer->uid != $this->rc->get_user_name() 
        //       || $this->currentUserIsOrganiser($organizer))) {
        //   return true;
        // }
        // Test si privé
        $is_private = (($event->class == LibMelanie\Api\Defaut\Event::CLASS_PRIVATE || $event->class == LibMelanie\Api\Defaut\Event::CLASS_CONFIDENTIAL) && $this->calendars[$event->calendar]->owner != $this->user->uid && $event->owner != $this->user->uid && ! $this->calendars[$event->calendar]->asRight(LibMelanie\Config\ConfigMelanie::PRIV));

        if ($is_private) {
          return true;
        }
        if (isset($event['_savemode']) && $event['_savemode'] == 'current') {
          $_exception = driver_mel::gi()->exception([$_event, $this->user, $this->calendars[$event['calendar']]]);
          // Converti les données de l'évènement en exception Mél
          $exceptions = $_event->exceptions;
          if (!is_array($exceptions))
            $exceptions = array();
          $e = $this->_read_postprocess($_event);
          unset($e['recurrence']);
          $e['start'] = $event['start'];
          $e['end'] = $event['end'];
          if (!$resize)
            $e['allday'] = $event['allday'];
          // Positionnement de la recurrence_id et de l'uid
          $id = $event['id'];
          if (strpos($id, '@DATE-') !== false) {
            $recid = explode('@DATE-', $event['id']);
            $recid = $recid[1];
            $_exception->recurrence_id = date(self::DB_DATE_FORMAT, intval($recid));
          }
          else if (strpos($id, self::RECURRENCE_ID) !== false) {
            $recid = substr($id, strlen($id) - strlen(self::RECURRENCE_DATE . self::RECURRENCE_ID) + 1, - strlen(self::RECURRENCE_ID));
            $recIdDT = DateTime::createFromFormat('Ymd His', $recid . ' ' . $event['start']->format('His'));
            $_exception->recurrence_id = $recIdDT->format(self::DB_DATE_FORMAT);
          }
          else if ($event['start'] instanceof DateTime) {
            $_exception->recurrence_id = $event['start']->format(self::DB_DATE_FORMAT);
          }
          $_exception->uid = $_event->uid;
          $_exception->deleted = false;
          // Génération de l'exception
          $_exception = $this->_write_postprocess($_exception, $e, true);
          $exceptions[] = $_exception;
          $_event->exceptions = $exceptions;
          $_event->modified = time();
        }
        else if (isset($event['_savemode']) && $event['_savemode'] == 'future') {
          $e = $this->_read_postprocess($_event);
          // Génération de nouvel identifiant
          $e['id'] = $e['id'] . "-" . strtotime($event['start']->format(self::DB_DATE_FORMAT)) . '@rc_future';
          $e['uid'] = $e['id'];
          // Modification de la date
          $e['start'] = $event['start'];
          $e['end'] = $event['end'];
          if (! $resize)
            $e['allday'] = $event['allday'];
            // Définition de la date de fin pour la récurrence courante
          $enddate = clone ($event['start']);
          $enddate->sub(new DateInterval('P1D'));
          $_event->recurrence->enddate = $enddate->format(self::DB_DATE_FORMAT);
          $_event->save();
          // Création de la nouvelle
          $_event = driver_mel::gi()->event([$this->user, $this->calendars[$event['calendar']]]);
          // Converti les données de l'évènement en évènement Mél
          $_event = $this->_write_postprocess($_event, $e, true);
          $_event->uid = $e['uid'];
        }
        else if (isset($event['_savemode']) && $event['_savemode'] == 'new') {
          $e = $this->_read_postprocess($_event);
          // Génération de nouvel identifiant
          $e['uid'] = $e['id'] . "-" . strtotime($event['start']->format(self::DB_DATE_FORMAT)) . '@rc_new';
          // Création de la nouvelle
          $_event = driver_mel::gi()->event([$this->user, $this->calendars[$event['calendar']]]);
          // Converti les données de l'évènement en évènement Mél
          $_event = $this->_write_postprocess($_event, $e, true);
          $_event->uid = $e['uid'];
        }
        else {
          if ($resize) {
            $e = $this->_read_postprocess($_event);
            $event['allday'] = $e['allday'];
          }
          // Converti les données de l'évènement en évènement Mél
          $_event = $this->_write_postprocess($_event, $event, false, true);
        }
        if ($_event->save() !== null) {
          return true;
        }
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::move_event() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Resize a single event
   *
   * @param array Hash array with event properties
   * @see calendar_driver::resize_event()
   */
  public function resize_event($event) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return false;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::move_event()");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::resize_event() : " . var_export($event, true));
    return $this->move_event($event, true);
  }

  /**
   * Convert a rcube style event object into sql record
   *
   * @param LibMelanie\Api\Defaut\Event $_event
   * @param array $event
   * @param boolean $new
   * 
   * @return LibMelanie\Api\Defaut\Event $_event
   */
  private function _write_postprocess($_event, $event, $new, $move = false) {
    // Gestion des données de l'évènement
    if ($new) {
      $_event->created = time();
    }    
    $_event->all_day = isset($event['allday']) && $event['allday'] == 1;
    if (isset($event['start'])) {
      if ($_event->all_day) {
        $_event->start = $event['start']->format(self::SHORT_DB_DATE_FORMAT) . ' 00:00:00';
      }
      else {
        $_event->start = $event['start'];
      }
      $_event->timezone = $event['start']->getTimezone()->getName();
    }
    if (isset($event['end'])) {
      if ($_event->all_day) {
        $event['end']->add(new DateInterval("P1D"));
        $_event->end = $event['end']->format(self::SHORT_DB_DATE_FORMAT) . ' 00:00:00';
      }
      else {
        $_event->end = $event['end'];
      }
    }
    if ($new) {
      $_event->owner = $this->user->uid;
    }
    if (!$move) {
      if (isset($event['title'])) {
        $_event->title = strval($event['title']);
      }
      if (isset($event['description'])) {
        $_event->description = strval($event['description']);
      }
      if (isset($event['location'])) {
        $_event->location = strval($event['location']);
      }
      if (isset($event['categories'])) {
        if (is_array($event['categories'])) {
          $_event->category = implode(',',$event['categories']);
        }
        else {
          $_event->category = strval($event['categories']);
        }
      }
      // TODO: alarm
      if (isset($event['alarms'])) {
        $valarm = explode(':', $event['alarms']);
        if (isset($valarm[0])) {
          $_event->alarm = mel_mapping::valarm_ics_to_minutes_trigger($valarm[0]);
        }
      }
      // Utilisation du valarms
      if (isset($event['valarms'])) {
        if (isset($event['valarms'][0]) && isset($event['valarms'][0]['trigger']) && isset($event['valarms'][0]['action']) && $event['valarms'][0]['action'] == 'DISPLAY') {
          $_event->alarm = mel_mapping::valarm_ics_to_minutes_trigger($event['valarms'][0]['trigger']);
          // Remove cache
          \mel::unsetCache('events_alarm');
        }
      }
      else {
        $_event->alarm = 0;
      }
    }
    // Recurrence
    if (isset($event['recurrence']) && !empty($event['recurrence']) && strpos(get_class($_event), '\Exception') === false) {
      $_event->recurrence->rrule = $event['recurrence'];
    }
    // Status
    if (isset($event['status'])) {
      $_event->status = mel_mapping::rc_to_m2_status($event['status']);
    }
    // Transparency
    if ($_event->status == LibMelanie\Api\Defaut\Event::STATUS_NONE) {
      $_event->transparency = LibMelanie\Api\Defaut\Event::TRANS_TRANSPARENT;
    }
    else {
      $_event->transparency = LibMelanie\Api\Defaut\Event::TRANS_OPAQUE;
    }    
    // Class
    if (isset($event['sensitivity'])) {
      $_event->class = mel_mapping::rc_to_m2_class($event['sensitivity']);
    }
    // attendees
    if (isset($event['attendees']) && count($event['attendees']) > 0) {
      $_attendees = array();
      foreach ($event['attendees'] as $event_attendee) {
        if (isset($event_attendee['role']) && $event_attendee['role'] == 'ORGANIZER') {
          if (count($event['attendees']) != 1) {
            $organizer = driver_mel::gi()->organizer([$_event]);
            if (isset($event_attendee['email'])) {
              $organizer->email = $event_attendee['email'];
            }
            if (isset($event_attendee['name'])) {
              $organizer->name = $event_attendee['name'];
            }
            $_event->organizer = $organizer;
          }
        }
        else {
          $attendee = driver_mel::gi()->attendee();
          if (isset($event_attendee['name'])) {
            $attendee->name = $event_attendee['name'];
          }
          if (isset($event_attendee['email'])) {
            $attendee->email = $event_attendee['email'];
          }
          // attendee role
          if (isset($event_attendee['role'])) {
            $attendee->role = mel_mapping::rc_to_m2_attendee_role($event_attendee['role']);
          }
          // attendee status
          if (isset($event_attendee['status'])) {
            $attendee->response = mel_mapping::rc_to_m2_attendee_status($event_attendee['status']);
          }
          $_attendees[] = $attendee;
        }
      }
      $_event->attendees = $_attendees;
    }
    // Modified time
    $_event->modified = time();

    return $_event;
  }

  /**
   * Remove a single event from the database
   *
   * @param array Hash array with event properties
   * @param boolean Remove record irreversible (@TODO)
   * @see calendar_driver::remove_event()
   */
  public function remove_event($event, $force = true) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return false;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::remove_event()");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::remove_event() : " . var_export($event, true));

    try {
      // Chargement des calendriers si besoin
      if (!isset($this->calendars)) {
        $this->_read_calendars();
      }

      $event['calendar'] = driver_mel::gi()->rcToMceId($event['calendar']);

      if (empty($this->calendars) || ! isset($event['calendar']) || ! isset($this->calendars[$event['calendar']]) || ! $this->calendars[$event['calendar']]->asRight(LibMelanie\Config\ConfigMelanie::WRITE)) {
        return false;
      }
      // Génère l'évènement
      $_event = driver_mel::gi()->event([$this->user, $this->calendars[$event['calendar']]]);
      if (isset($event['uid'])) {
        $_event->uid = $event['uid'];
      }
      elseif (isset($event['id'])) {
        $id = $event['id'];
        if (strpos($id, '@DATE-') !== false) {
          $id = explode('@DATE-', $id);
          $id = $id[0];
        }
        else if (strpos($id, self::RECURRENCE_ID) !== false) {
          $id = substr($id, 0, strlen($id) - strlen(self::RECURRENCE_DATE . self::RECURRENCE_ID));
          if (!isset($event['_savemode'])) {
            $event['_savemode'] = 'current';
          }
        }
        $_event->uid = $id;
      }
      else {
        return false;
      }
      if ($event['_savemode'] == 'all') {
        if ($_event->load()) {
          foreach ($_event->exceptions as $exception) {
            $exception_uid = $exception->uid;
            $exception->delete();
            $this->remove_event_attachments($exception_uid);
          }
        }
        $event_uid = $_event->uid;
        if ($_event->delete()) {
          $this->remove_event_attachments($event_uid);
          return true;
        }
        else {
          return false;
        }
      }
      elseif ($event['_savemode'] == 'current') {
        if ($_event->load()) {
          $_exception = driver_mel::gi()->exception([$_event, $this->user, $this->calendars[$event['calendar']]]);
          // Converti les données de l'évènement en exception Mél
          $exceptions = $_event->exceptions;
          // Positionnement de la recurrence_id et de l'uid
          $id = $event['id'];
          if (strpos($id, '@DATE-') !== false) {
            $recid = explode('@DATE-', $event['id']);
            $recid = $recid[1];
            $_exception->recurrence_id = date(self::DB_DATE_FORMAT, intval($recid));
          }
          else if (strpos($id, self::RECURRENCE_ID) !== false) {
            $recid = substr($id, strlen($id) - strlen(self::RECURRENCE_DATE . self::RECURRENCE_ID) + 1, - strlen(self::RECURRENCE_ID));
            // si l'événement parent est supprimé on est dans un faked master
            if ($_event->deleted && count($exceptions) === 1 && isset($exceptions[$recid])) {
              return $_event->delete();
            }
            if (isset($event['start']) && $event['start'] instanceof DateTime) {
              $recIdDT = DateTime::createFromFormat('Ymd His', $recid . ' ' . $event['start']->format('His'));
              $_exception->recurrence_id = $recIdDT->format(self::DB_DATE_FORMAT);
            }
            else if (isset($exceptions[$recid])) {
              $_exception = $exceptions[$recid];
            }
          }
          else if (isset($event['_instance'])) {
            $_exception->recurrence_id = date(self::DB_DATE_FORMAT, $event['_instance']);
          }
          else if ($event['start'] instanceof DateTime) {
            $_exception->recurrence_id = $event['start']->format(self::DB_DATE_FORMAT);
          }
          $_exception->uid = $_event->uid;
          $_exception->deleted = true;
          // Supprimer la récurrence si elle est dans la liste
          foreach ($exceptions as $key => $ex) {
            if ($ex->recurrence_id == $_exception->recurrence_id) {
              $exceptions[$key]->delete();
              unset($exceptions[$key]);
            }
          }
          $exceptions[] = $_exception;
          $_event->exceptions = $exceptions;
          $_event->modified = time();
          $ret = $_event->save();
          return !is_null($ret);
        }
      }
      elseif ($event['_savemode'] == 'future') {
        if ($_event->load()) {
          // Positionnement de la recurrence_id et de l'uid
          $recid = explode('@DATE-', $event['id']);
          $recid = $recid[1];
          $_event->recurrence->enddate = date(self::SHORT_DB_DATE_FORMAT, intval($recid));
          $_event->recurrence->count = '';
          if (strtotime($_event->recurrence->enddate) < strtotime($_event->start)) {
            return $_event->delete();
          }
          else {
            $ret = $_event->save();
            // MANTIS 0006327: Problème avec la suppression d'une occurrence et les suivantes pour une invitation
            return is_null($ret) ? false : $_event->uid;
          }
        }
      }
      else {
        // 0005105: La suppression d'un événement simple ne le charge pas
        if ($_event->load()) {
          if ($_event->delete()) {
            $this->remove_event_attachments($_event->uid);
            // Tester si c'est une réunion et que l'organisateur est sur Mel pour refuser l'invitation
            $organizer_calendar = $_event->organizer->calendar;
            if (isset($organizer_calendar)) {
              // L'organisateur existe on va modifier le statut du participant
              $organizer_event = driver_mel::gi()->event();
              $organizer_event->uid = $_event->uid;
              $organizer_event->calendar = $_event->organizer->calendar;
              if ($organizer_event->load()) {
                $attendees = $organizer_event->attendees;
                foreach ($attendees as $key => $attendee) {
                  if ($attendee->uid == $this->calendars[$event['calendar']]->owner) {
                    // Participant courant on le passe en décliné
                    $attendees[$key]->response = mel_mapping::rc_to_m2_attendee_status('DECLINED');
                    $organizer_event->attendees = $attendees;
                    $organizer_event->modified += 1;
                    $organizer_event->save();
                    break;
                  }
                }
              }
            }
            return true;
          }
          else {
            return false;
          }
        }
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::remove_event() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Return data of a single event
   *
   * @param mixed UID string or hash array with event properties:
   * id: Event identifier
   * uid: Event UID
   * _instance: Instance identifier in combination with uid (optional)
   * calendar: Calendar identifier (optional)
   * @param integer Bitmask defining the scope to search events in.
   * See FILTER_* constants for possible values.
   * @param boolean If true, recurrence exceptions shall be added
   * @return array Event object as hash array
   */
  public function get_event($event, $scope = 0, $full = false) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar' && $this->rc->task != 'mail') {
      return false;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::get_event()");
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::get_event(writeable = $writeable, active = $active, personal = $personal) : " . var_export($event, true));

    try {
      // get event from the address books birthday calendar
      // if ($cal == self::BIRTHDAY_CALENDAR_ID) {
      //   return $this->get_birthday_event($id);
      // }

      // MANTIS 3915: L'envoi d'une invitation depuis une BALP ne fonctionne pas
      $_identity = $event['_identity'] ?  : null;
      // MANTIS 3846: Le champ 'commentaire' de l'onglet Participants n'est pas pris en compte
      $_comment = $event['_comment'] ?  : null;

      // Chargement des calendriers si besoin
      if (!isset($this->calendars)) {
        $this->_read_calendars();
      }

      if (isset($event['calendar'])) {
        $event['calendar'] = driver_mel::gi()->rcToMceId($event['calendar']);
      }

      if (!isset($event['calendar'])) {
        $event['calendar'] = $this->user->uid;
      }

      if (isset($event['calendar']) && isset($this->calendars[$event['calendar']])) {
        $_event = driver_mel::gi()->event([$this->user, $this->calendars[$event['calendar']]]);
        if (isset($event['uid'])) {
          $_event->uid = $event['uid'];
        }
        elseif (isset($event['id'])) {
          $id = $event['id'];
          if (strpos($id, '@DATE-') !== false) {
            $id = explode('@DATE-', $id);
            if (isset($event['_savemode']) && $event['_savemode'] == 'current') {
              $_recurrence_date = $id[1];
            }
            $id = $id[0];
          }
          else if (strpos($id, self::RECURRENCE_ID) !== false) {
            $id = substr($id, 0, strlen($id) - strlen(self::RECURRENCE_DATE . self::RECURRENCE_ID));
          }
          $_event->uid = $id;
          $event['uid'] = $id;
        }
        else {
          return false;
        }
        if ($_event->load()) {
          if (!isset($_recurrence_date) && isset($event['_instance']) && !empty($event['_instance'])) {
            $_recurrence_date = strtotime($event['_instance']);
          }
          // Pour une exception ne donner que l'exception
          if (isset($_recurrence_date)) {
            $master = $this->_read_postprocess($_event);
            $recurrence_date = rcube_utils::anytodatetime(date("Y-m-d H:i:s", $_recurrence_date), $master['start']->getTimezone());

            // Rechercher si on est pas sur une EXDATE
            if (isset($master['recurrence']) 
                && isset($master['recurrence']['EXDATE'])
                && is_array($master['recurrence']['EXDATE'])) {
              foreach ($master['recurrence']['EXDATE'] as $exdate) {
                if ($exdate == $recurrence_date) {
                  // Il s'agit d'une occurrence supprimée le get_event doit retourner false
                  return false;
                }
              }
            }

            // Initialise l'event id avec le recurrence_date
            if (!isset($event['id'])) {
              $event['id'] = $event['uid'] . '@DATE-' . $_recurrence_date;
            }

            // Est-ce qu'il s'agit d'une occurrence ?
            if (isset($master['recurrence']) 
                && isset($master['recurrence']['EXCEPTIONS'])
                && isset($master['recurrence']['EXCEPTIONS'][$event['id']])) {
              $result = $master['recurrence']['EXCEPTIONS'][$event['id']];
              unset($result['recurrence']);
            }
            else {
              $result = $master;
              $result['id'] = $event['id'];
              if (isset($event['_instance'])) {
                $result['_instance'] = $event['_instance'];
              }
              // MANTIS 0006108: Suppression d'une occurrence depuis MélWeb(New) affiche l'annulation de la première occurrence
              // Modifier la date de la récurrence par cette de l'exception
              $interval = $master['start']->diff($master['end']);
              $result['start'] = clone $recurrence_date;
              $result['end'] = clone $recurrence_date;
              $result['end']->add($interval);
            }
            $result['recurrence_date'] = $recurrence_date;
          }
          else {
            $result = $this->_read_postprocess($_event);
          }

          if (isset($_comment)) {
            $result['_comment'] = $_comment;
          }
          if (isset($_identity)) {
            $result['_identity'] = $_identity;
          }

          $attachments = (array)$this->list_attachments($_event);
          if (count($attachments) > 0) {
            $result['attachments'] = $attachments;
          }
          return $result;
        }
      }
      else {
        $calendars = $this->calendars;
        if ($active) {
          foreach ($calendars as $idx => $cal) {
            if (! $cal['active']) {
              unset($calendars[$idx]);
            }
          }
        }
        foreach ($calendars as $cal) {
          $_event = driver_mel::gi()->event([$this->user, $cal]);
          if (isset($event['uid'])) {
            $_event->uid = $event['uid'];
          }
          elseif (isset($event['id'])) {
            $_event->uid = $event['id'];
          }
          else {
            return false;
          }
          if ($_event->load()) {
            $event = $this->_read_postprocess($_event);

            if (isset($_comment)) {
              $event['_comment'] = $_comment;
            }
            if (isset($_identity)) {
              $event['_identity'] = $_identity;
            }

            $attachments = ( array ) $this->list_attachments($_event);
            if (count($attachments) > 0) {
              $event['attachments'] = $attachments;
            }
            return $event;
          }
        }
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::get_event() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Get events from source.
   *
   * @param integer Event's new start (unix timestamp)
   * @param integer Event's new end (unix timestamp)
   * @param string Search query (optional)
   * @param mixed List of calendar IDs to load events from (either as array or comma-separated string)
   * @param boolean Include virtual events (optional)
   * @param integer Only list events modified since this time (unix timestamp)
   * @return array A list of event records
   */
  public function load_events($start, $end, $query = null, $calendars = null, $virtual = 1, $modifiedsince = null, $freebusy = false) {
    // Charge les données seulement si on est dans la tâche calendrier
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::load_events($start, $end, $query, $calendars)");

    try {
      // Chargement des calendriers si besoin
      if (! isset($this->calendars) && ! $freebusy) {
        $this->_read_calendars();
      }

      if (empty($calendars)) {
        $calendars = array_keys($this->calendars);
      }
      else if (is_string($calendars)) {
        $calendars = explode(',', $calendars);
      }
      if (count($calendars) == 0) {
        return array();
      }
      else {
        foreach ($calendars as $key => $value) {
          $calendars[$key] = driver_mel::gi()->rcToMceId($value);
        }
      }

      if ($freebusy) {
        foreach ($calendars as $key => $value) {
          $this->calendars[$value] = driver_mel::gi()->calendar([$this->user]);
          $this->calendars[$value]->id = $value;
        }
      }
      if (isset($query)) {
        $event = driver_mel::gi()->event([$this->user]);

        $cols = array('title','location','description','category');
        $operators = array();
        $filter = "#calendar#";
        $operators['calendar'] = MappingMce::eq;
        $event->calendar = $calendars;

        $filter .= " AND ((#start# AND #end#) OR (#type# AND #enddate#))";

        $operators['type'] = MappingMce::sup;
        $operators['enddate'] = MappingMce::supeq;
        $operators['start'] = MappingMce::infeq;
        $operators['end'] = MappingMce::supeq;

        $event->start = date("Y-m-d H:i:s", $end);
        $event->end = date("Y-m-d H:i:s", $start);
        $event->recurrence->type = LibMelanie\Api\Defaut\Recurrence::RECURTYPE_NORECUR;
        $event->recurrence->enddate = date("Y-m-d H:i:s", $start);

        // Ne retourne que les événements modifié depuis une date
        if (isset($modifiedsince) && is_int($modifiedsince)) {
          $filter .= " AND #modified#";
          $operators['modified'] = MappingMce::supeq;
          $event->modified = $modifiedsince;
        }

        $case_unsensitive_fields = array();

        if (isset($query)) {
          $case_unsensitive_fields = $cols;
          $filter .= " AND (";
          $first = true;
          foreach ($cols as $col) {
            if ($first) {
              $first = false;
            }
            else {
              $filter .= " OR ";
            }
            $filter .= "#$col#";
            $operators[$col] = MappingMce::like;
            $event->$col = "%$query%";
          }
          $filter .= ")";
        }
        // Liste les évènements modifiés depuis
        if (isset($modifiedsince)) {
          $event->modified = $modifiedsince;
          $operators['modified'] = MappingMce::supeq;
          $filter .= " AND #modified#";
        }
        $events = $event->getList(array(), $filter, $operators, "", true, null, null, $case_unsensitive_fields);
      }
      else {
        $events = array();
        foreach ($calendars as $calendar) {
          if (isset($this->calendars[$calendar])) {
            $events = array_merge($events, $this->calendars[$calendar]->getRangeEvents(date("Y-m-d H:i:s", $start), date("Y-m-d H:i:s", $end), $modifiedsince));
          }
        }
      }
      $_events = array();

      foreach ($events as $_e) {
        if (! $freebusy && ! $this->calendars[$_e->calendar]->asRight(LibMelanie\Config\ConfigMelanie::FREEBUSY) && ! $this->calendars[$_e->calendar]->asRight(LibMelanie\Config\ConfigMelanie::READ)) {
          continue;
        }
        if ($_e->recurrence->type === LibMelanie\Api\Defaut\Recurrence::RECURTYPE_NORECUR && ! $_e->deleted) {
          $_events[] = $this->_read_postprocess($_e, $freebusy);
        }
        else {
          require_once ($this->cal->home . '/lib/calendar_recurrence.php');
          $_event = $this->_read_postprocess($_e, $freebusy);

          if ($virtual) {
            $recurrence = new calendar_recurrence($this->cal, $_event, new DateTime(date('Y-m-d H:i:s', $start - 60 * 60 * 60 * 24)));
            // Pour la première occurrence, supprimer si une exception existe
            $master = true;
            if (isset($_event['recurrence']) && is_array($_event['recurrence']) && isset($_event['recurrence'][LibMelanie\Lib\ICS::EXDATE]) && is_array($_event['recurrence'][LibMelanie\Lib\ICS::EXDATE])) {
              foreach ($_event['recurrence'][LibMelanie\Lib\ICS::EXDATE] as $_ex) {
                // Si une exception a la même date que l'occurrence courante on ne l'affiche pas
                if ($_ex->format(self::SHORT_DB_DATE_FORMAT) == $_event['start']->format(self::SHORT_DB_DATE_FORMAT)) {
                  $master = false;
                  break;
                }
              }
            }
            if ($master) {
              // Ajout de la date de l'occurrence pour la récupérer lors des modifications
              $_event['id'] .= "@DATE-" . strtotime($_event['start']->format('Y-m-d H:i:s'));
              // Ajoute l'évènement maitre pour afficher la première occurence
              $_events[] = $_event;
            }
            // Parcour toutes les occurrences de la récurrence
            while ($next_event = $recurrence->next_instance()) {
              if (strtotime($next_event['end']->format(self::DB_DATE_FORMAT)) < $start) {
                continue;
              }
              if (strtotime($next_event['start']->format(self::DB_DATE_FORMAT)) > $end) {
                break;
              }
              // Ajout de la date de l'occurrence pour la récupérer lors des modifications
              $next_event['id'] .= "@DATE-" . strtotime($next_event['start']->format('Y-m-d H:i:s'));
              $_events[] = $next_event;
            }
            // Ajoute les exceptions
            if (isset($_event['recurrence']) && isset($_event['recurrence']['EXCEPTIONS']) && count($_event['recurrence']['EXCEPTIONS']) > 0) {
              foreach ($_event['recurrence']['EXCEPTIONS'] as $_ex) {
                $_events[] = $_ex;
              }
              unset($_event['recurrence']['EXCEPTIONS']);
            }
          }
          else {
            // Ajoute l'évènement maitre pour afficher la première occurence
            $_events[] = $_event;
          }
        }
      }
      // add events from the address books birthday calendar
      if (in_array(self::BIRTHDAY_CALENDAR_ID, $calendars) && empty($query)) {
        $_events = array_merge($_events, $this->load_birthday_events($start, $end, $search, $modifiedsince));
      }

      // if (mel_logs::is(mel_logs::TRACE))
      //   mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::load_events() events : " . var_export($_events, true));
      return $_events;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::load_events() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Get number of events in the given calendar
   *
   * @param mixed List of calendar IDs to count events (either as array or comma-separated string)
   * @param integer Date range start (unix timestamp)
   * @param integer Date range end (unix timestamp)
   * @return array Hash array with counts grouped by calendar ID
   */
  public function count_events($calendars, $start, $end = null) {

  }

  /**
   * Retourne un nom de calendrier plus court si besoin
   * @param string $calendar_name
   * @return string
   */
  private function _format_calendar_name($calendar_name) {
    if (strpos($calendar_name, ' - ') !== false) {
      $calendar_name = explode(' - ', $calendar_name);
      $calendar_name = $calendar_name[0];
    }
    if (strlen($calendar_name) > 200) {
      $calendar_name = substr($calendar_name, 0, 200);
    }
    return $calendar_name;
  }

  /**
   * Convert sql record into a rcube style event object
   *
   * @param LibMelanie\Api\Defaut\Event $event
   */
  private function _read_postprocess($event, $freebusy = false, $isexception = false) {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::_read_postprocess()");
    $_event = array();

    $_event['id'] = $event->uid;
    $_event['uid'] = $event->uid;
    $_event['calendar-name'] = $this->_format_calendar_name($this->calendars[$event->calendar]->name);

    // Evenement supprimé
    if ($event->deleted) {
      $_event['start'] = new DateTime('1970-01-01');
      $_event['end'] = new DateTime('1970-01-01');
      // Récupération des exceptions dans la récurrence de l'évènement
      $_event['recurrence'] = $this->_read_event_exceptions($event, array());
      return $_event;
    }

    // Dates
    // Savoir si c'est du journée entière (utilisation d'un endswith
    if ($event->all_day) {
      $_event['allday'] = 1;
      // Passer les journées entières à 12h - 13h pour régler les problèmes
      $_event['start'] = new DateTime(substr($event->start, 0, strlen($event->start) - strlen('00:00:00')) . '13:00:00', new DateTimeZone('GMT'));
      $_event['end'] = new DateTime(substr($event->end, 0, strlen($event->end) - strlen('00:00:00')) . '14:00:00', new DateTimeZone('GMT'));
      // Supprimer un jour pour le décalage
      $_event['end']->sub(new DateInterval("P1D"));
    }
    else {
      $_event['allday'] = 0;
      $_event['start'] = new DateTime($event->start, new DateTimeZone($event->timezone));
      $_event['end'] = new DateTime($event->end, new DateTimeZone($event->timezone));
      if ($this->cal->timezone->getName() != $event->timezone) {
        $_event['start']->setTimezone($this->cal->timezone);
        $_event['end']->setTimezone($this->cal->timezone);
      }
    }
    $_event['created'] = new DateTime(date('Y-m-d H:i:s', $event->created));
    $_event['changed'] = new DateTime(date('Y-m-d H:i:s', $event->modified));
    $_event['calendar'] = driver_mel::gi()->mceToRcId($event->calendar);

    if ($freebusy) {
      // Status
      if (isset($event->status)) {
        $_event['free_busy'] = mel_mapping::m2_to_rc_free_busy($event->status);
        $_event['status'] = mel_mapping::m2_to_rc_status($event->status);
      }

      // Recurrence
      if (!$isexception) {
        $recurrence = $event->recurrence->rrule;
        // Problème de UNTIL avec les journées entières
        if (isset($recurrence['UNTIL']) && $recurrence['UNTIL'] instanceof \DateTime && $_event['allday']) {
          $recurrence['UNTIL']->setTime(23, 59);
        }
        if (is_array($recurrence) && count($recurrence) > 0) {
          // Récupération des exceptions dans la récurrence de l'évènement
          $_event['recurrence'] = $this->_read_event_exceptions($event, $recurrence);
        }
      }
    }
    else {
      // Test si privé
      $is_private = (($event->class == LibMelanie\Api\Defaut\Event::CLASS_PRIVATE || $event->class == LibMelanie\Api\Defaut\Event::CLASS_CONFIDENTIAL) && $this->calendars[$event->calendar]->owner != $this->user->uid && $event->owner != $this->user->uid && ! $this->calendars[$event->calendar]->asRight(LibMelanie\Config\ConfigMelanie::PRIV));

      $is_freebusy = ! $this->calendars[$event->calendar]->asRight(LibMelanie\Config\ConfigMelanie::READ) && $this->calendars[$event->calendar]->asRight(LibMelanie\Config\ConfigMelanie::FREEBUSY);

      $owner = $this->calendars[$event->calendar]->owner;
      $user = $this->user->uid;
      $as_right = $this->calendars[$event->calendar]->asRight(LibMelanie\Config\ConfigMelanie::PRIV);

      // Status
      if (isset($event->status)) {
        $_event['free_busy'] = mel_mapping::m2_to_rc_free_busy($event->status);
        $_event['status'] = mel_mapping::m2_to_rc_status($event->status);
      }
      // Class
      if (isset($event->class)) {
        $_event['sensitivity'] = mel_mapping::m2_to_rc_class($event->class);
      }

      // Evenement privé
      if ($is_private) {
        $_event['title'] = $this->rc->gettext('event private', 'calendar');
      }
      // Freebusy
      else if ($is_freebusy) {
        $_event['title'] = $this->rc->gettext('event ' . $_event['free_busy'], 'calendar');
      }
      else {
        if (isset($event->title)) {
          $_event['title'] = $event->title;
        }
        if (isset($event->description)) {
          $_event['description'] = $event->description;
        }
        if (isset($event->location)) {
          $_event['location'] = $event->location;
        }
        if (isset($event->category) && !empty($event->category)) {
          $_event['categories'] = explode(',', $event->category);
        }
        // TODO: Alarme
        // Alarm
        if (isset($event->alarm) && $event->alarm != 0) {
          if ($event->alarm > 0) {
            $_event['alarms'] = "-PT" . $event->alarm . "M:DISPLAY";
            $_event['valarms'] = [['action' => 'DISPLAY','trigger' => "-PT" . $event->alarm . "M"]];
            $_event['x_moz_lastack'] = $event->getAttribute(\LibMelanie\Lib\ICS::X_MOZ_LASTACK);
            $_event['x_moz_snooze_time'] = $event->getAttribute(\LibMelanie\Lib\ICS::X_MOZ_SNOOZE_TIME);;
          }
          else {
            $_event['alarms'] = "+" . str_replace('-', '', "PT" . strval($event->alarm)) . "M:DISPLAY";
          }
        }

        // Attendees
        $attendees = $event->attendees;
        if (isset($attendees) && is_array($attendees) && ! empty($attendees)) {
          $_attendees = array();
          foreach ($attendees as $attendee) {
            $_event_attendee = array();
            $_event_attendee['name'] = $attendee->name;
            $_event_attendee['email'] = strtolower($attendee->email);
            // role
            $_event_attendee['role'] = mel_mapping::m2_to_rc_attendee_role($attendee->role);
            // status
            $_event_attendee['status'] = mel_mapping::m2_to_rc_attendee_status($attendee->response);
            // is saved
            if (is_bool($attendee->is_saved) && in_array($_event_attendee['status'], ['ACCEPTED', 'DECLINED'])) {
              $_event_attendee['skip_notify'] = $attendee->is_saved;
            }
            else {
              $_event_attendee['skip_notify'] = false;
            }
            $_attendees[] = $_event_attendee;
          }
          $organizer = $event->organizer;
          if (isset($organizer)) {
            $_event_organizer = array();
            $_event_organizer['email'] = strtolower($organizer->email);
            $_event_organizer['name'] = $organizer->name;
            $_event_organizer['role'] = 'ORGANIZER';
            $_attendees[] = $_event_organizer;
          }
          $_event['attendees'] = $_attendees;
        }

        $attachments = ( array ) $this->list_attachments($event);
        if (count($attachments) > 0) {
          $_event['attachments'] = $attachments;
        }
        else {
          $_event['attachments'] = [];
        }
      }

      // Recurrence
      if (!$isexception) {
        $recurrence = $event->recurrence->rrule;
        // Problème de UNTIL avec les journées entières
        if (isset($recurrence['UNTIL']) && $recurrence['UNTIL'] instanceof \DateTime && $_event['allday']) {
          $recurrence['UNTIL']->setTime(23, 59);
        }
        if (is_array($recurrence) && count($recurrence) > 0) {
          // Récupération des exceptions dans la récurrence de l'évènement
          $_event['recurrence'] = $this->_read_event_exceptions($event, $recurrence);
        }
      }
    }
    // Pb de memoire
    // if (mel_logs::is(mel_logs::TRACE))
    //   mel_logs::get_instance()->log(mel_logs::TRACE, "[calendar] mel_driver::_read_postprocess() event : " . var_export($_event, true));
    return $_event;
  }

  /**
   * Génère les exceptions dans la récurrence l'évènement
   *
   * @param LibMelanie\Api\Defaut\Event $event
   * @param array $recurrence
   * @return array $recurrence
   */
  private function _read_event_exceptions($event, $recurrence) {
    // Ajoute les exceptions
    $_exceptions = $event->exceptions;
    $deleted_exceptions = array();
    $recurrence['EXCEPTIONS'] = array();
    // Parcourir les exceptions
    foreach ($_exceptions as $_exception) {
      if ($_exception->deleted) {
        $deleted_exceptions[] = rcube_utils::anytodatetime($_exception->recurrence_id);
      }
      else {
        // Génération de l'exception pour Roundcube
        // Ce tableau est ensuite dépilé pour être intégré a la liste des évènements
        $e = $this->_read_postprocess($_exception, null, true);
        $e['id'] = $_exception->uid . '@DATE-' . strtotime($_exception->recurrence_id);
        $e['recurrence_id'] = $_exception->uid;
        $e['recurrence'] = $recurrence;
        $e['_instance'] = $_exception->recurrence_id;
        $e['recurrence_date'] = rcube_utils::anytodatetime($e['_instance'], $e['start']->getTimezone());
        $e['isexception'] = 1;
        $deleted_exceptions[] = $e['recurrence_date'];
        $recurrence['EXCEPTIONS'][$e['id']] = $e;
      }
    }
    // Ajoute les dates deleted
    $recurrence[LibMelanie\Lib\ICS::EXDATE] = $deleted_exceptions;
    return $recurrence;
  }

  /**
   * Get a list of pending alarms to be displayed to the user
   *
   * @see calendar_driver::pending_alarms()
   */
  public function pending_alarms($time, $calendars = null) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::pending_alarms()");

    try {      
      // Récupération des evenements en cache
      $events = \mel::getCache('events_alarm');
      if (!isset($events)) {
        if (!isset($calendars)) {
          if (empty($this->calendars)) {
            $this->_read_calendars();
          }
          $calendars = $this->calendars;
        }
        $calendars_id = array();
        $alarm_calendars = $this->rc->config->get('alarm_calendars', array());
        foreach ($calendars as $calendar) {
          if (isset($alarm_calendars[$calendar->id])) {
            $calendars_id[] = $calendar->id;
          }
        }
        if (empty($calendars_id)) {
          $calendars_id = [$this->rc->user->get_username()];
        }        
        $_event = driver_mel::gi()->event([$this->user]);
        $_event->calendar = $calendars_id;
        $_event->alarm = 0;
        // Durée dans le passé maximum pour l'affichage des alarmes (5 jours)
        $time_min = $time - 60 * 60 * 24 * 5;
        // Durée dans le futur maximum, basé sur la configuration du refresh
        $time_max = $time;
        // Clause Where
        $filter = "#calendar# AND #alarm# AND ((#start# - interval '1 minute' * k1.event_alarm) > '" . date('Y-m-d H:i:s', $time_min) . "') AND ((#start# - interval '1 minute' * k1.event_alarm) < '" . date('Y-m-d H:i:s', $time_max) . "')";
        // Operateur
        $operators = array('alarm' => MappingMce::diff, 'calendar' => MappingMce::in);
        $fields = array('uid','title','calendar','start','end','location','alarm','owner');
        $_events = $_event->getList($fields, $filter, $operators);
        $events = [];
        foreach ($_events as $_event) {
          $_event->setCalendarMelanie($this->calendars[$_event->calendar]);

          if (isset($_event->start)) {
            $snoozetime = $_event->getAttribute(\LibMelanie\Lib\ICS::X_MOZ_SNOOZE_TIME);
            if (isset($snoozetime)) {
              $snoozetime = strtotime($snoozetime);
              if ($snoozetime > time()) {
                continue;
              }
            }
            $lastack = $_event->getAttribute(\LibMelanie\Lib\ICS::X_MOZ_LASTACK);
            if (isset($lastack)) {
              $lastack = strtotime($lastack);
              if ($lastack > (strtotime($_event->start) - ($_event->alarm * 60))) {
                continue;
              }
            }
          }
          $_e = $this->_read_postprocess($_event);
          
          // Ajoute les exceptions
          if (isset($_e['recurrence']) && isset($_e['recurrence']['EXCEPTIONS']) && count($_e['recurrence']['EXCEPTIONS']) > 0) {
            foreach ($_e['recurrence']['EXCEPTIONS'] as $_ex) {
              $snoozetime = $_ex['x_moz_snooze_time'];
              if (isset($snoozetime)) {
                $snoozetime = strtotime($snoozetime);
                if ($snoozetime > time()) {
                  continue;
                }
              }
              $lastack = $_ex['x_moz_lastack'];
              if (isset($lastack)) {
                $lastack = strtotime($lastack);
                if ($lastack > (strtotime($_event->start) - ($_event->alarm * 60))) {
                  continue;
                }
              }
              $events[] = $_ex;
            }
            unset($_e['recurrence']['EXCEPTIONS']);
          }
          if (isset($_e['title'])) {
            $events[] = $_e;
          }
        }
        \mel::setCache('events_alarm', $events);
      }
      return $events;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::pending_alarms() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Feedback after showing/sending an alarm notification
   *
   * @see calendar_driver::dismiss_alarm()
   */
  public function dismiss_alarm($event_id, $snooze = 0) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::dismiss_alarm($event_id)");
    try {
      if (!isset($calendars)) {
        if (empty($this->calendars)) {
          $this->_read_calendars();
        }
        $calendars = $this->calendars;
      }
      // Traitement de l'id pour les exceptions
      if (strpos($event_id, '@DATE-') !== false) {
        $id = explode('@DATE-', $event_id);
        $_recurrence_date = date('Ymd', $id[1]);
        $event_id = $id[0];
      }
      // Parcourir les agendas pour se limité à ceux qui affiche les alarmes
      $alarm_calendars = $this->rc->config->get('alarm_calendars', array());
      if (empty($alarm_calendars)) {
        $alarm_calendars[$this->rc->user->get_username()] = 1;
      }
      foreach ($calendars as $key => $calendar) {
        if (isset($alarm_calendars[$calendar->id])) {
          $event = driver_mel::gi()->event([$this->user, $calendar]);
          $event->uid = $event_id;
          if ($event->load()) {
            // Traiter le cas de l'exception
            if (isset($_recurrence_date)) {
              $exceptions = $event->exceptions;
              if (isset($exceptions[$_recurrence_date])) {
                $event = $exceptions[$_recurrence_date];
              }
            }
            if ($snooze != 0) {              
              $time = time() + $snooze * 60;
              $event->setAttribute(\LibMelanie\Lib\ICS::X_MOZ_SNOOZE_TIME, gmdate('Ymd', $time) . 'T' . gmdate('His', $time) . 'Z');
            }
            else {
              $time = time();
              $event->setAttribute(\LibMelanie\Lib\ICS::X_MOZ_LASTACK, gmdate('Ymd', $time) . 'T' . gmdate('His', $time) . 'Z');
            }
            $event->modified = time();
            $event->save();
          }
        }
      }
      // Remove cache
      \mel::unsetCache('events_alarm');
      return true;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::dismiss_alarm() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Save an attachment related to the given event
   *
   * @param array $attachment
   * @param LibMelanie\Api\Defaut\Event $event
   * @return boolean
   */
  private function add_attachment($attachment, $event) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::add_attachment()");
    try {
      $organizer = $event->organizer;
      // Ne pas ajouter de pièce jointe si on n'est pas organisateur (et que l'organisateur est au ministère
      if (isset($organizer) && !$organizer->extern && ! empty($organizer->email) && $organizer->uid != $this->calendars[$event->calendar]->owner) {
        return true;
      }
      // Création de la pièce jointe
      $_attachment = driver_mel::gi()->attachment();
      $_attachment->modified = time();
      $_attachment->name = $attachment['name'];
      $_attachment->path = $event->uid . '/' . $this->calendars[$event->calendar]->owner;
      $_attachment->owner = $this->user->uid;
      $_attachment->isfolder = false;
      $_attachment->data = $attachment['data'] ? $attachment['data'] : file_get_contents($attachment['path']);
      $ret = $_attachment->save();
      return !is_null($ret);
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::add_attachment() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Remove a specific attachment from the given event
   *
   * @param string $attachment_id
   * @return boolean
   */
  private function remove_attachment($attachment_id, $event_uid) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::remove_attachment($attachment_id)");
    try {
      $attachment = driver_mel::gi()->attachment();
      $attachment->isfolder = false;
      $attachment->id = $attachment_id;
      $attachment->path = $event_uid . '/%';
      $ret = true;
      foreach ($attachment->getList(null, null, ['path' => MappingMce::like]) as $att) {
        // Vérifie si d'autres pièces jointes sont présentes
        $other_attachment = driver_mel::gi()->attachment();
        $other_attachment->isfolder = false;
        $other_attachment->path = $att->path;
        $ret = $ret & $att->delete();
        $other_att = $other_attachment->getList();
        if (count($other_att) == 0) {
          // S'il n'y a pas d'autres pieces jointes on supprime le dossier
          $path = explode('/', $other_attachment->path);
          $folder = driver_mel::gi()->attachment();
          $folder->isfolder = true;
          $folder->name = $path[count($path) - 1];
          $folder->path = $path[count($path) - 2];
          $ret = $ret & $folder->delete();
        }
      }
      return $ret;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::remove_attachment() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }
  /**
   * Remove all attachments for a deleted event
   *
   * @param string $event_uid
   */
  private function remove_event_attachments($event_uid) {
    try {
      $_events = driver_mel::gi()->event();
      $_events->uid = $event_uid;
      $nb_events = $_events->getList('count');
      $count = $nb_events['']->events_count;
      unset($nb_events);
      // Si c'est le dernier evenement avec le même uid on supprime toutes les pièces jointes
      if ($count === 0) {
        $attachments_folders = driver_mel::gi()->attachment();
        $attachments_folders->isfolder = true;
        $attachments_folders->path = $event_uid;
        $folders_list = array();
        // Récupère les dossiers lié à l'évènement
        $folders = $attachments_folders->getList();
        if (count($folders) > 0) {
          foreach ($folders as $folder) {
            $folders_list[] = $folder->path . '/' . $folder->name;
          }
          $attachments = driver_mel::gi()->attachment();
          $attachments->isfolder = false;
          $attachments->path = $folders_list;
          // Lecture des pièces jointes pour chaque dossier de l'évènement
          $attachments = $attachments->getList(array('id','name','path'));
          if (count($attachments) > 0) {
            foreach ($attachments as $attachment) {
              // Supprime la pièce jointe
              $attachment->delete();
            }
          }
          foreach ($folders as $folder) {
            // Supprime le dossier
            $folder->delete();
          }
        }
        $folder = driver_mel::gi()->attachment();
        $folder->isfolder = true;
        $folder->path = '';
        $folder->name = $event_uid;
        if ($folder->load()) {
          $folder->delete();
        }
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::remove_event_attachments() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * List attachments of specified event
   */
  public function list_attachments($event) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::list_attachments()");
    try {
      $_attachments = array();
      // Récupération des pièces jointes
      $attachments_folders = driver_mel::gi()->attachment();
      $attachments_folders->isfolder = true;
      $attachments_folders->path = $event->uid;
      $folders_list = array();
      // Récupère les dossiers lié à l'évènement
      $folders = $attachments_folders->getList();
      if (count($folders) > 0) {
        foreach ($folders as $folder) {
          $folders_list[] = $folder->path . '/' . $folder->name;
        }
        $attachments = driver_mel::gi()->attachment();
        $attachments->isfolder = false;
        $attachments->path = $folders_list;
        // Lecture des pièces jointes pour chaque dossier de l'évènement
        $attachments = $attachments->getList(array('id','name'));
        if (count($attachments) > 0) {
          foreach ($attachments as $attachment) {
            $_attachment = array('id' => $attachment->id,'name' => $attachment->name);
            $_attachments[] = $_attachment;
          }
        }
      }
      return $_attachments;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::list_attachments() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Get attachment properties
   */
  public function get_attachment($id, $event) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::get_attachment($id)");
    try {
      $attachment = driver_mel::gi()->attachment();
      $attachment->isfolder = false;
      $attachment->id = $id;
      $attachment->path = $event['id'] . '/%';
      foreach ($attachment->getList(null, null, ['path' => MappingMce::like]) as $att) {
        $ret = array('id' => $att->id,'name' => $att->name,'mimetype' => $att->contenttype,'size' => $att->size);
        $this->attachment = $att;
        return $ret;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::get_attachment() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Get attachment body
   */
  public function get_attachment_body($id, $event) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::get_attachment_body($id)");
    if (isset($this->attachment)) {
      return $this->attachment->data;
    }
    return false;
  }

  /**
   * Fetch free/busy information from a person within the given range
   */
  public function get_freebusy_list($email, $start, $end) {
    try {
      // Récupération de l'utilisateur depuis l'annuaire
      $user = driver_mel::gi()->user();
      $user->email = $email;
      if ($user->load(['uid'])) {
        // map vcalendar fbtypes to internal values
        $fbtypemap = array('free' => calendar::FREEBUSY_FREE,'tentative' => calendar::FREEBUSY_TENTATIVE,'outofoffice' => calendar::FREEBUSY_OOF,'busy' => calendar::FREEBUSY_BUSY);
        // Utilisation du load_events pour charger les évènements déjà formattés (récurrences)
        $events = $this->load_events($start, $end, null, $user->uid, 1, null, true);
        $result = array();
        foreach ($events as $event) {
          if ($event['allday']) {
            $from = strtotime($event['start']->format(self::SHORT_DB_DATE_FORMAT));
            $event['end']->add(new DateInterval("P1D"));
            $to = strtotime($event['end']->format(self::SHORT_DB_DATE_FORMAT));
          }
          else {
            $from = strtotime($event['start']->format(self::DB_DATE_FORMAT));
            $to = strtotime($event['end']->format(self::DB_DATE_FORMAT));
          }
          $result[] = array($from,$to,isset($fbtypemap[$event['free_busy']]) ? $fbtypemap[$event['free_busy']] : calendar::FREEBUSY_BUSY);
        }
        return $result;
      }
      else {
        // map vcalendar fbtypes to internal values
        $fbtypemap = array('FREE' => calendar::FREEBUSY_FREE,'BUSY-TENTATIVE' => calendar::FREEBUSY_TENTATIVE,'X-OUT-OF-OFFICE' => calendar::FREEBUSY_OOF,'OOF' => calendar::FREEBUSY_OOF);

        // Si l'utilisateur n'appartient pas au minitère, on récupère éventuellement les freebusy depuis les contacts
        $fburl = null;
        foreach (( array ) $this->rc->config->get('autocomplete_addressbooks', 'sql') as $book) {
          $abook = $this->rc->get_address_book($book);

          if ($result = $abook->search(array('email'), $email, true, true, true/*, 'freebusyurl'*/)) {
            while ($contact = $result->iterate()) {
              if ($fburl = $contact['freebusyurl']) {
                $fbdata = @file_get_contents($fburl);
                break;
              }
            }
          }

          if ($fbdata)
            break;
        }

        // parse free-busy information using Horde classes
        if ($fbdata) {
          $fbcal = $this->cal->get_ical()->get_parser();
          $fbcal->parsevCalendar($fbdata);
          if ($fb = $fbcal->findComponent('vfreebusy')) {
            $result = array();
            $params = $fb->getExtraParams();
            foreach ($fb->getBusyPeriods() as $from => $to) {
              if ($to == null) // no information, assume free
                break;
              $type = $params[$from]['FBTYPE'];
              $result[] = array($from,$to,isset($fbtypemap[$type]) ? $fbtypemap[$type] : calendar::FREEBUSY_BUSY);
            }

            // we take 'dummy' free-busy lists as "unknown"
            if (empty($result) && ($comment = $fb->getAttribute('COMMENT')) && stripos($comment, 'dummy'))
              return false;

              // set period from $start till the begin of the free-busy information as 'unknown'
            if (($fbstart = $fb->getStart()) && $start < $fbstart) {
              array_unshift($result, array($start,$fbstart,calendar::FREEBUSY_UNKNOWN));
            }
            // pad period till $end with status 'unknown'
            if (($fbend = $fb->getEnd()) && $fbend < $end) {
              $result[] = array($fbend,$end,calendar::FREEBUSY_UNKNOWN);
            }

            return $result;
          }
        }

      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::get_freebusy_list() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Récupération de la clé de partage pour le calendrier
   * @param string $calendar
   * @return string|NULL
   */
  public function get_calendar_public_key($calendar) {
    $result = null;
    $calendar = driver_mel::gi()->rcToMceId($calendar);
    // On récupère la clé avec la valeur des paramètres utilisateurs
    $value = driver_mel::gi()->getUser()->getCalendarPreference("calendarskeyhash");

    if (isset($value)) {
      $value = unserialize($value);
      if (isset($value[$calendar])) {
        $result = $value[$calendar];
      }
    }
    return $result;
  }

  /**
   * Création de la clé pour le calendrier pour le partage public
   * @param string $calendar
   * @param string $key
   */
  public function add_calendar_public_key($calendar, $key) {
    $calendar = driver_mel::gi()->rcToMceId($calendar);
    // On récupère la clé avec la valeur des paramètres utilisateurs
    $value = driver_mel::gi()->getUser()->getCalendarPreference("calendarskeyhash");

    if (isset($value)) {
      $value = unserialize($value);
      $value[$calendar] = $key;
    }
    else {
      $value = array($calendar => $key);
    }
    // Enregistrement de la valeur de pref
    return driver_mel::gi()->getUser()->saveCalendarPreference("calendarskeyhash", serialize($value));
  }

  /**
   * Suppression de la clé pour le calendrier pour le partage public
   * @param string $calendar
   */
  public function delete_calendar_public_key($calendar) {
    $calendar = driver_mel::gi()->rcToMceId($calendar);
    // On récupère la clé avec la valeur des paramètres utilisateurs
    $value = driver_mel::gi()->getUser()->getCalendarPreference("calendarskeyhash");

    if (isset($value)) {
      $value = unserialize($value);
      if (isset($value[$calendar])) {
        unset($value[$calendar]);
        // Enregistrement de la valeur de pref
        return driver_mel::gi()->getUser()->saveCalendarPreference("calendarskeyhash", serialize($value));
      }
    }
    return true;
  }

  /**
   * List availabale categories
   * The default implementation reads them from config/user prefs
   */
  public function list_categories() {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::list_categories()");
    try {
      // Récupère la liste des couleurs des catégories (sic)
      $value = driver_mel::gi()->getUser()->getDefaultPreference("category_colors");
      $_categories_color = isset($value) ? explode('|', $value) : [];

      // Géneration du tableau contenant les couleurs des categories
      $categories_colors = [];
      foreach ($_categories_color as $_category_color) {
        // Sépare les couleurs dans les paramètres de horde
        $c = explode(':', $_category_color);
        if (isset($c[0]) && isset($c[1])) {
          $categories_colors[$c[0]] = $c[1];
        }
      }

      // Récupère la liste des catégories
      $value = driver_mel::gi()->getUser()->getDefaultPreference("categories");
      $_categories = isset($value) ? explode('|', $value) : [];

      // Génération du tableau contenant les catégories et leur couleurs
      $categories = [];
      foreach ($_categories as $_category) {
        if (isset($categories_colors[$_category])) {
          $categories[$_category] = str_replace('#', '', $categories_colors[$_category]);
        }
        else {
          // La catégory n'a pas de couleur, on en choisi une par défaut
          $categories[$_category] = 'c0c0c0';
        }
      }
      ksort($categories);
      return $categories;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::list_categories() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Create a new category
   */
  public function add_category($name, $color) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::add_category($name, $color)");
    try {
      // Récupère la liste des catégories
      $value = driver_mel::gi()->getUser()->getDefaultPreference("categories");
      $value = (isset($value) ? $value."|" : "") . "$name";
      driver_mel::gi()->getUser()->saveDefaultPreference("categories", $value);

      // Récupère la liste des couleurs des catégories (sic)
      $value = driver_mel::gi()->getUser()->getDefaultPreference("category_colors");
      $value = (isset($value) ? $value."|" : "") . "$name:#$color";
      driver_mel::gi()->getUser()->saveDefaultPreference("category_colors", $value);
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::add_category() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Remove the given category
   */
  public function remove_category($name) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::remove_category($name)");
    try {
      // Récupère la liste des catégories
      $value = driver_mel::gi()->getUser()->getDefaultPreference("categories");
      $_categories = isset($value) ? explode('|', $value) : [];

      // Supprime la valeur dans la liste
      $change = false;
      foreach ($_categories as $key => $_category) {
        if ($_category == $name) {
          unset($_categories[$key]);
          $change = true;
        }
      }
      // Enregistre la nouvelle liste si elle a changé
      if ($change) {
        $value = implode('|', $_categories);
        driver_mel::gi()->getUser()->saveDefaultPreference("categories", $value);
      }

      // Récupère la liste des couleurs des catégories (sic)
      $value = driver_mel::gi()->getUser()->getDefaultPreference("category_colors");
      $_categories_color = isset($value) ? explode('|', $value) : [];

      // Supprime la valeur dans la liste
      $change = false;
      foreach ($_categories_color as $key => $_category_color) {
        // Sépare les couleurs dans les paramètres de horde
        $c = explode(':', $_category_color);
        if (isset($c[0]) && $c[0] == $name) {
          unset($_categories_color[$key]);
          $change = true;
        }
      }
      // Enregistre la nouvelle liste si elle a changé
      if ($change) {
        $value = implode('|', $_categories_color);
        driver_mel::gi()->getUser()->saveDefaultPreference("category_colors", $value);
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::remove_category() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Update/replace a category
   */
  public function replace_category($oldname, $name, $color) {
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::replace_category($oldname, $name, $color)");
    try {
      // Récupère la liste des catégories
      $value = driver_mel::gi()->getUser()->getDefaultPreference("categories");
      $_categories = isset($value) ? explode('|', $value) : [];

      // Supprime la valeur dans la liste
      $change = false;
      foreach ($_categories as $key => $_category) {
        if ($_category == $oldname) {
          $_categories[$key] = $name;
          $change = true;
        }
      }
      // Enregistre la nouvelle liste si elle a changé
      if ($change) {
        $value = implode('|', $_categories);
        driver_mel::gi()->getUser()->saveDefaultPreference("categories", $value);
      }

      // Récupère la liste des couleurs des catégories (sic)
      $value = driver_mel::gi()->getUser()->getDefaultPreference("category_colors");
      $_categories_color = isset($value) ? explode('|', $value) : [];

      // Supprime la valeur dans la liste
      $change = false;
      foreach ($_categories_color as $key => $_category_color) {
        // Sépare les couleurs dans les paramètres de horde
        $c = explode(':', $_category_color);
        if (isset($c[0]) && $c[0] == $oldname && $_category_color != "$name:#$color") {
          $_categories_color[$key] = "$name:#$color";
          $change = true;
        }
      }
      // Enregistre la nouvelle liste si elle a changé
      if ($change) {
        $value = implode('|', $_categories_color);
        driver_mel::gi()->getUser()->saveDefaultPreference("category_colors", $value);
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::replace_category() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Callback function to produce driver-specific calendar create/edit form
   *
   * @param string Request action 'form-edit|form-new'
   * @param array Calendar properties (e.g. id, color)
   * @param array Edit form fields
   * @return string HTML content of the form
   */
  public function calendar_form($action, $calendar, $formfields) {
    // Charge les données seulement si on est dans la tâche calendrier
    if ($this->rc->task != 'calendar') {
      return false;
    }
    if (mel_logs::is(mel_logs::DEBUG))
      mel_logs::get_instance()->log(mel_logs::DEBUG, "[calendar] mel_driver::calendar_form($calendar)");

    try {
      // Chargement des calendriers si besoin
      if (! isset($this->calendars)) {
        $this->_read_calendars();
      }
      $calendar['id'] = driver_mel::gi()->rcToMceId($calendar['id']);

      if ($calendar['id'] && ($cal = $this->calendars[$calendar['id']])) {
        $folder = $cal->name; // UTF7
        $color_calendars = $this->rc->config->get('color_calendars', array());
        if (isset($color_calendars[$cal->id]))
          $color = $color_calendars[$cal->id];
        else
          $color = '';
      }
      else {
        $folder = '';
        $color = '';
      }

      $hidden_fields[] = array('name' => 'oldname','value' => $folder);

      $storage = $this->rc->get_storage();
      $delim = $storage->get_hierarchy_delimiter();
      $form = array();

      if (strlen($folder)) {
        $path_imap = explode($delim, $folder);
        array_pop($path_imap); // pop off name part
        $path_imap = implode($path_imap, $delim);

        $options = $storage->folder_info($folder);
      }
      else {
        $path_imap = '';
      }

      // General tab
      $form['props'] = array('name' => $this->rc->gettext('properties'));

      // Disable folder name input
      if ($action != 'form-new' && $cal->owner != $this->user->uid) {
        $input_name = new html_hiddenfield(array('name' => 'name','id' => 'calendar-name'));
        $formfields['name']['value'] = $folder . $input_name->show($folder);
      }

      // calendar name (default field)
      $form['props']['fieldsets']['location'] = array('name' => $this->rc->gettext('location'),'content' => array('name' => $formfields['name']));

      // calendar color (default field)
      $form['props']['fieldsets']['settings'] = array('name' => $this->rc->gettext('settings'),'content' => array('color' => $formfields['color'],'showalarms' => $formfields['showalarms']));

      if ($action != 'form-new' && $cal->owner == $this->user->uid) {
        $form['sharing'] = array('name' => $this->Q($this->cal->gettext('tabsharing')),'content' => html::tag('iframe', array('src' => $this->cal->rc->url(array('_action' => 'calendar-acl','id' => $calendar['id'],'framed' => 1)),'width' => '100%','height' => 275,'border' => 0,'style' => 'border:0'), ''));
        $form['groupsharing'] = array('name' => $this->Q($this->cal->gettext('tabsharinggroup')),'content' => html::tag('iframe', array('src' => $this->cal->rc->url(array('_action' => 'calendar-acl-group','id' => $calendar['id'],'framed' => 1)),'width' => '100%','height' => 275,'border' => 0,'style' => 'border:0'), ''));
      }

      $this->form_html = '';
      if (is_array($hidden_fields)) {
        foreach ($hidden_fields as $field) {
          $hiddenfield = new html_hiddenfield($field);
          $this->form_html .= $hiddenfield->show() . "\n";
        }
      }

      // Create form output
      foreach ($form as $tab) {
        if (! empty($tab['fieldsets']) && is_array($tab['fieldsets'])) {
          $content = '';
          foreach ($tab['fieldsets'] as $fieldset) {
            $subcontent = $this->get_form_part($fieldset);
            if ($subcontent) {
              $content .= html::tag('fieldset', null, html::tag('legend', null, $this->Q($fieldset['name'])) . $subcontent) . "\n";
            }
          }
        }
        else {
          $content = $this->get_form_part($tab);
        }

        if ($content) {
          $this->form_html .= html::tag('fieldset', null, html::tag('legend', null, $this->Q($tab['name'])) . $content) . "\n";
        }
      }

      // Parse form template for skin-dependent stuff
      $this->rc->output->add_handler('calendarform', array($this,'calendar_form_html'));
      return $this->rc->output->parse('calendar.kolabform', false, false);
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[calendar] mel_driver::calendar_form() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Handler for template object
   */
  public function calendar_form_html() {
    return $this->form_html;
  }

  /**
   * Helper function used in calendar_form_content().
   * Creates a part of the form.
   */
  private function get_form_part($form) {
    $content = '';

    if (is_array($form['content']) && ! empty($form['content'])) {
      $table = new html_table(array('cols' => 2));
      foreach ($form['content'] as $col => $colprop) {
        $colprop['id'] = '_' . $col;
        $label = ! empty($colprop['label']) ? $colprop['label'] : $this->rc->gettext($col);

        $table->add('title', sprintf('<label for="%s">%s</label>', $colprop['id'], $this->Q($label)));
        $table->add(null, $colprop['value']);
      }
      $content = $table->show();
    }
    else {
      $content = $form['content'];
    }

    return $content;
  }

  /**
   * Handler to render ACL form for a calendar folder
   */
  public function calendar_acl() {
    $this->rc->output->add_handler('folderacl', array(new M2calendar($this->rc->user->get_username()),'acl_form'));
    $this->rc->output->send('calendar.kolabacl');
  }
  /**
   * Handler to render ACL groups form for a calendar folder
   */
  public function calendar_acl_group() {
    $this->rc->output->add_handler('folderacl', array(new M2calendargroup($this->rc->user->get_username()),'acl_form'));
    $this->rc->output->send('calendar.kolabacl');
  }

  /**
   * Compose an URL for CalDAV access to this calendar (if configured)
   *
   * @param \LibMelanie\Api\Defaut\Calendar $calendar
   */
  private function get_caldav_url($calendar)
  {
  	if ($template = $this->rc->config->get('calendar_caldav_url', null)) {
  		return strtr($template, array(
  				'%h' => $_SERVER['HTTP_HOST'],
  				'%u' => urlencode($this->rc->get_user_name()),
  				'%i' => urlencode($calendar->id),
  				'%n' => urlencode($calendar->owner),
  		));
  	}

  	return false;
  }

  /**
   * Replacing specials characters to a specific encoding type
   *
   * @param string  Input string
   * @param string  Replace mode for tags: show|remove|strict
   * @param boolean Convert newlines
   *
   * @return string The quoted string
   */
  private function Q($str, $mode='strict', $newlines=true) {
    return rcube_utils::rep_specialchars_output($str, 'html', $mode, $newlines);
  }
}
