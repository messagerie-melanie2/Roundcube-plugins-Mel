<?php
class WspMailBody extends MailBody {
    const PROPS = ['logobnum', 'user_name', 'user_email', 'wsp_name', 'wsp_shares_rounded', 'wsp_creator', 'wsp_last__action_text', 'wsp_last__action_date',  'url', 'bnum_base__url'];
    public function __construct($template) {
        parent::__construct($template);
    }

    public function __get($name) {
        if (in_array($name, self::PROPS)) {
            return $this->args[$this->_replace($name)];
        }

        return null;
    }

    public function __set($name, $value) {
        if (in_array($name, self::PROPS)) {
            $this->args[$this->_replace($name)] = $value;
        }
    }

    private function _replace($val) {
        $val = str_replace('__', '/', $val);
        $val = str_replace('_', '.', $val);
        $val = str_replace('/', '_', $val);
        return $val;
    }
}