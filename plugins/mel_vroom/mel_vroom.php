<?php

/**
 * Plugin mel_vroom
 *
 * Ce plugin gère la migration des données venant de P2R dans le Bnum pour les Zoom Room (VRoom)
 */
class mel_vroom extends bnum_plugin
{
  public $task = 'settings|vroom';

  /**
   * Ressource courante.
   * 
   * @var Resource
   */
  protected $resource;

  /**
   * Initialisation du plugin.
   *
   * @return void
   */
  public function init()
  {
    $this->setup_plugin()->setup_task()->setup_settings();
    $this->register_ajax_actions();
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
  public function setup_plugin()
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
  public function setup_task()
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
  public function setup_settings()
  {
    if ($this->get_current_task() === 'settings') {

      $this->add_hook('settings_actions', array($this, 'hook_settings_actions'));
      $this->api->register_action('plugin.mel_vroom', $this->ID, [
        $this,
        'action_settings'
      ]);
      $this->add_handlers([
        'mel_vroom_building_select'    => array($this, 'vroom_building_select'),
      ]);
      $this->include_stylesheet($this->local_skin_path() . '/vroom.css');
    }
    return $this;
  }

  /**
   * Enregistre les actions AJAX du plugin.
   *
   * Cette méthode effectue les opérations suivantes :
   * - Enregistre la tâche 'vroom' pour l'identification des requêtes AJAX associées.
   * - Déclare les actions AJAX suivantes :
   *   - 'get_all_vrooms' : récupère toutes les VRooms
   *
   * @return void
   */
  public function register_ajax_actions()
  {
    $this->register_task('vroom');

    $this->register_actions([
      'get_all_vrooms'          => [$this, 'get_all_vrooms'],
    ]);
  }

  /**
   * Récupère toutes les VRooms disponibles dans la localité spécifiée.
   * 
   * Cette méthode utilise le driver MEL pour obtenir les ressources VRoom
   * 
   * Les données récupérées incluent le nom, l'étage, la capacité, le bâtiment,
   * le numéro de la salle et les caractéristiques de chaque VRoom.
   * 
   * Les données sont ensuite envoyées en réponse à la requête AJAX sous forme de tableau.
   * 
   * @return void
   */
  public function get_all_vrooms()
  {
    if (!$this->check_rights_user()) {
      $this->send_command('plugin.mel_vroom_vrooms_data', [
        'success' => false,
        'error'   => $this->gettext('access_denied'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $vrooms = driver_mel::gi()->resources_vroom($this->get_user_locality());
    $data = [];

    foreach ($vrooms as $vroom) {
      $data[] = [
        'name'      => $vroom->fullname,
        'floor'     => $vroom->etage,
        'capacity'  => $vroom->capacite,
        'building'  => $vroom->batiment,
        'room'      => $vroom->roomnumber,
        'settings'  => $vroom->caracteristiques,
        'uid'       => $vroom->uid,
      ];
    }

    $this->send_command('plugin.mel_vroom_vrooms_data', [
        'success' => true,
        'data' => $data
    ]);
  }

  /**
   * Vérifie si l'utilisateur courant a les droits d'administration
   * @return bool
   */
  protected function check_rights_user()
  {
    $current_user = driver_mel::gi()->getUser()->uid;
    $admin_users = $this->get_config('vrooms_admin_list', []);

    return isset($admin_users[$current_user]);
  }

  /**
   * Récupère la localité de l'utilisateur courant basé sur la configuration
   * 
   * @return string
   */
  protected function get_user_locality()
  {
    $current_user = driver_mel::gi()->getUser()->uid;
    $admin_users = $this->get_config('vrooms_admin_list', []);

    return $admin_users[$current_user];
  }

  /**
   * Vérifie si l'utilisateur a accès à la ressource demandée.
   * 
   * @return bool
   */
  protected function check_user_access_to_ressource()
  {
    $resource_uid = rcube_utils::get_input_value('_resource_uid', rcube_utils::INPUT_GPC);

    if (!empty($resource_uid)) {
      $resources = driver_mel::gi()->resources([$resource_uid]);

      if (count($resources) === 1) {
        $this->resource = $resources[0];
        $locality = $this->get_user_locality();
        $cn = $this->resource->fullname;
  
        // Si le dn matche la localité de l'utilisateur on autorise l'accès
        return strpos($this->resource->dn, "cn=$cn,ou=$locality,") === 0;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }

  /**
   * Ajout du plugin dans les settings.
   * 
   * Vérification des droits utilisateur. Si ce dernier n'a pas les droits il ne voit pas
   * s'afficher "Gestion des URLs suspectes"
   */
  public function hook_settings_actions($args)
  {
    // Vérifier les droits avant d'ajouter l'action
    if ($this->check_rights_user()) {
      $args['actions'][] = array(
        'action' => 'plugin.mel_vroom',
        'class'  => 'mel_vroom',
        'label'  => 'vroom',
        'domain' => 'mel_vroom',
        'title'  => 'vroom_title',
      );
    }
    return $args;
  }

  /**
   * Récupère les partages du calendrier pour une ressource donnée.
   * 
   * @param Resource $resource La ressource dont on veut récupérer les partages du calendrier.
   * 
   * @return array Un tableau associatif contenant les partages et leurs droits.
   */
  protected function get_calendar_shares($resource)
  {
    $result = [];
    $calendar = driver_mel::gi()->calendar([$resource]);
    $calendar->id = $resource->uid;

    if ($calendar->load()) {
      $_share = driver_mel::gi()->share([$calendar]);
      $_share->type = \LibMelanie\Api\Defaut\Share::TYPE_USER;
      
      foreach ($_share->getList() as $share) {
        if ($share->name == $resource->uid) {
          continue;
        }

        $acl = [
          'user'        => $share->name,
          'displayname' => $this->get_user($share->name)->name,
          'share'       => "none",
        ];

        if ($share->asRight(\LibMelanie\Config\ConfigMelanie::WRITE)) {
          $acl['share'] = 'rw';
          $acl['share_label'] = $this->gettext('vroom_calendar_share_rw');
          $result[] = $acl;
        }
        else if ($share->asRight(\LibMelanie\Config\ConfigMelanie::READ)) {
          $acl['share'] = 'r';
          $acl['share_label'] = $this->gettext('vroom_calendar_share_r');
          $result[] = $acl;
        }
      }
    }
    
    // Trier les résultats par displayname
    usort($result, function ($a, $b) {
      return strcmp($a['displayname'], $b['displayname']);
    });

    return $result;
  }

  /**
   * Génère un sélecteur HTML pour les bâtiments des VRooms.
   */
  public function vroom_building_select($attrib)
  {
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmvroombuildingselect';
    }

    $html_select = new html_select($attrib);
    $buildings = $this->get_config('vrooms_address_list', []);

    $html_select->add('---', '---');

    foreach ($buildings[$this->get_user_locality()] as $building => $address) {
      $html_select->add($building, $building);
    }

    return $html_select->show($this->resource->batiment);
  }

  /**
   * Affiche la page HTML dans les paramètres
   * 
   * Vérification des droits utilisateur. Si ce dernier n'a pas les droits il ne peut pas
   * accéder à la liste des Urls suspectes.
   */
  public function action_settings()
  {
    if ($this->check_rights_user()) {
      // Affichage normal de la page de configuration
      $this->include_script('js/vroom.js');

      if ($this->check_user_access_to_ressource()) {
        $action = trim(rcube_utils::get_input_value('_act', rcube_utils::INPUT_GPC));

        switch ($action) {
          case 'show':
            $this->action_show_ressource();
            break;
  
          case 'add_calendar_share':
            $this->action_add_calendar_share();
            break;
  
          case 'delete_calendar_share':
            $this->action_delete_calendar_share();
            break;
  
          default:
            $this->send_and_exit('error');
            break;
        }
      }
      else {
        $this->set_page_title($this->gettext('vroom'));
        $this->send_and_exit('mel_vroom.vroom_settings');
      }
    } else {
      $this->show_message_error($this->gettext('access_denied'));
      $this->send_and_exit('error');
    }
  }

  /**
   * Affiche les détails d'une ressource VRoom spécifique.
   */
  protected function action_show_ressource()
  {
    $this->set_page_title($this->gettext('vroom') . ' - ' . $this->resource->fullname);

    $this->set_envs([
      'vroom_uid'         => $this->resource->uid,
      'vroom_fullname'    => $this->resource->fullname,
      'vroom_name'        => $this->resource->name,
      'vroom_room'        => $this->resource->roomnumber,
      'vroom_floor'       => $this->resource->etage,
      'vroom_capacity'    => $this->resource->capacite,
      'vroom_building'    => $this->resource->batiment,
      'vroom_street'      => $this->resource->street,
      'vroom_postalcode'  => $this->resource->postalcode,
      'vroom_locality'    => $this->resource->locality,
      'vroom_email'       => $this->resource->email,
      'vroom_zoom_email'  => $this->resource->zoom_internal_email,
      'vroom_calendar_shares' => $this->get_calendar_shares($this->resource),
    ]);

    $this->send_and_exit('mel_vroom.vroom_show');
  }

  /**
   * Ajoute un partage de calendrier pour une ressource VRoom.
   */
  protected function action_add_calendar_share()
  {
    $user  = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_GPC));
    $acl   = trim(rcube_utils::get_input_value('_acl', rcube_utils::INPUT_GPC));

    $calendar = driver_mel::gi()->calendar();
    $calendar->owner = $this->resource->uid;
    $calendar->id = $this->resource->uid;

    if (!$calendar->load()) {
      // Créer le calendrier s'il n'existe pas puis le recharger (pour récupérer son ID)
      if (!$this->resource->createDefaultCalendar()) {
        $this->send_command('plugin.mel_vroom_add_calendar_share', [
          'success' => false,
          'error'   => $this->gettext('calendar does not exist'),
          'data'    => [],
        ]);
        $this->send_and_exit();
      }
      $calendar = driver_mel::gi()->calendar();
      $calendar->owner = $this->resource->uid;
      $calendar->id = $this->resource->uid;
      $calendar->load();
    }

    if ($this->get_user($user) === null) {
      $this->send_command('plugin.mel_vroom_add_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('user does not exist'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $share = driver_mel::gi()->share([$calendar]);
    $share->type = LibMelanie\Api\Defaut\Share::TYPE_USER;
    $share->name = $user;

    // Compléter automatiquement les droits
    if ($acl == 'rw') {
      // Ecriture + Lecture + Freebusy
      $share->acl = LibMelanie\Api\Defaut\Share::ACL_WRITE
        | LibMelanie\Api\Defaut\Share::ACL_DELETE
        | LibMelanie\Api\Defaut\Share::ACL_READ
        | LibMelanie\Api\Defaut\Share::ACL_FREEBUSY;
    } else if ($acl == 'r') {
      // Lecture + Freebusy
      $share->acl = LibMelanie\Api\Defaut\Share::ACL_READ
        | LibMelanie\Api\Defaut\Share::ACL_FREEBUSY;
    } else {
      $this->send_command('plugin.mel_vroom_add_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('bad acl value'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $ret = $share->save();

    if (is_null($ret)) {
      $this->send_command('plugin.mel_vroom_add_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('cannot add share'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    } else {
      $this->send_command('plugin.mel_vroom_add_calendar_share', [
        'success' => true,
        'data'    => [
          'user'        => $user,
          'displayname' => $this->get_user($user)->name,
          'share'       => $acl,
          'share_label' => $this->gettext('vroom_calendar_share_' . $acl),
        ],
      ]);
    }
  }

  /**
   * Supprime un partage de calendrier pour une ressource VRoom.
   */
  protected function action_delete_calendar_share()
  {
    $user  = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_GPC));

    $calendar = driver_mel::gi()->calendar();
    $calendar->owner = $this->resource->uid;
    $calendar->id = $this->resource->uid;

    if (!$calendar->load()) {
      $this->send_command('plugin.mel_vroom_add_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('calendar does not exist'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $share = driver_mel::gi()->share([$calendar]);
    $share->type = LibMelanie\Api\Defaut\Share::TYPE_USER;
    $share->name = $user;

    if ($share->delete()) {
      $this->send_command('plugin.mel_vroom_delete_calendar_share', [
        'success' => true,
        'data'    => [
          'user' => $user,
        ],
      ]);
    } else {
      $this->send_command('plugin.mel_vroom_delete_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('cannot delete share'),
        'data'    => [],
      ]);
    }
  }
}

