<?php
include_once __DIR__.'/../libs/adriver.php';
include_once __DIR__.'/../consts.php';
class DriverConfig extends ADriverBase
{
    private $config;

    public function __construct($plugin) {
        parent::__construct($plugin);
    }

    public function get_all()
    {
        if (!isset($this->config)) $this->config = $this->load_config(ConstAppStore::CONFIG_NAME, []);
        return $this->config;
    }

    public function get($id) {
        return $this->get_all()[$id];
    }

    public function set($id, $item){
        $config = $this->get_all();
        $master = $config[$id];
        $master[ConstAppStore::APP_RESULT_KEY_TITLE] = $item->title;
        $master[ConstAppStore::APP_RESULT_KEY_DESC] = $item->desc;
        $master[ConstAppStore::APP_RESULT_KEY_CATEGORY] = $item->category;
        $master[ConstAppStore::APP_RESULT_KEY_ICON] = $item->icon;
        $master[ConstAppStore::APP_RESULT_KEY_ENABLED] = $item->enabled;
        $master[ConstAppStore::APP_RESULT_KEY_IS_MAIN] = $item->is_main;
        $master[ConstAppStore::APP_RESULT_KEY_TYPE] = $item->type;

        $additional_datas = null;
        if ($item->is_plugin()) $additional_datas = $item->name;
        else $additional_datas = $item->url;

        $master[ConstAppStore::APP_RESULT_KEY_ADDITIONNAL_DATA] = $additional_datas;
        $config[$id] = $master;

        $this->config = $config;
        return true;
    }

    public function need_save_all()
    {
        return true;
    }

    public function set_all()
    {
        $this->save_config(ConstAppStore::CONFIG_NAME, $this->get_all());
    }
}