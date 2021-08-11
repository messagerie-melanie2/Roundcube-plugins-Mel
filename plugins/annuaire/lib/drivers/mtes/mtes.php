<?php
/**
 * Plugin Annuaire
 *
 * Driver MTES pour le plugin Annuaire
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
class mtes_driver_annuaire extends default_driver_annuaire {
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
      'mineqportee',
      'mineqtypeentree',
      'mineqordreaffichage',
      'mineqpublicationphotointranet',
      'mailpr',
      'uid',
      'seealso'
  ];

  /**
   * Specific constructor for MTES
   */
  public function __construct() {
    parent::__construct();
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
    $folders = [];
    $lists = [];
    $persons = [];
    $applications = [];
    $services = [];
    $functions = [];
    $units = [];
    $resources = [];

    foreach ($infos as $info) {
      if (isset($info['mineqportee']) && ($info['mineqportee'][0] == '00')) {
        continue;
      } else if (isset($info['mineqportee']) && ($info['mineqportee'][0] == '20')) {
        // Recuperation des services de l'utilisateur
        if (!isset($_SESSION['annuaire_user_services'])) {
          $_SESSION['annuaire_user_services'] = $this->get_user_services($this->rc->user->get_username());
        }
        // Avec une portée de 20, on doit vérifier qu'au moins un des services de l'utilisateur correspond
        $foundService = false;
        foreach ($_SESSION['annuaire_user_services'] as $service) {
          if (strpos($info['dn'], $service) !== false) {
            $foundService = true;
            break;
          }
        }
        if (!$foundService) {
          continue;
        }
      }
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
          case 'mineqMelListe' :
          case 'mineqMelListeAbonnement' :
            $name = $info['cn'][0];
            $email = $info['mailpr'][0];
            $title = $name;
            $order = isset($info['mineqordreaffichage'][0]) ? $info['mineqordreaffichage'][0] . $name : $name;
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
            $lists[] = array(
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
            $order = isset($info['mineqordreaffichage'][0]) ? $info['mineqordreaffichage'][0] . $name : $name;
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
            $folders[] = array(
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
          case 'mineqMelBoite' :
          case 'mineqMelDP' :
            $name = $info['cn'][0];
            $email = $info['mailpr'][0];
            $uid = $info['uid'][0];
            $title = '[' . $info['mineqtypeentree'][0] . '] ' . $name;
            $order = isset($info['mineqordreaffichage'][0]) ? $info['mineqordreaffichage'][0] . $name : $name;
            switch ($info['mineqtypeentree'][0]) {
              case 'BALI' :
              default :
                if (isset($info['mineqpublicationphotointranet'][0]) && $info['mineqpublicationphotointranet'][0]) {
                  $class = 'person';
                } else {
                  $class = 'person nophoto';
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
                $persons[] = array(
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
              case 'BALA' :
                $class = 'application';
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
                $applications[] = array(
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
              case 'BALS' :
                $class = 'service';
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
                $services[] = array(
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
              case 'BALF' :
                $class = 'function';
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
                $functions[] = array(
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
              case 'BALU' :
                $class = 'unit';
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
                $units[] = array(
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
              case 'BALR' :
                $class = 'resource';
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
                $resources[] = array(
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
            break;
        }
      }
    }

    // Sort folders by name
    usort($folders, function ($a, $b) {
      return strtolower($a['order']) > strtolower($b['order']);
    });
    // Sort lists by name
    usort($lists, function ($a, $b) {
      return strtolower($a['order']) > strtolower($b['order']);
    });
    // Sort persons by name
    usort($persons, function ($a, $b) {
      return strtolower($a['order']) > strtolower($b['order']);
    });
    // Sort applications by name
    usort($applications, function ($a, $b) {
      return strtolower($a['order']) > strtolower($b['order']);
    });
    // Sort services by name
    usort($services, function ($a, $b) {
      return strtolower($a['order']) > strtolower($b['order']);
    });
    // Sort functions by name
    usort($functions, function ($a, $b) {
      return strtolower($a['order']) > strtolower($b['order']);
    });
    // Sort units by name
    usort($units, function ($a, $b) {
      return strtolower($a['order']) > strtolower($b['order']);
    });
    // Sort resources by name
    usort($resources, function ($a, $b) {
      return strtolower($a['order']) > strtolower($b['order']);
    });
    return array_merge($folders, $persons, $services, $functions, $units, $resources, $applications, $lists);
  }
  /**
   * **** PRIVATE ***
   */
  /**
   * Récupère les services associés à l'utilisateur
   * Il y a au moins un service lié au DN
   * Il peut y avoir d'autres service dans le cas d'alias (seeAlso)
   *
   * @param string $uid
   *            Uid de l'utilisateur
   * 
   * @return array Liste des services
   */
  private function get_user_services($uid)
  {
    // Récupération du DN en fonction de l'UID
    $user_infos = LibMelanie\Ldap\Ldap::GetUserInfos($uid, null, ['dn', 'seeAlso']);
    if (isset($user_infos['seealso'])) {
      $dns = array_merge([$user_infos['dn']], $user_infos['seealso']);
    }
    else {
      $dns = [$user_infos['dn']];
    }
    $services = [];
    // Parcourir tous les dn pour trouver tous les services associés
    foreach ($dns as $base_dn) {
      $base_dn = substr($base_dn, strpos($base_dn, ',') + 1);
      // Initialisation du filtre LDAP
      $base_filter = "(mineqTypeEntree=NSER)";
      // Récupération de l'instance depuis l'ORM
      $ldap = LibMelanie\Ldap\Ldap::GetInstance(LibMelanie\Config\Ldap::$SEARCH_LDAP);
      if ($ldap->anonymous()) {
        do {
          $tmp = explode(',', $base_dn, 2);
          $filter = "(&(" . $tmp[0] . ")$base_filter)";
          $base_dn = $tmp[1];
          // Search LDAP
          $result = $ldap->ldap_list($base_dn, $filter, [
              'cn'
          ]);
        } while ((!isset($result) || $ldap->count_entries($result) === 0) && strpos($base_dn, 'ou=') === 0);
        if (isset($result) && $ldap->count_entries($result) == 1) {
          $infos = $ldap->get_entries($result);
          $services[] = $infos[0]['dn'];
        }
      }
    }
    return $services;
  }
}