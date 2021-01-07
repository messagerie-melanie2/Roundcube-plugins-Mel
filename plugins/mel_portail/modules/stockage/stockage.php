<?php
/**
 * Module Stockage pour le portail Mél
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

class Stockage extends Module {
  /**
   * Initialisation du module
   */
  public function init() {
    if (mel::is_internal()) {
      $nextcloud_url = $this->rc->config->get('nextcloud_url');
    }
    else {
      $nextcloud_url = $this->rc->config->get('nextcloud_external_url');
    }
    // Configuration de l'environnement
    $this->rc->output->set_env('nextcloud_username', $this->rc->user->get_username());
    $this->rc->output->set_env('nextcloud_password', urlencode($this->rc->plugins->get_plugin('mel_nextcloud')->encrypt($this->rc->get_user_password())));
    $this->rc->output->set_env('nextcloud_url', $nextcloud_url);
  }

  /**
   * Handler HTML dédié au module
   */
  public function settings_handler($attrib) {
    $item = $this->rc->output->get_env('personal_item');
    return $this->settings_table(['name', 'tooltip', 'provenance'], $item, '_webconf', !$item['personal']);
  }
}


