<?php 
/**
 * Classe du plugin bnum_agenda pour la gestion de l'agenda.
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
    switch ($this->get_current_task()) {
      case 'agenda':
      case 'calendar':
        $this->register_action('get_categories', [$this, 'action_get_categories']);
        break;
      
      default:
        $this->add_hook('signature.links', [$this, 'hook_signature_links']);
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
  public function action_get_categories() : never {
    $this->sendEncodedExit(json_encode($this->get_categories()));
  }

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
      $text = $this->rc()->gettext('calendlink', 'bnum_agenda');
      $custom_links.=  html::tag('li', [], $checkbox->show('', ['value' => $hasUrl, 'id' => 'checkbox-calendly-link', 'onchange' => 'onInputChange();']) . html::label(['for' => "checkbox-calendly-link"], $text));

      $args['env_links'][$hasUrl] = $this->rc()->gettext('calendlink-label', 'bnum_agenda');
      $args['custom_links'] = $custom_links;
    }

    return $args;
  }
}
