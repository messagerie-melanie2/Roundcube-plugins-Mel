<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Texte de signature d'un libellé. En base, c'est du texte simple, une ligne par ligne de signature.
 */
final class SignatureText
{
    /**
     * Nettoie le texte : retire les espaces en trop et les lignes vides.
     */
    #[\NoDiscard('Le texte normalisé est renvoyé, le texte d\'origine est inchangé')]
    public static function normalize(string $text): string
    {
        $lines = explode("\n", str_replace(["\r\n", "\r"], "\n", $text));
        $lines = array_filter(array_map(trim(...), $lines), static fn (string $line): bool => $line !== '');

        return implode("\n", $lines);
    }

    /**
     * Transforme le texte en HTML : chaque ligne est séparée par <br>.
     * On ne convertit pas les apostrophes, car signature.js recopie ce texte tel quel.
     */
    #[\NoDiscard('Le HTML est renvoyé, le texte d\'origine est inchangé')]
    public static function toHtml(string $text): string
    {
        $html = htmlspecialchars(self::normalize($text), ENT_NOQUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return str_replace("\n", '<br>', $html);
    }
}
