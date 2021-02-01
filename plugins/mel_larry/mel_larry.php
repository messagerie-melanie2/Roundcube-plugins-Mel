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
   * Liste des thèmes supportés par la skin mel_larry
   * 
   * @var array
   */
  const THEMES = ['auto', 'light', 'dark', 'sunset'];
  /**
   * Themes colors css file for Roundcube
   * @var string
   */
  const THEMES_CSS = 'theme-%%param%%.css';
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
    $rcmail = rcmail::get_instance();
    // default startup routine
    $this->add_hook('startup', array($this, 'startup'));

    // Config hook
    if ($rcmail->config->get('skin') == 'mel_larry') {
      $this->add_hook('config_get', array($this,'config_get'));
      // Theme preference configuration
      $this->add_hook('preferences_list',             array($this, 'prefs_list'));
      $this->add_hook('preferences_save',             array($this, 'prefs_save'));
      $this->add_hook('preferences_sections_list',    array($this, 'sections_list'));

      // // Folders list handler
      if ($rcmail->task == 'mail' && empty($rcmail->action)
         && !in_array('mel_sharedmailboxes_imap', $rcmail->config->get('plugins', []))
         && !in_array('mel_sharedmailboxes', $rcmail->config->get('plugins', []))) {
        $rcmail->output->add_handler('mailboxlist_mel', array($rcmail, 'folder_list'));
      }
    }
  }

  /**
   * Modify the user configuration to adapt to mobile skin
   *
   * @param array $args
   */
  public function config_get($args) {
    switch ($args['name']) {
      // Passer en lu automatiquement lors du double clic
      case 'mail_read_time':
        $rcmail = rcmail::get_instance();
        if ($rcmail->task == 'mail' && $rcmail->action == 'show' && $args['result'] == -1) {
          $args['result'] = 0;
        }
        break;
    }
    return $args;
  }

  /**
   * Handler for user preferences sections list
   * Remove folders section
   */
  function sections_list($args) {
    if (isset($args['list']['folders'])) {
      unset($args['list']['folders']);
    }
    return $args;
  }

  /**
   * Handler for user preferences form (preferences_list hook)
   */
  function prefs_list($args) {
    if ($args['section'] == 'general') {
      $rc = rcmail::get_instance();
      // Check that configuration is not disabled
      $dont_override = ( array ) $rc->config->get('dont_override', array());
      $key = 'themes';
      if (!in_array($key, $dont_override)) {
        $themes = [ $key => [
          'name' => $this->gettext("settings_themes"),
          'options' => [],
        ]];
        
        $input    = new html_radiobutton(array('name'=>'_themes'));
        $field_id = 'rcmfd_theme';
        foreach (self::THEMES as $theme) {
          $thumbnail   = "plugins/mel_larry/images/themes/$theme.png";
          $themename    = $this->gettext("themes_title_$theme");
          $themedescription    = $this->gettext("themes_description_$theme");
  
          $img = html::img(array(
                  'src'     => $thumbnail,
                  'class'   => 'themethumbnail',
                  'alt'     => $themename,
                  'onerror' => "this.src = rcmail.assets_path('program/resources/blank.gif')",
          ));
  
          $themes[$key]['options'][$theme]['content'] = html::label(array('class' => 'themeselection'),
              html::span('themeitem', $input->show($rc->config->get('mel_larry_theme', 'auto'), array('value' => $theme, 'id' => $field_id.$theme))) .
              html::span('themeitem', $img) .
              html::span('themeitem', html::span('themename', rcube::Q($themename)) . html::br() .
                  html::span('themedescription', $themedescription))
          );
        }
        $this->array_insert($args['blocks'], 1, $themes);
      }
    }
    return $args;
  }

  /**
   * Insert at
   */
  private function array_insert(&$array, $position, $insert_array) {
    $first_array = array_splice ($array, 0, $position);
    $array = array_merge ($first_array, $insert_array, $array);
  } 

  /**
   * Handler for user preferences save (preferences_save hook)
   */
  public function prefs_save($args) {
    if ($args['section'] == 'general') {
      $rc = rcmail::get_instance();
      // Check that configuration is not disabled
      $dont_override = (array)$rc->config->get('dont_override', array());
      $key = 'themes';
      if (!in_array($key, $dont_override)) {
        $config_key = 'mel_larry_theme';
        $value = rcube_utils::get_input_value('_' . $key, rcube_utils::INPUT_POST);
        if ($rc->config->get($config_key, 'auto') != $value) {
          $rc->output->command('reload', 500);
        }
        $args['prefs'][$config_key] = $value;
      }
    }
    return $args;
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
      $theme_param = $rc->config->get('mel_larry_theme', 'auto');
      $this->include_stylesheet(self::CSS_FOLDER.str_replace('%%param%%', $theme_param, self::THEMES_CSS));
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
