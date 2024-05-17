<?php
class Resource {
    public $dn;
    public $uid;
    public $fullname;
    public $name;
    public $email;
    public $email_list;
    public $type;
    public $service;
    public $bal;
    public $street;
    public $postalcode;
    public $locality;
    public $description;
    public $roomnumber;
    public $title;
    public $batiment;
    public $etage;
    public $capacite;
    public $caracteristiques;

    public function __construct($resources) {
        $this->dn = $resources->dn;
        $this->uid = $resources->uid;
        $this->fullname = $resources->fullname;
        $this->name = $resources->name;
        $this->email = $resources->email;
        $this->email_list = $resources->email_list;
        $this->type = $resources->type;
        $this->service = $resources->service;
        $this->bal = $resources->bal;
        $this->street = $resources->street;
        $this->postalcode = $resources->postalcode;
        $this->locality = $resources->locality;
        $this->description = $resources->description;
        $this->roomnumber = $resources->roomnumber;
        $this->title = $resources->title;
        $this->batiment = $resources->batiment;
        $this->etage = $resources->etage;
        $this->capacite = $resources->capacite;
        $this->caracteristiques = $resources->caracteristiques;
    }
}