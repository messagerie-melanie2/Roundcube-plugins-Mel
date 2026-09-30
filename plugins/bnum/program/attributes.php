<?php
declare(strict_types = 1);

/**
 * Attributs déclaratifs lus par {@see bnum_plugin::register_attributes()}.
 *
 * Préfixés « Bnum » car le projet n'utilise pas d'espaces de noms : des noms
 * génériques (Action, Hook, Handler) entreraient en collision avec d'autres
 * classes globales (vendors inclus).
 */

/**
 * Déclare une méthode publique comme action Roundcube du plugin.
 *
 * @example
 * #[BnumAction('save_settings', csrf: true)]
 * public function save_settings(): void { … }
 */
#[Attribute(Attribute::TARGET_METHOD)]
final class BnumAction
{
    /**
     * @param string      $name Nom de l'action (unique).
     * @param string|null $task Tâche liée à l'action ; `null` = tâches du plugin (`$task`).
     * @param bool        $csrf Exige un POST muni d'un jeton CSRF valide avant le handler.
     * @param bool        $json Envoie la valeur retournée en JSON puis termine la requête.
     */
    public function __construct(
        public readonly string $name,
        public readonly ?string $task = null,
        public readonly bool $csrf = false,
        public readonly bool $json = false,
    ) {}
}

/**
 * Déclare une méthode publique comme handler d'un hook Roundcube.
 *
 * Un hook ne peut être déclaré qu'une fois par plugin ; si le handler
 * retourne `null`, les arguments d'origine sont renvoyés.
 *
 * @example
 * #[BnumHook('render_page')]
 * public function injecter_composant(array $args): array { … }
 */
#[Attribute(Attribute::TARGET_METHOD)]
final class BnumHook
{
    /**
     * @param string $name Nom du hook Roundcube.
     */
    public function __construct(public readonly string $name) {}
}

/**
 * Déclare une méthode publique comme handler d'objet de template
 * (`<roundcube:object name="…" />`).
 *
 * @example
 * #[BnumHandler('plugin.mon_objet')]
 * public function render_mon_objet(array $attrib): string { … }
 */
#[Attribute(Attribute::TARGET_METHOD)]
final class BnumHandler
{
    /**
     * @param string $name Nom de l'objet de template.
     */
    public function __construct(public readonly string $name) {}
}
