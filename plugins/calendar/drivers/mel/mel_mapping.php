<?php
/**
 * Mél driver for the Calendar plugin
 *
 * Mapping file for Mél backend
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
@include_once 'includes/libm2.php';

use LibMelanie\Api\Defaut\Event;
use LibMelanie\Api\Defaut\Attendee;
use LibMelanie\Api\Defaut\Recurrence;
use LibMelanie\Lib\ICS;

/**
 * Classe de mapping vers Mél (vers la librairie ORM M2)
 * Permet le mapping des données calendar de roundcube vers l'ORM Mél
 * Les méthodes sont statiques et publiques
 * Format de nom de méthode <rc ou m2>_to_<m2 ou rc>_<champ a mapper>
 * Format de nom de paramètre $<champ a mapper>_<m2 ou rc>
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> PNE Annuaire et Messagerie/MEDDE
 */
class mel_mapping {
  /**
   * Constante pour définir une valeur par défaut dans le tableau de mapping
   *
   * @var string
   */
  const DEFAULT_VALUE = '_default';

  /**
   * Mapping du status RoundCube vers Mél
   *
   * @param string $status_rc
   * @return string
   */
  public static function rc_to_m2_status($status_rc) {
    $mapping = array(
            self::DEFAULT_VALUE => Event::STATUS_CONFIRMED,
            'CONFIRMED'         => Event::STATUS_CONFIRMED,
            'CANCELLED'         => Event::STATUS_CANCELLED,
            'TENTATIVE'         => Event::STATUS_TENTATIVE, 
            'FREE'              => Event::STATUS_NONE,
            'TELEWORK'          => Event::STATUS_TELEWORK,
            'VACATION'          => Event::STATUS_VACATION,
    );
    if (isset($mapping[$status_rc])) {
      $status_m2 = $mapping[$status_rc];
    }
    else {
      $status_m2 = $mapping[self::DEFAULT_VALUE];
    }
    return $status_m2;
  }

  /**
   * Mapping du status Mél vers RoundCube
   *
   * @param string $status_m2
   * @return string
   */
  public static function m2_to_rc_status($status_m2) {
    $mapping = array(
            self::DEFAULT_VALUE     => 'CONFIRMED',
            Event::STATUS_NONE      => 'FREE',
            Event::STATUS_CONFIRMED => 'CONFIRMED',
            Event::STATUS_CANCELLED => 'CANCELLED',
            Event::STATUS_TENTATIVE => 'TENTATIVE',
            Event::STATUS_TELEWORK  => 'TELEWORK',
            Event::STATUS_VACATION  => 'VACATION',
    );
    if (isset($mapping[$status_m2])) {
      $status_rc = $mapping[$status_m2];
    }
    else {
      $status_rc = $mapping[self::DEFAULT_VALUE];
    }
    return $status_rc;
  }

  /**
   * Mapping du free_busy RoundCube vers Mél
   *
   * @param string $free_busy_rc
   * @return string
   */
  public static function rc_to_m2_free_busy($free_busy_rc) {
    $free_busy_rc = strtolower($free_busy_rc);
    $mapping = array(
            'free'        => Event::STATUS_NONE,
            'busy'        => Event::STATUS_CONFIRMED,
            'outofoffice' => Event::STATUS_CONFIRMED,
            'tentative'   => Event::STATUS_TENTATIVE,
            'telework'    => Event::STATUS_TELEWORK,
            'vacation'    => Event::STATUS_VACATION,
            self::DEFAULT_VALUE => Event::STATUS_CONFIRMED
    );
    if (isset($mapping[$free_busy_rc])) {
      $free_busy_m2 = $mapping[$free_busy_rc];
    }
    else {
      $free_busy_m2 = $mapping[self::DEFAULT_VALUE];
    }
    return $free_busy_m2;
  }

  /**
   * Mapping du free busy Mél vers RoundCube
   *
   * @param string $free_busy_m2
   * @return string
   */
  public static function m2_to_rc_free_busy($free_busy_m2) {
    $mapping = array(
            Event::STATUS_NONE      => 'free',
            Event::STATUS_CANCELLED => 'free',
            Event::STATUS_CONFIRMED => 'busy',
            'outofoffice'           => 'outofoffice',
            Event::STATUS_TENTATIVE => 'tentative',
            Event::STATUS_TELEWORK  => 'telework',
            Event::STATUS_VACATION  => 'vacation',
            self::DEFAULT_VALUE     => 'busy'
    );
    if (isset($mapping[$free_busy_m2])) {
      $free_busy_rc = $mapping[$free_busy_m2];
    }
    else {
      $free_busy_rc = $mapping[self::DEFAULT_VALUE];
    }
    return $free_busy_rc;
  }

  /**
   * Mapping de la classe (public, private, .
   * ..) RoundCube vers Mél
   *
   * @param string $class_rc
   * @return string
   */
  public static function rc_to_m2_class($class_rc) {
    $mapping = array(
            self::DEFAULT_VALUE => Event::CLASS_PUBLIC,
            'public'            => Event::CLASS_PUBLIC,
            'private'           => Event::CLASS_PRIVATE,
            'confidential'      => Event::CLASS_CONFIDENTIAL
    );
    if (isset($mapping[$class_rc])) {
      $class_m2 = $mapping[$class_rc];
    }
    else {
      $class_m2 = $mapping[self::DEFAULT_VALUE];
    }
    return $class_m2;
  }

  /**
   * Mapping de la classe (public, private, .
   * ..) Mél vers RoundCube
   *
   * @param string $class_m2
   * @return string
   */
  public static function m2_to_rc_class($class_m2) {
    $mapping = array(
            self::DEFAULT_VALUE       => 0,
            Event::CLASS_PUBLIC       => 'public',
            Event::CLASS_PRIVATE      => 'private',
            Event::CLASS_CONFIDENTIAL => 'confidential'
    );
    if (isset($mapping[$class_m2])) {
      $class_rc = $mapping[$class_m2];
    }
    else {
      $class_rc = $mapping[self::DEFAULT_VALUE];
    }
    return $class_rc;
  }

  /**
   * Mapping du type d'un participant RoundCube vers Mél
   *
   * @param array $rc_attendee RoundCube Attendee
   * 
   * @return string
   */
  public static function rc_to_m2_attendee_cutype($rc_attendee) {
    $mappingCuType = [
        self::DEFAULT_VALUE    => Attendee::TYPE_INDIVIDUAL,
        ICS::CUTYPE_INDIVIDUAL => Attendee::TYPE_INDIVIDUAL,
        ICS::CUTYPE_GROUP      => Attendee::TYPE_GROUP,
        ICS::CUTYPE_RESOURCE   => Attendee::TYPE_RESOURCE,
        ICS::CUTYPE_ROOM       => Attendee::TYPE_ROOM,
        ICS::CUTYPE_UNKNOWN    => Attendee::TYPE_UNKNOWN,
    ];

    $mappingRessourceType = [
        ICS::CUTYPE_RESOURCE    => Attendee::TYPE_RESOURCE,
        ICS::CUTYPE_ROOM        => Attendee::TYPE_ROOM,
        ICS::CUTYPE_UNKNOWN     => Attendee::TYPE_UNKNOWN,
        ICS::CUTYPE_FLEX_OFFICE => Attendee::TYPE_FLEX_OFFICE,
        ICS::CUTYPE_HARDWARE    => Attendee::TYPE_HARDWARE,
    ];

    if (isset($rc_attendee['resource_type']) && isset($mappingRessourceType[$rc_attendee['resource_type']])) {
      $type = $mappingRessourceType[$rc_attendee['resource_type']];
    }
    else if (isset($rc_attendee['cutype']) && isset($mappingCuType[$rc_attendee['cutype']])) {
      $type = $mappingCuType[$rc_attendee['cutype']];
    }
    else {
      $type = $mappingCuType[self::DEFAULT_VALUE];
    }

    return $type;
  }

  /**
   * Mapping du type d'un participant Mél vers RoundCube
   *
   * @param array $_event_attendee
   * @param string $attendee_type_m2
   * @return string
   */
  public static function m2_to_rc_attendee_cutype($_event_attendee, $attendee_type_m2) {
    $mappingCuType = [
        self::DEFAULT_VALUE         => ICS::CUTYPE_INDIVIDUAL,
        Attendee::TYPE_INDIVIDUAL   => ICS::CUTYPE_INDIVIDUAL,
        Attendee::TYPE_GROUP        => ICS::CUTYPE_GROUP,
        Attendee::TYPE_RESOURCE     => ICS::CUTYPE_RESOURCE,
        Attendee::TYPE_ROOM         => ICS::CUTYPE_RESOURCE,
        Attendee::TYPE_UNKNOWN      => ICS::CUTYPE_RESOURCE,
        Attendee::TYPE_FLEX_OFFICE  => ICS::CUTYPE_RESOURCE,
        Attendee::TYPE_HARDWARE     => ICS::CUTYPE_RESOURCE,
    ];

    $mappingRessourceType = [
        Attendee::TYPE_RESOURCE     => ICS::CUTYPE_RESOURCE,
        Attendee::TYPE_ROOM         => ICS::CUTYPE_ROOM,
        Attendee::TYPE_UNKNOWN      => ICS::CUTYPE_UNKNOWN,
        Attendee::TYPE_FLEX_OFFICE  => ICS::CUTYPE_FLEX_OFFICE,
        Attendee::TYPE_HARDWARE     => ICS::CUTYPE_HARDWARE,
    ];

    if (isset($mappingCuType[$attendee_type_m2])) {
      $attendee_cutype_rc = $mappingCuType[$attendee_type_m2];

      if ($attendee_cutype_rc == ICS::CUTYPE_RESOURCE) {
        $_event_attendee['resource_type'] = $mappingRessourceType[$attendee_type_m2];
      }
    }
    else {
      $attendee_cutype_rc = $mappingCuType[self::DEFAULT_VALUE];
    }

    $_event_attendee['cutype'] = $attendee_cutype_rc;

    return $_event_attendee;
  }

  /**
   * Mapping du role d'un participant RoundCube vers Mél
   *
   * @param string $attendee_role_rc
   * @return string
   */
  public static function rc_to_m2_attendee_role($attendee_role_rc) {
    $mapping = array(
            self::DEFAULT_VALUE => Attendee::ROLE_REQ_PARTICIPANT,
            'REQ-PARTICIPANT'   => Attendee::ROLE_REQ_PARTICIPANT,
            'OPT-PARTICIPANT'   => Attendee::ROLE_OPT_PARTICIPANT,
            'NON-PARTICIPANT'   => Attendee::ROLE_NON_PARTICIPANT,
            'CHAIR'             => Attendee::ROLE_CHAIR
    );
    if (isset($mapping[$attendee_role_rc])) {
      $attendee_role_m2 = $mapping[$attendee_role_rc];
    }
    else {
      $attendee_role_m2 = $mapping[self::DEFAULT_VALUE];
    }
    return $attendee_role_m2;
  }

  /**
   * Mapping du role d'un participant Mél vers RoundCube
   *
   * @param string $attendee_role_m2
   * @return string
   */
  public static function m2_to_rc_attendee_role($attendee_role_m2) {
    $mapping = array(
            self::DEFAULT_VALUE             => 'REQ-PARTICIPANT',
            Attendee::ROLE_REQ_PARTICIPANT  => 'REQ-PARTICIPANT',
            Attendee::ROLE_OPT_PARTICIPANT  => 'OPT-PARTICIPANT',
            Attendee::ROLE_NON_PARTICIPANT  => 'NON-PARTICIPANT',
            Attendee::ROLE_CHAIR            => 'CHAIR'
    );
    if (isset($mapping[$attendee_role_m2])) {
      $attendee_role_rc = $mapping[$attendee_role_m2];
    }
    else {
      $attendee_role_rc = $mapping[self::DEFAULT_VALUE];
    }
    return $attendee_role_rc;
  }

  /**
   * Mapping du status d'un participant RoundCube vers Mél
   *
   * @param string $attendee_status_rc
   * @return string
   */
  public static function rc_to_m2_attendee_status($attendee_status_rc) {
    $mapping = array(
            self::DEFAULT_VALUE => Attendee::RESPONSE_NEED_ACTION,
            'NEEDS-ACTION'      => Attendee::RESPONSE_NEED_ACTION,
            'ACCEPTED'          => Attendee::RESPONSE_ACCEPTED,
            'DECLINED'          => Attendee::RESPONSE_DECLINED,
            'TENTATIVE'         => Attendee::RESPONSE_TENTATIVE,
            'UNKNOWN'           => Attendee::RESPONSE_IN_PROCESS,
            'DELEGATED'         => Attendee::RESPONSE_DELEGATED,
    );
    if (isset($mapping[$attendee_status_rc])) {
      $attendee_status_m2 = $mapping[$attendee_status_rc];
    }
    else {
      $attendee_status_m2 = $mapping[self::DEFAULT_VALUE];
    }
    return $attendee_status_m2;
  }

  /**
   * Mapping du status d'un participant Mél vers RoundCube
   *
   * @param string $attendee_status_m2
   * @return string
   */
  public static function m2_to_rc_attendee_status($attendee_status_m2) {
    $mapping = array(
            self::DEFAULT_VALUE             => 'NEEDS-ACTION',
            Attendee::RESPONSE_NEED_ACTION  => 'NEEDS-ACTION',
            Attendee::RESPONSE_ACCEPTED     => 'ACCEPTED',
            Attendee::RESPONSE_DECLINED     => 'DECLINED',
            Attendee::RESPONSE_TENTATIVE    => 'TENTATIVE',
            Attendee::RESPONSE_IN_PROCESS   => 'UNKNOWN',
            Attendee::RESPONSE_DELEGATED    => 'DELEGATED',
    );
    if (isset($mapping[$attendee_status_m2])) {
      $attendee_status_rc = $mapping[$attendee_status_m2];
    }
    else {
      $attendee_status_rc = $mapping[self::DEFAULT_VALUE];
    }
    return $attendee_status_rc;
  }

  /**
   * Calcul le trigger VALARM ICS et le converti en minutes
   *
   * @param string $trigger
   * @return number
   */
  public static function valarm_ics_to_minutes_trigger($trigger) {
    // TRIGGER au format -PT#W#D#H#M
    // Recherche les positions des caracteres
    $posT = strpos($trigger, 'T');
    $posW = strpos($trigger, 'W');
    $posD = strpos($trigger, 'D');
    $posH = strpos($trigger, 'H');
    $posM = strpos($trigger, 'M');

    // Si on trouve la position on recupere la valeur et on decale la position de reference
    if ($posT === false) {
      $posT = strpos($trigger, 'P');
    }

    $nbDay = 0;
    $nbHour = 0;
    $nbMin = 0;
    $nbWeeks = 0;
    if ($posW !== false) {
      $nbWeeks = intval(substr($trigger, $posT + 1, $posW - $posT + 1));
      $posT = $posW;
    }
    if ($posD !== false) {
      $nbDay = intval(substr($trigger, $posT + 1, $posD - $posT + 1));
      $posT = $posD;
    }
    if ($posH !== false) {
      $nbHour = intval(substr($trigger, $posT + 1, $posH - $posT + 1));
      $posT = $posH;
    }
    if ($posM !== false) {
      $nbMin = intval(substr($trigger, $posT + 1, $posM - $posT + 1));
    }

    // Calcul de l'alarme
    $minutes = $nbMin + $nbHour * 60 + $nbDay * 24 * 60 + $nbWeeks * 24 * 60 * 7;
    if (strpos($trigger, '-') === false)
      $minutes = - $minutes;
    if ($minutes === 0) {
      $minutes = 1;
    }
    return $minutes;
  }

  /**
   * Creates an iCalendar 2.0 recurrence rule.
   * based on Horde_Date_Recurrence class
   *
   * @link http://rfc.net/rfc2445.html#s4.3.10
   * @link http://rfc.net/rfc2445.html#s4.8.5
   * @link http://www.shuchow.com/vCalAddendum.html
   * @param Event $event Melanie 2 Event
   * @return array An iCalendar 2.0 conform RRULE value for roundcube.
   */
  public static function m2_to_RRule20($event) {
    // Tableau permettant de recuperer toutes les valeurs de la recurrence
    $recurrence = array();
    // Récupération des informations de récurrence de l'évènement
    $_recurrence = $event->recurrence->rrule;

    // Si une recurrence est bien definie dans l'evenement
    if ($_recurrence->type !== Recurrence::RECURTYPE_NORECUR) {
      if (isset($_recurrence->count) && intval($_recurrence->count) > 0) {
        // Gestion du nombre d'occurences
        $recurrence['COUNT'] = intval($_recurrence->count);
      }
      elseif (isset($_recurrence->enddate)) {
        // Gestion d'une date de fin
        $recurrence['UNTIL'] = new DateTime($_recurrence->enddate);
        if ($recurrence['UNTIL']->format('Y') == '9999') {
          // Si l'année est en 9999 on considère qu'il n'y a de date de fin
          unset($recurrence['UNTIL']);
        }
      }
      switch ($_recurrence->type) {
        case Recurrence::RECURTYPE_DAILY :
          $recurrence[ICS::FREQ] = ICS::FREQ_DAILY;
          if (isset($_recurrence->interval)) {
            // Recupere l'interval de recurrence
            $recurrence[ICS::INTERVAL] = $_recurrence->interval;
          }
          break;

        case Recurrence::RECURTYPE_WEEKLY :
          $recurrence[ICS::FREQ] = ICS::FREQ_WEEKLY;
          if (isset($_recurrence->interval)) {
            // Recupere l'interval de recurrence
            $recurrence[ICS::INTERVAL] = $_recurrence->interval;
          }
          if (is_array($_recurrence->days) && count($_recurrence->days) > 0) {
            // Jour de récurrence
            $recurrence[ICS::BYDAY] = implode(',', $_recurrence->days);
          }
          break;

        case Recurrence::RECURTYPE_MONTHLY :
          $recurrence[ICS::FREQ] = ICS::FREQ_MONTHLY;
          if (isset($_recurrence->interval)) {
            // Recupere l'interval de recurrence
            $recurrence[ICS::INTERVAL] = $_recurrence->interval;
          }
          $start = new DateTime($event->start);
          $recurrence[ICS::BYMONTHDAY] = $start->format('d');
          break;

        case Recurrence::RECURTYPE_MONTHLY_BYDAY :
          $start = new DateTime($event->start);
          $day_of_week = $start->format('w');
          $nth_weekday = ceil($start->format('d') / 7);

          $vcaldays = array(
                  'SU',
                  'MO',
                  'TU',
                  'WE',
                  'TH',
                  'FR',
                  'SA'
          );

          $recurrence[ICS::FREQ] = ICS::FREQ_MONTHLY;
          if (isset($_recurrence->interval)) {
            // Recupere l'interval de recurrence
            $recurrence[ICS::INTERVAL] = $_recurrence->interval;
          }
          $recurrence[ICS::BYDAY] = $nth_weekday . $vcaldays[$day_of_week];
          break;

        case Recurrence::RECURTYPE_YEARLY :
          $recurrence[ICS::FREQ] = ICS::FREQ_YEARLY;
          if (isset($_recurrence->interval)) {
            // Recupere l'interval de recurrence
            $recurrence[ICS::INTERVAL] = $_recurrence->interval;
          }
          break;

        case Recurrence::RECURTYPE_YEARLY_BYDAY :
          $start = new DateTime($event->start);
          $monthofyear = $start->format('m'); // 01 à 12
          $nth_weekday = ceil($start->format('d') / 7);
          $day_of_week = $start->format('w');
          $vcaldays = array(
                  'SU',
                  'MO',
                  'TU',
                  'WE',
                  'TH',
                  'FR',
                  'SA'
          );

          $recurrence[ICS::FREQ] = ICS::FREQ_YEARLY;
          if (isset($_recurrence->interval)) {
            // Recupere l'interval de recurrence
            $recurrence[ICS::INTERVAL] = $_recurrence->interval;
          }
          $recurrence[ICS::BYDAY] = $nth_weekday . $vcaldays[$day_of_week];
          $recurrence[ICS::BYMONTH] = $monthofyear;
          break;
      }
    }
    return $recurrence;
  }

  /**
   * Parses an iCalendar 2.0 recurrence rule.
   * based on Horde_Date_Recurrence class
   *
   * @link http://rfc.net/rfc2445.html#s4.3.10
   * @link http://rfc.net/rfc2445.html#s4.8.5
   * @link http://www.shuchow.com/vCalAddendum.html
   * @param string $rrule An iCalendar 2.0 conform RRULE value.
   * @return Event $event Melanie 2 Event
   */
  public static function RRule20_to_m2($rdata, $event) {
    // Définition de la recurrence Mél
    $recurrence = driver_mel::gi()->recurrence([$event]);

    if (isset($rdata[ICS::FREQ])) {
      // Always default the recurInterval to 1.
      $recurrence->interval = isset($rdata[ICS::INTERVAL]) ? $rdata[ICS::INTERVAL] : 1;
      $recurrence->days = array();
      // MANTIS 4121: Calculer une date de fin approximative pour un count
      $nbdays = $recurrence->interval;

      switch (strtoupper($rdata[ICS::FREQ])) {
        case ICS::FREQ_DAILY :
          $recurrence->type = Recurrence::RECURTYPE_DAILY;
          $nbdays = $nbdays + 7;
          break;

        case ICS::FREQ_WEEKLY :
          $recurrence->type = Recurrence::RECURTYPE_WEEKLY;
          if (isset($rdata[ICS::BYDAY])) {
            $recurrence->days = explode(',', $rdata[ICS::BYDAY]);
          }
          $nbdays = $nbdays * 7 + 14;
          break;

        case ICS::FREQ_MONTHLY :
          if (isset($rdata[ICS::BYDAY])) {
            $recurrence->type = Recurrence::RECURTYPE_MONTHLY_BYDAY;
            $recurrence->days = explode(',', $rdata[ICS::BYDAY]);
          }
          else {
            $recurrence->type = Recurrence::RECURTYPE_MONTHLY;
          }
          $nbdays = $nbdays * 31 + 31;
          break;

        case ICS::FREQ_YEARLY :
          if (isset($rdata[ICS::BYYEARDAY])) {
            $recurrence->type = Recurrence::RECURTYPE_YEARLY;
          }
          elseif (isset($rdata[ICS::BYDAY])) {
            $recurrence->type = Recurrence::RECURTYPE_YEARLY_BYDAY;
            $recurrence->days = explode(',', $rdata[ICS::BYDAY]);
          }
          else {
            $recurrence->type = Recurrence::RECURTYPE_YEARLY;
          }
          $nbdays = $nbdays * 366 + 300;
          break;
      }
      if (isset($rdata[ICS::UNTIL])) {
        $recurrence->enddate = $rdata[ICS::UNTIL];
        $recurenddate = new DateTime($recurrence->enddate);
        $startdate = new DateTime($event->start);
        $enddate = new DateTime($event->end);
        // Est-ce que l'on est en journée entière ?
        if ($startdate->format('H:i:s') == '00:00:00' && $enddate->format('H:i:s') == '00:00:00') {
          // On position la date de fin de récurrence de la même façon
          $recurrence->enddate = $recurenddate->format('Y-m-d') . ' 00:00:00';
        }
        else {
          // On position la date de fin basé sur la date de début -1h
          // Voir MANTIS 3584: Les récurrences avec une date de fin se terminent à J+1 sur mobile
          $startdate->sub(new DateInterval('PT1H'));
          $recurrence->enddate = $recurenddate->format('Y-m-d') . ' ' . $startdate->format('H:i:s');
        }
        // MANTIS 3610: Impossible de modifier la date de fin d'un evt récurrent si celui-ci était paramétré avec un nombre d'occurrences
        // Forcer le count a 0
        $recurrence->count = 0;
      }
      elseif (isset($rdata[ICS::COUNT])) {
        $recurrence->count = intval($rdata[ICS::COUNT]);
        // MANTIS 4121: Calculer une date de fin approximative pour un count
        $enddate = new DateTime($event->end);
        $enddate->add(new DateInterval("P".$nbdays."D"));
        $recurrence->enddate = $enddate->format('Y-m-d H:i:s');
      }
      else {
        $recurrence->enddate = "9999-12-31 00:00:00";
      }
    }
    else {
      // No recurrence data - event does not recur.
      $recurrence->type = Recurrence::RECURTYPE_NORECUR;
    }
    return $recurrence;
  }
}