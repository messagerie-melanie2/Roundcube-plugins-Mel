<?php
/**
 * Module Twitter pour le portail Mél
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

class Twitter extends Module {
    /**
     * Mapping entre les champs items et ceux du form
     */
    protected $mappingFields = [
        'account' => 'item_twitter_account',
        'name' => 'item_twitter_name',
        'width' => 'item_twitter_width',
        'provenance' => 'item_twitter_provenance',
    ];

    /**
     * Liste des champs obligatoires
     */
    protected $requiredFields = ['account', 'name'];

    /**
     * Est-ce que le module doit utiliser un logo ?
     */
    public $no_logo = true;

    /**
     * Width for the widget
     */
    const WIDTH = '240';

    /**
     * Height for the widget
     */
    const HEIGHT = '265';

    /**
     * Width for the large widget
     */
    const WIDTH_LARGE = '505';

    /**
     * Width for the widget in mobile view
     */
    const WIDTH_MOBILE = '600';

    /**
     * Height for the widget
     */
    const HEIGHT_MOBILE = '288';
    
    /**
     * IFRAME for integrated Twitter account
     * 
     * replace %%account%% by Twitter account
     */
    const IFRAME = "<a class=\"twitter-timeline\" data-lang=\"fr\" data-width=\"%%width%%\" data-height=\"%%height%%\" data-dnt=\"true\" href=\"https://twitter.com/%%account%%?ref_src=twsrc%5Etfw\">Tweets de %%account%%</a> <script async src=\"https://platform.twitter.com/widgets.js\" charset=\"utf-8\"></script>";

    /**
     * Génère un item html en fonction des propriétés
     * 
     * @param array $attrib
     * @param array $item
     * @param string $user_dn
     * @return string HTML
     */
    public function item_html($attrib, &$item, $user_dn) {
        $attrib['class'] = $item['type'] . " item html";
        // HTML
        // Largeur
        if (rcmail::get_instance()->config->get('ismobile', false)) {
            $html = str_replace('%%width%%', self::WIDTH_MOBILE, self::IFRAME);
            $html = str_replace('%%height%%', self::HEIGHT_MOBILE, $html);
        }
        else if (isset($item['width']) 
                && $item['width'] == 'large') {
            $attrib['class'] .= ' large';
            $html = str_replace('%%width%%', self::WIDTH_LARGE, self::IFRAME);
            $html = str_replace('%%height%%', self::HEIGHT, $html);
        }
        else {
            $html = str_replace('%%width%%', self::WIDTH, self::IFRAME);
            $html = str_replace('%%height%%', self::HEIGHT, $html);
        }
        $html = str_replace('%%account%%', $item['account'], $html);
        
        // Twitter
        $content = html::tag('article', ['class' => 'front', 'title' => $item['tooltip'] ?: null], $html) .
                    html::tag('article', 'back blank', '');
        return html::tag('article', $attrib, $this->getManagingDiv($item) . $content);
    }

    /**
     * Handler HTML dédié au module
     */
    public function settings_handler($attrib) {
        $item = $this->rc->output->get_env('personal_item');
        return $this->settings_table(['account', 'name', 'width', 'provenance'], $item, '_twitter', !$item['personal']);
    }

    /**
     * Création de l'item à partir des données de formulaire
     */
    public function item_from_form(&$item) {
        $this->mapFields($item);
        // Gestion du compte twitter
        $item['account'] = str_replace('https://twitter.com/', '', $item['account']);
        if (strpos($item['account'], '?') !== false) {
            $_tmp = explode('?', $item['account'], 2);
            $item['account'] = $_tmp[0];
        }
    }
}


