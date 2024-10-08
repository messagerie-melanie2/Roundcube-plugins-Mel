/**
 * @module Log
 */

/**
 * Class qui gère les log javascript du bnum.
 * @static
 * @class
 * @classdesc Class qui gère les log javascript du bnum. Contrairement à `console.log`, les fonctions demande le nom de la fonction en plus des données. De plus, elle prend en compte un niveau de log qui permet d'afficher ou non certaines informations.
 */
export class BnumLog {
  /**
   * Fonction privée, elle affiche un log selon sa gravitée, avec le nom de la fonction qui l'a appelé.
   * @private
   * @param {LogLevel} log_level Niveau de log du log
   * @param {function} log_func Fonction qui sera charger d'afficher le log
   * @param {string} prepend_text Texte à mettre avant le nom de la fonction
   * @param {string} function_name Nom de la fonction
   * @param  {...any} args Seront affichés après le nom de la fonciton.
   * @example BnumLog._log(BnumLog.LogLevels.error, console.error, '###', 'MaFonction', 'test', window);
   * @static
   */
  static _log(log_level, log_func, prepend_text, function_name, ...args) {
    if (log_level >= BnumLog.log_level) {
      log_func(
        `${moment().format('DD/MM/YYYY HH:mm:ss.SSS')} ${prepend_text}[${function_name}]`,
        ...args,
      );
    }
  }

  /**
   * Affiche un log
   *
   * Niveau de log : {@link BnumLog.LogLevels.trace}
   * @param {string} function_name  Nom de la fonction qui lance ce log
   * @param  {...any} args Données à afficher
   * @example BnumLog.log('where', 'Je passe ici !');
   * @static
   */
  static log(function_name, ...args) {
    this._log(BnumLog.LogLevels.trace, console.log, '', function_name, ...args);
  }

  /**
   * Affiche une info
   *
   * Niveau de log : {@link BnumLog.LogLevels.trace}
   * @param {string} function_name  Nom de la fonction qui lance ce log
   * @param  {...any} args Données à afficher
   * @example BnumLog.info('load', 'Chargement du module : ', module_name);
   * @static
   */
  static info(function_name, ...args) {
    const PREPEND_TEXT = EMPTY_STRING;
    this._log(
      BnumLog.LogLevels.trace,
      console.info,
      PREPEND_TEXT,
      function_name,
      ...args,
    );
  }

  /**
   * Affiche un debug
   *
   * Niveau de log : {@link BnumLog.LogLevels.debug}
   * @param {string} function_name  Nom de la fonction qui lance ce log
   * @param  {...any} args Données à afficher
   * @example BnumLog.debug('toArray', 'Before : ', data);
   * @static
   */
  static debug(function_name, ...args) {
    const PREPEND_TEXT = '- dbg -';
    this._log(
      BnumLog.LogLevels.debug,
      console.debug,
      PREPEND_TEXT,
      function_name,
      ...args,
    );
  }

  /**
   * Affiche un debug avec un point d'arrêt
   *
   * Niveau de log : {@link BnumLog.LogLevels.debug}
   * @param {string} function_name  Nom de la fonction qui lance ce log
   * @param  {...any} args Données à afficher
   * @example BnumLog.debugger('toArray', 'Before : ', data);
   * @static
   */
  static debugger(function_name, ...args) {
    debugger;
    this.debug(function_name, ...args);
  }

  /**
   * Affiche un warning
   *
   * Niveau de log : {@link BnumLog.LogLevels.warning}
   * @param {string} function_name  Nom de la fonction qui lance ce log
   * @param  {...any} args Données à afficher
   * @example BnumLog.warning('convert', 'Cette fonction n\'est plus utilisée !');
   * @static
   */
  static warning(function_name, ...args) {
    const PREPEND_TEXT = '/!\\';
    this._log(
      BnumLog.LogLevels.warning,
      console.warn,
      PREPEND_TEXT,
      function_name,
      ...args,
    );
  }

  /**
   * Affiche une erreur
   *
   * Niveau de log : {@link BnumLog.LogLevels.error}
   * @param {string} function_name  Nom de la fonction qui lance ce log
   * @param  {...any} args Données à afficher
   * @example BnumLog.error('where', 'Le générateur est null !', generator, this);
   * @static
   */
  static error(function_name, ...args) {
    const PREPEND_TEXT = '###';
    this._log(
      BnumLog.LogLevels.error,
      console.error,
      PREPEND_TEXT,
      function_name,
      ...args,
    );
  }

  /**
   * Affiche une erreur fatale
   *
   * Niveau de log : {@link BnumLog.LogLevels.fatal}
   * @param {string} function_name  Nom de la fonction qui lance ce log
   * @param  {...any} args Données à afficher
   * @example BnumLog.fatal('show', `${val} n'est pas une donnée valide !`);
   * @static
   */
  static fatal(function_name, ...args) {
    const PREPEND_TEXT = 'FATAL';
    this._log(
      BnumLog.LogLevels.fatal,
      console.error,
      PREPEND_TEXT,
      function_name,
      ...args,
    );
  }

  /**
   * Change le niveau de log
   * @static
   */
  static set_log_level(log_level) {
    this.log_level = log_level;
  }
}

/**
 * Définition de l'énumeartion des niveaux de logs
 * @typedef LogLevels
 * @property {LogLevel} log
 * @property {LogLevel} trace
 * @property {LogLevel} debug
 * @property {LogLevel} warning
 * @property {LogLevel} error
 * @property {LogLevel} fatal
 * @enum
 */

/**
 * Niveau de log renvoyer par `LogLevels`
 * @typedef {number} LogLevel
 * @see {@link LogLevels}
 * @see {@link BnumLog.LogLevels}
 */

/**
 * Enumération des niveaux de log possible
 * @type {LogLevels}
 * @enum
 * @readonly
 * @static
 */
BnumLog.LogLevels = {
  log: -1,
  trace: 0,
  debug: 1,
  warning: 2,
  error: 3,
  fatal: 4,
};

Object.defineProperty(BnumLog, 'LogLevels', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: MelEnum.createEnum('LogLevels', BnumLog.LogLevels, false),
});

/**
 * Niveau de log.
 *
 * Les niveau de log en dessous ne seront pas affichés.
 * @static
 * @type {!number}
 * @see {@link LogLevels}
 */
BnumLog.log_level = BnumLog.LogLevels.error;
