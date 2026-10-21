<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * DN rattaché à un libellé (table mel_signatures_title_dn, ticket 0009463).
 *
 * Les agents dont le DN contient cette valeur se voient proposer le libellé.
 * La valeur spéciale « default » désigne le libellé proposé quand aucun DN ne correspond.
 */
final readonly class SignatureTitleDn
{
    /**
     * Valeur de la colonne `dn` réservée à la ligne de repli.
     */
    public const string DEFAULT = 'default';

    public function __construct(
        public int $id,
        public string $dn,
    ) {}

    /**
     * Construit un DN à partir d'une ligne de mel_signatures_title_dn.
     *
     * @param array<string, mixed> $row Ligne lue par rcube_db::fetch_assoc()
     */
    #[\NoDiscard('Le DN construit est le seul résultat de cet appel')]
    public static function fromRow(array $row): self
    {
        return new self((int) $row['title_dn_id'], (string) $row['dn']);
    }

    /**
     * Indique s'il s'agit de la ligne de repli « default ».
     */
    public function isDefault(): bool
    {
        return $this->dn === self::DEFAULT;
    }
}
