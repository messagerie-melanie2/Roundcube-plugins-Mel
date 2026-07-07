<?php
abstract class AMelElasticWorkspaceLayout extends AWorkspaceLayout {
    public function __construct(WorkspacePageLayout $layout, mel_workspace $plugin, Workspace $workspace) {
        parent::__construct($layout, $plugin, $workspace);
    }

    abstract public function render(): WorkspacePageLayout;

    protected function _htmlModuleBlock(string $icon, string $title, string $button, array $attribs = [], string $content = EMPTY_STRING): string {
        $attribs ??= [];

        $slot =  '<div slot="title" class="bds-flex">'. //html::div(['slot' => 'title', 'class' => 'bds-flex'],
            html::div(['class' => 'bds-flex'],
                html::tag('bnum-card-title', ['data-icon' => $icon], $title)
                ).
            html::div(['class' => 'action'], $button)
        .'</div>';

        $tag = $attribs['tag'] ? $attribs['tag'] : 'bnum-card';

        return html::tag($tag, $attribs, $slot.html::div(['class' => 'module-block-content'], $content));
    }
}