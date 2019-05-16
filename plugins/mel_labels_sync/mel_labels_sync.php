<?php

include_once 'lib/label.php';
include_once 'lib/driver.php';

/**
 * Plugin de gestion des labels thunderbird pour Roundcube Webmail
 * Basé sur thunderbird_labels de Michael Kefeder (http://code.google.com/p/rcmail-thunderbird-labels/)
 * Permet d'afficher les 5 labels de base et de configurer de nouveau label pour imiter la configuration Thunderbird
 */
class mel_labels_sync extends rcube_plugin {
  /**
   * ** PRIVATE **
   */
  /**
   * Liste des flags imap génériques
   *
   * @var array
   */
  private $generic_flags = array(
          'undeleted',
          'deleted',
          'seen',
          'unseen',
          'flagged',
          'unflagged',
          'answered',
          'draft',
          'mdnsent',
          'nonjunk',
          'forwarded',
          'recent',
          'redirected'
  );
  /**
   * Variable de mapping
   *
   * @var string
   */
  private $map;
  /**
   *
   * @var rcube
   */
  private $rc;
  /**
   *
   * @var boolean
   */
  private $header_loaded = false;
  /**
   *
   * @var Driver
   */
  private $driver;

  /**
   * ** PUBLIC **
   */
  /**
   * Task courante pour le plugin
   *
   * @var string
   */
  public $task = 'mail|settings';

  /**
   * Initialisation du plugin
   *
   * @see rcube_plugin::init()
   */
  function init() {
    $this->rc = rcmail::get_instance();

    // Ajout de la localization du plugin
    $this->add_texts('localization/', true);
    // Chargement de la conf
    $this->load_config();
    // Récupération du driver
    $this->driver = Driver::get_instance();

    if ($this->rc->task == 'mail') {
      // disable plugin when printing message
      if ($this->rc->action == 'print' || $this->rc->action == 'compose' || $this->rc->action == 'get')
        return;

        // Ajoute le script javascript
      $this->include_script('mel_label.js');
      // Ajout du css
      if ($this->rc->config->get('ismobile', false)) {
        $this->include_stylesheet('skins/mel_larry_mobile/tb_label.css');
      }
      else {
        $this->include_stylesheet($this->local_skin_path() . '/tb_label.css');
      }

      // Configuration des hooks
      $this->add_hook('messages_list', array(
              $this,
              'read_flags'
      ));
      $this->add_hook('message_load', array(
              $this,
              'read_single_flags'
      ));
      $this->add_hook('template_object_messageheaders', array(
              $this,
              'color_headers'
      ));
      $this->add_hook('render_page', array(
              $this,
              'tb_label_popup'
      ));

      // additional TB flags
      $this->message_tb_labels = array();
      $this->add_tb_flags = array();
      $labels_name = array();
      $labels_color = array();
      foreach ($this->_get_bal_labels() as $label) {
        $key = strtolower($label->key);
        if (isset($this->add_tb_flags[$key])) {
          continue;
        }
        $this->add_tb_flags[$key] = $label->tag;
        $key = $this->_convert_key_to_css($key);
        $labels_name[$key] = $label->tag;
        $labels_color[$key] = $label->color;
      }
      
      // Trier dans l'ordre inverse les labels colors pour le css
      krsort($labels_color);

      $this->rc->output->set_env('labels_translate', $labels_name);
      $this->rc->output->set_env('labels_color', $labels_color);

      // Ajoute le bouton en fonction de la skin
      if ($this->rc->config->get('ismobile', false)) {
        // Ajout du bouton dans la toolbar
        $this->add_button(array(
                'command' => 'plugin.thunderbird_labels.rcm_tb_label_submenu',
                'id' => 'tb_label_popuplink',
                'title' => 'label', // gets translated
                'domain' => $this->ID,
                'type' => 'link',
                'content' => $this->Q($this->gettext('labels')), // maybe put translated version of "Labels" here?
                'class' => 'mark_as_read icon ui-link ui-btn ui-corner-all ui-icon-tags ui-btn-icon-left'
        ), 'toolbar_mobile');
        // Ajout du bouton dans la toolbar
        $this->add_button(array(
                'command' => 'plugin.thunderbird_labels.rcm_tb_label_submenu',
                'id' => 'tb_label_popuplink',
                'title' => 'label', // gets translated
                'domain' => $this->ID,
                'type' => 'link',
                'content' => $this->Q($this->gettext('labels')), // maybe put translated version of "Labels" here?
                'class' => 'mark_as_read icon ui-link ui-btn ui-corner-all ui-icon-tags ui-btn-icon-notext'
        ), 'more_buttons_toolbar_mobile');
      }
      else {
        // Ajout du bouton dans la toolbar
        $this->add_button(array(
                'command' => 'plugin.thunderbird_labels.rcm_tb_label_submenu',
                'id' => 'tb_label_popuplink',
                'title' => 'label', // gets translated
                'domain' => $this->ID,
                'type' => 'link',
                'content' => $this->Q($this->gettext('labels')), // maybe put translated version of "Labels" here?
                'class' => ($this->rc->config->get('skin') == 'larry' || $this->rc->config->get('skin') == 'mel_larry') ? 'button thunderbird' : 'tb_noclass'
        ), 'toolbar');
      }

      // Register action
      $this->register_action('plugin.thunderbird_labels.set_flags', array(
              $this,
              'set_flags'
      ));
      $this->register_action('plugin.thunderbird_labels.update_list_labels', array(
              $this,
              'update_list_labels'
      ));
    }
    else if ($this->rc->task == 'settings') {
      // Ajout du css
      if ($this->rc->config->get('ismobile', false)) {
        $this->include_stylesheet('skins/mel_larry_mobile/tb_label.css');
      }
      else {
        $this->include_stylesheet($this->local_skin_path() . '/tb_label.css');
      }

      $this->add_hook('preferences_list', array(
              $this,
              'preferences_list'
      ));
      $this->add_hook('preferences_save', array(
              $this,
              'preferences_save'
      ));
      $this->add_hook('preferences_sections_list', array(
              $this,
              'preferences_sections_list'
      ));
    }
  }

  /**
   * Affichage de la gestion des labels dans le contextmenu
   *
   * @param array $args
   */
  public function show_tb_label_contextmenu($args) {
    $li = html::tag('li', array(
            'class' => 'submenu'
    ), $this->Q($this->gettext('label')) . $this->_gen_label_submenu($args, 'tb_label_ctxm_submenu'));
    $out .= html::tag('ul', array(
            'id' => 'tb_label_ctxm_mainmenu'
    ), $li);
    $this->api->output->add_footer(html::div(array(
            'style' => 'display: none;'
    ), $out));
  }

  /**
   * Génération de la liste des labels pour le contextmenu
   *
   * @param array $args
   * @param string $id
   * @return string html
   */
  private function _gen_label_submenu($args, $id) {
    $out = '';
    $i = 0;
    foreach ($this->_get_bal_labels() as $label) {
      $key = $this->_convert_key_to_css($label->key);
      $separator = ($i == 0) ? ' separator_below' : '';
      $class = 'label_' . $key;
      $out .= '<li id="' . $this->_convert_key_to_css($label->key) . '" class="' . $class . $separator . ' ctxm_tb_label"><a href="#ctxm_tb_label" class="active" onclick="rcmail_ctxm_label_set(' . $key . ')">' . $label->tag . '</a></li>';
      $i ++;
    }
    $out = html::tag('ul', array(
            'class' => 'popupmenu toolbarmenu folders',
            'id' => $id
    ), $out);
    return $out;
  }

  /**
   * Affichage des flags au chargement des messages
   *
   * @param array $args
   */
  public function read_single_flags($args) {
    if (! $this->rc->config->get('show_labels', false) || ! isset($args['object']))
      return;

    if (is_array($args['object']->headers->flags)) {
      $this->message_tb_labels = array();
      $labels = $this->_get_bal_labels();
      foreach ($args['object']->headers->flags as $flagname => $flagvalue) {
        $flag = is_numeric("$flagvalue") ? $flagname : $flagvalue; // for compatibility with < 0.5.4
        $label = Driver::find_label_by_key($flag, $labels);
        if (isset($label)) {
          $this->message_tb_labels[] = "'" . $this->_convert_key_to_css($label->key) . "'";
        }
      }
    }
    // no return value for this hook
  }

  /**
   * Writes labelnumbers for single message display
   * Coloring of Message header table happens via Javascript
   *
   * @param array $p
   */
  public function color_headers($p) {
    if (! $this->header_loaded) {
      // always write array, even when empty
      $p['content'] .= '<script type="text/javascript">
        		var tb_labels_for_message = [' . join(',', $this->message_tb_labels) . '];
    	    	</script>';
      $this->header_loaded = true;
    }
    return $p;
  }

  /**
   * Lecture des flags du messages
   *
   * @param array $args
   * @return array
   */
  public function read_flags($args) {
    // dont loop over all messages if we dont have any highlights or no msgs
    if (! $this->rc->config->get('show_labels', false) || ! isset($args['messages']) || ! is_array($args['messages']))
      return $args;

    $labels = $this->_get_bal_labels();
    // Doit on ajouter les labels au messages ?
    $list_cols = $this->rc->config->get('list_cols');
    $show_labels = false;
    if (in_array('labels', $list_cols)) {
      $show_labels = true;
    }
    // loop over all messages and add $LabelX info to the extra_flags
    foreach ($args['messages'] as $message) {
      if ($show_labels)
        $message->labels = "";
      $message->list_flags['extra_flags']['tb_labels'] = array(); // always set extra_flags, needed for javascript later!
      if (is_array($message->flags)) {
        foreach ($message->flags as $flagname => $flagvalue) {
          if (in_array(strtolower($flagname), $this->generic_flags))
            continue;
          $flag = is_numeric("$flagvalue") ? $flagname : $flagvalue; // for compatibility with < 0.5.4
          $label = Driver::find_label_by_key($flag, $labels);
          if (isset($label)) {
            $message->list_flags['extra_flags']['tb_labels'][] = $this->_convert_key_to_css($label->key);
            if ($message->labels != "")
              $message->labels .= ", ";
            $message->labels .= $label->tag;
          }
        }
      }
    }
    return ($args);
  }

  /**
   * Modification des flags pour un message
   *
   * @return boolean
   */
  function set_flags() {
    $imap = $this->rc->imap;
    $cbox = rcube_utils::get_input_value('_cur', rcube_utils::INPUT_GET);
    $mbox = rcube_utils::get_input_value('_mbox', rcube_utils::INPUT_GET);
    $toggle_label = rcube_utils::get_input_value('_toggle_label', rcube_utils::INPUT_GET);
    $flag_uids = rcube_utils::get_input_value('_flag_uids', rcube_utils::INPUT_GET);
    $flag_uids = explode(',', $flag_uids);
    $unflag_uids = rcube_utils::get_input_value('_unflag_uids', rcube_utils::INPUT_GET);
    $unflag_uids = explode(',', $unflag_uids);

    $toggle_label = $this->_convert_key_from_css($toggle_label);

    $imap->conn->flags = array_merge($imap->conn->flags, $this->add_tb_flags);

    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, '[set_flags] ' . var_export(array(
              '$cbox' => $cbox,
              '$mbox' => $mbox,
              '$toggle_label' => $toggle_label,
              '$flag_uids' => $flag_uids,
              '$unflag_uids' => $unflag_uids,
              '$imap->conn->flags' => $imap->conn->flags
      ), true));

    if (! is_array($unflag_uids) || ! is_array($flag_uids))
      return false;

    $imap->set_flag($flag_uids, $toggle_label, $mbox);
    $imap->set_flag($unflag_uids, "UN$toggle_label", $mbox);

    $this->api->output->send();
  }

  /**
   * Mise à jour de la liste des labels
   * Appel ajax depuis le javascript
   */
  function update_list_labels() {
    if (mel_logs::is(mel_logs::TRACE))
      mel_logs::get_instance()->log(mel_logs::TRACE, 'update_list_labels()');
    $result = array(
            'action' => 'plugin.thunderbird_labels.update_list_labels',
            'html' => $this->get_tb_label_popup()
    );
    echo json_encode($result);
    exit();
  }

  /**
   * Génération du pop up contenant la liste des labels à selectionner
   */
  function tb_label_popup() {
    $out = '<div id="tb_label_popup" class="popupmenu">' . $this->get_tb_label_popup() . '</div>';
    $this->rc->output->add_gui_object('tb_label_popup_obj', 'tb_label_popup');
    $this->rc->output->add_footer($out);
  }

  private function get_tb_label_popup() {
    $out = '';
    // Ajoute le menu si on n'est pas en mobile
    if (! $this->rc->config->get('ismobile', false)) {
      if ($this->_is_gestionnaire($this->rc->plugins->get_plugin('mel')->get_user_bal())) {
        $out .= html::div('tb_label_div_manage_labels', '<a href="#" id="rcube_manage_labels" onclick="show_rcube_manage_labels()" class="active">' . $this->gettext('manage_labels') . '</a>');
      }
      else {
        $out .= html::div('tb_label_div_manage_labels', '<a href="#" id="rcube_manage_labels" class="desactive">' . $this->gettext('manage_labels') . '</a>');
      }
    }

    $out .= '<ul class="toolbarmenu">';
    $out .= '<li id="label0" class="label0 click0"><a href="#">0 ' . $this->gettext('label0') . '</a></li>';
    $i = 0;
    foreach ($this->_get_bal_labels() as $label) {
      $key = $this->_convert_key_to_css($label->key);
      $separator = ($i == 0) ? ' separator_below' : '';
      $class = 'label_' . $key;
      if ($i < 9) {
        $i ++;
        $text = $i . ' ' . $label->tag;
        $class .= ($class == "" ? "" : " ") . "click$i";
      }
      else {
        $text = $label->tag;
      }
      $out .= '<li id="' . $this->_convert_key_to_css($label->key) . '" class="' . $class . ' separator_below"><a href="#">' . $text . '</a></li>';
    }

    $out .= '</ul>';

    return $out;
  }

  /**
   * Handler for preferences_list hook.
   * Adds options blocks into Labels settings sections in Preferences.
   *
   * @param array Original parameters
   * @return array Modified parameters
   */
  public function preferences_list($p) {
    if ($p['section'] != 'labels') {
      return $p;
    }
    $p['blocks']['show_labels']['name'] = $this->gettext('labels list');

    if (!$this->_is_gestionnaire($this->_get_current_user_name())) {
      $p['blocks']['show_labels']['options']['labels_list']['content'] = $this->_labels_balp_list() . html::br() . html::br() . html::div(array('class' => 'texte_explic'), $this->gettext('labels_editable_by_gestionnaire'));
    }
    else {
      $labels_list = '';
      $i = 0;

      foreach ($this->driver->get_user_labels($this->_get_current_user_name()) as $label) {
        $field_class = 'rcmfd_label_' . $this->_convert_key_to_css($label->key);
        $color = $label->color;

        $label_color = new html_inputfield(array(
                'name' => "_colors[" . $label->key . "]",
                'class' => "$field_class colors",
        		'readonly' => 'readonly',
                'size' => 6
        ));

        $name = $label->tag;
        $label_name = new html_inputfield(array(
                'name' => "_labels[" . $label->key . "]",
                'class' => $field_class,
                'size' => 30
        ));
        $label_remove = new html_inputfield(array(
                'type' => 'button',
                'value' => 'X',
                'class' => 'button',
                'onclick' => '$(this).parent().remove()',
                'title' => $this->gettext('remove_label')
        ));
        $labels_list .= html::div(null, $hidden . $label_name->show($name) . '&nbsp;' . $label_color->show($color) . '&nbsp;' . $label_remove->show());
      }

      $p['blocks']['show_labels']['options']['labels_list']['content'] = $this->_labels_balp_list() . html::br() . html::br() . html::div(array(
              'id' => 'labelslist'
      ), $labels_list);

      $field_id = 'rcmfd_new_label';
      $new_label = new html_inputfield(array(
              'name' => '_new_label',
              'id' => $field_id,
              'size' => 30
      ));
      $add_label = new html_inputfield(array(
              'type' => 'button',
              'class' => 'button',
              'value' => $this->gettext('add_label'),
              'onclick' => "rcube_label_add_label()"
      ));
      $p['blocks']['show_labels']['options']['new_label'] = array(
              'content' => $new_label->show('') . '&nbsp;' . $add_label->show()
      );
      
      $colors = require_once 'lib/colors.php';

      $this->rc->output->add_script('function rcube_label_add_label() {
          var name = $("#rcmfd_new_label").val();
          var label = name.replace(/ /g, "_");
          if (name.length) {
            var input = $("<input>").attr("type", "text").attr("name", "_labels["+label+"]").attr("size", 30).val(name);
            var color = $("<input>").attr("type", "text").attr("readonly", true).attr("name", "_colors["+label+"]").attr("size", 6).addClass("colors").val("");
            var button = $("<input>").attr("type", "button").attr("value", "X").addClass("button").click(function(){ $(this).parent().remove() });
            $("<div>").append(input).append("&nbsp;").append(color).append("&nbsp;").append(button).appendTo("#labelslist");
            color.miniColors({ colorValues:(' . json_encode($colors) .') });
            $("#rcmfd_new_label").val("");
          }
        }');
      
      // include color picker
      $this->include_script('lib/js/jquery.miniColors.min.js');
      $this->include_stylesheet($this->local_skin_path() . '/jquery.miniColors.css');
      $this->rc->output->add_script('$("input.colors").miniColors({ colorValues:(' . json_encode($colors) . ') })', 'docready');
    }


    return $p;
  }

  /**
   * Handler for preferences_save hook.
   * Executed on Labels settings form submit.
   *
   * @param array Original parameters
   * @return array Modified parameters
   */
  public function preferences_save($p) {
    if ($p['section'] == 'labels') {
      if (!$this->_is_gestionnaire($this->_get_current_user_name())) {
        return $p;
      }
      $labels = array();
      $_post_labels = ( array ) rcube_utils::get_input_value('_labels', rcube_utils::INPUT_POST);
      $_post_colors = ( array ) rcube_utils::get_input_value('_colors', rcube_utils::INPUT_POST);
      $old_labels = $this->driver->get_user_labels($this->_get_current_user_name());

      // Parcours des labels retournés par le post
      foreach ($_post_labels as $key => $label_name) {
        $old_label = Driver::find_label_by_key($key, $old_labels);
        if (! isset($old_label)) {
          $label_key = strtolower(rcube_charset::convert($key, 'UTF-8', 'UTF7-IMAP'));
        }
        else {
          $label_key = $key;
        }
        $labels[] = Label::withArray([
                'key' => $label_key,
                'tag' => $label_name,
                'color' => $_post_colors[$key] ?  : null,
                'ordinal' => ''
        ]);
      }

      $this->driver->modify_user_labels($this->_get_current_user_name(), $labels);
      $this->rc->output->add_script("parent.$('#managelabelsframe').dialog('close');");
    }
    return $p;
  }

  /**
   * Handler for preferences_sections_list hook.
   * Adds Labels settings sections into preferences sections list.
   *
   * @param array Original parameters
   * @return array Modified parameters
   */
  public function preferences_sections_list($p) {
    $p['list']['labels'] = array(
            'id' => 'labels',
            'section' => $this->gettext('labels settings')
    );

    return $p;
  }

  /**
   * Permet de convertir la clé des étiquettes en valeur utilisable en css
   *
   * @param string $key
   * @return string
   */
  private function _convert_key_to_css($key) {
    $_forbidden_char = array(
            '$',
            '&',
            '~',
            '\''
    );
    $_replacement_char = array(
            '_-s-_',
            '_-e-_',
            '_-t-_',
            '_-q-_'
    );
    $key = strtolower($key);
    $key = str_replace($_forbidden_char, $_replacement_char, $key);
    return $key;
  }
  /**
   * Permet de convertir la clé des étiquettes en valeur normale depuis le css
   *
   * @param string $key
   * @return string
   */
  private function _convert_key_from_css($key) {
    $_forbidden_char = array(
            '$',
            '&',
            '~',
            '\''
    );
    $_replacement_char = array(
            '_-s-_',
            '_-e-_',
            '_-t-_',
            '_-q-_'
    );
    $key = strtolower($key);
    $key = str_replace($_replacement_char, $_forbidden_char, $key);
    return $key;
  }
  /**
   * Reourne la liste des étiquettes pour la boite courante
   * Pour les BALP on retourne aussi celles de la BALI
   *
   * @return array Liste des étiquettes
   */
  private function _get_bal_labels() {
    // MANTIS 0004420: Toujours lister les étiquettes de la BALI
    $_labels_list = $this->driver->get_user_labels($this->rc->user->get_username());
    if ($this->rc->plugins->get_plugin('mel')->get_user_bal() != $this->rc->user->get_username()) {
      $_labels_list = array_merge($_labels_list, $this->driver->get_user_labels($this->rc->plugins->get_plugin('mel')->get_user_bal()));
      $_labels_list = array_unique($_labels_list);
      $_labels_list = $this->driver->order_labels($_labels_list);
    }
    return $_labels_list;
  } 
  
  /**
   * Génération de la liste des balp pour l'utilisateur courant
   *
   * @param array $attrib Liste des paramètres de la liste
   * @return string HTML
   */
  private function _labels_balp_list($attrib = array()) {
    if (! $attrib['id'])
      $attrib['id'] = 'rcmlabelsbalplist';

    // Récupération de la liste des balp de l'utilisateur
    $balp_list = mel::get_user_balp_gestionnaire($this->rc->user->get_username());
    // Ajoute le javascript
    // MANTIS 0004498: Le gestion des étiquettes d'une balp choisie dans la liste depuis une bali semble ne pas marcher
    $attrib['onchange'] = "self.location = rcmail.url('settings/edit-prefs', {_section: 'labels', _framed: 1, _current_username: this.value});";
    // Gestion du current_username pour enregistrer les étiquettes au bon endroit
    $attrib['name'] = "_current_username";
    // Génération du select html
    $html_select = new html_select($attrib);

    $infos = mel::get_user_infos($this->rc->user->get_username());
    $html_select->add('---');
    $html_select->add($infos['cn'][0], $infos['uid'][0]);

    // Parcours la liste des boites et ajoute les options
    if (is_array($balp_list)) {
      foreach ($balp_list as $balp) {
        if (! isset($balp['uid']))
          continue;
        if (strpos($balp['uid'][0], '.-.')) {
          $name = explode('.-.', $balp['uid'][0]);
          $name = $name[1];
        }
        else {
          $name = $balp['uid'][0];
        }
        $infos = mel::get_user_infos($name);
        $html_select->add($infos['cn'][0], $name);
      }
    }
    return $html_select->show($this->_get_current_user_name());
  }
  /**
   * Retourne le username courant pour mon compte
   * Utilise la liste pour le déterminer
   */
  private function _get_current_user_name() {
    if (isset($_GET['_current_username']) || isset($_POST['_current_username'])) {
      return trim(rcube_utils::get_input_value('_current_username', rcube_utils::INPUT_GPC));
    }
    else {
      return $this->rc->plugins->get_plugin('mel')->get_user_bal();
    }
  }
  /**
   * Retourne si l'utilisateur courant est gestionnaire de la liste
   * @param string $balp
   * @return boolean
   */
  private function _is_gestionnaire($balp) {
    if ($this->rc->user->get_username() == $balp) {
      return true;
    }
    else {
      // Récupération de la liste des balp de l'utilisateur
      $balp_list = mel::get_user_balp_gestionnaire($this->rc->user->get_username());
      // Parcours la liste des boites et ajoute les options
      if (is_array($balp_list)) {
        foreach ($balp_list as $_bal) {
          if (isset($_bal['uid'])) {
            if (strpos($_bal['uid'][0], '.-.')) {
              $name = explode('.-.', $_bal['uid'][0]);
              $name = $name[1];
            }
            else {
              $name = $_bal['uid'][0];
            }
            if ($name == $balp) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  /**
   * Replacing specials characters to a specific encoding type
   *
   * @param string  Input string
   * @param string  Replace mode for tags: show|remove|strict
   * @param boolean Convert newlines
   *
   * @return string The quoted string
   */
  private function Q($str, $mode='strict', $newlines=true) {
    return rcube_utils::rep_specialchars_output($str, 'html', $mode, $newlines);
  }
}
?>
