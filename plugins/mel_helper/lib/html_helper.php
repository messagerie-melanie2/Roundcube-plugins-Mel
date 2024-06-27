<?php
/**
 * Class to create an HTML input field
 *
 * @package    Framework
 * @subpackage View
 */
class html_numberinputfield extends html
{
    protected $tagname = 'input';
    protected $type    = 'number';
    protected $allowed = [
        'type','name','value','size','tabindex','required','checked','onchange','onclick','disabled','readonly',
        'max','results','min','src','multiple','accept',
        'placeholder','autofocus','pattern','oninput'
    ];

    protected $min;
    protected $max;

    /**
     * Object constructor
     *
     * @param array $attrib Associative array with tag attributes
     */
    public function __construct($attrib = [])
    {
        if (is_array($attrib)) {
            $this->attrib = $attrib;
        }

        if (!empty($attrib['min'])) {
            $this->min = $attrib['min'];
        }

        if (!empty($attrib['max'])) {
            $this->max = $attrib['max'];
        }
    }

    /**
     * Compose input tag
     *
     * @param string $value  Field value
     * @param array  $attrib Additional attributes to override
     *
     * @return string HTML output
     */
    public function show($value = null, $attrib = null)
    {
        // overwrite object attributes
        if (is_array($attrib)) {
            $this->attrib = array_merge($this->attrib, $attrib);
        }

        // set value attribute
        if ($value !== null) {
            $this->attrib['value'] = $value;
        }

        if ($this->min !== null)
            $this->attrib["min"] = $this->min;

        if ($this->max !== null)
            $this->attrib["max"] = $this->max;

        return parent::show();
    }
}

class html_mel_table extends html {
    protected $tagname = 'table';
    protected $array;
    private $nbCols;
    private $hasHeader;

    /**
     * Object constructor
     *
     * @param array $attrib Associative array with tag attributes
     */
    public function __construct($col, $attrib = [])
    {
        if (is_array($attrib)) {
            $this->attrib = $attrib;
        }

        if ($attrib["hasHeader"] !== null)
        {
            $this->hasHeader = $attrib["hasHeader"];
            unset($this->attrib["hasHeader"]);
        }

        $this->array = [];
        $this->set_col($col);
    }

    public function set_col($nb)
    {
        if ($nb !== $this->nbCols)
        {
            $nbRows = count($this->array);
            for ($y=0; $y < $nbRows; ++$y) { 
                if ($nb > $this->nbCols)
                {
                    for ($x=$this->nbCols; $x < $nb; ++$x) { 
                        $this->array[$y][] = "";
                    }
                }
                else
                {
                    for ($x=$this->nbCols; $x > $nb; --$x) { 
                        unset($this->array[$y][$x]);
                    } 
                }

            }
        }

        return $this;
    }

    public function addRow()
    {
        $array = [];

        for ($i=0; $i < $this->nbCols; ++$i) { 
            $array[] = "";
        }

        $this->array[] = $array;

        return $this;
    }

    public function edit($y, $x, $val)
    {
        $this->array[$y][$x] = $val;
        return $this;
    }

        /**
     * Compose input tag
     *
     * @param string $value  Field value
     * @param array  $attrib Additional attributes to override
     *
     * @return string HTML output
     */
    public function show($attrib = [])
    {
        // overwrite object attributes
        if (is_array($attrib)) {
            $this->attrib = array_merge($this->attrib, $attrib);
        }

        $html = '';

        $first = true;
        foreach ($this->array as $row) {
            $html .= ($this->hasHeader === true && $first === true ? '<thead class="mel_striped" style="position:sticky;top:0;"><tr>' : '<tr>');
            foreach ($row as $value) {
                $html .= "<td>$value</td>";
            }
            $html .= ($this->hasHeader === true && $first === true ? '</tr></thead>' : '</tr>');

            if ($first === true)
                $first = false;
        }

        return html::tag($this->tagname, $this->attrib, $html);
    }
}

class html_mel_button extends html {
    private $text;
    private $icon;

    public function __construct($attrib = [], $text = '', $icon = null, $add_predef_classes = true)
    {
        if (is_array($attrib)) {
            $this->attrib = $attrib;
        }

        if ($add_predef_classes) {
        if (!empty($attrib['class'])) {
            $this->attrib['class'] = 'btn btn-secondary mel-button no-button-margin';
        }
        else $this->attrib['class'] .= ' btn btn-secondary mel-button no-button-margin';
        }

        $this->text = $text;
        $this->icon = $icon;
    }

    public function show($attrib = [])
    {
        // overwrite object attributes
        if (is_array($attrib)) {
            $this->attrib = array_merge($this->attrib, $attrib);
        }

        return html::tag('button', $this->attrib, $this->text.(isset($this->icon) ? html::tag('span', ['class' => 'plus '.$this->icon]) : ''));
    }
}

abstract class html_helper extends html
{
    protected function __construct()
    {
        throw new Exception("It's a static class", 1);       
    }

    private static function _set_attribs($currentAttribs, $attribs)
    {
        if (!empty($attribs))
        {
            foreach ($attribs as $key => $value) {
                if ($currentAttribs[$key] !== null) $currentAttribs[$key] .= ' '.$value;
                else $currentAttribs[$key] = $value;
            }
        }

        return $currentAttribs;
    }

    public static function row($attribs = [], $contents = '')
    {
        return html::div(self::_set_attribs(['class' => "row"], $attribs), $contents);
    }

    private static function _col($format, $value, $attribs = [], $contents = '')
    {
        return html::div(self::_set_attribs(['class' => "col$format-$value"], $attribs), $contents);
    }

    public static function md_col($col, $attribs = [], $contents = '')
    {
        return self::_col('-md', $col, $attribs, $contents);
    }

    public static function col($col, $attribs = [], $contents = '')
    {
        return self::_col('', $col, $attribs, $contents);
    }

    public static function mel_button($attribs = [], $text = '', $icon = null)
    {
        return (new html_mel_button($attribs, $text, $icon))->show();
    }
}