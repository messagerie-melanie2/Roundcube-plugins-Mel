<?php
/**
 * Module Intranet pour le portail Mél
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

class Intranet extends Module {
    /**
     * Mapping entre les champs items et ceux du form
     */
    protected $mappingFields = [
        'intranet' => 'item_intranet_intranet',
        'name' => 'item_intranet_name',
        'color' => 'item_intranet_color',
        'tooltip' => 'item_intranet_tooltip',
        'description' => 'item_intranet_description',
        'flip' => 'item_intranet_flip',
        'newtab' => 'item_intranet_newtab',
        'width' => 'item_intranet_width',
        'provenance' => 'item_intranet_provenance',
    ];

    /**
     * Liste des champs obligatoires
     */
    protected $requiredFields = ['intranet', 'name'];

    /**
     * Handler HTML dédié au module
     */
    public function settings_handler($attrib) {
        $item = $this->rc->output->get_env('personal_item');
        return $this->settings_table(['intranet', 'name', 'tooltip', 'description', 'color', 'flip', 'width', 'provenance'], $item, '_intranet', !$item['personal']);
    }

    /**
     * Call setting_row from prop
     */
    protected function setting_prop(&$table, $prop, $item, $submodule = null, $readonly = false) {
        if ($readonly) {
            $this->setting_row($table, $prop, $item, null, 'readonly', $submodule);
        }
        else if ($prop == 'intranet') {
            $select = new html_select(['id' => '_item_intranet_intranet', 'name' => 'item_intranet_intranet']);
            $intranet_list = $this->rc->config->get('portail_intranet_list', []);
            $select->add('---', '');
            foreach ($intranet_list as $key => $intranet) {
                $select->add($intranet['name'], $key);
            }
            $html = $this->setting_row($table, $prop, $item, $select->show($item[$prop] ?: ''), '', $submodule);
        }
        else {
            $html = parent::setting_prop($table, $prop, $item, $submodule);
        }
        return $html;
    }

    /**
     * Génère un item html en fonction des propriétés
     * 
     * @param array $attrib
     * @param array $item
     * @param string $user_dn
     * @return string HTML
     */
    public function item_html($attrib, &$item, $user_dn) {
        $intranet_list = $this->rc->config->get('portail_intranet_list', []);
        if (isset($item['intranet']) && isset($intranet_list[$item['intranet']])) {
            $item['url'] = $item['intranet'];
            $item['feedUrl'] = $intranet_list[$item['intranet']]['feedUrl'];
        }
        return parent::item_html($attrib, $item, $user_dn);
    }
}


