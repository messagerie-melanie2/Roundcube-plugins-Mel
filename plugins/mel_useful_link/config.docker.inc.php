<?php
/**
 * Chemin vers l'arborescence de configuration JSON
 * 
 * @var string portail_configuration_path
 */
$rcmail_config['portail_configuration_path'] = $_ENV['RC_MEL_USEFUL_LINK_PORTAIL_CONFIGURATION_PATH'] ?? __DIR__ . '/config';

/**
 * DN de base utilisé pour la configuration
 * Les fichiers seront récupérés dans l'arboresence après cette base
 *
 * @var string portail_base_configuration_dn
 */
$rcmail_config['portail_base_configuration_dn'] = $_ENV['RC_MEL_USEFUL_LINK_PORTAIL_BASE_CONFIGURATION_DN'];


/**
 * Items list for the portail
 * Supported properties :
 *      'type'          => Template name
        'flip'          => Card support flip or not
        'newtab'        => Open links in a new tab
        'logo'          => Url to the logo of the card if not default
        'logobg'        => Background color for the logo
        'title'         => Tooltip of the card
        'name'          => Name title of the card
        'description'   => Description of the card
        'url'           => URL of the card
        'dn'            => Matched DN for the current user to show the card
        'feedUrl'       => URL to use as a feed
        'onclick'       => Onclick event on click on the card
        'buttons'       => List of buttons for the card
        'links'         => List of links for the card (Card of cards)
 * 
 */
$rcmail_config['portail_items_list'] = $_ENV['RC_MEL_USEFUL_LINK_PORTAIL_ITEMS_LIST'];

$rcmail_config['personal_useful_links'] = $_ENV['RC_MEL_USEFUL_LINK_PERSONAL_USEFUL_LINKS'];

$rcmail_config['modify_options'] = [
       //Modifier
       [
              "name" => "modify_link_element",
              "action" => "ModifyLink",
              "icon" => "icon-mel-pencil"
       ],
       //Supprimer
       [
              "name" => "delete_link_element",
              "action" => "DeleteLink",
              "icon" => "icon-mel-trash"
       ]
];