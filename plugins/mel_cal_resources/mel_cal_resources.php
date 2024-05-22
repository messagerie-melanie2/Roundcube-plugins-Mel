<?php
class mel_cal_resources extends bnum_plugin {
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
            $this->load_data();
        }
        else if ($this->get_current_task() === 'mel_cal_resources') {
            $this->register_task('mel_cal_resources');
            $this->register_action('load_element', [$this, 'load_element']);
            $this->register_action('load', [$this, 'load_resources']);
        }
    }

    function load_data() {
        $this->load_config();
        $resources =  $this->rc()->config->get('rc_resources', []);
        $filters =  $this->rc()->config->get('rc_filters', []);

        $this->rc()->output->set_env('cal_resources', [
            'resources' => $resources,
            'filters' => $filters
        ]);

        $this->include_script('js/waiting_events.js');
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
}