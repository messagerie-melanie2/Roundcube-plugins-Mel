<?php
/**
 * Plugin Mél nextCloud
 *
 * plugin Mél pour l'acces aux fichiers partagés
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

class mel_onboarding extends rcube_plugin {
  /**
   *
   * @var string
   */
  public $task = '?(?!login).*';

  /**
   * (non-PHPdoc)
   *
   * @see rcube_plugin::init()
   */
  public function init() {
    $rcmail = rcmail::get_instance();

    $this->include_script('onboarding.js');

    // Ajout du css
    $this->include_stylesheet('onboarding.css');
  }
}