<?php

// Configuration de la liste des labels par défaut
$rcmail_config['default_labels'] = [
      ['key' => '$label1',    'tag' => 'Important',       'color' => '#FF0000', 'ordinal' => ''],
      ['key' => '$label2',    'tag' => 'Travail',         'color' => '#FF9900', 'ordinal' => ''],
      ['key' => '$label3',    'tag' => 'Personnel',       'color' => '#009900', 'ordinal' => ''],
      ['key' => '$label4',    'tag' => 'À faire',         'color' => '#3333FF', 'ordinal' => ''],
      ['key' => '$label5',    'tag' => 'En attente' ,     'color' => '#993399', 'ordinal' => ''],
      ['key' => '~commente',  'tag' => 'Commenté',        'color' => '#666666', 'ordinal' => ''],
      ['key' => '~rdvtraite', 'tag' => 'RdvTraité',       'color' => '',        'ordinal' => ''],
];

// Les labels doivent être affichés
$rcmail_config['show_labels'] = true;
