<?php
/**
 * Module Import_item pour le portail Mél
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

class Import_item extends Module {
    /**
     * Mapping entre les champs items et ceux du form
     */
    protected $mappingFields = [
        'import' => 'item_import_item_import',
    ];

    /**
     * Liste des champs obligatoires
     */
    protected $requiredFields = ['import'];

    /**
     * Est-ce que le module doit utiliser un logo ?
     */
    public $no_logo = true;

    /**
     * Handler HTML dédié au module
     */
    public function settings_handler($attrib) {
        $item = $this->rc->output->get_env('personal_item');
        return $this->settings_table(['import'], $item, '_import_item', !$item['personal']);
    }

    /**
     * Call setting_row from prop
     */
    protected function setting_prop(&$table, $prop, $item, $submodule = null, $readonly = false) {
        if ($prop == 'import') {
            $html = $this->setting_row($table, $prop, $item, null, 'textarea', $submodule);
        }
        return $html;
    }

    /**
     * Création de l'item à partir des données de formulaire
     */
    public function item_from_form(&$item) {
        $json = rcube_utils::get_input_value('item_import_item_import', rcube_utils::INPUT_POST, true);
        if (isset($json)) {
            $item = json_decode($json, true);
        }
        else {
            $item = [];
        }
    }
}


