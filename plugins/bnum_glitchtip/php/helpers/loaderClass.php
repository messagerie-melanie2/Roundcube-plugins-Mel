<?php
declare(strict_types=1);

namespace BnumPlugin\Helpers;

/**
 * Utilitaires de chargement de fichiers avec chemins de repli.
 */
final class Loader
{
    /**
     * Emplacements possibles de `bnum_plugin.php`, par ordre de priorité.
     *
     * Relatifs à `helpers/` : un niveau de plus que depuis le bootstrap.
     */
    private const array BNUM_PLUGIN_PATHS = [
        __DIR__ . '/../../../bnum/bnum_plugin.php',
        __DIR__ . '/../../bnum_plugin.php',
    ];

    private function __construct()
    {
    }

    /**
     * Charge `bnum_plugin` s'il n'est pas déjà déclaré.
     *
     * @throws RequiredFileNotFoundException Si aucun emplacement ne contient le fichier.
     */
    public static function ensure_bnum_plugin(): void
    {
        if (class_exists('bnum_plugin', autoload: false)) {
            return;
        }

        self::require_once_first(...self::BNUM_PLUGIN_PATHS);
    }

    /**
     * Inclut (`require_once`) le premier fichier existant parmi les candidats.
     *
     * Attention : l'inclusion se fait dans la portée de cette méthode. Les
     * classes, fonctions et constantes restent globales, mais les variables
     * déclarées au top-level du fichier inclus sont perdues.
     *
     * @throws RequiredFileNotFoundException Si aucun candidat n'existe.
     */
    public static function require_once_first(string ...$candidates): void
    {
        $path = array_find($candidates, static fn(string $p): bool => is_file($p))
            ?? throw RequiredFileNotFoundException::fromCandidates($candidates);

        require_once $path;
    }
}