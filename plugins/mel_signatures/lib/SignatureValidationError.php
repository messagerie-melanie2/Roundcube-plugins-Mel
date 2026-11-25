<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Erreur de saisie : la clé du message à afficher et ses variables.
 */
final readonly class SignatureValidationError
{
    /**
     * @param array<string, string> $vars
     */
    public function __construct(
        public string $messageKey,
        public array $vars = [],
    ) {}
}
