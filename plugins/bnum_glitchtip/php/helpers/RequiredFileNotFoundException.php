<?php
declare(strict_types=1);

namespace BnumPlugin\Helpers;

/**
 * Levée lorsqu'aucun des fichiers requis candidats n'existe.
 */
final class RequiredFileNotFoundException extends \RuntimeException
{
    /**
     * @param string[] $candidates Chemins testés, dans l'ordre.
     */
    public static function fromCandidates(array $candidates): self
    {
        return new self('Aucun fichier trouvé parmi : ' . implode(', ', $candidates));
    }
}