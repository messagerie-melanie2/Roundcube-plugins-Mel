<?php

/**
 * Plugin mel_resource
 *
 * Ce plugin permet de gérer les resources du Bnum, pour l'instant les VRooms.
 */
class mel_resource extends bnum_plugin
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
      $this->api->register_action('plugin.mel_resource', $this->ID, [
        $this,
        'action_settings'
      ]);
      
      $this->include_stylesheet($this->local_skin_path() . '/resource.css');
    }
    return $this;
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
  public function action_get_all_vrooms()
  {
    if (!$this->check_rights_user()) {
      $this->send_command('plugin.mel_vroom_vrooms_data', [
        'success' => false,
        'error'   => $this->gettext('access_denied'),
        'data'    => [],
      ]);
      $this->send_and_exit();
    }

    $vrooms = [];
    $data = [];

    foreach ($this->get_user_localities() as $locality) {
      $vrooms = array_merge($vrooms, driver_mel::gi()->resources_vroom($locality));
    }

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
   * Récupère les localités de l'utilisateur courant basé sur la configuration
   * 
   * @return array
   */
  protected function get_user_localities()
  {
    $current_user = driver_mel::gi()->getUser()->uid;
    $admin_users = $this->get_config('vrooms_admin_list', []);

    if (!is_array($admin_users[$current_user])) {
      $admin_users[$current_user] = [$admin_users[$current_user]];
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
      if (isset($_POST['vroom_name'])) {
        $resource = driver_mel::gi()->resource([null, 'webmail.resource']);
      }
      else {
        $resource = driver_mel::gi()->resource();
      }
      
      $resource->uid = $resource_uid;

      if ($resource->load()) {
        $this->resource = $resource;
        $localities = $this->get_user_localities();

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
    if ($this->check_rights_user()) {
      $args['actions'][] = array(
        'action' => 'plugin.mel_resource',
        'class'  => 'mel_resource',
        'label'  => 'vroom',
        'domain' => 'mel_resource',
        'title'  => 'vroom_title',
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

    if (isset($this->resource)) {
      foreach ($buildings[$this->get_resource_locality()] as $building => $address) {
        $html_select->add($address['name'], $building);
      }

      return $html_select->show($this->get_resource_building_key());
    }
    else {
      foreach ($this->get_user_localities() as $locality) {
        foreach ($buildings[$locality] as $building => $address) {
          $html_select->add($address['name'], $locality. '/' . $building);
        }
      }

      return $html_select->show();
    }
  }

  /**
   * Génère un sélecteur HTML pour les capacités des VRooms.
   */
  public function vroom_capacity_select($attrib)
  {
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmvroomcapacityselect';
    }

    $html_select = new html_select($attrib);

    for ($i = 0; $i <= 50; $i++) {
      $html_select->add("$i", "$i");
    }

    for ($i = 60; $i <= 200; $i += 10) {
      $html_select->add("$i", "$i");
    }

    for ($i = 300; $i <= 1000; $i += 100) {
      $html_select->add("$i", "$i");
    }

    if (isset($this->resource)) {
      return $html_select->show($this->resource->capacite);
    }
    else {
      return $html_select->show("10");
    }
  }

  /**
   * Génère un sélecteur HTML pour les caractéristiques des VRooms.
   */
  public function vroom_add_caracteristique_select($attrib)
  {
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmvroomcaracteristiqueselect';
    }

    $html_select = new html_select($attrib);
    $resource_caracteristiques = json_decode($this->resource->caracteristiques ?? '[]', true) ?: [];

    foreach ($this->get_config('vrooms_caracteristiques', []) as $caracteristique) {
      if (!isset($resource_caracteristiques[$caracteristique])) {
        $html_select->add($caracteristique, $caracteristique);
      }
    }

    return $html_select->show();
  }

  /**
   * Récupère la clé du bâtiment de la ressource courante.
   * 
   * @return string|null La clé du bâtiment ou null si non trouvée.
   */
  protected function get_resource_building_key()
  {
    $buildings = $this->get_config('vrooms_address_list', []);
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
   * 
   * @return array Les informations du bâtiment ou un tableau vide si non trouvée.
   */
  protected function get_resource_building_infos($batiment, $locality_uid)
  {
    $buildings = $this->get_config('vrooms_address_list', []);

    return isset($buildings[$locality_uid][$batiment]) ? 
        array_merge($buildings[$locality_uid][$batiment], ['key' => $batiment]) : [];
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
      $this->include_script('js/resource.js');

      $action = trim(rcube_utils::get_input_value('_act', rcube_utils::INPUT_GPC));

      if ($this->check_user_access_to_ressource()) {
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
              'vroom_building'    => [$this, 'vroom_building_select'],
              'vroom_capacity'    => [$this, 'vroom_capacity_select'],
              'vroom_add_caracteristique'    => [$this, 'vroom_add_caracteristique_select'],
            ]);
    
            // Gestion du POST pour enregistrer la VRoom
            if (isset($_POST['vroom_name'])) {
              $this->action_create_ressource();
            }
            
            $this->set_page_title($this->gettext('create_title'));
            $this->send_and_exit('mel_resource.vroom_creation');
            break;
  
          case 'get_all_vrooms':
            $this->action_get_all_vrooms();
            break;
  
        }
      }
      else {
        $this->set_page_title($this->gettext('vroom'));
        $this->send_and_exit('mel_resource.vroom_settings');
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

    $this->add_handlers([
      'vroom_building'    => [$this, 'vroom_building_select'],
      'vroom_capacity'    => [$this, 'vroom_capacity_select'],
      'vroom_add_caracteristique'    => [$this, 'vroom_add_caracteristique_select'],
    ]);

    // Gestion du POST pour enregistrer la VRoom
    if (isset($_POST['vroom_name'])) {
      $this->action_modify_ressource();
    }

    $this->set_envs_from_ressource();
    
    rcmail_action::html_editor();

    $this->send_and_exit('mel_resource.vroom_show');
  }

  /**
   * Remplit les variables d'environnement à partir de la ressource courante.
   */
  protected function set_envs_from_ressource()
  {
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
      'vroom_description' => $this->resource->description,
      'vroom_caracteristiques'      => json_decode($this->resource->caracteristiques ?? '[]', true) ?: [],
      'vroom_calendar_shares'       => $this->get_calendar_shares($this->resource),
      'vroom_calendar_group_shares' => $this->get_calendar_shares($this->resource, true),
      'vroom_additionnal_caracteristiques' => $this->get_config('vrooms_caracteristiques', []),
    ]);
  }

  /**
   * Création d'une ressource VRoom.
   */
  protected function action_create_ressource()
  {
    $resource = driver_mel::gi()->resource([null, 'webmail.resource']);
    
    $resource = $this->resource_from_post($resource);

    $resource->type = LibMelanie\Api\Defaut\Resource::TYPE_VROOM;
    $resource->service = "Bnum/Ressources/$resource->locality";
    $resource->zoom_account_id = $this->get_config('vrooms_zoom_account_id', '');
    $resource->uid = $this->generate_uid($resource->type);

    $ret = $resource->save();

    if (is_null($ret)) {
      $this->show_message_error($this->gettext('error_add_vroom'));
    } else {
      $this->show_message($this->gettext('vroom_added'), 'confirmation');
      mel_logs::get_instance()->log(mel_logs::INFO, "[Ressources] Création de la VRoom '$resource->name'");
      $this->resource = $resource;
      $this->set_envs_from_ressource();
      $this->set_page_title($this->gettext('vroom') . ' - ' . $this->resource->fullname);
      $this->send_and_exit('mel_resource.vroom_show');
    }
  }

  /**
   * Modifie les informations d'une ressource VRoom.
   */
  protected function action_modify_ressource()
  {
    $resource = clone $this->resource;
    
    $resource = $this->resource_from_post($resource);

    $ret = $resource->save();

    if (is_null($ret)) {
      $this->show_message_error($this->gettext('error_modify_vroom'));
    } else {
      $this->resource = $resource;
      mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] Modification de la VRoom '$resource->name'");
      $this->show_message($this->gettext('vroom_modified'), 'confirmation');
    }
  }

  /**
   * Supprime une ressource VRoom.
   */
  protected function action_delete_ressource()
  {
    if ($this->resource->delete()) {
      mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] Suppression de la VRoom '$this->resource->name'");
      $this->show_message($this->gettext('vroom_deleted'), 'confirmation');
      $this->send_and_exit('mel_resource.vroom_settings');
    }
    else {
      $this->show_message_error($this->gettext('error_delete_vroom'));
      $this->action_show_ressource();
    }
  }

  /**
   * Remplit une ressource VRoom avec les données provenant du POST.
   * 
   * @param Resource $resource La ressource à remplir.
   * 
   * @return Resource La ressource remplie avec les données du POST.
   */
  protected function resource_from_post($resource) 
  {
    $resource->name         = trim(rcube_utils::get_input_value('vroom_name', rcube_utils::INPUT_GPC));
    $resource->etage        = trim(rcube_utils::get_input_value('vroom_floor', rcube_utils::INPUT_GPC));
    $resource->roomnumber   = trim(rcube_utils::get_input_value('vroom_room', rcube_utils::INPUT_GPC));
    $resource->capacite     = trim(rcube_utils::get_input_value('vroom_capacity', rcube_utils::INPUT_GPC));
    $resource->zoom_internal_email     = trim(rcube_utils::get_input_value('vroom_zoom_email', rcube_utils::INPUT_GPC));
    $resource->fullname     = LibMelanie\Api\Defaut\Resource::TYPE_VROOM . " $resource->name";
    $resource->displayname  = LibMelanie\Api\Defaut\Resource::TYPE_VROOM . " $resource->name";

    // Gestion de la description
    $description  = trim(rcube_utils::get_input_value('vroom_description', rcube_utils::INPUT_GPC, true));

    if (empty($description)) {
      $resource->description = '';
    } else {
      $resource->description = $description;
    }

    $resource->is_zoom_room = true;

    $vroom_building = trim(rcube_utils::get_input_value('vroom_building', rcube_utils::INPUT_GPC));

    if (strpos($vroom_building, '/') !== false) {
      // Format locality/building
      list($locality_uid, $vroom_building) = explode('/', $vroom_building, 2);

      $resource->dn = "cn=$resource->fullname,ou=$locality_uid," . driver_mel::gi()->constant('Resource::DN');
    }
    else {
      // Format building only
      $locality_uid = $this->get_resource_locality();
    }

    $building = $this->get_resource_building_infos($vroom_building, $locality_uid);

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
    if (isset($_POST['vroom_caracteristiques']) && is_array($_POST['vroom_caracteristiques'])) {
      $caracteristiques = [];
      foreach (rcube_utils::get_input_value('vroom_caracteristiques', rcube_utils::INPUT_POST) as $caracteristique) {
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
    return strtolower($type) . bin2hex(random_bytes(12));
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
    return mel_utils::remove_accents(str_replace(' ', '-', strtolower("vroom-{$resource->name}-{$building_key}-{$locality_uid}@" . $this->get_config('vrooms_email_domain', ''))));
  }

  /**
   * Ajoute un partage de calendrier pour une ressource VRoom.
   */
  protected function action_add_calendar_share()
  {
    $user  = trim(rcube_utils::get_input_value('_user', rcube_utils::INPUT_GPC));
    $group  = trim(rcube_utils::get_input_value('_group', rcube_utils::INPUT_GPC));
    $acl   = trim(rcube_utils::get_input_value('_acl', rcube_utils::INPUT_GPC));

    $group = $group === 'true' ? true : false;

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

    if ($group && $this->get_group($user) === null || !$group && $this->get_user($user) === null) {
      $this->send_command('plugin.mel_vroom_add_calendar_share', [
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
      \mel::unsetCache('users');
      $this->send_command('plugin.mel_vroom_add_calendar_share', [
        'success' => true,
        'group'   => $group,
        'data'    => [
          'user'        => $user,
          'displayname' => $group ? $this->get_group($user)->fullname : $this->get_user($user)->name,
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
    $group  = trim(rcube_utils::get_input_value('_group', rcube_utils::INPUT_GPC));

    $group = $group === 'true' ? true : false;

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
    $share->type = $group ? LibMelanie\Api\Defaut\Share::TYPE_GROUP : LibMelanie\Api\Defaut\Share::TYPE_USER;
    $share->name = $user;

    if ($share->delete()) {
      \mel::unsetCache('users');
      $this->send_command('plugin.mel_vroom_delete_calendar_share', [
        'success' => true,
        'group'   => $group,
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

