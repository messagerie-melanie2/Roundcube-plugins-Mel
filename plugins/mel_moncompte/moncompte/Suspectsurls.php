<?php
/**
 * Plugin Mél_Moncompte
 *
 * plugin mel_Moncompte pour roundcube
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
require_once 'Moncompteobject.php';

class SuspectsUrls extends Moncompteobject
{
    private static $plugin;
    public static function isEnabled() {
        return mel::is_internal() || (class_exists('mel_doubleauth') && mel_doubleauth::is_double_auth_enable());
	}

    /**
	* Chargement des données de l'utilisateur depuis l'annuaire
	*/
	public static function load($plugin = null) {
        $plugin->include_script('suspectsurls.js');
        self::$plugin = $plugin;
		rcmail::get_instance()->output->add_handlers([
			'defaultlinks' => array(__CLASS__, 'defaultlinks'),
            'customlinks' => array(__CLASS__, 'customlinks')
		]);
		// Titre de la page
		rcmail::get_instance()->output->set_pagetitle(rcmail::get_instance()->gettext('mel_moncompte.suspects_urls'));
		rcmail::get_instance()->output->send('mel_moncompte.suspects_urls');
	}

    public static function starting_html($isSuspect = false)
    {
        $col_left = $isSuspect ? 7 : 8;
        $col_middle = 3;
        $col_right = 12 - ($col_left + $col_middle);

        return '<div class="row"><div class="col-'.$col_left.'"><h3>'.self::$plugin->gettext('mel_moncompte.suspects_websites').'</h3></div><div class="col-'.$col_middle.'"><h3>'.self::$plugin->gettext('mel_moncompte.bloqued').'</h3></div>'.($isSuspect ? '<div class="col-'.$col_right.'"><h3>'.self::$plugin->gettext('delete').'</h3></div>' : '').'</div>';
    }

    public static function create_title($url)
    {
        $base_url = class_exists('mel_helper') ? mel_helper::parse_url($url)  : null;

        if (isset($base_url) && !$base_url->have_scheme()) return '';
        else if (strpos($url, 'http') === false && strpos($url, 'https') === false) return '';

        if (isset($base_url) && $base_url->have_path())
        {
            $base_url = $base_url->base_url();
        }
        else $base_url = '';

        return "Adresses bloqués :\r\n$url\r\n".(strpos($url, 'https') !== false ? str_replace('https', 'http', $url) : str_replace('http', 'https', $url))
        ."\r\n".($base_url??'');
    }

    public static function defaultlinks($attribs)
    {
        $config = rcmail::get_instance()->config->get('mel_suspect_url', []);
        $config_bloqued = rcmail::get_instance()->config->get('mel_bloqued_url', []);
        $custom_config = rcmail::get_instance()->config->get('mel_custom_suspected_url', []);

        $html = '';
        $html .= '<div class="row" style="margin-top:15px"><div class="col-1"><button type="button" id="su-mel-default-button"></button></div><div class="col-11"><h2>Adresses suspectes par défaut</h2></div></div>';
        $html .= '<div id="supects-urls-list" style="display:none">'.self::starting_html();

        $alreadyExists = [];

        $checkbox = null;
        $isBloqued = false;
        foreach ($config as $url) {  

            if (in_array($url, $alreadyExists)) continue;

            if (in_array($url, $config_bloqued))
            {
                unset($config_bloqued[array_search($url, $config_bloqued)]);
                $isBloqued = true;
            }

            if (!$isBloqued && isset($custom_config[$url]))
            {
                $isBloqued = $custom_config[$url]['bloqued'];
            }

            //$html .= '<input type="hidden" name="default_mel_url_'.$it.'" value="'.$url.'" />';
            $checkbox = new html_checkbox(['name' => 'default_mel_'.str_replace('.', '{mel-point}', $url), 'value' => 1]);
            $html .= html::div(['class' => 'row'],
                html::div(['class' => 'col-8', 'title' => self::create_title($url)], html::tag('div', ["style" => "overflow:auto;white-space: nowrap;"], $url)).
                html::div(['class' => 'col-4'], $checkbox->show($isBloqued ? 1 : 0))
            );

            $isBloqued = false;
            $checkbox = null;

            $alreadyExists[] = $url;
        }

        $alreadyExists = [];
        $isBloqued = true;
        foreach ($config_bloqued as $url) {

            if (in_array($url, $alreadyExists)) continue;

            if (isset($custom_config[$url]))
            {
                $isBloqued = $custom_config[$url]['bloqued'];
            }

            // $html .= '<input type="hidden" name="default_mel_url_'.$it.'" value="'.$url.'" />';
            $checkbox = new html_checkbox(['name' => 'default_mel_'.str_replace('.', '{mel-point}', $url), 'value' => 1]);
            $html .= html::div(['class' => 'row'],
                html::div(['class' => 'col-8'], html::tag('div', ["style" => "overflow:auto;white-space: nowrap;"], $url)).
                html::div(['class' => 'col-4'], $checkbox->show($isBloqued ? 1 : 0))
            );

            $isBloqued = true;
            $checkbox = null;

            $alreadyExists[] = $url;
        }

        $html .= '</div>';

        return $html;
    }

    public static function customlinks($attribs)
    {
        $config = rcmail::get_instance()->config->get('mel_suspect_url', []);
        $config_bloqued = rcmail::get_instance()->config->get('mel_bloqued_url', []);
        $custom_config = rcmail::get_instance()->config->get('mel_custom_suspected_url', []);

        $html = '';
        $html .= '<div class="row" style="margin-top:15px"><div class="col-1"><button type="button" id="su-mel-custom-button"></button></div><div class="col-11"><h2>Adresses suspectes ajoutées</h2></div></div>';
        $html .= '<div id="su-mel-custom_list">';
        $html .= '<button id="add-custom-su" style="margin-bottom:5px" type="button"></button>'.self::starting_html(true);
        $checkbox = null;
        $isBloqued = false;
        
        foreach ($custom_config as $url => $datas) {    
            if (in_array($url, $config_bloqued) || in_array($url, $config))
            {
                continue;
            }

            $isBloqued = $custom_config[$url]['bloqued'] ?? false;            

            $checkbox = new html_checkbox(['name' => 'custom_mel_blocked_'.str_replace('.', '{mel-point}', $url), 'value' => 1]);
            $html .= html::div(['class' => 'row'],
                html::div(['class' => 'col-7'], 
                "<input class=\"form-control input-mel\" type=\"text\" value=\"$url\" name=\"custom_mel_".str_replace('.', '{mel-point}', $url)."\" placehoder=\"Url suspiceuse...\">").
                html::div(['class' => 'col-3'], $checkbox->show($isBloqued ? 1 : 0)).
                html::div(['class' => 'col-2'], '<button type="button" class="su-delete-custom"><span class="icon-mel-trash"></span></button>')
            );

            $isBloqued = false;
            $checkbox = null;
        }



        $html .= '</div>';

        return $html;
    }

    public static function reinit($config)
    {
        foreach ($config as $key => $value) {
            $config[$key]['bloqued'] = false;
        }

        return $config;
    }
    
	/**
	 * Modification des données de l'utilisateur depuis l'annuaire
	 */
    public static function change()
    {
        $custom_config = rcmail::get_instance()->config->get('mel_custom_suspected_url', []);
        $custom_config = self::reinit($custom_config);
        
        foreach ($_POST as $key => $value) {
            if (strpos($key, 'created_') !== false)
            {
                $id = str_replace('created_', '', $key);

                if (!isset($custom_config[$id])) $custom_config[$id] = ["bloqued" => false];

                if ($value === '') $custom_config[$id]['_deleted'] = true;
                else 
                {
                    if (strpos($value, 'http') === false && strpos($value, '://www.') === false)
                    {
                        if ($value[0] !== '.') $value = '.'.$value;
                    }

                    $custom_config[$id]['_url'] = $value;
                }
            }
            else if (strpos($key, 'bloqued_') !== false)
            {
                $id = str_replace('bloqued_', '', $key);

                if (!isset($custom_config[$id])) $custom_config[$id] = ["bloqued" => $value == '1' || $value == 'on'];
            }
            else if (strpos($key, 'default_mel_') !== false)
            {
                $id = str_replace('{mel-point}', '.', str_replace('default_mel_', '', $key));
                
                if (!isset($custom_config[$id])) $custom_config[$id] = ["bloqued" => $value == '1'];
                else $custom_config[$id]['bloqued'] = $value == '1';
            }
            else if (strpos($key, 'custom_mel_blocked_') !== false)
            {
                $id = str_replace('{mel-point}', '.', str_replace('custom_mel_blocked_', '', $key));

                $custom_config[$id]['bloqued'] = $value == '1' || $value == 'on';
            }//custom_mel_
            else if (strpos($key, 'custom_mel_') !== false)
            {
                $id = str_replace('{mel-point}', '.', str_replace('custom_mel_', '', $key));

                if ($value === '') $custom_config[$id]['_deleted'] = true;
                else if ($id !== $value) $custom_config[$id]['_url'] = $value;
            }
        }

        foreach ($custom_config as $key => $value) {
            if (isset($value['_deleted']))
            {
                unset($custom_config[$key]);
            }
            else if (isset($value['_url']))
            {
                $custom_config[$value['_url']] = $value;
                unset($custom_config[$value['_url']]['_url']);
                unset($custom_config[$key]);
            }
        }

        rcmail::get_instance()->user->save_prefs(array('mel_custom_suspected_url' => $custom_config));

        return true;
    }
}