<?php
class EnumChannelType {
    private $value;

    private function __construct(string $enum) {
        $this->value = $enum;
    }

    public function isEqual(EnumChannelType $enum) : bool {
        return $enum->value === $this->value;
    }

    public function toString() {
        return is_string($this->value) ? $this->value : json_encode($this->value);
    }

    public static function Private() {
        return new EnumChannelType('p');
    }

    public static function Public() {
        return new EnumChannelType('c');
    }

    public static function Direct() {
        return new EnumChannelType('d');
    }
}

class EnumStatusType {
    private $value;

    private function __construct(string $enum) {
        $this->value = $enum;
    }

    public function isEqual(EnumStatusType $enum) : bool {
        return $enum->value === $this->value;
    }

    public function toString() {
        return is_string($this->value) ? $this->value : json_encode($this->value);
    }

    public static function Online() {
        return new EnumStatusType('online');
    }

    public static function Busy() {
        return new EnumStatusType('busy');
    }

    public static function Away() {
        return new EnumStatusType('away');
    }

    public static function Offline() {
        return new EnumStatusType('offline');
    }
}