<?php
declare(strict_types = 1);
/**
 * Classe représentant une localité.
 *
 * Cette classe permet de stocker et manipuler les informations relatives à une localité,
 * telles que l'identifiant, le nom, la description et le code postal.
 */
class Locality {
    /**
     * Identifiant unique de la localité.
     */
    public readonly string $uid;

    /**
     * Nom de la localité.
     */
    public readonly string $name;

    /**
     * Description de la localité.
     */
    public readonly string $description;

    /**
     * Code postal de la localité.
     */
    public readonly ?string $postalcode;

    /**
     * Constructeur de la classe Locality.
     *
     * @param $locality Objet contenant les informations de la localité.
     */
    public function __construct(object $locality) {
        $this->uid = $locality->uid;
        $this->name = $locality->name;
        $this->description  = $this->_get_description($locality->description);
        $this->postalcode = $locality->postalcode;
    }

    /**
     * Récupère la description de la localité.
     *
     * @param string|array<int, string> $item Description renvoyée par $locality->description.
     * @return string Description formatée en majuscules.
     */
    private function _get_description(string|array $item) : string {
        if (is_array($item)) $item = $item[0];
        
        return strtoupper($item);
    }
}