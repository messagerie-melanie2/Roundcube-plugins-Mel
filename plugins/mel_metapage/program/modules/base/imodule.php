<?php 
/**
 * Fonctions de base pour un module.
 */
interface iModuleBase {
    /**
     * Index du module via 'action'
     */
    function page_index();
    /**
     * Enregistre le module (Contient register_stask)
     *
     * @param array $args
     * @return void
     */
    function register_module($args = []);
    /**
     * Vérifie si il y a un plugin lié à ce module.
     *
     * @param boolean $arg
     * @return boolean
     */
    function have_plugin($args = false);
}

/**
 * Connecteurs de base pour un module.
 */
interface iModuleHooks extends iModuleBase
{
    function connector_index($args);
}

/**
 * Actions pour la classe de lien.
 */
interface iModuleActions extends iModuleBase {
    function program_task();
}