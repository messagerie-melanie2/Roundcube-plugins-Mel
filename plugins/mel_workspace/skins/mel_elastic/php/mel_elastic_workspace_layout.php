<?php

declare(strict_types=1);

/**
 * Classe de base pour les layouts de workspace de la skin mel_elastic.
 *
 * Regroupe les helpers HTML communs aux implémentations concrètes de
 * {@see AWorkspaceLayout} pour cette skin (boutons d'action, blocs de module).
 */
abstract class AMelElasticWorkspaceLayout extends AWorkspaceLayout {
    abstract public function render(): WorkspacePageLayout;

    /**
     * Construit un bouton d'action déclenchant la commande `wsp-exec-action`.
     *
     * @param string $id        Identifiant de l'action, transmis à la commande cliquée
     * @param string $icon      Icône du bouton
     * @param string $text      Texte affiché sur le bouton
     * @param string $variation Variation visuelle du bouton
     *
     * @return string Balise `bnum-button` générée
     */
    protected function melHtmlButtonAction(string $id, string $icon, string $text, string $variation = 'secondary'): string {
        return html::tag('bnum-button', [
            'id' => $id,
            'data-icon' => $icon,
            'data-variation' => $variation,
            'onclick' => "rcmail.command('wsp-exec-action', '{$id}')",
        ], $text);
    }

    /**
     * Construit un bloc de module avec titre, bouton d'action et contenu.
     *
     * @param string $icon    Icône du titre
     * @param string $title   Texte du titre
     * @param string $button  HTML du bouton d'action affiché à côté du titre
     * @param array<string, mixed> $attribs Attributs additionnels de la balise racine (ex. `tag`, `id`)
     * @param string $content Contenu HTML du corps du bloc
     *
     * @return string Balise du bloc de module générée
     */
    protected function melHtmlModuleBlock(string $icon, string $title, string $button, array $attribs = [], string $content = EMPTY_STRING): string {
        $slot =  '<div slot="title" class="bds-flex bds-flex-justify-between module-block-header">'.
            html::div(['class' => 'bds-flex'],
                html::tag('bnum-card-title', ['data-icon' => $icon], $title)
                ).
            html::div(['class' => 'action'], $button)
        .'</div>';

        $tag = $attribs['tag'] ?? 'bnum-card';

        return html::tag($tag, $attribs, $slot.html::div(['class' => 'module-block-content'], $content));
    }

    /**
     * Construit un bloc de module en variante réduite (classe `mode-small`).
     *
     * @param string $icon    Icône du titre
     * @param string $title   Texte du titre
     * @param string $button  HTML du bouton d'action affiché à côté du titre
     * @param array<string, mixed> $attribs Attributs additionnels de la balise racine (ex. `tag`, `id`)
     * @param string $content Contenu HTML du corps du bloc
     *
     * @return string Balise du bloc de module générée, en mode réduit
     */
    protected function melHtmlModuleBlockSmall(string $icon, string $title, string $button, array $attribs = [], string $content = EMPTY_STRING): string {
        $attribs['class'] = trim(($attribs['class'] ?? EMPTY_STRING).' mode-small');

        return $this->melHtmlModuleBlock($icon, $title, $button, $attribs, $content);
    }
}