<?php
/**
 * Plugin Annuaire
 *
 * Driver pour le plugin Annuaire
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
require_once __DIR__ . '/default/default.php';
// Chargement de la librairie ORM
@include_once 'includes/libm2.php';

use LibMelanie\Ldap\Ldap as Ldap;

class driver_annuaire {
  /**
   * Singleton
   *
   * @var driver_annuaire
   */
  private static $driver;
  /**
   *
   * @var rcmail
   */
  protected $rc;

  /**
   *
   * @var Ldap
   */
  protected $ldap;

  /**
   *
   * @var string
   */
  protected $server;

  /**
   *
   * @var string
   */
  protected $base_dn;

  /**
   *
   * @var string
   */
  protected $filter;

  /**
   *
   * @var string
   */
  protected $source;

  /**
   *
   * @var string
   */
  protected $alias;

  /**
   * Return the singleton instance
   *
   * @return driver_annuaire
   */
  public static function get_instance() {
    if (!isset(self::$driver)) {
      $drivername = strtolower(rcmail::get_instance()->config->get('annuaire_driver', 'default'));
      require_once $drivername . '/' . $drivername . '.php';
      $drivername = $drivername . "_driver_annuaire";
      self::$driver = new $drivername();
    }
    return self::$driver;
  }

  /**
   * Constructeur par défaut du driver
   */
  public function __construct() {
    // Get rcmail instance
    $this->rc = rcmail::get_instance();

    // Get serveur
    $this->server = LibMelanie\Config\Ldap::$AUTOCOMPLETE_LDAP;

    // Get instance LDAP from ORM
    $this->ldap = Ldap::GetInstance($this->server);
  }
  /**
   * Setter pour $base_dn
   *
   * @param string $base_dn
   */
  public function setBaseDn($base_dn) {
    $this->base_dn = $base_dn;
  }
  /**
   * Getter pour $base_dn
   *
   * @return string
   */
  public function getBaseDn() {
    return $this->base_dn;
  }
  /**
   * Issetter pour base_dn
   *
   * @return boolean
   */
  public function issetBaseDn() {
    return isset($this->base_dn);
  }

  /**
   * Setter pour $source
   *
   * @param string $source
   */
  public function setSource($source) {
    $this->source = $source;
  }
  /**
   * Getter pour $source
   *
   * @return string
   */
  public function getSource() {
    return $this->source;
  }
  /**
   * Issetter pour $source
   *
   * @return boolean
   */
  public function issetSource() {
    return isset($this->source);
  }

  /**
   * Setter pour $alias
   *
   * @param string $alias
   */
  public function setAlias($alias) {
    $this->alias = $alias;
  }
  /**
   * Getter pour $alias
   *
   * @return string
   */
  public function getAlias() {
    return $this->alias;
  }
  /**
   * Issetter pour $alias
   *
   * @return boolean
   */
  public function issetAlias() {
    return isset($this->alias);
  }

  /**
   * Set the filter from the search and the config
   *
   * @param string $search
   *          The string to search
   */
  public function get_filter_from_search($search = null) {
    return null;
  }

  /**
   * Get recursive elements from $this->base_dn to $find
   *
   * @param string $find
   *          DN to find
   * @return array
   */
  public function get_recurse_elements($find) {
    return [];
  }

  /**
   * Get elements to an array based on base_dn and filter
   *
   * @return array
   */
  public function get_elements($search = false) {
    return [];
  }
  
  /**
   * Retourne le contenu html d'un objet
   *
   * @param array $object
   * @return string
   */
  public function get_html($object)
  {
    $content = html::span([
        'id' => 'l:' . $object['id'],
        'class' => 'name',
        'title' => $object['title']
    ], $object['name']);
    $content .= html::span([
        'class' => 'description'
    ], $object['description']);
    if ($object['gototree']) {
      $content .= html::div([
          'class' => 'gototree button',
          'title' => $this->rc->gettext('gototree', 'annuaire'),
          'onclick' => rcmail_output::JS_OBJECT_NAME . '.annuaire_gototree(this, event); return false'
      ], $this->rc->gettext('gototreename', 'annuaire'));
    }
    return $content;
  }
}