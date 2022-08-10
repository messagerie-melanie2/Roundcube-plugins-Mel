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
        return !$this->luminance_ratio_AAA(new Mel_Color(255, 255, 255));
    }

    public function compare_AAA($color)
    {
        return $this->luminance_ratio_AAA($color);
    }

    private function luminance()
    {
        $R = $this->get_red() / 255;
        $G = $this->get_green() / 255;
        $B = $this->get_blue() / 255;

        if ($R <= 0.04045) { $R = $R /12.92; } else { $R = (($R +0.055)/1.055) ** 2.4; }
        if ($G <= 0.04045) { $G = $G /12.92; } else { $G = (($G +0.055)/1.055) ** 2.4; }
        if ($B <= 0.04045) { $B = $B /12.92; } else { $B = (($B +0.055)/1.055) ** 2.4; }

        return 0.2126 * $R + 0.7152 * $G + 0.0722 * $B;
    }

    private function compare_luminance($color)
    {
        $l1 = $this->luminance();
        $l2 = $color->luminance();

        $ratio;
        if ($l1 > $l2) { $ratio = $l1 / $l2; } else { $ratio = $l2 / $l1; }

        return $ratio;
    }

    private function luminance_ratio_AAA($color)
    {
        $isAAA = $this->compare_luminance($color) > 7;
        return $isAAA;
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