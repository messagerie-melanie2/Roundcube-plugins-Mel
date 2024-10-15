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

// LibM2 ORM
@include_once 'includes/libm2.php';

class mel_nextcloud extends rcube_plugin {
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
  function init() {
    $rcmail = rcmail::get_instance();

    // Chargement de la conf
    $this->load_config();
    $this->add_texts('localization/', false);
    
    $this->get_env_js();

    if (class_exists('driver_mel')) {
      if (!driver_mel::get_instance()->userHasAccessToStockage()) {
        return;
      }
    }
    else {
      // Gestion du filtre LDAP
      $filter_ldap = $rcmail->config->get('roundcube_nextcloud_filter_ldap', array());
      if (isset($filter_ldap) && count($filter_ldap) > 0) {
        $user_infos = LibMelanie\Ldap\Ldap::GetUserInfos($rcmail->get_user_name());
        
        foreach ($filter_ldap as $key => $value) {
          if (!isset($user_infos[$key]) || is_array($user_infos[$key]) && !in_array($value, $user_infos[$key]) || is_string($user_infos[$key]) && $user_infos[$key] != $value) {
            return;
          }
        }
      }
    }

    if (mel::is_internal()) {
      $nextcloud_url = $rcmail->config->get('nextcloud_url');
    }
    else {
      $nextcloud_url = $rcmail->config->get('nextcloud_external_url');
    }
     if (class_exists("mel_metapage")) mel_metapage::add_url_spied($nextcloud_url, 'stockage');

    $this->add_hook('logout_after', array(
            $this,
            'logout_after'
    ));

    // Ajout du css
    $this->include_stylesheet($this->local_skin_path() . '/mel_nextcloud.css');

    // ajout de la tache
    $this->register_task('stockage');
    // Ajoute le bouton en fonction de la skin

    $need_button = $rcmail->config->get('skin') == 'mel_larry' ? 'taskbar_mel' : 'taskbar';

    if (class_exists("mel_metapage")) {
      $need_button = $rcmail->plugins->get_plugin('mel_metapage')->is_app_enabled('app_documents') ? $need_button : 'otherappsbar';
    }

    if ($need_button)
    {
      if ($rcmail->config->get('ismobile', false)) {
        $this->add_button(array(
            'command' => 'stockage',
            'class'	=> 'button-mel_nextcloud ui-link ui-btn ui-corner-all ui-icon-bullets ui-btn-icon-left',
            'classsel' => 'button-mel_nextcloud button-selected ui-link ui-btn ui-corner-all ui-icon-bullets ui-btn-icon-left',
            'innerclass' => 'button-inner',
            'label'	=> 'mel_nextcloud.task',
        ), 'taskbar_mobile');
      } else {
        $this->add_button(array(
            'command' => 'stockage',
            'class' => 'button-mel_nextcloud stockage icon-mel-folder',
            'classsel' => 'button-mel_nextcloud stockage icon-mel-folder button-selected',
            'innerclass' => 'button-inner',
            'label' => 'mel_nextcloud.task',
            'title' => 'mel_nextcloud.stockage_title',
            'type' =>'link'
        ), $need_button);
      }
    }

    // Si tache = stockage, on charge l'onglet
    if ($rcmail->task == 'stockage') {
      // Ajout du css
      $this->include_stylesheet($this->local_skin_path() . '/mel_frame.css');
      // Disable refresh
      $rcmail->output->set_env('refresh_interval', 0);
      $this->register_action('index', array(
              $this,
              'action'
      ));
      $this->login_nextcloud();
    }
    elseif ($rcmail->task == 'mail' || $rcmail->task == 'addressbook' || $rcmail->task == 'calendar') {
      // Appel le script de de gestion des liens vers le sondage
      if (!class_exists("mel_metapage")) $this->include_script('nextcloud_link.js');
      $rcmail->output->set_env('nextcloud_file_url', $rcmail->url(array(
              "_task" => "stockage",
              "_params" => "%%other_params%%"
      )));
      $rcmail->output->set_env('nextcloud_external_url', $rcmail->config->get('nextcloud_external_url'));
    }
    else if ($rcmail->task == 'settings') {
      $this->add_hook('settings_actions', array($this, 'settings_actions'));
      $this->api->register_action('plugin.mel_nextcloud', $this->ID, array(
        $this,
        'settings'
      ));
    }
    else if ($rcmail->task === 'workspace') {
      $this->add_hook('wsp.show', [$this, 'wsp_block']);
    }
    

    $this->add_hook('workspace.services.set', [$this, 'workspace_set_drive']);
  }

  /**
   * Adds Filters section in Settings
   */
  function settings_actions($args)
  {
    $args['actions'][] = array(
        'action' => 'plugin.mel_nextcloud',
        'class'  => 'nextcloud',
        'label'  => 'task',
        'domain' => 'mel_nextcloud',
        'title'  => 'nextcloudtitle',
    );
    return $args;
  }

  function action() {
    $rcmail = rcmail::get_instance();
    // register UI objects
    $rcmail->output->add_handlers(array(
            'mel_nextcloud_frame' => array(
                    $this,
                    'nextcloud_frame'
            )
    ));

    // Chargement du template d'affichage
    $rcmail->output->set_pagetitle($this->gettext('title'));
    $rcmail->output->send('mel_nextcloud.mel_nextcloud');
  }

  function settings() {
    $rcmail = rcmail::get_instance();
    // Ajout du css
    $this->include_stylesheet($this->local_skin_path() . '/mel_frame.css');
    $this->login_nextcloud(true);
    // register UI objects
    $rcmail->output->add_handlers(array(
            'mel_nextcloud_frame' => array(
                    $this,
                    'nextcloud_frame'
            )
    ));
    // Chargement du template d'affichage
    $rcmail->output->set_pagetitle($this->gettext('title'));
    $rcmail->output->send('mel_nextcloud.settings');
  }
  /**
   * Appel apres l'appel au logout
   *
   * @param array $args
   */
  function logout_after($args) {
    $rcmail = rcmail::get_instance();
    if (mel::is_internal()) {
      $nextcloud_url = $rcmail->config->get('nextcloud_url');
    }
    else {
      $nextcloud_url = $rcmail->config->get('nextcloud_external_url');
    }
    $rcmail->output->set_env('nextcloud_url', $nextcloud_url);
    // Appel le script de deconnexion du nextcloud
    $this->include_script('disconnect.js');
  }
  /**
   * Gestion de la frame
   *
   * @param array $attrib
   * @return string
   */
  function nextcloud_frame($attrib) {
    if (! $attrib['id'])
      $attrib['id'] = 'rcmnextcloudframe';

    $rcmail = rcmail::get_instance();

    $attrib['name'] = $attrib['id'];

    $rcmail->output->set_env('contentframe', $attrib['name']);
    $rcmail->output->set_env('blankpage', $attrib['src'] ? $rcmail->output->abs_url($attrib['src']) : 'program/resources/blank.gif');

    return $rcmail->output->frame($attrib);
  }

  private function get_env_js()
  {
    $rcmail = rcmail::get_instance();
    if (mel::is_internal()) {
      $nextcloud_url = $rcmail->config->get('nextcloud_url');
      if ($settings) {
        $nextcloud_settings_url = $rcmail->config->get('nextcloud_settings_url');
      }
    }
    else {
      $nextcloud_url = $rcmail->config->get('nextcloud_external_url');
      if ($settings) {
        $nextcloud_settings_url = $rcmail->config->get('nextcloud_external_settings_url');
      }
    }
    // Configuration de l'environnement
    $rcmail->output->set_env('nextcloud_origin', $rcmail->config->get('nextcloud_origin', ''));
    $rcmail->output->set_env('nextcloud_username', $rcmail->user->get_username());
    //$rcmail->output->set_env('nextcloud_password', urlencode($this->encrypt($rcmail->get_user_password())));
    $rcmail->output->set_env('nextcloud_url', $nextcloud_url);
 
  }

  /**
   * Méthode pour se logger dans l'application de nextcloud
   */
  private function login_nextcloud($settings = false) {
    $rcmail = rcmail::get_instance();
    if (mel::is_internal()) {
      $nextcloud_url = $rcmail->config->get('nextcloud_url');
      if ($settings) {
        $nextcloud_settings_url = $rcmail->config->get('nextcloud_settings_url');
      }
    }
    else {
      $nextcloud_url = $rcmail->config->get('nextcloud_external_url');
      if ($settings) {
        $nextcloud_settings_url = $rcmail->config->get('nextcloud_external_settings_url');
      }
    }
    // Configuration de l'environnement
    $rcmail->output->set_env('nextcloud_username', $rcmail->user->get_username());
    $rcmail->output->set_env('nextcloud_password', urlencode($this->encrypt($rcmail->get_user_password())));
    $rcmail->output->set_env('nextcloud_url', $nextcloud_url);

    if ($settings) {
      $rcmail->output->set_env('nextcloud_gotourl', $nextcloud_settings_url);
    }
    else if (isset($_GET['_params'])) {
      $params = rcube_utils::get_input_value('_params', rcube_utils::INPUT_GET);
      $rcmail->output->set_env('nextcloud_gotourl', $nextcloud_url . ($params ?? ""));
      $rcmail->output->set_env('nextcloud_gotourl_params', $params);
    }
    else {
      $rcmail->output->set_env('nextcloud_gotourl', $nextcloud_url);
    }

    // Appel le script de connexion du nextcloud
    if ($rcmail->config->get('nextcloud_nologin'))
      $this->include_script('nextcloud_nologin.js');
    else
      $this->include_script('nextcloud.js');
  }
  /**
   * Encrypt using 3DES
   *
   * @param string $clear clear text input
   * @param string $key encryption key to retrieve from the configuration, defaults to 'des_key'
   * @param boolean $base64 whether or not to base64_encode() the result before returning
   * @return string encrypted text
   */
  public function encrypt($clear, $key = 'roundcube_nextcloud_des_key', $base64 = true) {
    if (! $clear) {
      return '';
    }

    $rcmail = rcmail::get_instance();

    /*
     * -
     * Add a single canary byte to the end of the clear text, which
     * will help find out how much of padding will need to be removed
     * upon decryption; see http://php.net/mcrypt_generic#68082
     */
    $clear = pack("a*H2", $clear, "80");
    $ckey = $rcmail->config->get_crypto_key($key);

    if (function_exists('openssl_encrypt')) {
      $method = 'DES-EDE3-CBC';
      $opts = defined('OPENSSL_RAW_DATA') ? OPENSSL_RAW_DATA : true;
      $iv = $this->create_iv(openssl_cipher_iv_length($method));
      $cipher = $iv . openssl_encrypt($clear, $method, $ckey, $opts, $iv);
    }
    else if (function_exists('mcrypt_module_open') && ($td = mcrypt_module_open(MCRYPT_TripleDES, "", MCRYPT_MODE_CBC, ""))) {
      $iv = $this->create_iv(mcrypt_enc_get_iv_size($td));
      mcrypt_generic_init($td, $ckey, $iv);
      $cipher = $iv . mcrypt_generic($td, $clear);
      mcrypt_generic_deinit($td);
      mcrypt_module_close($td);
    }

    return $base64 ? base64_encode($cipher) : $cipher;
  }
  /**
   * Generates encryption initialization vector (IV)
   *
   * @param int Vector size
   * @return string Vector string
   */
  private function create_iv($size) {
    // mcrypt_create_iv() can be slow when system lacks entrophy
    // we'll generate IV vector manually
    $iv = '';
    for ($i = 0; $i < $size; $i ++) {
      $iv .= chr(mt_rand(0, 255));
    }

    return $iv;
  }

  public function workspace_set_drive($args) {
    if (class_exists('mel_workspace')) {
      $workspace = $args['workspace'];
      $services = $args['services'];
  
      $search = array_search(mel_workspace::KEY_DRIVE, $services);
      $create_nc = $search !== false || ($workspace->objects()->get(mel_workspace::KEY_DRIVE) ?? false);
  
      driver_mel::gi()->workspace_group($workspace->uid(), $workspace->users_mail(), $create_nc);
  
      $workspace->objects()->set(mel_workspace::KEY_DRIVE, $create_nc);

      $args['workspace'] = $workspace;

      if ($create_nc) {
        $key = array_search(mel_workspace::KEY_DRIVE, $services);

        if ($key !== false) unset($services[$key]);
      }

      $args['services'] = $services;
    }

    return $args;
  }

  public function wsp_block($args) {
    if (class_exists('roundrive')) {
      $SIZE = 4;
      $layout = $args['layout'];
      $html = $layout->htmlModuleBlock(['id' => 'module-nc']);
      $layout->firstRow()->append($SIZE, $html);
      $args['layout'] = $layout;
      unset($layout);

      $args['plugin']->include_workspace_module('mel_nextcloud', 'module.js', '/js/workspace/');
    }

    return $args;
  }
}