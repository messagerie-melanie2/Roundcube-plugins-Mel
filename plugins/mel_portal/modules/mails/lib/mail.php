<?php
declare(strict_types = 1);

/**
 * Résumé d'un message, sérialisé en JSON pour le module « Courriers récents ».
 */
final class Mail
{
    /**
     * @param string|null $subject Sujet décodé
     * @param string|null $date    Date brute de l'en-tête
     * @param string|null $from    Expéditeur décodé
     * @param int         $id      Numéro de séquence IMAP
     * @param int|null    $uid     UID IMAP
     */
    public function __construct(
        public readonly ?string $subject,
        public readonly ?string $date,
        public readonly ?string $from,
        public readonly int $id,
        public readonly ?int $uid,
    ) {}

    /**
     * Construit le résumé à partir d'un en-tête Roundcube.
     *
     * @param rcube_message_header $header En-tête du message
     *
     * @return self
     */
    #[\NoDiscard("from_header() ne modifie pas l'en-tête : son seul effet est de renvoyer un nouveau Mail")]
    public static function from_header(rcube_message_header $header): self
    {
        return new self(
            rcube_mime::decode_header($header->subject, $header->charset),
            $header->date,
            rcube_mime::decode_header($header->from, $header->charset),
            (int) $header->id,
            isset($header->uid) ? (int) $header->uid : null,
        );
    }
}
