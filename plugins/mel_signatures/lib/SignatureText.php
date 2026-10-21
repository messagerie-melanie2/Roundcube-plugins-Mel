<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Conversions du texte de signature d'un libellé (ticket 0009463).
 *
 * En base, le texte est stocké brut : une ligne de signature par ligne, séparées par "\n".
 */
final class SignatureText
{
    /**
     * Normalise un texte de signature : retours à la ligne unifiés en "\n",
     * espaces retirés en début et fin de ligne, lignes vides supprimées.
     */
    #[\NoDiscard('Le texte normalisé est renvoyé, le texte d\'origine est inchangé')]
    public static function normalize(string $text): string
    {
        $lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $text));
        $lines = array_filter(array_map(trim(...), $lines), static fn (string $line): bool => $line !== '');

        return implode("\n", $lines);
    }

    /**
     * Convertit le texte stocké en base en HTML pour la signature.
     *
     * Les caractères spéciaux (& < >) sont échappés, puis chaque retour à la ligne devient `<br>`.
     * Les apostrophes et guillemets ne sont pas convertis : signature.js recopie cette valeur
     * dans le champ « Personnalisé » en remplaçant seulement `<br>` par un retour à la ligne.
     */
    #[\NoDiscard('Le HTML est renvoyé, le texte d\'origine est inchangé')]
    public static function toHtml(string $text): string
    {
        $html = htmlspecialchars(self::normalize($text), ENT_NOQUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return str_replace("\n", '<br>', $html);
    }
}
