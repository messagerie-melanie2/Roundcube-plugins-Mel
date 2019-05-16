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
 * Classes de gestion de partage des ressources de contacts Mélanie2 dans Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 */
class M2tasks {
  /**
   *
   * @var LibMelanie\Api\Melanie2\User Utilisateur mélanie2
   */
  protected $user;
  /**
   *
   * @var LibMelanie\Api\Melanie2\Taskslist Liste de tâches mélanie2
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
    // User Melanie2
    $this->user = new LibMelanie\Api\Melanie2\User();
    if (! empty($user)) {
      $user = str_replace('_-P-_', '.', $user);
      if (strpos($user, '.-.') !== false) {
        $susername = explode('.-.', $user);
        $user = $susername[1];
      }
      $this->user->uid = $user;
    }
    try {
      // Carnet d'adresses Melanie2
      if (isset($mbox)) {
        $mbox = str_replace('_-P-_', '.', $mbox);
        if (strpos($mbox, '.-.') !== false) {
          $susername = explode('.-.', $mbox);
          $mbox = $susername[1];
        }
        $this->mbox = $mbox;
        $this->taskslist = new LibMelanie\Api\Melanie2\Taskslist($this->user);
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
   * Récupération de l'acl
   *
   * @return array
   */
  public function getAcl() {
    if (! isset($this->taskslist) || $this->taskslist->owner != $this->user->uid)
      return false;
    try {
      $_share = new LibMelanie\Api\Melanie2\Share($this->taskslist);
      $_share->type = $this->group === true ? LibMelanie\Api\Melanie2\Share::TYPE_GROUP : LibMelanie\Api\Melanie2\Share::TYPE_USER;
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
    if (! isset($this->taskslist) && ! $this->createTaskslist()) {
      return false;
    }
    if ($this->taskslist->owner != $this->user->uid) {
      return false;
    }
    try {
      // MANTIS 3939: Partage d'un carnet d'adresses : il est possible de saisir l'uid d'une bali dans "Partager à un groupe"
      // Vérifier que les données partagées existent dans l'annuaire
      if ($this->group === true) {
        // Valide que le droit concerne bien un groupe
        if (strpos($user, "mineqRDN=") !== 0 || strpos($user, "ou=organisation,dc=equipement,dc=gouv,dc=fr") === false) {
          return false;
        }
        // MANTIS 4093: Problème de partage à une liste
        $user = urldecode($user);
      }
      else {
        // Valide que le droit concerne bien un utilisateur
        $infos = mel::get_user_infos($user);
        if (! isset($infos)) {
          return false;
        }
        // MANTIS 4978 : l info de partage a ete trouvee, on remplace par uid
        $user = $infos['uid'][0];
      }
      $share = new LibMelanie\Api\Melanie2\Share($this->taskslist);
      $share->type = $this->group === true ? LibMelanie\Api\Melanie2\Share::TYPE_GROUP : LibMelanie\Api\Melanie2\Share::TYPE_USER;
      $share->name = $user;
      $share->acl = 0;
      // Compléter automatiquement les droits
      if (in_array('w', $rights)) {
        // Ecriture + Lecture + Freebusy
        $share->acl |= LibMelanie\Api\Melanie2\Share::ACL_WRITE
        | LibMelanie\Api\Melanie2\Share::ACL_DELETE
        | LibMelanie\Api\Melanie2\Share::ACL_READ
        | LibMelanie\Api\Melanie2\Share::ACL_FREEBUSY;
      }
      else if (in_array('r', $rights)) {
        // Lecture + Freebusy
        $share->acl |= LibMelanie\Api\Melanie2\Share::ACL_READ
        | LibMelanie\Api\Melanie2\Share::ACL_FREEBUSY;
      }
      else if (in_array('l', $rights)) {
        // Freebusy
        $share->acl |= LibMelanie\Api\Melanie2\Share::ACL_FREEBUSY;
      }
      if ($share->save() === null)
        return false;
      return true;
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
    if (! isset($this->taskslist) || $this->taskslist->owner != $this->user->uid)
      return false;
    try {
      $share = new LibMelanie\Api\Melanie2\Share($this->taskslist);
      $share->type = $this->group === true ? LibMelanie\Api\Melanie2\Share::TYPE_GROUP : LibMelanie\Api\Melanie2\Share::TYPE_USER;
      $share->name = $user;
      return $share->delete();
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
      $this->taskslist = new LibMelanie\Api\Melanie2\Taskslist($this->user);
      if (! isset($name)) {
        $infos = mel::get_user_infos($this->user->uid);
        $this->taskslist->name = $infos['cn'][0];
      }
      else {
        $this->taskslist->name = $name;
      }
      $this->taskslist->id = $this->mbox ?  : $this->user->uid;
      $this->taskslist->owner = $this->user->uid;
      if (! is_null($this->taskslist->save())) {
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
    if (isset($this->taskslist) && isset($this->user) && $this->taskslist->owner == $this->user->uid && $this->taskslist->id != $this->user->uid) {
      // Parcour les tâches pour les supprimer
      $tasks = $this->taskslist->getAllContacts();
      foreach ($tasks as $task) {
        $task->delete();
      }
      // Supprime la liste de tâches
      return $this->taskslist->delete();
    }
    return false;
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
      $hidden_tasks = $this->rc->config->get('hidden_tasks', array());
      // Parcour la liste des listes de tâches
      $taskslists = $this->user->getSharedTaskslists();
      $taskslist_owner = array();
      $taskslists_owner = array();
      $taskslists_shared = array();
      foreach ($taskslists as $taskslist) {
        if ($taskslist->owner == $this->user->uid) {
          if ($taskslist->id == $this->user->uid)
            $taskslist_owner[$taskslist->id] = $taskslist->name;
          else
            $taskslists_owner[$taskslist->id] = $taskslist->name;
        }
        else {
          $taskslists_shared[$taskslist->id] = "(" . $taskslist->owner . ") " . $taskslist->name;
        }

      }
      // MANTIS 0003913: Création automatique des objets dans Mes ressources
      if (count($taskslist_owner) == 0 && $this->createTaskslist()) {
        $taskslist_owner[$this->taskslist->id] = $this->taskslist->name;
      }
      // Objet HTML
      $table = new html_table();
      $checkbox_subscribe = new html_checkbox(array('name' => '_show_resource_rc[]','title' => $this->rc->gettext('changesubscription'),'onclick' => "rcmail.command(this.checked ? 'show_resource_in_roundcube' : 'hide_resource_in_roundcube', this.value, 'task')"));
      // Liste de tâches principal
      foreach ($taskslist_owner as $id => $name) {
        $table->add_row(array('id' => 'rcmrow' . str_replace(".", "_-P-_", $id),'class' => 'task','foldername' => str_replace(".", "_-P-_", $id)));

        $table->add('name', $name);
        $table->add('subscribed', $checkbox_subscribe->show((! isset($hidden_tasks[$id]) ? $id : ''), array('value' => $id)));
      }
      // Listes de tâches de l'utilisateurs
      asort($taskslists_owner);
      foreach ($taskslists_owner as $id => $name) {
        $table->add_row(array('id' => 'rcmrow' . str_replace(".", "_-P-_", $id),'class' => 'task personnal','foldername' => str_replace(".", "_-P-_", $id)));

        $table->add('name', $name);
        $table->add('subscribed', $checkbox_subscribe->show((! isset($hidden_tasks[$id]) ? $id : ''), array('value' => $id)));
      }
      // Listes de tâches partagés
      asort($taskslists_shared);
      foreach ($taskslists_shared as $id => $name) {
        $table->add_row(array('id' => 'rcmrow' . str_replace(".", "_-P-_", $id),'class' => 'task','foldername' => str_replace(".", "_-P-_", $id)));

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