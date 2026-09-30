<?php
declare(strict_types = 1);

/**
 * Module « Informations » : dernière actualité de l'utilisateur (plugin mel_news).
 */
class Headlines extends Module
{
    public function init(): void
    {
        mel_logs::gi()->log(mel_logs::DEBUG, '[mel_portal] Initialisation du module Headlines');
        $this->edit_row_size(4);
        $this->edit_order(3);
        $this->set_use_custom_style(true);
    }

    public function enabled(): bool
    {
        return class_exists('mel_news');
    }

    /**
     * Action AJAX : renvoie la dernière actualité en JSON.
     *
     * @return news_datas
     */
    #[BnumAction('get_last_new', json: true)]
    public function action_get_last_news(): news_datas
    {
        return $this->get_last_news();
    }

    protected function generate_html(): string
    {
        $this->plugin->require_plugin('mel_helper');
        mel_helper::html_helper();

        $plugin_news = $this->rc->plugins->get_plugin('mel_news');
        $news = $this->get_last_news();

        $html = isset($news->id)
            ? html::div(['class' => '--row --row-dwp--under'],
                html::div(['class' => '--col-dwp--under --under-col-first --col '],
                    $news->html($plugin_news->load_news_model(), $plugin_news, 'margin-bottom:15px;')
                )
            )
            : html::div(['style' => 'margin:15px'], $plugin_news->gettext('no_news', 'mel_news'));

        return html::tag('bnum-card', ['data-title-text' => $this->text('headline'), 'data-title-icon' => 'feed'], $html);
    }

    protected function include_css(): void
    {
        $this->plugin->include_stylesheet('modules/headlines/css/headlines.css');
    }

    /**
     * Récupère la dernière actualité de l'utilisateur courant.
     *
     * @return news_datas
     */
    private function get_last_news(): news_datas
    {
        include_once __DIR__ . '/../../../mel_news/lib/news_datas.php';

        return new news_datas(driver_mel::gi()->getUser()->getUserLastNews());
    }
}
