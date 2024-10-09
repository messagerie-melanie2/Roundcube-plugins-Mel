<?php
class mel_cal_resources extends bnum_plugin {
    public const CONFIG_KEY_FAVORITE = 'mcr_favorites';


    /**
     * Contient la task associé au plugin
     * @var string
     */
    public $task = '.*';

    function init()
    {
        if (
            ($this->get_current_task() === 'calendar' && $this->is_index_action()) || 
            $this->get_current_action() === 'dialog-ui'
            ) {

            if ($this->is_index_action() || $this->get_current_action() === 'dialog-ui')
            {
                $this->add_texts('localization/', true);

                if ($this->is_index_action()){
                    $this->add_button(array(
                        'command' => 'calendar-planify',
                        'class' => 'mel-cal-resource-planify',
                        'innerclass' => 'inner',
                        'id' => 'mel-planify',//tb_label_popup
                        'title' => 'planify', // gets translated
                        'type' => 'link',
                        'label' => 'planify', // maybe put translated version of "Labels" here?
                        'domain' => 'mel_cal_resources'
                    ), 'toolbar');
                }
                
                $this->include_css('style.css');
                $this->add_hook('send_page', [$this, 'render_page']);
            }



            $this->load_data($this->get_current_action() === 'dialog-ui' ? 'waiting_dialog' : 'waiting_events');
        }
        else if ($this->get_current_task() === 'mel_cal_resources') {
            $this->register_task('mel_cal_resources');
            $this->register_action('load_element', [$this, 'load_element']);
            $this->register_action('load', [$this, 'load_resources']);
            $this->register_action('load_custom', [$this, 'load_custom_resources']);
            $this->register_action('set_favorite', [$this, 'change_favorite']);
            $this->register_action('load_favorites', [$this, 'load_favorites']);  
        }
    }

    function load_data($waiting_script_name) {
        $this->load_config();
        $resources =  $this->rc()->config->get('rc_resources', []);
        $filters =  $this->rc()->config->get('rc_filters', []);

        $this->rc()->output->set_env('cal_resources', [
            'resources' => $resources,
            'filters' => $filters
        ]);

        $this->rc()->output->set_env('fav_resources', $this->rc()->config->get(self::CONFIG_KEY_FAVORITE, []));

        $this->include_script("js/$waiting_script_name.js");
        $this->include_script('external/bootstrap-multiselect.js');
        $this->include_css('bootstrap-multiselect.min.css');
        $this->load_script_module('main', '/js/');
    }

    function load_element() {
        include_once __DIR__.'/lib/Locality.php';
        $fnc = $this->get_input_post('_function');

        $data = call_user_func([driver_mel::gi(), $fnc]);

        $data = mel_helper::Enumerable($data)->select(function($key, $value) {
            if (strpos(get_class($value), 'Locality') !== false) return new Locality($value);
            else return $value;
        })->toArray();

        echo json_encode($data);
        exit;
    }

    function load_resources() {
        include_once __DIR__.'/lib/Resource.php';
        $fnc = $this->get_input_post('_function');
        $uid = $this->get_input_post('_value');

        $data = call_user_func([driver_mel::gi(), $fnc], $uid);

        $data = mel_helper::Enumerable($data)->select(function($key, $value) {
            return new Resource($value);
        })->toArray();

        echo json_encode($data);
        exit;
    }

    function load_custom_resources() {
        include_once __DIR__.'/lib/Resource.php';
        $emails = $this->get_input_post('_resources');
        $rcs = driver_mel::gi()->resources(null, $emails);

        if (count($rcs) > 0) $rcs = mel_helper::Enumerable($rcs)->select(function($key, $value) {
            return new Resource($value);
        })->toArray();

        echo json_encode($rcs ?? []);
        exit;
    }

    function load_all_resources() {
        include_once __DIR__.'/lib/Resource.php';
        include_once __DIR__.'/lib/Locality.php';
        $fnc = $this->get_input_post('_function') ?? 'resources_flex_office';

        $localities = driver_mel::gi()->resources_localities();
        $localities = mel_helper::Enumerable($localities)->select(function($key, $value) {
            if (strpos(get_class($value), 'Locality') !== false) return new Locality($value);
            else return $value;
        });

        $data = mel_helper::Enumerable([]);
        foreach ($localities as $value) {
            $data = $data->aggregate(
                mel_helper::Enumerable(call_user_func([driver_mel::gi(), $fnc], $value->uid))->select(function($key, $value) {
                    return new Resource($value);
                })
            );
        }

        echo json_encode([
            'resources' => $data->toArray(),
            'localities' => $localities->toArray(),
        ]);
        exit;
    }

    function load_favorites() {
        include_once __DIR__.'/lib/Resource.php';
        $favorites = [];
        $config = $this->rc()->config->get(self::CONFIG_KEY_FAVORITE, []);

        if (count($config) > 0) {
            $config = mel_helper::Enumerable($config)->where(function ($k, $v) {
                                                        return strpos($k, '@') !== false && isset($v) && $v;
                                                    })->select(function($k, $v) {
                                                        return $k;
                                                    })->toArray();
            $favorites = driver_mel::gi()->resources(null, $config);
            unset($config);

            if (count($favorites) > 0) $favorites = mel_helper::Enumerable($favorites)->select(function($key, $value) {
                                                        return new Resource($value);
                                                    })->toArray();
        }

        echo json_encode($favorites);
        exit;
    }

    function change_favorite() {
        $uid = $this->get_input_post('_uid');
        $favorite = $this->get_input_post('_favorite');
        $favorite = $favorite === true || $favorite === 'true';

        $favs = $this->rc()->config->get(self::CONFIG_KEY_FAVORITE, []);

        $favs[$uid] = $favorite;
        $this->rc()->user->save_prefs([self::CONFIG_KEY_FAVORITE => $favs]);

        echo json_encode($favorite);
        exit;
    }

    public function render_page($args) {
        if (($this->get_current_task() === 'calendar'  && $this->is_index_action()) || $this->get_current_action() === 'dialog-ui') {
            $args['content'] = mel_helper::HtmlPartManager($args['content'])->switch_part('date', 'locations')->get();
        }

        return $args;
    }
}