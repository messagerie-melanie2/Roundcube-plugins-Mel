<?php
declare(strict_types=1);

namespace Bnum\Attributes;

use Attribute;

/**
 * Marque un élément du code comme ayant une tâche en attente.
 *
 * Alternative typée aux commentaires `// TODO` : les occurrences se retrouvent
 * via la recherche d'usages de l'IDE ou par réflexion, et suivent les
 * renommages lors d'un refactoring.
 *
 * Applicable à toute déclaration (classe, méthode, fonction, propriété,
 * paramètre, constante) et répétable sur un même élément.
 *
 * Exemple :
 * ```php
 * #[ToDo('Gérer le cas des dossiers partagés')]
 * #[ToDo('Ajouter la pagination')]
 * public function listFolders(): array {}
 * ```
 *
 * Note : une tâche située à l'intérieur d'un corps de méthode ne peut pas
 * porter d'attribut ; utiliser un commentaire dans ce cas.
 */
#[Attribute(Attribute::TARGET_ALL | Attribute::IS_REPEATABLE)]
final readonly class ToDo
{
    /**
     * @param string $what Description de la tâche restant à effectuer.
     */
    public function __construct(
        public string $what,
    ) {}
}