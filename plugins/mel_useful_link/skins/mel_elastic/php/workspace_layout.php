<?php
declare(strict_types=1);
include_once __DIR__ . '/../../../../mel_workspace/skins/mel_elastic/php/mel_elastic_workspace_layout.php';

return static function (WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace): AWorkspaceLayout {
    return new class($layout, $plugin, $workspace) extends AMelElasticWorkspaceLayout {

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