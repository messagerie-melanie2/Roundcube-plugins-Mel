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
    if($_SERVER['REQUEST_METHOD'] === 'GET') {
      try {
      $this->load_script_module('main', '/js/');
      }catch(Error $e) {}
    }
    $this->add_hook('refresh', [$this, 'refresh']);
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

  /**
   * Gestion du cookie once per day en php et JS
   */
  public function refresh($args) {
    if(!isset($_COOKIE['once_per_day'])) {

      setcookie('once_per_day', true, time()+60*60*24);
      $this->exec_hook('once_per_day');

      $this->rc()->output->command('plugin.local_once_per_day');
    }
  }
}
