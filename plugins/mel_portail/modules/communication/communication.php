<?php
/**
 * Module Communication pour le portail Mél
 *
 * Portail web
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

class Communication extends Module {
    /**
     * Génère un item html en fonction des propriétés
     * 
     * @param array $attrib
     * @param array $item
     * @param string $user_dn
     * 
     * @return string HTML
     */
    public function item_html($attrib, &$item, $user_dn) {
        $content = "";
        $attrib['class'] = $item['type'] . " item";
        // Gestion du bouton flip
        if ($item['flip']) {
            $flip = html::div('flip', html::tag('button', [], 'Flip'));
        }
        else {
            $flip = "";
        }
        // Récupération du header
        $header = $this->getHeader($attrib, $item, $flip);

        // Gestion des boutons
        $buttons = html::a(['href' => $item['url'], 'target' => $item['newtab'] ? '_blank': null, 'onclick' => $item['onclick'] ?: null],
            html::tag('span', 'description', $item['description'])
        );

        // Générer le contenu html
        if ($item['flip']) {
            // Contenu
            $content_back = $this->getTips($item);
            // Front + back
            $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $header . $buttons) .
                        html::tag('article', 'back', html::tag('header', [], $flip) . $content_back);
        }
        else {
            // Front
            $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $header . $buttons) .
                        html::tag('article', 'back blank', '');
        }
        return html::tag('article', $attrib, $this->getManagingDiv($item) . $content);
    }

    /**
     * Handler HTML dédié au module
     */
    public function settings_handler($attrib) {
        $item = $this->rc->output->get_env('personal_item');
        return $this->settings_table(['name', 'tooltip', 'provenance', 'url'], $item, '_communication', !$item['personal']);
    }
}


