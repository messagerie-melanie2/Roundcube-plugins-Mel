#!/usr/bin/env php
<?php
/**
 * Conversion d'un csv contenant la liste des ressources en entrée en csv utilisable par le script MajCSVM2v4.pl
 * Si le script ne s'exécute pas, faire $ chmod +x resources_csv.php
 * 
 * Usage : ./resources_csv.php input=<input.csv> output=<output.csv>
 * Paramètre(s) : 
 *  - <input.csv> Fichier d'entrée (.csv) 
 *  - <output.csv> Fichier de sortie (.csv) 
 * 
 * @version 0.2
 */

// --- Gestion des paramètres du script
parse_str(implode('&', array_slice($argv, 1)), $arguments);

if (!isset($arguments['input'])) {
    echo "Paramètre 'input' manquant" . PHP_EOL;
    echo "Usage : ./resources_csv.php input=<input.csv> output=<output.csv>" . PHP_EOL;
    exit(1);
}

if (!isset($arguments['output'])) {
    echo "Paramètre 'output' manquant" . PHP_EOL;
    echo "Usage : ./resources_csv.php input=<input.csv> output=<output.csv>" . PHP_EOL;
    exit(1);
}

$inputFileName = $arguments['input'];
$outputFileName = $arguments['output'];

/**
 * Méthode pour charger le fichier avec la liste des bureaux
 * 
 * @param string $inputFileName
 * 
 * @return array $resources
 */
function LoadFile($inputFileName)
{
    echo 'Chargement du fichier d\'entrée "' . $inputFileName . '" ...' . PHP_EOL;
    if (($handle = @fopen($inputFileName, "r")) !== false) {
        $resources = processCsvFile($handle);
    }
    else {
        echo "Impossible d'ouvrir le fichier des bureaux : $inputFileName"  . PHP_EOL;
        return false;
    }
    echo "Fichier chargé, nombre de bureaux trouvés : " . count($resources) . PHP_EOL;

    return $resources;
}


/**
 * Charger la liste des utilisateurs en traitant un fichier CSV
 * 
 * @param resource $handle
 * @param array $usersParams [in/out] Liste des paramètres par utilisateur
 * 
 * @return  array $users
 */
function processCsvFile($handle) 
{
    global $config;

    // Flag pour la première occurence du fichier .csv
    $first = true;

    // Liste des bureaux
    $resources = [];

    // Configuration des colonnes depuis le csv
    $columns = [];

    // index
    $index = 0;

    while (($data = fgetcsv($handle)) !== false) {
        // On ignore la première itération qui contient le nom des colonnes du fichier .csv
        if ($first) {
            $first = false;

            // Chercher le bon numéro de colonne
            if ($data !== false) {
                foreach ($data as $key => $col) {
                    $columns[$col] = $key;
                }
            }
            continue;
        }
        if ($data !== false) {
            $resources[$index] = [];
            foreach ($columns as $col => $key) {
                $resources[$index][$col] = isset($data[$key]) ? trim($data[$key]) : "";
            }
            $index++;
        }
    }
    return $resources;
}

/**
 * Écriture de données dans un fichier csv
 * 
 * @param string $filename chemin complet vers le fichier en écriture
 * @param array $columns liste des colonnes du fichier
 * @param array $content contenu à écrire dans le fichier
 * 
 * @return boolean
 */
function WriteCSVFile($filename, $columns = null, $content)
{
    $fp = fopen($filename, 'w');

    // Gérer l'impossibilité d'ouvrir le fichier
    if ($fp === false) {
        echo "Impossible d'ouvrir le fichier '$filename', veuillez vérifier les droits (les données seront écrites dans la sortie standard des logs)." . PHP_EOL;
    }

    // Écrire les colonnes du csv en sortie
    if (isset($columns)) {
        fputcsv($fp, $columns);
    }

    // Écrire le contenu du csv en sortie
    foreach ($content as $fields) {
        fputcsv($fp, $fields);
    }

    fclose($fp);
    return true;
}

/**
 * Récupérer le nom commun
 * 
 * @param array $resource
 * 
 * @return string
 */
function getCN($resource) {
    return $resource['Type'] . " " . getGivenName($resource);
}

/**
 * Récupérer le nom du type de ressource
 * 
 * @param array $resource
 * 
 * @return string
 */
function getSN($resource) {
    return $resource['Type'];
}

/**
 * Récupérer le numéro de département
 * 
 * @param array $resource
 * 
 * @return string
 */
function getDepartmentNumber($resource) {
    return "Bnum/Ressources/" . $resource['Ville'];
}

/**
 * Récupérer le prénom
 * 
 * @param array $resource
 * 
 * @return string
 */
function getGivenName($resource) {
    return $resource['Nom_ressource'];
}

/**
 * Récupérer le champ info
 * 
 * @param array $resource
 * 
 * @return string
 */
function getInfo($resource) {
    $infos = [];

    if (!empty($resource['Batiment'])) {
        $infos[] = "Ressource.Batiment: " . $resource['Batiment'];
    }

    if (!empty($resource['Etage'])) {  
        $infos[] = "Ressource.Etage: " . $resource['Etage'];
    }

    if (!empty($resource['Capacite'])) {  
        $infos[] = "Ressource.Capacite: " . $resource['Capacite'];
    }

    if (!empty($resource['Filtres separateur pipe'])) {
        $caracteristiques = array_fill_keys(array_map('trim', explode('|', $resource['Filtres separateur pipe'])), 1);
        $infos[] = "Ressource.Caracteristiques: " . json_encode($caracteristiques, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    return implode('|', $infos);
}

/**
 * Récupérer le mail
 * 
 * @param array $resource
 * 
 * @return string
 */
function getMail($resource) {
    global $defaultsValue;
    $name = getCN($resource) . " " . $resource['Batiment'] . " " . $resource['Ville'];
    // Remplacer tous les caractère spéciaux par des tirets dans le nom
    return preg_replace('/[^A-Za-z0-9\-]/', '-', strtolower($name)) . "@" . $defaultsValue['domain'];
}

/**
 * Récupérer l'uid
 * 
 * @param array $resource
 * 
 * @return string
 */
function getUid($resource) {
    $length = 30;
    $characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[random_int(0, $charactersLength - 1)];
    }
    return $randomString;
}

// Récupérer les bureaux en entrée
$resources = LoadFile($inputFileName);

// Liste des bureaux en sortie
$outputOffices = [];

// Liste des colonnes pour la sortie
$outputColumns = [
    'cn',
    'objectClass',
    'departmentNumber',
    'displayName',
    'givenName',
    'info',
    'l',
    'mail',
    'mailPR',
    'mineqPortee',
    'mineqTypeEntree',
    'postalCode',
    'roomNumber',
    'sn',
    'street',
    'uid',
];

// Valeurs par défaut
$defaultsValue = [
    'objectClass'       => 'top|extensibleObject|mineqMelSA|mineqMelDP',
    'mineqPortee'       => '50',
    'mineqTypeEntree'   => 'BALR',
    'domain'            => 'bnum.i2',
];

// Données de mapping
$mapping = [
    'street'        => 'Adresse',
    'postalCode'    => 'CP',
    'l'             => 'Ville',
    'roomNumber'    => 'Bureau',
];

// Liste des fonctions a appeler
$functions = [
    'cn'                => 'getCN',
    'departmentNumber'  => 'getDepartmentNumber',
    'displayName'       => 'getCN',
    'givenName'         => 'getGivenName',
    'sn'                => 'getSN', 
    'info'              => 'getInfo',
    'mail'              => 'getMail',
    'mailPR'            => 'getMail',
    'uid'               => 'getUid',
];

// Traitement des données
foreach ($resources as $resource) {
    $outputOffice = [];
    foreach ($outputColumns as $column) {
        if (isset($mapping[$column])) {
            $outputOffice[$column] = $resource[$mapping[$column]];
        }
        elseif (isset($functions[$column])) {
            $outputOffice[$column] = $functions[$column]($resource, $outputOffice);
        }
        elseif (isset($defaultsValue[$column])) {
            $outputOffice[$column] = $defaultsValue[$column];
        }
        else {
            $outputOffice[$column] = '';
        }
    }
    $outputOffices[] = $outputOffice;
}

echo 'Ecriture du fichier de sortie "' . $outputFileName . '" ...' . PHP_EOL;
WriteCSVFile($outputFileName, $outputColumns, $outputOffices);
echo "Fichier écrit, nombre de bureaux trouvés : " . count($outputOffices) . PHP_EOL;
