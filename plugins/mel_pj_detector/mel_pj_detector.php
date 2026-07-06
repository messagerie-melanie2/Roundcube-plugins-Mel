<?php

/**
 * Plugin de détection de pièce jointe manquante.
 *
 * Affiche une alerte de confirmation à l'utilisateur lorsqu'il tente
 * d'envoyer un message qui semble faire référence à une pièce jointe
 * (via une liste de mots-clés configurable) mais qu'aucun fichier
 * n'est réellement joint au message.
 *
 * La recherche des mots-clés s'effectue dans le corps du message et,
 * optionnellement, dans l'objet. La liste des mots-clés, la prise en
 * compte de l'objet et la sensibilité à la casse sont entièrement
 * paramétrables via la config.
 *
 */
class mel_pj_detector extends bnum_plugin
{
    public $task = 'mail';

    /**
     * Initialise le plugin.
     *
     * Charge la configuration uniquement sur l'écran de composition
     * d'un message (task=mail, action=compose), enregistre les textes
     * de localisation, inclut le script JS de détection et transmet
     * au client les paramètres nécessaires (mots-clés, options de
     * recherche) via les variables d'environnement Roundcube.
     *
     * @return void
     */
    public function init()
    {
        $this->load_config();

        if ($this->rc()->task === 'mail' && $this->rc()->action === 'compose') {
            $this->add_texts('localization/', true);

            $this->include_script('js/lib/mel_pj_detector.js');

            // Mots-clés et options depuis la config
            $this->rc()->output->set_env('missing_attachment_keywords',
                $this->rc()->config->get('missing_attachment_keywords', [])
            );
            $this->rc()->output->set_env('missing_attachment_check_subject',
                (bool) $this->rc()->config->get('missing_attachment_check_subject')
            );
            $this->rc()->output->set_env('missing_attachment_case_sensitive',
                (bool) $this->rc()->config->get('missing_attachment_case_sensitive')
            );

            // Label pour la pop-up de confirmation
            $this->rc()->output->add_label('missingattachmentconfirm');
        }
    }
}
