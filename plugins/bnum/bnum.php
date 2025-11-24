<?php 
if (!defined('EMPTY_STRING')) {
    define('EMPTY_STRING', '');
}

if (!defined('FORCE_CALENDAR_DRIVER')) {
    define('FORCE_CALENDAR_DRIVER', '_____env_force_calendar_driver_____');
}

include_once 'bnum_plugin.php';
class bnum extends bnum_plugin {
  public $task = '.*';

  function init() {
    if (self::IsCalendarDriverForced()) self::UnforceCalendarDriver();

    $this->load_config();
  }

  public static function ForceCalendarDriver() {
    $_ENV[FORCE_CALENDAR_DRIVER] = true;
  }

  public static function UnforceCalendarDriver() {
    unset($_ENV[FORCE_CALENDAR_DRIVER]);
  }

  public static function IsCalendarDriverForced() {
    return $_ENV[FORCE_CALENDAR_DRIVER] === true;
  }
}
