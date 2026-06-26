<?php

class mel_pj_detector extends bnum_plugin
{
    public $task = 'mail';

    public function init()
    {
        $this->add_texts('localization/', true);

        $this->rc()->output->set_env('missing_attachment_keywords',
            $this->rc()->config->get('missing_attachment_keywords', [])
        );
        $this->rc()->output->set_env('missing_attachment_check_subject',
            (bool) $this->rc()->config->get('missing_attachment_check_subject', false)
        );
        $this->rc()->output->set_env('missing_attachment_case_sensitive',
            (bool) $this->rc()->config->get('missing_attachment_case_sensitive', false)
        );

        // Charge le JS uniquement en composition
        if ($this->rc()->task === 'mail') {
            $this->include_script('js/lib/mel_pj_detector.js');
        }
    }
}
