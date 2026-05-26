<?php
//Nom de la tâche lié au plugin mel_portal.
$config['task_name'] = $_ENV['RC_MEL_PORTAL_TASK_NAME'] ?? 'mel_portal';
//Id du menu
$config['sidebar_name'] = $_ENV['RC_MEL_PORTAL_SIDEBAR_NAME'] ?? 'taskbar';
//Css du plugin
$config['css_name'] = $_ENV['RC_MEL_PORTAL_CSS_NAME'] ?? 'mel-portal.css';
//Html du plugin
$config['template_name'] = $_ENV['RC_MEL_PORTAL_TEMPLATE_NAME'] ?? "mel_portal";
//osef?
$config['left_menu_module'] = $_ENV['RC_MEL_PORTAL_LEFT_MENU_MODULE'] ?? "left_menu";
//Configuration des modules des différentes pages.
/*
Liste des pages : 
    -   Dashboard
    -   News
Liste des modules : 
    -   headlines
    -   my_day
    -   workplaces
    -   flux_rss
*/
$config['user_interface_config'] = array(
    "dashboard" => ["headlines", "my_day", "workplaces"],
    "news" => ["flux_rss", "flux_rss"]
);
//osef?
$config['user_menu_config'] = $_ENV['RC_MEL_PORTAL_USER_MENU_CONFIG'] ?? array("dashboard", "news", "config");
//...................FLUX RSS MODULE.......................//
//Configuration du module "flux_rss"
$config['flux_rss'] = $_ENV['RC_MEL_PORTAL_FLUX_RSS'];
//Classes à récupérer pour que le module fonctionne correctement.
/* /!\ Ne pas toucher ! */
$config['flux_rss_classes'] = $_ENV['RC_MEL_PORTAL_FLUX_RSS_CLASSES'] ?? ["flux_config.php"];
/*
Configuration d'un module flux_rss : 
$config['flux_rss'] signifie que c'est la configuration du module "flux_rss"
$config['flux_rss'][0] signifie que l'on configure le premier module flux_rss d'une page.
On commence par 0 jusqu'au nombre nécessaire.
Un module se configure comme ceci : 

$config['flux_rss'][x] = [
    "title" => "un titre",
    "tabs" => [ //La liste des tabs
        [ //tab1
            "label" => "Nom de la tab",
            "flux" => [ //liste des flux de la tab.
                ["file" => "fichier xml", "size" => "taille du flux"],
                ["file" => "liberation.xml", "size" => "2x1"],
                ["file" => "figaro.xml", "size" => "1x1", "color" => "couleur du flux"],
            ] 
        ],
    ]
];

"title" correspond au titre du module, il s'affichera en gros au dessus.
"tabs" correspond aux onglets du module, il faut au moins un onglet.
"show_tabs", si "true" affiche les onglets, si "false", ils sont cachés.
"label", il s'agit du nom de l'onglet.
"flux", il s'agit d'une liste de flux (rss ou autre) qui seront affiché dans l'onglet.
Configuration d'un flux : 
"file" => nom du fichier que l'on veut lire.
"size" => taille de la tuile, on peut mettre "1x1' ou "2x1".
"color" => optionnel, on peut mettre "dark" ou "light". "light" par défaut.
*/
$config['flux_rss'][0] = [
    "title" => "news",
    "show_tabs" => false,
    "tabs" => [
        [ //tab1
            "label" => "hidden",
            "flux" => [
                ["file" => "intranet-dgitm.xml", "size" => "1x1"],
                ["file" => "liberation.xml", "size" => "2x1"],
                ["file" => "figaro.xml", "size" => "1x1", "color" => "dark"],
            ] 
        ],
    ]
];
$config['flux_rss'][1] = [
    "title" => "",
    "show_tabs" => true,
    "tabs" => [
        //tab 1
        [
            "label" => "headline",
            "flux" => [
                ["file" => "intranet-dgitm.xml", "size" => "1x1"],
                ["file" => "liberation.xml", "size" => "2x1"],
                ["file" => "figaro.xml", "size" => "1x1"],
                ["file" => "intranet-dgitm.xml", "size" => "1x1"],
                ["file" => "liberation.xml", "size" => "1x1"],
                ["file" => "figaro.xml", "size" => "2x1", "color" => "dark"],
            ]
        ],
        //tab 2
        [
            "label" => "thematic_1",
            "flux" => [
                ["file" => "intranet-dgitm.xml", "size" => "1x1"],
                ["file" => "liberation.xml", "size" => "2x1"],
                ["file" => "figaro.xml", "size" => "1x1"],        
            ]
        ],
        //tab 3
        [
            "label" => "thematic_2",
            "flux" => [
                ["file" => "intranet-dgitm.xml", "size" => "1x1"],
                ["file" => "liberation.xml", "size" => "1x1"],
                ["file" => "figaro.xml", "size" => "2x1", "color" => "dark"],     
            ]
        ]
    ]
];
//Ne pas toucher
$config['flux_rss'] = $_ENV['RC_MEL_PORTAL_FLUX_RSS'] ?? serialize($config['flux_rss']);
//............................................................................//