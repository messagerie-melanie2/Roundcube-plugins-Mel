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
  const THEMES = ['auto', 'light', 'dark', 'sunset', 'ens'];
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
    if ($rcmail->config->get('skin') == static::SKIN_NAME) {
      $this->add_hook('config_get', array($this,'config_get'));
      // Theme preference configuration
      $this->add_hook('preferences_list',             array($this, 'prefs_list'));
      $this->add_hook('preferences_save',             array($this, 'prefs_save'));
      $this->add_hook('preferences_sections_list',    array($this, 'sections_list'));
      // register message hook
      $this->add_hook('message_headers_output', array($this, 'mail_headers'));
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
        foreach (static::THEMES as $theme) {
          $thumbnail   = "plugins/" . static::SKIN_NAME . "/images/themes/$theme.png";
          $themename    = $this->gettext("themes_title_$theme");
          $themedescription    = $this->gettext("themes_description_$theme");

          $img = html::img(array(
                  'src'     => $thumbnail,
                  'class'   => 'themethumbnail',
                  'alt'     => $themename,
                  'onerror' => "this.src = rcmail.assets_path('program/resources/blank.gif')",
          ));

          $themes[$key]['options'][$theme]['content'] = html::label(array('class' => 'themeselection'),
              html::span('themeitem', $input->show($rc->config->get(static::SKIN_NAME . '_theme', 'auto'), array('value' => $theme, 'id' => $field_id.$theme))) .
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
  protected function array_insert(&$array, $position, $insert_array) {
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
        $config_key = static::SKIN_NAME . '_theme';
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
   * Change From message header
   */
  public function mail_headers($args) {
    if (isset($args['output']['from'])
        && $args['output']['from']['html']) {
      $args['output']['from']['value'] = $this->rcmail_address_string($args['output']['from']['raw'], null, true, "/images/addcontact.png");
    }

    return $args;
  }

  /**
   * Decode address string and re-format it as HTML links
   */
  protected function rcmail_address_string($input, $max=null, $linked=false, $addicon=null, $default_charset=null, $title=null)
  {
    global $PRINT_MODE;

    $rcmail = rcmail::get_instance();
    $a_parts = rcube_mime::decode_address_list($input, null, true, $default_charset);

    if (!count($a_parts)) {
      return $input;
    }

    $c   = count($a_parts);
    $j   = 0;
    $out = '';
    $allvalues  = array();
    $show_email = $rcmail->config->get('message_show_email');

    if ($addicon && !isset($_SESSION['writeable_abook'])) {
      $_SESSION['writeable_abook'] = $rcmail->get_address_sources(true) ? true : false;
    }

    foreach ($a_parts as $part) {
      $j++;

      $name   = $part['name'];
      $mailto = $part['mailto'];
      $string = $part['string'];
      $valid  = rcube_utils::check_email($mailto, false);

      // IDNA ASCII to Unicode
      if ($name == $mailto)
        $name = rcube_utils::idn_to_utf8($name);
        if ($string == $mailto)
          $string = rcube_utils::idn_to_utf8($string);
          $mailto = rcube_utils::idn_to_utf8($mailto);

          if ($PRINT_MODE) {
            $address = sprintf('%s &lt;%s&gt;', rcube::Q($name), rcube::Q($mailto));
          }
          else if ($valid) {
            if ($linked) {
              $attrs = array(
                  'href'    => 'mailto:' . $mailto,
                  'class'   => 'rcmContactAddress',
                  'onclick' => sprintf("return %s.command('compose','%s',this)",
                    rcmail_output::JS_OBJECT_NAME, rcube::JQ(format_email_recipient($mailto, $name))),
              );

              $attrs['title'] = $mailto;
              if (!$name) {
                $name = explode('@', $mailto, 2);
                $name = ucfirst(str_replace('.', ' ', $name[0])) . ' (' . $name[1] . ')';
              }
              $content =  html::tag('span', 'name', rcube::Q($name)) . html::tag('span', 'mailto', rcube::Q($mailto));

              $address = html::a($attrs, $content);
            }
            else {
              $address = html::span(array('title' => $mailto, 'class' => "rcmContactAddress"),
                rcube::Q($name ?: $mailto));
            }

            if ($addicon && $_SESSION['writeable_abook']) {
              $address .= html::a(array(
                  'href'    => "#add",
                  'title'   => $rcmail->gettext('addtoaddressbook'),
                  'class'   => 'rcmaddcontact',
                  'onclick' => sprintf("return %s.command('add-contact','%s',this)",
                    rcmail_output::JS_OBJECT_NAME, rcube::JQ($string)),
              ),
                html::img(array(
                    'src'   => $rcmail->output->abs_url($addicon, true),
                    'alt'   => "Add contact",
                    'class' => 'noselect',
                )));
            }
          }
          else {
            $address = $name ? rcube::Q($name) : '';
            if ($mailto) {
              $address = trim($address . ' ' . rcube::Q($name ? sprintf('<%s>', $mailto) : $mailto));
            }
          }

          $address = html::span('adr', $address);
          $allvalues[] = $address;

          if (!$moreadrs) {
            $out .= ($out ? ', ' : '') . $address;
          }

          if ($max && $j == $max && $c > $j) {
            if ($linked) {
              $moreadrs = $c - $j;
            }
            else {
              $out .= '...';
              break;
            }
          }
    }

    if ($moreadrs) {
      $label = rcube::Q($rcmail->gettext(array('name' => 'andnmore', 'vars' => array('nr' => $moreadrs))));

      if ($PRINT_MODE) {
        $out .= ' ' . html::a(array(
            'href'    => '#more',
            'class'   => 'morelink',
            'onclick' => '$(this).hide().next().show()',
        ), $label)
        . html::span(array('style' => 'display:none'), join(', ', $allvalues));
      }
      else {
        $out .= ' ' . html::a(array(
            'href'    => '#more',
            'class'   => 'morelink',
            'onclick' => sprintf("return %s.show_popup_dialog('%s','%s')",
              rcmail_output::JS_OBJECT_NAME,
              rcube::JQ(join(', ', $allvalues)),
              rcube::JQ($title))
        ), $label);
      }
    }

    return $out;
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
    if ($skin == static::SKIN_NAME && !$rc->output->get_env('mobile')) {
      // Themes css
      $theme_param = $rc->config->get(static::SKIN_NAME . '_theme', 'auto');
      $this->include_stylesheet(static::CSS_FOLDER.str_replace('%%param%%', $theme_param, static::THEMES_CSS));
      // App css
      $this->include_stylesheet(static::CSS_FOLDER.static::APP_CSS);
      // For each plugin, add the associated css file
      foreach(static::$plugins_css_map as $plugin_name => $css_file) {
        if (in_array($plugin_name, $plugins)) {
          $this->include_stylesheet(static::CSS_FOLDER.$css_file);
        }
      }
      // Add the associated task css file
      if (isset(static::$tasks_css_map[$rc->task])) {
        $this->include_stylesheet(static::CSS_FOLDER.static::$tasks_css_map[$rc->task]);
      }
      // Load other custom css files
      $this->include_stylesheet(static::CSS_FOLDER.static::$plugins_css_map['jqueryui']);
      // Load ui & mel js file
      $this->include_script(static::JS_FOLDER.static::UI_JS);
      $this->include_script(static::JS_FOLDER.static::MEL_JS);
      // Add the associated task js file
      if (isset(static::$tasks_js_map[$rc->task])) {
        $this->include_script(static::JS_FOLDER.static::$tasks_js_map[$rc->task]);
      }
      // Add plugins list
      $rc->output->set_env('plugins', $rc->config->get('plugins', []));
    }
    $this->ui_initialized = true;
  }
}
