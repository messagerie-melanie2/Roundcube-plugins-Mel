<?php
/**
 * Mél driver for the Tasklist plugin
 *
 * @version @package_version@
 */
@include_once 'includes/libm2.php';

/**
 * Classe Mél Driver
 * Permet de gérer les taches Mél depuis Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> PNE Annuaire et Messagerie/MEDDE
 */
class tasklist_mel_driver extends tasklist_driver {
  const DB_DATE_FORMAT = 'Y-m-d H:i:s';
  const SHORT_DB_DATE_FORMAT = 'Y-m-d';

  // features supported by the backend
  public $alarms = true;
  public $attachments = false;
  public $undelete = false; // task undelete action
  public $alarm_types = array(
      'DISPLAY'
  );
  public $sortable = false;
  private $rc;
  private $plugin;
  /**
   * Tableau de listes de taches Mél
   *
   * @var LibMelanie\Api\Defaut\Taskslist[]
   */
  private $lists;
  private $folders = array();
  private $tasks = array();

  // Mél
  /**
   * Utilisateur Mél
   *
   * @var LibMelanie\Api\Defaut\User
   */
  private $user;

  /**
   * Default constructor
   */
  public function __construct($plugin) {
    $this->rc = $plugin->rc;
    $this->plugin = $plugin;
    // User Mél
    $this->user = driver_mel::gi()->getUser();

    // Ne pas charger les tâches dans certaines tâches/actions
    $nolisttasks = [
      'mail/preview',
      'mail/show',
    ];

    if (!in_array($this->rc->task."/".$this->rc->action, $nolisttasks)) {
      $this->_read_lists();
    }
  }

  /**
   * Génération d'un code couleur aléatoire
   * Utilisé pour générer une premiere couleur pour les agendas si aucune n'est positionnée
   *
   * @return string Code couleur
   * @private
   */
  private function _random_color() {
    mt_srand((double)microtime() * 1000000);
    $c = '';
    while ( strlen($c) < 6 ) {
      $c .= sprintf("%02X", mt_rand(0, 255));
    }
    return $c;
  }

  /**
   * Read available calendars for the current user and store them internally
   */
  private function _read_lists($force = false) {
    // already read sources
    if (isset($this->lists) && !$force)
      return $this->lists;

    if (isset($this->user)) {
      $this->lists = $this->user->getSharedTaskslists();
    }

    return $this->lists;
  }

  /**
   * Get a list of available task lists from this source
   *
   * @param
   *          integer Bitmask defining filter criterias.
   *          See FILTER_* constants for possible values.
   */
  public function get_lists($filter = 0) {
    if ($this->rc->task != 'tasks') {
      return;
    }
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::get_lists()");
    // Lecture des listes
    $this->_read_lists();

    // Récupération des préférences de l'utilisateur
    $hidden_tasks = $this->rc->config->get('hidden_tasks', []);
    $sort_tasks = $this->rc->config->get('sort_tasks', []);
    $active_tasklists = $this->rc->config->get('active_tasklists', null);
    $alarm_tasklists = $this->rc->config->get('alarm_tasklists', null);
    $save_prefs = false;

    // attempt to create a default list for this user
    if (empty($this->lists)) {
      $prop = array(
        'name' => $this->rc->config->get('default_taskslist_name', null),
        'color' => $this->_random_color()
      );
      $this->create_list($prop, true);
      $this->_read_lists(true);
    }
    $default_tasklist = $this->user->getDefaultTaskslist();
    $tasklists = [];
    foreach ($this->lists as $id => $list) {
      if (isset($hidden_tasks[$list->id]))
        continue;

      $rcId = driver_mel::gi()->mceToRcId($list->id);
      // Gestion du order
      $order = array_search($rcId, $sort_tasks);
      if ($order === false) {
        if ($list->id == $this->user->uid)
          $order = 1000;
        else if ($list->owner == $this->user->uid)
          $order = 2000;
        else
          $order = 3000;
      }
      // Gestion des calendriers actifs
      if (is_array($active_tasklists)) {
        $active = isset($active_tasklists[$list->id]);
      } else if ($list->id == $this->user->uid) {
        $save_prefs = true;
        $active = true;
        $active_tasklists = [ $list->id => 1 ];
      }
      // Gestion des alarmes dans les calendriers
      if (is_array($alarm_tasklists)) {
        $alarm = isset($alarm_tasklists[$list->id]);
      } else if ($list->id == $this->user->uid) {
        $save_prefs = true;
        $alarm = true;
        $alarm_tasklists = [ $list->id => 1];
      }
      // Gestion des droits de la liste de taches
      if ($list->id == $this->user->uid) {
        $rights = 'lrswiktev';
      }
      else if ($list->owner == $this->user->uid) {
        $rights = 'lrswikxteav';
      }
      else if ($list->asRight(LibMelanie\Config\ConfigMelanie::WRITE)) {
        $rights = 'lrsw';
      }
      else if ($list->asRight(LibMelanie\Config\ConfigMelanie::READ)) {
        $rights = 'lrs';
      }
      else {
        $rights = 'l';
      }

      $tasklists[$rcId] = [
          'id' => $rcId,
          'order' => $order,
          'name' => $list->name,
          'listname' => $list->id == $this->user->uid ? $this->rc->gettext('personaltasks', 'mel_elastic') : ($list->owner == $this->user->uid ? $list->name : "[" . $list->owner . "] " . $list->name),
          'editname' => $list->name,
          'showalarms' => $alarm,
          'owner' => $list->owner,
          'editable' => $list->asRight(LibMelanie\Config\ConfigMelanie::WRITE),
          'removable' => $list->owner == $this->user->uid && $list->id != $this->user->uid,
          'norename' => $list->owner != $this->user->uid || $list->id == $this->user->uid,
          'active' => $active,
          'parentfolder' => null,
          'rights' => $rights,
          'default' => $default_tasklist->id == $list->id,
          'children' => false, // TODO: determine if that folder indeed has child folders
          'class_name' => trim(($list->owner == $this->user->uid ? 'personnal' : 'other') . ' ' . ($default_tasklist->id == $list->id ? 'default' : ''))
      ];
    }
    // Tri des taskslist
    uasort($tasklists, function ($a, $b) {
      if ($a['order'] === $b['order'])
        return strcmp(strtolower($a['listname']), strtolower($b['listname']));
      else
        return strnatcmp($a['order'], $b['order']);
    });

    if ($save_prefs) {
      $this->rc->user->save_prefs(array(
        'active_tasklists' => $active_tasklists,
        'alarm_tasklists' => $alarm_tasklists
    ));
    }
    
    return $tasklists;
  }

  /**
   * Create a new list assigned to the current user
   *
   * @param array Hash array with list properties
   *    name: List name
   *    color: The color of the list
   *    showalarms: True if alarms are enabled
   * @param boolean $defaultTaskslist Creation de la tasklist par defaut ?
   * @return mixed ID of the new list on success, False on error
   */
  public function create_list(&$prop, $defaultTaskslist = false) {
    if ($this->rc->task != 'tasks') {
      return;
    }
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::create_list()");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::create_list() : " . var_export($prop, true));

    if ($defaultTaskslist) {
      $saved = $this->user->createDefaultTaskslist($prop['name']);
    } 
    else {
      $tasklist = driver_mel::gi()->taskslist([$this->user]);
      $tasklist->name = $prop['name'];
      $tasklist->id = isset($prop['id']) ? $prop['id'] : md5($prop['name'] . time() . $this->user->uid);
      $tasklist->owner = $this->user->uid;
      $ret = $tasklist->save();
      $saved = !is_null($ret);
    }
    if ($saved) {
      // Récupération des préférences de l'utilisateur
      $active_tasklists = $this->rc->config->get('active_tasklists', array());
      $alarm_tasklists = $this->rc->config->get('alarm_tasklists', array());
      // Display cal
      $active_tasklists[$tasklist->id] = 1;
      // Showalarm ?
      if ($prop['showalarms'] == 1) {
        $alarm_tasklists[$tasklist->id] = 1;
      }
      $this->rc->user->save_prefs(array(
          'active_tasklists' => $active_tasklists,
          'alarm_tasklists' => $alarm_tasklists
      ));
      // Return the tasklist id
      return $tasklist->id;
    } else {
      return false;
    }
  }

  /**
   * Update properties of an existing tasklist
   *
   * @param
   *          array Hash array with list properties
   *          id: List Identifier
   *          name: List name
   *          color: The color of the list
   *          showalarms: True if alarms are enabled (if supported)
   * @return boolean True on success, Fales on failure
   */
  public function edit_list(&$prop) {
    if ($this->rc->task != 'tasks') {
      return;
    }
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::edit_list()");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::edit_list() : " . var_export($prop, true));
    if (isset($prop['id']) && isset($this->lists[driver_mel::gi()->rcToMceId($prop['id'])])) {
      $id = driver_mel::gi()->rcToMceId($prop['id']);
      $list = $this->lists[$id];
      if (isset($prop['name']) && $list->owner == $this->user->uid && $prop['name'] != "") {
        $list->name = $prop['name'];
        $list->save();
      }
      // Récupération des préférences de l'utilisateur
      $alarm_tasklists = $this->rc->config->get('alarm_tasklists', array());
      $param_change = false;
      if (!isset($alarm_tasklists[$list->id]) && $prop['showalarms'] == 1) {
        $alarm_tasklists[$list->id] = 1;
        $param_change = true;
      } elseif (isset($alarm_tasklists[$list->id]) && $prop['showalarms'] == 0) {
        unset($alarm_tasklists[$list->id]);
        $param_change = true;
      }
      if ($param_change) {
        $this->rc->user->save_prefs(array(
            'alarm_tasklists' => $alarm_tasklists
        ));
      }
      return true;
    }
    return false;
  }

  /**
   * Set active/subscribed state of a list
   *
   * @param
   *          array Hash array with list properties
   *          id: List Identifier
   *          active: True if list is active, false if not
   * @return boolean True on success, Fales on failure
   */
  public function subscribe_list($prop) {
    if ($this->rc->task != 'tasks') {
      return;
    }
    $prop['id'] = driver_mel::gi()->rcToMceId($prop['id']);
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::subscribe_list(" . $prop['id'] . ")");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::subscribe_list() : " . var_export($prop, true));
    // Récupération des préférences de l'utilisateur
    $active_tasklists = $this->rc->config->get('active_tasklists', array());
    

    if (!$prop['active'])
      unset($active_tasklists[$prop['id']]);
    else
      $active_tasklists[$prop['id']] = 1;

    return $this->rc->user->save_prefs(array(
        'active_tasklists' => $active_tasklists
    ));
  }

  /**
   * Delete the given list with all its contents
   *
   * @param
   *          array Hash array with list properties
   *          id: list Identifier
   * @return boolean True on success, Fales on failure
   */
  public function delete_list($prop) {
    if ($this->rc->task != 'tasks') {
      return;
    }
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::remove_list(" . $prop['id'] . ")");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::remove_list() : " . var_export($prop, true));
    if (isset($prop['id']) && isset($this->lists[$prop['id']]) && $this->lists[$prop['id']]->owner == $this->user->uid && $this->lists[$prop['id']]->id != $this->user->uid) {
      // Récupération des préférences de l'utilisateur
      $hidden_tasks = $this->rc->config->get('hidden_tasks', array());
      $active_tasklists = $this->rc->config->get('active_tasklists', array());
      $alarm_tasklists = $this->rc->config->get('alarm_tasklists', array());
      unset($hidden_tasks[$prop['id']]);
      unset($active_tasklists[$prop['id']]);
      unset($alarm_tasklists[$prop['id']]);
      $this->rc->user->save_prefs(array(
          'active_tasklists' => $active_tasklists,
          'alarm_tasklists' => $alarm_tasklists,
          'hidden_tasks' => $hidden_tasks
      ));
      return $this->lists[$prop['id']]->delete();
    }
    return false;
  }

  /**
   * Search for shared or otherwise not listed tasklists the user has access
   *
   * @param
   *          string Search string
   * @param
   *          string Section/source to search
   * @return array List of tasklists
   */
  public function search_lists($query, $source) {
    return [];
  }

  /**
   * Get all task records matching the given filter
   *
   * @param
   *          array Hash array with filter criterias:
   *          - mask: Bitmask representing the filter selection (check against tasklist::FILTER_MASK_* constants)
   *          - from: Date range start as string (Y-m-d)
   *          - to: Date range end as string (Y-m-d)
   *          - search: Search query string
   * @param
   *          array List of lists to get tasks from
   * @return array List of tasks records matchin the criteria
   */
  public function count_tasks($lists = null) {
    if ($this->rc->task != 'tasks') {
      return;
    }
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::count_tasks()");
    if (empty($lists))
      $lists = array_keys($this->lists);
    else if (is_string($lists))
      $lists = explode(',',driver_mel::gi()->rcToMceId($lists));

    $today_date = new DateTime('now', $this->plugin->timezone);
    $today = $today_date->format('Y-m-d');
    $tomorrow_date = new DateTime('now + 1 day', $this->plugin->timezone);
    $tomorrow = $tomorrow_date->format('Y-m-d');

    $counts = array(
        'all' => 0,
        'flagged' => 0,
        'today' => 0,
        'tomorrow' => 0,
        'overdue' => 0,
        'nodate' => 0
    );
    foreach ($lists as $list_id) {
      $list_id = driver_mel::gi()->rcToMceId($list_id);
      foreach ($this->lists[$list_id]->getAllTasks() as $task) {
        $this->tasks[$task->id] = $task;
        $rec = $this->_to_rcube_task($task);

        if ($rec['complete'] >= 1.0) // don't count complete tasks
          continue;

        $counts['all']++;
        if ($rec['flagged'])
          $counts['flagged']++;
        if (empty($rec['date']))
          $counts['nodate']++;
        else if ($rec['date'] == $today)
          $counts['today']++;
        else if ($rec['date'] == $tomorrow)
          $counts['tomorrow']++;
        else if ($rec['date'] < $today)
          $counts['overdue']++;
      }
    }
    return $counts;
  }

  /**
   * Get a list of tags to assign tasks to
   *
   * @return array List of tags
   */
  public function get_tags() {
    return [];
  }

  /**
   * Get all taks records matching the given filter
   *
   * @param
   *          array Hash array with filter criterias:
   *          - mask: Bitmask representing the filter selection (check against tasklist::FILTER_MASK_* constants)
   *          - from: Date range start as string (Y-m-d)
   *          - to: Date range end as string (Y-m-d)
   *          - search: Search query string
   * @param
   *          array List of lists to get tasks from
   * @return array List of tasks records matchin the criteria
   */
  public function list_tasks($query, $lists = null) {
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::list_tasks()");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::list_tasks() : " . var_export($query, true));

    if (empty($lists))
      $lists = array_keys($this->lists);
    else if (is_string($lists))
      $lists = explode(',', driver_mel::gi()->rcToMceId($lists));
    
    if (empty($lists)) {
      return [];
    }

    $results = array();
    // Création de la requête
    $filter = "#taskslist#";
    $operators = array();
    $case_unsensitive_fields = array();
    $task = driver_mel::gi()->task([$this->user]);
    // Listes des tâches
    $task->taskslist = $lists;
    $operators['taskslist'] = LibMelanie\Config\MappingMce::eq;
    if (isset($query['mask'])) {
      // Completed ?
      if ($query['mask'] & tasklist::FILTER_MASK_COMPLETE) {
        $task->completed = 1;
        $filter .= " AND #completed#";
        $operators['completed'] = LibMelanie\Config\MappingMce::eq;
      }
      else if ($query['mask'] & tasklist::FILTER_MASK_UNCOMPLETE) {
        $task->completed = 0;
        $filter .= " AND #completed#";
        $operators['completed'] = LibMelanie\Config\MappingMce::eq;
      }
      // Priority ?
      if ($query['mask'] & tasklist::FILTER_MASK_FLAGGED) {
        $task->priority = LibMelanie\Api\Defaut\Task::PRIORITY_VERY_HIGH;
        $filter .= " AND #priority#";
        $operators['priority'] = LibMelanie\Config\MappingMce::eq;
      }
    } else {
      $task->completed = 1;
      $filter .= " AND #completed#";
      $operators['completed'] = LibMelanie\Config\MappingMce::inf;
    }
    // Start & end date
    if (isset($query['from']) && isset($query['to'])) {
      $task->due = [
          $query['from'],
          $query['to']
      ];
      $filter .= " AND #due#";
      $operators['due'] = LibMelanie\Config\MappingMce::between;
    }
    else {
      // Start date
      if (isset($query['from'])) {
        $task->due = $query['from'];
        $filter .= " AND #due#";
        $operators['due'] = LibMelanie\Config\MappingMce::supeq;
      }
      // End date
      if (isset($query['to'])) {
        $task->due = $query['to'];
        $filter .= " AND #due#";
        $operators['due'] = LibMelanie\Config\MappingMce::infeq;
      }
    }
    
    // Search string
    if (isset($query['search']) && !empty($query['search'])) {
      $task->name = '%' . $query['search'] . '%';
      $task->description = '%' . $query['search'] . '%';
      $filter .= " AND (#name# OR #description#)";
      $operators['name'] = LibMelanie\Config\MappingMce::like;
      $operators['description'] = LibMelanie\Config\MappingMce::like;
      $case_unsensitive_fields[] = 'name';
      $case_unsensitive_fields[] = 'description';
    }
    // Since
    if (isset($query['since']) && $query['since']) {
      $task->modified = $query['since'];
      $filter .= " AND #modified#";
      $operators['modified'] = LibMelanie\Config\MappingMce::supeq;
    }
    // Alarm
    if (isset($query['alarm']) && $query['alarm']) {
      $task->alarm = 1;
      $filter .= " AND #alarm#";
      $operators['alarm'] = LibMelanie\Config\MappingMce::supeq;
    }
    // Récupère la liste et génére le tableau
    foreach ($task->getList(null, $filter, $operators, 'name', true, null, null, $case_unsensitive_fields) as $object) {
      if ($this->lists[$object->taskslist]->asRight(LibMelanie\Config\ConfigMelanie::READ)) {
        // TODO: post-filter tasks returned from storage
        $results[] = $this->_to_rcube_task($object);
      }
    }

    return $results;
  }

  /**
   * Return data of a specific task
   *
   * @param
   *          mixed Hash array with task properties or task UID
   * @param
   *          integer Bitmask defining filter criterias for folders.
   *          See FILTER_* constants for possible values.
   * @return array Hash array with task properties or false if not found
   */
  public function get_task($prop, $filter = 0) {
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::get_task(" . $prop['id'] . ")");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::get_task() : " . var_export($prop, true));

    $task = driver_mel::gi()->task([$this->user]);
    // ID / UID
    if (isset($prop['id'])) {
      $task->id = $prop['id'];
    }
    elseif (isset($prop['uid'])) {
      $task->uid = $prop['uid'];
    }
    else {
      return false;
    }
      
    // Tasklist
    if (isset($prop['_fromlist'])) {
      $task->taskslist = driver_mel::gi()->rcToMceId($prop['_fromlist']);
    }
    elseif (isset($prop['list'])) {
      $task->taskslist = driver_mel::gi()->rcToMceId($prop['list']);
    }
    else {
      $this->_read_lists();
      $task->taskslist = array_keys($this->lists);
    }
      
    // find task in the available folders
    foreach ($task->getList() as $object) {
      return $this->_to_rcube_task($object);
    }
    return false;
  }

  /**
   * Get all decendents of the given task record
   *
   * @param
   *          mixed Hash array with task properties or task UID
   * @param
   *          boolean True if all childrens children should be fetched
   * @return array List of all child task IDs
   */
  public function get_childs($prop, $recursive = false) {
    if ($this->rc->task != 'tasks') {
      return;
    }
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::get_childs()");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::get_childs() : " . var_export($prop, true));

    if (is_string($prop)) {
      $task = $this->get_task($prop);
      $prop = array(
          'id' => $task['id'],
          'list' => $task['list']
      );
    }

    $childs = array();
    $list_id = driver_mel::gi()->rcToMceId($prop['list']);
    $task_ids = array(
        $prop['id']
    );

    $task = driver_mel::gi()->task([$this->user]);
    $task->taskslist = $list_id;
    $task->parent = $task_ids;

    // query for childs (recursively)
    foreach ($task->getList() as $object) {
      $childs[] = $object->id;
      if ($recursive) {
        $childs = array_merge($childs, $this->get_childs(array(
            'id' => $object->id,
            'list' => $list_id
        ), true));
      }
    }

    return $childs;
  }

  /**
   * Get a list of pending alarms to be displayed to the user
   *
   * @param
   *          integer Current time (unix timestamp)
   * @param
   *          mixed List of list IDs to show alarms for (either as array or comma-separated string)
   * @return array A list of alarms, each encoded as hash array with task properties
   * @see tasklist_driver::pending_alarms()
   */
  public function pending_alarms($time, $lists = null) {
    // Récupération des rappels en cache
    $tasks = \mel::getCache('tasks_alarm');
    if (!isset($tasks)) {
      $interval = $this->rc->config->get('refresh_interval', 60);
      if ($interval === 0) {
        $interval = 60;
      }
      $time -= $time % 60;
      
      $slot = $time;
      $slot -= $slot % $interval;
      
      $last = $time - max(60, $interval);
      $last -= $last % $interval;
      
      // only check for alerts once in 5 minutes
      if ($last == $slot) {
        return [];
      }
      
      if (!isset($lists)) {
        $alarmlists = $this->rc->config->get('alarm_tasklists', null);
        if (isset($alarmlists)) {
          $lists = [];
          foreach ($alarmlists as $key => $list) { 
            if (!empty($key) && $list) { 
              $lists[] = $key; 
            } 
          }
        }
      }
        
      $time = $slot + $interval;
      
      $oneday = 24 * 60 * 60;
      $query = [
          'from' => $time - $oneday,
          'to' => $time + $interval,
          'mask' => tasklist::FILTER_MASK_UNCOMPLETE,
          'alarm' => 1,
      ];
      if (!empty($lists)) {
        $_tasks = $this->list_tasks($query, $lists);
      }
      $tasks = [];
      
      if (is_array($_tasks)) {
        foreach($_tasks as $key => $_task) {
          if (isset($_task['alarmtime']) && $_task['alarmtime'] < $time) {
            $tasks[] = $_task;
          }
        }
      }
    }
    return $tasks;
  }

  /**
   * (User) feedback after showing an alarm notification
   * This should mark the alarm as 'shown' or snooze it for the given amount of time
   *
   * @param
   *          string Task identifier
   * @param
   *          integer Suspend the alarm for this number of seconds
   */
  public function dismiss_alarm($id, $snooze = 0) {
    $task = $this->get_task(['id' => $id]);
    if (isset($task)) {
      // Remove cache
      \mel::unsetCache('tasks_alarm');
      if ($snooze > 0) {
        $task['snoozetime'] = time() + ($snooze * 60);
      }
      else {
        $task['complete'] = 1;
        $task['status'] = LibMelanie\Api\Defaut\Task::STATUS_COMPLETED;
      }
      return $this->edit_task($task);
    }
    return false;
  }

  /**
   * Remove alarm dismissal or snooze state
   *
   * @param
   *          string Task identifier
   */
  public function clear_alarms($id) {
    return false;
  }

  /**
   * Convert from Melanie2 format to internal representation
   *
   * @param LibMelanie\Api\Defaut\Task $record
   */
  private function _to_rcube_task($record) {
    $task = array(
        'id' => $record->id,
        'uid' => $record->uid,
        'title' => $record->name,
        'description' => $record->description,
        'flagged' => $record->priority == LibMelanie\Api\Defaut\Task::PRIORITY_VERY_HIGH,
        'parent_id' => $record->parent,
        'list' => driver_mel::gi()->mceToRcId($record->taskslist),
        '_hasdate' => 0
    );

    if ($record->completed === 1)
    {
      $task['complete'] = 1;
    }
    else {
      // Gestion du pourcentage de complete
      if (isset($record->complete)) {
        $task['complete'] = $record->complete;
      }
      else if (isset($record->percent_complete)) {
        $task['complete'] = $record->percent_complete / 100;
      }
    }


    if (isset($record->status)) {
      $task['status'] = $record->status;
    }
    // convert from DateTime to internal date format
    if (isset($record->due) && $record->due !== 0) {
      $due = new DateTime(date(self::DB_DATE_FORMAT, $record->due), $this->plugin->timezone);
      $task['date'] = $due->format('Y-m-d');
      if (!$due->_dateonly)
        $task['time'] = $due->format('H:i');
      else
        $task['time'] = '';
      $task['_hasdate'] = 1;
    } else {
      $task['date'] = '';
      $task['time'] = '';
    }

    if (isset($record->modified)) {
      $task['changed'] = date_timezone_set(new DateTime(date(self::DB_DATE_FORMAT, $record->modified)), $this->plugin->timezone);
    } else {
      $task['changed'] = '';
    }
    if ($created = $record->getAttribute('created')) {
      $task['created'] = date_timezone_set(new DateTime(date(self::DB_DATE_FORMAT, $created)), $this->plugin->timezone);
    }
    
    if ($record->alarm != 0) {
      if ($record->alarm > 0) {
        $valarm = ['trigger' => "-PT" . $record->alarm . "M", 'action' =>  "DISPLAY"];
      } else {
        $valarm = ['trigger' => "+PT" . str_replace('-', '', strval($record->alarm)) . "M", 'action' =>  "DISPLAY"];
      }
      $task['valarms'] = [$valarm];
      if ($snoozetime = $record->getAttribute('rc_snooze_time')) {
        $task['alarmtime'] = $snoozetime;
      }
      else {
        $task['alarmtime'] = $record->due - $record->alarm;
      }
    } else {
      $task['valarms'] = [];
    }
    $task['attachments'] = array();
    return $task;
  }

  /**
   * Convert the given task record into a data structure that can be passed to mel backend for saving
   * (opposite of self::_to_rcube_event())
   *
   * @return LibMelanie\Api\Defaut\Task
   */
  private function _from_rcube_task($task, $object) {
    if (is_a($task['created'], 'DateTime')) {
      $object->setAttribute('created', $task['created']->getTimestamp());
    }
    
    if (!empty($task['date'])) {
      $due = new DateTime($task['date'] . ' ' . $task['time'], $this->plugin->timezone);
      $object->due = strtotime($due->format(self::DB_DATE_FORMAT));
    }
    else if (!empty($task['time'])) {
      $due = new DateTime(date('Y-m-d') . ' ' . $task['time'], $this->plugin->timezone);
      $object->due = strtotime($due->format(self::DB_DATE_FORMAT));
    }
    else {
      $object->due = null;
    }

    if (isset($task['description']))
      $object->description = $task['description'];
    if (isset($task['title']))
      $object->name = $task['title'];
    if (isset($task['parent_id']))
      $object->parent = $task['parent_id'];

    if (isset($task['sensitivity'])) {
      if ($task['sensitivity'] == 0)
        $object->class = LibMelanie\Api\Defaut\Task::CLASS_PUBLIC;
      elseif ($task['sensitivity'] == 1)
        $object->class = LibMelanie\Api\Defaut\Task::CLASS_PRIVATE;
      elseif ($task['sensitivity'] == 2)
        $object->class = LibMelanie\Api\Defaut\Task::CLASS_CONFIDENTIAL;
    }
    
    if (isset($task['status'])) {
      $object->status = $task['status'];
    }
    if ($task['status'] == LibMelanie\Api\Defaut\Task::STATUS_COMPLETED) {
      $object->completed = 1;
    }
    else if ($task['status'] == LibMelanie\Api\Defaut\Task::STATUS_IN_PROCESS) {
      $object->completed = $task['complete'];
    }
    else if (isset($task['complete'])) {
      if ($task['complete'] == 1) {
        $object->status = LibMelanie\Api\Defaut\Task::STATUS_COMPLETED;
      }
      $object->completed = $task['complete'];
      $object->setAttribute('PERCENT-COMPLETE', $task['complete'] * 100);
    }
    else {
      $object->completed = $task['complete'];
      $object->setAttribute('PERCENT-COMPLETE', $task['complete'] * 100);
    }
    
    // TODO: Mettre à jour le plugin taskslist pour la gestion des alarmes
    if (isset($task['valarms']) && !empty($task['valarms'])) {
      $valarm = $task['valarms'];
      if (isset($valarm[0]) && isset($valarm[0]['trigger'])) {
        $object->alarm = self::valarm_ics_to_minutes_trigger($valarm[0]['trigger']);
      }
      if (isset($task['snoozetime'])) {
        $object->setAttribute('rc_snooze_time', $task['snoozetime']);
      }
      // Remove cache
      \mel::unsetCache('tasks_alarm');
    }

    if ($task['flagged'])
      $object->priority = LibMelanie\Api\Defaut\Task::PRIORITY_VERY_HIGH;
    else
      $object->priority = LibMelanie\Api\Defaut\Task::PRIORITY_NORMAL;

    return $object;
  }

  /**
   * Add a single task to the database
   *
   * @param
   *          array Hash array with task properties (see header of tasklist_driver.php)
   * @return mixed New task ID on success, False on error
   */
  public function create_task($task) {
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::create_task()");
    $task['created'] = new DateTime("now", $this->plugin->timezone);
    return $this->edit_task($task);
  }

  /**
   * Update an task entry with the given data
   *
   * @param
   *          array Hash array with task properties (see header of tasklist_driver.php)
   * @return boolean True on success, False on error
   */
  public function edit_task($task) {
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::edit_task()");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::edit_task() : " . var_export($task, true));

    $list_id = driver_mel::gi()->rcToMceId($task['list']);
    if (!$list_id || !isset($this->lists[$list_id]) || !$this->lists[$list_id]->asRight(LibMelanie\Config\ConfigMelanie::WRITE))
      return false;

    // moved from another folder
    if (isset($task['_fromlist'])) {
      $_task = array(
          'id' => $task['id'],
          'list' => $task['_fromlist']
      );
      $this->delete_task($_task);
      unset($task['id']);
    }

    // load previous version of this task to merge
    if ($task['id']) {
      $object = driver_mel::gi()->task([$this->user, $this->lists[$list_id]]);
      $object->id = $task['id'];
      foreach ($object->getList() as $t) {
        $_task = $t;
        break;
      }
      // La tache n'a pas pu être récupéré
      if (!isset($_task))
        return false;
    } else {
      $_task = driver_mel::gi()->task([$this->user, $this->lists[$list_id]]);
      if (isset($task['uid'])) {
        $_task->uid = $task['uid'];
      } else {
        $_task->uid = date('Ymd') . time() . md5($list_id . strval(time())) . '@roundcube';
      }
      $_task->id = md5(time() . $_task->uid . uniqid());
      $_task->owner = $this->user->uid;
    }
    $_task->modified = time();

    // generate new task object from RC input
    $_task = $this->_from_rcube_task($task, $_task);
    $saved = $_task->save();

    return !is_null($saved);
  }

  /**
   * Move a single task to another list
   *
   * @param
   *          array Hash array with task properties:
   * @return boolean True on success, False on error
   * @see tasklist_driver::move_task()
   */
  public function move_task($task) {
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::move_task()");
    return $this->edit_task($task);
  }

  /**
   * Remove a single task from the database
   *
   * @param
   *          array Hash array with task properties:
   *          id: Task identifier
   *          list: Tasklist identifer
   * @param
   *          boolean Remove record irreversible (mark as deleted otherwise, if supported by the backend)
   * @return boolean True on success, False on error
   */
  public function delete_task($task, $force = true) {
    if ($this->rc->task != 'tasks') {
      return;
    }
    mel_logs::get_instance()->log(mel_logs::DEBUG, "[tasklist] tasklist_mel_driver::delete_task()");
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::delete_task() : " . var_export($task, true));

    $list_id = driver_mel::gi()->rcToMceId($task['list']);
    if (!$list_id || !isset($this->lists[$list_id]) || !isset($task['id']) || !$this->lists[$list_id]->asRight(LibMelanie\Config\ConfigMelanie::WRITE))
      return false;

    $object = driver_mel::gi()->task([$this->user, $this->lists[$list_id]]);
    $object->id = $task['id'];
    foreach ($object->getList() as $t) {
      return $t->delete();
    }
  }

  /**
   * Restores a single deleted task (if supported)
   *
   * @param
   *          array Hash array with task properties:
   *          id: Task identifier
   * @return boolean True on success, False on error
   */
  public function undelete_task($prop) {
    // TODO: implement this
    return false;
  }

  /**
   * Get attachment properties
   *
   * @param string $id
   *          Attachment identifier
   * @param array $task
   *          Hash array with event properties:
   *          id: Task identifier
   *          list: List identifier
   *          rev: Revision (optional)
   * @return array Hash array with attachment properties:
   *         id: Attachment identifier
   *         name: Attachment name
   *         mimetype: MIME content type of the attachment
   *         size: Attachment size
   */
  public function get_attachment($id, $task) {
    return null;
  }

  /**
   * Get attachment body
   *
   * @param string $id
   *          Attachment identifier
   * @param array $task
   *          Hash array with event properties:
   *          id: Task identifier
   *          list: List identifier
   *          rev: Revision (optional)
   * @return string Attachment body
   */
  public function get_attachment_body($id, $task) {
    return false;
  }

  /**
   * Build the edit/create form for lists.
   * This gives the drivers the opportunity to add more list properties
   *
   * @param
   *          string The action called this form
   * @param
   *          array Tasklist properties
   * @param
   *          array List with form fields to be rendered
   * @return string HTML content of the form
   */
  public function tasklist_edit_form($action, $list, $formfields) {
    mel_logs::get_instance()->log(mel_logs::TRACE, "[tasklist] tasklist_mel_driver::tasklist_edit_form()");
    return parent::tasklist_edit_form($action, $list, $formfields);
  }

  /**
   * Calcul le trigger VALARM ICS et le converti en minutes
   *
   * @param string $trigger
   * @return number
   */
  private static function valarm_ics_to_minutes_trigger($trigger) {
    // TRIGGER au format -PT#W#D#H#M
    // Recherche les positions des caracteres
    $posT = strpos($trigger, 'T');
    $posW = strpos($trigger, 'W');
    $posD = strpos($trigger, 'D');
    $posH = strpos($trigger, 'H');
    $posM = strpos($trigger, 'M');

    // Si on trouve la position on recupere la valeur et on decale la position de reference
    if ($posT === false) {
      $posT = strpos($trigger, 'P');
    }

    $nbDay = 0;
    $nbHour = 0;
    $nbMin = 0;
    $nbWeeks = 0;
    if ($posW !== false) {
      $nbWeeks = intval(substr($trigger, $posT + 1, $posW - $posT + 1));
      $posT = $posW;
    }
    if ($posD !== false) {
      $nbDay = intval(substr($trigger, $posT + 1, $posD - $posT + 1));
      $posT = $posD;
    }
    if ($posH !== false) {
      $nbHour = intval(substr($trigger, $posT + 1, $posH - $posT + 1));
      $posT = $posH;
    }
    if ($posM !== false) {
      $nbMin = intval(substr($trigger, $posT + 1, $posM - $posT + 1));
    }

    // Calcul de l'alarme
    $minutes = $nbMin + $nbHour * 60 + $nbDay * 24 * 60 + $nbWeeks * 24 * 60 * 7;
    if (strpos($trigger, '-') === false)
      $minutes = -$minutes;
    return $minutes;
  }
}
   
