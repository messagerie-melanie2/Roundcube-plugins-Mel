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

    $isLogged = $this->rc()->user->ID && $this->rc()->task !== 'login';
    if($_SERVER['REQUEST_METHOD'] === 'GET' && $isLogged) {
      try {
      $this->load_script_module('main', '/js/');
      }catch(Error $e) {}
    }

    $this->add_hook('refresh', [$this, 'hook_refresh']);
    $this->add_hook('logout_after', [$this, 'hook_logout_after']);

    if ($this->is_bnum_task())
      $this->register_action('plugin.bnum_after', [$this, 'action_after']);
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
  public function hook_refresh($args) {
    if(!isset($_COOKIE['once_per_day'])) {
      setcookie('once_per_day', true, time()+60*60*24);
      $this->exec_hook('once_per_day');

      $this->rc()->output->command('plugin.local_once_per_day');
    }

    return $args;
  }

  public function hook_logout_after($args) {

    unset($_COOKIE['once_per_day']);
    rcube_utils::setcookie('once_per_day', '-del-', time() - 60);
    rcube_utils::setcookie('popup_msg_enrollment', '-del-', time() - 60);

    return $args;
  }

  /**
   * Gestion lors de la première connexion pour ne pas doubler les actions au premier refresh
   */
  public function action_after() { 
    $valid = true;

    try {
      unset($_COOKIE['once_per_day']);
      $this->hook_refresh([]);
    } catch (\Throwable $th) {
      $valid = $th;
    }

    $this->set_env('action_after.once_per_day_data', ['valid' => $valid === true, 'error' => $valid !== true ? $valid : null]);
  }
}
