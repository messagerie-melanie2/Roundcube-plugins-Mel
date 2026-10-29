<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * DN rattaché à un libellé : les agents de ce service se voient proposer ce libellé.
 */
final readonly class SignatureTitleDn
{
    /**
     * Valeur spéciale du libellé proposé quand aucun DN ne correspond.
     */
    public const string DEFAULT = 'default';

    public function __construct(
        public int $id,
        public string $dn,
    ) {}

    /**
     * Crée l'objet à partir d'une ligne de la base.
     *
     * @param array<string, mixed> $row
     */
    #[\NoDiscard('Le DN construit est le seul résultat de cet appel')]
    public static function fromRow(array $row): self
    {
        return new self((int) $row['title_dn_id'], (string) $row['dn']);
    }

    /**
     * Vrai pour la ligne « default ».
     */
    public function isDefault(): bool
    {
        return $this->dn === self::DEFAULT;
    }
}
