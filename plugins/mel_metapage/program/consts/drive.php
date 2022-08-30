<?php
abstract class ConstDrive {
    public const TASK_NAME = Consts::TASK_DRIVE;

    public const FUNCTION_INDEX = Consts::FUNCTION_INDEX;

    public const HOOK_NAMESPACE = self::TASK_NAME;
    public const HOOK_NAMESPACE_SPERATOR = Consts::HOOK_NAMESPACE_SPERATOR;
    public const HOOK_HAVE_PLUGIN = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.Consts::HOOK_HAVE_PLUGIN;
    public const HOOK_REGISTER_MODULE = self::HOOK_NAMESPACE.self::HOOK_NAMESPACE_SPERATOR.Consts::HOOK_REGISTER_MODULE;

    public const RETURN = Consts::RETURN;
}