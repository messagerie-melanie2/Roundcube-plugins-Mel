<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Échec d'une requête sur les tables des libellés (table absente, base indisponible…), ticket 0009463.
 *
 * rcube_db ne lève pas d'exception : il journalise l'erreur SQL dans errors.log et renvoie false.
 * SignatureTitleRepository transforme ce false en exception, que le plugin attrape là où
 * il sait quoi faire (repli sur la config, message à l'administrateur…).
 */
final class SignatureStorageException extends \RuntimeException
{
}
