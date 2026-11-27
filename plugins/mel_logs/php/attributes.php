<?php
declare(strict_types = 1);

namespace MelLogs;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_FUNCTION)]
final class ExtraLog {
    public function __construct(
        public bool $onlyExtraLog = false
    ) {}
}