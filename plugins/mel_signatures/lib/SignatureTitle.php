<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Libellé du bloc Marque État. Un nouveau libellé, pas encore enregistré, a l'identifiant 0.
 */
final readonly class SignatureTitle
{
    public function __construct(
        public int $id,
        public string $label,
        public string $signatureText,
    ) {}

    /**
     * Crée l'objet à partir d'une ligne de la base.
     *
     * @param array<string, mixed> $row
     */
    #[\NoDiscard('Le libellé construit est le seul résultat de cet appel')]
    public static function fromRow(array $row): self
    {
        return new self(
            (int) $row['title_id'],
            (string) $row['title_label'],
            (string) $row['title_signature_text'],
        );
    }
}
