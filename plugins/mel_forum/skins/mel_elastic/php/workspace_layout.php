<?php
declare(strict_types=1);
include_once __DIR__ . '/../../../../mel_workspace/skins/mel_elastic/php/mel_elastic_workspace_layout.php';

/**
 * Factory du layout du module « Forum » pour le workspace, skin mel_elastic.
 *
 * Suit le pattern closure factory de `mel_workspace` : ce fichier de skin
 * retourne une fonction qui instancie le layout via injection de dépendances,
 * plutôt qu'un `include` qui exposerait le scope de l'appelant.
 *
 * @param WorkspacePageLayout $layout    Layout de page du workspace à compléter
 * @param mel_workspace       $plugin    Instance du plugin `mel_workspace`
 * @param Workspace           $workspace Espace de travail courant
 *
 * @return AWorkspaceLayout Layout anonyme prêt à être rendu
 */
return static function (WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace): AWorkspaceLayout {
return new class($layout, $plugin, $workspace) extends AMelElasticWorkspaceLayout {

    /**
     * Ajoute les blocs « À la une » et « Derniers articles » du forum,
     * ainsi que l'entrée de navigation dédiée.
     *
     * @return WorkspacePageLayout Layout de page mis à jour
     */
    public function render(): WorkspacePageLayout
    {
        $NO_BUTTON = EMPTY_STRING;
        $layout = $this->getLayout();

        $layout->setNavBarSetting('forum', 'newspaper', true, 4);
        $layout->firstRow()->append(12, $this->melHtmlModuleBlockSmall('newspaper', 'À la une', $NO_BUTTON, ['id' => 'module-forum-news']));
        $layout->secondRow()->prepend(8, $this->melHtmlModuleBlock('newspaper', 'Derniers articles', $NO_BUTTON, ['id' => 'module-forum-last']), 6, 6);

        return $layout;
    }
};
};