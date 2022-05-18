<?php
class mel_plugin_ext extends rcube_plugin
{
    public $task = '.*';

    public const PLUGINS = ['rcube', 'libcalendaring'];

    public function init()
    {
        $this->add_hook('ready', array($this, 'ready'));
    }

    public function ready($args)
    {
        foreach (self::PLUGINS as $value) {
            $this->include_script("js/$value/ext.js");
        }
        return $args;
    }
}