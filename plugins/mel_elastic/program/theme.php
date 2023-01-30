<?php
class Theme {
    private const EXT = ['svg', 'png', 'jpeg', 'jpg', 'gif'];
    public $path;
    public $picture;
    public $name;
    public $css_path;

    public function __construct($path)
    {
        $this->path = $path;
        //$this->picture = $path.'/icon.svg';
        foreach (self::EXT as $value) {
            if (file_exists("$path/icon.$value")) {
                $this->picture = "$path/icon.$value";
                $this->picture = "./skins".explode('skins', $this->picture)[1];
                break;
            }
        }

        $this->css_path = "$path/themes/theme.css";

        if ($path[strlen($path) - 1] === '/') $path = substr($path, 0, -1);

        $this->name = explode('/', $path);
        $this->name = $this->name[count($this->name) - 1];
    }

}