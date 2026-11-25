<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Une requête sur les tables des libellés a échoué (table absente, base indisponible…).
 * L'erreur SQL est déjà écrite dans errors.log par Roundcube.
 */
final class SignatureStorageException extends \RuntimeException
{
}
