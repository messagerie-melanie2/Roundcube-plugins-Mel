<?php
include_once 'consts.php';
include_once 'iappstore.php';
include_once 'appstoreobject.php';
include_once __DIR__.'/../../program.php';
include_once __DIR__.'/libs/app.php';
class AppStore extends Program implements iAppStoreActions
{
    private const DRIVER = 'DriverConfig';

    public function __construct($rc, $plugin) {
        parent::__construct($rc, $plugin);
    }  

    public function object()
    {
        $object_name = 'app_object';
        $object = null;

        if (isset($this->$object_name)) $object = $this->$object_name;
        else {
            $this->$object_name = new AppStoreObject(new self::DRIVER($this->plugin));
            $object = $this->object();
        }

        return $object;
    }

    public function init(){
        $this->register_action('update_app', [$this, 'update_app_action']);
    }

    public function update_app_action($args = [])
    {
        $id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_GET);
        $datas = rcube_utils::get_input_value('_datas', rcube_utils::INPUT_GET);

        if ($this->is_admin() && is_array($datas)) {}
        else if (!is_array($datas)) {
            echo json_encode($this->update_app_user($id, $datas));
        }
        else echo 'denied';
    }

    public function update_app_user($id, $enabled) {
        if ($this->have_plugin())
        {
            $datas = $this->trigger_hook('appstore.update_app_user', [
                'id' => $id,
                'enabled' => $enabled
            ]);
        }
        else {
            $app = $this->object()->get($id);
            $app->enabled = $enabled;
            $this->object()->set($id, $app);
            
            if ($this->object()->__get('driver')->need_save_all()) $this->object()->__get('driver')->set_all();
        }
    }

    public function get_apps()
    {
        if ($this->have_plugin())
        {
            return $this->trigger_hook('appstore.update_app_user', []);
        }
        else {
            return $this->object()->get_all();
        }
    }

    public function have_plugin($arg = false)
    {
        $arg = $this->trigger_hook('appstore.have_plugin', ['have_plugin' => $arg]);
        return $arg['have_plugin'] ?? false;
    }

    public function is_admin()
    {
        $arg = $this->trigger_hook('appstore.have_plugin', ['is_admin' = false]);
        return $arg['is_admin'] ?? false;
    }
}

Program::add_class_to_load('AppStore');