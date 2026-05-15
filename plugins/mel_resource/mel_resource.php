<?php

/**
 * Plugin mel_resource
 *
 * Ce plugin permet de gérer les resources du Bnum.
 */
class mel_resource extends bnum_plugin
{
  public $task = 'settings';

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

      $this->api->register_action('plugin.mel_resource_vroom', $this->ID, [
        $this,
        'action_vroom'
      ]);

      $this->api->register_action('plugin.mel_resource_salle', $this->ID, [
        $this,
        'action_salle'
      ]);

      $this->api->register_action('plugin.mel_resource_vehicule', $this->ID, [
        $this,
        'action_vehicule'
      ]);

      $this->api->register_action('plugin.mel_resource_materiel', $this->ID, [
        $this,
        'action_materiel'
      ]);

      $this->api->register_action('plugin.mel_resource_flex_office', $this->ID, [
        $this,
        'action_flex_office'
      ]);
      
      $this->include_stylesheet($this->local_skin_path() . '/resource.css');
    }
    return $this;
  }

  /**
   * Récupère toutes les ressources disponibles dans la localité spécifiée.
   * 
   * Cette méthode utilise le driver MEL pour obtenir les ressources
   * 
   * Les données récupérées incluent le nom, l'étage, la capacité, le bâtiment,
   * le numéro de la salle et les caractéristiques de chaque ressources.
   * 
   * Les données sont ensuite envoyées en réponse à la requête AJAX sous forme de tableau.
   * 
   * @return void
   */
  public function action_list_resources($type)
  {
    if (!$this->check_rights_user($type)) {
      $this->send_command('plugin.mel_resources_list', [
        'success' => false,
        'error'   => $this->gettext('access_denied'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $resources = [];
    $data = [];

    foreach ($this->get_user_localities($type) as $locality) {
      switch ($type) {
        case LibMelanie\Api\Defaut\Resource::TYPE_VROOM:
          $resources = array_merge($resources, driver_mel::gi()->resources_vroom($locality));
          break;

        case LibMelanie\Api\Defaut\Resource::TYPE_SALLE:
          $resources = array_merge($resources, driver_mel::gi()->resources_salle($locality));
          break;

        case LibMelanie\Api\Defaut\Resource::TYPE_VEHICULE:
          $resources = array_merge($resources, driver_mel::gi()->resources_vehicule($locality));
          break;

        case LibMelanie\Api\Defaut\Resource::TYPE_MATERIEL:
          $resources = array_merge($resources, driver_mel::gi()->resources_materiel($locality));
          break;

        case LibMelanie\Api\Defaut\Resource::TYPE_FLEX_OFFICE:
          $resources = array_merge($resources, driver_mel::gi()->resources_flex_office($locality));
          break;
      }
    }

    foreach ($resources as $resource) {
      $data[] = [
        'name'      => $resource->name,
        'floor'     => $resource->etage,
        'capacity'  => $resource->capacite,
        'building'  => $resource->batiment,
        'locality'  => $resource->locality,
        'room'      => $resource->roomnumber,
        'settings'  => $resource->caracteristiques,
        'uid'       => $resource->uid,
      ];
    }

    $this->send_command('plugin.mel_resources_list', [
        'success' => true,
        'data' => $data
    ]);
  }

  /**
   * Formate le type de ressource pour l'affichage.
   * 
   * Cette méthode prend un type de ressource en entrée (ex: VROOM, SALLE, VEHICULE) et retourne une version formatée
   * en remplaçant les caractères spéciaux et en mettant le texte en minuscules pour une utilisation cohérente dans les clés de configuration et les classes CSS.
   * 
   * @param string $type Le type de ressource à formater.
   * 
   * @return string Le type de ressource formaté (ex: vroom, salle, vehicule).
   */
  protected function type($type)
  {
    return str_replace(['é', ' '], ['e', '_'], strtolower($type));
  }

  /**
   * Vérifie si l'utilisateur courant a les droits d'administration
   * @param string $type 
   * @return bool
   */
  protected function check_rights_user($type)
  {
    $current_user = driver_mel::gi()->getUser()->uid;
    $admin_users = $this->get_config($this->type($type) . 's_admin_list', []);

    return isset($admin_users[$current_user]);
  }

  /**
   * Récupère les localités de l'utilisateur courant basé sur la configuration
   * 
   * @param string $type Le type de ressource (ex: VROOM) pour lequel récupérer les localités de l'utilisateur.
   * 
   * @return array
   */
  protected function get_user_localities($type)
  {
    $current_user = driver_mel::gi()->getUser()->uid;
    $admin_users = $this->get_config($this->type($type) . 's_admin_list', []);

    if (!is_array($admin_users[$current_user])) {
      if ($admin_users[$current_user] == '*') {
        $localities = driver_mel::gi()->resources_localities();
        $admin_users[$current_user] = [];

        foreach ($localities as $locality) {
          $admin_users[$current_user][] = $locality->uid;
        }
      }
      else {
        $admin_users[$current_user] = [$admin_users[$current_user]];
      }
    }

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
      if (isset($_POST['resource_type'])) {
        $resource = driver_mel::gi()->resource([null, 'webmail.resource']);
      }
      else {
        $resource = driver_mel::gi()->resource();
      }
      
      $resource->uid = $resource_uid;

      if ($resource->load()) {
        $this->resource = $resource;
        $localities = $this->get_user_localities($this->resource->type);

        return in_array($this->get_resource_locality(), $localities);
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
   * Récupère la localité de la ressource couranteen se basant sur le dn.
   * 
   * @return string|null
   */
  protected function get_resource_locality()
  {
    $dn = explode(',', $this->resource->dn, 3);
    return $dn[1] ? substr($dn[1], 3) : null;
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
    if ($this->check_rights_user(LibMelanie\Api\Defaut\Resource::TYPE_VROOM)) {
      $args['actions'][] = array(
        'action' => 'plugin.mel_resource_vroom',
        'class'  => 'mel_resource_room',
        'label'  => 'vroom',
        'domain' => 'mel_resource',
        'title'  => 'vroom_title',
      );
    }

    if ($this->check_rights_user(LibMelanie\Api\Defaut\Resource::TYPE_SALLE)) {
      $args['actions'][] = array(
        'action' => 'plugin.mel_resource_salle',
        'class'  => 'mel_resource_room',
        'label'  => 'salle',
        'domain' => 'mel_resource',
        'title'  => 'salle_title',
      );
    }

    if ($this->check_rights_user(LibMelanie\Api\Defaut\Resource::TYPE_FLEX_OFFICE)) {
      $args['actions'][] = array(
        'action' => 'plugin.mel_resource_flex_office',
        'class'  => 'mel_resource_office',
        'label'  => 'flex_office',
        'domain' => 'mel_resource',
        'title'  => 'flex_office_title',
      );
    }

    if ($this->check_rights_user(LibMelanie\Api\Defaut\Resource::TYPE_VEHICULE)) {
      $args['actions'][] = array(
        'action' => 'plugin.mel_resource_vehicule',
        'class'  => 'mel_resource_car',
        'label'  => 'vehicule',
        'domain' => 'mel_resource',
        'title'  => 'vehicule_title',
      );
    }

    if ($this->check_rights_user(LibMelanie\Api\Defaut\Resource::TYPE_MATERIEL)) {
      $args['actions'][] = array(
        'action' => 'plugin.mel_resource_materiel',
        'class'  => 'mel_resource_hardware',
        'label'  => 'materiel',
        'domain' => 'mel_resource',
        'title'  => 'materiel_title',
      );
    }

    return $args;
  }

  /**
   * Récupère les partages du calendrier pour une ressource donnée.
   * 
   * @param Resource $resource La ressource dont on veut récupérer les partages du calendrier.
   * @param bool $group Indique si les partages sont pour des groupes (true) ou des utilisateurs (false).
   * 
   * @return array Un tableau associatif contenant les partages et leurs droits.
   */
  protected function get_calendar_shares($resource, $group = false)
  {
    $result = [];
    $calendar = driver_mel::gi()->calendar([$resource]);
    $calendar->id = $resource->uid;

    if ($calendar->load()) {
      $_share = driver_mel::gi()->share([$calendar]);
      $_share->type = $group ? \LibMelanie\Api\Defaut\Share::TYPE_GROUP : \LibMelanie\Api\Defaut\Share::TYPE_USER;
      
      foreach ($_share->getList() as $share) {
        if ($share->name == $resource->uid) {
          continue;
        }

        $acl = [
          'user'        => $share->name,
          'displayname' => $group ? $this->get_group($share->name)->fullname : $this->get_user($share->name)->name,
          'share'       => "none",
        ];

        if ($share->asRight(\LibMelanie\Config\ConfigMelanie::WRITE)) {
          $acl['share'] = 'rw';
          $acl['share_label'] = $this->gettext('resource_calendar_share_rw');
          $result[] = $acl;
        }
        else if ($share->asRight(\LibMelanie\Config\ConfigMelanie::READ)) {
          $acl['share'] = 'r';
          $acl['share_label'] = $this->gettext('resource_calendar_share_r');
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
  public function resource_building_select_vroom($attrib)
  {
    return $this->resource_building_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_VROOM);
  }

  /**
   * Génère un sélecteur HTML pour les bâtiments des Salles.
   */
  public function resource_building_select_salle($attrib)
  {
    return $this->resource_building_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_SALLE);
  }

  /**
   * Génère un sélecteur HTML pour les bâtiments des Vehicules.
   */
  public function resource_building_select_vehicule($attrib)
  {
    return $this->resource_building_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_VEHICULE);
  }

  /**
   * Génère un sélecteur HTML pour les bâtiments des Materiels.
   */
  public function resource_building_select_materiel($attrib)
  {
    return $this->resource_building_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_MATERIEL);
  }

  /**
   * Génère un sélecteur HTML pour les bâtiments des flex offices.
   */
  public function resource_building_select_flex_office($attrib)
  {
    return $this->resource_building_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_FLEX_OFFICE);
  }

  /**
   * Génère un sélecteur HTML pour les bâtiments des resources.
   */
  public function resource_building_select($attrib, $type)
  {
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmresourcebuildingselect';
    }

    $html_select = new html_select($attrib);
    $buildings = $this->get_config($this->type($type) . 's_address_list', []);  

    if (isset($this->resource)) {
      foreach ($buildings[$this->get_resource_locality()] as $building => $address) {
        $html_select->add($address['name'], $building);
      }

      return $html_select->show($this->get_resource_building_key($type));
    }
    else {
      foreach ($this->get_user_localities($type) as $locality) {
        if (is_array($buildings[$locality])) {
          foreach ($buildings[$locality] as $building => $address) {
            $html_select->add($address['name'], $locality. '/' . $building);
          }
        }
      }

      return $html_select->show();
    }
  }

  /**
   * Génère un sélecteur HTML pour les capacités des VRooms.
   */
  public function resource_capacity_select_vroom($attrib)
  {
    return $this->resource_capacity_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_VROOM);
  }

  /**
   * Génère un sélecteur HTML pour les capacités des Salles.
   */
  public function resource_capacity_select_salle($attrib)
  {
    return $this->resource_capacity_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_SALLE);
  }

  /**
   * Génère un sélecteur HTML pour les capacités des Vehicules.
   */
  public function resource_capacity_select_vehicule($attrib)
  {
    return $this->resource_capacity_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_VEHICULE);
  }

  /**
   * Génère un sélecteur HTML pour les capacités des Materiels.
   */
  public function resource_capacity_select_materiel($attrib)
  {
    return $this->resource_capacity_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_MATERIEL);
  }

  /**
   * Génère un sélecteur HTML pour les capacités des flex offices.
   */
  public function resource_capacity_select_flex_office($attrib)
  {
    return $this->resource_capacity_select($attrib, LibMelanie\Api\Defaut\Resource::TYPE_FLEX_OFFICE);
  }

  /**
   * Génère un sélecteur HTML pour les capacités des resources.
   */
  public function resource_capacity_select($attrib, $type)
  {
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmresourcecapacityselect';
    }

    $html_select = new html_select($attrib);

    for ($i = 0; $i <= 50; $i++) {
      $html_select->add("$i", "$i");
    }

    if ($type != LibMelanie\Api\Defaut\Resource::TYPE_VEHICULE) {
      for ($i = 60; $i <= 200; $i += 10) {
        $html_select->add("$i", "$i");
      }
  
      for ($i = 300; $i <= 1000; $i += 100) {
        $html_select->add("$i", "$i");
      }
    }   

    if (isset($this->resource)) {
      return $html_select->show($this->resource->capacite);
    }
    else {
      return $html_select->show($type == LibMelanie\Api\Defaut\Resource::TYPE_VEHICULE ? '5' : '10');
    }
  }

  /**
   * Génère un sélecteur HTML pour les caractéristiques des resources.
   */
  public function resource_add_caracteristique_select($attrib)
  {
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmresourcecaracteristiqueselect';
    }

    $html_select = new html_select($attrib);
    $resource_caracteristiques = json_decode($this->resource->caracteristiques ?? '[]', true) ?: [];

    foreach ($this->get_config($this->type($this->resource->type) . 's_caracteristiques', []) as $caracteristique) {
      if (!isset($resource_caracteristiques[$caracteristique])) {
        $html_select->add($caracteristique, $caracteristique);
      }
    }

    return $html_select->show();
  }

  /**
   * Récupère la clé du bâtiment de la ressource courante.
   * 
   * @param string $type Le type de ressource (ex: VROOM) pour lequel récupérer la clé du bâtiment.
   * 
   * @return string|null La clé du bâtiment ou null si non trouvée.
   */
  protected function get_resource_building_key($type)
  {
    $buildings = $this->get_config($this->type($type) . 's_address_list', []);
    $locality = $this->get_resource_locality();

    foreach ($buildings[$locality] as $building => $address) {
      if ($address['name'] == $this->resource->batiment) {
        return $building;
      }
    }

    return null;
  }

  /**
   * Récupère les informations du bâtiment de la ressource courante.
   * 
   * @param string $batiment La clé du bâtiment.
   * @param string $locality_uid L'UID de la localité.
   * @param string $type Le type de ressource (ex: VROOM) pour lequel récupérer les informations du bâtiment.
   * 
   * @return array Les informations du bâtiment ou un tableau vide si non trouvée.
   */
  protected function get_resource_building_infos($batiment, $locality_uid, $type)
  {
    $buildings = $this->get_config($this->type($type) . 's_address_list', []);

    return isset($buildings[$locality_uid][$batiment]) ? 
        array_merge($buildings[$locality_uid][$batiment], ['key' => $batiment]) : [];
  }

  /**
   * Affiche la page de configuration des VRooms.
   */
  public function action_vroom() 
  {
    return $this->action_settings(LibMelanie\Api\Defaut\Resource::TYPE_VROOM);
  }

  /**
   * Affiche la page de configuration des Salles.
   */
  public function action_salle() 
  {
    return $this->action_settings(LibMelanie\Api\Defaut\Resource::TYPE_SALLE);
  }

  /**
   * Affiche la page de configuration des Vehicules.
   */
  public function action_vehicule() 
  {
    return $this->action_settings(LibMelanie\Api\Defaut\Resource::TYPE_VEHICULE);
  }

  /**
   * Affiche la page de configuration des Matériel.
   */
  public function action_materiel() 
  {
    return $this->action_settings(LibMelanie\Api\Defaut\Resource::TYPE_MATERIEL);
  }

  /**
   * Affiche la page de configuration des Flex office.
   */
  public function action_flex_office() 
  {
    return $this->action_settings(LibMelanie\Api\Defaut\Resource::TYPE_FLEX_OFFICE);
  }

  /**
   * Affiche la page HTML dans les paramètres
   * 
   * Vérification des droits utilisateur. Si ce dernier n'a pas les droits il ne peut pas
   * accéder à la liste des Urls suspectes.
   * 
   * @param string $type Le type de ressource à afficher (ex: VRoom).
   */
  public function action_settings($type)
  {
    $_ltype = $this->type($type);

    if ($this->check_rights_user($type)) {
      // Affichage normal de la page de configuration
      $this->include_script('js/resource.js');

      $action = trim(rcube_utils::get_input_value('_act', rcube_utils::INPUT_GPC));

      $this->set_env('resource_type', $type);

      if ($this->check_user_access_to_ressource($type)) {
        switch ($action) {
          case 'show':
            $this->action_show_ressource();
            break;

          case 'delete_resource':
            $this->action_delete_ressource();
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
      else if (!empty($action)) {
        switch ($action) {
          case 'create':
            $this->add_handlers([
              'resource_building'               => [$this, 'resource_building_select_' . $_ltype ],
              'resource_capacity'               => [$this, 'resource_capacity_select_' . $_ltype],
              'resource_add_caracteristique'    => [$this, 'resource_add_caracteristique_select'],
            ]);

            // Gestion du POST pour enregistrer la VRoom
            if (isset($_POST['resource_type'])) {
              $this->action_create_ressource();
            }
            
            $this->set_page_title($this->gettext('create_' . $_ltype .'_title'));
            $this->send_and_exit('mel_resource.' . $_ltype . '_creation');
            break;
  
          case 'get_all_resources':
            $this->action_list_resources($type);
            break;
  
        }
      }
      else {
        $this->set_page_title($this->gettext($_ltype));
        $this->send_and_exit('mel_resource.' . $_ltype . '_settings');
      }
    } else {
      $this->show_message_error($this->gettext('access_denied'));
      $this->send_and_exit('error');
    }
  }

  /**
   * Affiche les détails d'une ressource spécifique.
   */
  protected function action_show_ressource()
  {
    $type = $this->type($this->resource->type);
    $this->set_page_title($this->gettext($type) . ' - ' . $this->resource->fullname);

    $this->add_handlers([
      'resource_building'               => [$this, 'resource_building_select_' . $type],
      'resource_capacity'               => [$this, 'resource_capacity_select_' . $type],
      'resource_add_caracteristique'    => [$this, 'resource_add_caracteristique_select'],
    ]);

    // Gestion du POST pour enregistrer la ressource
    if (isset($_POST['resource_type'])) {
      $this->action_modify_ressource();
    }

    $this->set_envs_from_ressource();
    
    rcmail_action::html_editor();

    $this->send_and_exit('mel_resource.' . $type . '_show');
  }

  /**
   * Remplit les variables d'environnement à partir de la ressource courante.
   */
  protected function set_envs_from_ressource()
  {
    $this->set_envs([
      'resource_type'        => $this->resource->type,
      'resource_uid'         => $this->resource->uid,
      'resource_fullname'    => $this->resource->fullname,
      'resource_name'        => $this->resource->name,
      'resource_room'        => $this->resource->roomnumber,
      'resource_floor'       => $this->resource->etage,
      'resource_capacity'    => $this->resource->capacite,
      'resource_building'    => $this->resource->batiment,
      'resource_street'      => $this->resource->street,
      'resource_postalcode'  => $this->resource->postalcode,
      'resource_locality'    => $this->resource->locality,
      'resource_email'       => $this->resource->email,
      'resource_description' => $this->resource->description,
      'resource_caracteristiques'             => json_decode($this->resource->caracteristiques ?? '[]', true) ?: [],
      'resource_calendar_shares'              => $this->get_calendar_shares($this->resource),
      'resource_calendar_group_shares'        => $this->get_calendar_shares($this->resource, true),
      'resource_additionnal_caracteristiques' => $this->get_config($this->type($this->resource->type) . 's_caracteristiques', []),
    ]);

    // Environnement spécifique par type
    if ($this->resource->type == LibMelanie\Api\Defaut\Resource::TYPE_VROOM) {
      $this->set_env('vroom_zoom_email', $this->resource->zoom_internal_email);
    }
    else if ($this->resource->type == LibMelanie\Api\Defaut\Resource::TYPE_FLEX_OFFICE) {
      $exp = explode($this->gettext('resource_place'), $this->resource->name, 2);
      $this->set_env('resource_place', $exp && isset($exp[1]) ? $exp[1] : '');
    }
  }

  /**
   * Création d'une ressource.
   */
  protected function action_create_ressource()
  {
    $resource = driver_mel::gi()->resource([null, 'webmail.resource']);
    
    $resource->type             = trim(rcube_utils::get_input_value('resource_type', rcube_utils::INPUT_GPC));
    $resource->uid              = $this->generate_uid($resource->type);

    $resource = $this->resource_from_post($resource);

    $resource->service          = "Bnum/Ressources/$resource->locality";

    if ($resource->type == LibMelanie\Api\Defaut\Resource::TYPE_VROOM) {
      $resource->zoom_account_id  = $this->get_config('vrooms_zoom_account_id', '');
    }

    $ret = $resource->save();

    $type = $this->type($resource->type);

    if (is_null($ret)) {
      $this->show_message_error($this->gettext('error_add_' . $type));
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Ressources] Erreur de création de $resource->type '$resource->name' : ");
    } else {
      $this->show_message($this->gettext($type . '_added'), 'confirmation');
      mel_logs::get_instance()->log(mel_logs::INFO, "[Ressources] Création de $resource->type '$resource->name'");
      $this->resource = $resource;
      $this->set_envs_from_ressource();
      $this->set_page_title($this->gettext($type) . ' - ' . $this->resource->fullname);
      $this->send_and_exit('mel_resource.' . $type . '_show');
    }
  }

  /**
   * Modifie les informations d'une ressource.
   */
  protected function action_modify_ressource()
  {
    $resource = clone $this->resource;
    
    $resource = $this->resource_from_post($resource);

    // Gestion de la description
    $description  = trim(rcube_utils::get_input_value('resource_description', rcube_utils::INPUT_GPC, true));

    if (empty($description) && !empty($resource->description)) {
      $resource->description = '';
    } else if (!empty($description)) {
      $resource->description = $description;
    }

    $ret = $resource->save();

    if (is_null($ret)) {
      $this->show_message_error($this->gettext('error_modify_' . $this->type($this->resource->type)));
    } else {
      $this->resource = $resource;
      mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] Modification de $resource->type '$resource->name'");
      $this->show_message($this->gettext($this->type($this->resource->type) . '_modified'), 'confirmation');
    }
  }

  /**
   * Supprime une ressource.
   */
  protected function action_delete_ressource()
  {
    if ($this->resource->delete()) {
      mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] Suppression de $resource->type '$this->resource->name'");
      $this->show_message($this->gettext($this->type($this->resource->type) . '_deleted'), 'confirmation');
      $this->send_and_exit('mel_resource.' . $this->type($this->resource->type) . '_settings');
    }
    else {
      $this->show_message_error($this->gettext('error_delete_' . $this->type($this->resource->type)));
      $this->action_show_ressource();
    }
  }

  /**
   * Remplit une ressource avec les données provenant du POST.
   * 
   * @param Resource $resource La ressource à remplir.
   * 
   * @return Resource La ressource remplie avec les données du POST.
   */
  protected function resource_from_post($resource) 
  {
    $resource->name         = trim(rcube_utils::get_input_value('resource_name', rcube_utils::INPUT_GPC));
    $resource->etage        = trim(rcube_utils::get_input_value('resource_floor', rcube_utils::INPUT_GPC));
    $resource->roomnumber   = trim(rcube_utils::get_input_value('resource_room', rcube_utils::INPUT_GPC));
    $resource->capacite     = trim(rcube_utils::get_input_value('resource_capacity', rcube_utils::INPUT_GPC));

    if ($resource->type == LibMelanie\Api\Defaut\Resource::TYPE_VROOM) {
      $resource->zoom_internal_email     = trim(rcube_utils::get_input_value('vroom_zoom_email', rcube_utils::INPUT_GPC));
      $resource->is_zoom_room = true;
    }
    else if ($resource->type == LibMelanie\Api\Defaut\Resource::TYPE_FLEX_OFFICE) {
      $place = trim(rcube_utils::get_input_value('resource_place', rcube_utils::INPUT_GPC));
      $resource->name = $this->gettext('resource_room') . ' ' . $resource->roomnumber . ' ' . $this->gettext('resource_place') . ' ' . $place;
    }

    $resource->fullname     = $resource->type . " $resource->name";
    $resource->displayname  = $resource->type . " $resource->name";

    $resource_building = trim(rcube_utils::get_input_value('resource_building', rcube_utils::INPUT_GPC));

    if (strpos($resource_building, '/') !== false) {
      // Format locality/building
      list($locality_uid, $resource_building) = explode('/', $resource_building, 2);

      $resource->dn = "cn=$resource->fullname,ou=$locality_uid," . driver_mel::gi()->constant('Resource::DN');
    }
    else {
      // Format building only
      $locality_uid = $this->get_resource_locality();
    }

    $building = $this->get_resource_building_infos($resource_building, $locality_uid, $resource->type);

    if (!empty($building)) {
      $resource->batiment     = $building['name'];
      $resource->street       = $building['street'];
      $resource->postalcode   = $building['postalcode'];
      $resource->locality     = $building['locality'];
    }

    $resource->email = $this->resource_email(
      $resource,
      $locality_uid,
      $building['key']
    );

    $resource->email_list = [$resource->email];

    // Gestion des caractéristiques
    if (isset($_POST['resource_caracteristiques']) && is_array($_POST['resource_caracteristiques'])) {
      $caracteristiques = [];
      foreach (rcube_utils::get_input_value('resource_caracteristiques', rcube_utils::INPUT_POST) as $caracteristique) {
        $caracteristiques[$caracteristique] = 1;
      }
      $resource->caracteristiques = json_encode($caracteristiques, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
      $resource->caracteristiques = json_encode([]);
    }

    return $resource;
  }

  /**
   * Génération d'un uid alpha numérique aléatoire de 32 caractères
   * 
   * @param string $type Le type de ressource (ex: VROOM).
   * 
   * @return string L'UID généré.
   */
  protected function generate_uid($type)
  {
    return str_replace(' ', '', strtolower($type)) . bin2hex(random_bytes(12));
  }

  /**
   * Génère l'adresse e-mail pour une ressource VRoom.
   * 
   * @param Resource $resource La ressource pour laquelle générer l'adresse e-mail.
   * @param string $locality_uid L'UID de la localité.
   * @param string $building_key La clé du bâtiment.
   * 
   * @return string L'adresse e-mail générée pour la ressource VRoom.
   */
  protected function resource_email($resource, $locality_uid, $building_key)
  {
    mel_helper::load_helper($this->rc())->include_utilities();
    return mel_utils::remove_accents(str_replace([' ', '_'], ['-', '-'], strtolower("{$this->type($resource->type)}-{$resource->name}-{$building_key}-{$locality_uid}@" . $this->get_config($this->type($resource->type) . 's_email_domain', ''))));
  }

  /**
   * Ajoute un partage de calendrier pour une ressource VRoom.
   */
  protected function action_add_calendar_share()
  {
    $user   = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_GPC));
    $group  = trim(rcube_utils::get_input_value('_group', rcube_utils::INPUT_GPC));
    $acl    = trim(rcube_utils::get_input_value('_acl', rcube_utils::INPUT_GPC));

    $group = $group === 'true' ? true : false;

    $calendar = driver_mel::gi()->calendar();
    $calendar->owner = $this->resource->uid;
    $calendar->id = $this->resource->uid;

    if (!$calendar->load()) {
      // Créer le calendrier s'il n'existe pas puis le recharger (pour récupérer son ID)
      if (!$this->resource->createDefaultCalendar()) {
        $this->send_command('plugin.mel_resource_add_calendar_share', [
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

    if ($group && $this->get_group($user) === null || !$group && $this->get_user($user) === null) {
      $this->send_command('plugin.mel_resource_add_calendar_share', [
        'success' => false,
        'error'   => $group ? $this->gettext('group does not exist') : $this->gettext('user does not exist'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $share = driver_mel::gi()->share([$calendar]);
    $share->type = $group ? LibMelanie\Api\Defaut\Share::TYPE_GROUP : LibMelanie\Api\Defaut\Share::TYPE_USER;
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
      $this->send_command('plugin.mel_resource_add_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('bad acl value'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $ret = $share->save();

    if (is_null($ret)) {
      $this->send_command('plugin.mel_resource_add_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('cannot add share'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    } else {
      \mel::unsetCache('users');
      $this->send_command('plugin.mel_resource_add_calendar_share', [
        'success' => true,
        'group'   => $group,
        'data'    => [
          'user'        => $user,
          'displayname' => $group ? $this->get_group($user)->fullname : $this->get_user($user)->name,
          'share'       => $acl,
          'share_label' => $this->gettext('resource_calendar_share_' . $acl),
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
    $group  = trim(rcube_utils::get_input_value('_group', rcube_utils::INPUT_GPC));

    $group = $group === 'true' ? true : false;

    $calendar = driver_mel::gi()->calendar();
    $calendar->owner = $this->resource->uid;
    $calendar->id = $this->resource->uid;

    if (!$calendar->load()) {
      $this->send_command('plugin.mel_resource_add_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('calendar does not exist'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $share = driver_mel::gi()->share([$calendar]);
    $share->type = $group ? LibMelanie\Api\Defaut\Share::TYPE_GROUP : LibMelanie\Api\Defaut\Share::TYPE_USER;
    $share->name = $user;

    if ($share->delete()) {
      \mel::unsetCache('users');
      $this->send_command('plugin.mel_resource_delete_calendar_share', [
        'success' => true,
        'group'   => $group,
        'data'    => [
          'user' => $user,
        ],
      ]);
    } else {
      $this->send_command('plugin.mel_resource_delete_calendar_share', [
        'success' => false,
        'error'   => $this->gettext('cannot delete share'),
        'data'    => [],
      ]);
    }
  }
}

