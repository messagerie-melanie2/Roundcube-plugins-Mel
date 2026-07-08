<?php
declare(strict_types=1);
include_once __DIR__ . '/../../../../mel_workspace/skins/mel_elastic/php/mel_elastic_workspace_layout.php';

/**
 * Factory du layout du module « Liens utiles » pour le workspace, skin mel_elastic.
 *
 * Suit le pattern closure factory de `mel_workspace` : ce fichier de skin
 * retourne une fonction qui instancie le layout via injection de dépendances,
 * plutôt qu'un `include` qui exposerait le scope de l'appelant.
 *
 * @param WorkspacePageLayout $layout    Layout de page du workspace à compléter
 * @param mel_workspace       $plugin    Instance du plugin `mel_workspace`
 * @param Workspace           $workspace Workspace courant
 *
 * @return AWorkspaceLayout Layout anonyme prêt à être rendu
 */
return static function (WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace): AWorkspaceLayout {
    return new class($layout, $plugin, $workspace) extends AMelElasticWorkspaceLayout {

        /**
         * Ajoute le bloc « Liens utiles » sur la troisième ligne du workspace.
         *
         * Le bloc est rendu en variante réduite (`mode-small`) et occupe la
         * pleine largeur de la ligne.
         *
         * @return WorkspacePageLayout Layout de page mis à jour
         */
        public function render(): WorkspacePageLayout
        {
            $layout = $this->getLayout();
            $SIZE = 12;

            $html = $this->melHtmlModuleBlockSmall('link', 'Liens utiles', EMPTY_STRING, ['id' => 'module-ul']);
            $layout->thirdRow()->append($SIZE, $html);

            return $layout;
        }
    };
};