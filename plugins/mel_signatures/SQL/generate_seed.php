<?php

declare(strict_types=1);

/**
 * Génère le script SQL de reprise des libellés de signature (ticket 0009463, V1).
 *
 * Lit `signature_images` et `signature_default_image` dans un fichier de config,
 * et écrit sur la sortie standard les INSERT à exécuter dans la base Roundcube.
 * Le script ne se connecte à aucune base : le fichier produit se relit avant d'être exécuté.
 *
 * Usage :
 *   php generate_seed.php /chemin/vers/config.inc.php.template > seed.sql
 *
 * Code de sortie : 0 = aucune anomalie, 1 = erreur d'usage, 2 = anomalies (voir la sortie d'erreur).
 */

/**
 * Corrections des libellés introuvables : ancien libellé => libellé existant.
 * À remplir avec les choix de l'équipe avant de générer le script définitif.
 */
const TITLE_CORRECTIONS = [
    // "Ministère de la Transition écologique, de la Biodiversité, de la Forêt, de la Mer et de la Pêche" => '…',
    // 'Ministère délégué chargé des Transports' => '…',
];

const DEFAULT_DN = 'default';

if ($argc !== 2 || !is_readable($argv[1])) {
    fwrite(STDERR, "Usage : php generate_seed.php <config.inc.php.template>\n");
    exit(1);
}

$rcmail_config = [];
require $argv[1];

/**
 * Écrit une chaîne sous forme de littéral SQL standard : 'texte', apostrophes doublées.
 */
function sql_string(string $value): string
{
    return "'" . str_replace("'", "''", $value) . "'";
}

/**
 * Signale une anomalie sur la sortie d'erreur ; renvoie le nombre d'anomalies signalées.
 * Appelée sans message, elle renvoie seulement le compte.
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
 * Convertit le HTML de la config (« MINISTÈRE<br>DES TRANSPORTS ») en texte brut multi-ligne.
 */
function html_to_text(string $html): string
{
    $text  = (string) preg_replace('/<br\s*\/?>/i', "\n", $html);
    $text  = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $lines = array_filter(array_map(trim(...), explode("\n", $text)), static fn (string $line): bool => $line !== '');

    return implode("\n", $lines);
}

/**
 * Rattache chaque DN à un libellé existant ; signale les autres.
 *
 * @param array<string, string> $config_dns  DN => nom de l'élément (config)
 * @param array<string, string> $items       nom => valeur des éléments repris
 * @param array<string, string> $corrections ancien nom => nouveau nom
 *
 * @return array<string, string> DN => nom de l'élément
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

// ----- Libellés -----
$titles = [];
foreach ($rcmail_config['signature_images'] ?? [] as $entries) {
    // « Personnalisé » => 'custom' n'est pas un libellé : l'option reste gérée par le code
    if (!is_array($entries)) {
        continue;
    }

    foreach ($entries as $label => $html) {
        $label = trim((string) $label);
        $text  = html_to_text((string) $html);

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

$title_dns = map_dns($rcmail_config['signature_default_image'] ?? [], $titles, TITLE_CORRECTIONS, 'libellés');

// ----- Script SQL -----
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
