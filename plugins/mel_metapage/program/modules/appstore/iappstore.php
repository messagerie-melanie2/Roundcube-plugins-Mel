<?php 
include_once __DIR__.'/../base/imodule.php';
/**
 * Fonctions de base pour l'application store.
 */
interface iAppStoreBase extends iModuleBase {
    function get_apps();
    function update_app_user($id, $enabled);
    //function update_app_moderator($id, $app);
}

/**
 * Connecteurs de base pour un module.
 */
interface iAppStoreHooks extends iAppStoreBase, iModuleHooks
{
    function connector_update_app_user($args = []);
    function connector_get_apps($args = []);
}

/**
 * Actions pour la classe de lien.
 */
interface iAppStoreActions extends iAppStoreBase, iModuleActions {
    function update_app_action($args = []);
}