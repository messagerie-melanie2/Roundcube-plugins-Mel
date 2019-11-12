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
 * Classes de gestion de partage des ressources de boites aux lettres Mél dans Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 */
class M2mailbox {
  /**
   *
   * @var LibMelanie\Api\Melanie2\User Utilisateur Mél
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
    // User Melanie2
    $this->user = new LibMelanie\Api\Melanie2\User();
    if (! empty($user)) {
      $this->user->uid = $user;
    }
    // Boite mail Melanie2
    if (isset($mbox)) {
      $mbox = str_replace('_-P-_', '.', $mbox);
      $this->mbox = $mbox;
    }
  }

  /**
   * Récupération de l'acl
   *
   * @return array
   */
  public function getAcl() {
    $id = $this->mbox;
    if (strpos($id, '.-.') !== false) {
      $susername = explode('.-.', $id);
      $id = $susername[1];
    }
    $infos = LibMelanie\Ldap\Ldap::GetUserInfos($id, null, array('mineqmelpartages', 'mineqliensimport'), LibMelanie\Config\Ldap::$SEARCH_LDAP);
    // Mantis 4894 est-ce que la bal est Agriculture
    if (isset($infos['mineqliensimport'])) {
        foreach($infos['mineqliensimport'] as $i => $val) {
            if (strpos($infos['mineqliensimport'][$i], 'AGRI.Lien:') !== false) {
                $this->rc->output->set_env('ministere', 'agri');
                break;
            }
        }
    }
    if ($this->rc->get_user_name() != $id && ! in_array($this->rc->get_user_name() . ':G', $infos['mineqmelpartages'])) {
      // L'utilisateur n'est pas gestionnaire de la boite
      // Il ne peut pas modifier les droits de la boite
      return false;
    }
    $acl = array();
    if (isset($infos['mineqmelpartages']) && is_array($infos['mineqmelpartages'])) {
      // Parcour la liste des droits
      unset($infos['mineqmelpartages']['count']);
      foreach ($infos['mineqmelpartages'] as $partage) {
        $partage = explode(':', $partage);
        $acl[$partage[0]] = array(strtolower($partage[1]));
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
    $id = $this->mbox;
    if (strpos($id, '.-.') !== false) {
      $susername = explode('.-.', $id);
      $id = $susername[1];
    }
    $infos = LibMelanie\Ldap\Ldap::GetUserInfos($id, null, array('mineqmelpartages', 'mineqliensimport'), LibMelanie\Config\Ldap::$MASTER_LDAP);
    if ($this->rc->get_user_name() != $id && ! in_array($this->rc->get_user_name() . ':G', $infos['mineqmelpartages'])) {
      // L'utilisateur n'est pas gestionnaire de la boite
      // Il ne peut pas modifier les droits de la boite
      return false;
    }
    $dn = $infos['dn'];
    // Authentification
    if (! LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$MASTER_LDAP)->authenticate($dn, $this->rc->get_user_password())) {
      // Erreur d'authentification sur le LDAP
      return false;
    }
    // MANTIS 4101: Partage à une adresse mail ne devrait pas être accepté
    // Valide que le droit concerne bien un utilisateur
    $_infos = mel::get_user_infos($user);
    if (! isset($_infos)) {
      return false;
    }
    
    // Mantis 4894 est-ce que la bal est Agriculture 
    if (isset($infos['mineqliensimport'])) {
        foreach($infos['mineqliensimport'] as $i => $val) {
            if (strpos($infos['mineqliensimport'][$i], 'AGRI.Lien:') !== false) {
                $ministere = 'AGRI';
                break;
            }
        }
    }
    
    // MANTIS 4978 : l info de partage a ete trouvee, on remplace par uid
    $user = $_infos['uid'][0];
    
    $haschanged = false;
    if (! isset($infos['mineqmelpartages'])) {
      $infos['mineqmelpartages'] = array($user . ":" . strtoupper($rights[0]));
      $haschanged = true;
    }
    else {
      // Parcour la liste des droits
      unset($infos['mineqmelpartages']['count']);
      $modify = false;
      foreach ($infos['mineqmelpartages'] as $key => $partage) {
        // Recherche l'utilisateur
        if (strpos($partage, $user . ':') === 0) {
          if ($partage != $user . ":" . strtoupper($rights[0])) {
              // Mantis 4894 pas de modif du droit G pour bal Agriculture
              if ($ministere == 'AGRI' && strtoupper($rights[0]) == 'G') {
                  return false;
              }
            $infos['mineqmelpartages'][$key] = $user . ":" . strtoupper($rights[0]);
            $haschanged = true;
            break;
          }
          $modify = true;
        }
      }
      if (! $modify && ! $haschanged) {
        // Si l'utilisateur n'a pas été modifié on l'ajoute
        $infos['mineqmelpartages'][] = $user . ":" . strtoupper($rights[0]);
        $haschanged = true;
      }
    }
    if ($haschanged)
      return LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$MASTER_LDAP)->modify($dn, array('mineqmelpartages' => $infos['mineqmelpartages']));
    else
      return true;
  }
  /**
   * Suppression de l'acl pour l'utilisateur
   *
   * @param string $user
   * @return boolean
   */
  public function deleteAcl($user) {
    $id = $this->mbox;
    if (strpos($id, '.-.') !== false) {
      $susername = explode('.-.', $id);
      $id = $susername[1];
    }
    $infos = LibMelanie\Ldap\Ldap::GetUserInfos($id, null, array('mineqmelpartages'), LibMelanie\Config\Ldap::$MASTER_LDAP);
    if ($this->rc->get_user_name() != $id && ! in_array($this->rc->get_user_name() . ':G', $infos['mineqmelpartages'])) {
      // L'utilisateur n'est pas gestionnaire de la boite
      // Il ne peut pas modifier les droits de la boite
      return false;
    }
    $dn = $infos['dn'];
    // Authentification
    if (! LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$MASTER_LDAP)->authenticate($dn, $this->rc->get_user_password())) {
      // Erreur d'authentification sur le LDAP
      return false;
    }
    unset($infos['mineqmelpartages']['count']);
    // Parcour la liste des droits
    foreach ($infos['mineqmelpartages'] as $key => $partage) {
      // Recherche l'utilisateur
      if (strpos($partage, $user . ':') === 0) {
        unset($infos['mineqmelpartages'][$key]);
        $infos['mineqmelpartages'] = array_values($infos['mineqmelpartages']);
        return LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$MASTER_LDAP)->modify($dn, array('mineqmelpartages' => $infos['mineqmelpartages']));
      }
    }
    return true;
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
    $hidden_mailboxes = $this->rc->config->get('hidden_mailboxes', array());
    // Objet HTML
    $table = new html_table();
    $checkbox_subscribe = new html_checkbox(array('name' => '_show_resource_rc[]','title' => $this->rc->gettext('changesubscription'),'onclick' => "rcmail.command(this.checked ? 'show_resource_in_roundcube' : 'hide_resource_in_roundcube', this.value, 'mailboxe')"));
    // Récupération de la bal de l'utilisateur
    $infos = mel::get_user_infos($this->user->uid);
    // Récupération de la liste des balp de l'utilisateur
    $balp = mel::get_user_balp($this->user->uid);
    if (! isset($balp)) {
      $balp = array();
    }
    else {
      // trier la liste
      uasort($balp, function($a, $b) {
        return strtolower($a['cn'][0]) > strtolower($b['cn'][0]);
      });
    }
    $balp = array_merge(array($infos), $balp);
    foreach ($balp as $b) {
      if ($b['dn'] == "") {
        continue;
      }
      $id = $b['uid'][0];
      $name = $this->m2_mailbox_shortname($b['cn'][0]);
      $table->add_row(array('id' => 'rcmrow' . str_replace(".", "_-P-_", $id),'class' => 'mailbox','foldername' => str_replace(".", "_-P-_", $id)));

      $table->add('name', $name);
      $table->add('subscribed', $checkbox_subscribe->show((! isset($hidden_mailboxes[$id]) ? $id : ''), array('value' => $id)));
    }
    // set client env
    $this->rc->output->add_gui_object('mel_resources_elements_list', $attrib['id']);

    return $table->show($attrib);
  }
  /**
   * Génération du nom court de l'identité en fonction du nom
   *
   * @param string $name
   * @return string
   */
  private function m2_mailbox_shortname($name) {
    if (strpos($name, ' emis par ') !== false) {
      $name = explode(' emis par ', $name);
      $name = $name[0] . " (partagée)";
    }
    elseif (strpos($name, ' - ') !== false) {
      $name = explode(' - ', $name);
      $name = $name[0];
    }
    return $name;
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
    $attrib['src'] = $this->rc->url(array('_action' => 'plugin.mel_mailbox_acl','id' => $id,'framed' => 1));
    $attrib['width'] = '100%';
    $attrib['height'] = 275;
    $attrib['border'] = 0;
    $attrib['border'] = 'border:0';

    return $this->rc->output->frame($attrib);
  }

  public function restore_bal($attrib) {

    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $id = str_replace("_-P-_", ".", $id);

    if (strpos($id, '.-.') !== false) {
      $tmp = explode('.-.', $id, 2);
      $id = $tmp[1];
    }
    
    $folders = array();
    $imap = $this->rc->get_storage();
    
    if ($id == $this->rc->get_user_name()) {
      if ($imap->connect($this->rc->user->get_username('domain'), $id, $this->rc->get_user_password(), 993, 'ssl')) {
        $folders = $imap->list_folders_direct();
      }
    }
    else {
      $infos = mel::get_user_infos($id);
      if (isset($infos) && isset($infos['mineqmelroutage']) && count($infos['mineqmelroutage']) > 0) {
        // MANTIS 3925: mineqMelRoutage multivalué
        foreach ($infos['mineqmelroutage'] as $melroutage) {
          $host = null;
          if (strpos($melroutage, '%') !== false) {
            $tmp = explode('@', $melroutage);
            $host = $tmp[1];
            break;
          }
        }
        if (isset($host)) {
          $imap->connect($host, $id, $this->rc->get_user_password(), 993, 'ssl');
          $folders = $imap->list_folders_direct();
        }
      }
    }
   
    

    $html = '';
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

    $html = html::div(null, str_replace('%%NB_HEURES%%', $input->show(), $this->rc->gettext('imap_select', 'mel_moncompte')) . $select->show());
    return $html;
  }

  public static function unexpunge() {

    $nbheures = trim(rcube_utils::get_input_value('nbheures', rcube_utils::INPUT_POST));
    $selfolder = trim(rcube_utils::get_input_value('folder', rcube_utils::INPUT_POST));

    if (! empty($nbheures)) {

      $nbheures = intval($nbheures);

      $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
      $id = str_replace("_-P-_", ".", $id);

      if (strpos($id, '.-.') !== false) {
        $tmp = explode('.-.', $id, 2);
        $id = $tmp[1];
      }

      $infos = mel::get_user_infos($id);

      if (isset($infos) && isset($infos['mineqmelroutage']) && count($infos['mineqmelroutage']) > 0) {
        // MANTIS 3925: mineqMelRoutage multivalué
        foreach ($infos['mineqmelroutage'] as $melroutage) {
          if (strpos($melroutage, '%') !== false) {
            $tmp = explode('@', $melroutage);
            $host = $tmp[1];
            break;
          }
        }
        $server = explode('.', $host);
        $rep = '/var/pamela/unexpunge/' . $server[0];
        $dossier = str_replace('/', '^', $selfolder);

        if (isset($dossier)) {
        	$nom = $rep . '/' . $id . '^' . $dossier;
        } else{
        	$nom = $rep . '/' . $id;
        }

        $fic = fopen($nom, 'w');
        if (flock($fic, LOCK_EX)) {
          fputs($fic, 'recuperation:' . $nbheures);
          flock($fic, LOCK_UN);
        }
        fclose($fic);

        if (file_exists($nom)) {
          $res = chmod($nom, 0444);
        }
        rcmail::get_instance()->output->show_message('mel_moncompte.restore_bal_succes', 'confirmation');
      }
      else {
        rcmail::get_instance()->output->show_message('mel_moncompte.restore_bal_error', 'error');
      }
    }
  }
}
























