<?php
return static function (WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace): AWorkspaceLayout {
    return new class($layout, $plugin, $workspace) extends AWorkspaceLayout {

        public function render(): WorkspacePageLayout
        {
            // $NO_BUTTON = EMPTY_STRING;
            $layout = $this->getLayout();
            // $workspace = $this->getWorkspace();
            // $plugin = $this->getPlugin(); 
            $SIZE = 12;

            $button = $this->_htmlButtonAction('mulba', 'add', 'Ajouter', 'primary');
            $html = $this->_htmlModuleBlock('link_2', 'Liens utiles', $button, ['id' => 'module-ul']);//(['id' => 'module-ul', 'data-title' => 'Liens utiles']);
            $layout->thirdRow()->append($SIZE, $html);

            return $layout;
        }

    private function _htmlButtonAction(string $id, string $icon, string $text, string $variation = 'secondary') {
        return html::tag('bnum-button', ['id' => $id, 'data-icon' => $icon, 'data-variation' => $variation], $text);
    }

    private function _htmlModuleBlock(string $icon, string $title, string $button, array $attribs = [], string $content = EMPTY_STRING): string {
        $attribs ??= [];
        $attribs = array_merge($attribs,         [
            'data-title-icon' => $icon, 
            'data-title-text' => $title,
        ]);

        $slot = html::div(['slot' => 'title', 'class' => 'bds-flex'],
            html::div(['class' => 'bds-flex'],
                html::tag('bnum-card-title', ['data-icon' => $icon], $title)
                ).
            html::div(['class' => 'action'], $button)
        );

        return html::tag('bnum-card', $attribs, html::div(['class', 'module-block-content'], $slot.$content));
    }
    };
};