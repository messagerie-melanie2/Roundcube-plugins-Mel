<?php

declare(strict_types=1);

/**
 * Crée le script SQL qui remplit les tables des libellés à partir de la config.
 * Il ne touche pas à la base : on relit le fichier avant de l'exécuter.
 *
 * Usage :
 *   php generate_seed.php /chemin/vers/config.inc.php.template > seed.sql
 *
 * Code de sortie : 0 = tout va bien, 1 = mauvais usage, 2 = anomalies affichées.
 */

/**
 * Libellés qui n'existent plus : ancien libellé => libellé qui le remplace.
 */
const TITLE_CORRECTIONS = [
    'Ministère de la Transition écologique, de la Biodiversité, de la Forêt, de la Mer et de la Pêche' => 'Ministère de la Transition écologique, de la Biodiversité et des Négociations internationales sur le climat et la nature',
    'Ministère délégué chargé des Transports' => 'Ministère des Transports',
];



/**
 * Corrections validées par l'équipe : libellé de la config => [nouveau libellé, nouveau texte].
 * Dans le texte, <br> sépare les lignes.
 */
const TITLE_RENAMES = [
    'Ministère de l\'Économie, des Finances et de la Souveraineté Industrielle, Énergétique et Numérique' => ['Ministère de l’Économie, des Finances et de la Souveraineté industrielle, énergétique et numérique', 'MINISTÈRE<br>DE L’ÉCONOMIE,<br>DES FINANCES<br>ET DE LA SOUVERAINETÉ<br>INDUSTRIELLE, ÉNERGÉTIQUE<br>ET NUMÉRIQUE'],
    'République Française'                         => ['République française', 'RÉPUBLIQUE<br>FRANÇAISE'],
    'Ministère chargé de la mer et de la pêche'    => ['Ministère chargé de la Mer et de la Pêche', 'MINISTÈRE<br>CHARGÉ DE LA MER<br>ET DE LA PÊCHE'],
    'Ministère de l\'Action et des Comptes Publics' => ['Ministère de l’Action et des Comptes publics', 'MINISTÈRE<br>DE L’ACTION<br>ET DES COMPTES<br>PUBLICS'],
    'Ministère délégué chargé de la Ruralité'      => ['Ministère délégué chargé de la Ruralité', 'MINISTÈRE<br>DÉLÉGUÉ CHARGÉ<br>DE LA RURALITÉ'],
    'Préfet de l\'Eure-et-Loir'                     => ['Préfet d’Eure-et-Loir', 'PRÉFET<br>D’EURE-ET-LOIR'],
    'Préfet du Loir-et-Cher'                       => ['Préfet de Loir-et-Cher', 'PRÉFET<br>DE LOIR-ET-CHER'],
    'Préfet de Haute-Loire'                        => ['Préfet de la Haute-Loire', 'PRÉFET<br>DE LA HAUTE-LOIRE'],
    'Préfet de la Seine-et-Marne'                  => ['Préfet de Seine-et-Marne', 'PRÉFET<br>DE SEINE-ET-MARNE'],
    'Préfet du Tarn-et-Garonne'                    => ['Préfet de Tarn-et-Garonne', 'PRÉFET<br>DE TARN-ET-GARONNE'],
    'Préfet du Vaucluse'                           => ['Préfet de Vaucluse', 'PRÉFET<br>DE VAUCLUSE'],
    'Préfète des Pyrénées-Orientales'              => ['Préfet des Pyrénées-Orientales', 'PRÉFET<br>DES PYRÉNÉES-<br>ORIENTALES'],
    'Préfet de la Réunion'                         => ['Préfet de La Réunion', 'PRÉFET<br>DE LA<br>RÉUNION'],
    'Préfet de Saint-Pierre et Miquelon'           => ['Préfet de Saint-Pierre-et-Miquelon', 'PRÉFET<br>DE SAINT-PIERRE-<br>ET-MIQUELON'],
];

/**
 * Libellé proposé par défaut.
 */
const DEFAULT_TITLE = 'Ministères Transition écologique, Aménagement du territoire, Transports, Ville et Logement';

const DEFAULT_DN = 'default';

if ($argc !== 2 || !is_readable($argv[1])) {
    fwrite(STDERR, "Usage : php generate_seed.php <config.inc.php.template>\n");
    exit(1);
}

$rcmail_config = [];
require $argv[1];

/**
 * Met une chaîne entre apostrophes pour le SQL.
 */
function sql_string(string $value): string
{
    return "'" . str_replace("'", "''", $value) . "'";
}

/**
 * Affiche une anomalie et renvoie le nombre d'anomalies. Sans message, renvoie juste le nombre.
 */
function anomaly(?string $message = null): int
{
    static $count = 0;

    if ($message !== null) {
        fwrite(STDERR, "ANOMALIE : $message\n");
        $count++;
    }

    return $count;
}

/**
 * Transforme « MINISTÈRE<br>DES TRANSPORTS » en texte sur plusieurs lignes.
 */
function html_to_text(string $html): string
{
    $text  = (string) preg_replace('/<br\s*\/?>/i', "\n", $html);
    $text  = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $lines = array_filter(array_map(trim(...), explode("\n", $text)), static fn (string $line): bool => $line !== '');

    return implode("\n", $lines);
}

/**
 * Associe chaque DN à son libellé et signale les DN dont le libellé est introuvable.
 *
 * @param array<string, string> $config_dns  DN => libellé
 * @param array<string, string> $items       libellé => texte
 * @param array<string, string> $corrections ancien libellé => nouveau libellé
 *
 * @return array<string, string> DN => libellé
 */
function map_dns(array $config_dns, array $items, array $corrections, string $kind): array
{
    $dns = [];

    foreach ($config_dns as $dn => $name) {
        $dn   = trim((string) $dn);
        $name = $corrections[(string) $name] ?? (string) $name;

        if (!isset($items[$name])) {
            anomaly("$kind : « $dn » pointe vers un élément absent : « $name »");
            continue;
        }

        $dns[$dn] = $name;
    }

    if (!isset($dns[DEFAULT_DN])) {
        anomaly("$kind : aucune ligne « default » ne sera créée");
    }

    return $dns;
}

// Libellés
$titles = [];
foreach ($rcmail_config['signature_images'] ?? [] as $entries) {
    // « Personnalisé » n'est pas un vrai libellé : on l'ignore
    if (!is_array($entries)) {
        continue;
    }

    foreach ($entries as $label => $html) {
        $label = trim((string) $label);

        [$label, $html] = TITLE_RENAMES[$label] ?? [$label, $html];
        $text           = html_to_text((string) $html);

        if (isset($titles[$label])) {
            anomaly("libellé en double ignoré : « $label »");
            continue;
        }

        if ($text !== strip_tags($text)) {
            anomaly("HTML autre que <br> dans le libellé « $label » : à vérifier");
        }

        $titles[$label] = $text;
    }
}

$renamed_titles = array_map(static fn (array $rename): string => $rename[0], TITLE_RENAMES);
$title_dns      = map_dns($rcmail_config['signature_default_image'] ?? [], $titles, TITLE_CORRECTIONS + $renamed_titles, 'libellés');

if (isset($titles[DEFAULT_TITLE])) {
    $title_dns[DEFAULT_DN] = DEFAULT_TITLE;
} else {
    anomaly('libellé par défaut absent : « ' . DEFAULT_TITLE . ' »');
}

// Script SQL
echo "-- Reprise des libellés de signature (ticket 0009463, V1)\n";
echo '-- Généré le ' . date('Y-m-d H:i') . ' depuis ' . basename($argv[1]) . "\n";
printf("-- %d libellés, %d DN de libellés (ligne default comprise si présente)\n\n", count($titles), count($title_dns));
echo "BEGIN;\n\n";

foreach ($titles as $label => $text) {
    printf(
        "INSERT INTO mel_signatures_titles (title_label, title_signature_text) VALUES (%s, %s);\n",
        sql_string($label),
        sql_string($text)
    );
}

echo "\n";

foreach ($title_dns as $dn => $label) {
    printf(
        "INSERT INTO mel_signatures_title_dn (title_id, dn) SELECT title_id, %s FROM mel_signatures_titles WHERE title_label = %s;\n",
        sql_string($dn),
        sql_string($label)
    );
}

echo "\nCOMMIT;\n";

$anomalies = anomaly();

fwrite(STDERR, sprintf("%d libellés, %d DN de libellés, %d anomalie(s)\n", count($titles), count($title_dns), $anomalies));
exit($anomalies > 0 ? 2 : 0);
