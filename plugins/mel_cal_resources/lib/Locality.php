<?php
class Locality {
    public $uid;
    public $name;
    public $description;

    public function __construct($locality) {
        $this->uid = $locality->uid;
        $this->name = $locality->name;
        $this->description  = $this->_get_description($locality->description);
    }

    /**
     * Get the description of the locality
     * @param string $item Description renvoyé par $locality->description
     * @return string
     */
    private function _get_description($item) : string {
        if (is_array($item)) $item = $item[0];
        
        return strtoupper($item);
    }
}