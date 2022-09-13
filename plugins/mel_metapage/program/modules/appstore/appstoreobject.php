<?php
include_once 'consts.php';
include_once 'iappstore.php';
include_once __DIR__.'/../../program.php';
include_once __DIR__.'/libs/app.php';
class AppStoreObject
{
    private array $apps;
    private iDriver $driver;

    public function __construct($driver, $generate = false)
    {
        $this->apps = null;
        $this->driver = $driver;

        if ($generate) $this->get_all();
    }

    public function generate($driver) {
        $raw = $driver->get_all();
        foreach ($raw as $key => $value) {
            $this->apps[$value[ConstAppStore::APP_RESULT_KEY_ID]] = AApp::Load($value, [$driver, 'get'], [$driver, 'set']);
            yield $this->apps[$value[ConstAppStore::APP_RESULT_KEY_ID]];
        }
    }

    public function save()
    {
        foreach ($this->apps as $key => $value) {
            $value->save();
        }

        if ($this->driver->need_save_all()) $this->driver->set_all();
    }

    public function get($id)
    {
        if (isset($this->apps) && isset($this->apps[$id])) return $this->apps[$id];

        return AApp::Load($this->driver->get($id), [$driver, 'get'], [$driver, 'set']);
    }

    public function get_all()
    {
        if (!isset($this->apps))
        {
            foreach ($this->generate($this->driver) as $key => $value) {
                # code...
            }
        }

        return $this->apps;
    }

    public function set($id, $app)
    {
        if(isset($this->apps)) $this->apps[$id] = $app->save();
        else $this->apps = [$app->save()];

        return $this;
    }

    public function __get($func)
    {
        switch ($func) {
            case 'driver':
                return $this->driver;
            
            default:
                # code...
                break;
        }
    }
}