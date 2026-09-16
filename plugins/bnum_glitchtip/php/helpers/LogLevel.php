<?php

/**
 * Niveaux de journalisation disponibles, du plus verbeux au plus critique.
 *
 * Chaque cas est "backed" par une chaîne de caractères (`string`), utilisable
 * directement comme valeur sérialisable (ex. écriture dans un fichier de log,
 * transmission via une API, stockage en base).
 */
enum LogLevel: string
{
    /** Traçage très fin, utilisé pour du débogage approfondi (flux d'exécution détaillé). */
    case Trace = 'trace';

    /** Informations de débogage utiles au développement, non destinées à la production. */
    case Debug = 'debug';

    /** Événement normal du fonctionnement de l'application. */
    case Info = 'info';

    /** Situation anormale mais non bloquante, qui mérite une attention. */
    case Warn = 'warning';

    /** Erreur empêchant une opération de se dérouler correctement. */
    case Error = 'error';

    /** Erreur critique compromettant le fonctionnement global de l'application. */
    case Fatal = 'fatal';
}