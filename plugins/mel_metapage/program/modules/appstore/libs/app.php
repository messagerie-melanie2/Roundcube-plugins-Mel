<?php 
include_once __DIR__.'/../consts.php';

abstract class AApp {
    private $id;
    private $loadCallback;
    private $saveCallBack;

    public function __construct($appId, $loadFunction, $saveFunction) {
        $this->id = $appId;
        $this->loadCallback = $loadFunction;
        $this->saveCallBack = $saveFunction;
    }

    public function load() {
        return $this->_load($this->id, call_user_func($this->loadCallback, $this->id), $this->loadCallback, $this->saveCallBack);
    }

    public function save() {
        $this->_save($id, $this->saveCallBack);
        return $this;
    }

    public abstract function is_plugin();

    protected abstract function _load($id, $results, $loadCall, $saveCall);
    protected abstract function _save($id, $saveCall);

    public function Load($results, $loadCall, $saveCall) {
        $id = $results[ConstAppStore::APP_RESULT_KEY_ID];
        switch ($results[ConstAppStore::APP_RESULT_KEY_TYPE]) {
            case ConstAppStore::APP_TYPE_PLUGIN:
                return new LoadedPluginApp($id, $results, $loadCall, $saveCall);

            case ConstAppStore::APP_TYPE_LINK:
                return new LoadedLinkApp($id, $results, $loadCall, $saveCall);
            
            default:
                throw new Exception("App type not exist", 1);
                
        }
        
    }
}

abstract class ALoadedApp extends AApp {
    public $title;
    public $desc;
    public $icon;
    public $category;
    public $is_main;
    public $enabled;

    public function __construct($appId, $datas, $loadfunction, $save_function) {
        parent::__construct($appId, $loadFunction, $save_function);
        $this->generate($datas);
    }

    private function generate($datas) {
        $this->title = $datas[ConstAppStore::APP_RESULT_KEY_TITLE];
        $this->desc = $datas[ConstAppStore::APP_RESULT_KEY_DESC];
        $this->icon = $datas[ConstAppStore::APP_RESULT_KEY_ICON];
        $this->category = $datas[ConstAppStore::APP_RESULT_KEY_CATEGORY];
        $this->is_main = $datas[ConstAppStore::APP_RESULT_KEY_IS_MAIN];
        $this->enabled = $datas[ConstAppStore::APP_RESULT_KEY_ENABLED];
        $this->_generate($datas);
    }

    protected abstract function _generate($datas);

    public abstract function is_plugin();

    protected abstract function _load($id, $results, $loadCall, $saveCall);

    protected function _save($id, $saveCall) {
        return call_user_func($saveCall, $id, $this);
    }
}

class LoadedPluginApp extends ALoadedApp {

    public $name;

    public function __construct($appId, $datas, $loadfunction, $save_function) {
        parent::__construct($appId, $datas, $loadFunction, $save_function);
    }

    public function is_plugin()
    {
        return true;
    }

    protected function _load($id, $results, $loadCall, $saveCall)
    {
        return new LoadedPluginApp($id, $results, $loadCall, $saveCall);
    }

    protected function _generate($datas)
    {
        $this->name = $datas[ConstAppStore::APP_RESULT_KEY_ADDITIONNAL_DATA];
    }
}

class LoadedLinkApp extends ALoadedApp {

    public $link;

    public function __construct($appId, $datas, $loadfunction, $save_function) {
        parent::__construct($appId, $datas, $loadFunction, $save_function);
    }

    public function is_plugin()
    {
        return true;
    }

    protected function _load($id, $results, $loadCall, $saveCall)
    {
        return new LoadedLinkApp($id, $results, $loadCall, $saveCall);
    }

    protected function _generate($datas)
    {
        $this->link = $datas[ConstAppStore::APP_RESULT_KEY_ADDITIONNAL_DATA];
    }

}