<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Erreur de saisie détectée par SignatureTitleValidator (ticket 0009463).
 *
 * Porte la clé du texte à afficher (localization/fr_FR.inc) et ses variables,
 * par exemple ['label' => 'Ministère des Transports'] pour « Ce DN est déjà rattaché au libellé « $label ». »
 */
final readonly class SignatureValidationError
{
    /**
     * @param array<string, string> $vars Variables du texte
     */
    public function __construct(
        public string $messageKey,
        public array $vars = [],
    ) {}
}
