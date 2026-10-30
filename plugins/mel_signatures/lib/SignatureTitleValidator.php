<?php

declare(strict_types=1);

namespace MelSignatures;

/**
 * Vérifie la saisie d'un libellé ou d'un DN.
 * Renvoie la première erreur trouvée, ou null si tout est bon.
 */
final class SignatureTitleValidator
{
    /**
     * Longueurs maximales, en caractères.
     */
    public const int MAX_LABEL_LENGTH = 255;
    public const int MAX_SIGNATURE_TEXT_LENGTH = 1000;
    public const int MAX_DN_LENGTH = 1000;

    public function __construct(
        private readonly SignatureTitleRepository $repository,
    ) {}

    /**
     * Vérifie un libellé avant de l'enregistrer.
     *
     * @throws SignatureStorageException
     */
    #[\NoDiscard('Ignorer le résultat revient à ne pas contrôler le libellé')]
    public function validateTitle(SignatureTitle $title): ?SignatureValidationError
    {
        $key = match (true) {
            $title->label === ''                                               => 'title_error_label_required',
            mb_strlen($title->label) > self::MAX_LABEL_LENGTH                  => 'title_error_label_too_long',
            $title->signatureText === ''                                       => 'title_error_value_required',
            mb_strlen($title->signatureText) > self::MAX_SIGNATURE_TEXT_LENGTH => 'title_error_value_too_long',
            $this->repository->labelExists($title->label, $title->id)          => 'title_error_label_exists',
            default                                                            => null,
        };

        return $key === null ? null : new SignatureValidationError($key);
    }

    /**
     * Vérifie un DN avant de l'ajouter.
     *
     * @throws SignatureStorageException
     */
    #[\NoDiscard('Ignorer le résultat revient à ne pas contrôler le DN')]
    public function validateDn(string $dn): ?SignatureValidationError
    {
        $owner = $dn === '' ? null : $this->repository->findDnOwnerLabel($dn);

        $key = match (true) {
            $dn === ''                                       => 'title_error_dn_required',
            mb_strlen($dn) > self::MAX_DN_LENGTH             => 'title_error_dn_too_long',
            strcasecmp($dn, SignatureTitleDn::DEFAULT) === 0 => 'title_error_dn_reserved',
            !str_contains($dn, '=')                          => 'title_error_dn_invalid',
            $owner !== null                                  => 'title_error_dn_exists',
            default                                          => null,
        };

        return $key === null ? null : new SignatureValidationError($key, ['label' => $owner ?? '']);
    }
}
