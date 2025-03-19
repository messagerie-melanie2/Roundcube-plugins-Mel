<?php
/**
 * Plugin Mél Moncompte
 *
 * plugin mel_moncompte pour roundcube
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

/**
 * Classes de gestion de partage des ressources de contacts Mél dans Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 */
class M2tasks {
  /**
   *
   * @var LibMelanie\Api\Defaut\User Utilisateur Mél
   */
  protected $user;
  /**
   *
   * @var LibMelanie\Api\Defaut\Taskslist Liste de tâches Mél
   */
  protected $taskslist;
  /**
   *
   * @var rcmail The one and only instance
   */
  protected $rc;
  /**
   *
   * @var bool Groupe
   */
  protected $group = false;
  /**
   *
   * @var string Identifiant de la boite (uid)
   */
  protected $mbox;

  /**
   * Constructeur
   *
   * @param string $user
   * @param string $mbox
   */
  public function __construct($user = null, $mbox = null) {
    // Chargement de l'instance rcmail
    $this->rc = rcmail::get_instance();
    if (isset($user) && !empty($user)) {
      if (is_object($user)) {
        $this->user = $user;
      }
      else {
        $user = driver_mel::gi()->rcToMceId($user);
        $this->user = driver_mel::gi()->getUser($user);
        if (isset($this->user) && $this->user->is_objectshare) {
          $this->user = $this->user->objectshare->mailbox;
        }
      }
    }
    try {
      // Carnet d'adresses Mce
      if (isset($mbox)) {
        $mbox = driver_mel::gi()->rcToMceId($mbox);
        if (!isset($this->user)) {
          $this->user = driver_mel::gi()->getUser($mbox);
          if (isset($this->user)) {
            if ($this->user->is_objectshare) {
              $this->user = $this->user->objectshare->mailbox;
            }
            $mbox = $this->user->uid;
          }
          else {
            $this->user = driver_mel::gi()->getUser();
          }
        }
        $this->mbox = $mbox;
        $this->taskslist = driver_mel::gi()->taskslist([$this->user]);
        $this->taskslist->id = $mbox;
        if (! $this->taskslist->load())
          $this->taskslist = null;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2tasks::__construct() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }

  /**
   * Getter de l'objet taskslist
   * 
   * @return LibMelanie\Api\Defaut\Taskslist Liste de tâches Mél
   */
  public function getTaskslist() {
    return $this->taskslist;
  }

  /**
   * Récupération de l'acl
   *
   * @return array
   */
  public function getAcl() {
    if (!isset($this->taskslist) || $this->taskslist->owner != $this->user->uid)
      return false;
    try {
      $_share = driver_mel::gi()->share([$this->taskslist]);
      $_share->type = $this->group === true ? LibMelanie\Api\Defaut\Share::TYPE_GROUP : LibMelanie\Api\Defaut\Share::TYPE_USER;
      $acl = array();
      foreach ($_share->getList() as $share) {
        $acl[$share->name] = array();
        if ($share->asRight(LibMelanie\Config\ConfigMelanie::WRITE)) {
          $acl[$share->name][] = "w";
        }
        if ($share->asRight(LibMelanie\Config\ConfigMelanie::READ)) {
          $acl[$share->name][] = "r";
        }
        if ($share->asRight(LibMelanie\Config\ConfigMelanie::FREEBUSY)) {
          $acl[$share->name][] = "l";
        }
        if ($share->asRight(LibMelanie\Config\ConfigMelanie::DELETE)) {
          $acl[$share->name][] = "d";
        }
      }
      return $acl;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2tasks::getAcl() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }
  /**
   * Position l'acl pour l'utilisateur
   *
   * @param string $user
   * @param array $rights
   * @return boolean
   */
  public function setAcl($user, $rights) {
    mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] tasks::setAcl($user, $rights) mbox = " . $this->mbox);
    // Ajouter un hook lors du positionnement des ACLs
    $data = $this->rc->plugins->exec_hook('mce.setAcl_before', [
      'type'    => 'tasks',
      'mbox'    => $this->mbox,
      'user'    => $user,
      'rights'  => $rights,
      'isgroup' => $this->group,
      'abort'   => false,
    ]);
    // Si on doit annuler
    if ($data['abort']) {
      return false;
    }
    if (!isset($this->taskslist) && !$this->createTaskslist()) {
      return false;
    }
    if ($this->taskslist->owner != $this->user->uid) {
      return false;
    }
    try {
      // MANTIS 3939: Partage d'un carnet d'adresses : il est possible de saisir l'uid d'une bali dans "Partager à un groupe"
      // Vérifier que les données partagées existent dans l'annuaire
      if ($this->group === true) {
        // MANTIS 4093: Problème de partage à une liste
        $user = urldecode($user);
        // Valide que le droit concerne bien un groupe
        if (!driver_mel::gi()->userIsGroup($user)) {
          return false;
        }
      }
      else {
        // Valide que le droit concerne bien un utilisateur
        $_user = driver_mel::gi()->getUser($user);
        if (!isset($_user)) {
          return false;
        }
        // MANTIS 4978 : l info de partage a ete trouvee, on remplace par uid
        $user = $_user->uid;

        // 0008506: On peut s'autopartager son calendrier ou sa boite en passant par l'adresse email
        if ($user == $this->mbox) {
          return false;
        }
      }
      $share = driver_mel::gi()->share([$this->taskslist]);
      $share->type = $this->group === true ? LibMelanie\Api\Defaut\Share::TYPE_GROUP : LibMelanie\Api\Defaut\Share::TYPE_USER;
      $share->name = $user;
      $share->acl = 0;
      // Compléter automatiquement les droits
      if (in_array('w', $rights)) {
        // Ecriture + Lecture + Freebusy
        $share->acl |= LibMelanie\Api\Defaut\Share::ACL_WRITE
                    | LibMelanie\Api\Defaut\Share::ACL_DELETE
                    | LibMelanie\Api\Defaut\Share::ACL_READ
                    | LibMelanie\Api\Defaut\Share::ACL_FREEBUSY;
      }
      else if (in_array('r', $rights)) {
        // Lecture + Freebusy
        $share->acl |= LibMelanie\Api\Defaut\Share::ACL_READ
        | LibMelanie\Api\Defaut\Share::ACL_FREEBUSY;
      }
      else if (in_array('l', $rights)) {
        // Freebusy
        $share->acl |= LibMelanie\Api\Defaut\Share::ACL_FREEBUSY;
      }
      $ret = $share->save();
      // Ajouter un hook lors du positionnement des ACLs
      $data = $this->rc->plugins->exec_hook('mce.setAcl', [
        'type'    => 'tasks',
        'mbox'    => $this->mbox,
        'user'    => $user,
        'rights'  => $rights,
        'isgroup' => $this->group,
        'ret'     => !is_null($ret),
      ]);
      return $data['ret'];
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2tasks::setAcl() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }
  /**
   * Suppression de l'acl pour l'utilisateur
   *
   * @param string $user
   * @return boolean
   */
  public function deleteAcl($user) {
    mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] tasks::deleteAcl($user) mbox = " . $this->mbox);
    // Ajouter un hook lors du positionnement des ACLs
    $data = $this->rc->plugins->exec_hook('mce.deleteAcl_before', [
      'type'    => 'tasks',
      'mbox'    => $this->mbox,
      'user'    => $user,
      'isgroup' => $this->group,
      'abort'   => false,
    ]);
    // Si on doit annuler
    if ($data['abort']) {
      return false;
    }
    if (!isset($this->taskslist) || $this->taskslist->owner != $this->user->uid)
      return false;
    try {
      $share = driver_mel::gi()->share([$this->taskslist]);
      $share->type = $this->group === true ? LibMelanie\Api\Defaut\Share::TYPE_GROUP : LibMelanie\Api\Defaut\Share::TYPE_USER;
      $share->name = $user;
      $ret = $share->delete();
      // Ajouter un hook lors du positionnement des ACLs
      $data = $this->rc->plugins->exec_hook('mce.deleteAcl', [
        'type'    => 'tasks',
        'mbox'    => $this->mbox,
        'user'    => $user,
        'isgroup' => $this->group,
        'ret'     => !is_null($ret),
      ]);
      return $data['ret'];
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2tasks::deleteAcl() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }

  /**
   * Méthode pour la création de la liste des tâches
   *
   * @param string $name [optionnel]
   * @return boolean
   */
  public function createTaskslist($name = null) {
    try {
      $this->taskslist = driver_mel::gi()->taskslist([$this->user]);
      if (!isset($name)) {
        $this->taskslist->name = $this->user->fullname;
      }
      else {
        $this->taskslist->name = $name;
      }
      $this->taskslist->id = $this->mbox ?  : $this->user->uid;
      $this->taskslist->owner = $this->user->uid;
      $ret = $this->taskslist->save();
      if (!is_null($ret)) {
        return $this->taskslist->load();
      }
      else {
        return false;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2tasks::createTaskslist() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Suppression de la liste de tâches
   */
  public function deleteTaskslist() {
    if ($this->_deleteCondiction()) {
      // Parcour les tâches pour les supprimer
      $tasks = $this->taskslist->getAllTasks();
      foreach ($tasks as $task) {
        $task->delete();
      }
      // Supprime la liste de tâches
      return $this->taskslist->delete();
    }
    return false;
  }

  protected function _deleteCondiction() {
    return isset($this->taskslist) && isset($this->user) && $this->taskslist->owner == $this->user->uid && $this->taskslist->id != $this->user->uid;
  }

  /**
   * Affiche la liste des éléments
   *
   * @param array $attrib
   * @return string
   */
  public function resources_elements_list($attrib) {
    // add id to message list table if not specified
    if (! strlen($attrib['id']))
      $attrib['id'] = 'rcmresourceselementslist';

    $result = array();
    try {
      // Récupération des préférences de l'utilisateur
      $hidden_tasks = $this->rc->config->get('hidden_tasks', []);
      $sort_tasks = $this->rc->config->get('sort_tasks', []);
      // Parcour la liste des listes de tâches
      $_taskslists = $this->user->getSharedTaskslists();
      $taskslists = [];
      foreach ($_taskslists as $taskslist) {
        $taskslists[$taskslist->id] = [
          'name' => $taskslist->owner == $this->user->uid ? $taskslist->name : "(" . $taskslist->owner . ") " . $taskslist->name,
          'class' => $taskslist->owner == $this->user->uid && $taskslist->id != $this->user->uid ? ' personnal' : '',
        ];
        if (($order = array_search(driver_mel::gi()->mceToRcId($taskslist->id), $sort_tasks)) !== false) {
          $taskslists[$taskslist->id]['order'] = $order;
        }
        else if ($taskslist->owner == $this->user->uid) {
          if ($taskslist->id == $this->user->uid) {
            $taskslists[$taskslist->id]['order'] = 1000;
          }
          else {
            $taskslists[$taskslist->id]['order'] = 2000;
            $taskslists[$taskslist->id]['class'] = ' personnal';
          }
        }
        else {
          $taskslists[$taskslist->id]['order'] = 3000;
        }
      }
      // MANTIS 0003913: Création automatique des objets dans Mes ressources
      if (!isset($taskslists[$this->user->uid]) && $this->createTaskslist()) {
        $taskslists[$this->taskslist->id] = [
          'name' => $this->taskslist->name,
          'order' => 1000,
        ];
      }

      // Objet HTML
      $table = new html_table();
      $checkbox_subscribe = new html_checkbox(array('name' => '_show_resource_rc[]','title' => $this->rc->gettext('changesubscription'),'onclick' => "rcmail.command(this.checked ? 'show_resource_in_roundcube' : 'hide_resource_in_roundcube', this.value, 'task')"));

      // sort taskslists
      uasort($taskslists, function ($a, $b) {
        if ($a['order'] === $b['order'])
          return strcmp(strtolower($a['name']), strtolower($b['name']));
        else
          return strnatcmp($a['order'], $b['order']);
      });

      // Affichage des listes de taches
      foreach ($taskslists as $id => $value) {
        $name = $value['name'];
        $class = $value['class'];
        $table->add_row(array('id' => 'rcmrow' . driver_mel::gi()->mceToRcId($id), 'class' => 'task'.$class, 'foldername' => driver_mel::gi()->mceToRcId($id)));

        $table->add('name', $name);
        $table->add('subscribed', $checkbox_subscribe->show((! isset($hidden_tasks[$id]) ? $id : ''), array('value' => $id)));
      }
      // set client env
      $this->rc->output->add_gui_object('mel_resources_elements_list', $attrib['id']);

      return $table->show($attrib);
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2tasks::resources_elements_list() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }

  /**
   * Handler to render ACL form for a tasks folder
   */
  public function acl_template() {
    $this->rc->output->add_handler('folderacl', array($this,'acl_form'));
    $this->rc->output->send('mel_moncompte.acl_frame');
  }

  /**
   * Handler for ACL form template object
   */
  public function acl_form() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $options = array('type' => 'm2tasks','name' => $id,'attributes' => array(0 => '\\HasNoChildren'),'namespace' => 'personal','special' => false,'rights' => array(0 => 'l',1 => 'r',2 => 's',3 => 'w',4 => 'i',5 => 'p',6 => 'k',7 => 'x',8 => 't',9 => 'e',10 => 'c',11 => 'd',12 => 'a'),'norename' => false,'noselect' => false,'protected' => true);

    $form = array();

    // Allow plugins to modify the form content (e.g. with ACL form)
    $plugin = $this->rc->plugins->exec_hook('acl_form_mel', array('form' => $form,'options' => $options,'name' => $cal->name));

    if (! $plugin['form']['sharing']['content'])
      $plugin['form']['sharing']['content'] = html::div('hint', $this->rc->gettext('aclnorights'));

    return $plugin['form']['sharing']['content'];
  }

  /**
   * Affichage des données dans la frame
   *
   * @param array $attrib
   * @return string
   */
  public function acl_frame($attrib) {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    if (! $attrib['id'])
      $attrib['id'] = 'rcmusersaclframe';

    $attrib['name'] = $attrib['id'];
    $attrib['src'] = $this->rc->url(array('_action' => 'plugin.mel_tasks_acl','id' => $id,'framed' => 1));
    $attrib['width'] = '100%';
    $attrib['height'] = 275;
    $attrib['border'] = 0;
    $attrib['border'] = 'border:0';

    return $this->rc->output->frame($attrib);
  }
}

class M2tasksgroup extends M2tasks {
  /**
   * Constructeur
   *
   * @param string $user
   * @param string $mbox
   */
  public function __construct($user = null, $mbox = null) {
    $this->group = true;
    parent::__construct($user, $mbox);
  }

  /**
   * Handler for ACL form template object
   */
  public function acl_form() {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $options = array('type' => 'm2tasksgroup','name' => $id,'attributes' => array(0 => '\\HasNoChildren'),'namespace' => 'personal','special' => false,'rights' => array(0 => 'l',1 => 'r',2 => 's',3 => 'w',4 => 'i',5 => 'p',6 => 'k',7 => 'x',8 => 't',9 => 'e',10 => 'c',11 => 'd',12 => 'a'),'norename' => false,'noselect' => false,'protected' => true);

    $form = array();

    // Allow plugins to modify the form content (e.g. with ACL form)
    $plugin = $this->rc->plugins->exec_hook('acl_form_mel', array('form' => $form,'options' => $options,'name' => $cal->name));

    if (! $plugin['form']['sharing']['content'])
      $plugin['form']['sharing']['content'] = html::div('hint', $this->rc->gettext('aclnorights'));

    return $plugin['form']['sharing']['content'];
  }

  /**
   * Affichage des données dans la frame
   *
   * @param array $attrib
   * @return string
   */
  public function acl_frame($attrib) {
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    if (! $attrib['id'])
      $attrib['id'] = 'rcmusersaclframe';

    $attrib['name'] = $attrib['id'];
    $attrib['src'] = $this->rc->url(array('_action' => 'plugin.mel_tasks_acl_group','id' => $id,'framed' => 1));
    $attrib['width'] = '100%';
    $attrib['height'] = 275;
    $attrib['border'] = 0;
    $attrib['border'] = 'border:0';

    return $this->rc->output->frame($attrib);
  }
}

class M2taskswsp extends M2tasks{
  public function __construct($id){
    // Chargement de l'instance rcmail
    $this->rc = rcmail::get_instance();
    $this->user = new stdClass();
    $this->user->uid = $id;
    $this->mbox = $id;
    $this->taskslist = driver_mel::gi()->taskslist();
    $this->taskslist->id = $id;

    if (!$this->taskslist->load()) $this->taskslist = null;
  }

    /**
   * Récupération de l'acl
   *
   * @return array
   */
  public function getAcl($user) {
    if (!isset($this->taskslist)) return false;
    else if ($this->taskslist->owner === $user->uid) return true;

    try {
      $_share = driver_mel::gi()->share([$this->taskslist]);
      $_share->type = $this->group === true ? LibMelanie\Api\Defaut\Share::TYPE_GROUP : LibMelanie\Api\Defaut\Share::TYPE_USER;
      $acl = array();
      foreach ($_share->getList() as $share) {
        if ($share->name === $user->uid && $share->asRight(LibMelanie\Config\ConfigMelanie::WRITE))
          return true;
      }
      return false;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2tasks::getAcl() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }

  protected function _deleteCondiction() {
    return isset($this->taskslist) && isset($this->user) && $this->taskslist->owner == $this->user->uid && $this->taskslist->id == $this->user->uid;
  }
}