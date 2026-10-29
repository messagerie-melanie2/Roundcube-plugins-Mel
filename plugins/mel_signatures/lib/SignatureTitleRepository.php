<?php

declare(strict_types=1);

namespace MelSignatures;

use PDOStatement;
use rcube_db;

/**
 * Toutes les requêtes SQL sur les tables des libellés.
 * Si une requête échoue, une SignatureStorageException est levée.
 */
final class SignatureTitleRepository
{
    public function __construct(
        private readonly rcube_db $db,
    ) {}

    /**
     * Tous les libellés, par ordre alphabétique.
     *
     * @return list<SignatureTitle>
     */
    #[\NoDiscard('La liste des libellés est le seul résultat de cet appel')]
    public function findAll(): array
    {
        $result = $this->query(
            'SELECT title_id, title_label, title_signature_text FROM mel_signatures_titles ORDER BY title_label'
        );

        $titles = [];
        while ($row = $this->db->fetch_assoc($result)) {
            $titles[] = SignatureTitle::fromRow($row);
        }

        return $titles;
    }

    /**
     * Un libellé, ou null s'il n'existe pas.
     */
    #[\NoDiscard('Le libellé trouvé est le seul résultat de cet appel')]
    public function find(int $titleId): ?SignatureTitle
    {
        $row = $this->db->fetch_assoc($this->query(
            'SELECT title_id, title_label, title_signature_text FROM mel_signatures_titles WHERE title_id = ?',
            $titleId
        ));

        return $row ? SignatureTitle::fromRow($row) : null;
    }

    /**
     * Les DN d'un libellé.
     *
     * @return list<SignatureTitleDn>
     */
    #[\NoDiscard('La liste des DN est le seul résultat de cet appel')]
    public function findDns(int $titleId): array
    {
        $result = $this->query(
            'SELECT title_dn_id, dn FROM mel_signatures_title_dn WHERE title_id = ? ORDER BY dn',
            $titleId
        );

        $dns = [];
        while ($row = $this->db->fetch_assoc($result)) {
            $dns[] = SignatureTitleDn::fromRow($row);
        }

        return $dns;
    }

    /**
     * Identifiant du libellé par défaut, ou null s'il n'y en a pas.
     */
    #[\NoDiscard('L\'identifiant du libellé par défaut est le seul résultat de cet appel')]
    public function findDefaultTitleId(): ?int
    {
        $row = $this->db->fetch_assoc($this->query(
            'SELECT title_id FROM mel_signatures_title_dn WHERE dn = ?',
            SignatureTitleDn::DEFAULT
        ));

        return $row ? (int) $row['title_id'] : null;
    }

    /**
     * Libellé à proposer à un agent : celui du DN le plus précis qui correspond,
     * sinon le libellé par défaut.
     */
    #[\NoDiscard('L\'identifiant du libellé à proposer est le seul résultat de cet appel')]
    public function findTitleIdForUserDn(string $userDn): ?int
    {
        $result = $this->query('SELECT title_id, dn FROM mel_signatures_title_dn');

        $bestId     = null;
        $bestLength = 0;
        $defaultId  = null;

        while ($row = $this->db->fetch_assoc($result)) {
            $dn = (string) $row['dn'];

            if ($dn === SignatureTitleDn::DEFAULT) {
                $defaultId = (int) $row['title_id'];
            }
            elseif (strlen($dn) > $bestLength && str_contains($userDn, $dn)) {
                $bestId     = (int) $row['title_id'];
                $bestLength = strlen($dn);
            }
        }

        return $bestId ?? $defaultId;
    }

    /**
     * Nom du libellé qui a déjà ce DN, ou null si le DN est libre.
     */
    #[\NoDiscard('Le nom du libellé trouvé est le seul résultat de cet appel')]
    public function findDnOwnerLabel(string $dn): ?string
    {
        $row = $this->db->fetch_assoc($this->query(
            'SELECT t.title_label FROM mel_signatures_title_dn d'
            . ' JOIN mel_signatures_titles t ON t.title_id = d.title_id'
            . ' WHERE d.dn = ?',
            $dn
        ));

        return $row ? (string) $row['title_label'] : null;
    }

    /**
     * Vrai si un autre libellé a déjà ce nom, en ignorant les majuscules.
     *
     * @param int $exceptTitleId Le libellé en cours de modification
     */
    #[\NoDiscard('La réponse est le seul résultat de cet appel')]
    public function labelExists(string $label, int $exceptTitleId = 0): bool
    {
        $row = $this->db->fetch_assoc($this->query(
            'SELECT 1 FROM mel_signatures_titles WHERE LOWER(title_label) = LOWER(?) AND title_id <> ?',
            $label,
            $exceptTitleId
        ));

        return (bool) $row;
    }

    /**
     * Crée un libellé et renvoie son identifiant.
     * On utilise RETURNING car insert_id() de Roundcube ne marche pas avec ces tables.
     */
    public function create(SignatureTitle $title): int
    {
        $row = $this->db->fetch_assoc($this->query(
            'INSERT INTO mel_signatures_titles (title_label, title_signature_text) VALUES (?, ?) RETURNING title_id',
            $title->label,
            $title->signatureText
        ));

        if (!$row) {
            throw new SignatureStorageException('INSERT dans mel_signatures_titles sans identifiant renvoyé');
        }

        return (int) $row['title_id'];
    }

    /**
     * Modifie le nom et le texte d'un libellé.
     */
    public function update(SignatureTitle $title): void
    {
        $this->query(
            'UPDATE mel_signatures_titles SET title_label = ?, title_signature_text = ?, updated_at = NOW() WHERE title_id = ?',
            $title->label,
            $title->signatureText,
            $title->id
        );
    }

    /**
     * Supprime un libellé. La base supprime aussi ses DN.
     */
    public function delete(int $titleId): void
    {
        $this->query('DELETE FROM mel_signatures_titles WHERE title_id = ?', $titleId);
    }

    /**
     * Fait de ce libellé le libellé par défaut.
     */
    public function setDefault(int $titleId): void
    {
        $result = $this->query(
            'UPDATE mel_signatures_title_dn SET title_id = ?, updated_at = NOW() WHERE dn = ?',
            $titleId,
            SignatureTitleDn::DEFAULT
        );

        if ($this->db->affected_rows($result) === 0) {
            $this->query(
                'INSERT INTO mel_signatures_title_dn (title_id, dn) VALUES (?, ?)',
                $titleId,
                SignatureTitleDn::DEFAULT
            );
        }
    }

    /**
     * Ajoute un DN à un libellé.
     */
    public function addDn(int $titleId, string $dn): void
    {
        $this->query('INSERT INTO mel_signatures_title_dn (title_id, dn) VALUES (?, ?)', $titleId, $dn);
    }

    /**
     * Supprime un DN d'un libellé, jamais la ligne « default ».
     */
    public function deleteDn(int $titleId, int $titleDnId): void
    {
        $this->query(
            'DELETE FROM mel_signatures_title_dn WHERE title_dn_id = ? AND title_id = ? AND dn <> ?',
            $titleDnId,
            $titleId,
            SignatureTitleDn::DEFAULT
        );
    }

    /**
     * Exécute une requête.
     *
     * @throws SignatureStorageException Si la requête échoue
     */
    private function query(string $sql, int|string ...$params): PDOStatement
    {
        $result = $this->db->query($sql, ...$params);

        if (!$result instanceof PDOStatement) {
            throw new SignatureStorageException('Échec de la requête : ' . $sql);
        }

        return $result;
    }
}
