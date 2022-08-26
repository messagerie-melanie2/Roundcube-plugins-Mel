<?php 
interface iModuleBase {
    function page_index();
    function register_module($args = []);
    /**
     * Vérifie si il y a un plugin lié à ce module.
     *
     * @param boolean $arg
     * @return boolean
     */
    function have_plugin($args = false);
}

interface iModuleHooks extends iModuleBase
{
    function connector_index($args);
}

interface iModuleActions {
    function program_task();
}