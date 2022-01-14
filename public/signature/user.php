<?php
/**
 * Class de test user pour remplacer l'ORM pour les jeux de tests
 */
class User {
    public function __construct($data)
    {
        if (is_array($data)) {
            foreach ($data as $k => $v) {
                $this->$k = $v;
            }
        }
    }
}