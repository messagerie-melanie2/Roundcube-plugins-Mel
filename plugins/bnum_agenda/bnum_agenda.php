<?php 
/**
 * Classe du plugin bnum_agenda pour la gestion de l'agenda.
 */
class bnum_agenda extends bnum_plugin {
  /**
   * Tâches supportées par ce plugin.
   * @var string
   */
  public $task = 'agenda|calendar';

  /**
   * Initialise le plugin et enregistre les actions nécessaires.
   *
   * @return void
   */
  function init() {
    $this->register_action('get_categories', [$this, 'action_get_categories']);
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
}
