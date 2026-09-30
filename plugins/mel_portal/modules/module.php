<?php
declare(strict_types = 1);

/**
 * Classe de base des modules du portail Mél
 *
 * Portail web
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

/**
 * Module affiché sur le portail.
 *
 * Un module se configure dans {@see Module::init()} (taille, ordre, style) et
 * produit son html dans {@see Module::generate_html()}. Ses actions AJAX se
 * déclarent avec `#[BnumAction]` sur des méthodes publiques ; elles sont
 * enregistrées par {@see mel_portal}.
 */
abstract class Module
{
    public const DEFAULT_ORDER = 9999;
    public const HTML_CARD_CLASS = 'melv2-card';
    public const HTML_CARD_CONTENTS_CLASS = 'melv2-card-contents';
    public const HTML_CARD_PRE_CONTENTS_CLASS = 'melv2-card-pre';
    public const HTML_CARD_TITLE_CLASS = 'melv2-card-title';
    public const HTML_CARD_ICON_CLASS = 'melv2-card-icon';
    public const HTML_CARD_ICON_DATAS = 'data-melv2-icon';

    /** Instance rcmail. */
    protected readonly rcmail $rc;

    /** Largeur de colonne bootstrap du module. */
    private ?int $row_size = null;

    /** Ordre par défaut du module, surchargeable par la config `module_orders`. */
    private ?int $order = null;

    /** Si vrai, le html du module est affiché tel quel, sans carte générique. */
    private bool $custom_style = false;

    /** Titre de la carte générique. */
    private ?string $name = null;

    /** Icône de la carte générique. */
    private ?string $icon = null;

    /**
     * @param string     $id     Identifiant du module (nom de son dossier)
     * @param mel_portal $plugin Plugin portail
     */
    public function __construct(
        protected readonly string $id,
        protected readonly mel_portal $plugin,
    ) {
        $this->rc = rcmail::get_instance();
    }

    /**
     * Configure le module (taille, ordre, style…).
     */
    abstract public function init(): void;

    /**
     * Génère le html propre au module.
     *
     * @return string
     */
    abstract protected function generate_html(): string;

    /**
     * Indique si le module doit être affiché.
     *
     * @return bool
     */
    public function enabled(): bool
    {
        return true;
    }

    /**
     * @return int|null Largeur de colonne bootstrap
     */
    public function row_size(): ?int
    {
        return $this->row_size;
    }

    /**
     * @param int $size Largeur de colonne bootstrap
     */
    public function edit_row_size(int $size): void
    {
        $this->row_size = $size;
    }

    /**
     * @return int Ordre d'affichage (config `module_orders` prioritaire)
     */
    #[\NoDiscard("order() ne modifie rien : son seul effet est de renvoyer l'ordre d'affichage du module")]
    public function order(): int
    {
        return (int) ($this->rc->config->get('module_orders', [])[$this->id] ?? $this->order ?? self::DEFAULT_ORDER);
    }

    /**
     * @param int $order Ordre d'affichage par défaut
     */
    public function edit_order(int $order): void
    {
        $this->order = $order;
    }

    /**
     * @return bool Vrai si le module gère lui-même son rendu
     */
    public function use_custom_style(): bool
    {
        return $this->custom_style;
    }

    /**
     * @param bool $use Vrai si le module gère lui-même son rendu
     */
    public function set_use_custom_style(bool $use): void
    {
        $this->custom_style = $use;
    }

    /**
     * @param string $name Titre de la carte générique
     */
    public function set_name(string $name): void
    {
        $this->name = $name;
    }

    /**
     * @param string $icon Icône de la carte générique
     */
    public function set_icon(string $icon): void
    {
        $this->icon = $icon;
    }

    /**
     * Génère le html du module, encapsulé dans la carte générique sauf style personnalisé.
     *
     * @return string
     */
    #[\NoDiscard("item_html() n'affiche rien : le html renvoyé doit être ajouté à la page")]
    public function item_html(): string
    {
        $html = $this->generate_html();

        if ($this->use_custom_style()) {
            return $html;
        }

        return $this->render_card($html);
    }

    /**
     * Ajoute les ressources (js, css, variables d'environnement) du module.
     */
    public function include_module(): void
    {
        $this->include_js();
        $this->include_css();
        $this->set_js_vars();
    }

    /**
     * Récupère un texte localisé du plugin.
     *
     * @param string $text Clé du texte
     *
     * @return string
     */
    #[\NoDiscard("text() ne fait que traduire : ignorer le texte renvoyé rend l'appel inutile")]
    public function text(string $text): string
    {
        return $this->plugin->gettext($text);
    }

    protected function include_js(): void {}

    protected function include_css(): void {}

    protected function set_js_vars(): void {}

    /**
     * Encapsule le html dans la carte générique, avec icône et titre s'ils sont définis.
     *
     * @param string $html Html du module
     *
     * @return string
     */
    #[\NoDiscard("render_card() génère du html : ignorer le html renvoyé rend l'appel inutile")]
    private function render_card(string $html): string
    {
        $pre_contents = [];

        if ($this->icon !== null) {
            $pre_contents[] = html::span(['class' => self::HTML_CARD_ICON_CLASS, self::HTML_CARD_ICON_DATAS => $this->icon], '');
        }

        if ($this->name !== null) {
            $pre_contents[] = html::tag('h2', [], html::a(['class' => self::HTML_CARD_TITLE_CLASS], $this->name));
        }

        if ($pre_contents !== []) {
            $html = html::div(['class' => self::HTML_CARD_PRE_CONTENTS_CLASS], implode('', $pre_contents))
                . html::div(['class' => self::HTML_CARD_CONTENTS_CLASS], $html);
        }

        return html::div(['class' => self::HTML_CARD_CLASS], $html);
    }
}
