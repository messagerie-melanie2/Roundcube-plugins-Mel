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
 * Classes de gestion de partage des ressources d'agendas Mél dans Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 */
class M2calendar {
  /**
   *
   * @var LibMelanie\Api\Defaut\User Utilisateur Mél
   */
  protected $user;
  /**
   *
   * @var LibMelanie\Api\Defaut\Calendar Calendrier Mél
   */
  protected $calendar;
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
      $user = driver_mel::gi()->rcToMceId($user);
      $this->user = driver_mel::gi()->getUser($user);
      if (isset($this->user) && $this->user->is_objectshare) {
        $this->user = $this->user->objectshare->mailbox;
      }
    }
    try {
      // Calendar Mce
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
        $this->calendar = driver_mel::gi()->calendar([$this->user]);
        $this->calendar->id = $mbox;
        if (!$this->calendar->load()) {
          $this->calendar = null;
        }
      }
      if (!isset($this->user)) {
        $this->user = driver_mel::gi()->getUser();
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2calendar::__construct() Melanie2DatabaseException");
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
    if (!isset($this->calendar) || $this->calendar->owner != $this->user->uid)
      return false;
    try {
      $_share = driver_mel::gi()->share([$this->calendar]);
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
        if ($share->asRight(LibMelanie\Config\ConfigMelanie::PRIV)) {
          $acl[$share->name][] = "p";
        }
      }
      return $acl;
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2calendar::getAcl() Melanie2DatabaseException");
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
    mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] calendar::setAcl($user, $rights) mbox = " . $this->mbox);
    // Ajouter un hook lors du positionnement des ACLs
    $data = $this->rc->plugins->exec_hook('mce.setAcl_before', [
      'type'    => 'calendar',
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
    if (!isset($this->calendar) && !$this->createCalendar()) {
      return false;
    }
    if ($this->calendar->owner != $this->user->uid) {
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
      $share = driver_mel::gi()->share([$this->calendar]);
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
      if (in_array('p', $rights)) {
        // Droit privé
        $share->acl |= LibMelanie\Api\Defaut\Share::ACL_PRIVATE;
      }
      $ret = $share->save();
      // Ajouter un hook lors du positionnement des ACLs
      $data = $this->rc->plugins->exec_hook('mce.setAcl', [
        'type'    => 'calendar',
        'mbox'    => $this->mbox,
        'user'    => $user,
        'rights'  => $rights,
        'isgroup' => $this->group,
        'ret'     => !is_null($ret),
      ]);
      return $data['ret'];
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2calendar::setAcl() Melanie2DatabaseException");
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
    mel_logs::get_instance()->log(mel_logs::INFO, "[Resources] calendar::deleteAcl($user) mbox = " . $this->mbox);
    // Ajouter un hook lors du positionnement des ACLs
    $data = $this->rc->plugins->exec_hook('mce.deleteAcl_before', [
      'type'    => 'calendar',
      'mbox'    => $this->mbox,
      'user'    => $user,
      'isgroup' => $this->group,
      'abort'   => false,
    ]);
    // Si on doit annuler
    if ($data['abort']) {
      return false;
    }
    if (!isset($this->calendar) || $this->calendar->owner != $this->user->uid)
      return false;
    try {
      $share = driver_mel::gi()->share([$this->calendar]);
      $share->type = $this->group === true ? LibMelanie\Api\Defaut\Share::TYPE_GROUP : LibMelanie\Api\Defaut\Share::TYPE_USER;
      $share->name = $user;
      $ret = $share->delete();
      // Ajouter un hook lors du positionnement des ACLs
      $data = $this->rc->plugins->exec_hook('mce.deleteAcl', [
        'type'    => 'calendar',
        'mbox'    => $this->mbox,
        'user'    => $user,
        'isgroup' => $this->group,
        'ret'     => !is_null($ret),
      ]);
      return $data['ret'];
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2calendar::deleteAcl() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
  }

  /**
   * Méthode pour la création du calendrier
   *
   * @param string $name [optionnel]
   * @return boolean
   */
  public function createCalendar($name = null) {
    try {
      $this->calendar = driver_mel::gi()->calendar([$this->user]);
      if (! isset($name)) {
        $this->calendar->name = $this->user->fullname;
      }
      else {
        $this->calendar->name = $name;
      }
      $this->calendar->id = $this->mbox ?  : $this->user->uid;
      $this->calendar->owner = $this->user->uid;
      $ret = $this->calendar->save();
			if (!is_null($ret)) {
        return $this->calendar->load();
      }
      else {
        return false;
      }
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2calendar::createCalendar() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
    return false;
  }

  /**
   * Suppression du calendar
   */
  public function deleteCalendar() {
    if (isset($this->calendar) && isset($this->user) && $this->calendar->owner == $this->user->uid && $this->calendar->id != $this->user->uid) {
      // Parcour les évènements pour les supprimer
      $events = $this->calendar->getAllEvents();
      foreach ($events as $event) {
        $event->delete();
      }
      // Supprime le calendrier
      return $this->calendar->delete();
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
    if (! strlen($attrib['id'])) {
      $attrib['id'] = 'rcmresourceselementslist';
    }
    try {
      // Récupération des préférences de l'utilisateur
      $hidden_calendars = $this->rc->config->get('hidden_calendars', []);
      $sort_calendars = $this->rc->config->get('sort_agendas', []);
      // Parcour la liste des agendas
      $_calendars = $this->user->getSharedCalendars();
      $calendars = [];
      foreach ($_calendars as $calendar) {
        $calendars[$calendar->id] = [
          'name' => $calendar->owner == $this->user->uid ? $calendar->name : "(" . $calendar->owner . ") " . $calendar->name,
          'class' => $calendar->owner == $this->user->uid && $calendar->id != $this->user->uid ? ' personnal' : '',
        ];
        if (($order = array_search(driver_mel::gi()->mceToRcId($calendar->id), $sort_calendars)) !== false) {
          $calendars[$calendar->id]['order'] = $order;
        }
        else if ($calendar->owner == $this->user->uid) {
          if ($calendar->id == $this->user->uid) {
            $calendars[$calendar->id]['order'] = 1000;
          }
          else {
            $calendars[$calendar->id]['order'] = 2000;
            $calendars[$calendar->id]['class'] = ' personnal';
          }
        }
        else {
          $calendars[$calendar->id]['order'] = 3000;
        }
      }
      // MANTIS 0003913: Création automatique des objets dans Mes ressources
      if (!isset($calendars[$this->user->uid]) && $this->createCalendar()) {
        $calendars[$this->calendar->id] = [
          'name' => $this->calendar->name,
          'order' => 1000,
        ];
      }
      // Objet HTML
      $table = new html_table();
      $checkbox_subscribe = new html_checkbox(array('name' => '_show_resource_rc[]','title' => $this->rc->gettext('changesubscription'),'onclick' => "rcmail.command(this.checked ? 'show_resource_in_roundcube' : 'hide_resource_in_roundcube', this.value, 'calendar')"));

      // sort calendars
      uasort($calendars, function ($a, $b) {
        if ($a['order'] === $b['order'])
          return strcmp(strtolower($a['name']), strtolower($b['name']));
        else
          return strnatcmp($a['order'], $b['order']);
      });
      // Affichage des calendriers
      foreach ($calendars as $id => $value) {
        $name = $value['name'];
        $class = $value['class'];
        $table->add_row(array('id' => 'rcmrow' . driver_mel::gi()->mceToRcId($id), 'class' => 'calendar'.$class, 'foldername' => driver_mel::gi()->mceToRcId($id)));

        $table->add('name', $name);
        $table->add('subscribed', $checkbox_subscribe->show((!isset($hidden_calendars[$id]) ? $id : ''), array('value' => $id)));
      }
      // set client env
      $this->rc->output->add_gui_object('mel_resources_elements_list', $attrib['id']);

      return $table->show($attrib);
    }
    catch (LibMelanie\Exceptions\Melanie2DatabaseException $ex) {
      mel_logs::get_instance()->log(mel_logs::ERROR, "[Resources] M2calendar::createCalendar() Melanie2DatabaseException");
      return false;
    }
    catch (\Exception $ex) {
      return false;
    }
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
    $calid = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $options = array('type' => 'm2calendar','name' => $calid,'attributes' => array(0 => '\\HasNoChildren'),'namespace' => 'personal','special' => false,'rights' => array(0 => 'l',1 => 'r',2 => 's',3 => 'w',4 => 'i',5 => 'p',6 => 'k',7 => 'x',8 => 't',9 => 'e',10 => 'c',11 => 'd',12 => 'a'),'norename' => false,'noselect' => false,'protected' => true);

    $form = array();

    // Allow plugins to modify the form content (e.g. with ACL form)
    $plugin = $this->rc->plugins->exec_hook('acl_form_mel', array('form' => $form,'options' => $options));

    if (!$plugin['form']['sharing']['content']) {
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
    if (! $attrib['id']) {
      $attrib['id'] = 'rcmusersaclframe';
    }
    $attrib['name'] = $attrib['id'];
    $attrib['src'] = $this->rc->url(array('_action' => 'plugin.mel_calendar_acl','id' => $id,'framed' => 1));
    $attrib['width'] = '100%';
    $attrib['height'] = 275;
    $attrib['border'] = 0;
    $attrib['border'] = 'border:0';

    return $this->rc->output->frame($attrib);
  }

  public function restore_cal($attrib) {
    if (!$attrib['id']) {
      $attrib['id'] = 'rcmExportForm';
    }
    $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $hidden = new html_hiddenfield(array('name' => 'calendar','id' => 'event-export-calendar','value' => $id));
    $html .= $hidden->show();

    $select = new html_select(array('name' => 'range','id' => 'event-export-range'));
    $select->add(array($this->rc->gettext('all', 'calendar'),$this->rc->gettext('onemonthback', 'calendar'),$this->rc->gettext(array('name' => 'nmonthsback','vars' => array('nr' => 2)), 'calendar'),$this->rc->gettext(array('name' => 'nmonthsback','vars' => array('nr' => 3)), 'calendar'),$this->rc->gettext(array('name' => 'nmonthsback','vars' => array('nr' => 6)), 'calendar'),$this->rc->gettext(array('name' => 'nmonthsback','vars' => array('nr' => 12)), 'calendar'),$this->rc->gettext('customdate', 'calendar')), array(0,'1','2','3','6','12','custom'));

    $startdate = new html_inputfield(array('name' => 'start','size' => 11,'id' => 'event-export-startdate'));
    $html .= html::br();

    $html .= html::div('form-section', html::label('event-export-range', $this->rc->gettext('exportrange', 'calendar')) . $select->show(0) . html::span(array('style' => 'display:none'), $startdate->show()));

    $select = new html_select(array('name' => 'joursvg','id' => 'event-export-joursvg'));
    $select->add($this->rc->gettext('cal_j-1', 'mel_moncompte'), 'horde_1');
    $select->add($this->rc->gettext('cal_j-2', 'mel_moncompte'), 'horde_2');
    $select->add('', 'horde_n');
    $html .= html::br();
    $html .= html::div('form-section', html::label('event-export-bdd', $this->rc->gettext('cal_bdd_label', 'mel_moncompte')) . $select->show());

    $this->rc->output->add_gui_object('exportform', $attrib['id']);

    return html::tag('form', array('action' => $this->rc->url(array('task' => 'calendar','action' => 'export_events')),'method' => "post",'id' => $attrib['id']), $html);
  }

}

/**
 * Classes de gestion des ressources d'agendas Mél dans Roundcube
 *
 * @author Thomas Payen <thomas.payen@i-carre.net> / PNE Messagerie MEDDE
 */
class M2calendargroup extends M2calendar {
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
    $calid = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GPC);
    $options = array('type' => 'm2calendargroup','name' => $calid,'attributes' => array(0 => '\\HasNoChildren'),'namespace' => 'personal','special' => false,'rights' => array(0 => 'l',1 => 'r',2 => 's',3 => 'w',4 => 'i',5 => 'p',6 => 'k',7 => 'x',8 => 't',9 => 'e',10 => 'c',11 => 'd',12 => 'a'),'norename' => false,'noselect' => false,'protected' => true);

    $form = array();

    // Allow plugins to modify the form content (e.g. with ACL form)
    $plugin = $this->rc->plugins->exec_hook('acl_form_mel', array('form' => $form,'options' => $options));

    if (!$plugin['form']['sharing']['content']) {
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
    $attrib['src'] = $this->rc->url(array('_action' => 'plugin.mel_calendar_acl_group','id' => $id,'framed' => 1));
    $attrib['width'] = '100%';
    $attrib['height'] = 275;
    $attrib['border'] = 0;
    $attrib['border'] = 'border:0';

    return $this->rc->output->frame($attrib);
  }
}
