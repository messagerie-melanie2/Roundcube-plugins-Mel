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

class mel_onboarding extends rcube_plugin
{
  /**
   *
   * @var string
   */
  public $task = '?(?!login).*';
  private $rc;
  /**
   * (non-PHPdoc)
   *
   * @see rcube_plugin::init()
   */
  public function init()
  {
    $this->rc = rcmail::get_instance();
    $prefs = $this->rc->config->get('see_help_again', true);
    if ($prefs) {
      //Si l'aide à déjà été affichée sur cette session
      if (isset($_SESSION['onboarding'])) {
        $this->rc->output->set_env('onboarding', $_SESSION['onboarding']);
      }
    } else {
      $this->rc->output->set_env('onboarding', true);
    }

    $this->load_config();
    $this->rc->output->set_env('help_page_onboarding', $this->rc->config->get('help_page_onboarding'));

     // Si la page est affichée dans un iframe
    $is_framed = rcube_utils::get_input_value('_is_from', rcube_utils::INPUT_GET) == 'iframe' ? true : false; 
    $this->rc->output->set_env('is_framed', $is_framed);

    $this->add_texts('localization/', true);

    $this->include_script('onboarding.js');

    // Ajout du css
    $this->include_stylesheet('onboarding.css');

    if ($this->rc->task == 'settings') {
      $this->register_action('plugin.set_onboarding', array($this, 'set_onboarding'));
    }
  }

  public function set_onboarding()
  {
    $onboarding = filter_var(rcube_utils::get_input_value('_onboarding', rcube_utils::INPUT_POST), FILTER_VALIDATE_BOOLEAN);
    $see_help_again = filter_var(rcube_utils::get_input_value('_see_help_again', rcube_utils::INPUT_POST), FILTER_VALIDATE_BOOLEAN);

    $_SESSION['onboarding'] =  $onboarding;
    $this->rc->user->save_prefs(array('see_help_again' => $see_help_again));
  }
}
