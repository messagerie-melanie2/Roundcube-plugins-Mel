<?php 
class Mel_Color{
    private $r;
    private $g;
    private $b;
    private $alpha;

    public function __construct($r, $g, $b, $alpha = 100)
    {
        $this->set_rgba($r, $g, $b, $alpha);
    }

    private function set_to_null()
    {
        $this->r = null;
        $this->g = null;
        $this->b = null;
        $this->alpha = null;

        return $this;
    }

    public function is_valid()
    {
        return $this->r !== null && $this->g !== null && $this->b !== null && $this->alpha !== null;
    }

    private function set_color($value, $type)
    {
        try {
            if ($value > 255)
                $value = 255;
            else if ($value < 0)
                $value = 0;
        } catch (\Throwable $th) {
            $value = 0;
        }

        switch ($type) {
            case 0: //r
                $this->r = $value;
                break;
            case 1: //g
                $this->g = $value;
                break;
            case 2: //b
                $this->b = $value;
                break;
            
            default:
                # code...
                break;
        }

        return $this;
    }

    public function set_alpha($value)
    {
        if ($value > 100) $value = 100;
        else if ($value < 0) $value = 0;

        $this->alpha = $value;

        return $this;
    }

    public function set_red($value)
    {
        return $this->set_color($value, 0);
    }

    public function set_green($value)
    {
        return $this->set_color($value, 1);
    }

    public function set_blue($value)
    {
        return $this->set_color($value, 2);
    }

    public function set_rgb($r, $g, $b)
    {
        return $this->set_red($r)->set_blue($b)->set_green($g);
    }

    public function set_rgba($r, $g, $b, $a)
    {
        return $this->set_rgb($r, $g, $b)->set_alpha($a);
    }

    public function get_red()
    {
        return $this->r;
    }

    public function get_green()
    {
        return $this->g;
    }

    public function get_blue()
    {
        return $this->b;
    }

    public function get_alpha($inf_1 = false)
    {
        return $inf_1 ? ($this->alpha/100.0) : $this->alpha;
    }

    public function need_black_text()
    {
        $value = false;

        $r = $this->get_red();
        $b = $this->get_blue();
        $g = $this->get_green();

        $max1 = 178;
        $max2 = 136;

        $have_max_1 = $r >= $max1 || $g >= $max1 || $b >= $max1;

        if ($have_max_1)
        {
            if ($r >= $max1) $value = $g >= $max2 && $b >= $max2;
            else if ($g >= $max1) $value = $r >= $max2 && $b >= $max2;
            else $value = $r >= $max2 && $g >= $max2;
        }

        return $value;

    }

    public function lighter($coef = 10)
    {
        return new Mel_Color($this->r + $coef, $this->g + $coef, $this->b + $coef);
    }

    public function darker($coef = 10)
    {
        return new Mel_Color($this->r - $coef, $this->g - $coef, $this->b - $coef);
    }

    public function to_rgb()
    {
        return "rgb(".$this->r.", ".$this->g.", ".$this->b.")";
    }
    public function to_rgba($inf_1 = false)
    {
        return "rgba(".$this->r.", ".$this->g.", ".$this->b.", ".$this->get_alpha($inf_1).")";
    }

    public static function get_empty()
    {
        return (new Mel_Color(0,0,0))->set_to_null();
    }
}