<?php 
class HtmlBlock {
  private $_template;
  private $_other_variables;
  private $_parsed_template;

  public function __construct($template) {
    $this->_template = $template;  
  }

  public function raw_template() {
    if (!isset($this->_parsed_template)) $this->_parsed_template = rcmail::get_instance()->output->parse($this->_template, false, false);

    return $this->_parsed_template;
  }

  private function _is_in_template($prop) {
    return strpos($this->raw_template(), "<<$prop/>>") !== false   || 
           strpos($this->raw_template(), "<< $prop/>>") !== false  || 
           strpos($this->raw_template(), "<<$prop />>") !== false  || 
           strpos($this->raw_template(), "<< $prop />>") !== false  ;
  }

  /**
   * Methode magique __set()
   *
   * @param string $property Nom de la propriété
   * @param mixed $value Valeur à affecter à la propriété
   * @return void
   */
  public function __set($property, $value)
  {
    if ($this->_is_in_template($property))
    {
      if (preg_match('/^[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/',$property)) $this->$property = $value;
      else {
        if (!isset($this->_other_variables)) $this->_other_variables = [];

        $this->_other_variables[$property] = $value;
      }
    }
    else throw new Exception("Propriété invalide !", 1);
  }

  /**
   * Methode magique __get()
   *
   * Retourne la valeur de la propriété appelée
   *
   * @param string $property
   * @throws Exception
   */
  public function __get($property) {
    if ($this->_is_in_template($property))
    {
      if (preg_match('/^[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*$/',$property)) return $this->$property;
      else if (!isset($this->_other_variables)) return null;
      else return $this->_other_variables[$property];
    }
    else throw new Exception("Propriété invalide !", 1);
  }

  public function set_other_variable($name, $value) {
    return $this->$name = $value;
  }

  public function get_other_varaible($name) {
    return $this->$name;
  }

  public function parse(){
    $template = $this->raw_template();
    $this->_parsed_template = null;
    $matches = null;
    if (preg_match_all('/<<([^<>]*)\/>>/', $template, $matches)) {
      for ($i=0, $len = count($matches[0]), $value = null; $i < $len; ++$i) {
        $value = $this->_wash($matches[1][$i]);
        $template = str_replace($matches[0][$i], $this->$value ?? '', $template);
      }
    }

    return $template;
  }

  private function _wash($str) {
    if (isset($str) && $str !== ''){
      if ($str[0] === ' ') $str = ltrim($str);
      if ($str[strlen($str) - 1] === ' ') $str = rtrim($str);
    }

    return $str;
  }
}