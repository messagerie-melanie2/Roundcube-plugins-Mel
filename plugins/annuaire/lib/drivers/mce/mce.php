<?php 
/**
 * Plugin Annuaire
 *
 * Driver par defaut pour le plugin Annuaire
 *
 * Permet d'afficher l'annuaire de Mél dans l'interface des contacts
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
include_once __DIR__.'/../default/default.php';

class mce_driver_annuaire extends default_driver_annuaire {
  /**
   * Order the elements list from the ldap
   *
   * Needs :
   * 'id' => Unique identifier,
   * 'dn' => DN of element,
   * 'email' => Email of element,
   * 'mail' => Formatted email + name,
   * 'classes' => List of classes (Possibles : object or folder, list, person, application, service, unit, function, resource),
   * 'order' => Sort order,
   * 'html' => HTML shown (use get_html method)
   *
   * @param array $infos
   * @return array Array of elements
   */
  protected function order_elements($infos, $search) {
    $elements = [];
    
    foreach ($infos as $info) {
      $name = '';
      $description = '';
      $class = '';
      $order = '';
      $title = '';
      // Vérifier si l'entrée est un alias
      if (!$search 
          && isset($info['seealso']) 
          && $key = array_search($this->base_dn, $info['seealso']) !== false) {
        $id = rcube_ldap::dn_encode($info['dn']) . '-' . $this->source . '-alias' . $key;
      }
      else {
        $id = rcube_ldap::dn_encode($info['dn']) . '-' . $this->source;
      }
      if (isset($this->alias)) {
        $id .= '-' . $this->alias;
      }
      foreach ($info['objectclass'] as $k => $v) {
        switch ($v) {
          case 'list' :
            $name = $info['cn'][0];
            $email = $info['mail'][0];
            $title = $name;
            $order = $name;
            $class = 'list';
            // 0005526: Dans la gestion des droits agendas/carnets se limiter aux posixGroup
            if (in_array('posixGroup', $info['objectclass'])) {
              $class .= ' group';
            }
            $html = $this->get_html([
                'name' => $name,
                'description' => $description,
                'class' => $class,
                'title' => $title,
                'gototree' => $search
            ]);
            // Ajout de la class search si le bouton goto tree est présent
            if ($search) {
              $class .= ' search';
            }
            $elements[] = array(
                'id' => $id,
                'dn' => $info['dn'],
                'email' => $email,
                'mail' => format_email_recipient($email, $name),
                'classes' => [
                    $class,
                    'object'
                ],
                'order' => $order,
                'html' => $html
            );
            break;
          case 'organizationalUnit' :
            $name = $info['cn'][0];
            if (empty($name)) {
              $name = $info['description'][0];
            }
            $title = $name;
            if (strpos($name, ' (')) {
              $name = explode(' (', trim($name), 2);
              $description = substr($name[1], 0, strlen($name[1]) - 1);
              $name = $name[0];
            }
            $order = $name;
            $class = 'folder';
            $html = $this->get_html([
                'name' => $name,
                'description' => $description,
                'class' => $class,
                'title' => $title,
                'gototree' => $search
            ]);
            // Ajout de la class search si le bouton goto tree est présent
            if ($search) {
              $class .= ' search';
            }
            $elements[] = array(
                'id' => $id,
                'dn' => $info['dn'],
                'classes' => [
                    $class
                ],
                'order' => $order,
                'collapsed' => true,
                'html' => $html,
                'children' => [
                    [
                        'id' => $id . '-child',
                        'classes' => [
                            'child'
                        ],
                        'html' => '<span></span>'
                    ]
                ]
            );
            break;
          case 'person' :
          case 'mceCompte':
            $name = $info['cn'][0];
            $email = $info['mail'][0];
            $uid = $info['uid'][0];
            $title = $name;
            $order = $name;
            $class = 'person nophoto';
            $html = $this->get_html([
                'name' => $name,
                'description' => $description,
                'class' => $class,
                'title' => $title,
                'gototree' => $search
            ]);
            // Ajout de la class search si le bouton goto tree est présent
            if ($search) {
              $class .= ' search';
            }
            $elements[] = array(
                'id' => $id,
                'uid' => $uid,
                'dn' => $info['dn'],
                'email' => $email,
                'mail' => format_email_recipient($email, $name),
                'classes' => [
                  $class,
                  'object'
                ],
                'order' => $order,
                'html' => $html
            );
            break;
        }
      }
    }
    return $elements;
  }
}