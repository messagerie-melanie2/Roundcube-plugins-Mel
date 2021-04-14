<?php
/**
 * Plugin Mél Labels Sync
 *
 * Classe de définition d'une étiquette
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
 * Classe Label pour la défintion d'une étiquette
 *
 * @property string $key Identifiant de l'étiquette
 * @property string $tag Libellé de l'étiquette
 * @property string $color Code couleur de l'étiquette
 * @property string $ordinal Classement de l'étiquette
 * @property string $mailbox Boite associée au label
 *
 */
class Label {
  /**
   * Identifiant de l'étiquette
   * @var string
   */
  private $key;
  /**
   * Libellé de l'étiquette
   * @var string
   */
  private $tag;
  /**
   * Code couleur de l'étiquette
   * @var string
   */
  private $color;
  /**
   * Classement de l'étiquette
   * @var string
   */
  private $ordinal;
  /**
   * Boite associée au label
   * @var string
   */
  private $mailbox;

  /**
   * Setter des propriétés
   * @param string $prop Nom de la prop : key | tag | color | ordinal | mailbox
   * @param mixed $value
   */
  function __set($prop, $value) {
    $this->$prop = $value;
  }
  /**
   * Getter des propriétés
   * @param string $prop Nom de la prop : key | tag | color | ordinal | mailbox
   * @return mixed
   */
  function __get($prop) {
    return $this->$prop ?: null;
  }
  /**
   * Isset pour une propriété
   * @param string $prop Nom de la prop : key | tag | color | ordinal | mailbox
   */
  function __isset($prop) {
    return isset($this->$prop);
  }

  /**
   * Rendu de l'étiquette sous forme de tableau pour la génération en json
   * @return array
   */
  public function render() {
    return ['key' => $this->key, 'tag' => $this->tag, 'color' => $this->color, 'ordinal' => $this->ordinal];
  }

  /**
   * Initialisation d'une instance d'étiquette à partir d'un tableau
   * @param array $array
   * @return Label
   */
  public static function withArray($array) {
    $instance = new self();
    $instance->initFromArray($array);
    return $instance;
  }
  /**
   * Initialisation d'une instance d'étiquette à partir des propriétés
   * @param string $key
   * @param string $tag
   * @param string $color
   * @param string $ordinal
   * @param string $mailbox
   * @return Label
   */
  public static function withProp($key = '', $tag = '', $color = '', $ordinal = '', $mailbox = '') {
    $instance = new self();
    $instance->initFromArray(['key' => $key, 'tag' => $tag, 'color' => $color, 'ordinal' => $ordinal, 'mailbox' => $mailbox]);
    return $instance;
  }

  /**
   * Initialisation d'une étiquette depuis un tableau
   * @param array $label
   */
  protected function initFromArray($label) {
    if (is_array($label)) {
      $this->key = $label['key'] ?: '';
      $this->tag = $label['tag'] ?: '';
      $this->color = $label['color'] ?: '';
      $this->ordinal = $label['ordinal'] ?: '';
      $this->mailbox = $label['mailbox'] ?: '';
    }
    else {
      $this->key = $label->key ?: '';
      $this->tag = $label->tag ?: '';
      $this->color = $label->color ?: '';
      $this->ordinal = $label->ordinal ?: '';
      $this->mailbox = $label->mailbox ?: '';
    }
  }
  
  /**
   * Passage en string pour les comparaisons
   * @return string
   */
  public function __toString() {
  	if (is_string($this->key))
  		return $this->key;
  	else 
  		return '';
  }
}