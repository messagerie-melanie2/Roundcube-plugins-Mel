<?php
class Locality {
    public $uid;
    public $name;

    public function __construct($locality) {
        $this->uid = $locality->uid;
        $this->name = $locality->name;
    }
}