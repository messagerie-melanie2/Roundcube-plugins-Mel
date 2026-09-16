<?php

/**
 * Constantes utilitaires partagées par le plugin.
 */
final class Constants
{
    /**
     * Décalage (offset) de profondeur de pile à appliquer lors de la résolution
     * de la méthode appelante depuis les fonctions de log statiques du plugin
     * (voir {@see Glitchtip::_get_calling_method()}).
     */
    public const LOG_OFFSET = 2;
}
