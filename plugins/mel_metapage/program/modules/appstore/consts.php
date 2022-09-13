<?php
include_once __DIR__.'/../base/consts.php';
abstract class ConstAppStore 
{
    public const TASK_NAME = Consts::TASK_APP_STORE;

    public const HOOK_NAMESPACE = self::TASK_NAME;
    public const HOOK_NAMESPACE_SPERATOR = Consts::HOOK_NAMESPACE_SPERATOR;

    public const CONFIG_NAME = 'APPSTORE';

    public const APP_RESULT_KEY_ID = 'id';
    public const APP_RESULT_KEY_TITLE = 'title';
    public const APP_RESULT_KEY_DESC = 'desc';
    public const APP_RESULT_KEY_ICON = 'icon';
    public const APP_RESULT_KEY_CATEGORY = 'category';
    public const APP_RESULT_KEY_IS_MAIN = 'is_main';
    public const APP_RESULT_KEY_ENABLED = 'enabled';
    public const APP_RESULT_KEY_TYPE = 'type';
    public const APP_RESULT_KEY_ADDITIONNAL_DATA = 'url';

    public const APP_TYPE_PLUGIN = 'plugin';
    public const APP_TYPE_LINK = 'link';

    public const RETURN = Consts::RETURN;
}