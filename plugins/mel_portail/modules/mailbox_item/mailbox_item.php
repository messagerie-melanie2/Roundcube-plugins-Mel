<?php
/**
 * Module Mailbox_item pour le portail Mél
 *
 * Portail web
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

class Mailbox_item extends Module {
  /**
   * Mapping entre les champs items et ceux du form
   */
  protected $mappingFields = [
    'mailbox' => 'item_mailbox_item_mailbox',
    'name' => 'item_mailbox_item_name',
    'tooltip' => 'item_mailbox_item_tooltip',
    'description' => 'item_mailbox_item_description',
    'flip' => 'item_mailbox_item_flip',
    'newtab' => 'item_mailbox_item_newtab',
    'width' => 'item_mailbox_item_width',
    'provenance' => 'item_mailbox_item_provenance',
  ];

  /**
   * Liste des champs obligatoires
   */
  protected $requiredFields = ['mailbox', 'name'];

  /**
   * Handler HTML dédié au module
   */
  public function settings_handler($attrib) {
    $item = $this->rc->output->get_env('personal_item');
    return $this->settings_table(['mailbox', 'name', 'tooltip', 'description', 'width', 'provenance'], $item, '_mailbox_item', !$item['personal']);
  }

  /**
   * Call setting_row from prop
   */
  protected function setting_prop(&$table, $prop, $item, $submodule = null, $readonly = false) {
    if ($readonly) {
      $this->setting_row($table, $prop, $item, null, 'readonly', $submodule);
    }
    else if ($prop == 'mailbox') {
        $select = new html_select(['id' => '_item_mailbox_item_mailbox', 'name' => 'item_mailbox_item_mailbox']);
        $select->add(driver_mel::gi()->getUser()->fullname, "?_task=mail&_mbox=INBOX");
        $mailboxes = driver_mel::gi()->getUser()->getObjectsShared();
        if (is_array($mailboxes) && !empty($mailboxes)) {
          // trier la liste
          usort($mailboxes, function($a, $b) {
            return strcmp($a->fullname, $b->fullname);
          });
          foreach ($mailboxes as $mailbox) {
            $cn = $mailbox->fullname;
            $uid = urlencode($mailbox->uid);
            if (isset($mailbox->mailbox)) {
              // Récupération de la configuration de la boite pour l'affichage
              $hostname = driver_mel::get_instance()->getRoutage($mailbox->mailbox);
              if (isset($hostname)) {
                $uid = urlencode($uid . "@" . $hostname);
              }
              $cn = $mailbox->mailbox->fullname;
            }
            // Récupération de la mbox pour une balp depuis le driver
            $mbox = driver_mel::get_instance()->getMboxFromBalp($mailbox->mailbox->uid);
            if (isset($mbox)) {
              $href = "?_task=mail&_mbox=" . urlencode($mbox) . "&_account=" . $uid;
            }
            else {
              $href = "?_task=mail&_account=" . $uid;
            }
            $select->add($cn, $href);
          }
        }
        
        $html = $this->setting_row($table, $prop, $item, $select->show($item[$prop] ?: ''), '', $submodule);
    }
    else {
        $html = parent::setting_prop($table, $prop, $item, $submodule);
    }
    return $html;
  }

  /**
   * Génère un item html en fonction des propriétés
   * 
   * @param array $attrib
   * @param array $item
   * @param string $user_dn
   * @return string HTML
   */
  public function item_html($attrib, &$item, $user_dn) {
    if (isset($item['mailbox'])) {
      $item['url'] = $item['mailbox'];
      $item['feedUrl'] = $item['mailbox'];
    }
    return parent::item_html($attrib, $item, $user_dn);
  }
}


