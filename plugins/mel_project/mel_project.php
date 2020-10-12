<?php
/**
 * Plugin Mél Project
 *
 * plugin Mél pour afficher une page de projet multi applications
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

class mel_project extends rcube_plugin {
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

    // ajout de la tache
    $this->register_task('project');

    // Si tache = stockage, on charge l'onglet
    if ($rcmail->task == 'project') {
      // Ajout du css
      $this->include_stylesheet($this->local_skin_path() . '/mel_project.css');
      $this->register_action('index', array(
        $this,
        'action'
      ));
      // Disable refresh
      $rcmail->output->set_env('refresh_interval', 0);
    }
  }

  /**
   * Action d'affichage de la task
   */
  function action() {
    $rcmail = rcmail::get_instance();
    // Récupération des paramètres
    $params = base64_decode(rcube_utils::get_input_value('_params', rcube_utils::INPUT_GET));
    if (isset($params)) {
      $params = json_decode($params, true);
      // Gestion du titre du projet
      if (isset($params['title'])) {
        $title = $params['title'];
        $rcmail->output->set_env('mel_project_title', $title);
        unset($params['title']);
      }
      // Gestion de la date du projet
      if (isset($params['date'])) {
        $date = $params['date'];
        $rcmail->output->set_env('mel_project_date', $date);
        unset($params['date']);
      }
      // Gestion de tous les objets du projets
      $objects = [];
      foreach ($params as $object => $v) {
        $url = $rcmail->config->get($object.'_url', null);
        $objects[$object] = [];
        if (is_array($v)) {
          $value = $v['value'];
          unset($v['value']);
          $objects[$object] = $v;
        }
        else {
          $value = $v;
        }
        if (isset($url)) {
          $objects[$object]['url'] = str_replace('%%param%%', $value, $url);
        }
        else {
          $objects[$object]['url'] = $value;
        }
        // Login Ariane
        if ($object == 'webconf') {
          $rocket_chat = $rcmail->plugins->get_plugin('rocket_chat');
          try {
            $rocket_chat->login();
          }
          catch (Exception $ex) {}
        }
        else if ($object == 'stockage') {
          if (mel::is_internal()) {
            $stockage_url = $rcmail->config->get('nextcloud_url');
          }
          else {
            $stockage_url = $rcmail->config->get('nextcloud_external_url');
          }
          // Configuration de l'environnement
          $rcmail->output->set_env('stockage_username', $rcmail->user->get_username());
          $rcmail->output->set_env('stockage_password', urlencode($rcmail->plugins->get_plugin('mel_nextcloud')->encrypt($rcmail->get_user_password())));
          $rcmail->output->set_env('stockage_url', $stockage_url);
        }
      }
      // Mise en environnement des objets listés
      $rcmail->output->set_env('mel_project_objects', $objects);
    }

    // Chargement du js
    $this->include_script('mel_project.js');

    // Chargement du template d'affichage
    $rcmail->output->set_pagetitle($this->gettext('title') . " : " . $title);
    $rcmail->output->send('mel_project.mel_project');
  }
}