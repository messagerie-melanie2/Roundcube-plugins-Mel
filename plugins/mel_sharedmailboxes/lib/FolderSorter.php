<?php

declare(strict_types=1);

/**
 * PAMELA - 0009306 : tri alphabétique des dossiers avec le Collator intl.
 *
 * strcoll() dépend des locales du serveur, absentes du conteneur PHP :
 * les dossiers commençant par une majuscule accentuée se retrouvaient en fin de liste.
 */
final readonly class FolderSorter
{
    /**
     * @param list<string> $specials Dossiers gardés en tête (INBOX et dossiers spéciaux)
     */
    public function __construct(
        protected \Collator $collator,
        protected array $specials,
    ) {}

    /**
     * Trie récursivement un arbre de dossiers (format rcmail_action::build_folder_tree).
     *
     * @param array<string|int, array<string, mixed>> $tree
     *
     * @return array<string|int, array<string, mixed>>
     */
    #[\NoDiscard('La réponse est le seul résultat de cet appel')]
    public function sort_tree(array $tree): array
    {
        foreach ($tree as $key => $folder) {
            if (!empty($folder['folders'])) {
                $tree[$key]['folders'] = $this->sort_tree($folder['folders']);
            }
        }

        return $this->sort_level($tree, 'name', 'id');
    }

    /**
     * Trie une liste à plat indexée par chemin IMAP (hook folders_list), niveau par niveau.
     *
     * @param array<string|int, array<string, mixed>> $list
     *
     * @return array<string|int, array<string, mixed>>
     */
    #[\NoDiscard('La réponse est le seul résultat de cet appel')]
    public function sort_flat_list(array $list, string $delimiter): array
    {
        $children = [];

        foreach ($list as $id => $row) {
            $position = strrpos((string) $id, $delimiter);
            $parent   = $position === false ? '' : substr((string) $id, 0, $position);
            $children[$parent][$id] = $row;
        }

        $sorted = [];
        $this->append_sorted($children, '', $sorted);

        // Ne jamais perdre un dossier (ex. parent absent de la liste)
        return $sorted + $list;
    }

    /**
     * Trie un niveau : dossiers spéciaux en tête, les autres par ordre alphabétique.
     *
     * @param array<string|int, array<string, mixed>> $entries
     *
     * @return array<string|int, array<string, mixed>>
     */
    #[\NoDiscard('La réponse est le seul résultat de cet appel')]
    protected function sort_level(array $entries, string $label_key, ?string $id_key = null): array
    {
        $top    = [];
        $others = [];

        foreach ($entries as $key => $entry) {
            $id = (string) ($id_key === null ? $key : ($entry[$id_key] ?? ''));

            if (in_array($id, $this->specials, true)) {
                $top[$key] = $entry;
            }
            else {
                $others[$key] = $entry;
            }
        }

        $collator = $this->collator;
        uasort($others, static fn (array $a, array $b): int => (int) $collator->compare((string) ($a[$label_key] ?? ''), (string) ($b[$label_key] ?? '')));

        return $top + $others;
    }

    /**
     * Ajoute à $sorted les enfants triés de $parent, en profondeur.
     *
     * @param array<string, array<string|int, array<string, mixed>>> $children
     * @param array<string|int, array<string, mixed>>                $sorted
     */
    protected function append_sorted(array $children, string $parent, array &$sorted): void
    {
        foreach ($this->sort_level($children[$parent] ?? [], 'display') as $id => $row) {
            $sorted[$id] = $row;
            $this->append_sorted($children, (string) $id, $sorted);
        }
    }
}
