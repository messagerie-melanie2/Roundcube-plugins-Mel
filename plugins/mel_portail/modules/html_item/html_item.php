<?php
/**
 * Module Html_item pour le portail Mél
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

class Html_item extends Module {
    /**
     * Mapping entre les champs items et ceux du form
     */
    protected $mappingFields = [
        'name' => 'item_html_item_name',
        'tooltip' => 'item_html_item_tooltip',
        'provenance' => 'item_html_item_provenance',
    ];

    /**
     * Liste des champs obligatoires
     */
    protected $requiredFields = ['html', 'name'];

    /**
     * Est-ce que le module doit utiliser un logo ?
     */
    public $no_logo = true;

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

        // Générer le contenu html
        if ($item['flip']) {
            // Front + back
            $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $item['html']) .
                        html::tag('article', 'back', $item['html_back']);
        }
        else {
            // Front
            $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $item['html']) .
                        html::tag('article', 'back blank', '');
        }
        return html::tag('article', $attrib, $this->getManagingDiv($item) . $content);
    }

    /**
     * Handler HTML dédié au module
     */
    public function settings_handler($attrib) {
        $item = $this->rc->output->get_env('personal_item');
        return $this->settings_table(['name', 'tooltip', 'html', 'provenance'], $item, '_html_item', !$item['personal']);
    }

    /**
     * Call setting_row from prop
     */
    protected function setting_prop(&$table, $prop, $item, $submodule = null, $readonly = false) {
        if ($readonly) {
            $this->setting_row($table, $prop, $item, null, 'readonly', $submodule);
        }
        else if ($prop == 'html') {
            $html = $this->setting_row($table, $prop, $item, null, 'textarea', $submodule);
        }
        else {
            $html = parent::setting_prop($table, $prop, $item, $submodule);
        }
        return $html;
    }

    /**
     * Création de l'item à partir des données de formulaire
     */
    public function item_from_form(&$item) {
        $this->mapFields($item);
        $item['html'] = rcube_utils::get_input_value('item_html_item_html', rcube_utils::INPUT_POST, true);
    }
}


