<?php
/**
 * Plugin Mél Commentaire
*
* Affiche les commentaires du Courrielleur dans Mél web
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

class mel_commentaire extends rcube_plugin
{
    /**
     * Header for Commentaire
     */
    private static $header = 'X-Suivimel';

    /**
     * Tasks du plugin
     * @var string
     */
    public $task = 'mail';

    /**
     * Initialisation du plugin
     */
    function init() {
        $rcmail = rcmail::get_instance();
        
        if ($rcmail->action == 'show' || $rcmail->action == 'preview') {
            $this->add_hook('storage_init', array($this, 'storage_init'));
            $this->add_hook('message_headers_output', array($this, 'message_headers'));
        }
    }

    /** 
     * Add header X-Suivimel
     */
    function storage_init($p) {
        $p['fetch_headers'] = trim($p['fetch_headers'] . ' ' . strtoupper(self::$header));
        return $p;
    }

    /**
     * Change From message header
     */
    function message_headers($args) {
        if ($header = $args['headers']->get(strtolower(self::$header), true)) {
            $commentaires = explode("¤¤", $header);
            $html = '';
            $i = 0;
            $firstline = null;
            foreach ($commentaires as $commentaire) {
                if (!isset($firstline)) 
                {
                    $firstline = $commentaire;
                    $commentaire = html::tag('span', ['class' => 'icon-mel-chevron-down']).$commentaire;
                }

                $html .= html::div(($i % 2) === 0 ? 'label' : 'comment', $commentaire);
                $i++;
            }

            if ($i > 1)
            {
                $tmp = html::div(['class' => 'falselink noselect comment-to-unploy', 'onclick' => 'mel_deploy_undeploy(this, `.comment-to-deploy`)'], html::tag('span', ['class' => 'icon-mel-chevron-right']).$firstline.'...');
                $html = $tmp.html::div(['class' => 'falselink comment-to-deploy','style' => 'display:none', 'onclick' => 'mel_deploy_undeploy(`.comment-to-unploy`, `.comment-to-deploy`)'], $html);
            }

            $args['output']['commentaire'] = [
                'title' => 'Commentaires',
                'value' => $html,
                'raw'   => $header,
                'html'  => true,
            ];
        }
            
        return $args;
    }
}