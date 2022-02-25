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

use LibMelanie\Api\Defaut\ObjectShare;

/**
 * Classes de gestion de partage des ressources de boites aux lettres Mél dans Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 */
class M2mailbox {
  /**
   *
   * @var LibMelanie\Api\Defaut\User Utilisateur Mél
   */
  protected $user;
  /**
   *
   * @var string Identifiant de la boite (uid)
   */
  protected $mbox;
  /**
   *
   * @var rcmail The one and only instance
   */
  protected $rc;

  /**
   * Constructeur
   *
   * @param string $user
   * @param string $mbox
   */
  public function __construct($user = null, $mbox = null) {
    // Chargement de l'instance rcmail
    $this->rc = rcmail::get_instance();

    if (!empty($user)) {
      $this->user = driver_mel::gi()->getUser($user);
    }
    // Boite mail Melanie2
    if (isset($mbox)) {
      $mbox = driver_mel::gi()->rcToMceId($mbox);
      $this->mbox = $mbox;
    }
  }

  /**
   * Récupération de l'acl
   *
   * @return array
   */
  public function getAcl() {
    $_mbox = driver_mel::gi()->getUser($this->mbox, false);
    // Récupération de la boite
    if ($_mbox->is_objectshare) {
      $_mbox = $_mbox->objectshare->mailbox;
    }
    else if (!$_mbox->load()) {
      return false;
    }
    if ($this->rc->get_user_name() != $_mbox->uid 
        && (!isset($_mbox->shares[$this->rc->get_user_name()]) 
          || $_mbox->shares[$this->rc->get_user_name()]->type != \LibMelanie\Api\Defaut\Users\Share::TYPE_ADMIN)) {
      // L'utilisateur n'est pas gestionnaire de la boite
      // Il ne peut pas afficher les droits de la boite
      return false;
    }
    $_mbox->load(['supported_shares']);
    // Gestion des droits supportés par la boite
    $this->rc->output->set_env('supported_acls', array_map('strtolower', $_mbox->supported_shares));
    // Récupération de la liste des acls
    $acl = [];
    if (is_array($_mbox->shares)) {
      // Parcour la liste des droits
      foreach ($_mbox->shares as $share) {
        $acl[$share->user] = [strtolower($share->type)];
      }
    }
    return $acl;
  }
  /**
   * Position l'acl pour l'utilisateur
   *
   * @param string $user
   * @param array $rights
   * @return boolean
   */
  public function setAcl($user, $rights) {
    mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] mailbox::setAcl($user, $rights) mbox = " . $this->mbox);
    // Ajouter un hook lors du positionnement des ACLs
    $data = $this->rc->plugins->exec_hook('mce.setAcl_before', [
      'type' => 'mailbox',
      'mbox' => $this->mbox,
      'user' => $user,
      'rights' => $rights,
      'isgroup' => false,
    ]);
    // Si on doit annuler
    if ($data['abort']) {
      return false;
    }
    $_mbox = driver_mel::gi()->getUser($this->mbox, false);
    // Récupération de la boite
    if ($_mbox->is_objectshare) {
      $_mbox = $_mbox->objectshare->mailbox;
    }
    else if (!$_mbox->load()) {
      return false;
    }
    // Vérification des droits gestionnaires
    if ($this->rc->get_user_name() != $_mbox->uid 
        && (!isset($_mbox->shares[$this->rc->get_user_name()]) 
          || $_mbox->shares[$this->rc->get_user_name()]->type != \LibMelanie\Api\Defaut\Users\Share::TYPE_ADMIN)) {
      // L'utilisateur n'est pas gestionnaire de la boite
      // Il ne peut pas modifier les droits de la boite
      return false;
    }
    // Validation de l'authentification sur le LDAP master
    if (!$_mbox->authentification($this->rc->get_user_password(), true)) {
      // Erreur d'authentification sur le LDAP
      return false;
    }
    // MANTIS 4101: Partage à une adresse mail ne devrait pas être accepté
    // Valide que le droit concerne bien un utilisateur
    $_user = driver_mel::gi()->getUser($user);
    if (!isset($_user)) {
      return false;
    }
    $user = $_user->uid;

    // Modification des droits
    $acl = strtoupper($rights[0]);
    if (in_array($acl, $_mbox->supported_shares)) {
      $shares = $_mbox->shares;
      $share = driver_mel::gi()->users_share();
      $share->type = strtoupper($rights[0]);
      $share->user = $user;
      $shares[$user] = $share;
      $_mbox->shares = $shares;
    }
    else {
      return false;
    }
    $ret = $_mbox->save();
    // Ajouter un hook lors du positionnement des ACLs
    $data = $this->rc->plugins->exec_hook('mce.setAcl', [
      'type'    => 'mailbox',
      'mbox'    => $this->mbox,
      'user'    => $user,
      'rights'  => $rights,
      'isgroup' => false,
      'ret'     => $ret,
    ]);
    return $data['ret'];
  }
  /**
   * Suppression de l'acl pour l'utilisateur
   *
   * @param string $user
   * @return boolean
   */
  public function deleteAcl($user) {
    mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] mailbox::deleteAcl($user) mbox = " . $this->mbox);
    // Ajouter un hook lors du positionnement des ACLs
    $data = $this->rc->plugins->exec_hook('mce.deleteAcl_before', [
      'type' => 'mailbox',
      'mbox' => $this->mbox,
      'user' => $user,
      'isgroup' => false,
    ]);
    // Si on doit annuler
    if ($data['abort']) {
      return false;
    }
    $_mbox = driver_mel::gi()->getUser($this->mbox, false);
    // Récupération de la boite
    if ($_mbox->is_objectshare) {
      $_mbox = $_mbox->objectshare->mailbox;
    }
    else if (!$_mbox->load()) {
      return false;
    }
    // Vérification des droits gestionnaires
    if ($this->rc->get_user_name() != $_mbox->uid 
        && (!isset($_mbox->shares[$this->rc->get_user_name()]) 
          || $_mbox->shares[$this->rc->get_user_name()]->type != \LibMelanie\Api\Defaut\Users\Share::TYPE_ADMIN)) {
      // L'utilisateur n'est pas gestionnaire de la boite
      // Il ne peut pas modifier les droits de la boite
      return false;
    }
    // Validation de l'authentification sur le LDAP master
    if (!$_mbox->authentification($this->rc->get_user_password(), true)) {
      // Erreur d'authentification sur le LDAP
      return false;
    }
    // Parcourir les partages
    $shares = $_mbox->shares;
    if (is_array($shares) && isset($shares[$user])) {
      unset($shares[$user]);
      $_mbox->shares = $shares;
    }
    $ret = $_mbox->save();
    // Ajouter un hook lors du positionnement des ACLs
    $data = $this->rc->plugins->exec_hook('mce.deleteAcl', [
      'type'    => 'mailbox',
      'mbox'    => $this->mbox,
      'user'    => $user,
      'isgroup' => false,
      'ret'     => $ret,
    ]);
    return $data['ret'];
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

    // Récupération des préférences de l'utilisateur
    $hidden_mailboxes = $this->rc->config->get('hidden_mailboxes', []);
    $sort_bal = $this->rc->config->get('sort_bal', []);

    $mailboxes = [];
    $_objects = $this->user->getObjectsShared();
    if (!is_array($_objects)) {
      $_objects = [];
    }

    foreach (array_merge([$this->user], $_objects) as $_object) {
      $object_id = $_object->uid;
      if ($_object->is_objectshare) {
        $_object = $_object->mailbox;
      }
      $id = $_object->uid;

      $mailboxes[$object_id] = [
        'name' => $_object->fullname,
        'id' => $id,
      ];
      if (($order = array_search(driver_mel::gi()->mceToRcId($object_id), $sort_bal)) !== false) {
        $mailboxes[$object_id]['order'] = $order;
      }
      else {
        $mailboxes[$object_id]['order'] = $object_id == $this->user->uid ? 1000 : 2000;
      }
    }

    // Objet HTML
    $table = new html_table();
    $checkbox_subscribe = new html_checkbox(array('name' => '_show_resource_rc[]','title' => $this->rc->gettext('changesubscription'),'onclick' => "rcmail.command(this.checked ? 'show_resource_in_roundcube' : 'hide_resource_in_roundcube', this.value, 'mailboxe')"));

    // sort mailboxes
    uasort($mailboxes, function ($a, $b) {
      if ($a['order'] === $b['order'])
        return strcmp(strtolower($a['name']), strtolower($b['name']));
      else
        return strnatcmp($a['order'], $b['order']);
    });

    // Affichage des boites
    foreach ($mailboxes as $object_id => $value) {
      $name = $value['name'];
      $id = $value['id'];
      $table->add_row(array('id' => 'rcmrow' . driver_mel::gi()->mceToRcId($id),'class' => 'mailbox','foldername' => driver_mel::gi()->mceToRcId($id)));

      $table->add('name', $name);
      $table->add('subscribed', $checkbox_subscribe->show((!isset($hidden_mailboxes[$object_id]) ? $object_id : ''), array('value' => $object_id)));
    }

    // set client env
    $this->rc->output->add_gui_object('mel_resources_elements_list', $attrib['id']);

    return $table->show($attrib);
  }

  /**
   * Handler to render ACL form for a calendar folder
   */
  public function acl_template() {
    $this->rc->output->add_handler('folderacl', array($this,'acl_form'));
    $this->rc->output->send('mel_moncompte.acl_frame');
  }

  /**
   * Handler for ACL form template object
   */
  public function acl_form() {
    $balid = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $options = array('type' => 'm2mailbox','name' => $balid,'attributes' => array(0 => '\\HasNoChildren'),'namespace' => 'personal','special' => false,'rights' => array(0 => 'l',1 => 'r',2 => 's',3 => 'w',4 => 'i',5 => 'p',6 => 'k',7 => 'x',8 => 't',9 => 'e',10 => 'c',11 => 'd',12 => 'a'),'norename' => false,'noselect' => false,'protected' => true);

    $form = [];
    // Allow plugins to modify the form content (e.g. with ACL form)
    $plugin = $this->rc->plugins->exec_hook('acl_form_mel', array('form' => $form,'options' => $options,'name' => $balid));

    if (! $plugin['form']['sharing']['content']) {
      $plugin['form']['sharing']['content'] = html::div('hint', $this->rc->gettext('aclnorights'));
    }
      

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
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmusersaclframe';
    }
    $attrib['name'] = $attrib['id'];
    $attrib['src'] = $this->rc->url(array('_action' => 'plugin.mel_mailbox_acl','id' => $id,'framed' => 1));
    $attrib['width'] = '100%';
    $attrib['height'] = 275;
    $attrib['border'] = 0;
    $attrib['border'] = 'border:0';

    return $this->rc->output->frame($attrib);
  }

  /**
   * Méthode qui affiche les dossiers à restaurer pour une boite donné
   * 
   * @return string $html HTML à afficher pour la restauration des boites
   */
  public function restore_bal($attrib) {
    $id = driver_mel::gi()->rcToMceId(rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC));
    // Récupération de la boite a restaurer
    $mbox = driver_mel::gi()->getUser($id, false);
    if ($mbox->is_objectshare) {
      $mbox = $mbox->objectshare->mailbox;
      $id = $mbox->uid;
    }
    $folders = [];
    $imap = $this->rc->get_storage();
    
    // Si c'est la boite de l'utilisateur connecté
    if ($id == $this->rc->get_user_name()) {
      $host = $this->rc->user->get_username('domain');
    }
    else {
      // Récupération de la configuration de la boite pour l'affichage
      $host = driver_mel::gi()->getRoutage($mbox, 'restore_bal');
    }
    if (driver_mel::gi()->isSsl($host)) {
      $res = $imap->connect($host, $id, $this->rc->get_user_password(), 993, 'ssl');
    }
    else {
      $res = $imap->connect($host, $id, $this->rc->get_user_password(), $this->rc->config->get('default_port', 143));
    }

    // Récupération des folders
    if ($res) {
      $folders = $imap->list_folders_direct();
    }
    else {
      return 'Folders error';
    }

    $input = new html_inputfield(array('name' => 'nbheures','size' => '2'));
    $select = new html_select(array('name' => 'folder'));
    $delimiter = $imap->get_hierarchy_delimiter();

    foreach ($folders as $folder) {
      $foldersplit = explode($delimiter, $folder);
      $count = count($foldersplit);
      $name = rcube_charset::convert(array_pop($foldersplit), 'UTF7-IMAP');
      // MANTIS 3899: Récupération des courriels : la procédure n'est pas indiquée et le Courrier entrant est remplacé par INBOX
      if (strtoupper($name) == 'INBOX') {
        $name = $this->rc->gettext(strtoupper($name), 'mel_moncompte');
      }
      if ($count > 1) {
        $name = '-> ' . $name;
      }
      $select->add($name, $folder);
    }
    $imap->close();
    return html::div(null, str_replace('%%NB_HEURES%%', $input->show(), $this->rc->gettext('imap_select', 'mel_moncompte')) . $select->show());
  }

  /**
   * Appel la méthode d'unexpunge pour la restauration des messages
   */
  public static function unexpunge() {
    $hours = trim(rcube_utils::get_input_value('nbheures', rcube_utils::INPUT_POST));
    $folder = trim(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST));
    $ret = false;

    if (!empty($hours)) {
      $hours = intval($hours);
      $mbox = driver_mel::gi()->rcToMceId(rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC));
      $ret = driver_mel::gi()->unexpunge($mbox, $folder, $hours);
    }
    if ($ret) {
      rcmail::get_instance()->output->show_message('mel_moncompte.restore_bal_succes', 'confirmation');
    }
    else {
      rcmail::get_instance()->output->show_message('mel_moncompte.restore_bal_error', 'error');
    }
  }
}
























