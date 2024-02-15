<?php
class MailBody {
    private static $image_loaded;
    private $template;
    protected $args;
    private $loaded;
    public function __construct($template, $args = []) {
        $this->template = $template;
        $this->args = $args;
    }

    public function subject() {
        $body = $this->body();

        return explode('-->' ,explode('Subject : ', $body)[1])[0];
    }

    public function body() {
        if (!isset($this->loaded)) $this->loaded = $this->_load();

        return $this->loaded;
    }

    private function _load() {
        $template = rcmail::get_instance()->output->parse($this->template, false, false);

        foreach ($this->args as $key => $value) {
            $template = str_replace('{{'.$key.'}}', $value, $template);
        }

        return $template;
    }

    public static function load_image($path) {
        return self::encodeFileToBase64($path);
    }

    private static function encodeFileToBase64($path) {
        $content = file_get_contents($path);

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimetype = finfo_buffer($finfo, $content);
        finfo_close($finfo);

        self::$image_loaded = false !== $content;

        $type = isset($mimetype) ? $mimetype : 'image/unknown';
        $image_base64 = base64_encode($content);
        return "data:$type;base64,$image_base64";
    }

    public static function image_loaded() {
        return self::$image_loaded === true;
    }
}