<?php
declare(strict_types=1);

use bnum_glitchtip\types\scope;

/**
 * Hook "log_call" émis par mel_logs pour les appelants portant l'attribut
 * {@see \MelLogs\ExtraLog} : relaie le log vers {@see Glitchtip}.
 *
 * Les niveaux mel_logs sont convertis vers les niveaux Glitchtip (`Access` → `Trace`).
 * Un niveau inconnu est ignoré : un hook de log ne doit jamais interrompre la requête.
 *
 * ⚠️ Si `enable_logs_hooks` est actif et que le log est aussi écrit localement
 * (`ExtraLog(false)`), il arrive deux fois dans Glitchtip (via ce hook et via `write_log`).
 *
 * @param scope $_ Plugin (pas utilisé)
 * @param array{level: \MelLogs\LogLevel, message: string, data: array, caller: string} $args
 * @return array Les arguments inchangés, tels que reçus.
 **/
return static function (scope $_, array $args): array {
    if (!class_exists('\MelLogs\LogLevel', autoload:false)) return $args;

    $level = match ($args['level'] ?? null) {
        \MelLogs\LogLevel::Trace, \MelLogs\LogLevel::Access => LogLevel::Trace,
        \MelLogs\LogLevel::Debug => LogLevel::Debug,
        \MelLogs\LogLevel::Info => LogLevel::Info,
        \MelLogs\LogLevel::Warn => LogLevel::Warn,
        \MelLogs\LogLevel::Error => LogLevel::Error,
        default => null,
    };

    if ($level === null) return $args;

    $data = $args['data'] ?? [];
    $attributes = ($data['attributes'] ?? []) + ['caller' => $args['caller'] ?? 'unknown'];

    Glitchtip::Instance()->log($level->value, (string)($args['message'] ?? ''), 0, $data['context'] ?? [], $attributes);

    return $args;
};
