<?php
/**
 * Module Webconf pour le portail Mél
 *
 * Portail web
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
use \Firebase\JWT\JWT;

require_once __DIR__ . '/vendor/autoload.php';

class Webconf extends Module {
  /**
   * Handler HTML dédié au module
   */
  public function settings_handler($attrib) {
    $item = $this->rc->output->get_env('personal_item');
    return $this->settings_table(['name', 'tooltip', 'provenance'], $item, '_webconf', !$item['personal']);
  }

  /**
   * Génère le code jwt
   */
  public static function jwt() {
    $rcmail = rcmail::get_instance();
    $room = rcube_utils::get_input_value('_room', rcube_utils::INPUT_GET);
    $unlock = rcube_utils::get_input_value('_unlock', rcube_utils::INPUT_GPC);
    $payload = $rcmail->config->get('webconf_jwt_payload', null);
    if (isset($payload)) {
      $payload['room'] = $room;
      $payload['exp'] = time() + 12*60*60; // Expiration dans 12h
      $key = $rcmail->config->get('webconf_jwt_key', null);

      $jwt = JWT::encode($payload, $key);
      $result = array(
        'action'  => 'jwt',
        'id'      => "webconf",
        'room'    => $room,
        'jwt'     => $jwt,
        'unlock'  => $unlock,
      );
      // send output
      header("Content-Type: application/json; charset=" . RCUBE_CHARSET);
      echo json_encode($result);
    }
    exit();
  }
}


