<?php 
include_once "mel_color.php";
class Mel_Color_Helper {
    
    private $cache;

    public function __construct() {
    }  

    public function color($r = 0, $g = 0, $b = 0, $a = 100)
    {
        return new Mel_Color($r, $g, $b, $a);
    }

    public function color_from_hexa($hexa)
    {

        $cache = $this->get_from_cache("color_from_hexa");
        if ($cache !== null)
        {
            if ($cache[$hexa] !== null)
                return $cache[$hexa];
        }

        //On supprime le hexa
        $hexa = str_replace('#', '', $hexa);

        $color = Mel_Color::get_empty();
        $count = strlen($hexa);

        for ($i=0; $i < $count-1; $i+=2) { 
            if ($color->get_red() === null)
                $color->set_red($this->HexToDec($hexa[$i].$hexa[$i + 1]));
            else if ($color->get_green() === null)
                $color->set_green($this->HexToDec($hexa[$i].$hexa[$i + 1]));
            else if ($color->get_blue() === null)
                $color->set_blue($this->HexToDec($hexa[$i].$hexa[$i + 1]));
            else if ($color->get_alpha() === null)
                $color->set_alpha($this->HexToDec($hexa[$i].$hexa[$i + 1]));
        }

        if ($color->get_alpha())
            $color->set_alpha(100);

        //cache
        $hexa = "#$hexa";
        $cache = $this->get_from_cache("color_from_hexa");
        if ($cache === null) $this->set_to_cache("color_from_hexa", [$hexa => $color]);
        else
        {
            $cache[$hexa] = $color;
            $this->set_to_cache("color_from_hexa", $cache);
        }

        return $color;
    }

    public function set_to_cache($key, $value)
    {
        if ($this->cache === null)
            $this->cache = [];

        $this->cache[$key] = $value;
    }

    public function get_from_cache($key, $default = null)
    {
        if ($this->cache === null)
            return $default;

        return $this->cache[$key] ?? $default;
    }

    private function HexToDec($s)
    {
        $output = 0;
        for ($i=0; $i<strlen($s); $i++) {
            $c = $s[$i]; // you don't need substr to get 1 symbol from string
            if ( ($c >= '0') && ($c <= '9') )
                $output = $output*16 + ord($c) - ord('0'); // two things: 1. multiple by 16 2. convert digit character to integer
            elseif ( ($c >= 'A') && ($c <= 'F') ) // care about upper case
                $output = $output*16 + ord($s[$i]) - ord('A') + 10; // note that we're adding 10
            elseif ( ($c >= 'a') && ($c <= 'f') ) // care about lower case
                $output = $output*16 + ord($c) - ord('a') + 10;
        }
    
        return $output;
    }
}