<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Libellé du bloc Marque État (table mel_signatures_titles, ticket 0009463).
 *
 * Objet de transfert immuable : il porte un libellé lu en base ou saisi par un administrateur.
 * Un libellé pas encore enregistré a l'identifiant 0. Les règles de saisie sont contrôlées
 * par SignatureTitleValidator : ce constructeur accepte aussi une saisie invalide,
 * pour pouvoir la réafficher dans le formulaire avec le message d'erreur.
 */
final readonly class SignatureTitle
{
    public function __construct(
        public int $id,
        public string $label,
        public string $signatureText,
    ) {}

    /**
     * Construit un libellé à partir d'une ligne de mel_signatures_titles.
     *
     * @param array<string, mixed> $row Ligne lue par rcube_db::fetch_assoc()
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
