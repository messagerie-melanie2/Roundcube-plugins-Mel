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
class M2contacts {
  /**
   *
   * @var LibMelanie\Api\Melanie2\User Utilisateur Mél
   */
  protected $user;
  /**
   *
   * @var LibMelanie\Api\Melanie2\Addressbook Carnet d'adresses Mél
   */
  protected $addressbook;
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
      // Addressbook Melanie2
      if (isset($mbox)) {
        $mbox = str_replace('_-P-_', '.', $mbox);
        if (strpos($mbox, '.-.') !== false) {
          $susername = explode('.-.', $mbox);
          $mbox = $susername[1];
        }
        $this->mbox = $mbox;
        $this->addressbook = new LibMelanie\Api\Melanie2\Addressbook($this->user);
        $this->addressbook->id = $mbox;
        if (! $this->addressbook->load())
          $this->addressbook = null;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2contacts::__construct() Melanie2DatabaseException");
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
    if (! isset($this->addressbook) || $this->addressbook->owner != $this->user->uid)
      return false;
    try {
      $_share = new LibMelanie\Api\Melanie2\Share($this->addressbook);
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
      }
      return $acl;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2contacts::getAcl() Melanie2DatabaseException");
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
    if (! isset($this->addressbook) && ! $this->createAddressbook()) {
      return false;
    }
    if ($this->addressbook->owner != $this->user->uid) {
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
      $share = new LibMelanie\Api\Melanie2\Share($this->addressbook);
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
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2contacts::setAcl() Melanie2DatabaseException");
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
    if (! isset($this->addressbook) || $this->addressbook->owner != $this->user->uid)
      return false;
    try {
      $share = new LibMelanie\Api\Melanie2\Share($this->addressbook);
      $share->type = $this->group === true ? LibMelanie\Api\Melanie2\Share::TYPE_GROUP : LibMelanie\Api\Melanie2\Share::TYPE_USER;
      $share->name = $user;
      return $share->delete();
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2contacts::deleteAcl() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }

  /**
   * Méthode pour la création du carnet d'adresses
   *
   * @param string $name [optionnel]
   * @return boolean
   */
  public function createAddressbook($name = null) {
    try {
      $this->addressbook = new LibMelanie\Api\Melanie2\Addressbook($this->user);
      if (! isset($name)) {
        $infos = mel::get_user_infos($this->user->uid);
        $this->addressbook->name = $infos['cn'][0];
      }
      else {
        $this->addressbook->name = $name;
      }
      $this->addressbook->id = $this->mbox ?  : $this->user->uid;
      $this->addressbook->owner = $this->user->uid;
      if (! is_null($this->addressbook->save())) {
        return $this->addressbook->load();
      }
      else {
        return false;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2contacts::createAddressbook() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Suppression du carnet d'adresse
   */
  public function deleteAddressbook() {
    if (isset($this->addressbook) && isset($this->user) && $this->addressbook->owner == $this->user->uid && $this->addressbook->id != $this->user->uid) {
      // Parcour les contacts pour les supprimer
      $contacts = $this->addressbook->getAllContacts();
      foreach ($contacts as $contact) {
        $contact->delete();
      }
      // Supprime le carnet d'address
      return $this->addressbook->delete();
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

    try {
      $result = array();

      // Récupération des préférences de l'utilisateur
      $hidden_contacts = $this->rc->config->get('hidden_contacts', array());
      // Parcour la liste des carnets d'adresses
      $addressbooks = $this->user->getSharedAddressbooks();
      $addressbook_owner = array();
      $addressbooks_owner = array();
      $addressbooks_shared = array();
      foreach ($addressbooks as $addressbook) {
        if ($addressbook->owner == $this->user->uid) {
          if ($addressbook->id == $this->user->uid)
            $addressbook_owner[$addressbook->id] = $addressbook->name;
          else
            $addressbooks_owner[$addressbook->id] = $addressbook->name;
        }
        else {
          $addressbooks_shared[$addressbook->id] = "(" . $addressbook->owner . ") " . $addressbook->name;
        }

      }
      // MANTIS 0003913: Création automatique des objets dans Mes ressources
      if (count($addressbook_owner) == 0 && $this->createAddressbook()) {
        $addressbook_owner[$this->addressbook->id] = $this->addressbook->name;
      }
      // Objet HTML
      $table = new html_table();
      $checkbox_subscribe = new html_checkbox(array('name' => '_show_resource_rc[]','title' => $this->rc->gettext('changesubscription'),'onclick' => "rcmail.command(this.checked ? 'show_resource_in_roundcube' : 'hide_resource_in_roundcube', this.value, 'contact')"));
      // Carnet d'adresses principal
      foreach ($addressbook_owner as $id => $name) {
        $table->add_row(array('id' => 'rcmrow' . str_replace(".", "_-P-_", $id),'class' => 'contact','foldername' => str_replace(".", "_-P-_", $id)));

        $table->add('name', $name);
        $table->add('subscribed', $checkbox_subscribe->show((! isset($hidden_contacts[$id]) ? $id : ''), array('value' => $id)));
      }
      // Carnets d'adresses de l'utilisateurs
      asort($addressbooks_owner);
      foreach ($addressbooks_owner as $id => $name) {
        $table->add_row(array('id' => 'rcmrow' . str_replace(".", "_-P-_", $id),'class' => 'contact personnal','foldername' => str_replace(".", "_-P-_", $id)));

        $table->add('name', $name);
        $table->add('subscribed', $checkbox_subscribe->show((! isset($hidden_contacts[$id]) ? $id : ''), array('value' => $id)));
      }
      // Carnets d'adresses partagés
      asort($addressbooks_shared);
      foreach ($addressbooks_shared as $id => $name) {
        $table->add_row(array('id' => 'rcmrow' . str_replace(".", "_-P-_", $id),'class' => 'contact','foldername' => str_replace(".", "_-P-_", $id)));

        $table->add('name', $name);
        $table->add('subscribed', $checkbox_subscribe->show((! isset($hidden_contacts[$id]) ? $id : ''), array('value' => $id)));
      }
      // set client env
      $this->rc->output->add_gui_object('mel_resources_elements_list', $attrib['id']);

      return $table->show($attrib);
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2contacts::resources_elements_list() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }

  /**
   * Handler to render ACL form for a contacts folder
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
    $options = array('type' => 'm2contacts','name' => $id,'attributes' => array(0 => '\\HasNoChildren'),'namespace' => 'personal','special' => false,'rights' => array(0 => 'l',1 => 'r',2 => 's',3 => 'w',4 => 'i',5 => 'p',6 => 'k',7 => 'x',8 => 't',9 => 'e',10 => 'c',11 => 'd',12 => 'a'),'norename' => false,'noselect' => false,'protected' => true);

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
    $attrib['src'] = $this->rc->url(array('_action' => 'plugin.mel_contacts_acl','id' => $id,'framed' => 1));
    $attrib['width'] = '100%';
    $attrib['height'] = 275;
    $attrib['border'] = 0;
    $attrib['border'] = 'border:0';

    return $this->rc->output->frame($attrib);
  }

  public function restore_contacts($attrib) {

    if (! $attrib['id'])
      $attrib['id'] = 'rcmExportForm';

    $html = '';
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $id = str_replace('_-P-_', '.', $id);
    $hidden = new html_hiddenfield(array('name' => 'contacts','id' => 'event-export-contacts','value' => $id));
    $html .= $hidden->show();

    $select = new html_select(array('name' => 'joursvg','id' => 'event-export-contactsvg'));
    $select->add($this->rc->gettext('cal_j-1', 'mel_moncompte'), 'horde_1');
    $select->add($this->rc->gettext('cal_j-2', 'mel_moncompte'), 'horde_2');
    $select->add('', 'horde_n');
    $html .= html::br();
    $html .= html::div('form-section', html::label('event-export-bdd', $this->rc->gettext('cal_bdd_label', 'mel_moncompte')) . $select->show());

    $this->rc->output->add_gui_object('exportform', $attrib['id']);

    return html::tag('form', array('action' => $this->rc->url(array('task' => 'addressbook','action' => 'export')),'method' => "post",'id' => $attrib['id']), $html);
  }
}
/**
 * Classes de gestion des ressources de contacts Mél dans Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 */
class M2contactsgroup extends M2contacts {
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
    $options = array('type' => 'm2contactsgroup','name' => $id,'attributes' => array(0 => '\\HasNoChildren'),'namespace' => 'personal','special' => false,'rights' => array(0 => 'l',1 => 'r',2 => 's',3 => 'w',4 => 'i',5 => 'p',6 => 'k',7 => 'x',8 => 't',9 => 'e',10 => 'c',11 => 'd',12 => 'a'),'norename' => false,'noselect' => false,'protected' => true);

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
    $attrib['src'] = $this->rc->url(array('_action' => 'plugin.mel_contacts_acl_group','id' => $id,'framed' => 1));
    $attrib['width'] = '100%';
    $attrib['height'] = 275;
    $attrib['border'] = 0;
    $attrib['border'] = 'border:0';

    return $this->rc->output->frame($attrib);
  }
}
