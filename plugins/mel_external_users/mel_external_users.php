<?php
/**
 * Plugin Mél External Users
 *
 * plugin mel_external_users pour roundcube
 * Permet la connexion des utilisateurs externes sur le Bnum
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

class mel_external_users extends rcube_plugin {
  /**
   *
   * @var string
   */
  public $task = '.*';
  /**
   *
   * @var rcmail
   */
  private $rc;

  /**
   * Initialisation du plugin
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $this->rc = rcmail::get_instance();

    // Hooks
    $this->add_hook('storage_connect', array($this, 'storage_connect'));
    $this->add_hook('startup', array($this, 'startup'));

    // Css dédié aux externes
    if (driver_mel::gi()->getUser()->is_external) {
        // Ajout du css
        $this->include_stylesheet('externals.css');
        
        if (isset($this->rc->output)) {
          $this->rc->output->set_env('im_external_user', true);
        }
    }
  }

  /**
   * Les externes ne peuvent pas se connecter a toutes les tasks
   */
  public function startup($args) {
    if (driver_mel::gi()->getUser($args['user'])->is_external) {
      if ($this->rc->task == 'bnum') {
          $task = rcube_utils::get_input_value('_initial_task', rcube_utils::INPUT_GPC);
      }
      else {
          $task = $this->rc->task;
      }

      if (in_array($task, array('mail', 'calendar', 'bureau', 'addressbook')) && $_SERVER['REQUEST_METHOD'] === 'GET') {
          header('Location: ' . $this->rc->url(['task' => 'workspace']));
          exit;
      }

      $this->add_hook('main-nav-bar', [$this, 'main_nav_manager']);
    }
    return $args;
  }

  /**
   * Connexion IMAP pour les externes
   * Ils n'ont pas de compte donc on valide toujours la connexion
   */
  public function storage_connect($args) {
    if (driver_mel::gi()->getUser($args['user'])->is_external) {
        $args['return'] = true;
    }
    return $args;
  }

  public function main_nav_manager($args) {
    if (in_array($args['plugin'], array('rizomo', 'wekan'))) {
      $args['need_button'] = false;
    }

    return $args;
  }
}