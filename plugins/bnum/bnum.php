<?php 
if (!defined('EMPTY_STRING')) {
    define('EMPTY_STRING', '');
}

if (!defined('FORCE_CALENDAR_DRIVER')) {
    define('FORCE_CALENDAR_DRIVER', '_____env_force_calendar_driver_____');
}

include_once 'bnum_plugin.php';

/**
 * Plugin Roundcube bnum
 */
class bnum extends bnum_plugin {
  public $task = '.*';

  /**
   * Initialise le plugin.
   */
  function init() {
    if (self::IsCalendarDriverForced()) self::UnforceCalendarDriver();

    $this->load_config();
  }

  /**
   * Force l'utilisation du driver calendrier en définissant une variable d'environnement.
   */
  public static function ForceCalendarDriver() : void {
    $_ENV[FORCE_CALENDAR_DRIVER] = true;
  }

  /**
   * Retire le forçage du driver calendrier en supprimant la variable d'environnement.
   */
  public static function UnforceCalendarDriver() : void {
    unset($_ENV[FORCE_CALENDAR_DRIVER]);
  }

  /**
   * Vérifie si le driver calendrier est actuellement forcé.
   * 
   * @return bool true si le driver est forcé, false sinon.
   */
  public static function IsCalendarDriverForced() : bool {
    return $_ENV[FORCE_CALENDAR_DRIVER] === true;
  }
}
