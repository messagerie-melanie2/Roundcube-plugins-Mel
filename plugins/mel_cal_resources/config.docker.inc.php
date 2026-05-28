<?php 
$config = [];

/**
 * Configuration des expressions régulières pour l'extraction des étages en fonction du code postal
 */
$config['extract_floor'] = $_ENV['RC_MEL_CAL_RESOURCES_EXTRACT_FLOOR'];

/**
 * Configuration des expressions régulières pour l'extraction des batiments en fonction du code postal
 */
$config['extract_building'] = $_ENV['RC_MEL_CAL_RESOURCES_EXTRACT_BUILDING'];

/**
 * Configuration des ressources
 * 
 *  - name : nom de la ressource
 *  - is_option : indique si la ressource est utilisable dans la liste déroulante
 *  - load_data : fonction de chargement des données
 *  - labels : libellés de la ressource
 *  - cutype : type de ressource iCal (voir classe ICS de l'ORM)
 */
$config['rc_resources'] = $_ENV['RC_MEL_CAL_RESOURCES_RC_RESOURCES'] ?? [
    'vroom' => [
        'name' => 'vroom',
        'is_option' => true,
        'load_data' => 'resources_vroom',
        'labels' => ['fr_fr' => 'Réserver une VRoom'],
        'cutype' => 'X-VROOM',
    ],
    'salle' => [
        'name' => 'salle',
        'is_option' => true,
        'load_data' => 'resources_salle',
        'labels' => ['fr_fr' => 'Réserver une salle'],
        'cutype' => 'ROOM',
    ],
    'flex-office' => [
        'name' => 'Flex-Office',
        'is_option' => true,
        'load_data' => 'resources_flex_office',
        'busy' => false,
        'labels' => ['fr_fr' => 'Réserver un bureau'],
        'cutype' => 'X-FLEX-OFFICE',
    ],
    'vehicule' => [
        'name' => 'vehicule',
        'is_option' => true,
        'load_data' => 'resources_vehicule',
        'labels' => ['fr_fr' => 'Réserver un véhicule'],
        'cutype' => 'X-CAR',
    ],
    'materiel' => [
        'name' => 'materiel',
        'is_option' => true,
        'load_data' => 'resources_materiel',
        'labels' => ['fr_fr' => 'Réserver du matériel'],
        'cutype' => 'X-HARDWARE',
    ]
];

/**
 * Configuration des filtres pour les ressources
 * 
 * - name : nom du filtre
 * - load_data : fonction de chargement des données pour le filtre
 * - load_data_on_change : fonction de chargement des données à appeler lors du changement de valeur du filtre
 * - size : taille du filtre (en colonnes bootstrap 12)
 * - type : type de filtre (select, multi-select)
 * - icon : icône associée au filtre (nom de l'icône material design)
 */
$config['rc_filters'] = $_ENV['RC_MEL_CAL_RESOURCES_RC_FILTERS'] ?? [
    'salle' => [
        [
            'name' => 'locality', 
            'load_data' => 'resources_localities',
            'load_data_on_change' => 'resources_salle',
            'size' => 12,
            'type' => 'select',
            'icon' => 'location_on'
        ],
        [
            'name' => 'batiment', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'home'
        ],
        [
            'name' => 'etage', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'floor',
            'number' => true
        ],
        [
            'name' => 'capacite', 
            'size' => 3,
            'type' => 'multi-select',
            'icon' => 'meeting_room'
        ],
        [
            'name' => 'caracteristiques', 
            'size' => 3,
            'type' => 'multi-select',
            'icon' => 'tune'
            
        ]
    ],
    'vroom' => [
        [
            'name' => 'locality', 
            'load_data' => 'resources_localities',
            'load_data_on_change' => 'resources_vroom',
            'size' => 12,
            'type' => 'select',
            'icon' => 'location_on'
        ],
        [
            'name' => 'batiment', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'home'
        ],
        [
            'name' => 'etage', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'floor',
            'number' => true
        ],
        [
            'name' => 'capacite', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'table'
        ],
        [
            'name' => 'caracteristiques', 
            'size' => 3,
            'type' => 'multi-select',
            'icon' => 'tune'
        ]
    ],
    'vehicule' => [
        [
            'name' => 'locality', 
            'load_data' => 'resources_localities',
            'load_data_on_change' => 'resources_vehicule',
            'size' => 12,
            'type' => 'select',
            'icon' => 'location_on'
        ],
        [
            'name' => 'batiment', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'home'
        ],
        [
            'name' => 'etage', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'floor',
            'number' => true
        ],
        [
            'name' => 'roomnumber', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'meeting_room'
        ],
        [
            'name' => 'caracteristiques', 
            'size' => 3,
            'type' => 'multi-select',
            'icon' => 'tune'
            
        ]
    ],
    'materiel' => [
        [
            'name' => 'locality', 
            'load_data' => 'resources_localities',
            'load_data_on_change' => 'resources_materiel',
            'size' => 12,
            'type' => 'select',
            'icon' => 'location_on'
        ],
        [
            'name' => 'batiment', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'home'
        ],
        [
            'name' => 'etage', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'floor',
            'number' => true
        ],
        [
            'name' => 'roomnumber', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'meeting_room'
        ],
        [
            'name' => 'caracteristiques', 
            'size' => 3,
            'type' => 'multi-select',
            'icon' => 'tune'
            
        ]
    ],
    'flex-office' => [
        [
            'name' => 'locality', 
            'load_data' => 'resources_localities',
            'load_data_on_change' => 'resources_flex_office',
            'size' => 12,
            'type' => 'select',
            'icon' => 'location_on'
        ],
        [
            'name' => 'batiment', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'home'
        ],
        [
            'name' => 'etage', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'floor',
            'number' => true
        ],
        [
            'name' => 'roomnumber', 
            'size' => 3,
            'type' => 'select',
            'icon' => 'meeting_room'
        ],
        [
            'name' => 'caracteristiques', 
            'size' => 3,
            'type' => 'multi-select',
            'icon' => 'tune'
            
        ]
    ] 
];
