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
class default_driver_annuaire extends driver_annuaire {
  /**
   * Liste des attributs nécessaire pour les objets
   *
   * @var array
   */
  protected $attributes = [
      'objectclass',
      'ou',
      'cn',
      'description',
      'mail',
      'uid',
      'seealso'
  ];
  
  /**
   * Set the filter from the search and the config
   *
   * @param string $search
   *          The string to search
   */
  public function get_filter_from_search($search = null) {
    if (!isset($search) || empty($search) || strlen($search) < 3) {
      $this->filter = $this->rc->config->get('annuaire_default_filter', 'objectclass=*');
    } else {
      if (is_numeric($search) || strpos($search, '+33') === 0) {
        $search = trim(str_replace('+33', '', $search));
        if (strlen($search) === 10 && strpos($search, '0') === 0) {
          $search = substr($search, 1);
        }
        $this->filter = "(|(telephonenumber=*$search)(mobile=*$search))";
      } else {
        $searchFields = $this->rc->config->get('annuaire_search_fields', ['cn', 'mail']);
        // MANTIS 0006198: Recherche approximative pour les Contacts ministériels
        $searchFilter = $this->rc->config->get('annuaire_search_filter', '%%filter%%');
        // MANTIS 0006197: Passer la recherche sur mail à un égal au lieu de commence par
        $searchEqualFields = $this->rc->config->get('annuaire_search_equal_fields', []);
        if (!is_array($searchEqualFields)) {
          $searchEqualFields = [$searchEqualFields];
        }
        if (is_array($searchFields)) {
          $filter = "";
          foreach ($searchFields as $field) {
            if (in_array($field, $searchEqualFields)) {
              $filter .= "($field=$search)";
            }
            else {
              $filter .= "($field=$search*)";
            }
            
          }
          // Rechercher si on est déjà dans un OU
          if (strpos($searchFilter, '(|(') === 0) {
            $this->filter = str_replace('%%filter%%', "$filter", $searchFilter);
          }
          else {
            $this->filter = str_replace('%%filter%%', "(|$filter)", $searchFilter);
          }
        }
        else if (in_array($searchFields, $searchEqualFields)) {
          $this->filter = str_replace('%%filter%%', "$searchFields=$search", $searchFilter);
        }
        else {
          $this->filter = str_replace('%%filter%%', "$searchFields=$search*", $searchFilter);
        }
      }
    }
  }
  
  /**
   * Get recursive elements from $this->base_dn to $find
   *
   * @param string $find
   *          DN to find
   * @return array
   */
  public function get_recurse_elements($find) {
    $_elements = $this->get_elements();
    
    // Parcours les elements pour trouver le bon
    foreach ($_elements as $key => $_element) {
      if ($find === $_element['dn']) {
        return $_elements;
      } else if (in_array('folder', $_element['classes']) && strpos($find, $_element['dn']) !== false) {
        $this->base_dn = $_element['dn'];
        $_elements[$key]['children'] = $this->get_recurse_elements($find);
        $_elements[$key]['collapsed'] = false;
        break;
      }
    }
    return $_elements;
  }
  
  /**
   * Get elements to an array based on base_dn and filter
   *
   * @return array
   */
  public function get_elements($search = false) {
    $elements = [];
    
    $this->ldap->anonymous();
    if ($search) {
      $sr = $this->ldap->search($this->base_dn, $this->filter, $this->attributes, 0, 100);
    } else {
      $sr = $this->ldap->list_alias($this->base_dn, $this->filter, $this->attributes);
    }
    
    if ($sr !== false) {
      $infos = $this->ldap->get_entries($sr);
      unset($infos['count']);
      $elements = $this->order_elements($infos, $search);
    }
    return $elements;
  }
  
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