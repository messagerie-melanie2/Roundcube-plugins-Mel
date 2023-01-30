<?php
include_once "html_helper.php";
abstract class setting_option
{
    public abstract function is();
}

class setting_option_value_input extends setting_option
{
    public const IS = "setting_option_value_input";
    public const INFINITY = "infinity";
    public $min;
    public $max;

    public function __construct($min, $max)
    {
        $this->min = $min;
        $this->max = $max;
    }

    public function is()
    {
        return self::IS;
    }

    public function html($fieldId, $current, $attrib = null, $plugin = null)
    {
        if ($attrib === null)
            $attrib = [];

        $attrib['name'] = $fieldId;
        $attrib['id'] = $fieldId;
        
        $input = new html_numberinputfield($attrib);

        $attrib = [];
        $attrib['type'] = "number";

        if ($this->min !== self::INFINITY)
            $attrib['min'] = $this->min;

        if ($this->max !== self::INFINITY)
            $attrib['max'] = $this->max;

        return array(
            'title' => html::label($attrib, rcube::Q($plugin === null ? $fieldId : $plugin->gettext($fieldId))),
            'content' => $input->show($current, $attrib),
        );
    }
}

class setting_option_select extends setting_option
{
    public const IS = "setting_option_select";
    public $text;
    public $value;

    public function __construct($text, $value)
    {
        $this->text = $text;
        $this->value = $value;
    }

    public function is()
    {
        return self::IS;
    }

    public static function fabricFromPlugin($text, $value, $plugin)
    {
        return new setting_option_select($plugin->gettext($text), $value);
    } 

    public static function html($fieldId, $current, $options, $attrib = null, $plugin = null)
    {
        if ($attrib === null)
            $attrib = [];

        $attrib['name'] = $fieldId;
        $attrib['id'] = $fieldId;

        $input = new html_select($attrib);

        foreach ($options as $value) {
            $input->add($value->text, $value->value);
        }

        unset($attrib['name']);
        unset($attrib['id']);
        $attrib["for"] = $field_id;

        return array(
            'title' => html::label($attrib, rcube::Q($plugin === null ? $fieldId : $plugin->gettext($fieldId))),
            'content' => $input->show($current),
        );
    }
}

class settings_helper
{
    private static $instance;

    public static function Instance()
    {
        if (self::$instance === null)
            self::$instance = new settings_helper();

        return self::$instance;
    }

    private function __construct()
    {

    }

    public function create_html_select($id, $texts, $values, $current, $attribs = null, $plugin = null)
    {

        if (!is_array($texts))
        {
            $texts = [$texts];
            $values = [$values];
        }

        $array = [];

        $count = count($texts);
        for ($i=0; $i < $count; ++$i) { 
            $array[] = ($plugin === null ? new setting_option_select($texts[$i], $values[$i]) : setting_option_select::fabricFromPlugin($texts[$i], $values[$i], $plugin));
        }

        return setting_option_select::html($id, $current, $array, $attribs, $plugin);
    }
}