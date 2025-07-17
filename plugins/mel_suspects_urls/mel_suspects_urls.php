<?php

/**
 * Plugin mel_suspects_urls
 *
 * Ce plugin permet la gestion des URLs suspectes dans l'application Roundcube.
 * Il offre des fonctionnalités pour :
 * - Ajouter des URLs ou des noms de domaine à surveiller
 * - Supprimer des URLs ou des noms de domaine de la liste de surveillance
 * - Restreindre l'accès aux seuls utilisateurs administrateurs
 */
class mel_suspects_urls extends bnum_plugin
{
  public $task = 'settings|suspect_urls|mail';

  /**
   * Initialisation du plugin.
   *
   * @return void
   */
  function init()
  {
    $this->setup_plugin()->setup_task()->setup_settings();
    $this->register_ajax_actions();

    $this->add_hook('mel_urls_suspects_get_all', [$this, 'hook_get_all_urls']);
  }

  /**
   * Configure les éléments de base du plugin.
   * 
   * Cette méthode initialise les dépendances essentielles :
   * - Récupère l'instance de Roundcube
   * - Charge les fichiers de localisation depuis le dossier localization/
   *
   * @return self Retourne l'instance courante pour le chainage de méthodes.
   */
  function setup_plugin()
  {
    $includeInJavascript = true;
    $this->add_texts('localization/', $includeInJavascript);

    return $this;
  }

  /**
   * Configure les actions spécifiques à la tâche en cours.
   * 
   * Cette méthode effectue les opérations suivantes lorsque la tâche active est 'settings' :
   * - Charge la configuration du plugin
   * - Enregistre les actions disponibles :
   *   * 'add_suspect_url' → pour ajouter une URL suspecte
   *   * 'delete_suspect_url' → pour supprimer une URL suspecte
   *   * 'update_url_status' → pour mettre à jour le statut d'une URL suspecte
   *   * 'get_urls_json' → pour récupérer la liste des URLs au format JSON
   *
   * @return self
   */
  function setup_task()
  {
    if ($this->get_current_task() === 'settings') $this->load_config();

    return $this;
  }

  /**
   * Configure les paramètres spécifiques du plugin.
   *
   * Cette méthode initialise les éléments suivants lorsque la tâche active est 'settings' :
   * - Ajoute un hook pour les actions des paramètres (settings_actions)
   * - Enregistre l'action principale du plugin (plugin.mel_suspects_urls)
   *   associée à la méthode `action_settings`
   *
   * @return self
   */
  function setup_settings()
  {

    if ($this->get_current_task() === 'settings') {

      $this->add_hook('settings_actions', array($this, 'hook_settings_actions'));
      $this->api->register_action('plugin.mel_suspects_urls', $this->ID, [
        $this,
        'action_settings'
      ]);
    }
    return $this;
  }

  /**
   * Enregistre les actions AJAX du plugin.
   *
   * Cette méthode effectue les opérations suivantes :
   * - Enregistre la tâche 'suspect_urls' pour l'identification des requêtes AJAX associées.
   * - Déclare les actions AJAX suivantes :
   *   - 'add_suspect_url' : ajoute une URL suspecte
   *   - 'delete_suspect_url' : supprime une URL suspecte
   *   - 'update_url_status' : met à jour le statut d'une URL
   *   - 'get_all_urls' : récupère toutes les URLs suspectes
   *
   * @return void
   */
  function register_ajax_actions()
  {
    $this->register_task('suspect_urls');

    $this->register_actions([
      'add_suspect_url' => [$this, 'add_suspect_url'],
      'delete_suspect_url' => [$this, 'delete_suspect_url'],
      'update_url_status' => [$this, 'update_url_status'],
      'get_all_urls' => [$this, 'get_all_urls']
    ]);
  }

  /**
   * Récupère et retourne les URLs suspectes
   * @return array Liste des URLs
   */
  public function get_all_urls()
  {
      try {

          $sql = "SELECT * FROM mel_suspects_urls ORDER BY url_id ASC";
          $stmt = $this->db()->query($sql);

          if ($stmt === false) {
            $this->send_command('plugin.mel_suspects_urls_urls_data', [
                'success' => false,
                'message' => $this->gettext('mel_suspects_urls.download_error')
            ]);
            $this->send_and_exit();
          }

          $urls = [];
          while ($row = $this->db()->fetch_assoc($stmt)) {
              $urls[] = $row;
          }

          $this->send_command('plugin.mel_suspects_urls_urls_data', [
              'success' => true,
              'data' => $urls
          ]);
          
      } catch (Exception $e) {
          $this->send_command('plugin.mel_suspects_urls_urls_data', [
              'success' => false,
              'message' => $e->getMessage()
          ]);
      }
      
      $this->send_and_exit();
  }

  /** Ajout d'une URL suspecte en BDD
  */
  function add_suspect_url()
  {
      $url = trim(rcube_utils::get_input_value('_url', rcube_utils::INPUT_POST));

      if (!$url) {
          $this->send_command('plugin.mel_suspects_urls_add_url_response', [
              'success' => false,
              'message' => $this->gettext('mel_suspects_urls.empty_url')
          ]);

          $this->send_and_exit();
      }

      // Vérifier si l'URL existe déjà
      $sql = "SELECT COUNT(*) AS count FROM mel_suspects_urls WHERE LOWER(url) = LOWER(?)";
      $result = $this->db()->query($sql, $url);

      if ($result === false) {
          $this->send_command('plugin.mel_suspects_urls_add_url_response', [
              'success' => false,
              'message' => $this->gettext('mel_suspects_urls.url_error')
          ]);
          $this->send_and_exit();
      }

      $row = $this->db()->fetch_assoc($result);

      if ($row['count'] > 0) {
          $this->send_command('plugin.mel_suspects_urls_add_url_response', [
              'success' => false,
              'message' => $this->gettext('mel_suspects_urls.url_already_exist')
          ]);
          
          $this->send_and_exit();
      }

      try {
          $statement = $this->db()->query("INSERT INTO mel_suspects_urls (url, statut) VALUES (?, ?)", $url, 0); // 0 = suspecte par défaut

          if ($statement === false) {
            $this->send_command('plugin.mel_suspects_urls_add_url_response', [
                'success' => false,
                'message' => $this->gettext(['name' => 'mel_suspects_urls.url_add_error', 'vars' => ['url' => $url]])
            ]);
          }
          else {
            $this->send_command('plugin.mel_suspects_urls_add_url_response', [
                'success' => true
            ]);
          }
      } catch (Exception $e) {
          $this->send_command('plugin.mel_suspects_urls_add_url_response', [
              'success' => false,
              'message' => 'Erreur : ' . $e->getMessage()
          ]);
      }

      $this->send_and_exit();
  }

  /** Suppression d'une URL suspecte en BDD
  */
  function delete_suspect_url()
  {
      $url_id = intval(rcube_utils::get_input_value('_url_id', rcube_utils::INPUT_POST));

      try {
          $statement = $this->db()->query("DELETE FROM mel_suspects_urls WHERE url_id = ?", $url_id);

          if ($statement === false) {
              $this->send_command('plugin.mel_suspects_urls_delete_url_response', [
                  'success' => false,
                  'message' => $this->gettext('mel_suspects_urls.delete_error')
              ]);
          }
          else {
            $this->send_command('plugin.mel_suspects_urls_delete_url_response', [
                'success' => true
            ]);
          }
      } catch (Exception $e) {
          $this->send_command('plugin.mel_suspects_urls_delete_url_response', [
              'success' => false,
              'message' => 'Erreur : ' . $e->getMessage()
          ]);
      }

      $this->send_and_exit();
  }


  /** Mise à jour du statut d'une URL en BDD
  * (0 = suspecte, 1 = bloquée) 
  */
  function update_url_status()
  {
      $url_id = intval(rcube_utils::get_input_value('_url_id', rcube_utils::INPUT_POST));
      $statut = intval(rcube_utils::get_input_value('_statut', rcube_utils::INPUT_POST));

      try {
          $statement = $this->db()->query("UPDATE mel_suspects_urls SET statut = ? WHERE url_id = ?", $statut, $url_id);

          if ($statement === false) {
              $this->send_command('plugin.mel_suspects_urls_update_status_response', [
                  'success' => false,
                  'message' => $this->gettext('mel_suspects_urls.update_error')
              ]);
          }
          else {
            $this->send_command('plugin.mel_suspects_urls_update_status_response', [
                'success' => true
            ]);
          }
      } catch (Exception $e) {
          $this->send_command('plugin.mel_suspects_urls_update_status_response', [
              'success' => false,
              'message' => 'Erreur : ' . $e->getMessage()
          ]);
      }

      $this->send_and_exit();
  }

  /**
   * Vérifie si l'utilisateur courant a les droits d'administration
   * @return bool
   */
  private function check_rights_user()
  {
    $current_user = driver_mel::gi()->getUser()->uid;
    $admin_users = $this->get_config('suspectsurls_admin_list', []);

    return in_array($current_user, $admin_users);
  }

  /**
   * Ajout du plugin dans les settings.
   * 
   * Vérification des droits utilisateur. Si ce dernier n'a pas les droits il ne voit pas
   * s'afficher "Gestion des URLs suspectes"
   */
  function hook_settings_actions($args)
  {
    // Vérifier les droits avant d'ajouter l'action
    if ($this->check_rights_user()) {
      $args['actions'][] = array(
        'action' => 'plugin.mel_suspects_urls',
        'class'  => 'suspects_urls',
        'label'  => 'suspects_urls_menu',
        'domain' => 'mel_suspects_urls',
        'title'  => 'suspects_urls_title',
      );
    }
    return $args;
  }

  /**
   * Récupère toutes les URLs suspectes enregistrées en base de données.
   *
   * Cette fonction interroge la table `mel_suspects_urls` pour obtenir la liste des URLs 
   * marquées comme suspectes. Chaque URL est ajoutée au tableau avec une clé indiquant 
   * si elle est bloquée (`bloqued` => true/false).
   *
   * @param array $args Paramètres transmis au hook, enrichis avec la liste des URLs suspectes.
   * @return array $args Paramètres mis à jour contenant la clé 'urls' avec les données récupérées.
   */
  public function hook_get_all_urls($args)
  {
    $sql = "SELECT * FROM mel_suspects_urls";
    $result = $this->db()->query($sql);

    $urls = [];
    while ($row = $this->db()->fetch_assoc($result)) {
      $urls[$row['url']] = [
        'bloqued' => ($row['statut'] === 1)
      ];
    }
    
    $args['urls'] = $urls;
    return $args;
  }

  /**
   * Affiche la page HTML dans les paramètres
   * 
   * Vérification des droits utilisateur. Si ce dernier n'a pas les droits il ne peut pas
   * accéder à la liste des Urls suspectes.
   */
  function action_settings()
  {

    if ($this->check_rights_user()) {
      // Affichage normal de la page de configuration
      $this->include_script('js/mel_suspects_urls.js');
      $this->include_stylesheet($this->local_skin_path() . '/suspects_urls.css');

      $this->set_page_title($this->gettext('suspects_urls'));
      $this->send_and_exit('mel_suspects_urls.suspectsurls_settings');
    } else {
      $this->show_message_error($this->gettext('access_denied'));
      $this->send_and_exit('error');
    }
  }
}

