<?php
class mel_url
{
    protected $base_url;
    protected $scheme;
    protected $host;
    protected $parsed_datas;

    public function __construct($url) {
        $this->base_url = $url;
        $tmp = parse_url($url);

        if ($tmp !== false)
        {
            $this->scheme = $tmp['scheme'];
            $this->host = $tmp['host'];
            $this->parsed_datas = $tmp;
        }
    }  

    public function url()
    {
        return $this->base_url;
    }

    public function base_url()
    {
        return $this->scheme.'://'.$this->host;
    }

    public function check_base($string)
    {
        return strpos($string, $this->base_url()) !== false;
    }

    public function have_path()
    {
        return isset($this->parsed_datas['path']) && $this->parsed_datas['path'] !== '' && $this->parsed_datas['path'] !== '/';
    }

    public function not_have_path_and_check_base_url($string)
    {
        return !$this->have_path() && $this->check_base($string);
    }

    public function have_scheme()
    {
        return $this->scheme !== null && $this->scheme !== '';
    }

    public function parse()
    {
        return $this->parsed_datas;
    }
}