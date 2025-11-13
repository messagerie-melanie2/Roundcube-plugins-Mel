<?php 
/**
 * Plugin Roundcube pour la gestion de l'agenda Bnum.
 * 
 * Ce plugin permet d'ajouter des fonctionnalités avancées à l'agenda,
 * telles que la gestion des catégories, la personnalisation de l'affichage,
 * et l'intégration de liens de prise de rendez-vous.
 */
class bnum_agenda extends bnum_plugin {
  /**
   * Tâches supportées par ce plugin.
   * @var string
   */
  public $task = 'agenda|calendar|settings';

  /**
   * Initialise le plugin et enregistre les actions nécessaires.
   *
   * @return void
   */
  public function init() {
    $this->load_config();

    $this->set_envs([
      'event_limit' => $this->get_config('event_limit', 4),
      'visio_help_url' => $this->get_config('visio-help', ''),
    ]);

    switch ($this->get_current_task()) {
      case 'agenda':
      case 'calendar':
        $this->add_texts('localization/', true);
        $this->register_actions([
          'get_categories' => [$this, 'action_get_categories'],
          'get_master_event' => [$this, 'action_get_master_event']
        ]);

        if ($this->rc()->output !== null) $this->include_module('main.js');
        break;
      
      default:
        $this->add_hooks(
          [
            'signature.links' => [$this, 'hook_signature_links'],
            'preferences_list' => [$this, 'hook_preferences_list'],
            'preferences_save' => [$this, 'hook_preferences_save'],
            'folder_update' => [$this, 'hook_folder_update']
          ]
        );
        break;
    }    
  }

  /**
   * Enregistre un gestionnaire pour une action spécifique côté client.
   *
   * Le callback sera exécuté lors d'une requête du type /?_task=mail&_action=plugin.myaction
   *
   * @param string   $action   Nom de l'action (doit être unique)
   * @param callable $callback Fonction de rappel sous forme de chaîne ou de tableau [objet, méthode]
   *
   * @return void
   */
  public function register_action($action, $callback)
  {
    $this->api->register_action($action, $this->ID, $callback, $this->get_config('calendar_task', 'calendar'));
  }

  /**
   * Récupère la liste des catégories de l'agenda avec leurs couleurs associées.
   *
   * @return array Tableau associatif des catégories et couleurs
   */
  public function get_categories() : array
  {
    /**
     * @var calendar
     */
    $calendar = $this->rc()->plugins->get_plugin('calendar');
    $categories = $calendar->__get('driver')->list_categories();
    $js_categories = [];

    unset($calendar);

    foreach ((array) $categories as $class => $color) {
      if (!empty($color)) {
          $js_categories[$class] = $color;
      }
    }

    return $js_categories;
  }

  /**
   * Action Roundcube pour retourner les catégories de l'agenda au format JSON.
   *
   * @return never
   */
  public function action_get_categories() {
    $this->sendEncodedExit(json_encode($this->get_categories()));
  }

  /**
   * Action pour récupérer un événement maître à partir de son identifiant.
   *
   * @return void
   */
  public function action_get_master_event() {
    $id = $this->get_input('event_id', rcube_utils::INPUT_GET);

    /**
     * @var calendar
     */
    $calendar = $this->rc()->plugins->get_plugin('calendar');
    $event = $calendar->__get('driver')->get_event(['id' => $id, 'uid' => $id]);

    $this->_check_and_format_fields($event, ['start', 'end', 'created', 'modified'])
         ->sendEncodedExit(json_encode($event));
  }
  
  /**
   * Vérifie et formate les champs de type DateTime dans un événement.
   *
   * @param array $event  L'événement à traiter (par référence)
   * @param array $fields Liste des champs à vérifier et formater
   * @return self
   */
  private function _check_and_format_fields(&$event, $fields) {
    foreach ($fields as $field) {
      $this->_check_and_format($event, $field);
    }

    return $this;
  }

  /**
   * Vérifie et formate un champ de type DateTime dans un événement.
   *
   * @param array  $event L'événement à traiter (par référence)
   * @param string $field Le champ à vérifier et formater
   * @return self
   */
  private function _check_and_format(&$event, $field) {
    if ($event && $event[$field] && $event[$field] instanceof DateTime) {
      $event[$field] = $event[$field]->format('Y-m-d H:i');
    }

    return $this;
  }

  /**
   * Hook Roundcube pour ajouter un lien de prise de rendez-vous dans la signature.
   *
   * Ce hook ajoute une case à cocher permettant d'insérer un lien de calendrier dans la signature de l'utilisateur.
   *
   * @param array $args Tableau des arguments transmis par Roundcube, incluant les liens personnalisés.
   * @return array Tableau modifié avec les nouveaux liens personnalisés.
   */
  public function hook_signature_links($args) {
    $this->add_texts('localization/');
    $checkbox = new html_checkbox();
    $custom_links = $args['custom_links'] ?? '';
    /**
     * @var calendar
     */
    $calendar =$this->api->get_plugin('calendar');
    $hasUrl = $calendar->get_appointment_url(driver_mel::gi()->getUser()->getDefaultCalendar()->id);

    if ($hasUrl) {
      $text = $this->gettext('calendlink', 'bnum_agenda');
      $custom_links.=  html::tag('li', [], $checkbox->show('', ['value' => $hasUrl, 'id' => 'checkbox-calendly-link', 'onchange' => 'onInputChange();']) . html::label(['for' => "checkbox-calendly-link"], $text));

      $args['env_links'][$hasUrl] = $this->gettext('calendlink-label', 'bnum_agenda');
      $args['custom_links'] = $custom_links;
    }

    return $args;
  }

  /**
   * Hook Roundcube pour mettre à jour la couleur d'un dossier.
   *
   * Ce hook permet de sauvegarder la couleur associée à un dossier lors de sa modification.
   *
   * @param array $args Tableau des arguments transmis par Roundcube lors de la mise à jour d'un dossier.
   * @return array Tableau des arguments, inchangé.
   */
  public function hook_folder_update($args) {
    $this->load_config();
    $color = $this->get_input_post('_color') ?? null;

    if ($color === '') $color = null;
      $folder = $this->get_input_post('_mbox');
      $prefs = $this->get_config('folders_colors', []);

      if (isset($color)) $prefs[$folder] = $color;
      else unset($prefs[$folder]);

      $this->rc()->user->save_prefs(['folders_colors' => $prefs]);
        
    return $args;
  }


  /**
   * Hook Roundcube pour afficher l'option nombre d'évenements affichés dans l'agenda.
   *
   * @param array $args Tableau des arguments transmis par Roundcube lors de la mise à jour d'un dossier.
   * @return array Tableau des arguments, inchangé.
   */
  public function hook_preferences_list($args) {
    if ($args['section'] === 'calendar') {
      $this->add_texts('localization/');
      
      $field_id = 'event_limit';
      $select = new html_select(['name' => '_event_limit', 'id' => $field_id]);
      for ($i=2; $i <= 6; $i++) { 
        $select->add("$i", $i);
      }

      $args['blocks']['view']['options']['event_limit'] = [
        'title'   => html::label($field_id, rcube::Q($this->gettext('event_limit'))),
        'content' => $select->show(intval($this->rc()->config->get('event_limit', 4))),
      ];
    }
    return $args;
  }

  /**
   * Hook Roundcube pour mettre à jour le nombre d'évenements affichés dans l'agenda.
   *
   * Ce hook permet de sauvegarder le nombre d'évenements affichés dans l'agenda lors de sa modification.
   *
   * @param array $args Tableau des arguments transmis par Roundcube lors de la mise à jour d'un dossier.
   * @return array Tableau des arguments, inchangé.
   */
  public function hook_preferences_save($args) {
    if ($args['section'] === 'calendar') {
      $args['prefs']['event_limit'] = rcube_utils::get_input_value('_event_limit', rcube_utils::INPUT_POST);
      $this->rc()->output->set_env('event_limit', $args['prefs']['event_limit']);
    }
    return $args;
  }
}
