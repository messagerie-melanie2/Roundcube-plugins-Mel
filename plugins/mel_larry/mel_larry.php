<?php
/**
 * Plugin Mel Larry
 *
 * Apply plugins css for mel_larry skin
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

class mel_larry extends rcube_plugin
{
  /**
   * @var string
   */
  public $task = '.*';
  /**
   * Skin name
   * @var string
   */
  const SKIN_NAME = 'mel_larry';
  /**
   * Css folder
   * @var string
   */
  const CSS_FOLDER = 'css/';
  /**
   * Themes colors css file for Roundcube
   * @var string
   */
  const THEMES_CSS = 'themes.css';
  /**
   * Global css file for Roundcube
   * @var string
   */
  const APP_CSS = 'styles.css';
  /**
   * JS folder
   * @var string
   */
  const JS_FOLDER = 'js/';
  /**
   * UI js file for Roundcube
   * @var string
   */
  const UI_JS = 'ui.js';
  /**
   * Mél js file for Roundcube
   * @var string
   */
  const MEL_JS = 'mel.js';
  /**
   * Map between plugin and css file
   * @var array
   */
  public static $plugins_css_map = [
      'jqueryui' => 'jqueryui.css',
      'tasklist' => 'tasklist.css',
  ];
  /**
   * Map between task and css file
   * @var array
   */
  public static $tasks_css_map = [
    'mail' => 'mail.css',
    'addressbook' => 'addressbook.css',
    'settings' => 'settings.css',
  ];
  /**
   * Map between task and js file
   * @var array
   */
  public static $tasks_js_map = [
      'tasks' => 'tasklist.js',
  ];

  /**
   * Initialisation du plugin
   * @see rcube_plugin::init()
   */
  function init()
  {
    // default startup routine
    $this->add_hook('startup', array($this, 'startup'));
  }

  /**
   * Startup hook
   */
  public function startup($args) {
    if ($this->ui_initialized) {
      return;
    }
    $rc = rcmail::get_instance();
    $plugins = $rc->config->get('plugins');
    $skin = $rc->config->get('skin');
    // Add localization
    $this->add_texts('localization/', true);
    // Check if the user use mel_larry skin
    if ($skin == self::SKIN_NAME && !$rc->output->get_env('mobile')) {
      // Themes css
      $this->include_stylesheet(self::CSS_FOLDER.self::THEMES_CSS);
      // App css
      $this->include_stylesheet(self::CSS_FOLDER.self::APP_CSS);
      // For each plugin, add the associated css file
      foreach(self::$plugins_css_map as $plugin_name => $css_file) {
        if (in_array($plugin_name, $plugins)) {
          $this->include_stylesheet(self::CSS_FOLDER.$css_file);
        }
      }
      // Add the associated task css file
      if (isset(self::$tasks_css_map[$rc->task])) {
        $this->include_stylesheet(self::CSS_FOLDER.self::$tasks_css_map[$rc->task]);
      }
      // Load other custom css files
      $this->include_stylesheet(self::CSS_FOLDER.self::$plugins_css_map['jqueryui']);            
      // Load ui & mel js file
      $this->include_script(self::JS_FOLDER.self::UI_JS);
      $this->include_script(self::JS_FOLDER.self::MEL_JS);
      // Add the associated task js file
      if (isset(self::$tasks_js_map[$rc->task])) {
        $this->include_script(self::JS_FOLDER.self::$tasks_js_map[$rc->task]);
      }
      // Add plugins list
      $rc->output->set_env('plugins', $rc->config->get('plugins', []));
    }
    $this->ui_initialized = true;
  }
}
