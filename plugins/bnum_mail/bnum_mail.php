<?php
class bnum_mail extends bnum_plugin {
  public $task = 'mail|settings';

  /**
   * Préférence utilisateur des options de recherche mémorisées, par dossier :
   * [dossier => ['mods' => [champ => 1], 'scope' => string, 'filter' => string, 'interval' => string]].
   */
  public const PREF_SEARCH_MEMORY = 'bnum_search_memory';

  /**
   * Champs de recherche acceptés (valeurs des cases `s_mods[]`).
   */
  public const SEARCH_MODS_FIELDS = ['subject', 'from', 'to', 'cc', 'bcc', 'body', 'text', 'replyto', 'followupto'];

  /**
   * Portées de recherche acceptées (select `s_scope`).
   */
  public const SEARCH_SCOPES = ['base', 'sub', 'all'];

  /**
   * Périodes acceptées (select `s_interval`, cf. rcmail_action_mail_index::search_interval()).
   */
  public const SEARCH_INTERVALS = ['', '1W', '1M', '1Y', '-1W', '-1M', '-1Y'];

  /**
   * Longueur maximale du filtre de type (critère IMAP du select `searchfilter`).
   */
  public const SEARCH_FILTER_MAX_LENGTH = 255;

  /**
   * Nombre maximum de dossiers mémorisés par utilisateur.
   */
  public const SEARCH_MEMORY_MAX_FOLDERS = 100;

  /**
   * Désactive la fusion des options mémorisées dans `search_mods` (lecture des valeurs par défaut).
   *
   * @var bool
   */
  private $search_memory_bypass = false;

  function init() {
    // PAMELA - 0008128 - Plusieurs signatures
    // Charger le JS uniquement pour la tâche "mail"
    if ($this->rc()->task === 'mail') {
      $this->include_script('js/lib/main.js');
    }

    if ($this->is_index_action()) {
        $this->load_config();

        $config = $this->get_config('search_scope');

        if (isset($config) && !$this->rc()->output->get_env('search_scope')) $this->rc()->output->set_env('search_scope', $config);

        if ($this->rc()->task === 'mail') {
          $this->add_texts('localization/', true);
          // Les champs passent par search_mods (hook config_get) ; ici seulement les selects
          $this->set_env('bnum_search_memory', array_map(function ($memory) {
            return array_diff_key($memory, ['mods' => true]);
          }, $this->get_search_memory()));
          // Valeurs par défaut pour le bouton « Réinitialiser les filtres »
          $this->set_env('bnum_search_defaults', [
            'mods'  => $this->get_default_search_mods(),
            'scope' => in_array($config, self::SEARCH_SCOPES, true) ? $config : 'base',
          ]);
        }
    }
    else if ($this->get_current_action() === 'show' && $this->get_input('_extwin') == '1') {
      $this->include_script_from_plugin('mel_metapage', 'js/functions.js');
    }
    else if ($this->rc()->task === 'mail' && $this->get_current_action() === 'search') {
      $this->remember_search_options();
    }

    if ($this->rc()->task === 'mail') {
      // Bouton « Réinitialiser les filtres » : met à jour la mémorisation sans lancer de recherche
      $this->register_action('plugin.bnum_mail.reset_search', [$this, 'action_reset_search']);
      $this->protect_actions(['plugin.bnum_mail.reset_search']);
    }

    $this->add_hook('messages_list', [$this, 'hook_message_list']);
    $this->add_hook('config_get', [$this, 'hook_config_get']);
    $this->add_hook('preferences_update', [$this, 'hook_preferences_update']);
  }

  public function hook_message_list($args) {
    if ($args['cols'] && is_array($args['cols'])) {
      $this->load_config();
      // Gestion des colonnes additionnels
      $args['cols'] = array_merge($args['cols'], $this->get_config('additional_columns', ['priority']));
    }

    return $args;
  }

  /**
   * Fusionne les champs de recherche mémorisés par l'utilisateur par-dessus `search_mods`
   * de la configuration (verrouillé par `dont_override`).
   */
  public function hook_config_get($args) {
    if (($args['name'] ?? null) !== 'search_mods' || $this->search_memory_bypass) return $args;

    $mods = [];

    foreach ($this->get_search_memory() as $mbox => $memory) {
      if (!empty($memory['mods']) && is_array($memory['mods'])) $mods[$mbox] = $memory['mods'];
    }

    if (!empty($mods)) {
      $args['result'] = array_merge(is_array($args['result']) ? $args['result'] : [], $mods);
    }

    return $args;
  }

  /**
   * Le core enregistre `search_mods` à chaque recherche alors qu'il est dans `dont_override` :
   * on retire la clé pour éviter des écritures inutiles en base.
   */
  public function hook_preferences_update($args) {
    if (isset($args['prefs']['search_mods'])
        && in_array('search_mods', (array) $this->rc()->config->get('dont_override'), true)) {
      unset($args['prefs']['search_mods']);

      if (empty($args['prefs'])) $args['abort'] = true;
    }

    return $args;
  }

  /**
   * Retourne les champs de recherche par défaut (configuration, ou défaut du core), sans la mémorisation.
   *
   * @return array [dossier => [champ => 1]]
   */
  private function get_default_search_mods() {
    $this->search_memory_bypass = true;

    try {
      return rcmail_action_mail_index::search_mods();
    }
    finally {
      $this->search_memory_bypass = false;
    }
  }

  /**
   * Retourne les options de recherche mémorisées, en ignorant toute valeur mal formée.
   *
   * @return array [dossier => ['mods' => [...], 'scope' => ..., 'filter' => ..., 'interval' => ...]]
   */
  private function get_search_memory() {
    $memory = $this->rc()->config->get(self::PREF_SEARCH_MEMORY);

    return is_array($memory) ? array_filter($memory, 'is_array') : [];
  }

  /**
   * Enregistre ou supprime les options de recherche du dossier courant au lancement d'une recherche,
   * selon l'état de la case « Mémoriser » envoyé par le client (`_bnum_remember`).
   */
  private function remember_search_options() {
    $remember = $this->get_input('_bnum_remember', rcube_utils::INPUT_GET);

    if ($remember !== '1' && $remember !== '0') return;

    // L'action search est un GET : le core ne vérifie pas le jeton CSRF, on exige l'en-tête ajax.
    if (rcube_utils::request_header('X-Roundcube-Request') !== $this->rc()->get_request_token()) return;

    $mbox = (string) rcube_utils::get_input_string('_mbox', rcube_utils::INPUT_GET, true);

    $this->store_search_memory($mbox, $remember === '1' ? $this->search_options_from_request() : null);
  }

  /**
   * Action ajax (POST, CSRF vérifié par protect_actions) du bouton « Réinitialiser les filtres » :
   * mémorise les valeurs par défaut du dossier si la case « Mémoriser » est cochée, sinon
   * supprime sa mémorisation. Aucune recherche n'est lancée.
   */
  public function action_reset_search() {
    $mbox     = (string) rcube_utils::get_input_string('_mbox', rcube_utils::INPUT_POST, true);
    $remember = $this->get_input('_bnum_remember', rcube_utils::INPUT_POST) === '1';

    $this->store_search_memory($mbox, $remember ? $this->default_search_options($mbox) : null);

    $this->rc()->output->send();
  }

  /**
   * Options de recherche par défaut d'un dossier (configuration, sans la mémorisation).
   *
   * @param string $mbox Dossier
   *
   * @return array ['mods' => [champ => 1], 'scope' => string, 'filter' => string, 'interval' => string]
   */
  private function default_search_options($mbox) {
    $mods  = $this->get_default_search_mods();
    $scope = $this->get_config('search_scope');

    return [
      'mods'     => $mods[$mbox] ?? $mods['*'] ?? [],
      'scope'    => in_array($scope, self::SEARCH_SCOPES, true) ? $scope : 'base',
      'filter'   => 'ALL',
      'interval' => '',
    ];
  }

  /**
   * Enregistre (`$options`) ou supprime (`null`) la mémorisation d'un dossier.
   *
   * @param string     $mbox    Dossier
   * @param array|null $options Options à mémoriser, null pour supprimer
   */
  private function store_search_memory($mbox, $options) {
    if ($mbox === '') return;

    $memory = $this->get_search_memory();

    if ($options !== null) {
      if (($memory[$mbox] ?? null) == $options) return;

      if (!isset($memory[$mbox]) && count($memory) >= self::SEARCH_MEMORY_MAX_FOLDERS) return;

      if (!$this->rc()->get_storage()->folder_exists($mbox)) return;

      $memory[$mbox] = $options;
    }
    else {
      if (!isset($memory[$mbox])) return;

      unset($memory[$mbox]);
    }

    // null supprime la préférence quand plus aucun dossier n'est mémorisé
    $this->rc()->user->save_prefs([self::PREF_SEARCH_MEMORY => empty($memory) ? null : $memory]);
  }

  /**
   * Construit les options à mémoriser à partir de la requête de recherche, valeurs filtrées.
   *
   * @return array ['mods' => [champ => 1], 'scope' => string, 'filter' => string, 'interval' => string]
   */
  private function search_options_from_request() {
    $mods = array_intersect(explode(',', (string) $this->get_input('_bnum_mods', rcube_utils::INPUT_GET)), self::SEARCH_MODS_FIELDS);
    $mods = in_array('text', $mods, true) ? ['text' => 1] : array_fill_keys(array_values($mods), 1);

    $scope    = (string) $this->get_input('_scope', rcube_utils::INPUT_GET);
    $interval = (string) $this->get_input('_interval', rcube_utils::INPUT_GET);
    // Critère IMAP passé tel quel par le core : on retire les retours à la ligne comme lui (search.php)
    $filter   = trim(preg_replace('/[\r\n]+/', ' ', (string) $this->get_input('_filter', rcube_utils::INPUT_GET)));

    return [
      'mods'     => $mods,
      'scope'    => in_array($scope, self::SEARCH_SCOPES, true) ? $scope : 'base',
      'filter'   => $filter !== '' && strlen($filter) <= self::SEARCH_FILTER_MAX_LENGTH ? $filter : 'ALL',
      'interval' => in_array($interval, self::SEARCH_INTERVALS, true) ? $interval : '',
    ];
  }
}
