<?php
class mel_event_system
{
    
    private static $instance;

    public static function Instance()
    {
        if (self::$instance === null)
            self::$instance = new mel_event_system();

        return self::$instance;
    }

    private $events;

    private function __construct()
    {
        $this->events = [];
    }

    public function addEventListener($key, $callable)
    {
        if ($this->event[$key] === null)
            $this->event[$key] = [];

        $this->event[$key][] = $callable;
    }

    public function triggerEvent($key, ...$args)
    {
        if ($this->event[$key] !== null)
        {
            $size = count($this->event[$key]);
            for ($i=0; $i < $size; ++$i) { 
                $this->event[$key][$i](...$args);
            }
        }
    }

}
 