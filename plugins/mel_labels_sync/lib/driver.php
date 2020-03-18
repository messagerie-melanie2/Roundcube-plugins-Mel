<?php
/**
 * Plugin Mél Labels Sync
 *
 * Classe de driver pour les accès vers la base Mél
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

// Chargement de la librairie ORM
@include_once 'includes/libm2.php';

/**
 * Classe de gestion du driver vers Mél, pour la récupération, modification des étiquettes
 *
 */
class Driver {
  /**
   * Scope
   */
  const PREF_SCOPE = 'cm2tags';
  /**
   * Name
   */
  const PREF_NAME = 'etiquette';

  /**
   * Durée de conservation des labels dans le cache
   *
   * @var int
   */
  const CACHE_LABELS = 4*60*60;

  /**
   * Gestion du cache pour les étiquettes par utilisateur
   * @var array
   */
  private $_labels_cache;
  /**
   * Instance singleton
   * @var Driver
   */
  private static $_instance;

  function __construct() {
    $this->_labels_cache = [];
  }

  /**
   * Récupération de l'instance
   * @return Driver
   */
  public static function get_instance() {
    self::$_instance = new self();
    return self::$_instance;
  }
  /**
   * Permet de recherche un label dans le tableau en fonction de sa clé
   * @param string $key
   * @param Label[] $labels
   * @return Label
   */
  public static function find_label_by_key($key, $labels) {
    $key = strtolower($key);
    foreach ($labels as $label) {
      if ($key == $label->key || "$".$key == $label->key) {
        return $label;
      }
    }
    return null;
  }
  /**
   * Permet de recherche un label dans le tableau en fonction de son tag
   * @param string $tag
   * @param Label[] $labels
   * @return Label
   */
  public static function find_label_by_tag($tag, $labels) {
    foreach ($labels as $label) {
      if ($tag == $label->tag) {
        return $label;
      }
    }
    return null;
  }
  /**
   * Retourne un boolean pour savoir si le label exist déjà
   * La recherche n'est pas case sensitive pour simplifier les résultats
   * @param string $key
   * @param string $tag
   * @param Label[] $labels
   * @return boolean
   */
  public static function if_label_exists($key, $tag, $labels) {
    foreach ($labels as $label) {
      if (strtolower($key) == strtolower($label->key) || strtolower($tag) == strtolower($label->tag)) {
        return true;
      }
    }
    return false;
  }


  /**
   * Récupération des étiquettes de l'utilisateur
   * @param string $username
   * @return Label[]
   */
  public function get_user_labels($username) {
    if (isset($this->_labels_cache[$username])) {
      return $this->_labels_cache[$username];
    }
    else {
      // Lecture depuis le cache
      $cache = \mel::InitM2Cache();
      if (isset($cache['labels']) && time() - $cache['labels']['time'] <= self::CACHE_LABELS) {
        $this->_labels_cache = unserialize($cache['labels']['list']);
      }
      else {
        $this->_labels_cache = [];
      }
      if (!isset($this->_labels_cache[$username])) {
        $pref = new LibMelanie\Api\Melanie2\UserPrefs(null);
        $pref->scope = self::PREF_SCOPE;
        $pref->name = self::PREF_NAME;
        $pref->user = $username;
        $ret = $pref->load();
        if (!$ret || empty($pref->value) || $pref->value == "[]") {
          $labels = [];
        }
        else {
          $labels = $this->_m2_to_rc($pref->value);
        }
        if (!$this->_add_defaults_labels($pref, $labels)) {
          return array();
        }
        if ($username == rcmail::get_instance()->user->get_username()) {
          $labels = $this->_load_old_tags($labels);
        }
        $this->_labels_cache[$username] = $this->order_labels($labels);      
        $cache['labels'] = array('time' => time(),'list' => serialize($this->_labels_cache));
        \mel::SetM2Cache($cache);
      }
      return $this->_labels_cache[$username];
    }
  }
  
  /**
   * Création/modification des étiquettes d'un utilisateur
   * @param string $username
   * @param Label[] $labels
   * @return boolean
   */
  public function modify_user_labels($username, $labels) {
    $pref = new LibMelanie\Api\Melanie2\UserPrefs(null);
    $pref->scope = self::PREF_SCOPE;
    $pref->name = self::PREF_NAME;
    $pref->value = $this->_rc_to_m2($labels);
    $pref->user = $username;
    $ret = $pref->save();
    if (!is_null($ret)) {
      if (!empty($labels)) {
        $this->_labels_cache[$username] = $labels;
      }
      else {
        unset($this->_labels_cache[$username]);
      }
      // Mettre à jour le cache
      $cache = \mel::InitM2Cache();
      if (isset($cache['labels'])) {
        $this->_labels_cache[$username] = $this->order_labels($this->_labels_cache[$username]);
        $cache['labels']['list'] = serialize($this->_labels_cache);
        \mel::SetM2Cache($cache);
      }
      return true;
    }
    return false;
  }
  /**
   * Permet de supprimer toutes les étiquettes d'un utilisateur
   * @param string $username
   * @return boolean
   */
  public function remove_user_labels($username) {
    $pref = new LibMelanie\Api\Melanie2\UserPrefs(null);
    $pref->scope = self::PREF_SCOPE;
    $pref->name = self::PREF_NAME;
    $pref->user = $username;
    unset($this->_labels_cache[$username]);
    if ($pref->load()) {
      if ($pref->delete()) {
        // Mettre à jour le cache
        $cache = \mel::InitM2Cache();
        if (isset($cache['labels'])) {
          $cache['labels']['list'] = serialize($this->_labels_cache);
          \mel::SetM2Cache($cache);
        }
      }
    }
    return true;
  }
  
  /**
   * Permet de trier la liste des étiquettes de façon alphabetique sur la clé (comportement du courrielleur)
   *
   * @param array $labels_list
   * @return array Liste d'étiquettes triée
   */
  public function order_labels($labels) {
    usort($labels, function ($a, $b) {
      return ($a->key < $b->key) ? -1 : 1;
    });
      return $labels;
  }
  
  /**
   * Permet de charger les anciens labels depuis la configuration de Roundcube
   * La configuration est ensuite vidée pour éviter les doublons
   * @param Label[] $labels
   * @return Label[]
   */
  protected function _load_old_tags($labels) {
    $old_tags = rcmail::get_instance()->config->get('labels_list', array());
    if (!empty($old_tags)) {
      // Parcours les anciens tags pour l'ajout aux nouveaux
      $hasChanged = false;
      foreach ($old_tags as $old_tag_key => $old_tag) {
        if (!isset($old_tag['default']) || !$old_tag['default']) {
          if (!self::if_label_exists($old_tag_key, $old_tag['name'], $labels)) {
            $labels[] = Label::withProp($old_tag_key, $old_tag['name'], $old_tag['color'], '');
            $hasChanged = true;
          }
        }
      }
      // Suppression des anciens tags dans les prefs utilisateur
      rcmail::get_instance()->user->save_prefs(array('labels_list' => null));
      // Si les nouveaux tags ont changé, on les enregistre
      if ($hasChanged) {
        $this->modify_user_labels(rcmail::get_instance()->user->get_username(), $labels);
      }
    }
    return $labels;
  }

  /**
   * Méthode de conversion des étiquettes Roundcube vers Mél
   * @param array $rc_labels
   * @return string
   */
  protected function _rc_to_m2($rc_labels) {
    $_m2_labels = array();

    foreach ($rc_labels as $_rc_label) {
      $_m2_labels[] = $_rc_label->render();
    }

    return json_encode($_m2_labels);
  }
  /**
   * Méthode de conversion des étiquettes Mél vers Roundcube
   * @param array $m2_labels
   * @return Label[]
   */
  protected function _m2_to_rc($m2_labels) {
    $_rc_labels = array();
    $_ex_m2_labels = json_decode($m2_labels);

    foreach ($_ex_m2_labels as $_m2_label) {
      $_rc_label = Label::withArray($_m2_label);

      if (isset($_rc_label->ordinal) && !empty($_rc_label->ordinal)) {
        $_rc_labels[$_rc_label->ordinal] = $_rc_label;
      }
      else {
        $_rc_labels[] = $_rc_label;
      }
    }

    return $_rc_labels;
  }
  
  /**
   * Création des étiquettes par défaut si elles n'existent pas
   * @param LibMelanie\Api\Melanie2\UserPrefs $pref
   * @param array $current_labels
   * @return boolean
   */
  protected function _add_defaults_labels(&$pref, &$current_labels) {
    $default_labels = rcmail::get_instance()->config->get('default_labels');
    $save = false;
    $ret = true;
    
    foreach ($default_labels as $default_label) {
      if (!$label = $this->find_label_by_key($default_label['key'], $current_labels)) {
        $label = Label::withArray($default_label);
        if (isset($label->ordinal) && !empty($label->ordinal)) {
          $current_labels[$label->ordinal] = $label;
        }
        else {
          $current_labels[] = $label;
        }
        $save = true;
      }
    }
    
    if ($save) {
      $pref->value = $this->_rc_to_m2($current_labels);
      $ret = $pref->save();
      $ret = !is_null($ret);
    }
    return $ret;
  }  
}