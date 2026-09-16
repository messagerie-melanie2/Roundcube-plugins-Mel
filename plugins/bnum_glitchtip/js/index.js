(function () {
    'use strict';

    /**
     * Classe de base abstraite fournissant un cycle de vie structuré : initialisation puis exécution.
     *
     * Les sous-classes doivent surcharger {@link _p_init} et {@link _p_main} pour injecter
     * leur logique métier. Le cycle de vie est déclenché via la méthode statique {@link Start},
     * seul point d'entrée prévu pour instancier un `AStartObject`.
     *
     * @example
     * ```typescript
     * class MyService extends AStartObject {
     *   private port!: number;
     *
     *   protected _p_init(port: number): void {
     *     this.port = port;
     *   }
     *
     *   protected _p_main(): void {
     *     console.log(`Listening on port ${this.port}`);
     *   }
     * }
     *
     * MyService.Start(3000);
     * // Output: Listening on port 3000
     * ```
     *
     * @abstract
     */
    class AStartObject {
        constructor() { }
        /**
         * Déclenche la phase d'initialisation en déléguant à {@link _p_init}.
         *
         * Déclaré `private` (et non `#`) afin de rester accessible depuis la méthode
         * statique {@link Start} sur une instance typée `AStartObject`, tout en restant
         * invisible à l'extérieur de la classe.
         *
         * @param args - Arguments transmis à {@link _p_init}.
         */
        _init(...args) {
            this._p_init(...args);
        }
        /**
         * Déclenche la phase d'exécution principale en déléguant à {@link _p_main}.
         *
         * Même justification que {@link _init} pour l'usage de `private`.
         */
        _main() {
            this._p_main();
        }
        /**
         * Hook d'initialisation, appelé une seule fois avant {@link _p_main}.
         *
         * Surchargez cette méthode pour effectuer le travail de setup
         * (chargement de configuration, injection de dépendances, etc.).
         *
         * @param args - Arguments transmis depuis {@link Start}.
         *
         * @example
         * ```typescript
         * protected _p_init(port: number): void {
         *   this.port = port;
         * }
         * ```
         */
        _p_init(...args) { }
        /**
         * Hook d'exécution principale, appelé une seule fois après {@link _p_init}.
         *
         * Surchargez cette méthode pour implémenter la logique cœur de l'objet
         * (démarrage d'un serveur, lancement d'un processus, etc.).
         *
         * @example
         * ```typescript
         * protected _p_main(): void {
         *   this.server.listen(this.port);
         * }
         * ```
         */
        _p_main() { }
        /**
         * Méthode factory statique : instancie la sous-classe concrète, exécute son cycle
         * de vie complet et retourne l'instance prête à l'emploi.
         *
         * C'est le **seul point d'entrée** prévu pour créer un `AStartObject`.
         * Les étapes sont, dans l'ordre :
         * 1. Instanciation de la sous-classe concrète.
         * 2. Appel de `_init(...args)` → dispatche vers {@link _p_init}.
         * 3. Appel de `_main()` → dispatche vers {@link _p_main}.
         * 4. Retour de l'instance complètement initialisée.
         *
         * ### Pourquoi le cast ?
         * TypeScript interdit `new this()` sur une classe abstraite, même depuis une méthode
         * statique. Le cast `as unknown as ConcreteConstructor<Y>` est **inévitable** à cet
         * endroit précis : il est localisé, documenté, et sans fuite vers l'extérieur.
         * L'invariant est garanti par le fait que `Start` ne peut être appelée que sur une
         * sous-classe concrète — TypeScript lèvera une erreur à la construction sinon.
         *
         * @typeParam Y - Type de la sous-classe concrète instanciée.
         * @param args - Arguments transmis à {@link _p_init} de la sous-classe.
         * @returns Une instance complètement initialisée de la sous-classe concrète.
         *
         * @example
         * ```typescript
         * const app = MyApp.Start(3000, true);
         * ```
         */
        static Start(...args) {
            const ctor = this;
            const element = new ctor();
            element._init(...args);
            element._main();
            return element;
        }
    }

    const DEBUG_BUILD$2 = (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__);

    const GLOBAL_OBJ = globalThis;

    const SDK_VERSION = "10.74.0" ;

    function getMainCarrier() {
      getSentryCarrier(GLOBAL_OBJ);
      return GLOBAL_OBJ;
    }
    function getSentryCarrier(carrier) {
      const __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
      __SENTRY__.version = __SENTRY__.version || SDK_VERSION;
      return __SENTRY__[SDK_VERSION] = __SENTRY__[SDK_VERSION] || {};
    }
    function getGlobalSingleton(name, creator, obj = GLOBAL_OBJ) {
      const __SENTRY__ = obj.__SENTRY__ = obj.__SENTRY__ || {};
      const carrier = __SENTRY__[SDK_VERSION] = __SENTRY__[SDK_VERSION] || {};
      return carrier[name] || (carrier[name] = creator());
    }

    const CONSOLE_LEVELS = [
      "debug",
      "info",
      "warn",
      "error",
      "log",
      "assert",
      "trace"
    ];
    const PREFIX = "Sentry Logger ";
    const originalConsoleMethods = {};
    function consoleSandbox(callback) {
      if (!("console" in GLOBAL_OBJ)) {
        return callback();
      }
      const console = GLOBAL_OBJ.console;
      const wrappedFuncs = {};
      const wrappedLevels = Object.keys(originalConsoleMethods);
      wrappedLevels.forEach((level) => {
        const originalConsoleMethod = originalConsoleMethods[level];
        wrappedFuncs[level] = console[level];
        console[level] = originalConsoleMethod;
      });
      try {
        return callback();
      } finally {
        wrappedLevels.forEach((level) => {
          console[level] = wrappedFuncs[level];
        });
      }
    }
    function enable() {
      _getLoggerSettings().enabled = true;
    }
    function disable() {
      _getLoggerSettings().enabled = false;
    }
    function isEnabled$1() {
      return _getLoggerSettings().enabled;
    }
    function log(...args) {
      _maybeLog("log", ...args);
    }
    function warn(...args) {
      _maybeLog("warn", ...args);
    }
    function error(...args) {
      _maybeLog("error", ...args);
    }
    function _maybeLog(level, ...args) {
      if (!DEBUG_BUILD$2) {
        return;
      }
      if (isEnabled$1()) {
        consoleSandbox(() => {
          GLOBAL_OBJ.console[level](`${PREFIX}[${level}]:`, ...args);
        });
      }
    }
    function _getLoggerSettings() {
      if (!DEBUG_BUILD$2) {
        return { enabled: false };
      }
      return getGlobalSingleton("loggerSettings", () => ({ enabled: false }));
    }
    const debug = {
      /** Enable logging. */
      enable,
      /** Disable logging. */
      disable,
      /** Check if logging is enabled. */
      isEnabled: isEnabled$1,
      /** Log a message. */
      log,
      /** Log a warning. */
      warn,
      /** Log an error. */
      error
    };

    const STACKTRACE_FRAME_LIMIT = 50;
    const UNKNOWN_FUNCTION = "?";
    const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
    const STRIP_FRAME_REGEXP = /captureMessage|captureException/;
    function createStackParser(...parsers) {
      const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map((p) => p[1]);
      return (stack, skipFirstLines = 0, framesToPop = 0) => {
        const frames = [];
        const lines = stack.split("\n");
        for (let i = skipFirstLines; i < lines.length; i++) {
          let line = lines[i];
          if (line.length > 1024) {
            line = line.slice(0, 1024);
          }
          const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, "$1") : line;
          if (cleanedLine.includes("Error: ")) {
            continue;
          }
          for (const parser of sortedParsers) {
            const frame = parser(cleanedLine);
            if (frame) {
              frames.push(frame);
              break;
            }
          }
          if (frames.length >= STACKTRACE_FRAME_LIMIT + framesToPop) {
            break;
          }
        }
        return stripSentryFramesAndReverse(frames.slice(framesToPop));
      };
    }
    function stackParserFromStackParserOptions(stackParser) {
      if (Array.isArray(stackParser)) {
        return createStackParser(...stackParser);
      }
      return stackParser;
    }
    function stripSentryFramesAndReverse(stack) {
      if (!stack.length) {
        return [];
      }
      const localStack = Array.from(stack);
      if (/sentryWrapped/.test(getLastStackFrame(localStack).function || "")) {
        localStack.pop();
      }
      localStack.reverse();
      if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
        localStack.pop();
        if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
          localStack.pop();
        }
      }
      return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame) => ({
        ...frame,
        filename: frame.filename || getLastStackFrame(localStack).filename,
        function: frame.function || UNKNOWN_FUNCTION
      }));
    }
    function getLastStackFrame(arr) {
      return arr[arr.length - 1] || {};
    }
    const defaultFunctionName = "<anonymous>";
    function getFunctionName(fn) {
      try {
        if (!fn || typeof fn !== "function") {
          return defaultFunctionName;
        }
        return fn.name || defaultFunctionName;
      } catch {
        return defaultFunctionName;
      }
    }
    function getFramesFromEvent(event) {
      const exception = event.exception;
      if (exception) {
        const frames = [];
        try {
          exception.values.forEach((value) => {
            if (value.stacktrace.frames) {
              frames.push(...value.stacktrace.frames);
            }
          });
          return frames;
        } catch {
          return void 0;
        }
      }
      return void 0;
    }

    const handlers$1 = {};
    const instrumented$1 = {};
    function addHandler$1(type, handler) {
      handlers$1[type] = handlers$1[type] || [];
      handlers$1[type].push(handler);
      return () => {
        const typeHandlers = handlers$1[type];
        if (typeHandlers) {
          const index = typeHandlers.indexOf(handler);
          if (index !== -1) {
            typeHandlers.splice(index, 1);
          }
        }
      };
    }
    function maybeInstrument(type, instrumentFn) {
      if (!instrumented$1[type]) {
        instrumented$1[type] = true;
        try {
          instrumentFn();
        } catch (e) {
          DEBUG_BUILD$2 && debug.error(`Error while instrumenting ${type}`, e);
        }
      }
    }
    function triggerHandlers$1(type, data) {
      const typeHandlers = type && handlers$1[type];
      if (!typeHandlers) {
        return;
      }
      for (const handler of typeHandlers) {
        try {
          handler(data);
        } catch (e) {
          DEBUG_BUILD$2 && debug.error(
            `Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`,
            e
          );
        }
      }
    }

    let _oldOnErrorHandler = null;
    function addGlobalErrorInstrumentationHandler(handler) {
      const type = "error";
      addHandler$1(type, handler);
      maybeInstrument(type, instrumentError);
    }
    function instrumentError() {
      _oldOnErrorHandler = GLOBAL_OBJ.onerror;
      GLOBAL_OBJ.onerror = function(msg, url, line, column, error) {
        const handlerData = {
          column,
          error,
          line,
          msg,
          url
        };
        triggerHandlers$1("error", handlerData);
        if (_oldOnErrorHandler) {
          return _oldOnErrorHandler.apply(this, arguments);
        }
        return false;
      };
      GLOBAL_OBJ.onerror.__SENTRY_INSTRUMENTED__ = true;
    }

    let _oldOnUnhandledRejectionHandler = null;
    function addGlobalUnhandledRejectionInstrumentationHandler(handler) {
      const type = "unhandledrejection";
      addHandler$1(type, handler);
      maybeInstrument(type, instrumentUnhandledRejection);
    }
    function instrumentUnhandledRejection() {
      _oldOnUnhandledRejectionHandler = GLOBAL_OBJ.onunhandledrejection;
      GLOBAL_OBJ.onunhandledrejection = function(e) {
        const handlerData = e;
        triggerHandlers$1("unhandledrejection", handlerData);
        if (_oldOnUnhandledRejectionHandler) {
          return _oldOnUnhandledRejectionHandler.apply(this, arguments);
        }
        return true;
      };
      GLOBAL_OBJ.onunhandledrejection.__SENTRY_INSTRUMENTED__ = true;
    }

    const objectToString = Object.prototype.toString;
    function isError(wat) {
      switch (objectToString.call(wat)) {
        case "[object Error]":
        case "[object Exception]":
        case "[object DOMException]":
        case "[object WebAssembly.Exception]":
          return true;
        default:
          return isInstanceOf(wat, Error);
      }
    }
    function isBuiltin(wat, className) {
      return objectToString.call(wat) === `[object ${className}]`;
    }
    function isErrorEvent$1(wat) {
      return isBuiltin(wat, "ErrorEvent");
    }
    function isDOMError(wat) {
      return isBuiltin(wat, "DOMError");
    }
    function isDOMException(wat) {
      return isBuiltin(wat, "DOMException");
    }
    function isString(wat) {
      return isBuiltin(wat, "String");
    }
    function isParameterizedString(wat) {
      return typeof wat === "object" && wat !== null && "__sentry_template_string__" in wat && "__sentry_template_values__" in wat;
    }
    function isPrimitive(wat) {
      return wat === null || isParameterizedString(wat) || typeof wat !== "object" && typeof wat !== "function";
    }
    function isPlainObject(wat) {
      return isBuiltin(wat, "Object");
    }
    function isObjectLike(wat) {
      return typeof wat === "object" && wat !== null;
    }
    function isEvent(wat) {
      return typeof Event !== "undefined" && isInstanceOf(wat, Event);
    }
    function isRegExp(wat) {
      return isBuiltin(wat, "RegExp");
    }
    function isThenable(wat) {
      return Boolean(wat?.then && typeof wat.then === "function");
    }
    function isInstanceOf(wat, base) {
      try {
        return wat instanceof base;
      } catch {
        return false;
      }
    }
    function isRequest(request) {
      return typeof Request !== "undefined" && isInstanceOf(request, Request);
    }

    function fill(source, name, replacementFactory) {
      if (!(name in source)) {
        return;
      }
      const original = source[name];
      if (typeof original !== "function") {
        return;
      }
      const wrapped = replacementFactory(original);
      if (typeof wrapped === "function") {
        markFunctionWrapped(wrapped, original);
      }
      try {
        source[name] = wrapped;
      } catch {
        DEBUG_BUILD$2 && debug.log(`Failed to replace method "${name}" in object`, source);
      }
    }
    function addNonEnumerableProperty(obj, name, value) {
      try {
        Object.defineProperty(obj, name, {
          // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
          value,
          writable: true,
          configurable: true
        });
      } catch {
        DEBUG_BUILD$2 && debug.log(`Failed to add non-enumerable property "${String(name)}" to object`, obj);
      }
    }
    function markFunctionWrapped(wrapped, original) {
      try {
        const proto = original.prototype || {};
        wrapped.prototype = original.prototype = proto;
        addNonEnumerableProperty(wrapped, "__sentry_original__", original);
      } catch {
      }
    }
    function getOriginalFunction(func) {
      return func.__sentry_original__;
    }
    function convertToPlainObject(value) {
      if (isError(value)) {
        return {
          message: value.message,
          name: value.name,
          stack: value.stack,
          ...getOwnProperties(value)
        };
      }
      if (isEvent(value)) {
        const { type, target, currentTarget, detail } = value;
        return {
          type,
          target,
          currentTarget,
          ...detail ? { detail } : {},
          ...getOwnProperties(value)
        };
      }
      return value;
    }
    function getOwnProperties(obj) {
      if (isObjectLike(obj)) {
        return Object.fromEntries(Object.entries(obj));
      }
      return {};
    }
    function extractExceptionKeysForMessage(exception) {
      const keys = Object.keys(convertToPlainObject(exception));
      keys.sort();
      return !keys[0] ? "[object has no keys]" : keys.join(", ");
    }

    let RESOLVED_RUNNER;
    function withRandomSafeContext(cb) {
      if (RESOLVED_RUNNER !== void 0) {
        return RESOLVED_RUNNER ? RESOLVED_RUNNER(cb) : cb();
      }
      const sym = /* @__PURE__ */ Symbol.for("__SENTRY_SAFE_RANDOM_ID_WRAPPER__");
      const globalWithSymbol = GLOBAL_OBJ;
      if (sym in globalWithSymbol && typeof globalWithSymbol[sym] === "function") {
        RESOLVED_RUNNER = globalWithSymbol[sym];
        return RESOLVED_RUNNER(cb);
      }
      RESOLVED_RUNNER = null;
      return cb();
    }
    function safeMathRandom() {
      return withRandomSafeContext(() => Math.random());
    }
    function safeDateNow() {
      return withRandomSafeContext(() => Date.now());
    }

    const SENTRY_SKIP_NORMALIZATION = /* @__PURE__ */ Symbol.for("sentry.skipNormalization");
    const SENTRY_OVERRIDE_NORMALIZATION_DEPTH = /* @__PURE__ */ Symbol.for("sentry.overrideNormalizationDepth");
    function hasSkipNormalizationHint(value) {
      return Boolean(value[SENTRY_SKIP_NORMALIZATION]);
    }
    function getNormalizationDepthOverrideHint(value) {
      const v = value[SENTRY_OVERRIDE_NORMALIZATION_DEPTH];
      return typeof v === "number" ? v : void 0;
    }

    let stringifier;
    function setNormalizeStringifier(newStringifier) {
      stringifier = newStringifier;
    }
    function normalize(input, depth = 100, maxProperties = Infinity) {
      try {
        return visit("", input, depth, maxProperties);
      } catch (err) {
        return { ERROR: `**non-serializable** (${err})` };
      }
    }
    function normalizeToSize(object, depth = 3, maxSize = 100 * 1024) {
      const normalized = normalize(object, depth);
      if (jsonSize(normalized) > maxSize) {
        return normalizeToSize(object, depth - 1, maxSize);
      }
      return normalized;
    }
    function visit(key, value, depth = Infinity, maxProperties = Infinity, memo = memoBuilder()) {
      const [memoize, unmemoize] = memo;
      if (value == null || // this matches null and undefined -> eqeq not eqeqeq
      ["boolean", "string"].includes(typeof value) || typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      const stringified = stringifyValue(key, value);
      if (!stringified.startsWith("[object ")) {
        return stringified;
      }
      if (hasSkipNormalizationHint(value)) {
        return value;
      }
      const overrideDepth = getNormalizationDepthOverrideHint(value);
      const remainingDepth = overrideDepth !== void 0 ? overrideDepth : depth;
      if (remainingDepth === 0) {
        return stringified.replace("object ", "");
      }
      if (memoize(value)) {
        return "[Circular ~]";
      }
      const valueWithToJSON = value;
      if (valueWithToJSON && typeof valueWithToJSON.toJSON === "function") {
        try {
          const jsonValue = valueWithToJSON.toJSON();
          return visit("", jsonValue, remainingDepth - 1, maxProperties, memo);
        } catch {
        }
      }
      const normalized = Array.isArray(value) ? [] : {};
      let numAdded = 0;
      const visitable = convertToPlainObject(value);
      for (const visitKey in visitable) {
        if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) {
          continue;
        }
        if (numAdded >= maxProperties) {
          normalized[visitKey] = "[MaxProperties ~]";
          break;
        }
        const visitValue = visitable[visitKey];
        normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo);
        numAdded++;
      }
      unmemoize(value);
      return normalized;
    }
    function stringifyValue(key, value) {
      try {
        if (stringifier) {
          const stringified = stringifier(value);
          if (stringified) {
            return stringified;
          }
        }
        if (typeof global !== "undefined" && value === global) {
          return "[Global]";
        }
        if (typeof value === "number" && !Number.isFinite(value)) {
          return `[${value}]`;
        }
        if (typeof value === "function") {
          return `[Function: ${getFunctionName(value)}]`;
        }
        if (typeof value === "symbol") {
          return `[${String(value)}]`;
        }
        if (typeof value === "bigint") {
          return `[BigInt: ${String(value)}]`;
        }
        const objName = getConstructorName$1(value);
        return `[object ${objName}]`;
      } catch (err) {
        return `**non-serializable** (${err})`;
      }
    }
    function getConstructorName$1(value) {
      const prototype = Object.getPrototypeOf(value);
      return prototype?.constructor ? prototype.constructor.name : "null prototype";
    }
    function utf8Length(value) {
      return ~-encodeURI(value).split(/%..|./).length;
    }
    function jsonSize(value) {
      return utf8Length(JSON.stringify(value));
    }
    function memoBuilder() {
      const inner = /* @__PURE__ */ new WeakSet();
      function memoize(obj) {
        if (inner.has(obj)) {
          return true;
        }
        inner.add(obj);
        return false;
      }
      function unmemoize(obj) {
        inner.delete(obj);
      }
      return [memoize, unmemoize];
    }

    function truncate(str, max = 0) {
      if (typeof str !== "string" || max === 0) {
        return str;
      }
      return str.length <= max ? str : `${str.slice(0, max)}...`;
    }
    function safeJoin(input, delimiter) {
      if (!Array.isArray(input)) {
        return "";
      }
      const output = [];
      for (let i = 0; i < input.length; i++) {
        const value = input[i];
        if (isPrimitive(value)) {
          output.push(String(value));
        } else if (value instanceof Error) {
          output.push(value.message ? `${value.name}: ${value.message}` : value.name);
        } else {
          output.push(stringifyValue(void 0, value));
        }
      }
      return output.join(delimiter);
    }
    function isMatchingPattern(value, pattern, requireExactStringMatch = false) {
      if (!isString(value)) {
        return false;
      }
      if (isRegExp(pattern)) {
        return pattern.test(value);
      }
      if (isString(pattern)) {
        return requireExactStringMatch ? value === pattern : value.includes(pattern);
      }
      if (typeof pattern === "function") {
        return pattern(value);
      }
      return false;
    }
    function stringMatchesSomePattern(testString, patterns = [], requireExactStringMatch = false) {
      for (const pattern of patterns) {
        if (isMatchingPattern(testString, pattern, requireExactStringMatch)) {
          return true;
        }
      }
      return false;
    }

    function getCrypto() {
      const gbl = GLOBAL_OBJ;
      return gbl.crypto || gbl.msCrypto;
    }
    let emptyUuid;
    function getRandomByte() {
      return safeMathRandom() * 16;
    }
    function uuid4(crypto = getCrypto()) {
      try {
        if (crypto?.randomUUID) {
          return withRandomSafeContext(() => crypto.randomUUID()).replace(/-/g, "");
        }
      } catch {
      }
      if (!emptyUuid) {
        emptyUuid = "10000000100040008000" + 1e11;
      }
      return emptyUuid.replace(
        /[018]/g,
        (c) => (
          // eslint-disable-next-line no-bitwise
          (c ^ (getRandomByte() & 15) >> c / 4).toString(16)
        )
      );
    }
    function getFirstException(event) {
      return event.exception?.values?.[0];
    }
    function getEventDescription(event) {
      const { message, event_id: eventId } = event;
      if (message) {
        return message;
      }
      const firstException = getFirstException(event);
      if (firstException) {
        if (firstException.type && firstException.value) {
          return `${firstException.type}: ${firstException.value}`;
        }
        return firstException.type || firstException.value || eventId || "<unknown>";
      }
      return eventId || "<unknown>";
    }
    function addExceptionTypeValue(event, value, type) {
      const exception = event.exception = event.exception || {};
      const values = exception.values = exception.values || [];
      const firstException = values[0] = values[0] || {};
      if (!firstException.value) {
        firstException.value = value || "";
      }
      if (!firstException.type) {
        firstException.type = "Error";
      }
    }
    function addExceptionMechanism(event, newMechanism) {
      const firstException = getFirstException(event);
      if (!firstException) {
        return;
      }
      const defaultMechanism = { type: "generic", handled: true };
      const currentMechanism = firstException.mechanism;
      firstException.mechanism = { ...defaultMechanism, ...currentMechanism, ...newMechanism };
      if (newMechanism && "data" in newMechanism) {
        const mergedData = { ...currentMechanism?.data, ...newMechanism.data };
        firstException.mechanism.data = mergedData;
      }
    }
    function checkOrSetAlreadyCaught(exception) {
      if (isAlreadyCaptured(exception)) {
        return true;
      }
      try {
        addNonEnumerableProperty(exception, "__sentry_captured__", true);
      } catch {
      }
      return false;
    }
    function isAlreadyCaptured(exception) {
      try {
        return exception.__sentry_captured__;
      } catch {
      }
    }

    const ONE_SECOND_IN_MS = 1e3;
    function dateTimestampInSeconds() {
      return safeDateNow() / ONE_SECOND_IN_MS;
    }
    function createUnixTimestampInSecondsFunc() {
      const { performance } = GLOBAL_OBJ;
      if (!performance?.now || !performance.timeOrigin) {
        return dateTimestampInSeconds;
      }
      const timeOrigin = performance.timeOrigin;
      return () => {
        return (timeOrigin + withRandomSafeContext(() => performance.now())) / ONE_SECOND_IN_MS;
      };
    }
    let _cachedTimestampInSeconds;
    function timestampInSeconds() {
      const func = _cachedTimestampInSeconds ?? (_cachedTimestampInSeconds = createUnixTimestampInSecondsFunc());
      return func();
    }
    let cachedTimeOrigin = null;
    function getBrowserTimeOrigin() {
      const { performance } = GLOBAL_OBJ;
      if (!performance?.now) {
        return void 0;
      }
      const threshold = 3e5;
      const performanceNow = withRandomSafeContext(() => performance.now());
      const dateNow = safeDateNow();
      const timeOrigin = performance.timeOrigin;
      if (typeof timeOrigin === "number") {
        const timeOriginDelta = Math.abs(timeOrigin + performanceNow - dateNow);
        if (timeOriginDelta < threshold) {
          return timeOrigin;
        }
      }
      const navigationStart = performance.timing?.navigationStart;
      if (typeof navigationStart === "number") {
        const navigationStartDelta = Math.abs(navigationStart + performanceNow - dateNow);
        if (navigationStartDelta < threshold) {
          return navigationStart;
        }
      }
      return dateNow - performanceNow;
    }
    function browserPerformanceTimeOrigin() {
      if (cachedTimeOrigin === null) {
        cachedTimeOrigin = getBrowserTimeOrigin();
      }
      return cachedTimeOrigin;
    }

    function makeSession(context) {
      const startingTime = timestampInSeconds();
      const session = {
        sid: uuid4(),
        init: true,
        timestamp: startingTime,
        started: startingTime,
        duration: 0,
        status: "ok",
        errors: 0,
        ignoreDuration: false,
        toJSON: () => sessionToJSON(session)
      };
      if (context) {
        updateSession(session, context);
      }
      return session;
    }
    function updateSession(session, context = {}) {
      if (context.user) {
        if (!session.ipAddress && context.user.ip_address) {
          session.ipAddress = context.user.ip_address;
        }
        if (!session.did && !context.did) {
          session.did = context.user.id || context.user.email || context.user.username;
        }
      }
      session.timestamp = context.timestamp || timestampInSeconds();
      if (context.abnormal_mechanism) {
        session.abnormal_mechanism = context.abnormal_mechanism;
      }
      if (context.ignoreDuration) {
        session.ignoreDuration = context.ignoreDuration;
      }
      if (context.sid) {
        session.sid = context.sid.length === 32 ? context.sid : uuid4();
      }
      if (context.init !== void 0) {
        session.init = context.init;
      }
      if (!session.did && context.did) {
        session.did = `${context.did}`;
      }
      if (typeof context.started === "number") {
        session.started = context.started;
      }
      if (session.ignoreDuration) {
        session.duration = void 0;
      } else if (typeof context.duration === "number") {
        session.duration = context.duration;
      } else {
        const duration = session.timestamp - session.started;
        session.duration = duration >= 0 ? duration : 0;
      }
      if (context.release) {
        session.release = context.release;
      }
      if (context.environment) {
        session.environment = context.environment;
      }
      if (!session.ipAddress && context.ipAddress) {
        session.ipAddress = context.ipAddress;
      }
      if (!session.userAgent && context.userAgent) {
        session.userAgent = context.userAgent;
      }
      if (typeof context.errors === "number") {
        session.errors = context.errors;
      }
      if (context.status) {
        session.status = context.status;
      }
    }
    function closeSession(session, status) {
      let context = {};
      if (session.status === "ok") {
        context = { status: "exited" };
      }
      updateSession(session, context);
    }
    function sessionToJSON(session) {
      return {
        sid: `${session.sid}`,
        init: session.init,
        // Make sure that sec is converted to ms for date constructor
        started: new Date(session.started * 1e3).toISOString(),
        timestamp: new Date(session.timestamp * 1e3).toISOString(),
        status: session.status,
        errors: session.errors,
        did: typeof session.did === "number" || typeof session.did === "string" ? `${session.did}` : void 0,
        duration: session.duration,
        abnormal_mechanism: session.abnormal_mechanism,
        attrs: {
          release: session.release,
          environment: session.environment,
          ip_address: session.ipAddress,
          user_agent: session.userAgent
        }
      };
    }

    function merge(initialObj, mergeObj, levels = 2) {
      if (!mergeObj || typeof mergeObj !== "object" || levels <= 0) {
        return mergeObj;
      }
      if (initialObj && Object.keys(mergeObj).length === 0) {
        return initialObj;
      }
      const output = { ...initialObj };
      for (const key in mergeObj) {
        if (Object.prototype.hasOwnProperty.call(mergeObj, key)) {
          output[key] = merge(output[key], mergeObj[key], levels - 1);
        }
      }
      return output;
    }

    function generateTraceId() {
      return uuid4();
    }
    function generateSpanId() {
      return uuid4().substring(16);
    }

    function makeWeakRef(value) {
      try {
        const WeakRefImpl = GLOBAL_OBJ.WeakRef;
        if (typeof WeakRefImpl === "function") {
          return new WeakRefImpl(value);
        }
      } catch {
      }
      return value;
    }
    function derefWeakRef(ref) {
      if (!ref) {
        return void 0;
      }
      if (typeof ref === "object" && "deref" in ref && typeof ref.deref === "function") {
        try {
          return ref.deref();
        } catch {
          return void 0;
        }
      }
      return ref;
    }

    const SCOPE_SPAN_FIELD = "_sentrySpan";
    function _setSpanForScope(scope, span) {
      if (span) {
        addNonEnumerableProperty(scope, SCOPE_SPAN_FIELD, makeWeakRef(span));
      } else {
        delete scope[SCOPE_SPAN_FIELD];
      }
    }
    function _getSpanForScope(scope) {
      return derefWeakRef(scope[SCOPE_SPAN_FIELD]);
    }

    const DEFAULT_MAX_BREADCRUMBS = 100;
    class Scope {
      // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.
      constructor() {
        this._notifyingListeners = false;
        this._scopeListeners = [];
        this._eventProcessors = [];
        this._breadcrumbs = [];
        this._attachments = [];
        this._user = {};
        this._tags = {};
        this._attributes = {};
        this._extra = {};
        this._contexts = {};
        this._sdkProcessingMetadata = {};
        this._propagationContext = {
          traceId: generateTraceId(),
          sampleRand: safeMathRandom()
        };
      }
      /**
       * Clone all data from this scope into a new scope.
       */
      clone() {
        const newScope = new Scope();
        newScope._breadcrumbs = [...this._breadcrumbs];
        newScope._tags = { ...this._tags };
        newScope._attributes = { ...this._attributes };
        newScope._extra = { ...this._extra };
        newScope._contexts = { ...this._contexts };
        if (this._contexts.flags) {
          newScope._contexts.flags = {
            values: [...this._contexts.flags.values]
          };
        }
        newScope._user = this._user;
        newScope._level = this._level;
        newScope._session = this._session;
        newScope._transactionName = this._transactionName;
        newScope._fingerprint = this._fingerprint;
        newScope._eventProcessors = [...this._eventProcessors];
        newScope._attachments = [...this._attachments];
        newScope._sdkProcessingMetadata = { ...this._sdkProcessingMetadata };
        newScope._propagationContext = { ...this._propagationContext };
        newScope._client = this._client;
        newScope._lastEventId = this._lastEventId;
        newScope._conversationId = this._conversationId;
        _setSpanForScope(newScope, _getSpanForScope(this));
        return newScope;
      }
      /**
       * Update the client assigned to this scope.
       * Note that not every scope will have a client assigned - isolation scopes & the global scope will generally not have a client,
       * as well as manually created scopes.
       */
      setClient(client) {
        this._client = client;
      }
      /**
       * Set the ID of the last captured error event.
       * This is generally only captured on the isolation scope.
       */
      setLastEventId(lastEventId) {
        this._lastEventId = lastEventId;
      }
      /**
       * Get the client assigned to this scope.
       */
      getClient() {
        return this._client;
      }
      /**
       * Get the ID of the last captured error event.
       * This is generally only available on the isolation scope.
       */
      lastEventId() {
        return this._lastEventId;
      }
      /**
       * @inheritDoc
       */
      addScopeListener(callback) {
        this._scopeListeners.push(callback);
      }
      /**
       * Add an event processor that will be called before an event is sent.
       */
      addEventProcessor(callback) {
        this._eventProcessors.push(callback);
        return this;
      }
      /**
       * Set the user for this scope.
       * Set to `null` to unset the user.
       */
      setUser(user) {
        this._user = user || {
          email: void 0,
          id: void 0,
          ip_address: void 0,
          username: void 0
        };
        if (this._session) {
          updateSession(this._session, { user });
        }
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Get the user from this scope.
       */
      getUser() {
        return this._user;
      }
      /**
       * Set the conversation ID for this scope.
       * Set to `null` to unset the conversation ID.
       */
      setConversationId(conversationId) {
        this._conversationId = conversationId || void 0;
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Set an object that will be merged into existing tags on the scope,
       * and will be sent as tags data with the event.
       */
      setTags(tags) {
        this._tags = {
          ...this._tags,
          ...tags
        };
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Set a single tag that will be sent as tags data with the event.
       */
      setTag(key, value) {
        return this.setTags({ [key]: value });
      }
      /**
       * Sets attributes onto the scope.
       *
       * These attributes are applied to logs, metrics and streamed spans.
       *
       * Supported attribute value types are `string`, `number`, `boolean`, `string[]`, `number[]` and `boolean[]`.
       *
       * @param newAttributes - The attributes to set on the scope, as key-value pairs.
       *
       * @example
       * ```typescript
       * scope.setAttributes({
       *   is_admin: true,
       *   payment_selection: 'credit_card',
       *   render_duration: 150,
       * });
       * ```
       */
      setAttributes(newAttributes) {
        this._attributes = {
          ...this._attributes,
          ...newAttributes
        };
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Sets an attribute onto the scope.
       *
       * These attributes are applied to logs, metrics and streamed spans.
       *
       * Supported attribute value types are `string`, `number`, `boolean`, `string[]`, `number[]` and `boolean[]`.
       *
       * @param key - The attribute key.
       * @param value - The attribute value.
       *
       * @example
       * ```typescript
       * scope.setAttribute('is_admin', true);
       * scope.setAttribute('render_duration', 150);
       * ```
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAttribute(key, value) {
        return this.setAttributes({ [key]: value });
      }
      /**
       * Removes the attribute with the given key from the scope.
       *
       * @param key - The attribute key.
       *
       * @example
       * ```typescript
       * scope.removeAttribute('is_admin');
       * ```
       */
      removeAttribute(key) {
        if (key in this._attributes) {
          delete this._attributes[key];
          this._notifyScopeListeners();
        }
        return this;
      }
      /**
       * Set an object that will be merged into existing extra on the scope,
       * and will be sent as extra data with the event.
       */
      setExtras(extras) {
        this._extra = {
          ...this._extra,
          ...extras
        };
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Set a single key:value extra entry that will be sent as extra data with the event.
       */
      setExtra(key, extra) {
        this._extra = { ...this._extra, [key]: extra };
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Sets the fingerprint on the scope to send with the events.
       * @param {string[]} fingerprint Fingerprint to group events in Sentry.
       */
      setFingerprint(fingerprint) {
        this._fingerprint = fingerprint;
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Sets the level on the scope for future events.
       */
      setLevel(level) {
        this._level = level;
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Sets the transaction name on the scope so that the name of e.g. taken server route or
       * the page location is attached to future events.
       *
       * IMPORTANT: Calling this function does NOT change the name of the currently active
       * root span. If you want to change the name of the active root span, use
       * `Sentry.updateSpanName(rootSpan, 'new name')` instead.
       *
       * By default, the SDK updates the scope's transaction name automatically on sensible
       * occasions, such as a page navigation or when handling a new request on the server.
       */
      setTransactionName(name) {
        this._transactionName = name;
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Sets context data with the given name.
       * Data passed as context will be normalized. You can also pass `null` to unset the context.
       * Note that context data will not be merged - calling `setContext` will overwrite an existing context with the same key.
       */
      setContext(key, context) {
        if (context === null) {
          delete this._contexts[key];
        } else {
          this._contexts[key] = context;
        }
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Set the session for the scope.
       */
      setSession(session) {
        if (!session) {
          delete this._session;
        } else {
          this._session = session;
        }
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Get the session from the scope.
       */
      getSession() {
        return this._session;
      }
      /**
       * Updates the scope with provided data. Can work in three variations:
       * - plain object containing updatable attributes
       * - Scope instance that'll extract the attributes from
       * - callback function that'll receive the current scope as an argument and allow for modifications
       */
      update(captureContext) {
        if (!captureContext) {
          return this;
        }
        const scopeToMerge = typeof captureContext === "function" ? captureContext(this) : captureContext;
        const scopeInstance = scopeToMerge instanceof Scope ? scopeToMerge.getScopeData() : isPlainObject(scopeToMerge) ? captureContext : void 0;
        const {
          tags,
          attributes,
          extra,
          user,
          contexts,
          level,
          fingerprint = [],
          propagationContext,
          conversationId
        } = scopeInstance || {};
        this._tags = { ...this._tags, ...tags };
        this._attributes = { ...this._attributes, ...attributes };
        this._extra = { ...this._extra, ...extra };
        this._contexts = { ...this._contexts, ...contexts };
        if (user && Object.keys(user).length) {
          this._user = user;
        }
        if (level) {
          this._level = level;
        }
        if (fingerprint.length) {
          this._fingerprint = fingerprint;
        }
        if (propagationContext) {
          this._propagationContext = propagationContext;
        }
        if (conversationId) {
          this._conversationId = conversationId;
        }
        return this;
      }
      /**
       * Clears the current scope and resets its properties.
       * Note: The client will not be cleared.
       *
       * @deprecated This method will be removed in v11. To reset scope state, re-initialize the SDK or run
       * your code in a fresh scope via `withScope` instead.
       */
      clear() {
        this._breadcrumbs = [];
        this._tags = {};
        this._attributes = {};
        this._extra = {};
        this._user = {};
        this._contexts = {};
        this._level = void 0;
        this._transactionName = void 0;
        this._fingerprint = void 0;
        this._session = void 0;
        this._conversationId = void 0;
        _setSpanForScope(this, void 0);
        this._attachments = [];
        this.setPropagationContext({
          traceId: generateTraceId(),
          sampleRand: safeMathRandom()
        });
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Adds a breadcrumb to the scope.
       * By default, the last 100 breadcrumbs are kept.
       */
      addBreadcrumb(breadcrumb, maxBreadcrumbs) {
        const maxCrumbs = typeof maxBreadcrumbs === "number" ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
        if (maxCrumbs <= 0) {
          return this;
        }
        const mergedBreadcrumb = {
          timestamp: dateTimestampInSeconds(),
          ...breadcrumb,
          // Breadcrumb messages can theoretically be infinitely large and they're held in memory so we truncate them not to leak (too much) memory
          message: breadcrumb.message ? truncate(breadcrumb.message, 2048) : breadcrumb.message
        };
        this._breadcrumbs.push(mergedBreadcrumb);
        if (this._breadcrumbs.length > maxCrumbs) {
          this._breadcrumbs = this._breadcrumbs.slice(-maxCrumbs);
          this._client?.recordDroppedEvent("buffer_overflow", "log_item");
        }
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Get the last breadcrumb of the scope.
       */
      getLastBreadcrumb() {
        return this._breadcrumbs[this._breadcrumbs.length - 1];
      }
      /**
       * Clear all breadcrumbs from the scope.
       */
      clearBreadcrumbs() {
        this._breadcrumbs = [];
        this._notifyScopeListeners();
        return this;
      }
      /**
       * Add an attachment to the scope.
       */
      addAttachment(attachment) {
        this._attachments.push(attachment);
        return this;
      }
      /**
       * Clear all attachments from the scope.
       */
      clearAttachments() {
        this._attachments = [];
        return this;
      }
      /**
       * Get the data of this scope, which should be applied to an event during processing.
       */
      getScopeData() {
        return {
          breadcrumbs: this._breadcrumbs,
          attachments: this._attachments,
          contexts: this._contexts,
          tags: this._tags,
          attributes: this._attributes,
          extra: this._extra,
          user: this._user,
          level: this._level,
          fingerprint: this._fingerprint || [],
          eventProcessors: this._eventProcessors,
          propagationContext: this._propagationContext,
          sdkProcessingMetadata: this._sdkProcessingMetadata,
          transactionName: this._transactionName,
          span: _getSpanForScope(this),
          conversationId: this._conversationId
        };
      }
      /**
       * Add data which will be accessible during event processing but won't get sent to Sentry.
       */
      setSDKProcessingMetadata(newData) {
        this._sdkProcessingMetadata = merge(this._sdkProcessingMetadata, newData, 2);
        return this;
      }
      /**
       * Add propagation context to the scope, used for distributed tracing
       */
      setPropagationContext(context) {
        this._propagationContext = context;
        return this;
      }
      /**
       * Get propagation context from the scope, used for distributed tracing
       */
      getPropagationContext() {
        return this._propagationContext;
      }
      /**
       * Capture an exception for this scope.
       *
       * @returns {string} The id of the captured Sentry event.
       */
      captureException(exception, hint) {
        const eventId = hint?.event_id || uuid4();
        if (!this._client) {
          DEBUG_BUILD$2 && debug.warn("No client configured on scope - will not capture exception!");
          return eventId;
        }
        const syntheticException = new Error("Sentry syntheticException");
        this._client.captureException(
          exception,
          {
            originalException: exception,
            syntheticException,
            ...hint,
            event_id: eventId
          },
          this
        );
        return eventId;
      }
      /**
       * Capture a message for this scope.
       *
       * @returns {string} The id of the captured message.
       */
      captureMessage(message, level, hint) {
        const eventId = hint?.event_id || uuid4();
        if (!this._client) {
          DEBUG_BUILD$2 && debug.warn("No client configured on scope - will not capture message!");
          return eventId;
        }
        const syntheticException = hint?.syntheticException ?? new Error(message);
        this._client.captureMessage(
          message,
          level,
          {
            originalException: message,
            syntheticException,
            ...hint,
            event_id: eventId
          },
          this
        );
        return eventId;
      }
      /**
       * Capture a Sentry event for this scope.
       *
       * @returns {string} The id of the captured event.
       */
      captureEvent(event, hint) {
        const eventId = event.event_id || hint?.event_id || uuid4();
        if (!this._client) {
          DEBUG_BUILD$2 && debug.warn("No client configured on scope - will not capture event!");
          return eventId;
        }
        this._client.captureEvent(event, { ...hint, event_id: eventId }, this);
        return eventId;
      }
      /**
       * This will be called on every set call.
       */
      _notifyScopeListeners() {
        if (!this._notifyingListeners) {
          this._notifyingListeners = true;
          this._scopeListeners.forEach((callback) => {
            callback(this);
          });
          this._notifyingListeners = false;
        }
      }
    }

    function getDefaultCurrentScope() {
      return getGlobalSingleton("defaultCurrentScope", () => new Scope());
    }
    function getDefaultIsolationScope() {
      return getGlobalSingleton("defaultIsolationScope", () => new Scope());
    }

    const isActualPromise = (p) => p instanceof Promise && !p[kChainedCopy];
    const kChainedCopy = /* @__PURE__ */ Symbol("chained PromiseLike");
    const chainAndCopyPromiseLike = (original, onSuccess, onError) => {
      const chained = original.then(
        (value) => {
          onSuccess(value);
          return value;
        },
        (err) => {
          onError(err);
          throw err;
        }
      );
      return isActualPromise(chained) && isActualPromise(original) ? chained : copyProps(original, chained);
    };
    const copyProps = (original, chained) => {
      if (!chained) return original;
      let mutated = false;
      for (const key in original) {
        if (key in chained) continue;
        mutated = true;
        const value = original[key];
        if (typeof value === "function") {
          Object.defineProperty(chained, key, {
            value: (...args) => value.apply(original, args),
            enumerable: true,
            configurable: true,
            writable: true
          });
        } else {
          chained[key] = value;
        }
      }
      if (mutated) Object.assign(chained, { [kChainedCopy]: true });
      return chained;
    };

    class AsyncContextStack {
      constructor(scope, isolationScope) {
        let assignedScope;
        if (!scope) {
          assignedScope = new Scope();
        } else {
          assignedScope = scope;
        }
        let assignedIsolationScope;
        if (!isolationScope) {
          assignedIsolationScope = new Scope();
        } else {
          assignedIsolationScope = isolationScope;
        }
        this._stack = [{ scope: assignedScope }];
        this._isolationScope = assignedIsolationScope;
      }
      /**
       * Fork a scope for the stack.
       */
      withScope(callback) {
        const scope = this._pushScope();
        let maybePromiseResult;
        try {
          maybePromiseResult = callback(scope);
        } catch (e) {
          this._popScope();
          throw e;
        }
        if (isThenable(maybePromiseResult)) {
          return chainAndCopyPromiseLike(
            maybePromiseResult,
            () => this._popScope(),
            () => this._popScope()
          );
        }
        this._popScope();
        return maybePromiseResult;
      }
      /**
       * Get the client of the stack.
       */
      getClient() {
        return this.getStackTop().client;
      }
      /**
       * Returns the scope of the top stack.
       */
      getScope() {
        return this.getStackTop().scope;
      }
      /**
       * Get the isolation scope for the stack.
       */
      getIsolationScope() {
        return this._isolationScope;
      }
      /**
       * Returns the topmost scope layer in the order domain > local > process.
       */
      getStackTop() {
        return this._stack[this._stack.length - 1];
      }
      /**
       * Push a scope to the stack.
       */
      _pushScope() {
        const scope = this.getScope().clone();
        this._stack.push({
          client: this.getClient(),
          scope
        });
        return scope;
      }
      /**
       * Pop a scope from the stack.
       */
      _popScope() {
        if (this._stack.length <= 1) return false;
        return !!this._stack.pop();
      }
    }
    function getAsyncContextStack() {
      const registry = getMainCarrier();
      const sentry = getSentryCarrier(registry);
      return sentry.stack = sentry.stack || new AsyncContextStack(getDefaultCurrentScope(), getDefaultIsolationScope());
    }
    function withScope$1(callback) {
      return getAsyncContextStack().withScope(callback);
    }
    function withSetScope(scope, callback) {
      const stack = getAsyncContextStack();
      return stack.withScope(() => {
        stack.getStackTop().scope = scope;
        return callback(scope);
      });
    }
    function withIsolationScope(callback) {
      return getAsyncContextStack().withScope(() => {
        return callback(getAsyncContextStack().getIsolationScope());
      });
    }
    function getStackAsyncContextStrategy() {
      return {
        withIsolationScope,
        withScope: withScope$1,
        withSetScope,
        withSetIsolationScope: (_isolationScope, callback) => {
          return withIsolationScope(callback);
        },
        getCurrentScope: () => getAsyncContextStack().getScope(),
        getIsolationScope: () => getAsyncContextStack().getIsolationScope()
      };
    }

    function getAsyncContextStrategy(carrier) {
      const sentry = getSentryCarrier(carrier);
      if (sentry.acs) {
        return sentry.acs;
      }
      return getStackAsyncContextStrategy();
    }

    function isAttributeObject(maybeObj) {
      return typeof maybeObj === "object" && maybeObj != null && !Array.isArray(maybeObj) && Object.keys(maybeObj).includes("value");
    }
    function attributeValueToTypedAttributeValue(rawValue, useFallback) {
      const { value, unit } = isAttributeObject(rawValue) ? rawValue : { value: rawValue, unit: void 0 };
      const attributeValue = getTypedAttributeValue(value);
      const checkedUnit = unit && typeof unit === "string" ? { unit } : {};
      if (attributeValue) {
        return { ...attributeValue, ...checkedUnit };
      }
      if (!useFallback || useFallback === "skip-undefined" && value === void 0) {
        return;
      }
      let stringValue = "";
      try {
        stringValue = JSON.stringify(value) ?? "";
      } catch {
      }
      return {
        value: stringValue,
        type: "string",
        ...checkedUnit
      };
    }
    function serializeAttributes(attributes, fallback = false) {
      const serializedAttributes = {};
      for (const [key, value] of Object.entries(attributes ?? {})) {
        const typedValue = attributeValueToTypedAttributeValue(value, fallback);
        if (typedValue) {
          serializedAttributes[key] = typedValue;
        }
      }
      return serializedAttributes;
    }
    function getTypedAttributeValue(value) {
      if (Array.isArray(value)) {
        return { value, type: "array" };
      }
      const primitiveType = typeof value === "string" ? "string" : typeof value === "boolean" ? "boolean" : typeof value === "number" && !Number.isNaN(value) ? Number.isInteger(value) ? "integer" : "double" : null;
      if (primitiveType) {
        return { value, type: primitiveType };
      }
    }

    function getCurrentScope() {
      const carrier = getMainCarrier();
      const acs = getAsyncContextStrategy(carrier);
      return acs.getCurrentScope();
    }
    function getIsolationScope() {
      const carrier = getMainCarrier();
      const acs = getAsyncContextStrategy(carrier);
      return acs.getIsolationScope();
    }
    function getGlobalScope() {
      return getGlobalSingleton("globalScope", () => new Scope());
    }
    function withScope(...rest) {
      const carrier = getMainCarrier();
      const acs = getAsyncContextStrategy(carrier);
      if (rest.length === 2) {
        const [scope, callback] = rest;
        if (!scope) {
          return acs.withScope(callback);
        }
        return acs.withSetScope(scope, callback);
      }
      return acs.withScope(rest[0]);
    }
    function getClient() {
      return getCurrentScope().getClient();
    }
    function getTraceContextFromScope(scope) {
      const propagationContext = scope.getPropagationContext();
      const { traceId, parentSpanId, propagationSpanId } = propagationContext;
      const traceContext = {
        trace_id: traceId,
        span_id: propagationSpanId || generateSpanId()
      };
      if (parentSpanId) {
        traceContext.parent_span_id = parentSpanId;
      }
      return traceContext;
    }

    const SEMANTIC_ATTRIBUTE_SENTRY_SOURCE = "sentry.source";
    const SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = "sentry.sample_rate";
    const SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE = "sentry.previous_trace_sample_rate";
    const SEMANTIC_ATTRIBUTE_SENTRY_OP = "sentry.op";
    const SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = "sentry.origin";
    const SEMANTIC_ATTRIBUTE_SENTRY_STATUS_MESSAGE = "sentry.status.message";
    const SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON = "sentry.idle_span_finish_reason";
    const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT = "sentry.measurement_unit";
    const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE = "sentry.measurement_value";
    const SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME = "sentry.custom_span_name";
    const SEMANTIC_ATTRIBUTE_PROFILE_ID = "sentry.profile_id";
    const SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = "sentry.exclusive_time";
    const SEMANTIC_LINK_ATTRIBUTE_LINK_TYPE = "sentry.link.type";
    const GEN_AI_CONVERSATION_ID_ATTRIBUTE = "gen_ai.conversation.id";

    const SPAN_STATUS_UNSET = 0;
    const SPAN_STATUS_OK = 1;
    const SPAN_STATUS_ERROR = 2;
    function getSpanStatusFromHttpCode(httpStatus) {
      if (httpStatus < 400 && httpStatus >= 100) {
        return { code: SPAN_STATUS_OK };
      }
      if (httpStatus >= 400 && httpStatus < 500) {
        switch (httpStatus) {
          case 401:
            return { code: SPAN_STATUS_ERROR, message: "unauthenticated" };
          case 403:
            return { code: SPAN_STATUS_ERROR, message: "permission_denied" };
          case 404:
            return { code: SPAN_STATUS_ERROR, message: "not_found" };
          case 409:
            return { code: SPAN_STATUS_ERROR, message: "already_exists" };
          case 413:
            return { code: SPAN_STATUS_ERROR, message: "failed_precondition" };
          case 429:
            return { code: SPAN_STATUS_ERROR, message: "resource_exhausted" };
          case 499:
            return { code: SPAN_STATUS_ERROR, message: "cancelled" };
          default:
            return { code: SPAN_STATUS_ERROR, message: "invalid_argument" };
        }
      }
      if (httpStatus >= 500 && httpStatus < 600) {
        switch (httpStatus) {
          case 501:
            return { code: SPAN_STATUS_ERROR, message: "unimplemented" };
          case 503:
            return { code: SPAN_STATUS_ERROR, message: "unavailable" };
          case 504:
            return { code: SPAN_STATUS_ERROR, message: "deadline_exceeded" };
          default:
            return { code: SPAN_STATUS_ERROR, message: "internal_error" };
        }
      }
      return { code: SPAN_STATUS_ERROR, message: "internal_error" };
    }
    function setHttpStatus(span, httpStatus) {
      span.setAttribute("http.response.status_code", httpStatus);
      const spanStatus = getSpanStatusFromHttpCode(httpStatus);
      if (spanStatus.message !== "unknown_error") {
        span.setStatus(spanStatus);
      }
    }

    const SCOPE_ON_START_SPAN_FIELD = "_sentryScope";
    const ISOLATION_SCOPE_ON_START_SPAN_FIELD = "_sentryIsolationScope";
    const OTEL_SOURCE_INFERENCE_SPAN_FIELD = /* @__PURE__ */ Symbol.for("sentry.otelSourceInference");
    const OTEL_SOURCE_EXPLICITLY_SET_SPAN_FIELD = /* @__PURE__ */ Symbol.for("sentry.otelSourceExplicitlySet");
    const TRACER_PROVIDER_SPAN_FIELD = /* @__PURE__ */ Symbol.for("sentry.tracerProviderSpan");
    function setCapturedScopesOnSpan(span, scope, isolationScope) {
      if (span) {
        addNonEnumerableProperty(span, ISOLATION_SCOPE_ON_START_SPAN_FIELD, makeWeakRef(isolationScope));
        addNonEnumerableProperty(span, SCOPE_ON_START_SPAN_FIELD, scope);
      }
    }
    function getCapturedScopesOnSpan(span) {
      const spanWithScopes = span;
      return {
        scope: spanWithScopes[SCOPE_ON_START_SPAN_FIELD],
        isolationScope: derefWeakRef(spanWithScopes[ISOLATION_SCOPE_ON_START_SPAN_FIELD])
      };
    }
    function spanShouldInferOtelSource(span) {
      return span[OTEL_SOURCE_INFERENCE_SPAN_FIELD] === true;
    }
    function markSpanSourceAsExplicit(span) {
      addNonEnumerableProperty(span, OTEL_SOURCE_EXPLICITLY_SET_SPAN_FIELD, true);
    }
    function spanIsTracerProviderSpan(span) {
      return span[TRACER_PROVIDER_SPAN_FIELD] === true;
    }

    const SENTRY_BAGGAGE_KEY_PREFIX = "sentry-";
    const MAX_BAGGAGE_STRING_LENGTH = 8192;
    function baggageHeaderToDynamicSamplingContext(baggageHeader) {
      const baggageObject = parseBaggageHeader(baggageHeader);
      if (!baggageObject) {
        return void 0;
      }
      const dynamicSamplingContext = Object.entries(baggageObject).reduce((acc, [key, value]) => {
        if (key.startsWith(SENTRY_BAGGAGE_KEY_PREFIX)) {
          const nonPrefixedKey = key.slice(SENTRY_BAGGAGE_KEY_PREFIX.length);
          acc[nonPrefixedKey] = value;
        }
        return acc;
      }, {});
      if (Object.keys(dynamicSamplingContext).length > 0) {
        return dynamicSamplingContext;
      } else {
        return void 0;
      }
    }
    function dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext) {
      if (!dynamicSamplingContext) {
        return void 0;
      }
      const sentryPrefixedDSC = Object.entries(dynamicSamplingContext).reduce(
        (acc, [dscKey, dscValue]) => {
          if (dscValue) {
            acc[`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`] = dscValue;
          }
          return acc;
        },
        {}
      );
      return objectToBaggageHeader(sentryPrefixedDSC);
    }
    function parseBaggageHeader(baggageHeader) {
      if (!baggageHeader || !isString(baggageHeader) && !Array.isArray(baggageHeader)) {
        return void 0;
      }
      if (Array.isArray(baggageHeader)) {
        return baggageHeader.reduce((acc, curr) => {
          const currBaggageObject = baggageHeaderToObject(curr);
          Object.entries(currBaggageObject).forEach(([key, value]) => {
            acc[key] = value;
          });
          return acc;
        }, {});
      }
      return baggageHeaderToObject(baggageHeader);
    }
    function baggageHeaderToObject(baggageHeader) {
      return baggageHeader.split(",").map((baggageEntry) => {
        const eqIdx = baggageEntry.indexOf("=");
        if (eqIdx === -1) {
          return [];
        }
        const key = baggageEntry.slice(0, eqIdx);
        const value = baggageEntry.slice(eqIdx + 1);
        return [key, value].map((keyOrValue) => {
          try {
            return decodeURIComponent(keyOrValue.trim());
          } catch {
            return;
          }
        });
      }).reduce((acc, [key, value]) => {
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
    }
    function objectToBaggageHeader(object) {
      if (Object.keys(object).length === 0) {
        return void 0;
      }
      return Object.entries(object).reduce((baggageHeader, [objectKey, objectValue], currentIndex) => {
        const baggageEntry = `${encodeURIComponent(objectKey)}=${encodeURIComponent(objectValue)}`;
        const newBaggageHeader = currentIndex === 0 ? baggageEntry : `${baggageHeader},${baggageEntry}`;
        if (newBaggageHeader.length > MAX_BAGGAGE_STRING_LENGTH) {
          DEBUG_BUILD$2 && debug.warn(
            `Not adding key: ${objectKey} with val: ${objectValue} to baggage header due to exceeding baggage size limits.`
          );
          return baggageHeader;
        } else {
          return newBaggageHeader;
        }
      }, "");
    }

    const ORG_ID_REGEX = /^o(\d+)\./;
    const DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)((?:\[[:.%\w]+\]|[\w.-]+))(?::(\d+))?\/(.+)/;
    function isValidProtocol(protocol) {
      return protocol === "http" || protocol === "https";
    }
    function dsnToString(dsn, withPassword = false) {
      const { host, path, pass, port, projectId, protocol, publicKey } = dsn;
      return `${protocol}://${publicKey}${withPassword && pass ? `:${pass}` : ""}@${host}${port ? `:${port}` : ""}/${path ? `${path}/` : path}${projectId}`;
    }
    function dsnFromString(str) {
      const match = DSN_REGEX.exec(str);
      if (!match) {
        consoleSandbox(() => {
          console.error(`Invalid Sentry Dsn: ${str}`);
        });
        return void 0;
      }
      const [protocol, publicKey, pass = "", host = "", port = "", lastPath = ""] = match.slice(1);
      let path = "";
      let projectId = lastPath;
      const split = projectId.split("/");
      if (split.length > 1) {
        path = split.slice(0, -1).join("/");
        projectId = split.pop();
      }
      if (projectId) {
        const projectMatch = projectId.match(/^\d+/);
        if (projectMatch) {
          projectId = projectMatch[0];
        }
      }
      return dsnFromComponents({ host, pass, path, projectId, port, protocol, publicKey });
    }
    function dsnFromComponents(components) {
      return {
        protocol: components.protocol,
        publicKey: components.publicKey || "",
        pass: components.pass || "",
        host: components.host,
        port: components.port || "",
        path: components.path || "",
        projectId: components.projectId
      };
    }
    function validateDsn(dsn) {
      if (!DEBUG_BUILD$2) {
        return true;
      }
      const { port, projectId, protocol } = dsn;
      const requiredComponents = ["protocol", "publicKey", "host", "projectId"];
      const hasMissingRequiredComponent = requiredComponents.find((component) => {
        if (!dsn[component]) {
          debug.error(`Invalid Sentry Dsn: ${component} missing`);
          return true;
        }
        return false;
      });
      if (hasMissingRequiredComponent) {
        return false;
      }
      if (!projectId.match(/^\d+$/)) {
        debug.error(`Invalid Sentry Dsn: Invalid projectId ${projectId}`);
        return false;
      }
      if (!isValidProtocol(protocol)) {
        debug.error(`Invalid Sentry Dsn: Invalid protocol ${protocol}`);
        return false;
      }
      if (port && isNaN(parseInt(port, 10))) {
        debug.error(`Invalid Sentry Dsn: Invalid port ${port}`);
        return false;
      }
      return true;
    }
    function extractOrgIdFromDsnHost(host) {
      const match = host.match(ORG_ID_REGEX);
      return match?.[1];
    }
    function extractOrgIdFromClient(client) {
      const options = client.getOptions();
      const { host } = client.getDsn() || {};
      let org_id;
      if (options.orgId) {
        org_id = String(options.orgId);
      } else if (host) {
        org_id = extractOrgIdFromDsnHost(host);
      }
      return org_id;
    }
    function makeDsn(from) {
      const components = typeof from === "string" ? dsnFromString(from) : dsnFromComponents(from);
      if (!components || !validateDsn(components)) {
        return void 0;
      }
      return components;
    }

    function parseSampleRate(sampleRate) {
      if (typeof sampleRate === "boolean") {
        return Number(sampleRate);
      }
      const rate = typeof sampleRate === "string" ? parseFloat(sampleRate) : sampleRate;
      if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > 1) {
        return void 0;
      }
      return rate;
    }

    const TRACEPARENT_REGEXP = new RegExp(
      "^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$"
      // whitespace
    );
    function extractTraceparentData(traceparent) {
      if (!traceparent) {
        return void 0;
      }
      const matches = traceparent.match(TRACEPARENT_REGEXP);
      if (!matches) {
        return void 0;
      }
      let parentSampled;
      if (matches[3] === "1") {
        parentSampled = true;
      } else if (matches[3] === "0") {
        parentSampled = false;
      }
      return {
        traceId: matches[1],
        parentSampled,
        parentSpanId: matches[2]
      };
    }
    function propagationContextFromHeaders(sentryTrace, baggage) {
      const traceparentData = extractTraceparentData(sentryTrace);
      const dynamicSamplingContext = baggageHeaderToDynamicSamplingContext(baggage);
      if (!traceparentData?.traceId) {
        return {
          traceId: generateTraceId(),
          sampleRand: safeMathRandom()
        };
      }
      const sampleRand = getSampleRandFromTraceparentAndDsc(traceparentData, dynamicSamplingContext);
      if (dynamicSamplingContext) {
        dynamicSamplingContext.sample_rand = sampleRand.toString();
      }
      const { traceId, parentSpanId, parentSampled } = traceparentData;
      return {
        traceId,
        parentSpanId,
        sampled: parentSampled,
        dsc: dynamicSamplingContext || {},
        // If we have traceparent data but no DSC it means we are not head of trace and we must freeze it
        sampleRand
      };
    }
    function generateSentryTraceHeader(traceId = generateTraceId(), spanId = generateSpanId(), sampled) {
      let sampledString = "";
      if (sampled !== void 0) {
        sampledString = sampled ? "-1" : "-0";
      }
      return `${traceId}-${spanId}${sampledString}`;
    }
    function generateTraceparentHeader(traceId = generateTraceId(), spanId = generateSpanId(), sampled) {
      return `00-${traceId}-${spanId}-${sampled ? "01" : "00"}`;
    }
    function getSampleRandFromTraceparentAndDsc(traceparentData, dsc) {
      const parsedSampleRand = parseSampleRate(dsc?.sample_rand);
      if (parsedSampleRand !== void 0) {
        return parsedSampleRand;
      }
      const parsedSampleRate = parseSampleRate(dsc?.sample_rate);
      if (parsedSampleRate && traceparentData?.parentSampled !== void 0) {
        return traceparentData.parentSampled ? (
          // Returns a sample rand with positive sampling decision [0, sampleRate)
          safeMathRandom() * parsedSampleRate
        ) : (
          // Returns a sample rand with negative sampling decision [sampleRate, 1)
          parsedSampleRate + safeMathRandom() * (1 - parsedSampleRate)
        );
      } else {
        return safeMathRandom();
      }
    }

    const TRACE_FLAG_NONE = 0;
    const TRACE_FLAG_SAMPLED = 1;
    let hasShownSpanDropWarning = false;
    function spanToTransactionTraceContext(span) {
      const { spanId: span_id, traceId: trace_id } = span.spanContext();
      const { data, op, parent_span_id, status, origin, links } = spanToJSON(span);
      return {
        parent_span_id,
        span_id,
        trace_id,
        data,
        op,
        status,
        origin,
        links
      };
    }
    function spanToTraceContext(span) {
      const { spanId, traceId: trace_id, isRemote } = span.spanContext();
      const parent_span_id = isRemote ? spanId : spanToJSON(span).parent_span_id;
      const scope = getCapturedScopesOnSpan(span).scope;
      const span_id = isRemote ? scope?.getPropagationContext().propagationSpanId || generateSpanId() : spanId;
      return {
        parent_span_id,
        span_id,
        trace_id
      };
    }
    function spanToTraceHeader(span) {
      const { traceId, spanId } = span.spanContext();
      const sampled = spanIsSampled(span);
      return generateSentryTraceHeader(traceId, spanId, sampled);
    }
    function spanToTraceparentHeader(span) {
      const { traceId, spanId } = span.spanContext();
      const sampled = spanIsSampled(span);
      return generateTraceparentHeader(traceId, spanId, sampled);
    }
    function convertSpanLinksForEnvelope(links) {
      if (links && links.length > 0) {
        return links.map(({ context: { spanId, traceId, traceFlags, ...restContext }, attributes }) => ({
          span_id: spanId,
          trace_id: traceId,
          sampled: traceFlags === TRACE_FLAG_SAMPLED,
          attributes,
          ...restContext
        }));
      } else {
        return void 0;
      }
    }
    function getStreamedSpanLinks(links) {
      if (links?.length) {
        return links.map(({ context: { spanId, traceId, traceFlags }, attributes }) => ({
          span_id: spanId,
          trace_id: traceId,
          sampled: traceFlags === TRACE_FLAG_SAMPLED,
          attributes
        }));
      } else {
        return void 0;
      }
    }
    function spanTimeInputToSeconds(input) {
      if (typeof input === "number") {
        return ensureTimestampInSeconds(input);
      }
      if (Array.isArray(input)) {
        return input[0] + input[1] / 1e9;
      }
      if (input instanceof Date) {
        return ensureTimestampInSeconds(input.getTime());
      }
      return timestampInSeconds();
    }
    function ensureTimestampInSeconds(timestamp) {
      const isMs = timestamp > 9999999999;
      return isMs ? timestamp / 1e3 : timestamp;
    }
    function spanToJSON(span) {
      if (spanIsSentrySpan(span)) {
        return span.getSpanJSON();
      }
      const { spanId: span_id, traceId: trace_id } = span.spanContext();
      if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
        const { attributes, startTime, name, endTime, status, links } = span;
        return {
          span_id,
          trace_id,
          data: attributes,
          description: name,
          parent_span_id: getOtelParentSpanId(span),
          start_timestamp: spanTimeInputToSeconds(startTime),
          // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
          timestamp: spanTimeInputToSeconds(endTime) || void 0,
          status: getStatusMessage(status),
          op: attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
          origin: attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
          links: convertSpanLinksForEnvelope(links)
        };
      }
      return {
        span_id,
        trace_id,
        start_timestamp: 0,
        data: {}
      };
    }
    function spanToStreamedSpanJSON(span) {
      if (spanIsSentrySpan(span)) {
        return span.getStreamedSpanJSON();
      }
      const { spanId: span_id, traceId: trace_id } = span.spanContext();
      if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
        const { attributes, startTime, name, endTime, status, links } = span;
        return {
          name,
          span_id,
          trace_id,
          parent_span_id: getOtelParentSpanId(span),
          start_timestamp: spanTimeInputToSeconds(startTime),
          end_timestamp: spanTimeInputToSeconds(endTime),
          is_segment: span === INTERNAL_getSegmentSpan(span),
          status: getSimpleStatus(status),
          attributes: addStatusMessageAttribute(attributes, status),
          links: getStreamedSpanLinks(links)
        };
      }
      return {
        span_id,
        trace_id,
        start_timestamp: 0,
        name: "",
        end_timestamp: 0,
        status: "ok",
        is_segment: span === INTERNAL_getSegmentSpan(span)
      };
    }
    function getOtelParentSpanId(span) {
      return "parentSpanId" in span ? span.parentSpanId : "parentSpanContext" in span ? span.parentSpanContext?.spanId : void 0;
    }
    function streamedSpanJsonToSerializedSpan(spanJson) {
      return {
        ...spanJson,
        attributes: serializeAttributes(spanJson.attributes),
        links: spanJson.links?.map((link) => ({
          ...link,
          attributes: serializeAttributes(link.attributes)
        }))
      };
    }
    function spanIsOpenTelemetrySdkTraceBaseSpan(span) {
      const castSpan = span;
      return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
    }
    function spanIsSentrySpan(span) {
      return typeof span.getSpanJSON === "function";
    }
    function spanIsSampled(span) {
      const { traceFlags } = span.spanContext();
      return traceFlags === TRACE_FLAG_SAMPLED;
    }
    function getStatusMessage(status) {
      if (!status || status.code === SPAN_STATUS_UNSET) {
        return void 0;
      }
      if (status.code === SPAN_STATUS_OK) {
        return "ok";
      }
      return status.message || "internal_error";
    }
    function getSimpleStatus(status) {
      return !status || status.code === SPAN_STATUS_OK || status.code === SPAN_STATUS_UNSET || status.message === "cancelled" ? "ok" : "error";
    }
    function addStatusMessageAttribute(attributes, status) {
      const statusMessage = getSimpleStatus(status) === "error" ? status?.message : void 0;
      return {
        ...statusMessage && { [SEMANTIC_ATTRIBUTE_SENTRY_STATUS_MESSAGE]: statusMessage },
        ...attributes
      };
    }
    const CHILD_SPANS_FIELD = "_sentryChildSpans";
    const ROOT_SPAN_FIELD = "_sentryRootSpan";
    function addChildSpanToSpan(span, childSpan) {
      const rootSpan = span[ROOT_SPAN_FIELD] || span;
      addNonEnumerableProperty(childSpan, ROOT_SPAN_FIELD, rootSpan);
      if (!spanIsSampled(span)) {
        return;
      }
      if (!span.isRecording() && !rootSpan.isRecording()) {
        return;
      }
      if (span[CHILD_SPANS_FIELD]) {
        span[CHILD_SPANS_FIELD].add(childSpan);
      } else {
        addNonEnumerableProperty(span, CHILD_SPANS_FIELD, /* @__PURE__ */ new Set([childSpan]));
      }
    }
    function removeChildSpanFromSpan(span, childSpan) {
      if (span[CHILD_SPANS_FIELD]) {
        span[CHILD_SPANS_FIELD].delete(childSpan);
      }
    }
    function getSpanDescendants(span) {
      const resultSet = /* @__PURE__ */ new Set();
      function addSpanChildren(span2) {
        if (resultSet.has(span2)) {
          return;
        } else if (spanIsSampled(span2)) {
          resultSet.add(span2);
          const childSpans = span2[CHILD_SPANS_FIELD] ? Array.from(span2[CHILD_SPANS_FIELD]) : [];
          for (const childSpan of childSpans) {
            addSpanChildren(childSpan);
          }
        }
      }
      addSpanChildren(span);
      return Array.from(resultSet);
    }
    const getRootSpan = INTERNAL_getSegmentSpan;
    function INTERNAL_getSegmentSpan(span) {
      return span[ROOT_SPAN_FIELD] || span;
    }
    function getActiveSpan() {
      const carrier = getMainCarrier();
      const acs = getAsyncContextStrategy(carrier);
      if (acs.getActiveSpan) {
        return acs.getActiveSpan();
      }
      return _getSpanForScope(getCurrentScope());
    }
    function showSpanDropWarning() {
      if (!hasShownSpanDropWarning) {
        consoleSandbox(() => {
          console.warn(
            "[Sentry] Returning null from `beforeSendSpan` is disallowed. To drop certain spans, configure the respective integrations directly or use `ignoreSpans`."
          );
        });
        hasShownSpanDropWarning = true;
      }
    }

    let errorsInstrumented = false;
    function registerSpanErrorInstrumentation() {
      if (errorsInstrumented) {
        return;
      }
      function errorCallback() {
        const activeSpan = getActiveSpan();
        const rootSpan = activeSpan && getRootSpan(activeSpan);
        if (rootSpan) {
          const message = "internal_error";
          DEBUG_BUILD$2 && debug.log(`[Tracing] Root span: ${message} -> Global error occurred`);
          rootSpan.setStatus({ code: SPAN_STATUS_ERROR, message });
        }
      }
      errorsInstrumented = true;
      addGlobalErrorInstrumentationHandler(errorCallback);
      addGlobalUnhandledRejectionInstrumentationHandler(errorCallback);
    }

    function hasSpansEnabled(maybeOptions) {
      if (typeof __SENTRY_TRACING__ === "boolean" && !__SENTRY_TRACING__) {
        return false;
      }
      const options = maybeOptions || getClient()?.getOptions();
      return !!options && // Note: This check is `!= null`, meaning "nullish". `0` is not "nullish", `undefined` and `null` are. (This comment was brought to you by 15 minutes of questioning life)
      (options.tracesSampleRate != null || !!options.tracesSampler);
    }

    function logIgnoredSpan(droppedSpan) {
      debug.log(`Ignoring span ${droppedSpan.op} - ${droppedSpan.description} because it matches \`ignoreSpans\`.`);
    }
    function shouldIgnoreSpan(span, ignoreSpans) {
      if (!ignoreSpans?.length) {
        return false;
      }
      for (const pattern of ignoreSpans) {
        if (isStringOrRegExp(pattern)) {
          if (span.description && isMatchingPattern(span.description, pattern)) {
            DEBUG_BUILD$2 && logIgnoredSpan(span);
            return true;
          }
          continue;
        }
        const hasAttributes = !!pattern.attributes && Object.keys(pattern.attributes).length > 0;
        if (!pattern.name && !pattern.op && !hasAttributes) {
          continue;
        }
        const nameMatches = pattern.name ? span.description && isMatchingPattern(span.description, pattern.name) : true;
        const opMatches = pattern.op ? span.op && isMatchingPattern(span.op, pattern.op) : true;
        const attrsMatch = pattern.attributes ? Object.entries(pattern.attributes).every(
          ([key, valuePattern]) => _matchesAttributeValue(span.attributes?.[key], valuePattern)
        ) : true;
        if (nameMatches && opMatches && attrsMatch) {
          DEBUG_BUILD$2 && logIgnoredSpan(span);
          return true;
        }
      }
      return false;
    }
    function _matchesAttributeValue(actual, pat) {
      if (typeof actual === "string" && (typeof pat === "string" || pat instanceof RegExp)) {
        return isMatchingPattern(actual, pat);
      }
      if (Array.isArray(actual) && Array.isArray(pat)) {
        return actual.length === pat.length && actual.every((v, i) => v === pat[i]);
      }
      return actual === pat;
    }
    function reparentChildSpans(spans, dropSpan) {
      const droppedSpanParentId = dropSpan.parent_span_id;
      const droppedSpanId = dropSpan.span_id;
      if (!droppedSpanParentId) {
        return;
      }
      for (const span of spans) {
        if (span.parent_span_id === droppedSpanId) {
          span.parent_span_id = droppedSpanParentId;
        }
      }
    }
    function isStringOrRegExp(value) {
      return typeof value === "string" || value instanceof RegExp;
    }

    const NON_RECORDING_SPAN_FIELD = /* @__PURE__ */ Symbol.for("sentry.nonRecordingSpan");
    class SentryNonRecordingSpan {
      constructor(spanContext = {}) {
        this._traceId = spanContext.traceId || generateTraceId();
        this._spanId = spanContext.spanId || generateSpanId();
        this.dropReason = spanContext.dropReason;
        addNonEnumerableProperty(this, NON_RECORDING_SPAN_FIELD, true);
      }
      /** @inheritdoc */
      spanContext() {
        return {
          spanId: this._spanId,
          traceId: this._traceId,
          traceFlags: TRACE_FLAG_NONE
        };
      }
      /** @inheritdoc */
      end(_timestamp) {
      }
      /** @inheritdoc */
      setAttribute(_key, _value) {
        return this;
      }
      /** @inheritdoc */
      setAttributes(_values) {
        return this;
      }
      /** @inheritdoc */
      setStatus(_status) {
        return this;
      }
      /** @inheritdoc */
      updateName(_name) {
        return this;
      }
      /** @inheritdoc */
      isRecording() {
        return false;
      }
      /** @inheritdoc */
      addEvent(_name, _attributesOrStartTime, _startTime) {
        return this;
      }
      /** @inheritDoc */
      addLink(_link) {
        return this;
      }
      /** @inheritDoc */
      addLinks(_links) {
        return this;
      }
      /**
       * This should generally not be used,
       * but we need it for being compliant with the OTEL Span interface.
       *
       * @hidden
       * @internal
       */
      recordException(_exception, _time) {
      }
    }
    function spanIsNonRecordingSpan(span) {
      return !!span && span[NON_RECORDING_SPAN_FIELD] === true;
    }

    const DEFAULT_ENVIRONMENT = "production";

    const FROZEN_DSC_FIELD = "_frozenDsc";
    function freezeDscOnSpan(span, dsc) {
      const spanWithMaybeDsc = span;
      addNonEnumerableProperty(spanWithMaybeDsc, FROZEN_DSC_FIELD, dsc);
    }
    function getDynamicSamplingContextFromClient(trace_id, client) {
      const options = client.getOptions();
      const { publicKey: public_key } = client.getDsn() || {};
      const dsc = {
        environment: options.environment || DEFAULT_ENVIRONMENT,
        release: options.release,
        public_key,
        trace_id,
        org_id: extractOrgIdFromClient(client)
      };
      client.emit("createDsc", dsc);
      return dsc;
    }
    function getDynamicSamplingContextFromScope(client, scope) {
      const propagationContext = scope.getPropagationContext();
      return propagationContext.dsc || getDynamicSamplingContextFromClient(propagationContext.traceId, client);
    }
    function getDynamicSamplingContextFromSpan(span) {
      const client = getClient();
      if (!client) {
        return {};
      }
      const rootSpan = getRootSpan(span);
      const rootSpanJson = spanToJSON(rootSpan);
      const rootSpanAttributes = rootSpanJson.data;
      const traceState = rootSpan.spanContext().traceState;
      const rootSpanSampleRate = traceState?.get("sentry.sample_rate") ?? rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE] ?? rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE];
      function applyLocalSampleRateToDsc(dsc2) {
        if (typeof rootSpanSampleRate === "number" || typeof rootSpanSampleRate === "string") {
          dsc2.sample_rate = `${rootSpanSampleRate}`;
        }
        return dsc2;
      }
      const frozenDsc = rootSpan[FROZEN_DSC_FIELD];
      if (frozenDsc) {
        return applyLocalSampleRateToDsc(frozenDsc);
      }
      const isNonRecordingRoot = spanIsNonRecordingSpan(rootSpan);
      const isIgnoredRoot = isNonRecordingRoot && rootSpan.dropReason === "ignored";
      if (isNonRecordingRoot && (!hasSpansEnabled(client.getOptions()) || isIgnoredRoot)) {
        const capturedScope = getCapturedScopesOnSpan(rootSpan).scope;
        if (capturedScope) {
          const dsc2 = { ...getDynamicSamplingContextFromScope(client, capturedScope) };
          if (isIgnoredRoot) {
            dsc2.sampled = "false";
          }
          return applyLocalSampleRateToDsc(dsc2);
        }
      }
      const traceStateDsc = traceState?.get("sentry.dsc");
      const dscOnTraceState = traceStateDsc && baggageHeaderToDynamicSamplingContext(traceStateDsc);
      if (dscOnTraceState) {
        return applyLocalSampleRateToDsc(dscOnTraceState);
      }
      const dsc = getDynamicSamplingContextFromClient(span.spanContext().traceId, client);
      const source = rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] ?? rootSpanAttributes["sentry.segment.name.source"];
      const name = rootSpanJson.description;
      if (source !== "url" && name) {
        dsc.transaction = name;
      }
      if (hasSpansEnabled()) {
        dsc.sampled = String(spanIsSampled(rootSpan));
        dsc.sample_rand = // In OTEL we store the sample rand on the trace state because we cannot access scopes for NonRecordingSpans
        // The Sentry OTEL SpanSampler takes care of writing the sample rand on the root span
        traceState?.get("sentry.sample_rand") ?? // On all other platforms we can actually get the scopes from a root span (we use this as a fallback)
        getCapturedScopesOnSpan(rootSpan).scope?.getPropagationContext().sampleRand.toString();
      }
      applyLocalSampleRateToDsc(dsc);
      client.emit("createDsc", dsc, rootSpan);
      return dsc;
    }

    function isStreamedBeforeSendSpanCallback(callback) {
      return !!callback && typeof callback === "function" && "_streamed" in callback && !!callback._streamed;
    }

    function createEnvelope(headers, items = []) {
      return [headers, items];
    }
    function addItemToEnvelope(envelope, newItem) {
      const [headers, items] = envelope;
      return [headers, [...items, newItem]];
    }
    function forEachEnvelopeItem(envelope, callback) {
      const envelopeItems = envelope[1];
      for (const envelopeItem of envelopeItems) {
        const envelopeItemType = envelopeItem[0].type;
        const result = callback(envelopeItem, envelopeItemType);
        if (result) {
          return true;
        }
      }
      return false;
    }
    function envelopeContainsItemType(envelope, types) {
      return forEachEnvelopeItem(envelope, (_, type) => types.includes(type));
    }
    function encodeUTF8(input) {
      const carrier = getSentryCarrier(GLOBAL_OBJ);
      return carrier.encodePolyfill ? carrier.encodePolyfill(input) : new TextEncoder().encode(input);
    }
    function serializeEnvelope(envelope) {
      const [envHeaders, items] = envelope;
      let parts = JSON.stringify(envHeaders);
      function append(next) {
        if (typeof parts === "string") {
          parts = typeof next === "string" ? parts + next : [encodeUTF8(parts), next];
        } else {
          parts.push(typeof next === "string" ? encodeUTF8(next) : next);
        }
      }
      for (const item of items) {
        const [itemHeaders, payload] = item;
        append(`
${JSON.stringify(itemHeaders)}
`);
        if (typeof payload === "string" || payload instanceof Uint8Array) {
          append(payload);
        } else {
          let stringifiedPayload;
          try {
            stringifiedPayload = JSON.stringify(payload);
          } catch {
            stringifiedPayload = JSON.stringify(normalize(payload));
          }
          append(stringifiedPayload);
        }
      }
      return typeof parts === "string" ? parts : concatBuffers(parts);
    }
    function concatBuffers(buffers) {
      const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const buffer of buffers) {
        merged.set(buffer, offset);
        offset += buffer.length;
      }
      return merged;
    }
    function createSpanEnvelopeItem(spanJson) {
      const spanHeaders = {
        type: "span"
      };
      return [spanHeaders, spanJson];
    }
    function createAttachmentEnvelopeItem(attachment) {
      const buffer = typeof attachment.data === "string" ? encodeUTF8(attachment.data) : attachment.data;
      return [
        {
          type: "attachment",
          length: buffer.length,
          filename: attachment.filename,
          content_type: attachment.contentType,
          attachment_type: attachment.attachmentType
        },
        buffer
      ];
    }
    const DATA_CATEGORY_OVERRIDES = {
      sessions: "session",
      event: "error",
      client_report: "internal",
      user_report: "default",
      profile_chunk: "profile",
      replay_event: "replay",
      replay_recording: "replay",
      check_in: "monitor",
      raw_security: "security",
      log: "log_item",
      trace_metric: "metric"
    };
    function _isOverriddenType(type) {
      return type in DATA_CATEGORY_OVERRIDES;
    }
    function envelopeItemTypeToDataCategory(type) {
      return _isOverriddenType(type) ? DATA_CATEGORY_OVERRIDES[type] : type;
    }
    function getSdkMetadataForEnvelopeHeader(metadataOrEvent) {
      if (!metadataOrEvent?.sdk) {
        return;
      }
      const { name, version } = metadataOrEvent.sdk;
      return { name, version };
    }
    function createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn) {
      const dynamicSamplingContext = event.sdkProcessingMetadata?.dynamicSamplingContext;
      return {
        event_id: event.event_id,
        sent_at: new Date(safeDateNow()).toISOString(),
        ...sdkInfo && { sdk: sdkInfo },
        ...!!tunnel && dsn && { dsn: dsnToString(dsn) },
        ...dynamicSamplingContext && {
          trace: dynamicSamplingContext
        }
      };
    }

    function _enhanceEventWithSdkInfo(event, newSdkInfo) {
      if (!newSdkInfo) {
        return event;
      }
      const eventSdkInfo = event.sdk || {};
      event.sdk = {
        ...eventSdkInfo,
        name: eventSdkInfo.name || newSdkInfo.name,
        version: eventSdkInfo.version || newSdkInfo.version,
        integrations: [...event.sdk?.integrations || [], ...newSdkInfo.integrations || []],
        packages: [...event.sdk?.packages || [], ...newSdkInfo.packages || []],
        settings: event.sdk?.settings || newSdkInfo.settings ? {
          ...event.sdk?.settings,
          ...newSdkInfo.settings
        } : void 0
      };
      return event;
    }
    function createSessionEnvelope(session, dsn, metadata, tunnel) {
      const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
      const envelopeHeaders = {
        sent_at: new Date(safeDateNow()).toISOString(),
        ...sdkInfo && { sdk: sdkInfo },
        ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
      };
      const envelopeItem = "aggregates" in session ? [{ type: "sessions" }, session] : [{ type: "session" }, session.toJSON()];
      return createEnvelope(envelopeHeaders, [envelopeItem]);
    }
    function createEventEnvelope(event, dsn, metadata, tunnel) {
      const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
      const eventType = event.type && event.type !== "replay_event" ? event.type : "event";
      _enhanceEventWithSdkInfo(event, metadata?.sdk);
      const envelopeHeaders = createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn);
      delete event.sdkProcessingMetadata;
      const eventItem = [{ type: eventType }, event];
      return createEnvelope(envelopeHeaders, [eventItem]);
    }
    function createSpanEnvelope(spans, client) {
      function dscHasRequiredProps(dsc2) {
        return !!dsc2.trace_id && !!dsc2.public_key;
      }
      const dsc = getDynamicSamplingContextFromSpan(spans[0]);
      const dsn = client?.getDsn();
      const tunnel = client?.getOptions().tunnel;
      const headers = {
        sent_at: new Date(safeDateNow()).toISOString(),
        ...dscHasRequiredProps(dsc) && { trace: dsc },
        ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
      };
      const { beforeSendSpan, ignoreSpans } = client?.getOptions() || {};
      const filteredSpans = ignoreSpans?.length ? spans.filter((span) => {
        const json = spanToJSON(span);
        return !shouldIgnoreSpan({ description: json.description, op: json.op, attributes: json.data }, ignoreSpans);
      }) : spans;
      const droppedSpans = spans.length - filteredSpans.length;
      if (droppedSpans) {
        client?.recordDroppedEvent("before_send", "span", droppedSpans);
      }
      const convertToSpanJSON = beforeSendSpan ? (span) => {
        const spanJson = spanToJSON(span);
        const processedSpan = !isStreamedBeforeSendSpanCallback(beforeSendSpan) ? beforeSendSpan(spanJson) : spanJson;
        if (!processedSpan) {
          showSpanDropWarning();
          return spanJson;
        }
        return processedSpan;
      } : spanToJSON;
      const items = [];
      for (const span of filteredSpans) {
        const spanJson = convertToSpanJSON(span);
        if (spanJson) {
          items.push(createSpanEnvelopeItem(spanJson));
        }
      }
      return createEnvelope(headers, items);
    }

    function logSpanStart(span) {
      if (!DEBUG_BUILD$2) return;
      const { description = "< unknown name >", op = "< unknown op >", parent_span_id: parentSpanId } = spanToJSON(span);
      const { spanId } = span.spanContext();
      const sampled = spanIsSampled(span);
      const rootSpan = getRootSpan(span);
      const isRootSpan = rootSpan === span;
      const header = `[Tracing] Starting ${sampled ? "sampled" : "unsampled"} ${isRootSpan ? "root " : ""}span`;
      const infoParts = [`op: ${op}`, `name: ${description}`, `ID: ${spanId}`];
      if (parentSpanId) {
        infoParts.push(`parent ID: ${parentSpanId}`);
      }
      if (!isRootSpan) {
        const { op: op2, description: description2 } = spanToJSON(rootSpan);
        infoParts.push(`root ID: ${rootSpan.spanContext().spanId}`);
        if (op2) {
          infoParts.push(`root op: ${op2}`);
        }
        if (description2) {
          infoParts.push(`root description: ${description2}`);
        }
      }
      debug.log(`${header}
  ${infoParts.join("\n  ")}`);
    }
    function logSpanEnd(span) {
      if (!DEBUG_BUILD$2) return;
      const { description = "< unknown name >", op = "< unknown op >" } = spanToJSON(span);
      const { spanId } = span.spanContext();
      const rootSpan = getRootSpan(span);
      const isRootSpan = rootSpan === span;
      const msg = `[Tracing] Finishing "${op}" ${isRootSpan ? "root " : ""}span "${description}" with ID ${spanId}`;
      debug.log(msg);
    }

    function setMeasurement(name, value, unit, activeSpan = getActiveSpan()) {
      const rootSpan = activeSpan && getRootSpan(activeSpan);
      if (rootSpan) {
        DEBUG_BUILD$2 && debug.log(`[Measurement] Setting measurement on root span: ${name} = ${value} ${unit}`);
        rootSpan.addEvent(name, {
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: value,
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: unit
        });
      }
    }
    function timedEventsToMeasurements(events) {
      if (!events || events.length === 0) {
        return void 0;
      }
      const measurements = {};
      events.forEach((event) => {
        const attributes = event.attributes || {};
        const unit = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT];
        const value = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE];
        if (typeof unit === "string" && typeof value === "number") {
          measurements[event.name] = { value, unit };
        }
      });
      return measurements;
    }

    function getSegmentSpanCaptureStrategy() {
      return getSentryCarrier(getMainCarrier()).segmentSpanCaptureStrategy;
    }

    function hasSpanStreamingEnabled(client) {
      return client.getOptions().traceLifecycle === "stream";
    }

    const MAX_SPAN_COUNT = 1e3;
    class SentrySpan {
      /**
       * You should never call the constructor manually, always use `Sentry.startSpan()`
       * or other span methods.
       * @internal
       * @hideconstructor
       * @hidden
       */
      constructor(spanContext = {}) {
        this._traceId = spanContext.traceId || generateTraceId();
        this._spanId = spanContext.spanId || generateSpanId();
        this._startTime = spanContext.startTimestamp || timestampInSeconds();
        this._links = spanContext.links;
        this._attributes = {};
        this.setAttributes({
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "manual",
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: spanContext.op,
          ...spanContext.attributes
        });
        this._name = spanContext.name;
        if (spanContext.parentSpanId) {
          this._parentSpanId = spanContext.parentSpanId;
        }
        if ("sampled" in spanContext) {
          this._sampled = spanContext.sampled;
        }
        if (spanContext.endTimestamp) {
          this._endTime = spanContext.endTimestamp;
        }
        this._events = [];
        this._isStandaloneSpan = spanContext.isStandalone;
        if (this._endTime) {
          this._onSpanEnded();
        }
      }
      /** @inheritDoc */
      addLink(link) {
        if (this._frozen) {
          return this;
        }
        if (this._links) {
          this._links.push(link);
        } else {
          this._links = [link];
        }
        return this;
      }
      /** @inheritDoc */
      addLinks(links) {
        if (this._frozen) {
          return this;
        }
        if (this._links) {
          this._links.push(...links);
        } else {
          this._links = links;
        }
        return this;
      }
      /**
       * This should generally not be used,
       * but it is needed for being compliant with the OTEL Span interface.
       *
       * @hidden
       * @internal
       */
      recordException(_exception, _time) {
      }
      /** @inheritdoc */
      spanContext() {
        const { _spanId: spanId, _traceId: traceId, _sampled: sampled } = this;
        return {
          spanId,
          traceId,
          traceFlags: sampled ? TRACE_FLAG_SAMPLED : TRACE_FLAG_NONE
        };
      }
      /** @inheritdoc */
      setAttribute(key, value) {
        if (this._frozen) {
          return this;
        }
        if (value === void 0) {
          delete this._attributes[key];
        } else {
          this._attributes[key] = value;
        }
        if (key === SEMANTIC_ATTRIBUTE_SENTRY_SOURCE && value !== void 0 && spanShouldInferOtelSource(this)) {
          markSpanSourceAsExplicit(this);
        }
        return this;
      }
      /** @inheritdoc */
      setAttributes(attributes) {
        Object.keys(attributes).forEach((key) => this.setAttribute(key, attributes[key]));
        return this;
      }
      /**
       * This should generally not be used,
       * but we need it for browser tracing where we want to adjust the start time afterwards.
       * USE THIS WITH CAUTION!
       *
       * @hidden
       * @internal
       */
      updateStartTime(timeInput) {
        if (this._frozen) {
          return;
        }
        this._startTime = spanTimeInputToSeconds(timeInput);
      }
      /**
       * @inheritDoc
       */
      setStatus(value) {
        if (this._frozen) {
          return this;
        }
        this._status = value;
        return this;
      }
      /**
       * @inheritDoc
       */
      updateName(name) {
        if (this._frozen) {
          return this;
        }
        this._name = name;
        if (!spanShouldInferOtelSource(this)) {
          this.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "custom");
        }
        return this;
      }
      /** @inheritdoc */
      end(endTimestamp) {
        if (this._endTime) {
          this._frozen = spanIsTracerProviderSpan(this);
          return;
        }
        this._endTime = spanTimeInputToSeconds(endTimestamp);
        logSpanEnd(this);
        this._onSpanEnded();
        this._frozen = spanIsTracerProviderSpan(this);
      }
      /**
       * Get JSON representation of this span.
       *
       * @hidden
       * @internal This method is purely for internal purposes and should not be used outside
       * of SDK code. If you need to get a JSON representation of a span,
       * use `spanToJSON(span)` instead.
       */
      getSpanJSON() {
        return {
          data: this._attributes,
          description: this._name,
          op: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
          parent_span_id: this._parentSpanId,
          span_id: this._spanId,
          start_timestamp: this._startTime,
          status: getStatusMessage(this._status),
          timestamp: this._endTime,
          trace_id: this._traceId,
          origin: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
          profile_id: this._attributes[SEMANTIC_ATTRIBUTE_PROFILE_ID],
          exclusive_time: this._attributes[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
          measurements: timedEventsToMeasurements(this._events),
          is_segment: this._isStandaloneSpan && getRootSpan(this) === this || void 0,
          segment_id: this._isStandaloneSpan ? getRootSpan(this).spanContext().spanId : void 0,
          links: convertSpanLinksForEnvelope(this._links)
        };
      }
      /**
       * Get {@link StreamedSpanJSON} representation of this span.
       *
       * @hidden
       * @internal This method is purely for internal purposes and should not be used outside
       * of SDK code. If you need to get a JSON representation of a span,
       * use `spanToStreamedSpanJSON(span)` instead.
       */
      getStreamedSpanJSON() {
        return {
          name: this._name ?? "",
          span_id: this._spanId,
          trace_id: this._traceId,
          parent_span_id: this._parentSpanId,
          start_timestamp: this._startTime,
          // just in case _endTime is not set, we use the start time (i.e. duration 0)
          end_timestamp: this._endTime ?? this._startTime,
          is_segment: this._isStandaloneSpan || this === getRootSpan(this),
          status: getSimpleStatus(this._status),
          attributes: addStatusMessageAttribute(this._attributes, this._status),
          links: getStreamedSpanLinks(this._links)
        };
      }
      /** @inheritdoc */
      isRecording() {
        return !this._endTime && !!this._sampled;
      }
      /**
       * @inheritdoc
       */
      addEvent(name, attributesOrStartTime, startTime) {
        if (this._frozen) {
          return this;
        }
        DEBUG_BUILD$2 && debug.log("[Tracing] Adding an event to span:", name);
        const time = isSpanTimeInput(attributesOrStartTime) ? attributesOrStartTime : startTime || timestampInSeconds();
        const attributes = isSpanTimeInput(attributesOrStartTime) ? {} : attributesOrStartTime || {};
        const event = {
          name,
          time: spanTimeInputToSeconds(time),
          attributes
        };
        this._events.push(event);
        return this;
      }
      /**
       * This method should generally not be used,
       * but for now we need a way to publicly check if the `_isStandaloneSpan` flag is set.
       * USE THIS WITH CAUTION!
       * @internal
       * @hidden
       * @experimental
       */
      isStandaloneSpan() {
        return !!this._isStandaloneSpan;
      }
      /** Emit `spanEnd` when the span is ended. */
      _onSpanEnded() {
        const client = getClient();
        if (client) {
          client.emit("spanEnd", this);
          if (!this._isStandaloneSpan) {
            client.emit("afterSpanEnd", this);
          }
        }
        const rootSpan = getRootSpan(this);
        const isSegmentSpan = this._isStandaloneSpan || this === rootSpan;
        if (this._isStandaloneSpan) {
          if (this._sampled) {
            sendSpanEnvelope(createSpanEnvelope([this], client));
          } else {
            DEBUG_BUILD$2 && debug.log("[Tracing] Discarding standalone span because its trace was not chosen to be sampled.");
            if (client) {
              client.recordDroppedEvent("sample_rate", "span");
            }
          }
          return;
        }
        if (!isSegmentSpan) {
          const strategy2 = getSegmentSpanCaptureStrategy();
          if (strategy2) {
            const scope2 = getCapturedScopesOnSpan(this).scope || getCurrentScope();
            strategy2.onChildSpanEnded(this, rootSpan, (options) => this._convertSpanToTransaction(options), scope2);
          }
          return;
        }
        if (client && hasSpanStreamingEnabled(client)) {
          client.emit("afterSegmentSpanEnd", this);
          return;
        }
        const scope = getCapturedScopesOnSpan(this).scope || getCurrentScope();
        const strategy = getSegmentSpanCaptureStrategy();
        if (strategy) {
          strategy.onSegmentSpanEnded((options) => this._convertSpanToTransaction(options), scope);
        } else {
          const transactionEvent = this._convertSpanToTransaction();
          if (transactionEvent) {
            scope.captureEvent(transactionEvent);
          }
        }
      }
      /**
       * Finish the transaction & prepare the event to send to Sentry.
       */
      _convertSpanToTransaction(options = {}) {
        if (!isFullFinishedSpan(spanToJSON(this))) {
          return void 0;
        }
        if (!this._name) {
          DEBUG_BUILD$2 && debug.warn("Transaction has no name, falling back to `<unlabeled transaction>`.");
          this._name = "<unlabeled transaction>";
        }
        const { scope: capturedSpanScope, isolationScope: capturedSpanIsolationScope } = getCapturedScopesOnSpan(this);
        const normalizedRequest = capturedSpanScope?.getScopeData().sdkProcessingMetadata?.normalizedRequest;
        if (this._sampled !== true) {
          return void 0;
        }
        options.onSpanCaptured?.(this);
        const spans = [];
        for (const descendant of getSpanDescendants(this)) {
          if (descendant === this || isStandaloneSpan(descendant) || options.isSpanAlreadyCaptured?.(descendant)) {
            continue;
          }
          const spanJSON = spanToJSON(descendant);
          if (!isFullFinishedSpan(spanJSON)) {
            continue;
          }
          options.onSpanCaptured?.(descendant);
          spans.push(spanJSON);
        }
        const source = this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
        delete this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
        let hasGenAiSpans = false;
        spans.forEach((span) => {
          delete span.data[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
          if (span.op?.startsWith("gen_ai.")) {
            hasGenAiSpans = true;
          }
        });
        const transaction = {
          contexts: {
            trace: spanToTransactionTraceContext(this)
          },
          spans: (
            // spans.sort() mutates the array, but `spans` is already a copy so we can safely do this here
            // we do not use spans anymore after this point
            spans.length > MAX_SPAN_COUNT ? spans.sort((a, b) => a.start_timestamp - b.start_timestamp).slice(0, MAX_SPAN_COUNT) : spans
          ),
          start_timestamp: this._startTime,
          timestamp: this._endTime,
          transaction: this._name,
          type: "transaction",
          sdkProcessingMetadata: {
            capturedSpanScope,
            capturedSpanIsolationScope,
            dynamicSamplingContext: getDynamicSamplingContextFromSpan(this),
            hasGenAiSpans
          },
          request: normalizedRequest,
          ...source && {
            transaction_info: {
              source
            }
          }
        };
        const measurements = timedEventsToMeasurements(this._events);
        const hasMeasurements = measurements && Object.keys(measurements).length;
        if (hasMeasurements) {
          DEBUG_BUILD$2 && debug.log(
            "[Measurements] Adding measurements to transaction event",
            JSON.stringify(measurements, void 0, 2)
          );
          transaction.measurements = measurements;
        }
        return transaction;
      }
    }
    function isSpanTimeInput(value) {
      return value && typeof value === "number" || value instanceof Date || Array.isArray(value);
    }
    function isFullFinishedSpan(input) {
      return !!input.start_timestamp && !!input.timestamp && !!input.span_id && !!input.trace_id;
    }
    function isStandaloneSpan(span) {
      return span instanceof SentrySpan && span.isStandaloneSpan();
    }
    function sendSpanEnvelope(envelope) {
      const client = getClient();
      if (!client) {
        return;
      }
      const spanItems = envelope[1];
      if (!spanItems || spanItems.length === 0) {
        client.recordDroppedEvent("before_send", "span");
        return;
      }
      client.sendEnvelope(envelope);
    }

    function sampleSpan(options, samplingContext, sampleRand) {
      if (!hasSpansEnabled(options)) {
        return [false];
      }
      let localSampleRateWasApplied = void 0;
      let sampleRate;
      if (typeof options.tracesSampler === "function") {
        sampleRate = options.tracesSampler({
          ...samplingContext,
          inheritOrSampleWith: (fallbackSampleRate) => {
            if (typeof samplingContext.parentSampleRate === "number") {
              return samplingContext.parentSampleRate;
            }
            if (typeof samplingContext.parentSampled === "boolean") {
              return Number(samplingContext.parentSampled);
            }
            return fallbackSampleRate;
          }
        });
        localSampleRateWasApplied = true;
      } else if (samplingContext.parentSampled !== void 0) {
        sampleRate = samplingContext.parentSampled;
      } else if (typeof options.tracesSampleRate !== "undefined") {
        sampleRate = options.tracesSampleRate;
        localSampleRateWasApplied = true;
      }
      const parsedSampleRate = parseSampleRate(sampleRate);
      if (parsedSampleRate === void 0) {
        DEBUG_BUILD$2 && debug.warn(
          `[Tracing] Discarding root span because of invalid sample rate. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(
        sampleRate
      )} of type ${JSON.stringify(typeof sampleRate)}.`
        );
        return [false];
      }
      if (!parsedSampleRate) {
        DEBUG_BUILD$2 && debug.log(
          `[Tracing] Discarding transaction because ${typeof options.tracesSampler === "function" ? "tracesSampler returned 0 or false" : "a negative sampling decision was inherited or tracesSampleRate is set to 0"}`
        );
        return [false, parsedSampleRate, localSampleRateWasApplied];
      }
      const shouldSample = sampleRand < parsedSampleRate;
      if (!shouldSample) {
        DEBUG_BUILD$2 && debug.log(
          `[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = ${Number(
        sampleRate
      )})`
        );
      }
      return [shouldSample, parsedSampleRate, localSampleRateWasApplied];
    }

    const SUPPRESS_TRACING_KEY = "__SENTRY_SUPPRESS_TRACING__";
    function startInactiveSpan(options) {
      const acs = getAcs();
      if (acs.startInactiveSpan) {
        return acs.startInactiveSpan(options);
      }
      return _startInactiveSpanImpl(options);
    }
    function _startInactiveSpanImpl(options) {
      const spanArguments = parseSentrySpanArguments(options);
      const { forceTransaction, parentSpan: customParentSpan } = options;
      const wrapper = options.scope ? (callback) => withScope(options.scope, callback) : customParentSpan !== void 0 ? (callback) => withActiveSpan(customParentSpan, callback) : (callback) => callback();
      return wrapper(() => {
        const scope = getCurrentScope();
        const parentSpan = getParentSpan(scope, customParentSpan);
        const client = getClient();
        const missingRequiredParent = options.onlyIfParent && !parentSpan;
        if (missingRequiredParent) {
          return startMissingRequiredParentSpan(scope, client);
        }
        return createChildOrRootSpan({
          parentSpan,
          spanArguments,
          forceTransaction,
          scope
        });
      });
    }
    function withActiveSpan(span, callback) {
      const acs = getAcs();
      if (acs.withActiveSpan) {
        return acs.withActiveSpan(span, callback);
      }
      return withScope((scope) => {
        _setSpanForScope(scope, span || void 0);
        return callback(scope);
      });
    }
    function isTracingSuppressed(scope = getCurrentScope()) {
      const acs = getAcs();
      if (acs.isTracingSuppressed) {
        return acs.isTracingSuppressed(scope);
      }
      return scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY] === true;
    }
    function startMissingRequiredParentSpan(scope, client) {
      client?.recordDroppedEvent("no_parent_span", "span");
      const span = new SentryNonRecordingSpan({ traceId: scope.getPropagationContext().traceId });
      setCapturedScopesOnSpan(span, scope, getIsolationScope());
      return span;
    }
    function createChildOrRootSpan({
      parentSpan,
      spanArguments,
      forceTransaction,
      scope
    }) {
      const isolationScope = getIsolationScope();
      if (!hasSpansEnabled()) {
        const scopePropagationContext = scope.getPropagationContext();
        const traceId = parentSpan ? parentSpan.spanContext().traceId : scopePropagationContext.traceId;
        const span2 = new SentryNonRecordingSpan({ traceId });
        if (parentSpan && !forceTransaction) {
          addChildSpanToSpan(parentSpan, span2);
        }
        setCapturedScopesOnSpan(span2, scope, isolationScope);
        return span2;
      }
      const client = getClient();
      if (_shouldIgnoreStreamedSpan(client, spanArguments)) {
        if (!isTracingSuppressed(scope)) {
          client?.recordDroppedEvent("ignored", "span");
        }
        const ignoredSpan = new SentryNonRecordingSpan({
          dropReason: "ignored",
          traceId: parentSpan?.spanContext().traceId ?? scope.getPropagationContext().traceId
        });
        if (parentSpan && !forceTransaction) {
          addChildSpanToSpan(parentSpan, ignoredSpan);
        }
        setCapturedScopesOnSpan(ignoredSpan, scope, isolationScope);
        return ignoredSpan;
      }
      let span;
      if (parentSpan && !forceTransaction) {
        span = _startChildSpan(parentSpan, scope, spanArguments, isolationScope);
        addChildSpanToSpan(parentSpan, span);
      } else if (parentSpan) {
        const dsc = getDynamicSamplingContextFromSpan(parentSpan);
        const { traceId, spanId: parentSpanId } = parentSpan.spanContext();
        const parentSampled = spanIsSampled(parentSpan);
        span = _startRootSpan(
          {
            traceId,
            parentSpanId,
            ...spanArguments
          },
          scope,
          isolationScope,
          parentSampled
        );
        freezeDscOnSpan(span, dsc);
      } else {
        const { traceId, dsc, parentSpanId, sampled: parentSampled } = scope.getPropagationContext();
        span = _startRootSpan(
          {
            traceId,
            parentSpanId,
            ...spanArguments
          },
          scope,
          isolationScope,
          parentSampled
        );
        if (dsc) {
          freezeDscOnSpan(span, dsc);
        }
      }
      logSpanStart(span);
      return span;
    }
    function parseSentrySpanArguments(options) {
      const exp = options.experimental || {};
      const initialCtx = {
        isStandalone: exp.standalone,
        ...options
      };
      if (options.startTime) {
        const ctx = { ...initialCtx };
        ctx.startTimestamp = spanTimeInputToSeconds(options.startTime);
        delete ctx.startTime;
        return ctx;
      }
      return initialCtx;
    }
    function getAcs() {
      const carrier = getMainCarrier();
      return getAsyncContextStrategy(carrier);
    }
    function _startRootSpan(spanArguments, scope, isolationScope, parentSampled) {
      const client = getClient();
      const options = client?.getOptions() || {};
      const { name = "" } = spanArguments;
      const mutableSpanSamplingData = { spanAttributes: { ...spanArguments.attributes }, spanName: name, parentSampled };
      client?.emit("beforeSampling", mutableSpanSamplingData, { decision: false });
      const finalParentSampled = mutableSpanSamplingData.parentSampled ?? parentSampled;
      const finalAttributes = mutableSpanSamplingData.spanAttributes;
      const currentPropagationContext = scope.getPropagationContext();
      const _isTracingSuppressed = isTracingSuppressed(scope);
      const [sampled, sampleRate, localSampleRateWasApplied] = _isTracingSuppressed ? [false] : sampleSpan(
        options,
        {
          name,
          parentSampled: finalParentSampled,
          attributes: finalAttributes,
          normalizedRequest: isolationScope.getScopeData().sdkProcessingMetadata.normalizedRequest,
          parentSampleRate: parseSampleRate(currentPropagationContext.dsc?.sample_rate)
        },
        currentPropagationContext.sampleRand
      );
      const rootSpan = new SentrySpan({
        ...spanArguments,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "custom",
          [SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE]: sampleRate !== void 0 && localSampleRateWasApplied ? sampleRate : void 0,
          ...finalAttributes
        },
        sampled
      });
      if (!sampled && client && !_isTracingSuppressed) {
        DEBUG_BUILD$2 && debug.log("[Tracing] Discarding root span because its trace was not chosen to be sampled.");
        client.recordDroppedEvent("sample_rate", hasSpanStreamingEnabled(client) ? "span" : "transaction");
      }
      setCapturedScopesOnSpan(rootSpan, scope, isolationScope);
      if (client) {
        client.emit("spanStart", rootSpan);
      }
      return rootSpan;
    }
    function _startChildSpan(parentSpan, scope, spanArguments, isolationScope) {
      const { spanId, traceId } = parentSpan.spanContext();
      const _isTracingSuppressed = isTracingSuppressed(scope);
      const sampled = _isTracingSuppressed ? false : spanIsSampled(parentSpan);
      const childSpan = sampled ? new SentrySpan({
        ...spanArguments,
        parentSpanId: spanId,
        traceId,
        sampled
      }) : new SentryNonRecordingSpan({ traceId });
      addChildSpanToSpan(parentSpan, childSpan);
      setCapturedScopesOnSpan(childSpan, scope, isolationScope);
      const client = getClient();
      if (!client) {
        return childSpan;
      }
      if (hasSpanStreamingEnabled(client) && spanIsNonRecordingSpan(childSpan)) {
        if (spanIsNonRecordingSpan(parentSpan) && parentSpan.dropReason) {
          childSpan.dropReason = parentSpan.dropReason;
          client.recordDroppedEvent(parentSpan.dropReason, "span");
        } else if (!_isTracingSuppressed) {
          childSpan.dropReason = "sample_rate";
          client.recordDroppedEvent("sample_rate", "span");
        }
      }
      client.emit("spanStart", childSpan);
      if (spanArguments.endTimestamp) {
        client.emit("spanEnd", childSpan);
        client.emit("afterSpanEnd", childSpan);
      }
      return childSpan;
    }
    function getParentSpan(scope, customParentSpan) {
      if (customParentSpan) {
        return customParentSpan;
      }
      if (customParentSpan === null) {
        return void 0;
      }
      const span = _getSpanForScope(scope);
      if (!span) {
        return void 0;
      }
      const client = getClient();
      const options = client ? client.getOptions() : {};
      if (options.parentSpanIsAlwaysRootSpan) {
        return getRootSpan(span);
      }
      return span;
    }
    function _shouldIgnoreStreamedSpan(client, spanArguments) {
      const ignoreSpans = client?.getOptions().ignoreSpans;
      if (!client || !hasSpanStreamingEnabled(client) || !ignoreSpans?.length) {
        return false;
      }
      return shouldIgnoreSpan(
        {
          description: spanArguments.name || "",
          op: spanArguments.attributes?.[SEMANTIC_ATTRIBUTE_SENTRY_OP] || spanArguments.op,
          attributes: spanArguments.attributes
        },
        ignoreSpans
      );
    }
    function spanIsIgnored(span) {
      return spanIsNonRecordingSpan(span) && span.dropReason === "ignored";
    }

    const TRACING_DEFAULTS = {
      idleTimeout: 1e3,
      finalTimeout: 3e4,
      childSpanTimeout: 15e3
    };
    const FINISH_REASON_HEARTBEAT_FAILED = "heartbeatFailed";
    const FINISH_REASON_IDLE_TIMEOUT = "idleTimeout";
    const FINISH_REASON_FINAL_TIMEOUT = "finalTimeout";
    const FINISH_REASON_EXTERNAL_FINISH = "externalFinish";
    function startIdleSpan(startSpanOptions, options = {}) {
      const activities = /* @__PURE__ */ new Map();
      let _finished = false;
      let _idleTimeoutID;
      let _childSpanTimeoutID;
      let _finishReason = FINISH_REASON_EXTERNAL_FINISH;
      let _autoFinishAllowed = !options.disableAutoFinish;
      const _cleanupHooks = [];
      const {
        idleTimeout = TRACING_DEFAULTS.idleTimeout,
        finalTimeout = TRACING_DEFAULTS.finalTimeout,
        childSpanTimeout = TRACING_DEFAULTS.childSpanTimeout,
        beforeSpanEnd,
        trimIdleSpanEndTimestamp = true
      } = options;
      const client = getClient();
      const scope = getCurrentScope();
      if (!client || !hasSpansEnabled()) {
        const span2 = new SentryNonRecordingSpan({ traceId: scope.getPropagationContext().traceId });
        setCapturedScopesOnSpan(span2, scope, getIsolationScope());
        return span2;
      }
      const previousActiveSpan = getActiveSpan();
      const span = _startIdleSpan(startSpanOptions);
      span.end = new Proxy(span.end, {
        apply(target, thisArg, args) {
          if (beforeSpanEnd) {
            beforeSpanEnd(span);
          }
          if (spanIsNonRecordingSpan(thisArg)) {
            return;
          }
          const [definedEndTimestamp, ...rest] = args;
          const timestamp = definedEndTimestamp || timestampInSeconds();
          const spanEndTimestamp = spanTimeInputToSeconds(timestamp);
          const spans = getSpanDescendants(span).filter((child) => child !== span);
          const spanJson = spanToJSON(span);
          if (!spans.length || !trimIdleSpanEndTimestamp) {
            onIdleSpanEnded(spanEndTimestamp);
            return Reflect.apply(target, thisArg, [spanEndTimestamp, ...rest]);
          }
          const ignoreSpans = client.getOptions().ignoreSpans;
          const latestSpanEndTimestamp = spans?.reduce((acc, current) => {
            const currentSpanJson = spanToJSON(current);
            if (!currentSpanJson.timestamp) {
              return acc;
            }
            if (ignoreSpans && shouldIgnoreSpan(
              { description: currentSpanJson.description, op: currentSpanJson.op, attributes: currentSpanJson.data },
              ignoreSpans
            )) {
              return acc;
            }
            return acc ? Math.max(acc, currentSpanJson.timestamp) : currentSpanJson.timestamp;
          }, void 0);
          const spanStartTimestamp = spanJson.start_timestamp;
          const endTimestamp = Math.min(
            spanStartTimestamp ? spanStartTimestamp + finalTimeout / 1e3 : Infinity,
            Math.max(spanStartTimestamp || -Infinity, Math.min(spanEndTimestamp, latestSpanEndTimestamp || Infinity))
          );
          onIdleSpanEnded(endTimestamp);
          return Reflect.apply(target, thisArg, [endTimestamp, ...rest]);
        }
      });
      function _cancelIdleTimeout() {
        if (_idleTimeoutID) {
          clearTimeout(_idleTimeoutID);
          _idleTimeoutID = void 0;
        }
      }
      function _cancelChildSpanTimeout() {
        if (_childSpanTimeoutID) {
          clearTimeout(_childSpanTimeoutID);
          _childSpanTimeoutID = void 0;
        }
      }
      function _restartIdleTimeout(endTimestamp) {
        _cancelIdleTimeout();
        _idleTimeoutID = setTimeout(() => {
          if (!_finished && activities.size === 0 && _autoFinishAllowed) {
            _finishReason = FINISH_REASON_IDLE_TIMEOUT;
            span.end(endTimestamp);
          }
        }, idleTimeout);
      }
      function _restartChildSpanTimeout(endTimestamp) {
        _cancelChildSpanTimeout();
        _childSpanTimeoutID = setTimeout(() => {
          if (!_finished && _autoFinishAllowed) {
            _finishReason = FINISH_REASON_HEARTBEAT_FAILED;
            span.end(endTimestamp);
          }
        }, childSpanTimeout);
      }
      function _pushActivity(spanId) {
        _cancelIdleTimeout();
        activities.set(spanId, true);
        const endTimestamp = timestampInSeconds();
        _restartChildSpanTimeout(endTimestamp + childSpanTimeout / 1e3);
      }
      function _popActivity(spanId) {
        if (activities.has(spanId)) {
          activities.delete(spanId);
        }
        if (activities.size === 0) {
          const endTimestamp = timestampInSeconds();
          _restartIdleTimeout(endTimestamp + idleTimeout / 1e3);
          _cancelChildSpanTimeout();
        }
      }
      function onIdleSpanEnded(endTimestamp) {
        _finished = true;
        activities.clear();
        _cleanupHooks.forEach((cleanup) => cleanup());
        _setSpanForScope(scope, previousActiveSpan);
        const spanJSON = spanToJSON(span);
        const { start_timestamp: startTimestamp } = spanJSON;
        if (!startTimestamp) {
          return;
        }
        const attributes = spanJSON.data;
        if (!attributes[SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON]) {
          span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, _finishReason);
        }
        const currentStatus = spanJSON.status;
        if (!currentStatus || currentStatus === "unknown") {
          span.setStatus({ code: SPAN_STATUS_OK });
        }
        debug.log(`[Tracing] Idle span "${spanJSON.op}" finished`);
        const childSpans = getSpanDescendants(span).filter((child) => child !== span);
        let discardedSpans = 0;
        childSpans.forEach((childSpan) => {
          if (childSpan.isRecording()) {
            childSpan.setStatus({ code: SPAN_STATUS_ERROR, message: "cancelled" });
            childSpan.end(endTimestamp);
            DEBUG_BUILD$2 && debug.log("[Tracing] Cancelling span since span ended early", JSON.stringify(childSpan, void 0, 2));
          }
          const childSpanJSON = spanToJSON(childSpan);
          const { timestamp: childEndTimestamp = 0, start_timestamp: childStartTimestamp = 0 } = childSpanJSON;
          const spanStartedBeforeIdleSpanEnd = childStartTimestamp <= endTimestamp;
          const timeoutWithMarginOfError = (finalTimeout + idleTimeout) / 1e3;
          const spanEndedBeforeFinalTimeout = childEndTimestamp - childStartTimestamp <= timeoutWithMarginOfError;
          if (DEBUG_BUILD$2) {
            const stringifiedSpan = JSON.stringify(childSpan, void 0, 2);
            if (!spanStartedBeforeIdleSpanEnd) {
              debug.log("[Tracing] Discarding span since it happened after idle span was finished", stringifiedSpan);
            } else if (!spanEndedBeforeFinalTimeout) {
              debug.log("[Tracing] Discarding span since it finished after idle span final timeout", stringifiedSpan);
            }
          }
          if (!spanEndedBeforeFinalTimeout || !spanStartedBeforeIdleSpanEnd) {
            removeChildSpanFromSpan(span, childSpan);
            discardedSpans++;
          }
        });
        if (discardedSpans > 0) {
          span.setAttribute("sentry.idle_span_discarded_spans", discardedSpans);
        }
      }
      _cleanupHooks.push(
        client.on("spanStart", (startedSpan) => {
          if (_finished || startedSpan === span || !!spanToJSON(startedSpan).timestamp || startedSpan instanceof SentrySpan && startedSpan.isStandaloneSpan()) {
            return;
          }
          const allSpans = getSpanDescendants(span);
          if (allSpans.includes(startedSpan)) {
            _pushActivity(startedSpan.spanContext().spanId);
          }
        })
      );
      _cleanupHooks.push(
        client.on("spanEnd", (endedSpan) => {
          if (_finished) {
            return;
          }
          _popActivity(endedSpan.spanContext().spanId);
        })
      );
      _cleanupHooks.push(
        client.on("idleSpanEnableAutoFinish", (spanToAllowAutoFinish) => {
          if (spanToAllowAutoFinish === span) {
            _autoFinishAllowed = true;
            _restartIdleTimeout();
            if (activities.size) {
              _restartChildSpanTimeout();
            }
          }
        })
      );
      if (!options.disableAutoFinish) {
        _restartIdleTimeout();
      }
      setTimeout(() => {
        if (!_finished) {
          span.setStatus({ code: SPAN_STATUS_ERROR, message: "deadline_exceeded" });
          _finishReason = FINISH_REASON_FINAL_TIMEOUT;
          span.end();
        }
      }, finalTimeout);
      return span;
    }
    function _startIdleSpan(options) {
      const span = startInactiveSpan(options);
      _setSpanForScope(getCurrentScope(), span);
      DEBUG_BUILD$2 && debug.log("[Tracing] Started span is an idle span");
      return span;
    }

    function applyScopeDataToEvent(event, data) {
      const { fingerprint, span, breadcrumbs, sdkProcessingMetadata } = data;
      applyDataToEvent(event, data);
      if (span) {
        applySpanToEvent(event, span);
      }
      applyFingerprintToEvent(event, fingerprint);
      applyBreadcrumbsToEvent(event, breadcrumbs);
      applySdkMetadataToEvent(event, sdkProcessingMetadata);
    }
    function mergeScopeData(data, mergeData) {
      const {
        extra,
        tags,
        attributes,
        user,
        contexts,
        level,
        sdkProcessingMetadata,
        breadcrumbs,
        fingerprint,
        eventProcessors,
        attachments,
        propagationContext,
        transactionName,
        span
      } = mergeData;
      mergeAndOverwriteScopeData(data, "extra", extra);
      mergeAndOverwriteScopeData(data, "tags", tags);
      mergeAndOverwriteScopeData(data, "attributes", attributes);
      mergeAndOverwriteScopeData(data, "user", user);
      mergeAndOverwriteScopeData(data, "contexts", contexts);
      data.sdkProcessingMetadata = merge(data.sdkProcessingMetadata, sdkProcessingMetadata, 2);
      if (level) {
        data.level = level;
      }
      if (transactionName) {
        data.transactionName = transactionName;
      }
      if (span) {
        data.span = span;
      }
      if (breadcrumbs.length) {
        data.breadcrumbs = [...data.breadcrumbs, ...breadcrumbs];
      }
      if (fingerprint.length) {
        data.fingerprint = [...data.fingerprint, ...fingerprint];
      }
      if (eventProcessors.length) {
        data.eventProcessors = [...data.eventProcessors, ...eventProcessors];
      }
      if (attachments.length) {
        data.attachments = [...data.attachments, ...attachments];
      }
      data.propagationContext = { ...data.propagationContext, ...propagationContext };
    }
    function mergeAndOverwriteScopeData(data, prop, mergeVal) {
      data[prop] = merge(data[prop], mergeVal, 1);
    }
    function getCombinedScopeData(isolationScope, currentScope) {
      const scopeData = getGlobalScope().getScopeData();
      isolationScope && mergeScopeData(scopeData, isolationScope.getScopeData());
      currentScope && mergeScopeData(scopeData, currentScope.getScopeData());
      return scopeData;
    }
    function applyDataToEvent(event, data) {
      const { extra, tags, user, contexts, level, transactionName } = data;
      if (Object.keys(extra).length) {
        event.extra = { ...extra, ...event.extra };
      }
      if (Object.keys(tags).length) {
        event.tags = { ...tags, ...event.tags };
      }
      if (Object.keys(user).length) {
        event.user = { ...user, ...event.user };
      }
      if (Object.keys(contexts).length) {
        event.contexts = { ...contexts, ...event.contexts };
      }
      if (level) {
        event.level = level;
      }
      if (transactionName && event.type !== "transaction") {
        event.transaction = transactionName;
      }
    }
    function applyBreadcrumbsToEvent(event, breadcrumbs) {
      const mergedBreadcrumbs = [...event.breadcrumbs || [], ...breadcrumbs];
      event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : void 0;
    }
    function applySdkMetadataToEvent(event, sdkProcessingMetadata) {
      event.sdkProcessingMetadata = {
        ...event.sdkProcessingMetadata,
        ...sdkProcessingMetadata
      };
    }
    function applySpanToEvent(event, span) {
      event.contexts = {
        trace: spanToTraceContext(span),
        ...event.contexts
      };
      event.sdkProcessingMetadata = {
        dynamicSamplingContext: getDynamicSamplingContextFromSpan(span),
        ...event.sdkProcessingMetadata
      };
      const rootSpan = getRootSpan(span);
      const transactionName = spanToJSON(rootSpan).description;
      if (transactionName && !event.transaction && event.type === "transaction") {
        event.transaction = transactionName;
      }
    }
    function applyFingerprintToEvent(event, fingerprint) {
      event.fingerprint = event.fingerprint ? Array.isArray(event.fingerprint) ? event.fingerprint : [event.fingerprint] : [];
      if (fingerprint) {
        event.fingerprint = event.fingerprint.concat(fingerprint);
      }
      if (!event.fingerprint.length) {
        delete event.fingerprint;
      }
    }

    const ts="http.request.header",ws="http.url",Sc="sentry.op",Lc="sentry.segment.name",Xc="sentry.transaction",Yu="url.full",Vu="url.path",Qu="user_agent.original";

    function safeSetSpanJSONAttributes(spanJSON, newAttributes) {
      const originalAttributes = spanJSON.attributes ?? (spanJSON.attributes = {});
      Object.entries(newAttributes).forEach(([key, value]) => {
        if (value != null && !(key in originalAttributes)) {
          originalAttributes[key] = value;
        }
      });
    }

    const STATE_PENDING = 0;
    const STATE_RESOLVED = 1;
    const STATE_REJECTED = 2;
    function resolvedSyncPromise(value) {
      return new SyncPromise((resolve) => {
        resolve(value);
      });
    }
    function rejectedSyncPromise(reason) {
      return new SyncPromise((_, reject) => {
        reject(reason);
      });
    }
    class SyncPromise {
      constructor(executor) {
        this._state = STATE_PENDING;
        this._handlers = [];
        this._runExecutor(executor);
      }
      /** @inheritdoc */
      then(onfulfilled, onrejected) {
        return new SyncPromise((resolve, reject) => {
          this._handlers.push([
            false,
            (result) => {
              if (!onfulfilled) {
                resolve(result);
              } else {
                try {
                  resolve(onfulfilled(result));
                } catch (e) {
                  reject(e);
                }
              }
            },
            (reason) => {
              if (!onrejected) {
                reject(reason);
              } else {
                try {
                  resolve(onrejected(reason));
                } catch (e) {
                  reject(e);
                }
              }
            }
          ]);
          this._executeHandlers();
        });
      }
      /** @inheritdoc */
      catch(onrejected) {
        return this.then((val) => val, onrejected);
      }
      /** @inheritdoc */
      finally(onfinally) {
        return new SyncPromise((resolve, reject) => {
          let val;
          let isRejected;
          return this.then(
            (value) => {
              isRejected = false;
              val = value;
              if (onfinally) {
                onfinally();
              }
            },
            (reason) => {
              isRejected = true;
              val = reason;
              if (onfinally) {
                onfinally();
              }
            }
          ).then(() => {
            if (isRejected) {
              reject(val);
              return;
            }
            resolve(val);
          });
        });
      }
      /** Excute the resolve/reject handlers. */
      _executeHandlers() {
        if (this._state === STATE_PENDING) {
          return;
        }
        const cachedHandlers = this._handlers.slice();
        this._handlers = [];
        cachedHandlers.forEach((handler) => {
          if (handler[0]) {
            return;
          }
          if (this._state === STATE_RESOLVED) {
            handler[1](this._value);
          }
          if (this._state === STATE_REJECTED) {
            handler[2](this._value);
          }
          handler[0] = true;
        });
      }
      /** Run the executor for the SyncPromise. */
      _runExecutor(executor) {
        const setResult = (state, value) => {
          if (this._state !== STATE_PENDING) {
            return;
          }
          if (isThenable(value)) {
            void value.then(resolve, reject);
            return;
          }
          this._state = state;
          this._value = value;
          this._executeHandlers();
        };
        const resolve = (value) => {
          setResult(STATE_RESOLVED, value);
        };
        const reject = (reason) => {
          setResult(STATE_REJECTED, reason);
        };
        try {
          executor(resolve, reject);
        } catch (e) {
          reject(e);
        }
      }
    }

    function notifyEventProcessors(processors, event, hint, index = 0) {
      try {
        const result = _notifyEventProcessors(event, hint, processors, index);
        return isThenable(result) ? result : resolvedSyncPromise(result);
      } catch (error) {
        return rejectedSyncPromise(error);
      }
    }
    function _notifyEventProcessors(event, hint, processors, index) {
      const processor = processors[index];
      if (!event || !processor) {
        return event;
      }
      const result = processor({ ...event }, hint);
      DEBUG_BUILD$2 && result === null && debug.log(`Event processor "${processor.id || "?"}" dropped event`);
      if (isThenable(result)) {
        return result.then((final) => _notifyEventProcessors(final, hint, processors, index + 1));
      }
      return _notifyEventProcessors(result, hint, processors, index + 1);
    }

    let parsedStackResults;
    let lastSentryKeysCount;
    let lastNativeKeysCount;
    let cachedFilenameDebugIds;
    function getFilenameToDebugIdMap(stackParser) {
      const sentryDebugIdMap = GLOBAL_OBJ._sentryDebugIds;
      const nativeDebugIdMap = GLOBAL_OBJ._debugIds;
      if (!sentryDebugIdMap && !nativeDebugIdMap) {
        return {};
      }
      const sentryDebugIdKeys = sentryDebugIdMap ? Object.keys(sentryDebugIdMap) : [];
      const nativeDebugIdKeys = nativeDebugIdMap ? Object.keys(nativeDebugIdMap) : [];
      if (cachedFilenameDebugIds && sentryDebugIdKeys.length === lastSentryKeysCount && nativeDebugIdKeys.length === lastNativeKeysCount) {
        return cachedFilenameDebugIds;
      }
      lastSentryKeysCount = sentryDebugIdKeys.length;
      lastNativeKeysCount = nativeDebugIdKeys.length;
      cachedFilenameDebugIds = {};
      if (!parsedStackResults) {
        parsedStackResults = {};
      }
      const processDebugIds = (debugIdKeys, debugIdMap) => {
        for (const key of debugIdKeys) {
          const debugId = debugIdMap[key];
          const result = parsedStackResults?.[key];
          if (result && cachedFilenameDebugIds && debugId) {
            cachedFilenameDebugIds[result[0]] = debugId;
            if (parsedStackResults) {
              parsedStackResults[key] = [result[0], debugId];
            }
          } else if (debugId) {
            const parsedStack = stackParser(key);
            for (let i = parsedStack.length - 1; i >= 0; i--) {
              const stackFrame = parsedStack[i];
              const filename = stackFrame?.filename;
              if (filename && cachedFilenameDebugIds && parsedStackResults) {
                cachedFilenameDebugIds[filename] = debugId;
                parsedStackResults[key] = [filename, debugId];
                break;
              }
            }
          }
        }
      };
      if (sentryDebugIdMap) {
        processDebugIds(sentryDebugIdKeys, sentryDebugIdMap);
      }
      if (nativeDebugIdMap) {
        processDebugIds(nativeDebugIdKeys, nativeDebugIdMap);
      }
      return cachedFilenameDebugIds;
    }

    function prepareEvent(options, event, hint, scope, client, isolationScope) {
      const { normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = options;
      const prepared = {
        ...event,
        event_id: event.event_id || hint.event_id || uuid4(),
        timestamp: event.timestamp || dateTimestampInSeconds()
      };
      const integrations = hint.integrations || options.integrations.map((i) => i.name);
      applyClientOptions(prepared, options);
      applyIntegrationsMetadata(prepared, integrations);
      if (client) {
        client.emit("applyFrameMetadata", event);
      }
      if (event.type === void 0) {
        applyDebugIds(prepared, options.stackParser);
      }
      const finalScope = getFinalScope(scope, hint.captureContext);
      if (hint.mechanism) {
        addExceptionMechanism(prepared, hint.mechanism);
      }
      const clientEventProcessors = client ? client.getEventProcessors() : [];
      const data = getCombinedScopeData(isolationScope, finalScope);
      const attachments = [...hint.attachments || [], ...data.attachments];
      if (attachments.length) {
        hint.attachments = attachments;
      }
      applyScopeDataToEvent(prepared, data);
      const eventProcessors = [
        ...clientEventProcessors,
        // Run scope event processors _after_ all other processors
        ...data.eventProcessors
      ];
      const isInternalException = hint.data && hint.data.__sentry__ === true;
      const result = isInternalException ? resolvedSyncPromise(prepared) : notifyEventProcessors(eventProcessors, prepared, hint);
      return result.then((evt) => {
        if (evt) {
          applyDebugMeta(evt);
        }
        if (typeof normalizeDepth === "number" && normalizeDepth > 0) {
          return normalizeEvent(evt, normalizeDepth, normalizeMaxBreadth);
        }
        return evt;
      });
    }
    function applyClientOptions(event, options) {
      const { environment, release, dist, maxValueLength } = options;
      event.environment = event.environment || environment || DEFAULT_ENVIRONMENT;
      if (!event.release && release) {
        event.release = release;
      }
      if (!event.dist && dist) {
        event.dist = dist;
      }
      const request = event.request;
      if (request?.url && maxValueLength) {
        request.url = truncate(request.url, maxValueLength);
      }
      if (maxValueLength) {
        event.exception?.values?.forEach((exception) => {
          if (exception.value) {
            exception.value = truncate(exception.value, maxValueLength);
          }
        });
      }
    }
    function applyDebugIds(event, stackParser) {
      const filenameDebugIdMap = getFilenameToDebugIdMap(stackParser);
      event.exception?.values?.forEach((exception) => {
        exception.stacktrace?.frames?.forEach((frame) => {
          if (frame.filename) {
            frame.debug_id = filenameDebugIdMap[frame.filename];
          }
        });
      });
    }
    function applyDebugMeta(event) {
      const filenameDebugIdMap = {};
      event.exception?.values?.forEach((exception) => {
        exception.stacktrace?.frames?.forEach((frame) => {
          if (frame.debug_id) {
            if (frame.abs_path) {
              filenameDebugIdMap[frame.abs_path] = frame.debug_id;
            } else if (frame.filename) {
              filenameDebugIdMap[frame.filename] = frame.debug_id;
            }
            delete frame.debug_id;
          }
        });
      });
      if (Object.keys(filenameDebugIdMap).length === 0) {
        return;
      }
      event.debug_meta = event.debug_meta || {};
      event.debug_meta.images = event.debug_meta.images || [];
      const images = event.debug_meta.images;
      Object.entries(filenameDebugIdMap).forEach(([filename, debug_id]) => {
        images.push({
          type: "sourcemap",
          code_file: filename,
          debug_id
        });
      });
    }
    function applyIntegrationsMetadata(event, integrationNames) {
      if (integrationNames.length > 0) {
        event.sdk = event.sdk || {};
        event.sdk.integrations = [...event.sdk.integrations || [], ...integrationNames];
      }
    }
    function normalizeEvent(event, depth, maxBreadth) {
      if (!event) {
        return null;
      }
      const normalized = {
        ...event,
        ...event.breadcrumbs && {
          breadcrumbs: event.breadcrumbs.map((b) => ({
            ...b,
            ...b.data && {
              data: normalize(b.data, depth, maxBreadth)
            }
          }))
        },
        ...event.user && {
          user: normalize(event.user, depth, maxBreadth)
        },
        ...event.contexts && {
          contexts: normalize(event.contexts, depth, maxBreadth)
        },
        ...event.extra && {
          extra: normalize(event.extra, depth, maxBreadth)
        }
      };
      if (event.contexts?.trace && normalized.contexts) {
        normalized.contexts.trace = event.contexts.trace;
        if (event.contexts.trace.data) {
          normalized.contexts.trace.data = normalize(event.contexts.trace.data, depth, maxBreadth);
        }
      }
      if (event.spans) {
        normalized.spans = event.spans.map((span) => {
          return {
            ...span,
            ...span.data && {
              data: normalize(span.data, depth, maxBreadth)
            }
          };
        });
      }
      if (event.contexts?.flags && normalized.contexts) {
        normalized.contexts.flags = normalize(event.contexts.flags, 3, maxBreadth);
      }
      return normalized;
    }
    function getFinalScope(scope, captureContext) {
      if (!captureContext) {
        return scope;
      }
      const finalScope = scope ? scope.clone() : new Scope();
      finalScope.update(captureContext);
      return finalScope;
    }
    function parseEventHintOrCaptureContext(hint) {
      {
        return void 0;
      }
    }

    function captureException(exception, hint) {
      return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext());
    }
    function captureEvent(event, hint) {
      return getCurrentScope().captureEvent(event, hint);
    }
    function isEnabled() {
      const client = getClient();
      return client?.getOptions().enabled !== false && !!client?.getTransport();
    }
    function startSession(context) {
      const isolationScope = getIsolationScope();
      const { user } = getCombinedScopeData(isolationScope, getCurrentScope());
      const { userAgent } = GLOBAL_OBJ.navigator || {};
      const session = makeSession({
        user,
        ...userAgent && { userAgent },
        ...context
      });
      const currentSession = isolationScope.getSession();
      if (currentSession?.status === "ok") {
        updateSession(currentSession, { status: "exited" });
      }
      endSession();
      isolationScope.setSession(session);
      return session;
    }
    function endSession() {
      const isolationScope = getIsolationScope();
      const currentScope = getCurrentScope();
      const session = currentScope.getSession() || isolationScope.getSession();
      if (session) {
        closeSession(session);
      }
      _sendSessionUpdate();
      isolationScope.setSession();
    }
    function _sendSessionUpdate() {
      const isolationScope = getIsolationScope();
      const client = getClient();
      const session = isolationScope.getSession();
      if (session && client) {
        client.captureSession(session);
      }
    }
    function captureSession(end = false) {
      if (end) {
        endSession();
        return;
      }
      _sendSessionUpdate();
    }

    function safeUnref(timer) {
      if (typeof timer === "object" && typeof timer.unref === "function") {
        timer.unref();
      }
      return timer;
    }

    const SENTRY_API_VERSION = "7";
    function getBaseApiEndpoint(dsn) {
      const protocol = dsn.protocol ? `${dsn.protocol}:` : "";
      const port = dsn.port ? `:${dsn.port}` : "";
      return `${protocol}//${dsn.host}${port}${dsn.path ? `/${dsn.path}` : ""}/api/`;
    }
    function _getIngestEndpoint(dsn) {
      return `${getBaseApiEndpoint(dsn)}${dsn.projectId}/envelope/`;
    }
    function _encodedAuth(dsn, sdkInfo) {
      const params = {
        sentry_version: SENTRY_API_VERSION
      };
      if (dsn.publicKey) {
        params.sentry_key = dsn.publicKey;
      }
      if (sdkInfo) {
        params.sentry_client = `${sdkInfo.name}/${sdkInfo.version}`;
      }
      return new URLSearchParams(params).toString();
    }
    function getEnvelopeEndpointWithUrlEncodedAuth(dsn, tunnel, sdkInfo) {
      return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuth(dsn, sdkInfo)}`;
    }

    const installedIntegrations = [];
    function filterDuplicates(integrations) {
      const integrationsByName = {};
      integrations.forEach((currentInstance) => {
        const { name } = currentInstance;
        const existingInstance = integrationsByName[name];
        if (existingInstance && !existingInstance.isDefaultInstance && currentInstance.isDefaultInstance) {
          return;
        }
        integrationsByName[name] = currentInstance;
      });
      return Object.values(integrationsByName);
    }
    function getIntegrationsToSetup(options) {
      const defaultIntegrations = options.defaultIntegrations || [];
      const userIntegrations = options.integrations;
      defaultIntegrations.forEach((integration) => {
        integration.isDefaultInstance = true;
      });
      let integrations;
      if (Array.isArray(userIntegrations)) {
        integrations = [...defaultIntegrations, ...userIntegrations];
      } else if (typeof userIntegrations === "function") {
        const resolvedUserIntegrations = userIntegrations(defaultIntegrations);
        integrations = Array.isArray(resolvedUserIntegrations) ? resolvedUserIntegrations : [resolvedUserIntegrations];
      } else {
        integrations = defaultIntegrations;
      }
      return filterDuplicates(integrations);
    }
    function setupIntegrations(client, integrations) {
      const integrationIndex = {};
      integrations.forEach((integration) => {
        if (integration?.beforeSetup) {
          integration.beforeSetup(client);
        }
      });
      integrations.forEach((integration) => {
        if (integration) {
          setupIntegration(client, integration, integrationIndex);
        }
      });
      return integrationIndex;
    }
    function afterSetupIntegrations(client, integrations) {
      for (const integration of integrations) {
        if (integration?.afterAllSetup) {
          integration.afterAllSetup(client);
        }
      }
    }
    function setupIntegration(client, integration, integrationIndex) {
      if (integrationIndex[integration.name]) {
        DEBUG_BUILD$2 && debug.log(`Integration skipped because it was already installed: ${integration.name}`);
        return;
      }
      integrationIndex[integration.name] = integration;
      if (!installedIntegrations.includes(integration.name) && typeof integration.setupOnce === "function") {
        integration.setupOnce();
        installedIntegrations.push(integration.name);
      }
      if (integration.setup && typeof integration.setup === "function") {
        integration.setup(client);
      }
      if (typeof integration.preprocessEvent === "function") {
        const callback = integration.preprocessEvent.bind(integration);
        client.on("preprocessEvent", (event, hint) => callback(event, hint, client));
      }
      if (typeof integration.processEvent === "function") {
        const callback = integration.processEvent.bind(integration);
        const processor = Object.assign((event, hint) => callback(event, hint, client), {
          id: integration.name
        });
        client.addEventProcessor(processor);
      }
      ["processSpan", "processSegmentSpan"].forEach((hook) => {
        const callback = integration[hook];
        if (typeof callback === "function") {
          client.on(hook, (span) => callback.call(integration, span, client));
        }
      });
      DEBUG_BUILD$2 && debug.log(`Integration installed: ${integration.name}`);
    }
    function defineIntegration(fn) {
      return fn;
    }

    function isBrowserBundle() {
      return typeof __SENTRY_BROWSER_BUNDLE__ !== "undefined" && !!__SENTRY_BROWSER_BUNDLE__;
    }
    function getSDKSource() {
      /*! __SENTRY_SDK_SOURCE__ */
      return "npm";
    }

    function isNodeEnv() {
      return !isBrowserBundle() && Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
    }

    function isBrowser() {
      return typeof window !== "undefined" && (!isNodeEnv() || isElectronNodeRenderer());
    }
    function isElectronNodeRenderer() {
      const process = GLOBAL_OBJ.process;
      return process?.type === "renderer";
    }

    function createLogContainerEnvelopeItem(items, inferUserData) {
      const inferSetting = inferUserData ? "auto" : "never";
      return [
        {
          type: "log",
          item_count: items.length,
          content_type: "application/vnd.sentry.items.log+json"
        },
        {
          version: 2,
          ...isBrowser() && {
            ingest_settings: { infer_ip: inferSetting, infer_user_agent: inferSetting }
          },
          items
        }
      ];
    }
    function createLogEnvelope(logs, metadata, tunnel, dsn, inferUserData) {
      const headers = {};
      if (metadata?.sdk) {
        headers.sdk = {
          name: metadata.sdk.name,
          version: metadata.sdk.version
        };
      }
      if (!!tunnel && !!dsn) {
        headers.dsn = dsnToString(dsn);
      }
      return createEnvelope(headers, [createLogContainerEnvelopeItem(logs, inferUserData)]);
    }

    function _INTERNAL_flushLogsBuffer(client, maybeLogBuffer) {
      const logBuffer = maybeLogBuffer ?? _INTERNAL_getLogBuffer(client) ?? [];
      if (logBuffer.length === 0) {
        return;
      }
      const clientOptions = client.getOptions();
      const envelope = createLogEnvelope(
        logBuffer,
        clientOptions._metadata,
        clientOptions.tunnel,
        client.getDsn(),
        client.getDataCollectionOptions().userInfo
      );
      _getBufferMap$1().set(client, []);
      client.emit("flushLogs");
      client.sendEnvelope(envelope);
    }
    function _INTERNAL_getLogBuffer(client) {
      return _getBufferMap$1().get(client);
    }
    function _getBufferMap$1() {
      return getGlobalSingleton("clientToLogBufferMap", () => /* @__PURE__ */ new WeakMap());
    }

    function createMetricContainerEnvelopeItem(items, inferUserData) {
      const inferSetting = inferUserData ? "auto" : "never";
      return [
        {
          type: "trace_metric",
          item_count: items.length,
          content_type: "application/vnd.sentry.items.trace-metric+json"
        },
        {
          version: 2,
          ...isBrowser() && {
            ingest_settings: { infer_ip: inferSetting, infer_user_agent: inferSetting }
          },
          items
        }
      ];
    }
    function createMetricEnvelope(metrics, metadata, tunnel, dsn, inferUserData) {
      const headers = {};
      if (metadata?.sdk) {
        headers.sdk = {
          name: metadata.sdk.name,
          version: metadata.sdk.version
        };
      }
      if (!!tunnel && !!dsn) {
        headers.dsn = dsnToString(dsn);
      }
      return createEnvelope(headers, [createMetricContainerEnvelopeItem(metrics, inferUserData)]);
    }

    function _INTERNAL_flushMetricsBuffer(client, maybeMetricBuffer) {
      const metricBuffer = maybeMetricBuffer ?? _INTERNAL_getMetricBuffer(client) ?? [];
      if (metricBuffer.length === 0) {
        return;
      }
      const clientOptions = client.getOptions();
      const envelope = createMetricEnvelope(
        metricBuffer,
        clientOptions._metadata,
        clientOptions.tunnel,
        client.getDsn(),
        client.getDataCollectionOptions().userInfo
      );
      _getBufferMap().set(client, []);
      client.emit("flushMetrics");
      client.sendEnvelope(envelope);
    }
    function _INTERNAL_getMetricBuffer(client) {
      return _getBufferMap().get(client);
    }
    function _getBufferMap() {
      return getGlobalSingleton("clientToMetricBufferMap", () => /* @__PURE__ */ new WeakMap());
    }

    function spanJsonToSerializedStreamedSpan(span) {
      const streamedSpan = {
        trace_id: span.trace_id,
        span_id: span.span_id,
        parent_span_id: span.parent_span_id,
        name: span.description || "",
        start_timestamp: span.start_timestamp,
        end_timestamp: span.timestamp || span.start_timestamp,
        status: !span.status || span.status === "ok" || span.status === "cancelled" ? "ok" : "error",
        is_segment: false,
        attributes: { ...span.data },
        links: span.links
      };
      return streamedSpanJsonToSerializedSpan(streamedSpan);
    }

    function extractGenAiSpansFromEvent(event, client) {
      if (event.type !== "transaction" || !event.spans?.length || !event.sdkProcessingMetadata?.hasGenAiSpans || client.getOptions().streamGenAiSpans === false || hasSpanStreamingEnabled(client)) {
        return void 0;
      }
      const genAiSpans = [];
      const remainingSpans = [];
      for (const span of event.spans) {
        if (span.op?.startsWith("gen_ai.")) {
          genAiSpans.push(spanJsonToSerializedStreamedSpan(span));
        } else {
          remainingSpans.push(span);
        }
      }
      if (genAiSpans.length === 0) {
        return void 0;
      }
      event.spans = remainingSpans;
      const inferSetting = client.getDataCollectionOptions().userInfo ? "auto" : "never";
      return [
        { type: "span", item_count: genAiSpans.length, content_type: "application/vnd.sentry.items.span.v2+json" },
        {
          version: 2,
          ...isBrowser() && {
            ingest_settings: { infer_ip: inferSetting, infer_user_agent: inferSetting }
          },
          items: genAiSpans
        }
      ];
    }

    const SENTRY_BUFFER_FULL_ERROR = /* @__PURE__ */ Symbol.for("SentryBufferFullError");
    function makePromiseBuffer(limit = 100) {
      const buffer = /* @__PURE__ */ new Set();
      function isReady() {
        return buffer.size < limit;
      }
      function remove(task) {
        buffer.delete(task);
      }
      function add(taskProducer) {
        if (!isReady()) {
          return rejectedSyncPromise(SENTRY_BUFFER_FULL_ERROR);
        }
        const task = taskProducer();
        buffer.add(task);
        void task.then(
          () => remove(task),
          () => remove(task)
        );
        return task;
      }
      function drain(timeout) {
        if (!buffer.size) {
          return resolvedSyncPromise(true);
        }
        const drainPromise = Promise.allSettled(Array.from(buffer)).then(() => true);
        if (!timeout) {
          return drainPromise;
        }
        const promises = [
          drainPromise,
          new Promise((resolve) => safeUnref(setTimeout(() => resolve(false), timeout)))
        ];
        return Promise.race(promises);
      }
      return {
        get $() {
          return Array.from(buffer);
        },
        add,
        drain
      };
    }

    const DEFAULT_RETRY_AFTER = 60 * 1e3;
    function parseRetryAfterHeader(header, now = safeDateNow()) {
      const headerDelay = parseInt(`${header}`, 10);
      if (!isNaN(headerDelay)) {
        return headerDelay * 1e3;
      }
      const headerDate = Date.parse(`${header}`);
      if (!isNaN(headerDate)) {
        return headerDate - now;
      }
      return DEFAULT_RETRY_AFTER;
    }
    function disabledUntil(limits, dataCategory) {
      return limits[dataCategory] || limits.all || 0;
    }
    function isRateLimited(limits, dataCategory, now = safeDateNow()) {
      return disabledUntil(limits, dataCategory) > now;
    }
    function updateRateLimits(limits, { statusCode, headers }, now = safeDateNow()) {
      const updatedRateLimits = {
        ...limits
      };
      const rateLimitHeader = headers?.["x-sentry-rate-limits"];
      const retryAfterHeader = headers?.["retry-after"];
      if (rateLimitHeader) {
        for (const limit of rateLimitHeader.trim().split(",")) {
          const [retryAfter, categories, , , namespaces] = limit.split(":", 5);
          const headerDelay = parseInt(retryAfter, 10);
          const delay = (!isNaN(headerDelay) ? headerDelay : 60) * 1e3;
          if (!categories) {
            updatedRateLimits.all = now + delay;
          } else {
            for (const category of categories.split(";")) {
              if (category === "metric_bucket") {
                if (!namespaces || namespaces.split(";").includes("custom")) {
                  updatedRateLimits[category] = now + delay;
                }
              } else {
                updatedRateLimits[category] = now + delay;
              }
            }
          }
        }
      } else if (retryAfterHeader) {
        updatedRateLimits.all = now + parseRetryAfterHeader(retryAfterHeader, now);
      } else if (statusCode === 429) {
        updatedRateLimits.all = now + 60 * 1e3;
      }
      return updatedRateLimits;
    }

    const DEFAULT_TRANSPORT_BUFFER_SIZE = 64;
    function createTransport(options, makeRequest, buffer = makePromiseBuffer(
      options.bufferSize || DEFAULT_TRANSPORT_BUFFER_SIZE
    )) {
      let rateLimits = {};
      const flush = (timeout) => buffer.drain(timeout);
      function send(envelope) {
        const filteredEnvelopeItems = [];
        forEachEnvelopeItem(envelope, (item, type) => {
          const dataCategory = envelopeItemTypeToDataCategory(type);
          if (isRateLimited(rateLimits, dataCategory)) {
            options.recordDroppedEvent("ratelimit_backoff", dataCategory);
          } else {
            filteredEnvelopeItems.push(item);
          }
        });
        if (filteredEnvelopeItems.length === 0) {
          return Promise.resolve({});
        }
        const filteredEnvelope = createEnvelope(envelope[0], filteredEnvelopeItems);
        const recordEnvelopeLoss = (reason) => {
          if (envelopeContainsItemType(filteredEnvelope, ["client_report"])) {
            DEBUG_BUILD$2 && debug.warn(`Dropping client report. Will not send outcomes (reason: ${reason}).`);
            return;
          }
          forEachEnvelopeItem(filteredEnvelope, (item, type) => {
            options.recordDroppedEvent(reason, envelopeItemTypeToDataCategory(type));
          });
        };
        const requestTask = () => makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then(
          (response) => {
            if (response.statusCode === 413) {
              DEBUG_BUILD$2 && debug.error(
                "Sentry responded with status code 413. Envelope was discarded due to exceeding size limits."
              );
              recordEnvelopeLoss("send_error");
              return response;
            }
            if (DEBUG_BUILD$2 && response.statusCode !== void 0 && (response.statusCode < 200 || response.statusCode >= 300)) {
              debug.warn(`Sentry responded with status code ${response.statusCode} to sent event.`);
            }
            rateLimits = updateRateLimits(rateLimits, response);
            return response;
          },
          (error) => {
            recordEnvelopeLoss("network_error");
            DEBUG_BUILD$2 && debug.error("Encountered error running transport request:", error);
            throw error;
          }
        );
        return buffer.add(requestTask).then(
          (result) => result,
          (error) => {
            if (error === SENTRY_BUFFER_FULL_ERROR) {
              DEBUG_BUILD$2 && debug.error("Skipped sending event because buffer is full.");
              recordEnvelopeLoss("queue_overflow");
              return Promise.resolve({});
            } else {
              throw error;
            }
          }
        );
      }
      return {
        send,
        flush
      };
    }

    function createClientReportEnvelope(discarded_events, dsn, timestamp) {
      const clientReportItem = [
        { type: "client_report" },
        {
          timestamp: dateTimestampInSeconds(),
          discarded_events
        }
      ];
      return createEnvelope(dsn ? { dsn } : {}, [clientReportItem]);
    }

    function getPossibleEventMessages(event) {
      const possibleMessages = [];
      if (event.message) {
        possibleMessages.push(event.message);
      }
      try {
        const lastException = event.exception.values[event.exception.values.length - 1];
        if (lastException?.value) {
          possibleMessages.push(lastException.value);
          if (lastException.type) {
            possibleMessages.push(`${lastException.type}: ${lastException.value}`);
          }
        }
      } catch {
      }
      return possibleMessages;
    }

    function convertTransactionEventToSpanJson(event) {
      const { trace_id, parent_span_id, span_id, status, origin, data, op } = event.contexts?.trace ?? {};
      return {
        data: data ?? {},
        description: event.transaction,
        op,
        parent_span_id,
        span_id: span_id ?? "",
        start_timestamp: event.start_timestamp ?? 0,
        status,
        timestamp: event.timestamp,
        trace_id: trace_id ?? "",
        origin,
        profile_id: data?.[SEMANTIC_ATTRIBUTE_PROFILE_ID],
        exclusive_time: data?.[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
        measurements: event.measurements,
        is_segment: true
      };
    }
    function convertSpanJsonToTransactionEvent(span) {
      return {
        type: "transaction",
        timestamp: span.timestamp,
        start_timestamp: span.start_timestamp,
        transaction: span.description,
        contexts: {
          trace: {
            trace_id: span.trace_id,
            span_id: span.span_id,
            parent_span_id: span.parent_span_id,
            op: span.op,
            status: span.status,
            origin: span.origin,
            data: {
              ...span.data,
              ...span.profile_id && { [SEMANTIC_ATTRIBUTE_PROFILE_ID]: span.profile_id },
              ...span.exclusive_time && { [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: span.exclusive_time }
            }
          }
        },
        measurements: span.measurements
      };
    }

    const PII_HEADER_SNIPPETS = ["forwarded", "-ip", "remote-", "via", "-user"];

    function defaultPiiToCollectionOptions(sendDefaultPii) {
      return sendDefaultPii === true ? {
        userInfo: true,
        cookies: true,
        httpHeaders: { request: true, response: true },
        httpBodies: ["incomingRequest", "outgoingRequest", "incomingResponse", "outgoingResponse"],
        urlQueryParams: true,
        graphQL: { document: true, variables: true },
        genAI: { inputs: true, outputs: true },
        databaseQueryData: true,
        stackFrameVariables: true,
        frameContextLines: 7
        // default should be 5, but ContextLines integration uses 7
      } : {
        userInfo: false,
        cookies: { deny: PII_HEADER_SNIPPETS },
        httpHeaders: { request: { deny: PII_HEADER_SNIPPETS }, response: { deny: PII_HEADER_SNIPPETS } },
        httpBodies: [],
        urlQueryParams: { deny: PII_HEADER_SNIPPETS },
        // The GraphQL document has literal values redacted at collection time, so it was historically
        // always attached regardless of `sendDefaultPii`; keep it on to preserve that behavior.
        graphQL: { document: true, variables: true },
        genAI: { inputs: false, outputs: false },
        // Database query values were only sent with `sendDefaultPii: true` (e.g. Supabase gated on it),
        // so map the legacy "off" state to `false`.
        databaseQueryData: false,
        stackFrameVariables: true,
        frameContextLines: 7
        // default should be 5, but ContextLines integration uses 7
      };
    }

    const DEFAULTS = {
      userInfo: true,
      cookies: true,
      httpHeaders: { request: true, response: true },
      httpBodies: ["incomingRequest", "outgoingRequest", "incomingResponse", "outgoingResponse"],
      urlQueryParams: true,
      graphQL: { document: true, variables: true },
      genAI: { inputs: true, outputs: true },
      databaseQueryData: true,
      stackFrameVariables: true,
      frameContextLines: 5
    };
    function resolveDataCollectionOptions(options) {
      const base = options.dataCollection != null ? DEFAULTS : defaultPiiToCollectionOptions(options.sendDefaultPii);
      const dc = options.dataCollection ?? {};
      return {
        userInfo: dc.userInfo ?? base.userInfo,
        cookies: dc.cookies ?? base.cookies,
        httpHeaders: {
          request: dc.httpHeaders?.request ?? base.httpHeaders.request,
          response: dc.httpHeaders?.response ?? base.httpHeaders.response
        },
        httpBodies: dc.httpBodies ?? base.httpBodies,
        // oxlint-disable-next-line typescript/no-deprecated
        urlQueryParams: dc.urlQueryParams ?? dc.queryParams ?? base.urlQueryParams,
        graphQL: {
          document: dc.graphQL?.document ?? base.graphQL.document,
          variables: dc.graphQL?.variables ?? base.graphQL.variables
        },
        genAI: {
          inputs: dc.genAI?.inputs ?? base.genAI.inputs,
          outputs: dc.genAI?.outputs ?? base.genAI.outputs
        },
        databaseQueryData: dc.databaseQueryData ?? base.databaseQueryData,
        stackFrameVariables: dc.stackFrameVariables ?? base.stackFrameVariables,
        frameContextLines: dc.frameContextLines ?? base.frameContextLines
      };
    }

    const ALREADY_SEEN_ERROR = "Not capturing exception because it's already been captured.";
    const MISSING_RELEASE_FOR_SESSION_ERROR = "Discarded session because of missing or non-string release";
    const INTERNAL_ERROR_SYMBOL = /* @__PURE__ */ Symbol.for("SentryInternalError");
    const DO_NOT_SEND_EVENT_SYMBOL = /* @__PURE__ */ Symbol.for("SentryDoNotSendEventError");
    const DEFAULT_FLUSH_INTERVAL = 5e3;
    function _makeInternalError(message) {
      return {
        message,
        [INTERNAL_ERROR_SYMBOL]: true
      };
    }
    function _makeDoNotSendEventError(message) {
      return {
        message,
        [DO_NOT_SEND_EVENT_SYMBOL]: true
      };
    }
    function _isInternalError(error) {
      return isObjectLike(error) && INTERNAL_ERROR_SYMBOL in error;
    }
    function _isDoNotSendEventError(error) {
      return isObjectLike(error) && DO_NOT_SEND_EVENT_SYMBOL in error;
    }
    function setupWeightBasedFlushing(client, afterCaptureHook, flushHook, estimateSizeFn, flushFn) {
      let weight = 0;
      let flushTimeout;
      let isTimerActive = false;
      client.on(flushHook, () => {
        weight = 0;
        clearTimeout(flushTimeout);
        isTimerActive = false;
      });
      client.on(afterCaptureHook, (item) => {
        weight += estimateSizeFn(item);
        if (weight >= 8e5) {
          flushFn(client);
        } else if (!isTimerActive) {
          const flushInterval = client.getOptions()._flushInterval ?? DEFAULT_FLUSH_INTERVAL;
          if (flushInterval > 0) {
            isTimerActive = true;
            flushTimeout = safeUnref(
              setTimeout(() => {
                flushFn(client);
              }, flushInterval)
            );
          }
        }
      });
      client.on("flush", () => {
        flushFn(client);
      });
    }
    class Client {
      /**
       * Initializes this client instance.
       *
       * @param options Options for the client.
       */
      constructor(options) {
        this._options = options;
        this._integrations = {};
        this._numProcessing = 0;
        this._outcomes = {};
        this._hooks = {};
        this._eventProcessors = [];
        this._promiseBuffer = makePromiseBuffer(options.transportOptions?.bufferSize ?? DEFAULT_TRANSPORT_BUFFER_SIZE);
        this._dataCollection = resolveDataCollectionOptions(options);
        if (options.dsn) {
          this._dsn = makeDsn(options.dsn);
        } else {
          DEBUG_BUILD$2 && debug.warn("No DSN provided, client will not send events.");
        }
        if (this._dsn) {
          const url = getEnvelopeEndpointWithUrlEncodedAuth(
            this._dsn,
            options.tunnel,
            options._metadata ? options._metadata.sdk : void 0
          );
          this._transport = options.transport({
            tunnel: this._options.tunnel,
            recordDroppedEvent: this.recordDroppedEvent.bind(this),
            ...options.transportOptions,
            url
          });
        }
        this._options.enableLogs = this._options.enableLogs ?? this._options._experiments?.enableLogs ?? true;
        if (this._options.enableLogs) {
          setupWeightBasedFlushing(this, "afterCaptureLog", "flushLogs", estimateLogSizeInBytes, _INTERNAL_flushLogsBuffer);
        }
        const enableMetrics = this._options.enableMetrics ?? this._options._experiments?.enableMetrics ?? true;
        if (enableMetrics) {
          setupWeightBasedFlushing(
            this,
            "afterCaptureMetric",
            "flushMetrics",
            estimateMetricSizeInBytes,
            _INTERNAL_flushMetricsBuffer
          );
        }
      }
      /**
       * Captures an exception event and sends it to Sentry.
       *
       * Unlike `captureException` exported from every SDK, this method requires that you pass it the current scope.
       */
      captureException(exception, hint, scope) {
        const eventId = uuid4();
        if (checkOrSetAlreadyCaught(exception)) {
          DEBUG_BUILD$2 && debug.log(ALREADY_SEEN_ERROR);
          return eventId;
        }
        const hintWithEventId = {
          event_id: eventId,
          ...hint
        };
        this._process(
          () => this.eventFromException(exception, hintWithEventId).then((event) => this._captureEvent(event, hintWithEventId, scope)).then((res) => res),
          "error"
        );
        return hintWithEventId.event_id;
      }
      /**
       * Captures a message event and sends it to Sentry.
       *
       * Unlike `captureMessage` exported from every SDK, this method requires that you pass it the current scope.
       */
      captureMessage(message, level, hint, currentScope) {
        const hintWithEventId = {
          event_id: uuid4(),
          ...hint
        };
        const eventMessage = isParameterizedString(message) ? message : String(message);
        const isMessage = isPrimitive(message);
        const promisedEvent = isMessage ? this.eventFromMessage(eventMessage, level, hintWithEventId) : this.eventFromException(message, hintWithEventId);
        this._process(
          () => promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)),
          isMessage ? "unknown" : "error"
        );
        return hintWithEventId.event_id;
      }
      /**
       * Captures a manually created event and sends it to Sentry.
       *
       * Unlike `captureEvent` exported from every SDK, this method requires that you pass it the current scope.
       */
      captureEvent(event, hint, currentScope) {
        const eventId = uuid4();
        if (hint?.originalException && checkOrSetAlreadyCaught(hint.originalException)) {
          DEBUG_BUILD$2 && debug.log(ALREADY_SEEN_ERROR);
          return eventId;
        }
        const hintWithEventId = {
          event_id: eventId,
          ...hint
        };
        const sdkProcessingMetadata = event.sdkProcessingMetadata || {};
        const capturedSpanScope = sdkProcessingMetadata.capturedSpanScope;
        const capturedSpanIsolationScope = sdkProcessingMetadata.capturedSpanIsolationScope;
        const dataCategory = getDataCategoryByType(event.type);
        this._process(
          () => this._captureEvent(event, hintWithEventId, capturedSpanScope || currentScope, capturedSpanIsolationScope),
          dataCategory
        );
        return hintWithEventId.event_id;
      }
      /**
       * Captures a session.
       */
      captureSession(session) {
        this.sendSession(session);
        updateSession(session, { init: false });
      }
      /**
       * Get the current Dsn.
       */
      getDsn() {
        return this._dsn;
      }
      /**
       * Get the current options.
       */
      getOptions() {
        return this._options;
      }
      /**
       * Get the resolved data collection configuration.
       */
      getDataCollectionOptions() {
        return this._dataCollection;
      }
      /**
       * Get the SDK metadata.
       * @see SdkMetadata
       */
      getSdkMetadata() {
        return this._options._metadata;
      }
      /**
       * Returns the transport that is used by the client.
       * Please note that the transport gets lazy initialized so it will only be there once the first event has been sent.
       */
      getTransport() {
        return this._transport;
      }
      /**
       * Wait for all events to be sent or the timeout to expire, whichever comes first.
       *
       * @param timeout Maximum time in ms the client should wait for events to be flushed. Omitting this parameter will
       *   cause the client to wait until all events are sent before resolving the promise.
       * @returns A promise that will resolve with `true` if all events are sent before the timeout, or `false` if there are
       * still events in the queue when the timeout is reached.
       */
      // @ts-expect-error - PromiseLike is a subset of Promise
      async flush(timeout) {
        const transport = this._transport;
        this.emit("flush");
        if (!transport) {
          return true;
        }
        const clientFinished = await this._isClientDoneProcessing(timeout);
        const transportFlushed = await transport.flush(timeout);
        return clientFinished && transportFlushed;
      }
      /**
       * Flush the event queue and set the client to `enabled = false`. See {@link Client.flush}.
       *
       * @param {number} timeout Maximum time in ms the client should wait before shutting down. Omitting this parameter will cause
       *   the client to wait until all events are sent before disabling itself.
       * @returns {Promise<boolean>} A promise which resolves to `true` if the flush completes successfully before the timeout, or `false` if
       * it doesn't.
       */
      // @ts-expect-error - PromiseLike is a subset of Promise
      async close(timeout) {
        const result = await this.flush(timeout);
        this.getOptions().enabled = false;
        this.emit("close");
        return result;
      }
      /**
       * Get all installed event processors.
       */
      getEventProcessors() {
        return this._eventProcessors;
      }
      /**
       * Adds an event processor that applies to any event processed by this client.
       */
      addEventProcessor(eventProcessor) {
        this._eventProcessors.push(eventProcessor);
      }
      /**
       * Initialize this client.
       * Call this after the client was set on a scope.
       */
      init() {
        if (this._isEnabled() || // Force integrations to be setup even if no DSN was set when we have
        // Spotlight enabled. This is particularly important for browser as we
        // don't support the `spotlight` option there and rely on the users
        // adding the `spotlightBrowserIntegration()` to their integrations which
        // wouldn't get initialized with the check below when there's no DSN set.
        this._options.integrations.some(({ name }) => name.startsWith("Spotlight"))) {
          this._setupIntegrations();
        }
      }
      /**
       * Gets an installed integration by its name.
       *
       * @returns {Integration|undefined} The installed integration or `undefined` if no integration with that `name` was installed.
       */
      getIntegrationByName(integrationName) {
        return this._integrations[integrationName];
      }
      /**
       * Returns the names of all installed integrations.
       */
      getIntegrationNames() {
        return Object.keys(this._integrations);
      }
      /**
       * Add an integration to the client.
       * This can be used to e.g. lazy load integrations.
       * In most cases, this should not be necessary,
       * and you're better off just passing the integrations via `integrations: []` at initialization time.
       * However, if you find the need to conditionally load & add an integration, you can use `addIntegration` to do so.
       */
      addIntegration(integration) {
        const isAlreadyInstalled = this._integrations[integration.name];
        if (!isAlreadyInstalled && integration.beforeSetup) {
          integration.beforeSetup(this);
        }
        setupIntegration(this, integration, this._integrations);
        if (!isAlreadyInstalled) {
          afterSetupIntegrations(this, [integration]);
        }
      }
      /**
       * Send a fully prepared event to Sentry.
       */
      sendEvent(event, hint = {}) {
        this.emit("beforeSendEvent", event, hint);
        const genAiSpanItem = extractGenAiSpansFromEvent(event, this);
        let env = createEventEnvelope(event, this._dsn, this._options._metadata, this._options.tunnel);
        for (const attachment of hint.attachments || []) {
          env = addItemToEnvelope(env, createAttachmentEnvelopeItem(attachment));
        }
        if (genAiSpanItem) {
          env = addItemToEnvelope(env, genAiSpanItem);
        }
        this.sendEnvelope(env).then((sendResponse) => this.emit("afterSendEvent", event, sendResponse));
      }
      /**
       * Send a session or session aggregrates to Sentry.
       */
      sendSession(session) {
        const { release: clientReleaseOption, environment: clientEnvironmentOption = DEFAULT_ENVIRONMENT } = this._options;
        if ("aggregates" in session) {
          const sessionAttrs = session.attrs || {};
          if (!sessionAttrs.release && !clientReleaseOption) {
            DEBUG_BUILD$2 && debug.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
            return;
          }
          sessionAttrs.release = sessionAttrs.release || clientReleaseOption;
          sessionAttrs.environment = sessionAttrs.environment || clientEnvironmentOption;
          session.attrs = sessionAttrs;
        } else {
          if (!session.release && !clientReleaseOption) {
            DEBUG_BUILD$2 && debug.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
            return;
          }
          session.release = session.release || clientReleaseOption;
          session.environment = session.environment || clientEnvironmentOption;
        }
        this.emit("beforeSendSession", session);
        const env = createSessionEnvelope(session, this._dsn, this._options._metadata, this._options.tunnel);
        this.sendEnvelope(env);
      }
      /**
       * Record on the client that an event got dropped (ie, an event that will not be sent to Sentry).
       */
      recordDroppedEvent(reason, category, count = 1) {
        if (this._options.sendClientReports) {
          const key = `${reason}:${category}`;
          DEBUG_BUILD$2 && debug.log(`Recording outcome: "${key}"${count > 1 ? ` (${count} times)` : ""}`);
          this._outcomes[key] = (this._outcomes[key] || 0) + count;
        }
      }
      /**
       * Register a hook on this client.
       */
      on(hook, callback) {
        const hookCallbacks = this._hooks[hook] = this._hooks[hook] || /* @__PURE__ */ new Set();
        const uniqueCallback = (...args) => callback(...args);
        hookCallbacks.add(uniqueCallback);
        return () => {
          hookCallbacks.delete(uniqueCallback);
        };
      }
      /**
       * Emit a hook that was previously registered via `on()`.
       */
      emit(hook, ...rest) {
        const callbacks = this._hooks[hook];
        if (callbacks) {
          callbacks.forEach((callback) => callback(...rest));
        }
      }
      /**
       * Send an envelope to Sentry.
       */
      // @ts-expect-error - PromiseLike is a subset of Promise
      async sendEnvelope(envelope) {
        this.emit("beforeEnvelope", envelope);
        if (this._isEnabled() && this._transport) {
          try {
            return await this._transport.send(envelope);
          } catch (reason) {
            DEBUG_BUILD$2 && debug.error("Error while sending envelope:", reason);
            return {};
          }
        }
        DEBUG_BUILD$2 && debug.error("Transport disabled");
        return {};
      }
      /**
       * Register a cleanup function to be called when the client is disposed.
       * This is useful for integrations that need to clean up global state.
       *
       * NOTE: This is a no-op in the base `Client` class. Subclasses like `ServerRuntimeClient`
       * override this method to actually register and execute cleanup callbacks.
       */
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      registerCleanup(callback) {
      }
      /**
       * Disposes of the client and releases all resources.
       *
       * Subclasses should override this method to clean up their own resources, including invoking
       * any callbacks registered via {@link Client.registerCleanup}. The base implementation is a
       * no-op and does NOT execute registered cleanup callbacks.
       *
       * After calling dispose(), the client should not be used anymore.
       */
      dispose() {
      }
      /* eslint-enable @typescript-eslint/unified-signatures */
      /** Setup integrations for this client. */
      _setupIntegrations() {
        const { integrations } = this._options;
        this._integrations = setupIntegrations(this, integrations);
        afterSetupIntegrations(this, integrations);
      }
      /** Updates existing session based on the provided event */
      _updateSessionFromEvent(session, event) {
        let crashed = event.level === "fatal";
        let errored = false;
        const exceptions = event.exception?.values;
        if (exceptions) {
          errored = true;
          crashed = false;
          for (const ex of exceptions) {
            if (ex.mechanism?.handled === false) {
              crashed = true;
              break;
            }
          }
        }
        const sessionNonTerminal = session.status === "ok";
        const shouldUpdateAndSend = sessionNonTerminal && session.errors === 0 || sessionNonTerminal && crashed;
        if (shouldUpdateAndSend) {
          updateSession(session, {
            ...crashed && { status: "crashed" },
            errors: session.errors || Number(errored || crashed)
          });
          this.captureSession(session);
        }
      }
      /**
       * Determine if the client is finished processing. Returns a promise because it will wait `timeout` ms before saying
       * "no" (resolving to `false`) in order to give the client a chance to potentially finish first.
       *
       * @param timeout The time, in ms, after which to resolve to `false` if the client is still busy. Passing `0` (or not
       * passing anything) will make the promise wait as long as it takes for processing to finish before resolving to
       * `true`.
       * @returns A promise which will resolve to `true` if processing is already done or finishes before the timeout, and
       * `false` otherwise
       */
      async _isClientDoneProcessing(timeout) {
        let ticked = 0;
        while (!timeout || ticked < timeout) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          if (!this._numProcessing) {
            return true;
          }
          ticked++;
        }
        return false;
      }
      /** Determines whether this SDK is enabled and a transport is present. */
      _isEnabled() {
        return this.getOptions().enabled !== false && this._transport !== void 0;
      }
      /**
       * Adds common information to events.
       *
       * The information includes release and environment from `options`,
       * breadcrumbs and context (extra, tags and user) from the scope.
       *
       * Information that is already present in the event is never overwritten. For
       * nested objects, such as the context, keys are merged.
       *
       * @param event The original event.
       * @param hint May contain additional information about the original exception.
       * @param currentScope A scope containing event metadata.
       * @returns A new event with more information.
       */
      _prepareEvent(event, hint, currentScope, isolationScope) {
        const options = this.getOptions();
        const integrations = this.getIntegrationNames();
        if (!hint.integrations && integrations.length) {
          hint.integrations = integrations;
        }
        this.emit("preprocessEvent", event, hint);
        if (!event.type) {
          isolationScope.setLastEventId(event.event_id || hint.event_id);
        }
        return prepareEvent(options, event, hint, currentScope, this, isolationScope).then((evt) => {
          if (evt === null) {
            return evt;
          }
          this.emit("postprocessEvent", evt, hint);
          evt.contexts = {
            trace: { ...evt.contexts?.trace, ...getTraceContextFromScope(currentScope) },
            ...evt.contexts
          };
          const dynamicSamplingContext = getDynamicSamplingContextFromScope(this, currentScope);
          evt.sdkProcessingMetadata = {
            dynamicSamplingContext,
            ...evt.sdkProcessingMetadata
          };
          return evt;
        });
      }
      /**
       * Processes the event and logs an error in case of rejection
       * @param event
       * @param hint
       * @param scope
       */
      _captureEvent(event, hint = {}, currentScope = getCurrentScope(), isolationScope = getIsolationScope()) {
        if (DEBUG_BUILD$2 && isErrorEvent(event)) {
          debug.log(`Captured error event \`${getPossibleEventMessages(event)[0] || "<unknown>"}\``);
        }
        return this._processEvent(event, hint, currentScope, isolationScope).then(
          (finalEvent) => {
            return finalEvent.event_id;
          },
          (reason) => {
            if (DEBUG_BUILD$2) {
              if (_isDoNotSendEventError(reason)) {
                debug.log(reason.message);
              } else if (_isInternalError(reason)) {
                debug.warn(reason.message);
              } else {
                debug.warn(reason);
              }
            }
            return void 0;
          }
        );
      }
      /**
       * Processes an event (either error or message) and sends it to Sentry.
       *
       * This also adds breadcrumbs and context information to the event. However,
       * platform specific meta data (such as the User's IP address) must be added
       * by the SDK implementor.
       *
       *
       * @param event The event to send to Sentry.
       * @param hint May contain additional information about the original exception.
       * @param currentScope A scope containing event metadata.
       * @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
       */
      _processEvent(event, hint, currentScope, isolationScope) {
        const options = this.getOptions();
        const { sampleRate } = options;
        const isTransaction = isTransactionEvent(event);
        const isError = isErrorEvent(event);
        const eventType = event.type || "error";
        const beforeSendLabel = `before send for type \`${eventType}\``;
        const parsedSampleRate = typeof sampleRate === "undefined" ? void 0 : parseSampleRate(sampleRate);
        const dataCategory = getDataCategoryByType(event.type);
        return this._prepareEvent(event, hint, currentScope, isolationScope).then((prepared) => {
          if (prepared === null) {
            this.recordDroppedEvent("event_processor", dataCategory);
            throw _makeDoNotSendEventError("An event processor returned `null`, will not send event.");
          }
          const isInternalException = hint.data?.__sentry__ === true;
          if (isInternalException) {
            return prepared;
          }
          const result = processBeforeSend(this, options, prepared, hint);
          return _validateBeforeSendResult(result, beforeSendLabel);
        }).then((processedEvent) => {
          if (processedEvent === null) {
            this.recordDroppedEvent("before_send", dataCategory);
            if (isTransaction) {
              const spans = event.spans || [];
              const spanCount = 1 + spans.length;
              this.recordDroppedEvent("before_send", "span", spanCount);
            }
            throw _makeDoNotSendEventError(`${beforeSendLabel} returned \`null\`, will not send event.`);
          }
          const session = currentScope.getSession() || isolationScope.getSession();
          if (isError && session) {
            this._updateSessionFromEvent(session, processedEvent);
          }
          if (isError && typeof parsedSampleRate === "number" && safeMathRandom() > parsedSampleRate) {
            this.recordDroppedEvent("sample_rate", "error");
            throw _makeDoNotSendEventError(
              `Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`
            );
          }
          if (isTransaction) {
            const spanCountBefore = processedEvent.sdkProcessingMetadata?.spanCountBeforeProcessing || 0;
            const spanCountAfter = processedEvent.spans ? processedEvent.spans.length : 0;
            const droppedSpanCount = spanCountBefore - spanCountAfter;
            if (droppedSpanCount > 0) {
              this.recordDroppedEvent("before_send", "span", droppedSpanCount);
            }
          }
          const transactionInfo = processedEvent.transaction_info;
          if (isTransaction && transactionInfo && processedEvent.transaction !== event.transaction) {
            const source = "custom";
            processedEvent.transaction_info = {
              ...transactionInfo,
              source
            };
          }
          this.sendEvent(processedEvent, hint);
          return processedEvent;
        }).then(null, (reason) => {
          if (_isDoNotSendEventError(reason) || _isInternalError(reason)) {
            throw reason;
          }
          this.captureException(reason, {
            mechanism: {
              handled: false,
              type: "internal"
            },
            data: {
              __sentry__: true
            },
            originalException: reason
          });
          throw _makeInternalError(
            `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.
Reason: ${reason}`
          );
        });
      }
      /**
       * Occupies the client with processing and event
       */
      _process(taskProducer, dataCategory) {
        this._numProcessing++;
        void this._promiseBuffer.add(taskProducer).then(
          (value) => {
            this._numProcessing--;
            return value;
          },
          (reason) => {
            this._numProcessing--;
            if (reason === SENTRY_BUFFER_FULL_ERROR) {
              this.recordDroppedEvent("queue_overflow", dataCategory);
            }
            return reason;
          }
        );
      }
      /**
       * Clears outcomes on this client and returns them.
       */
      _clearOutcomes() {
        const outcomes = this._outcomes;
        this._outcomes = {};
        return Object.entries(outcomes).map(([key, quantity]) => {
          const [reason, category] = key.split(":");
          return {
            reason,
            category,
            quantity
          };
        });
      }
      /**
       * Sends client reports as an envelope.
       */
      _flushOutcomes() {
        DEBUG_BUILD$2 && debug.log("Flushing outcomes...");
        const outcomes = this._clearOutcomes();
        if (outcomes.length === 0) {
          DEBUG_BUILD$2 && debug.log("No outcomes to send");
          return;
        }
        if (!this._dsn) {
          DEBUG_BUILD$2 && debug.log("No dsn provided, will not send outcomes");
          return;
        }
        DEBUG_BUILD$2 && debug.log("Sending outcomes:", outcomes);
        const envelope = createClientReportEnvelope(outcomes, this._options.tunnel && dsnToString(this._dsn));
        this.sendEnvelope(envelope);
      }
    }
    function getDataCategoryByType(type) {
      return type === "replay_event" ? "replay" : type || "error";
    }
    function _validateBeforeSendResult(beforeSendResult, beforeSendLabel) {
      const invalidValueError = `${beforeSendLabel} must return \`null\` or a valid event.`;
      if (isThenable(beforeSendResult)) {
        return beforeSendResult.then(
          (event) => {
            if (!isPlainObject(event) && event !== null) {
              throw _makeInternalError(invalidValueError);
            }
            return event;
          },
          (e) => {
            throw _makeInternalError(`${beforeSendLabel} rejected with ${e}`);
          }
        );
      } else if (!isPlainObject(beforeSendResult) && beforeSendResult !== null) {
        throw _makeInternalError(invalidValueError);
      }
      return beforeSendResult;
    }
    function processBeforeSend(client, options, event, hint) {
      const { beforeSend, beforeSendTransaction, ignoreSpans } = options;
      const beforeSendSpan = !isStreamedBeforeSendSpanCallback(options.beforeSendSpan) && options.beforeSendSpan;
      let processedEvent = event;
      if (isErrorEvent(processedEvent) && beforeSend) {
        return beforeSend(processedEvent, hint);
      }
      if (isTransactionEvent(processedEvent)) {
        if (beforeSendSpan || ignoreSpans) {
          const rootSpanJson = convertTransactionEventToSpanJson(processedEvent);
          if (ignoreSpans?.length && shouldIgnoreSpan(
            { description: rootSpanJson.description, op: rootSpanJson.op, attributes: rootSpanJson.data },
            ignoreSpans
          )) {
            return null;
          }
          if (beforeSendSpan) {
            const processedRootSpanJson = beforeSendSpan(rootSpanJson);
            if (!processedRootSpanJson) {
              showSpanDropWarning();
            } else {
              processedEvent = merge(event, convertSpanJsonToTransactionEvent(processedRootSpanJson));
            }
          }
          if (processedEvent.spans) {
            const processedSpans = [];
            const initialSpans = processedEvent.spans;
            for (const span of initialSpans) {
              if (ignoreSpans?.length && shouldIgnoreSpan({ description: span.description, op: span.op, attributes: span.data }, ignoreSpans)) {
                reparentChildSpans(initialSpans, span);
                continue;
              }
              if (beforeSendSpan) {
                const processedSpan = beforeSendSpan(span);
                if (!processedSpan) {
                  showSpanDropWarning();
                  processedSpans.push(span);
                } else {
                  processedSpans.push(processedSpan);
                }
              } else {
                processedSpans.push(span);
              }
            }
            const droppedSpans = processedEvent.spans.length - processedSpans.length;
            if (droppedSpans) {
              client.recordDroppedEvent("before_send", "span", droppedSpans);
            }
            processedEvent.spans = processedSpans;
          }
        }
        if (beforeSendTransaction) {
          if (processedEvent.spans) {
            const spanCountBefore = processedEvent.spans.length;
            processedEvent.sdkProcessingMetadata = {
              ...event.sdkProcessingMetadata,
              spanCountBeforeProcessing: spanCountBefore
            };
          }
          return beforeSendTransaction(processedEvent, hint);
        }
      }
      return processedEvent;
    }
    function isErrorEvent(event) {
      return event.type === void 0;
    }
    function isTransactionEvent(event) {
      return event.type === "transaction";
    }
    function estimateMetricSizeInBytes(metric) {
      let weight = 0;
      if (metric.name) {
        weight += metric.name.length * 2;
      }
      weight += 8;
      return weight + estimateAttributesSizeInBytes(metric.attributes);
    }
    function estimateLogSizeInBytes(log) {
      let weight = 0;
      if (log.message) {
        weight += log.message.length * 2;
      }
      return weight + estimateAttributesSizeInBytes(log.attributes);
    }
    function estimateAttributesSizeInBytes(attributes) {
      if (!attributes) {
        return 0;
      }
      let weight = 0;
      Object.values(attributes).forEach((value) => {
        if (Array.isArray(value)) {
          weight += value.length * estimatePrimitiveSizeInBytes(value[0]);
        } else if (isPrimitive(value)) {
          weight += estimatePrimitiveSizeInBytes(value);
        } else {
          weight += 100;
        }
      });
      return weight;
    }
    function estimatePrimitiveSizeInBytes(value) {
      if (typeof value === "string") {
        return value.length * 2;
      } else if (typeof value === "number") {
        return 8;
      } else if (typeof value === "boolean") {
        return 4;
      }
      return 0;
    }

    function initAndBind(clientClass, options) {
      if (options.debug === true) {
        if (DEBUG_BUILD$2) {
          debug.enable();
        } else {
          consoleSandbox(() => {
            console.warn("[Sentry] Cannot initialize SDK with `debug` option using a non-debug bundle.");
          });
        }
      }
      const scope = getCurrentScope();
      scope.update(options.initialScope);
      const client = new clientClass(options);
      setCurrentClient(client);
      client.init();
      return client;
    }
    function setCurrentClient(client) {
      getCurrentScope().setClient(client);
    }

    const DEFAULT_BASE_URL = "thismessage:/";
    function isURLObjectRelative(url) {
      return "isRelative" in url;
    }
    function parseStringToURLObject(url, urlBase) {
      const isRelative = url.indexOf("://") <= 0 && url.indexOf("//") !== 0;
      const base = (isRelative ? DEFAULT_BASE_URL : void 0);
      try {
        if ("canParse" in URL && !URL.canParse(url, base)) {
          return void 0;
        }
        const fullUrlObject = new URL(url, base);
        if (isRelative) {
          return {
            isRelative,
            pathname: fullUrlObject.pathname,
            search: fullUrlObject.search,
            hash: fullUrlObject.hash
          };
        }
        return fullUrlObject;
      } catch {
      }
      return void 0;
    }
    function getSanitizedUrlStringFromUrlObject(url) {
      if (isURLObjectRelative(url)) {
        return url.pathname;
      }
      const newUrl = new URL(url);
      newUrl.search = "";
      newUrl.hash = "";
      if (["80", "443"].includes(newUrl.port)) {
        newUrl.port = "";
      }
      if (newUrl.password) {
        newUrl.password = "%filtered%";
      }
      if (newUrl.username) {
        newUrl.username = "%filtered%";
      }
      return newUrl.toString();
    }
    function parseUrl(url) {
      if (!url) {
        return {};
      }
      const match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
      if (!match) {
        return {};
      }
      const query = match[6] || "";
      const fragment = match[8] || "";
      return {
        host: match[4],
        path: match[5],
        protocol: match[2],
        search: query,
        hash: fragment,
        relative: match[5] + query + fragment
        // everything minus origin
      };
    }
    function stripUrlQueryAndFragment(urlPath) {
      return urlPath.split(/[?#]/, 1)[0];
    }
    function stripDataUrlContent(url, includeDataPrefix = true) {
      if (url.startsWith("data:")) {
        const match = url.match(/^data:([^;,]+)/);
        const mimeType = match ? match[1] : "text/plain";
        const isBase64 = url.includes(";base64,");
        const dataStart = url.indexOf(",");
        let dataPrefix = "";
        if (includeDataPrefix && dataStart !== -1) {
          const data = url.slice(dataStart + 1);
          dataPrefix = data.length > 10 ? `${data.slice(0, 10)}... [truncated]` : data;
        }
        return `data:${mimeType}${isBase64 ? ",base64" : ""}${dataPrefix ? `,${dataPrefix}` : ""}`;
      }
      return url;
    }

    function addAutoIpAddressToSession(session) {
      if ("aggregates" in session) {
        if (session.attrs?.["ip_address"] === void 0) {
          session.attrs = {
            ...session.attrs,
            ip_address: "{{auto}}"
          };
        }
      } else {
        if (session.ipAddress === void 0) {
          session.ipAddress = "{{auto}}";
        }
      }
    }

    function applySdkMetadata(options, name, names = [name], source = "npm") {
      const sdk = (options._metadata = options._metadata || {}).sdk = options._metadata.sdk || {};
      if (!sdk.name) {
        sdk.name = `sentry.javascript.${name}`;
        sdk.packages = names.map((name2) => ({
          name: `${source}:@sentry/${name2}`,
          version: SDK_VERSION
        }));
        sdk.version = SDK_VERSION;
      }
    }

    function getTraceData(options = {}) {
      const client = options.client || getClient();
      if (!isEnabled() || !client) {
        return {};
      }
      const carrier = getMainCarrier();
      const acs = getAsyncContextStrategy(carrier);
      if (acs.getTraceData) {
        return acs.getTraceData(options);
      }
      const scope = options.scope || getCurrentScope();
      const span = options.span || getActiveSpan();
      const isTwpPlaceholder = spanIsNonRecordingSpan(span) && !hasSpansEnabled(client.getOptions());
      const sentryTrace = span && !isTwpPlaceholder ? spanToTraceHeader(span) : scopeToTraceHeader(scope);
      const dsc = span ? getDynamicSamplingContextFromSpan(span) : getDynamicSamplingContextFromScope(client, scope);
      const baggage = dynamicSamplingContextToSentryBaggageHeader(dsc);
      const isValidSentryTraceHeader = TRACEPARENT_REGEXP.test(sentryTrace);
      if (!isValidSentryTraceHeader) {
        debug.warn("Invalid sentry-trace data. Cannot generate trace data");
        return {};
      }
      const traceData = {
        "sentry-trace": sentryTrace,
        baggage
      };
      if (options.propagateTraceparent) {
        traceData.traceparent = span && !isTwpPlaceholder ? spanToTraceparentHeader(span) : scopeToTraceparentHeader(scope);
      }
      return traceData;
    }
    function scopeToTraceHeader(scope) {
      const { traceId, sampled, propagationSpanId } = scope.getPropagationContext();
      return generateSentryTraceHeader(traceId, propagationSpanId, sampled);
    }
    function scopeToTraceparentHeader(scope) {
      const { traceId, sampled, propagationSpanId } = scope.getPropagationContext();
      return generateTraceparentHeader(traceId, propagationSpanId, sampled);
    }

    const DEFAULT_BREADCRUMBS = 100;
    function addBreadcrumb(breadcrumb, hint) {
      const client = getClient();
      const isolationScope = getIsolationScope();
      if (!client) return;
      const { beforeBreadcrumb = null, maxBreadcrumbs = DEFAULT_BREADCRUMBS } = client.getOptions();
      if (maxBreadcrumbs <= 0) return;
      const timestamp = dateTimestampInSeconds();
      const mergedBreadcrumb = { timestamp, ...breadcrumb };
      const finalBreadcrumb = beforeBreadcrumb ? consoleSandbox(() => beforeBreadcrumb(mergedBreadcrumb, hint)) : mergedBreadcrumb;
      if (finalBreadcrumb === null) return;
      if (client.emit) {
        client.emit("beforeAddBreadcrumb", finalBreadcrumb, hint);
      }
      isolationScope.addBreadcrumb(finalBreadcrumb, maxBreadcrumbs);
    }

    const INTEGRATION_NAME$8 = "FunctionToString";
    const SETUP_CLIENTS = /* @__PURE__ */ new WeakMap();
    const _functionToStringIntegration = (() => {
      return {
        name: INTEGRATION_NAME$8,
        setupOnce() {
          const originalFunctionToString = Function.prototype.toString;
          try {
            Function.prototype.toString = function(...args) {
              const originalFunction = getOriginalFunction(this);
              let unwrappedFunction;
              try {
                if (SETUP_CLIENTS.has(getClient()) && originalFunction !== void 0) {
                  unwrappedFunction = originalFunction;
                }
              } catch {
              }
              return originalFunctionToString.apply(unwrappedFunction ?? this, args);
            };
          } catch {
          }
        },
        setup(client) {
          SETUP_CLIENTS.set(client, true);
        }
      };
    });
    const functionToStringIntegration = defineIntegration(_functionToStringIntegration);

    const DEFAULT_IGNORE_ERRORS = [
      /^Script error\.?$/,
      /^Javascript error: Script error\.? on line 0$/,
      /^ResizeObserver loop completed with undelivered notifications.$/,
      // The browser logs this when a ResizeObserver handler takes a bit longer. Usually this is not an actual issue though. It indicates slowness.
      /^Cannot redefine property: googletag$/,
      // This is thrown when google tag manager is used in combination with an ad blocker
      /^Can't find variable: gmo$/,
      // Error from Google Search App https://issuetracker.google.com/issues/396043331
      /^undefined is not an object \(evaluating 'a\.[A-Z]'\)$/,
      // Random error that happens but not actionable or noticeable to end-users.
      /can't redefine non-configurable property "solana"/,
      // Probably a browser extension or custom browser (Brave) throwing this error
      /vv\(\)\.getRestrictions is not a function/,
      // Error thrown by GTM, seemingly not affecting end-users
      /Can't find variable: _AutofillCallbackHandler/,
      // Unactionable error in instagram webview https://developers.facebook.com/community/threads/320013549791141/
      /Object Not Found Matching Id:\d+, MethodName:simulateEvent/,
      // unactionable error from CEFSharp, a .NET library that embeds chromium in .NET apps
      /Java exception was raised during method invocation$/,
      // error from Facebook Mobile browser (https://github.com/getsentry/sentry-javascript/issues/15065, https://github.com/getsentry/sentry-javascript/issues/23733)
      /Java object is gone$/
      // error from Facebook Mobile browser (https://github.com/getsentry/sentry-javascript/issues/15065, https://github.com/getsentry/sentry-javascript/issues/23733)
    ];
    const INTEGRATION_NAME$7 = "EventFilters";
    const eventFiltersIntegration = defineIntegration((options = {}) => {
      let mergedOptions;
      return {
        name: INTEGRATION_NAME$7,
        setup(client) {
          const clientOptions = client.getOptions();
          mergedOptions = _mergeOptions(options, clientOptions);
        },
        processEvent(event, _hint, client) {
          if (!mergedOptions) {
            const clientOptions = client.getOptions();
            mergedOptions = _mergeOptions(options, clientOptions);
          }
          return _shouldDropEvent$1(event, mergedOptions) ? null : event;
        }
      };
    });
    const inboundFiltersIntegration = defineIntegration(((options = {}) => {
      return {
        ...eventFiltersIntegration(options),
        name: "InboundFilters"
      };
    }));
    function _mergeOptions(internalOptions = {}, clientOptions = {}) {
      return {
        allowUrls: [...internalOptions.allowUrls || [], ...clientOptions.allowUrls || []],
        denyUrls: [...internalOptions.denyUrls || [], ...clientOptions.denyUrls || []],
        ignoreErrors: [
          ...internalOptions.ignoreErrors || [],
          ...clientOptions.ignoreErrors || [],
          ...internalOptions.disableErrorDefaults ? [] : DEFAULT_IGNORE_ERRORS
        ],
        ignoreTransactions: [...internalOptions.ignoreTransactions || [], ...clientOptions.ignoreTransactions || []]
      };
    }
    function _shouldDropEvent$1(event, options) {
      if (!event.type) {
        if (_isIgnoredError(event, options.ignoreErrors)) {
          DEBUG_BUILD$2 && debug.warn(
            `Event dropped due to being matched by \`ignoreErrors\` option.
Event: ${getEventDescription(event)}`
          );
          return true;
        }
        if (_isUselessError(event)) {
          DEBUG_BUILD$2 && debug.warn(
            `Event dropped due to not having an error message, error type or stacktrace.
Event: ${getEventDescription(
          event
        )}`
          );
          return true;
        }
        if (_isDeniedUrl(event, options.denyUrls)) {
          DEBUG_BUILD$2 && debug.warn(
            `Event dropped due to being matched by \`denyUrls\` option.
Event: ${getEventDescription(
          event
        )}.
Url: ${_getEventFilterUrl(event)}`
          );
          return true;
        }
        if (!_isAllowedUrl(event, options.allowUrls)) {
          DEBUG_BUILD$2 && debug.warn(
            `Event dropped due to not being matched by \`allowUrls\` option.
Event: ${getEventDescription(
          event
        )}.
Url: ${_getEventFilterUrl(event)}`
          );
          return true;
        }
      } else if (event.type === "transaction") {
        if (_isIgnoredTransaction(event, options.ignoreTransactions)) {
          DEBUG_BUILD$2 && debug.warn(
            `Event dropped due to being matched by \`ignoreTransactions\` option.
Event: ${getEventDescription(event)}`
          );
          return true;
        }
      }
      return false;
    }
    function _isIgnoredError(event, ignoreErrors) {
      if (!ignoreErrors?.length) {
        return false;
      }
      return getPossibleEventMessages(event).some((message) => stringMatchesSomePattern(message, ignoreErrors));
    }
    function _isIgnoredTransaction(event, ignoreTransactions) {
      if (!ignoreTransactions?.length) {
        return false;
      }
      const name = event.transaction;
      return name ? stringMatchesSomePattern(name, ignoreTransactions) : false;
    }
    function _isDeniedUrl(event, denyUrls) {
      if (!denyUrls?.length) {
        return false;
      }
      const url = _getEventFilterUrl(event);
      return !url ? false : stringMatchesSomePattern(url, denyUrls);
    }
    function _isAllowedUrl(event, allowUrls) {
      if (!allowUrls?.length) {
        return true;
      }
      const url = _getEventFilterUrl(event);
      return !url ? true : stringMatchesSomePattern(url, allowUrls);
    }
    function _getLastValidUrl(frames = []) {
      for (let i = frames.length - 1; i >= 0; i--) {
        const frame = frames[i];
        if (frame && frame.filename !== "<anonymous>" && frame.filename !== "[native code]") {
          return frame.filename || null;
        }
      }
      return null;
    }
    function _getEventFilterUrl(event) {
      try {
        const rootException = [...event.exception?.values ?? []].reverse().find((value) => value.mechanism?.parent_id === void 0 && value.stacktrace?.frames?.length);
        const frames = rootException?.stacktrace?.frames;
        return frames ? _getLastValidUrl(frames) : null;
      } catch {
        DEBUG_BUILD$2 && debug.error(`Cannot extract url for event ${getEventDescription(event)}`);
        return null;
      }
    }
    function _isUselessError(event) {
      if (!event.exception?.values?.length) {
        return false;
      }
      return (
        // No top-level message
        !event.message && // There are no exception values that have a stacktrace, a non-generic-Error type or value
        !event.exception.values.some((value) => value.stacktrace || value.type && value.type !== "Error" || value.value)
      );
    }

    function applyAggregateErrorsToEvent(exceptionFromErrorImplementation, parser, key, limit, event, hint) {
      if (!event.exception?.values || !hint || !isError(hint.originalException)) {
        return;
      }
      const originalException = event.exception.values.length > 0 ? event.exception.values[event.exception.values.length - 1] : void 0;
      if (originalException) {
        event.exception.values = aggregateExceptionsFromError(
          exceptionFromErrorImplementation,
          parser,
          limit,
          hint.originalException,
          key,
          event.exception.values,
          originalException,
          0
        );
      }
    }
    function aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, error, key, prevExceptions, exception, exceptionId) {
      if (prevExceptions.length >= limit + 1) {
        return prevExceptions;
      }
      let newExceptions = [...prevExceptions];
      if (isError(error[key])) {
        applyExceptionGroupFieldsForParentException(exception, exceptionId, error);
        const newException = exceptionFromErrorImplementation(parser, error[key]);
        const newExceptionId = newExceptions.length;
        applyExceptionGroupFieldsForChildException(newException, key, newExceptionId, exceptionId);
        newExceptions = aggregateExceptionsFromError(
          exceptionFromErrorImplementation,
          parser,
          limit,
          error[key],
          key,
          [newException, ...newExceptions],
          newException,
          newExceptionId
        );
      }
      if (isExceptionGroup(error)) {
        error.errors.forEach((childError, i) => {
          if (isError(childError)) {
            applyExceptionGroupFieldsForParentException(exception, exceptionId, error);
            const newException = exceptionFromErrorImplementation(parser, childError);
            const newExceptionId = newExceptions.length;
            applyExceptionGroupFieldsForChildException(newException, `errors[${i}]`, newExceptionId, exceptionId);
            newExceptions = aggregateExceptionsFromError(
              exceptionFromErrorImplementation,
              parser,
              limit,
              childError,
              key,
              [newException, ...newExceptions],
              newException,
              newExceptionId
            );
          }
        });
      }
      return newExceptions;
    }
    function isExceptionGroup(error) {
      return Array.isArray(error.errors);
    }
    function applyExceptionGroupFieldsForParentException(exception, exceptionId, error) {
      exception.mechanism = {
        handled: true,
        type: "auto.core.linked_errors",
        ...isExceptionGroup(error) && { is_exception_group: true },
        ...exception.mechanism,
        exception_id: exceptionId
      };
    }
    function applyExceptionGroupFieldsForChildException(exception, source, exceptionId, parentId) {
      exception.mechanism = {
        handled: true,
        ...exception.mechanism,
        type: "chained",
        source,
        exception_id: exceptionId,
        parent_id: parentId
      };
    }

    function hasSentryFetchUrlHost(error) {
      return isError(error) && "__sentry_fetch_url_host__" in error && typeof error.__sentry_fetch_url_host__ === "string";
    }
    function _enhanceErrorWithSentryInfo(error) {
      if (hasSentryFetchUrlHost(error)) {
        return `${error.message} (${error.__sentry_fetch_url_host__})`;
      }
      return error.message;
    }

    const _filter = /* @__PURE__ */ new Set([]);
    function addConsoleInstrumentationHandler(handler) {
      const type = "console";
      const removeHandler = addHandler$1(type, handler);
      maybeInstrument(type, instrumentConsole);
      return removeHandler;
    }
    const instrumentedLevels = /* @__PURE__ */ new Set();
    function instrumentConsole() {
      if (!("console" in GLOBAL_OBJ)) {
        return;
      }
      CONSOLE_LEVELS.forEach(function(level) {
        if (instrumentedLevels.has(level) || !(level in GLOBAL_OBJ.console)) {
          return;
        }
        instrumentedLevels.add(level);
        fill(GLOBAL_OBJ.console, level, function(originalConsoleMethod) {
          originalConsoleMethods[level] = originalConsoleMethod;
          return function(...args) {
            const firstArg = args[0];
            const log = originalConsoleMethods[level];
            const isFiltered = _filter.size && typeof firstArg === "string" && stringMatchesSomePattern(firstArg, _filter);
            if (!isFiltered) {
              triggerHandlers$1("console", { args, level });
            }
            if (!isFiltered || DEBUG_BUILD$2 && debug.isEnabled()) {
              log?.apply(GLOBAL_OBJ.console, args);
            }
          };
        });
      });
    }

    function severityLevelFromString(level) {
      return level === "warn" ? "warning" : ["fatal", "error", "warning", "log", "info", "debug"].includes(level) ? level : "log";
    }

    const INTEGRATION_NAME$6 = "Dedupe";
    const _dedupeIntegration = (() => {
      let previousEvent;
      return {
        name: INTEGRATION_NAME$6,
        processEvent(currentEvent) {
          if (currentEvent.type) {
            return currentEvent;
          }
          try {
            if (_shouldDropEvent(currentEvent, previousEvent)) {
              DEBUG_BUILD$2 && debug.warn("Event dropped due to being a duplicate of previously captured event.");
              return null;
            }
          } catch {
          }
          return previousEvent = currentEvent;
        }
      };
    });
    const dedupeIntegration = defineIntegration(_dedupeIntegration);
    function _shouldDropEvent(currentEvent, previousEvent) {
      if (!previousEvent) {
        return false;
      }
      if (_isSameMessageEvent(currentEvent, previousEvent)) {
        return true;
      }
      if (_isSameExceptionEvent(currentEvent, previousEvent)) {
        return true;
      }
      return false;
    }
    function _isSameMessageEvent(currentEvent, previousEvent) {
      const currentMessage = currentEvent.message;
      const previousMessage = previousEvent.message;
      if (!currentMessage && !previousMessage) {
        return false;
      }
      if (currentMessage && !previousMessage || !currentMessage && previousMessage) {
        return false;
      }
      if (currentMessage !== previousMessage) {
        return false;
      }
      if (!_isSameFingerprint(currentEvent, previousEvent)) {
        return false;
      }
      if (!_isSameStacktrace(currentEvent, previousEvent)) {
        return false;
      }
      return true;
    }
    function _isSameExceptionEvent(currentEvent, previousEvent) {
      const previousException = _getExceptionFromEvent(previousEvent);
      const currentException = _getExceptionFromEvent(currentEvent);
      if (!previousException || !currentException) {
        return false;
      }
      if (previousException.type !== currentException.type || previousException.value !== currentException.value) {
        return false;
      }
      if (!_isSameFingerprint(currentEvent, previousEvent)) {
        return false;
      }
      if (!_isSameStacktrace(currentEvent, previousEvent)) {
        return false;
      }
      return true;
    }
    function _isSameStacktrace(currentEvent, previousEvent) {
      let currentFrames = getFramesFromEvent(currentEvent);
      let previousFrames = getFramesFromEvent(previousEvent);
      if (!currentFrames && !previousFrames) {
        return true;
      }
      if (currentFrames && !previousFrames || !currentFrames && previousFrames) {
        return false;
      }
      currentFrames = currentFrames;
      previousFrames = previousFrames;
      if (previousFrames.length !== currentFrames.length) {
        return false;
      }
      for (let i = 0; i < previousFrames.length; i++) {
        const frameA = previousFrames[i];
        const frameB = currentFrames[i];
        if (frameA.filename !== frameB.filename || frameA.lineno !== frameB.lineno || frameA.colno !== frameB.colno || frameA.function !== frameB.function) {
          return false;
        }
      }
      return true;
    }
    function _isSameFingerprint(currentEvent, previousEvent) {
      let currentFingerprint = currentEvent.fingerprint;
      let previousFingerprint = previousEvent.fingerprint;
      if (!currentFingerprint && !previousFingerprint) {
        return true;
      }
      if (currentFingerprint && !previousFingerprint || !currentFingerprint && previousFingerprint) {
        return false;
      }
      currentFingerprint = currentFingerprint;
      previousFingerprint = previousFingerprint;
      try {
        return !!(currentFingerprint.join("") === previousFingerprint.join(""));
      } catch {
        return false;
      }
    }
    function _getExceptionFromEvent(event) {
      return event.exception?.values?.[0];
    }

    const INTEGRATION_NAME$5 = "ConversationId";
    const _conversationIdIntegration = (() => {
      return {
        name: INTEGRATION_NAME$5,
        setup(client) {
          client.on("spanStart", (span) => {
            const scopeData = getCurrentScope().getScopeData();
            const isolationScopeData = getIsolationScope().getScopeData();
            const conversationId = scopeData.conversationId || isolationScopeData.conversationId;
            if (conversationId) {
              const { op, data: attributes, description: name } = spanToJSON(span);
              if (!op?.startsWith("gen_ai.") && !attributes["ai.operationId"] && !name?.startsWith("ai.")) {
                return;
              }
              span.setAttribute(GEN_AI_CONVERSATION_ID_ATTRIBUTE, conversationId);
            }
          });
        }
      };
    });
    const conversationIdIntegration = defineIntegration(_conversationIdIntegration);

    function instrumentFetchRequest(handlerData, shouldCreateSpan, shouldAttachHeaders, spans, spanOriginOrOptions) {
      if (!handlerData.fetchData) {
        return void 0;
      }
      const { method, url } = handlerData.fetchData;
      const shouldCreateSpanResult = hasSpansEnabled() && shouldCreateSpan(url);
      if (handlerData.endTimestamp) {
        const spanId = handlerData.fetchData.__span;
        if (!spanId) return;
        const span2 = spans[spanId];
        if (span2) {
          if (shouldCreateSpanResult) {
            endSpan(span2, handlerData);
            _callOnRequestSpanEnd(span2, handlerData, spanOriginOrOptions);
          }
          delete spans[spanId];
        }
        return void 0;
      }
      const { spanOrigin = "auto.http.browser", propagateTraceparent = false } = typeof spanOriginOrOptions === "object" ? spanOriginOrOptions : { spanOrigin: spanOriginOrOptions };
      const client = getClient();
      const hasParent = !!getActiveSpan();
      const shouldEmitSpan = hasParent || !!client && hasSpanStreamingEnabled(client);
      const span = shouldCreateSpanResult && shouldEmitSpan ? startInactiveSpan(getSpanStartOptions(url, method, spanOrigin)) : new SentryNonRecordingSpan();
      const spanForTraceHeaders = spanIsIgnored(span) && hasParent ? void 0 : span;
      if (shouldCreateSpanResult && !shouldEmitSpan) {
        client?.recordDroppedEvent("no_parent_span", "span");
      }
      handlerData.fetchData.__span = span.spanContext().spanId;
      spans[span.spanContext().spanId] = span;
      if (shouldAttachHeaders(handlerData.fetchData.url)) {
        const request = handlerData.args[0];
        const options = { ...handlerData.args[1] || {} };
        const headers = _INTERNAL_getTracingHeadersForFetchRequest(
          request,
          options,
          // If performance is disabled (TWP) or there's no active root span (pageload/navigation/interaction),
          // we do not want to use the span as base for the trace headers,
          // which means that the headers will be generated from the scope and the sampling decision is deferred
          hasSpansEnabled() && shouldEmitSpan ? spanForTraceHeaders : void 0,
          propagateTraceparent
        );
        if (headers) {
          handlerData.args[1] = options;
          options.headers = headers;
        }
      }
      if (client) {
        const fetchHint = {
          input: handlerData.args,
          response: handlerData.response,
          startTimestamp: handlerData.startTimestamp,
          endTimestamp: handlerData.endTimestamp
        };
        client.emit("beforeOutgoingRequestSpan", span, fetchHint);
      }
      return span;
    }
    function _callOnRequestSpanEnd(span, handlerData, spanOriginOrOptions) {
      const onRequestSpanEnd = typeof spanOriginOrOptions === "object" && spanOriginOrOptions !== null ? spanOriginOrOptions.onRequestSpanEnd : void 0;
      onRequestSpanEnd?.(span, {
        headers: handlerData.response?.headers,
        error: handlerData.error
      });
    }
    function _INTERNAL_getTracingHeadersForFetchRequest(request, fetchOptionsObj, span, propagateTraceparent) {
      const traceHeaders = getTraceData({ span, propagateTraceparent });
      const sentryTrace = traceHeaders["sentry-trace"];
      const baggage = traceHeaders.baggage;
      const traceparent = traceHeaders.traceparent;
      if (!sentryTrace) {
        return void 0;
      }
      const originalHeaders = fetchOptionsObj.headers || (isRequest(request) ? request.headers : void 0);
      if (!originalHeaders) {
        return {
          "sentry-trace": sentryTrace,
          ...baggage && { baggage },
          ...traceparent && { traceparent }
        };
      } else if (isHeaders(originalHeaders)) {
        const newHeaders = new Headers(originalHeaders);
        if (!newHeaders.get("sentry-trace")) {
          newHeaders.set("sentry-trace", sentryTrace);
        }
        if (propagateTraceparent && traceparent && !newHeaders.get("traceparent")) {
          newHeaders.set("traceparent", traceparent);
        }
        if (baggage) {
          const prevBaggageHeader = newHeaders.get("baggage");
          if (!prevBaggageHeader) {
            newHeaders.set("baggage", baggage);
          } else if (!baggageHeaderHasSentryBaggageValues(prevBaggageHeader)) {
            newHeaders.set("baggage", `${prevBaggageHeader},${baggage}`);
          }
        }
        return newHeaders;
      } else if (isHeadersInitTupleArray(originalHeaders)) {
        const newHeaders = [...originalHeaders];
        if (!newHeaders.find((header) => header[0] === "sentry-trace")) {
          newHeaders.push(["sentry-trace", sentryTrace]);
        }
        if (propagateTraceparent && traceparent && !newHeaders.find((header) => header[0] === "traceparent")) {
          newHeaders.push(["traceparent", traceparent]);
        }
        const prevBaggageHeaderWithSentryValues = originalHeaders.find(
          (header) => header[0] === "baggage" && typeof header[1] === "string" && baggageHeaderHasSentryBaggageValues(header[1])
        );
        if (baggage && !prevBaggageHeaderWithSentryValues) {
          newHeaders.push(["baggage", baggage]);
        }
        return newHeaders;
      } else {
        const existingSentryTraceHeader = "sentry-trace" in originalHeaders ? originalHeaders["sentry-trace"] : void 0;
        const existingTraceparentHeader = "traceparent" in originalHeaders ? originalHeaders.traceparent : void 0;
        const existingBaggageHeader = "baggage" in originalHeaders ? originalHeaders.baggage : void 0;
        const newBaggageHeaders = existingBaggageHeader ? Array.isArray(existingBaggageHeader) ? [...existingBaggageHeader] : [existingBaggageHeader] : [];
        const prevBaggageHeaderWithSentryValues = existingBaggageHeader && (Array.isArray(existingBaggageHeader) ? existingBaggageHeader.find((headerItem) => baggageHeaderHasSentryBaggageValues(headerItem)) : baggageHeaderHasSentryBaggageValues(existingBaggageHeader));
        if (baggage && !prevBaggageHeaderWithSentryValues) {
          newBaggageHeaders.push(baggage);
        }
        const newHeaders = Object.assign({}, originalHeaders, {
          "sentry-trace": existingSentryTraceHeader ?? sentryTrace,
          ...newBaggageHeaders.length > 0 && { baggage: newBaggageHeaders.join(",") }
        });
        if (propagateTraceparent && traceparent && !existingTraceparentHeader) {
          newHeaders.traceparent = traceparent;
        }
        return newHeaders;
      }
    }
    function endSpan(span, handlerData) {
      if (handlerData.response) {
        setHttpStatus(span, handlerData.response.status);
        const contentLength = handlerData.response?.headers?.get("content-length");
        if (contentLength) {
          const contentLengthNum = parseInt(contentLength);
          if (contentLengthNum > 0) {
            span.setAttribute("http.response_content_length", contentLengthNum);
          }
        }
      } else if (handlerData.error) {
        span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
      }
      span.end();
    }
    function baggageHeaderHasSentryBaggageValues(baggageHeader) {
      if (typeof baggageHeader !== "string") {
        return false;
      }
      return baggageHeader.split(",").some((baggageEntry) => baggageEntry.trim().startsWith(SENTRY_BAGGAGE_KEY_PREFIX));
    }
    function isHeaders(headers) {
      return typeof Headers !== "undefined" && isInstanceOf(headers, Headers);
    }
    function isHeadersInitTupleArray(headers) {
      if (!Array.isArray(headers)) {
        return false;
      }
      return headers.every(
        (item) => Array.isArray(item) && item.length === 2 && typeof item[0] === "string"
      );
    }
    function getSpanStartOptions(url, method, spanOrigin) {
      if (url.startsWith("data:")) {
        const sanitizedUrl2 = stripDataUrlContent(url);
        return {
          name: `${method} ${sanitizedUrl2}`,
          attributes: getFetchSpanAttributes(url, void 0, method, spanOrigin)
        };
      }
      const parsedUrl = parseStringToURLObject(url);
      const sanitizedUrl = parsedUrl ? getSanitizedUrlStringFromUrlObject(parsedUrl) : url;
      return {
        name: `${method} ${sanitizedUrl}`,
        attributes: getFetchSpanAttributes(url, parsedUrl, method, spanOrigin)
      };
    }
    function getFetchSpanAttributes(url, parsedUrl, method, spanOrigin) {
      const attributes = {
        url: stripDataUrlContent(url),
        type: "fetch",
        "http.method": method,
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: spanOrigin,
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "http.client"
      };
      if (parsedUrl) {
        if (!isURLObjectRelative(parsedUrl)) {
          attributes[ws] = stripDataUrlContent(parsedUrl.href);
          attributes[Yu] = stripDataUrlContent(parsedUrl.href);
          attributes["server.address"] = parsedUrl.host;
        }
        if (parsedUrl.search) {
          attributes["http.query"] = parsedUrl.search;
        }
        if (parsedUrl.hash) {
          attributes["http.fragment"] = parsedUrl.hash;
        }
      }
      return attributes;
    }

    function getBreadcrumbLogLevelFromHttpStatusCode(statusCode) {
      if (statusCode === void 0) {
        return void 0;
      } else if (statusCode >= 400 && statusCode < 500) {
        return "warning";
      } else if (statusCode >= 500) {
        return "error";
      } else {
        return void 0;
      }
    }

    const WINDOW$3 = GLOBAL_OBJ;
    function supportsHistory() {
      return "history" in WINDOW$3 && !!WINDOW$3.history;
    }
    function _isFetchSupported() {
      if (!("fetch" in WINDOW$3)) {
        return false;
      }
      try {
        new Headers();
        new Request("data:,");
        new Response();
        return true;
      } catch {
        return false;
      }
    }
    function isNativeFunction(func) {
      return func && /^function\s+\w+\(\)\s+\{\s+\[native code\]\s+\}$/.test(func.toString());
    }
    function supportsNativeFetch() {
      if (typeof EdgeRuntime === "string") {
        return true;
      }
      if (!_isFetchSupported()) {
        return false;
      }
      if (isNativeFunction(WINDOW$3.fetch)) {
        return true;
      }
      let result = false;
      const doc = WINDOW$3.document;
      if (doc && typeof doc.createElement === "function") {
        try {
          const sandbox = doc.createElement("iframe");
          sandbox.hidden = true;
          doc.head.appendChild(sandbox);
          if (sandbox.contentWindow?.fetch) {
            result = isNativeFunction(sandbox.contentWindow.fetch);
          }
          doc.head.removeChild(sandbox);
        } catch (err) {
          DEBUG_BUILD$2 && debug.warn("Could not create sandbox iframe for pure fetch check, bailing to window.fetch: ", err);
        }
      }
      return result;
    }

    function addFetchInstrumentationHandler(handler, skipNativeFetchCheck) {
      const type = "fetch";
      const removeHandler = addHandler$1(type, handler);
      maybeInstrument(type, () => instrumentFetch(void 0, skipNativeFetchCheck));
      return removeHandler;
    }
    function addFetchEndInstrumentationHandler(handler) {
      const type = "fetch-body-resolved";
      const removeHandler = addHandler$1(type, handler);
      maybeInstrument(type, () => instrumentFetch(streamHandler));
      return removeHandler;
    }
    function instrumentFetch(onFetchResolved, skipNativeFetchCheck = false) {
      if (skipNativeFetchCheck && !supportsNativeFetch()) {
        return;
      }
      fill(GLOBAL_OBJ, "fetch", function(originalFetch) {
        return function(...args) {
          const virtualError = new Error();
          const { method, url } = parseFetchArgs(args);
          const handlerData = {
            args,
            fetchData: {
              method,
              url
            },
            startTimestamp: timestampInSeconds() * 1e3,
            // // Adding the error to be able to fingerprint the failed fetch event in HttpClient instrumentation
            virtualError,
            headers: getHeadersFromFetchArgs(args)
          };
          if (!onFetchResolved) {
            triggerHandlers$1("fetch", {
              ...handlerData
            });
          }
          return originalFetch.apply(GLOBAL_OBJ, args).then(
            async (response) => {
              if (onFetchResolved) {
                onFetchResolved(response);
              } else {
                triggerHandlers$1("fetch", {
                  ...handlerData,
                  endTimestamp: timestampInSeconds() * 1e3,
                  response
                });
              }
              return response;
            },
            (error) => {
              triggerHandlers$1("fetch", {
                ...handlerData,
                endTimestamp: timestampInSeconds() * 1e3,
                error
              });
              if (isError(error) && error.stack === void 0) {
                error.stack = virtualError.stack;
                addNonEnumerableProperty(error, "framesToPop", 1);
              }
              const client = getClient();
              const enhanceOption = client?.getOptions().enhanceFetchErrorMessages ?? "always";
              const shouldEnhance = enhanceOption !== false;
              if (shouldEnhance && isError(error) && error.name === "TypeError" && (error.message === "Failed to fetch" || error.message === "Load failed" || error.message === "NetworkError when attempting to fetch resource.")) {
                try {
                  const url2 = new URL(handlerData.fetchData.url);
                  const hostname = url2.host;
                  if (enhanceOption === "always") {
                    error.message = `${error.message} (${hostname})`;
                  } else {
                    addNonEnumerableProperty(error, "__sentry_fetch_url_host__", hostname);
                  }
                } catch {
                }
              }
              throw error;
            }
          );
        };
      });
    }
    async function resolveResponse(res, onFinishedResolving) {
      if (res?.body) {
        const body = res.body;
        const responseReader = body.getReader();
        const maxFetchDurationTimeout = setTimeout(
          () => {
            body.cancel().then(null, () => {
            });
          },
          90 * 1e3
          // 90s
        );
        let readingActive = true;
        while (readingActive) {
          let chunkTimeout;
          try {
            chunkTimeout = setTimeout(() => {
              body.cancel().then(null, () => {
              });
            }, 5e3);
            const { done } = await responseReader.read();
            clearTimeout(chunkTimeout);
            if (done) {
              onFinishedResolving();
              readingActive = false;
            }
          } catch {
            readingActive = false;
          } finally {
            clearTimeout(chunkTimeout);
          }
        }
        clearTimeout(maxFetchDurationTimeout);
        responseReader.releaseLock();
        body.cancel().then(null, () => {
        });
      }
    }
    function streamHandler(response) {
      let clonedResponseForResolving;
      try {
        clonedResponseForResolving = response.clone();
      } catch {
        return;
      }
      resolveResponse(clonedResponseForResolving, () => {
        triggerHandlers$1("fetch-body-resolved", {
          endTimestamp: timestampInSeconds() * 1e3,
          response
        });
      });
    }
    function hasProp(obj, prop) {
      return isObjectLike(obj) && !!obj[prop];
    }
    function getUrlFromResource(resource) {
      if (typeof resource === "string") {
        return resource;
      }
      if (!resource) {
        return "";
      }
      if (hasProp(resource, "url")) {
        return resource.url;
      }
      if (resource.toString) {
        return resource.toString();
      }
      return "";
    }
    function parseFetchArgs(fetchArgs) {
      if (fetchArgs.length === 0) {
        return { method: "GET", url: "" };
      }
      if (fetchArgs.length === 2) {
        const [resource, options] = fetchArgs;
        return {
          url: getUrlFromResource(resource),
          method: hasProp(options, "method") ? String(options.method).toUpperCase() : (
            // Request object as first argument
            isRequest(resource) && hasProp(resource, "method") ? String(resource.method).toUpperCase() : "GET"
          )
        };
      }
      const arg = fetchArgs[0];
      return {
        url: getUrlFromResource(arg),
        method: hasProp(arg, "method") ? String(arg.method).toUpperCase() : "GET"
      };
    }
    function getHeadersFromFetchArgs(fetchArgs) {
      const [requestArgument, optionsArgument] = fetchArgs;
      try {
        if (typeof optionsArgument === "object" && optionsArgument !== null && "headers" in optionsArgument && optionsArgument.headers) {
          return new Headers(optionsArgument.headers);
        }
        if (isRequest(requestArgument)) {
          return new Headers(requestArgument.headers);
        }
      } catch {
      }
      return;
    }

    const WINDOW$2 = GLOBAL_OBJ;
    function getLocationHref() {
      try {
        return WINDOW$2.document.location.href;
      } catch {
        return "";
      }
    }
    function getComponentName(elem, maxTraverseHeight = 5) {
      if (!WINDOW$2.HTMLElement) {
        return null;
      }
      let currentElem = elem;
      for (let i = 0; i < maxTraverseHeight; i++) {
        if (!currentElem) {
          return null;
        }
        if (currentElem instanceof HTMLElement) {
          if (currentElem.dataset["sentryComponent"]) {
            return currentElem.dataset["sentryComponent"];
          }
          if (currentElem.dataset["sentryElement"]) {
            return currentElem.dataset["sentryElement"];
          }
        }
        currentElem = currentElem.parentNode;
      }
      return null;
    }

    const WINDOW$1 = GLOBAL_OBJ;
    let ignoreOnError = 0;
    function shouldIgnoreOnError() {
      return ignoreOnError > 0;
    }
    function ignoreNextOnError() {
      ignoreOnError++;
      setTimeout(() => {
        ignoreOnError--;
      });
    }
    function wrap(fn, options = {}) {
      function isFunction(fn2) {
        return typeof fn2 === "function";
      }
      if (!isFunction(fn)) {
        return fn;
      }
      try {
        const hasOwnWrapper = Object.prototype.hasOwnProperty.call(fn, "__sentry_wrapped__");
        if (hasOwnWrapper) {
          const wrapper = fn.__sentry_wrapped__;
          if (typeof wrapper === "function") {
            return wrapper;
          } else {
            return fn;
          }
        }
        if (getOriginalFunction(fn)) {
          return fn;
        }
      } catch {
        return fn;
      }
      const sentryWrapped = function(...args) {
        GLOBAL_OBJ._sentryWrappedDepth = (GLOBAL_OBJ._sentryWrappedDepth || 0) + 1;
        try {
          const wrappedArguments = args.map((arg) => wrap(arg, options));
          return fn.apply(this, wrappedArguments);
        } catch (ex) {
          ignoreNextOnError();
          withScope((scope) => {
            scope.addEventProcessor((event) => {
              if (options.mechanism) {
                addExceptionTypeValue(event, void 0);
                addExceptionMechanism(event, options.mechanism);
              }
              event.extra = {
                ...event.extra,
                arguments: args
              };
              return event;
            });
            captureException(ex);
          });
          throw ex;
        } finally {
          GLOBAL_OBJ._sentryWrappedDepth = (GLOBAL_OBJ._sentryWrappedDepth || 0) - 1;
        }
      };
      try {
        for (const property in fn) {
          if (Object.prototype.hasOwnProperty.call(fn, property)) {
            sentryWrapped[property] = fn[property];
          }
        }
      } catch {
      }
      markFunctionWrapped(sentryWrapped, fn);
      addNonEnumerableProperty(fn, "__sentry_wrapped__", sentryWrapped);
      try {
        const descriptor = Object.getOwnPropertyDescriptor(sentryWrapped, "name");
        if (descriptor.configurable) {
          Object.defineProperty(sentryWrapped, "name", {
            get() {
              return fn.name;
            }
          });
        }
      } catch {
      }
      return sentryWrapped;
    }
    function getHttpRequestData() {
      const url = getLocationHref();
      const { referrer } = WINDOW$1.document || {};
      const { userAgent } = WINDOW$1.navigator || {};
      const headers = {
        ...referrer && { Referer: referrer },
        ...userAgent && { "User-Agent": userAgent }
      };
      const request = {
        url,
        headers
      };
      return request;
    }

    function exceptionFromError(stackParser, ex) {
      const frames = parseStackFrames(stackParser, ex);
      const exception = {
        type: extractType(ex),
        value: extractMessage(ex)
      };
      if (frames.length) {
        exception.stacktrace = { frames };
      }
      if (exception.type === void 0 && exception.value === "") {
        exception.value = "Unrecoverable error caught";
      }
      return exception;
    }
    function eventFromPlainObject(stackParser, exception, syntheticException, isUnhandledRejection) {
      const client = getClient();
      const normalizeDepth = client?.getOptions().normalizeDepth;
      const errorFromProp = getErrorPropertyFromObject(exception);
      const extra = {
        __serialized__: normalizeToSize(exception, normalizeDepth)
      };
      if (errorFromProp) {
        return {
          exception: {
            values: [exceptionFromError(stackParser, errorFromProp)]
          },
          extra
        };
      }
      const event = {
        exception: {
          values: [
            {
              type: isEvent(exception) ? exception.constructor.name : isUnhandledRejection ? "UnhandledRejection" : "Error",
              value: getNonErrorObjectExceptionValue(exception, { isUnhandledRejection })
            }
          ]
        },
        extra
      };
      if (syntheticException) {
        const frames = parseStackFrames(stackParser, syntheticException);
        if (frames.length) {
          event.exception.values[0].stacktrace = { frames };
        }
      }
      return event;
    }
    function eventFromError(stackParser, ex) {
      return {
        exception: {
          values: [exceptionFromError(stackParser, ex)]
        }
      };
    }
    function parseStackFrames(stackParser, ex) {
      const stacktrace = ex.stacktrace || ex.stack || "";
      const skipLines = getSkipFirstStackStringLines(ex);
      const framesToPop = getPopFirstTopFrames(ex);
      try {
        return stackParser(stacktrace, skipLines, framesToPop);
      } catch {
      }
      return [];
    }
    const reactMinifiedRegexp = /Minified React error #\d+;/i;
    function getSkipFirstStackStringLines(ex) {
      if (ex && reactMinifiedRegexp.test(ex.message)) {
        return 1;
      }
      return 0;
    }
    function getPopFirstTopFrames(ex) {
      if (typeof ex.framesToPop === "number") {
        return ex.framesToPop;
      }
      return 0;
    }
    function isWebAssemblyException(exception) {
      if (typeof WebAssembly !== "undefined" && typeof WebAssembly.Exception !== "undefined") {
        return exception instanceof WebAssembly.Exception;
      } else {
        return false;
      }
    }
    function extractType(ex) {
      const name = ex?.name;
      if (!name && isWebAssemblyException(ex)) {
        const hasTypeInMessage = ex.message && Array.isArray(ex.message) && ex.message.length == 2;
        return hasTypeInMessage ? ex.message[0] : "WebAssembly.Exception";
      }
      return name;
    }
    function extractMessage(ex) {
      const message = ex?.message;
      if (isWebAssemblyException(ex)) {
        if (Array.isArray(ex.message) && ex.message.length == 2) {
          return ex.message[1];
        }
        return "wasm exception";
      }
      if (!message) {
        return "No error message";
      }
      if (message.error && typeof message.error.message === "string") {
        return _enhanceErrorWithSentryInfo(message.error);
      }
      return _enhanceErrorWithSentryInfo(ex);
    }
    function eventFromException(stackParser, exception, hint, attachStacktrace) {
      const syntheticException = hint?.syntheticException || void 0;
      const event = eventFromUnknownInput(stackParser, exception, syntheticException, attachStacktrace);
      addExceptionMechanism(event);
      event.level = "error";
      if (hint?.event_id) {
        event.event_id = hint.event_id;
      }
      return resolvedSyncPromise(event);
    }
    function eventFromMessage(stackParser, message, level = "info", hint, attachStacktrace) {
      const syntheticException = hint?.syntheticException || void 0;
      const event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
      event.level = level;
      if (hint?.event_id) {
        event.event_id = hint.event_id;
      }
      return resolvedSyncPromise(event);
    }
    function eventFromUnknownInput(stackParser, exception, syntheticException, attachStacktrace, isUnhandledRejection) {
      let event;
      if (isErrorEvent$1(exception) && exception.error) {
        const errorEvent = exception;
        return eventFromError(stackParser, errorEvent.error);
      }
      if (isDOMError(exception) || isDOMException(exception)) {
        const domException = exception;
        if ("stack" in exception) {
          event = eventFromError(stackParser, exception);
          const firstException = event.exception?.values?.[0];
          if (attachStacktrace && syntheticException && firstException && !firstException.stacktrace) {
            const frames = parseStackFrames(stackParser, syntheticException);
            if (frames.length) {
              firstException.stacktrace = { frames };
              addExceptionMechanism(event, { synthetic: true });
            }
          }
        } else {
          const name = domException.name || (isDOMError(domException) ? "DOMError" : "DOMException");
          const message = domException.message ? `${name}: ${domException.message}` : name;
          event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
          addExceptionTypeValue(event, message);
        }
        if ("code" in domException) {
          event.tags = { ...event.tags, "DOMException.code": `${domException.code}` };
        }
        return event;
      }
      if (isError(exception)) {
        return eventFromError(stackParser, exception);
      }
      if (isPlainObject(exception) || isEvent(exception)) {
        const objectException = exception;
        event = eventFromPlainObject(stackParser, objectException, syntheticException, isUnhandledRejection);
        addExceptionMechanism(event, {
          synthetic: true
        });
        return event;
      }
      event = eventFromString(stackParser, exception, syntheticException, attachStacktrace);
      addExceptionTypeValue(event, `${exception}`);
      addExceptionMechanism(event, {
        synthetic: true
      });
      return event;
    }
    function eventFromString(stackParser, message, syntheticException, attachStacktrace) {
      const event = {};
      if (attachStacktrace && syntheticException) {
        const frames = parseStackFrames(stackParser, syntheticException);
        if (frames.length) {
          event.exception = {
            values: [{ value: message, stacktrace: { frames } }]
          };
        }
        addExceptionMechanism(event, { synthetic: true });
      }
      if (isParameterizedString(message)) {
        const { __sentry_template_string__, __sentry_template_values__ } = message;
        event.logentry = {
          message: __sentry_template_string__,
          params: __sentry_template_values__
        };
        return event;
      }
      event.message = message;
      return event;
    }
    function getNonErrorObjectExceptionValue(exception, { isUnhandledRejection }) {
      const keys = extractExceptionKeysForMessage(exception);
      const captureType = isUnhandledRejection ? "promise rejection" : "exception";
      if (isErrorEvent$1(exception)) {
        return `Event \`ErrorEvent\` captured as ${captureType} with message \`${exception.message}\``;
      }
      if (isEvent(exception)) {
        const className = getObjectClassName(exception);
        return `Event \`${className}\` (type=${exception.type}) captured as ${captureType}`;
      }
      return `Object captured as ${captureType} with keys: ${keys}`;
    }
    function getObjectClassName(obj) {
      try {
        const prototype = Object.getPrototypeOf(obj);
        return prototype ? prototype.constructor.name : void 0;
      } catch {
      }
    }
    function getErrorPropertyFromObject(obj) {
      return Object.values(obj).find(isError);
    }

    class BrowserClient extends Client {
      /**
       * Creates a new Browser SDK instance.
       *
       * @param options Configuration options for this SDK.
       */
      constructor(options) {
        const opts = applyDefaultOptions(options);
        const sdkSource = WINDOW$1.SENTRY_SDK_SOURCE || getSDKSource();
        applySdkMetadata(opts, "browser", ["browser"], sdkSource);
        super(opts);
        const { userInfo } = this.getDataCollectionOptions();
        if (opts._metadata?.sdk) {
          opts._metadata.sdk.settings = {
            // Only allow IP inferral by Relay if the user opted in via dataCollection
            infer_ip: userInfo ? "auto" : "never",
            // purposefully allowing already passed settings to override the default
            ...opts._metadata.sdk.settings
          };
        }
        const { sendClientReports } = this._options;
        if (WINDOW$1.document) {
          WINDOW$1.document.addEventListener("visibilitychange", () => {
            if (WINDOW$1.document.visibilityState === "hidden") {
              if (sendClientReports) {
                this._flushOutcomes();
              }
              queueMicrotask(() => {
                void this.flush();
              });
            }
          });
        }
        if (userInfo) {
          this.on("beforeSendSession", addAutoIpAddressToSession);
        }
      }
      /**
       * @inheritDoc
       */
      eventFromException(exception, hint) {
        return eventFromException(this._options.stackParser, exception, hint, this._options.attachStacktrace);
      }
      /**
       * @inheritDoc
       */
      eventFromMessage(message, level = "info", hint) {
        return eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace);
      }
      /**
       * @inheritDoc
       */
      _prepareEvent(event, hint, currentScope, isolationScope) {
        event.platform = event.platform || "javascript";
        return super._prepareEvent(event, hint, currentScope, isolationScope);
      }
    }
    function applyDefaultOptions(optionsArg) {
      return {
        release: typeof __SENTRY_RELEASE__ === "string" ? __SENTRY_RELEASE__ : WINDOW$1.SENTRY_RELEASE?.id,
        // This supports the variable that sentry-webpack-plugin injects
        sendClientReports: true,
        // We default this to true, as it is the safer scenario
        parentSpanIsAlwaysRootSpan: true,
        ...optionsArg
      };
    }

    const DEBUG_BUILD$1 = (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__);

    const WINDOW = GLOBAL_OBJ;

    const getRating = (value, thresholds) => {
      if (value > thresholds[1]) {
        return "poor";
      }
      if (value > thresholds[0]) {
        return "needs-improvement";
      }
      return "good";
    };
    const bindReporter = (callback, metric, thresholds, reportAllChanges) => {
      let prevValue;
      let delta;
      return (forceReport) => {
        if (metric.value >= 0) {
          if (forceReport || reportAllChanges) {
            delta = metric.value - (prevValue ?? 0);
            if (delta || prevValue === void 0) {
              prevValue = metric.value;
              metric.delta = delta;
              metric.rating = getRating(metric.value, thresholds);
              callback(metric);
            }
          }
        }
      };
    };

    const getNavigationEntry = (checkResponseStart = true) => {
      const navigationEntry = WINDOW.performance?.getEntriesByType?.("navigation")[0];
      if (
        // sentry-specific change:
        // We don't want to check for responseStart for our own use of `getNavigationEntry`
        !checkResponseStart || navigationEntry && navigationEntry.responseStart > 0 && navigationEntry.responseStart < performance.now()
      ) {
        return navigationEntry;
      }
    };

    const getActivationStart = () => {
      const navEntry = getNavigationEntry();
      return navEntry?.activationStart ?? 0;
    };

    function addPageListener(type, listener, options) {
      if (WINDOW.document) {
        WINDOW.addEventListener(type, listener, options);
      }
    }
    function removePageListener(type, listener, options) {
      if (WINDOW.document) {
        WINDOW.removeEventListener(type, listener, options);
      }
    }

    let firstHiddenTime = -1;
    const onHiddenFunctions = /* @__PURE__ */ new Set();
    const initHiddenTime = () => {
      return WINDOW.document?.visibilityState === "hidden" && !WINDOW.document?.prerendering ? 0 : Infinity;
    };
    const onVisibilityUpdate = (event) => {
      if (isPageHidden(event) && firstHiddenTime > -1) {
        if (event.type === "visibilitychange" || event.type === "pagehide") {
          for (const onHiddenFunction of onHiddenFunctions) {
            onHiddenFunction();
          }
        }
        if (!isFinite(firstHiddenTime)) {
          firstHiddenTime = event.type === "visibilitychange" ? event.timeStamp : 0;
          removePageListener("prerenderingchange", onVisibilityUpdate, true);
        }
      }
    };
    const getVisibilityWatcher = () => {
      if (WINDOW.document && firstHiddenTime < 0) {
        const activationStart = getActivationStart();
        const firstVisibilityStateHiddenTime = !WINDOW.document.prerendering ? globalThis.performance.getEntriesByType("visibility-state").filter((e) => e.name === "hidden" && e.startTime > activationStart)[0]?.startTime : void 0;
        firstHiddenTime = firstVisibilityStateHiddenTime ?? initHiddenTime();
        addPageListener("visibilitychange", onVisibilityUpdate, true);
        addPageListener("pagehide", onVisibilityUpdate, true);
        addPageListener("prerenderingchange", onVisibilityUpdate, true);
      }
      return {
        get firstHiddenTime() {
          return firstHiddenTime;
        },
        onHidden(cb) {
          onHiddenFunctions.add(cb);
        }
      };
    };
    function isPageHidden(event) {
      return event.type === "pagehide" || WINDOW.document?.visibilityState === "hidden";
    }

    const generateUniqueID = () => {
      return `v5-${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`;
    };

    const initMetric = (name, value = -1) => {
      const navEntry = getNavigationEntry();
      let navigationType = "navigate";
      if (navEntry) {
        if (WINDOW.document?.prerendering || getActivationStart() > 0) {
          navigationType = "prerender";
        } else if (WINDOW.document?.wasDiscarded) {
          navigationType = "restore";
        } else if (navEntry.type) {
          navigationType = navEntry.type.replace(/_/g, "-");
        }
      }
      const entries = [];
      return {
        name,
        value,
        rating: "good",
        // If needed, will be updated when reported. `const` to keep the type from widening to `string`.
        delta: 0,
        entries,
        id: generateUniqueID(),
        navigationType
      };
    };

    const instanceMap = /* @__PURE__ */ new WeakMap();
    function initUnique(identityObj, ClassObj) {
      try {
        if (!instanceMap.get(identityObj)) {
          instanceMap.set(identityObj, new ClassObj());
        }
        return instanceMap.get(identityObj);
      } catch (_e) {
        return new ClassObj();
      }
    }

    class LayoutShiftManager {
      constructor() {
        // oxlint-disable-next-line sdk/no-class-field-initializers
        this._sessionValue = 0;
        // oxlint-disable-next-line sdk/no-class-field-initializers
        this._sessionEntries = [];
      }
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      _processEntry(entry) {
        if (entry.hadRecentInput) return;
        const firstSessionEntry = this._sessionEntries[0];
        const lastSessionEntry = this._sessionEntries[this._sessionEntries.length - 1];
        if (this._sessionValue && firstSessionEntry && lastSessionEntry && entry.startTime - lastSessionEntry.startTime < 1e3 && entry.startTime - firstSessionEntry.startTime < 5e3) {
          this._sessionValue += entry.value;
          this._sessionEntries.push(entry);
        } else {
          this._sessionValue = entry.value;
          this._sessionEntries = [entry];
        }
        this._onAfterProcessingUnexpectedShift?.(entry);
      }
    }

    const observe = (type, callback, opts = {}) => {
      try {
        if (PerformanceObserver.supportedEntryTypes.includes(type)) {
          const po = new PerformanceObserver((list) => {
            Promise.resolve().then(() => {
              callback(list.getEntries());
            });
          });
          po.observe({ type, buffered: true, ...opts });
          return po;
        }
      } catch {
      }
      return;
    };

    const runOnce = (cb) => {
      let called = false;
      return () => {
        if (!called) {
          cb();
          called = true;
        }
      };
    };

    const whenActivated = (callback) => {
      if (WINDOW.document?.prerendering) {
        addEventListener("prerenderingchange", () => callback(), true);
      } else {
        callback();
      }
    };

    const FCPThresholds = [1800, 3e3];
    const onFCP = (onReport, opts = {}) => {
      whenActivated(() => {
        const visibilityWatcher = getVisibilityWatcher();
        const metric = initMetric("FCP");
        let report;
        const handleEntries = (entries) => {
          for (const entry of entries) {
            if (entry.name === "first-contentful-paint") {
              po.disconnect();
              if (entry.startTime < visibilityWatcher.firstHiddenTime) {
                metric.value = Math.max(entry.startTime - getActivationStart(), 0);
                metric.entries.push(entry);
                report(true);
              }
            }
          }
        };
        const po = observe("paint", handleEntries);
        if (po) {
          report = bindReporter(onReport, metric, FCPThresholds, opts.reportAllChanges);
        }
      });
    };

    const CLSThresholds = [0.1, 0.25];
    const onCLS = (onReport, opts = {}) => {
      onFCP(
        runOnce(() => {
          const metric = initMetric("CLS", 0);
          let report;
          const visibilityWatcher = getVisibilityWatcher();
          const layoutShiftManager = initUnique(opts, LayoutShiftManager);
          const handleEntries = (entries) => {
            for (const entry of entries) {
              layoutShiftManager._processEntry(entry);
            }
            if (layoutShiftManager._sessionValue > metric.value) {
              metric.value = layoutShiftManager._sessionValue;
              metric.entries = layoutShiftManager._sessionEntries;
              report();
            }
          };
          const po = observe("layout-shift", handleEntries);
          if (po) {
            report = bindReporter(onReport, metric, CLSThresholds, opts.reportAllChanges);
            visibilityWatcher.onHidden(() => {
              handleEntries(po.takeRecords());
              report(true);
            });
            WINDOW?.setTimeout?.(report);
          }
        })
      );
    };

    let interactionCountEstimate = 0;
    let minKnownInteractionId = Infinity;
    let maxKnownInteractionId = 0;
    const updateEstimate = (entries) => {
      entries.forEach((e) => {
        if (e.interactionId) {
          minKnownInteractionId = Math.min(minKnownInteractionId, e.interactionId);
          maxKnownInteractionId = Math.max(maxKnownInteractionId, e.interactionId);
          interactionCountEstimate = maxKnownInteractionId ? (maxKnownInteractionId - minKnownInteractionId) / 7 + 1 : 0;
        }
      });
    };
    let po;
    const getInteractionCount = () => {
      return po ? interactionCountEstimate : performance.interactionCount || 0;
    };
    const initInteractionCountPolyfill = () => {
      if ("interactionCount" in performance || po) return;
      po = observe("event", updateEstimate, {
        type: "event",
        buffered: true,
        durationThreshold: 0
      });
    };

    const MAX_INTERACTIONS_TO_CONSIDER = 10;
    let prevInteractionCount = 0;
    const getInteractionCountForNavigation = () => {
      return getInteractionCount() - prevInteractionCount;
    };
    class InteractionManager {
      constructor() {
        /**
         * A list of longest interactions on the page (by latency) sorted so the
         * longest one is first. The list is at most MAX_INTERACTIONS_TO_CONSIDER
         * long.
         */
        // oxlint-disable-next-line sdk/no-class-field-initializers
        this._longestInteractionList = [];
        /**
         * A mapping of longest interactions by their interaction ID.
         * This is used for faster lookup.
         */
        // oxlint-disable-next-line sdk/no-class-field-initializers
        this._longestInteractionMap = /* @__PURE__ */ new Map();
      }
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility, jsdoc/require-jsdoc
      _resetInteractions() {
        prevInteractionCount = getInteractionCount();
        this._longestInteractionList.length = 0;
        this._longestInteractionMap.clear();
      }
      /**
       * Returns the estimated p98 longest interaction based on the stored
       * interaction candidates and the interaction count for the current page.
       */
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      _estimateP98LongestInteraction() {
        const candidateInteractionIndex = Math.min(
          this._longestInteractionList.length - 1,
          Math.floor(getInteractionCountForNavigation() / 50)
        );
        return this._longestInteractionList[candidateInteractionIndex];
      }
      /**
       * Takes a performance entry and adds it to the list of worst interactions
       * if its duration is long enough to make it among the worst. If the
       * entry is part of an existing interaction, it is merged and the latency
       * and entries list is updated as needed.
       */
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
      _processEntry(entry) {
        this._onBeforeProcessingEntry?.(entry);
        if (!(entry.interactionId || entry.entryType === "first-input")) return;
        const minLongestInteraction = this._longestInteractionList.at(-1);
        let interaction = this._longestInteractionMap.get(entry.interactionId);
        if (interaction || this._longestInteractionList.length < MAX_INTERACTIONS_TO_CONSIDER || // If the above conditions are false, `minLongestInteraction` will be set.
        entry.duration > minLongestInteraction._latency) {
          if (interaction) {
            if (entry.duration > interaction._latency) {
              interaction.entries = [entry];
              interaction._latency = entry.duration;
            } else if (entry.duration === interaction._latency && entry.startTime === interaction.entries[0].startTime) {
              interaction.entries.push(entry);
            }
          } else {
            interaction = {
              id: entry.interactionId,
              entries: [entry],
              _latency: entry.duration
            };
            this._longestInteractionMap.set(interaction.id, interaction);
            this._longestInteractionList.push(interaction);
          }
          this._longestInteractionList.sort((a, b) => b._latency - a._latency);
          if (this._longestInteractionList.length > MAX_INTERACTIONS_TO_CONSIDER) {
            const removedInteractions = this._longestInteractionList.splice(MAX_INTERACTIONS_TO_CONSIDER);
            for (const interaction2 of removedInteractions) {
              this._longestInteractionMap.delete(interaction2.id);
            }
          }
          this._onAfterProcessingINPCandidate?.(interaction);
        }
      }
    }

    const whenIdleOrHidden = (cb) => {
      const rIC = WINDOW.requestIdleCallback || WINDOW.setTimeout;
      if (WINDOW.document?.visibilityState === "hidden") {
        cb();
      } else {
        cb = runOnce(cb);
        addPageListener("visibilitychange", cb, { once: true, capture: true });
        addPageListener("pagehide", cb, { once: true, capture: true });
        rIC(() => {
          cb();
          removePageListener("visibilitychange", cb, { capture: true });
          removePageListener("pagehide", cb, { capture: true });
        });
      }
    };

    const INPThresholds = [200, 500];
    const DEFAULT_DURATION_THRESHOLD = 40;
    const onINP = (onReport, opts = {}) => {
      if (!(globalThis.PerformanceEventTiming && "interactionId" in PerformanceEventTiming.prototype)) {
        return;
      }
      const visibilityWatcher = getVisibilityWatcher();
      whenActivated(() => {
        initInteractionCountPolyfill();
        const metric = initMetric("INP");
        let report;
        const interactionManager = initUnique(opts, InteractionManager);
        const handleEntries = (entries) => {
          whenIdleOrHidden(() => {
            for (const entry of entries) {
              interactionManager._processEntry(entry);
            }
            const inp = interactionManager._estimateP98LongestInteraction();
            if (inp && inp._latency !== metric.value) {
              metric.value = inp._latency;
              metric.entries = inp.entries;
              report();
            }
          });
        };
        const po = observe("event", handleEntries, {
          // Event Timing entries have their durations rounded to the nearest 8ms,
          // so a duration of 40ms would be any event that spans 2.5 or more frames
          // at 60Hz. This threshold is chosen to strike a balance between usefulness
          // and performance. Running this callback for any interaction that spans
          // just one or two frames is likely not worth the insight that could be
          // gained.
          durationThreshold: opts.durationThreshold ?? DEFAULT_DURATION_THRESHOLD
        });
        report = bindReporter(onReport, metric, INPThresholds, opts.reportAllChanges);
        if (po) {
          po.observe({ type: "first-input", buffered: true });
          visibilityWatcher.onHidden(() => {
            handleEntries(po.takeRecords());
            report(true);
          });
        }
      });
    };

    class LCPEntryManager {
      // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility, jsdoc/require-jsdoc
      _processEntry(entry) {
        this._onBeforeProcessingEntry?.(entry);
      }
    }

    const LCPThresholds = [2500, 4e3];
    const onLCP = (onReport, opts = {}) => {
      whenActivated(() => {
        const visibilityWatcher = getVisibilityWatcher();
        const metric = initMetric("LCP");
        let report;
        const lcpEntryManager = initUnique(opts, LCPEntryManager);
        const handleEntries = (entries) => {
          if (!opts.reportAllChanges) {
            entries = entries.slice(-1);
          }
          for (const entry of entries) {
            lcpEntryManager._processEntry(entry);
            if (entry.startTime < visibilityWatcher.firstHiddenTime) {
              metric.value = Math.max(entry.startTime - getActivationStart(), 0);
              metric.entries = [entry];
              report();
            }
          }
        };
        const po = observe("largest-contentful-paint", handleEntries);
        if (po) {
          report = bindReporter(onReport, metric, LCPThresholds, opts.reportAllChanges);
          const stopListening = runOnce(() => {
            handleEntries(po.takeRecords());
            po.disconnect();
            report(true);
          });
          const stopListeningWrapper = (event) => {
            if (event.isTrusted) {
              whenIdleOrHidden(stopListening);
              removePageListener(event.type, stopListeningWrapper, {
                capture: true
              });
            }
          };
          for (const type of ["keydown", "click", "visibilitychange"]) {
            addPageListener(type, stopListeningWrapper, {
              capture: true
            });
          }
        }
      });
    };

    const TTFBThresholds = [800, 1800];
    const whenReady = (callback) => {
      if (WINDOW.document?.prerendering) {
        whenActivated(() => whenReady(callback));
      } else if (WINDOW.document?.readyState !== "complete") {
        addEventListener("load", () => whenReady(callback), true);
      } else {
        setTimeout(callback);
      }
    };
    const onTTFB = (onReport, opts = {}) => {
      const metric = initMetric("TTFB");
      const report = bindReporter(onReport, metric, TTFBThresholds, opts.reportAllChanges);
      whenReady(() => {
        const navigationEntry = getNavigationEntry();
        if (navigationEntry) {
          metric.value = Math.max(navigationEntry.responseStart - getActivationStart(), 0);
          metric.entries = [navigationEntry];
          report(true);
        }
      });
    };

    const handlers = {};
    const instrumented = {};
    let _previousCls;
    let _previousLcp;
    let _previousTtfb;
    let _previousInp;
    function addClsInstrumentationHandler(callback, stopOnCallback = false) {
      return addMetricObserver("cls", callback, instrumentCls, _previousCls, stopOnCallback);
    }
    function addLcpInstrumentationHandler(callback, stopOnCallback = false) {
      return addMetricObserver("lcp", callback, instrumentLcp, _previousLcp, stopOnCallback);
    }
    function addTtfbInstrumentationHandler(callback) {
      return addMetricObserver("ttfb", callback, instrumentTtfb, _previousTtfb);
    }
    function addInpInstrumentationHandler(callback) {
      return addMetricObserver("inp", callback, instrumentInp, _previousInp);
    }
    function addPerformanceInstrumentationHandler(type, callback) {
      addHandler(type, callback);
      if (!instrumented[type]) {
        instrumentPerformanceObserver(type);
        instrumented[type] = true;
      }
      return getCleanupCallback(type, callback);
    }
    function triggerHandlers(type, data) {
      const typeHandlers = handlers[type];
      if (!typeHandlers?.length) {
        return;
      }
      for (const handler of typeHandlers) {
        try {
          handler(data);
        } catch (e) {
          DEBUG_BUILD$1 && debug.error(
            `Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`,
            e
          );
        }
      }
    }
    function instrumentCls() {
      return onCLS(
        (metric) => {
          triggerHandlers("cls", {
            metric
          });
          _previousCls = metric;
        },
        // We want the callback to be called whenever the CLS value updates.
        // By default, the callback is only called when the tab goes to the background.
        { reportAllChanges: true }
      );
    }
    function instrumentLcp() {
      return onLCP(
        (metric) => {
          triggerHandlers("lcp", {
            metric
          });
          _previousLcp = metric;
        },
        // We want the callback to be called whenever the LCP value updates.
        // By default, the callback is only called when the tab goes to the background.
        { reportAllChanges: true }
      );
    }
    function instrumentTtfb() {
      return onTTFB((metric) => {
        triggerHandlers("ttfb", {
          metric
        });
        _previousTtfb = metric;
      });
    }
    function instrumentInp() {
      return onINP((metric) => {
        triggerHandlers("inp", {
          metric
        });
        _previousInp = metric;
      });
    }
    function addMetricObserver(type, callback, instrumentFn, previousValue, stopOnCallback = false) {
      addHandler(type, callback);
      let stopListening;
      if (!instrumented[type]) {
        stopListening = instrumentFn();
        instrumented[type] = true;
      }
      if (previousValue) {
        callback({ metric: previousValue });
      }
      return getCleanupCallback(type, callback, stopOnCallback ? stopListening : void 0);
    }
    function instrumentPerformanceObserver(type) {
      const options = {};
      if (type === "event") {
        options.durationThreshold = 0;
      }
      observe(
        type,
        (entries) => {
          triggerHandlers(type, { entries });
        },
        options
      );
    }
    function addHandler(type, handler) {
      handlers[type] = handlers[type] || [];
      handlers[type].push(handler);
    }
    function getCleanupCallback(type, callback, stopListening) {
      return () => {
        if (stopListening) {
          stopListening();
        }
        const typeHandlers = handlers[type];
        if (!typeHandlers) {
          return;
        }
        const index = typeHandlers.indexOf(callback);
        if (index !== -1) {
          typeHandlers.splice(index, 1);
        }
      };
    }
    function isPerformanceEventTiming(entry) {
      return "duration" in entry;
    }

    const DEFAULT_MAX_STRING_LENGTH = 80;
    const accessors = {};
    try {
      if (typeof Node !== "undefined") {
        accessors.parentNode = Object.getOwnPropertyDescriptor(Node.prototype, "parentNode").get;
      }
      if (typeof Element !== "undefined") {
        accessors.tagName = Object.getOwnPropertyDescriptor(Element.prototype, "tagName").get;
        accessors.id = Object.getOwnPropertyDescriptor(Element.prototype, "id").get;
        accessors.className = Object.getOwnPropertyDescriptor(Element.prototype, "className").get;
        accessors.getAttribute = Element.prototype.getAttribute;
      }
      if (typeof HTMLElement !== "undefined") {
        accessors.dataset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "dataset").get;
      }
    } catch {
    }
    function _safeRead(el, prop, arg) {
      const fn = accessors[prop];
      if (fn) {
        try {
          return fn.call(el, arg);
        } catch {
        }
      }
      const val = el[prop];
      return typeof val === "function" ? val.call(el, arg) : val;
    }
    function htmlTreeAsString(elem, options = {}) {
      if (!elem) {
        return "<unknown>";
      }
      try {
        let currentElem = elem;
        const MAX_TRAVERSE_HEIGHT = 5;
        const out = [];
        let height = 0;
        let len = 0;
        const separator = " > ";
        const sepLength = separator.length;
        let nextStr;
        const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
        const maxStringLength = !Array.isArray(options) && options.maxStringLength || DEFAULT_MAX_STRING_LENGTH;
        while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
          nextStr = _htmlElementAsString(currentElem, keyAttrs);
          if (nextStr === "html" || height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength) {
            break;
          }
          out.push(nextStr);
          len += nextStr.length;
          currentElem = _safeRead(currentElem, "parentNode");
        }
        return out.reverse().join(separator);
      } catch {
        return "<unknown>";
      }
    }
    function _htmlElementAsString(el, keyAttrs) {
      const out = [];
      const tagName = _safeRead(el, "tagName");
      if (!tagName) {
        return "";
      }
      if (typeof HTMLElement !== "undefined") {
        if (el instanceof HTMLElement) {
          const dataset = _safeRead(el, "dataset");
          if (dataset) {
            if (dataset["sentryComponent"]) {
              return dataset["sentryComponent"];
            }
            if (dataset["sentryElement"]) {
              return dataset["sentryElement"];
            }
          }
        }
      }
      out.push(tagName.toLowerCase());
      const keyAttrPairs = keyAttrs?.length ? keyAttrs.filter((keyAttr) => _safeRead(el, "getAttribute", keyAttr)).map((keyAttr) => [keyAttr, _safeRead(el, "getAttribute", keyAttr)]) : null;
      if (keyAttrPairs?.length) {
        keyAttrPairs.forEach((keyAttrPair) => {
          out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
        });
      } else {
        const id = _safeRead(el, "id");
        if (id) {
          out.push(`#${id}`);
        }
        const className = _safeRead(el, "className");
        if (className && isString(className)) {
          const classes = className.split(/\s+/);
          for (const c of classes) {
            out.push(`.${c}`);
          }
        }
      }
      for (const k of ["aria-label", "type", "name", "title", "alt"]) {
        const attr = _safeRead(el, "getAttribute", k);
        if (attr) {
          out.push(`[${k}="${attr}"]`);
        }
      }
      return out.join("");
    }

    const onHidden = (cb) => {
      const onHiddenOrPageHide = (event) => {
        if (event.type === "pagehide" || WINDOW.document?.visibilityState === "hidden") {
          cb(event);
        }
      };
      addPageListener("visibilitychange", onHiddenOrPageHide, { capture: true, once: true });
      addPageListener("pagehide", onHiddenOrPageHide, { capture: true, once: true });
    };

    function isMeasurementValue(value) {
      return typeof value === "number" && isFinite(value);
    }
    function startAndEndSpan(parentSpan, startTimeInSeconds, endTime, { ...ctx }) {
      const parentStartTime = spanToJSON(parentSpan).start_timestamp;
      if (parentStartTime && parentStartTime > startTimeInSeconds) {
        if (typeof parentSpan.updateStartTime === "function") {
          parentSpan.updateStartTime(startTimeInSeconds);
        }
      }
      return withActiveSpan(parentSpan, () => {
        const span = startInactiveSpan({
          startTime: startTimeInSeconds,
          ...ctx
        });
        if (span) {
          span.end(endTime);
        }
        return span;
      });
    }
    function startStandaloneWebVitalSpan(options) {
      const client = getClient();
      if (!client) {
        return;
      }
      const { name, transaction, attributes: passedAttributes, startTime } = options;
      const { release, environment } = client.getOptions();
      const { userInfo } = client.getDataCollectionOptions();
      const replay = client.getIntegrationByName("Replay");
      const replayId = replay?.getReplayId();
      const scope = getCurrentScope();
      const user = scope.getUser();
      const userDisplay = user !== void 0 ? user.email || user.id || user.ip_address : void 0;
      let profileId;
      try {
        profileId = scope.getScopeData().contexts.profile.profile_id;
      } catch {
      }
      const attributes = {
        release,
        environment,
        user: userDisplay || void 0,
        profile_id: profileId || void 0,
        replay_id: replayId || void 0,
        transaction,
        // Web vital score calculation relies on the user agent to account for different
        // browsers setting different thresholds for what is considered a good/meh/bad value.
        // For example: Chrome vs. Chrome Mobile
        "user_agent.original": WINDOW.navigator?.userAgent,
        // This tells Sentry to infer the IP address from the request
        "client.address": userInfo ? "{{auto}}" : void 0,
        ...passedAttributes
      };
      return startInactiveSpan({
        name,
        attributes,
        startTime,
        experimental: {
          standalone: true
        }
      });
    }
    function getBrowserPerformanceAPI() {
      return WINDOW.addEventListener && WINDOW.performance;
    }
    function msToSec(time) {
      return time / 1e3;
    }
    function extractNetworkProtocol(nextHopProtocol) {
      let name = "unknown";
      let version = "unknown";
      let _name = "";
      for (const char of nextHopProtocol) {
        if (char === "/") {
          [name, version] = nextHopProtocol.split("/");
          break;
        }
        if (!isNaN(Number(char))) {
          name = _name === "h" ? "http" : _name;
          version = nextHopProtocol.split(_name)[1];
          break;
        }
        _name += char;
      }
      if (_name === nextHopProtocol) {
        name = _name;
      }
      return { name, version };
    }
    function supportsWebVital(entryType) {
      try {
        return PerformanceObserver.supportedEntryTypes.includes(entryType);
      } catch {
        return false;
      }
    }
    function listenForWebVitalReportEvents(client, collectorCallback) {
      let pageloadSpan;
      let collected = false;
      function _runCollectorCallbackOnce(event) {
        if (!collected && pageloadSpan) {
          collectorCallback(event, pageloadSpan.spanContext().spanId, pageloadSpan);
        }
        collected = true;
      }
      onHidden(() => {
        _runCollectorCallbackOnce("pagehide");
      });
      const unsubscribeStartNavigation = client.on("beforeStartNavigationSpan", (_, options) => {
        if (!options?.isRedirect) {
          _runCollectorCallbackOnce("navigation");
          unsubscribeStartNavigation();
          unsubscribeAfterStartPageLoadSpan();
        }
      });
      const unsubscribeAfterStartPageLoadSpan = client.on("afterStartPageLoadSpan", (span) => {
        pageloadSpan = span;
        unsubscribeAfterStartPageLoadSpan();
      });
    }

    function trackClsAsStandaloneSpan(client) {
      let standaloneCLsValue = 0;
      let standaloneClsEntry;
      if (!supportsWebVital("layout-shift")) {
        return;
      }
      const cleanupClsHandler = addClsInstrumentationHandler(({ metric }) => {
        const entry = metric.entries[metric.entries.length - 1];
        if (!entry) {
          return;
        }
        standaloneCLsValue = metric.value;
        standaloneClsEntry = entry;
      }, true);
      listenForWebVitalReportEvents(client, (reportEvent, pageloadSpanId) => {
        _sendStandaloneClsSpan(standaloneCLsValue, standaloneClsEntry, pageloadSpanId, reportEvent);
        cleanupClsHandler();
      });
    }
    function _sendStandaloneClsSpan(clsValue, entry, pageloadSpanId, reportEvent) {
      DEBUG_BUILD$1 && debug.log(`Sending CLS span (${clsValue})`);
      const startTime = entry ? msToSec((browserPerformanceTimeOrigin() || 0) + entry.startTime) : timestampInSeconds();
      const routeName = getCurrentScope().getScopeData().transactionName;
      const name = entry ? htmlTreeAsString(entry.sources[0]?.node) : "Layout shift";
      const attributes = {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.cls",
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "ui.webvital.cls",
        [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: 0,
        // attach the pageload span id to the CLS span so that we can link them in the UI
        "sentry.pageload.span_id": pageloadSpanId,
        // describes what triggered the web vital to be reported
        "sentry.report_event": reportEvent
      };
      if (entry?.sources) {
        entry.sources.forEach((source, index) => {
          attributes[`cls.source.${index + 1}`] = htmlTreeAsString(source.node);
        });
      }
      const span = startStandaloneWebVitalSpan({
        name,
        transaction: routeName,
        attributes,
        startTime
      });
      if (span) {
        span.addEvent("cls", {
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: "",
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: clsValue
        });
        span.end(startTime);
      }
    }

    const MAX_PLAUSIBLE_LCP_DURATION = 6e4;
    function isValidLcpMetric(lcpValue) {
      return lcpValue != null && lcpValue > 0 && lcpValue <= MAX_PLAUSIBLE_LCP_DURATION;
    }
    function trackLcpAsStandaloneSpan(client) {
      let standaloneLcpValue = 0;
      let standaloneLcpEntry;
      if (!supportsWebVital("largest-contentful-paint")) {
        return;
      }
      const cleanupLcpHandler = addLcpInstrumentationHandler(({ metric }) => {
        const entry = metric.entries[metric.entries.length - 1];
        if (!entry || !isValidLcpMetric(metric.value)) {
          return;
        }
        standaloneLcpValue = metric.value;
        standaloneLcpEntry = entry;
      }, true);
      listenForWebVitalReportEvents(client, (reportEvent, pageloadSpanId) => {
        _sendStandaloneLcpSpan(standaloneLcpValue, standaloneLcpEntry, pageloadSpanId, reportEvent);
        cleanupLcpHandler();
      });
    }
    function _sendStandaloneLcpSpan(lcpValue, entry, pageloadSpanId, reportEvent) {
      if (!isValidLcpMetric(lcpValue)) {
        return;
      }
      DEBUG_BUILD$1 && debug.log(`Sending LCP span (${lcpValue})`);
      const startTime = msToSec((browserPerformanceTimeOrigin() || 0) + (entry?.startTime || 0));
      const routeName = getCurrentScope().getScopeData().transactionName;
      const name = entry ? htmlTreeAsString(entry.element) : "Largest contentful paint";
      const attributes = {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.lcp",
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "ui.webvital.lcp",
        [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: 0,
        // LCP is a point-in-time metric
        // attach the pageload span id to the LCP span so that we can link them in the UI
        "sentry.pageload.span_id": pageloadSpanId,
        // describes what triggered the web vital to be reported
        "sentry.report_event": reportEvent
      };
      if (entry) {
        entry.element && (attributes["lcp.element"] = htmlTreeAsString(entry.element));
        entry.id && (attributes["lcp.id"] = entry.id);
        entry.url && (attributes["lcp.url"] = entry.url);
        entry.loadTime != null && (attributes["lcp.loadTime"] = entry.loadTime);
        entry.renderTime != null && (attributes["lcp.renderTime"] = entry.renderTime);
        entry.size != null && (attributes["lcp.size"] = entry.size);
      }
      const span = startStandaloneWebVitalSpan({
        name,
        transaction: routeName,
        attributes,
        startTime
      });
      if (span) {
        span.addEvent("lcp", {
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: "millisecond",
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: lcpValue
        });
        span.end(startTime);
      }
    }

    function getAbsoluteTime(time) {
      return time ? ((browserPerformanceTimeOrigin() || performance.timeOrigin) + time) / 1e3 : time;
    }
    function resourceTimingToSpanAttributes(resourceTiming) {
      const timingSpanData = {};
      if (resourceTiming.nextHopProtocol != void 0) {
        const { name, version } = extractNetworkProtocol(resourceTiming.nextHopProtocol);
        timingSpanData["network.protocol.version"] = version;
        timingSpanData["network.protocol.name"] = name;
      }
      if (!(browserPerformanceTimeOrigin() || getBrowserPerformanceAPI()?.timeOrigin)) {
        return timingSpanData;
      }
      return dropUndefinedKeysFromObject({
        ...timingSpanData,
        "http.request.redirect_start": getAbsoluteTime(resourceTiming.redirectStart),
        "http.request.redirect_end": getAbsoluteTime(resourceTiming.redirectEnd),
        "http.request.worker_start": getAbsoluteTime(resourceTiming.workerStart),
        "http.request.fetch_start": getAbsoluteTime(resourceTiming.fetchStart),
        "http.request.domain_lookup_start": getAbsoluteTime(resourceTiming.domainLookupStart),
        "http.request.domain_lookup_end": getAbsoluteTime(resourceTiming.domainLookupEnd),
        "http.request.connect_start": getAbsoluteTime(resourceTiming.connectStart),
        "http.request.secure_connection_start": getAbsoluteTime(resourceTiming.secureConnectionStart),
        "http.request.connection_end": getAbsoluteTime(resourceTiming.connectEnd),
        "http.request.request_start": getAbsoluteTime(resourceTiming.requestStart),
        "http.request.response_start": getAbsoluteTime(resourceTiming.responseStart),
        "http.request.response_end": getAbsoluteTime(resourceTiming.responseEnd),
        // For TTFB we actually want the relative time from timeOrigin to responseStart
        // This way, TTFB always measures the "first page load" experience.
        // see: https://web.dev/articles/ttfb#measure-resource-requests
        "http.request.time_to_first_byte": resourceTiming.responseStart != null ? resourceTiming.responseStart / 1e3 : void 0
      });
    }
    function dropUndefinedKeysFromObject(attrs) {
      return Object.fromEntries(Object.entries(attrs).filter(([, value]) => value != null));
    }

    const MAX_INT_AS_BYTES = 2147483647;
    let _performanceCursor = 0;
    let _measurements = {};
    let _lcpEntry;
    let _clsEntry;
    function startTrackingWebVitals({
      recordClsStandaloneSpans,
      recordLcpStandaloneSpans,
      client
    }) {
      const performance = getBrowserPerformanceAPI();
      if (performance && browserPerformanceTimeOrigin()) {
        if (performance.mark) {
          WINDOW.performance.mark("sentry-tracing-init");
        }
        const lcpCleanupCallback = recordLcpStandaloneSpans ? trackLcpAsStandaloneSpan(client) : recordLcpStandaloneSpans === false ? _trackLCP() : void 0;
        const clsCleanupCallback = recordClsStandaloneSpans ? trackClsAsStandaloneSpan(client) : recordClsStandaloneSpans === false ? _trackCLS() : void 0;
        const ttfbCleanupCallback = _trackTtfb();
        const fpFcpCleanupCallback = _trackFpFcp();
        return () => {
          ttfbCleanupCallback();
          fpFcpCleanupCallback();
          lcpCleanupCallback?.();
          clsCleanupCallback?.();
        };
      }
      return () => void 0;
    }
    function startTrackingLongTasks() {
      addPerformanceInstrumentationHandler("longtask", ({ entries }) => {
        const parent = getActiveSpan();
        if (!parent) {
          return;
        }
        const { op: parentOp, start_timestamp: parentStartTimestamp } = spanToJSON(parent);
        for (const entry of entries) {
          const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
          const duration = msToSec(entry.duration);
          if (parentOp === "navigation" && parentStartTimestamp && startTime < parentStartTimestamp) {
            continue;
          }
          startAndEndSpan(parent, startTime, startTime + duration, {
            name: "Main UI thread blocked",
            op: "ui.long-task",
            attributes: {
              [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
            }
          });
        }
      });
    }
    function startTrackingLongAnimationFrames() {
      const observer = new PerformanceObserver((list) => {
        const parent = getActiveSpan();
        if (!parent) {
          return;
        }
        for (const entry of list.getEntries()) {
          if (!entry.scripts[0]) {
            continue;
          }
          const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
          const { start_timestamp: parentStartTimestamp, op: parentOp } = spanToJSON(parent);
          if (parentOp === "navigation" && parentStartTimestamp && startTime < parentStartTimestamp) {
            continue;
          }
          const duration = msToSec(entry.duration);
          const attributes = {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
          };
          const initialScript = entry.scripts[0];
          const { invoker, invokerType, sourceURL, sourceFunctionName, sourceCharPosition } = initialScript;
          attributes["browser.script.invoker"] = invoker;
          attributes["browser.script.invoker_type"] = invokerType;
          if (sourceURL) {
            attributes["code.filepath"] = sourceURL;
          }
          if (sourceFunctionName) {
            attributes["code.function"] = sourceFunctionName;
          }
          if (sourceCharPosition !== -1) {
            attributes["browser.script.source_char_position"] = sourceCharPosition;
          }
          startAndEndSpan(parent, startTime, startTime + duration, {
            name: "Main UI thread blocked",
            op: "ui.long-animation-frame",
            attributes
          });
        }
      });
      observer.observe({ type: "long-animation-frame", buffered: true });
    }
    function startTrackingInteractions() {
      addPerformanceInstrumentationHandler("event", ({ entries }) => {
        const parent = getActiveSpan();
        if (!parent) {
          return;
        }
        for (const entry of entries) {
          if (entry.name === "click") {
            const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
            const duration = msToSec(entry.duration);
            const spanOptions = {
              name: htmlTreeAsString(entry.target),
              op: `ui.interaction.${entry.name}`,
              startTime,
              attributes: {
                [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
              }
            };
            const componentName = getComponentName(entry.target);
            if (componentName) {
              spanOptions.attributes["ui.component_name"] = componentName;
            }
            startAndEndSpan(parent, startTime, startTime + duration, spanOptions);
          }
        }
      });
    }
    function _trackCLS() {
      return addClsInstrumentationHandler(({ metric }) => {
        const entry = metric.entries[metric.entries.length - 1];
        if (!entry) {
          return;
        }
        _measurements["cls"] = { value: metric.value, unit: "" };
        _clsEntry = entry;
      }, true);
    }
    function _trackLCP() {
      return addLcpInstrumentationHandler(({ metric }) => {
        const entry = metric.entries[metric.entries.length - 1];
        if (!entry || !isValidLcpMetric(metric.value)) {
          return;
        }
        _measurements["lcp"] = { value: metric.value, unit: "millisecond" };
        _lcpEntry = entry;
      }, true);
    }
    function _trackTtfb() {
      return addTtfbInstrumentationHandler(({ metric }) => {
        const entry = metric.entries[metric.entries.length - 1];
        if (!entry) {
          return;
        }
        _measurements["ttfb"] = { value: metric.value, unit: "millisecond" };
      });
    }
    function _trackFpFcp() {
      return addPerformanceInstrumentationHandler("paint", ({ entries }) => {
        const firstHidden = getVisibilityWatcher();
        for (const entry of entries) {
          const shouldRecord = entry.startTime < firstHidden.firstHiddenTime;
          if (entry.name === "first-paint" && shouldRecord) {
            _measurements["fp"] = { value: entry.startTime, unit: "millisecond" };
          }
          if (entry.name === "first-contentful-paint" && shouldRecord) {
            _measurements["fcp"] = { value: entry.startTime, unit: "millisecond" };
          }
        }
      });
    }
    function addPerformanceEntries(span, options) {
      const performance = getBrowserPerformanceAPI();
      const origin = browserPerformanceTimeOrigin();
      if (!performance?.getEntries || !origin) {
        return;
      }
      const { spanStreamingEnabled, ignorePerformanceApiSpans, ignoreResourceSpans } = options;
      const timeOrigin = msToSec(origin);
      const performanceEntries = performance.getEntries();
      const { op, start_timestamp: transactionStartTime } = spanToJSON(span);
      performanceEntries.slice(_performanceCursor).forEach((entry) => {
        const startTime = msToSec(entry.startTime);
        const duration = msToSec(
          // Inexplicably, Chrome sometimes emits a negative duration. We need to work around this.
          // There is a SO post attempting to explain this, but it leaves one with open questions: https://stackoverflow.com/questions/23191918/peformance-getentries-and-negative-duration-display
          // The way we clamp the value is probably not accurate, since we have observed this happen for things that may take a while to load, like for example the replay worker.
          // TODO: Investigate why this happens and how to properly mitigate. For now, this is a workaround to prevent transactions being dropped due to negative duration spans.
          Math.max(0, entry.duration)
        );
        if (op === "navigation" && transactionStartTime && timeOrigin + startTime < transactionStartTime) {
          return;
        }
        switch (entry.entryType) {
          case "navigation": {
            _addNavigationSpans(span, entry, timeOrigin);
            break;
          }
          case "mark":
          case "paint":
          case "measure": {
            _addMeasureSpans(span, entry, startTime, duration, timeOrigin, ignorePerformanceApiSpans);
            break;
          }
          case "resource": {
            _addResourceSpans(
              span,
              entry,
              entry.name,
              startTime,
              duration,
              timeOrigin,
              ignoreResourceSpans
            );
            break;
          }
        }
      });
      _performanceCursor = Math.max(performanceEntries.length - 1, 0);
      _trackNavigator(span, spanStreamingEnabled);
    }
    function addWebVitalsToSpan(span, options) {
      const origin = browserPerformanceTimeOrigin();
      if (!getBrowserPerformanceAPI()?.getEntries || !origin) {
        resetWebVitalState();
        return;
      }
      const { spanStreamingEnabled, recordClsOnPageloadSpan, recordLcpOnPageloadSpan } = options;
      const timeOrigin = msToSec(origin);
      if (spanToJSON(span).op === "pageload") {
        _addTtfbRequestTimeToMeasurements(_measurements);
        if (spanStreamingEnabled) {
          const setAttr = (shortWebVitalName, value, customAttrName) => {
            const attrKey = customAttrName ?? `browser.web_vital.${shortWebVitalName}.value`;
            span.setAttribute(attrKey, value);
            DEBUG_BUILD$1 && debug.log("Setting web vital attribute", { [attrKey]: value }, "on pageload span");
          };
          ["ttfb", "fp", "fcp"].forEach((measurementName) => {
            if (_measurements[measurementName]) {
              setAttr(measurementName, _measurements[measurementName].value);
            }
          });
          if (_measurements["ttfb.requestTime"]) {
            setAttr("ttfb.requestTime", _measurements["ttfb.requestTime"].value, "browser.web_vital.ttfb.request_time");
          }
        } else {
          if (!recordClsOnPageloadSpan) {
            delete _measurements.cls;
          }
          if (!recordLcpOnPageloadSpan) {
            delete _measurements.lcp;
          }
          Object.entries(_measurements).forEach(([measurementName, measurement]) => {
            setMeasurement(measurementName, measurement.value, measurement.unit, span);
          });
          _setWebVitalAttributes(span, options);
        }
        span.setAttribute(spanStreamingEnabled ? "browser.performance.time_origin" : "performance.timeOrigin", timeOrigin);
        span.setAttribute(
          spanStreamingEnabled ? "browser.performance.navigation.activation_start" : "performance.activationStart",
          getActivationStart()
        );
      }
      resetWebVitalState();
    }
    function resetWebVitalState() {
      _lcpEntry = void 0;
      _clsEntry = void 0;
      _measurements = {};
    }
    function isReact19MeasureEntry(entry) {
      if (entry?.entryType !== "measure") {
        return;
      }
      try {
        return entry.detail.devtools.track === "Components \u269B";
      } catch {
        return;
      }
    }
    function _addMeasureSpans(span, entry, startTime, duration, timeOrigin, ignorePerformanceApiSpans) {
      if (isReact19MeasureEntry(entry)) {
        return;
      }
      if (["mark", "measure"].includes(entry.entryType) && stringMatchesSomePattern(entry.name, ignorePerformanceApiSpans)) {
        return;
      }
      const navEntry = getNavigationEntry(false);
      const requestTime = msToSec(navEntry ? navEntry.requestStart : 0);
      const measureStartTimestamp = timeOrigin + Math.max(startTime, requestTime);
      const startTimeStamp = timeOrigin + startTime;
      const measureEndTimestamp = startTimeStamp + duration;
      const attributes = {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.resource.browser.metrics"
      };
      if (measureStartTimestamp !== startTimeStamp) {
        attributes["sentry.browser.measure_happened_before_request"] = true;
        attributes["sentry.browser.measure_start_time"] = measureStartTimestamp;
      }
      _addDetailToSpanAttributes(attributes, entry);
      if (measureStartTimestamp <= measureEndTimestamp) {
        startAndEndSpan(span, measureStartTimestamp, measureEndTimestamp, {
          name: entry.name,
          op: entry.entryType,
          attributes
        });
      }
    }
    function _addDetailToSpanAttributes(attributes, performanceMeasure) {
      try {
        const detail = performanceMeasure.detail;
        if (!detail) {
          return;
        }
        if (typeof detail === "object") {
          for (const [key, value] of Object.entries(detail)) {
            if (value && isPrimitive(value)) {
              attributes[`sentry.browser.measure.detail.${key}`] = value;
            } else if (value !== void 0) {
              try {
                attributes[`sentry.browser.measure.detail.${key}`] = JSON.stringify(value);
              } catch {
              }
            }
          }
          return;
        }
        if (isPrimitive(detail)) {
          attributes["sentry.browser.measure.detail"] = detail;
          return;
        }
        try {
          attributes["sentry.browser.measure.detail"] = JSON.stringify(detail);
        } catch {
        }
      } catch {
      }
    }
    function _addNavigationSpans(span, entry, timeOrigin) {
      ["unloadEvent", "redirect", "domContentLoadedEvent", "loadEvent", "connect"].forEach((event) => {
        _addPerformanceNavigationTiming(span, entry, event, timeOrigin);
      });
      _addPerformanceNavigationTiming(span, entry, "secureConnection", timeOrigin, "TLS/SSL");
      _addPerformanceNavigationTiming(span, entry, "fetch", timeOrigin, "cache");
      _addPerformanceNavigationTiming(span, entry, "domainLookup", timeOrigin, "DNS");
      _addRequest(span, entry, timeOrigin);
    }
    function _addPerformanceNavigationTiming(span, entry, event, timeOrigin, name = event) {
      const eventEnd = _getEndPropertyNameForNavigationTiming(event);
      const end = entry[eventEnd];
      const start = entry[`${event}Start`];
      if (!start || !end) {
        return;
      }
      startAndEndSpan(span, timeOrigin + msToSec(start), timeOrigin + msToSec(end), {
        op: `browser.${name}`,
        name: entry.name,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics",
          ...event === "redirect" && entry.redirectCount != null ? { "http.redirect_count": entry.redirectCount } : {}
        }
      });
    }
    function _getEndPropertyNameForNavigationTiming(event) {
      if (event === "secureConnection") {
        return "connectEnd";
      }
      if (event === "fetch") {
        return "domainLookupStart";
      }
      return `${event}End`;
    }
    function _addRequest(span, entry, timeOrigin) {
      const requestStartTimestamp = timeOrigin + msToSec(entry.requestStart);
      const responseEndTimestamp = timeOrigin + msToSec(entry.responseEnd);
      const responseStartTimestamp = timeOrigin + msToSec(entry.responseStart);
      if (entry.responseEnd) {
        startAndEndSpan(span, requestStartTimestamp, responseEndTimestamp, {
          op: "browser.request",
          name: entry.name,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
          }
        });
        startAndEndSpan(span, responseStartTimestamp, responseEndTimestamp, {
          op: "browser.response",
          name: entry.name,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
          }
        });
      }
    }
    function _addResourceSpans(span, entry, resourceUrl, startTime, duration, timeOrigin, ignoredResourceSpanOps) {
      if (entry.initiatorType === "xmlhttprequest" || entry.initiatorType === "fetch") {
        return;
      }
      const op = entry.initiatorType ? `resource.${entry.initiatorType}` : "resource.other";
      if (ignoredResourceSpanOps?.includes(op)) {
        return;
      }
      const attributes = {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.resource.browser.metrics"
      };
      const parsedUrl = parseUrl(resourceUrl);
      if (parsedUrl.protocol) {
        attributes["url.scheme"] = parsedUrl.protocol.split(":").pop();
      }
      if (parsedUrl.host) {
        attributes["server.address"] = parsedUrl.host;
      }
      attributes["url.same_origin"] = resourceUrl.includes(WINDOW.location.origin);
      attributes[Yu] = resourceUrl;
      _setResourceRequestAttributes(entry, attributes, [
        // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/responseStatus
        ["responseStatus", "http.response.status_code"],
        ["transferSize", "http.response_transfer_size"],
        ["encodedBodySize", "http.response_content_length"],
        ["decodedBodySize", "http.decoded_response_content_length"],
        // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/renderBlockingStatus
        ["renderBlockingStatus", "resource.render_blocking_status"],
        // https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/deliveryType
        ["deliveryType", "http.response_delivery_type"]
      ]);
      const attributesWithResourceTiming = { ...attributes, ...resourceTimingToSpanAttributes(entry) };
      const startTimestamp = timeOrigin + startTime;
      const endTimestamp = startTimestamp + duration;
      startAndEndSpan(span, startTimestamp, endTimestamp, {
        name: resourceUrl.replace(WINDOW.location.origin, ""),
        op,
        attributes: attributesWithResourceTiming
      });
    }
    function _trackNavigator(span, spanStreamingEnabled) {
      const navigator = WINDOW.navigator;
      if (!navigator) {
        return;
      }
      const connection = navigator.connection;
      if (connection) {
        if (connection.effectiveType) {
          span.setAttribute(
            spanStreamingEnabled ? "network.connection.effective_type" : "effectiveConnectionType",
            connection.effectiveType
          );
        }
        if (connection.type) {
          span.setAttribute(spanStreamingEnabled ? "network.connection.type" : "connectionType", connection.type);
        }
        if (isMeasurementValue(connection.rtt)) {
          if (spanStreamingEnabled) {
            span.setAttribute("network.connection.rtt", connection.rtt);
          } else if (spanToJSON(span).op === "pageload") {
            setMeasurement("connection.rtt", connection.rtt, "millisecond");
          }
        }
      }
      if (isMeasurementValue(navigator.deviceMemory)) {
        if (spanStreamingEnabled) {
          span.setAttribute("device.memory.estimated_capacity", navigator.deviceMemory);
        } else {
          span.setAttribute("deviceMemory", `${navigator.deviceMemory} GB`);
        }
      }
      if (isMeasurementValue(navigator.hardwareConcurrency)) {
        if (spanStreamingEnabled) {
          span.setAttribute("device.processor_count", navigator.hardwareConcurrency);
        } else {
          span.setAttribute("hardwareConcurrency", String(navigator.hardwareConcurrency));
        }
      }
    }
    function _setWebVitalAttributes(span, options) {
      if (_lcpEntry && options.recordLcpOnPageloadSpan) {
        if (_lcpEntry.element) {
          span.setAttribute("lcp.element", htmlTreeAsString(_lcpEntry.element));
        }
        if (_lcpEntry.id) {
          span.setAttribute("lcp.id", _lcpEntry.id);
        }
        if (_lcpEntry.url) {
          span.setAttribute("lcp.url", _lcpEntry.url.trim().slice(0, 200));
        }
        if (_lcpEntry.loadTime != null) {
          span.setAttribute("lcp.loadTime", _lcpEntry.loadTime);
        }
        if (_lcpEntry.renderTime != null) {
          span.setAttribute("lcp.renderTime", _lcpEntry.renderTime);
        }
        span.setAttribute("lcp.size", _lcpEntry.size);
      }
      if (_clsEntry?.sources && options.recordClsOnPageloadSpan) {
        _clsEntry.sources.forEach(
          (source, index) => span.setAttribute(`cls.source.${index + 1}`, htmlTreeAsString(source.node))
        );
      }
    }
    function _setResourceRequestAttributes(entry, attributes, properties) {
      properties.forEach(([entryKey, attributeKey]) => {
        const entryVal = entry[entryKey];
        if (entryVal != null && (typeof entryVal === "number" && entryVal < MAX_INT_AS_BYTES || typeof entryVal === "string")) {
          attributes[attributeKey] = entryVal;
        }
      });
    }
    function _addTtfbRequestTimeToMeasurements(_measurements2) {
      const navEntry = getNavigationEntry(false);
      if (!navEntry) {
        return;
      }
      const { responseStart, requestStart } = navEntry;
      if (requestStart <= responseStart) {
        _measurements2["ttfb.requestTime"] = {
          value: responseStart - requestStart,
          unit: "millisecond"
        };
      }
    }

    const LAST_INTERACTIONS = [];
    const INTERACTIONS_SPAN_MAP = /* @__PURE__ */ new Map();
    const ELEMENT_NAME_TIMESTAMP_MAP = /* @__PURE__ */ new Map();
    const MAX_PLAUSIBLE_INP_DURATION = 60;
    function startTrackingINP() {
      const performance = getBrowserPerformanceAPI();
      if (performance && browserPerformanceTimeOrigin()) {
        const inpCallback = _trackINP();
        return () => {
          inpCallback();
        };
      }
      return () => void 0;
    }
    const INP_ENTRY_MAP = {
      click: "click",
      pointerdown: "click",
      pointerup: "click",
      mousedown: "click",
      mouseup: "click",
      touchstart: "click",
      touchend: "click",
      mouseover: "hover",
      mouseout: "hover",
      mouseenter: "hover",
      mouseleave: "hover",
      pointerover: "hover",
      pointerout: "hover",
      pointerenter: "hover",
      pointerleave: "hover",
      dragstart: "drag",
      dragend: "drag",
      drag: "drag",
      dragenter: "drag",
      dragleave: "drag",
      dragover: "drag",
      drop: "drag",
      keydown: "press",
      keyup: "press",
      keypress: "press",
      input: "press"
    };
    function _trackINP() {
      return addInpInstrumentationHandler(_onInp);
    }
    const _onInp = ({ metric }) => {
      if (metric.value == void 0) {
        return;
      }
      const duration = msToSec(metric.value);
      if (duration > MAX_PLAUSIBLE_INP_DURATION) {
        return;
      }
      const entry = metric.entries.find((entry2) => entry2.duration === metric.value && INP_ENTRY_MAP[entry2.name]);
      if (!entry) {
        return;
      }
      const { interactionId } = entry;
      const interactionType = INP_ENTRY_MAP[entry.name];
      const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
      const activeSpan = getActiveSpan();
      const rootSpan = activeSpan ? getRootSpan(activeSpan) : void 0;
      const cachedInteractionContext = interactionId != null ? INTERACTIONS_SPAN_MAP.get(interactionId) : void 0;
      const spanToUse = cachedInteractionContext?.span || rootSpan;
      const routeName = spanToUse ? spanToJSON(spanToUse).description : getCurrentScope().getScopeData().transactionName;
      const name = cachedInteractionContext?.elementName || htmlTreeAsString(entry.target);
      const attributes = {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.inp",
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: `ui.interaction.${interactionType}`,
        [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: entry.duration
      };
      const span = startStandaloneWebVitalSpan({
        name,
        transaction: routeName,
        attributes,
        startTime
      });
      if (span) {
        span.addEvent("inp", {
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: "millisecond",
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: metric.value
        });
        span.end(startTime + duration);
      }
    };
    function getCachedInteractionContext(interactionId) {
      return interactionId != null ? INTERACTIONS_SPAN_MAP.get(interactionId) : void 0;
    }
    function registerInpInteractionListener() {
      const interactionEvents = Object.keys(INP_ENTRY_MAP);
      if (isBrowser()) {
        interactionEvents.forEach((eventType) => {
          WINDOW.addEventListener(eventType, captureElementFromEvent, { capture: true, passive: true });
        });
      }
      function captureElementFromEvent(event) {
        const target = event.target;
        if (!target) {
          return;
        }
        const elementName = htmlTreeAsString(target);
        const timestamp = Math.round(event.timeStamp);
        ELEMENT_NAME_TIMESTAMP_MAP.set(timestamp, elementName);
        if (ELEMENT_NAME_TIMESTAMP_MAP.size > 50) {
          const firstKey = ELEMENT_NAME_TIMESTAMP_MAP.keys().next().value;
          if (firstKey !== void 0) {
            ELEMENT_NAME_TIMESTAMP_MAP.delete(firstKey);
          }
        }
      }
      function resolveElementNameFromEntry(entry) {
        const timestamp = Math.round(entry.startTime);
        let elementName = ELEMENT_NAME_TIMESTAMP_MAP.get(timestamp);
        if (!elementName) {
          for (let offset = -5; offset <= 5; offset++) {
            const nearbyName = ELEMENT_NAME_TIMESTAMP_MAP.get(timestamp + offset);
            if (nearbyName) {
              elementName = nearbyName;
              break;
            }
          }
        }
        return elementName || "<unknown>";
      }
      const handleEntries = ({ entries }) => {
        const activeSpan = getActiveSpan();
        const activeRootSpan = activeSpan && getRootSpan(activeSpan);
        entries.forEach((entry) => {
          if (!isPerformanceEventTiming(entry)) {
            return;
          }
          const interactionId = entry.interactionId;
          if (interactionId == null) {
            return;
          }
          if (INTERACTIONS_SPAN_MAP.has(interactionId)) {
            return;
          }
          const elementName = entry.target ? htmlTreeAsString(entry.target) : resolveElementNameFromEntry(entry);
          if (LAST_INTERACTIONS.length > 10) {
            const last = LAST_INTERACTIONS.shift();
            INTERACTIONS_SPAN_MAP.delete(last);
          }
          LAST_INTERACTIONS.push(interactionId);
          INTERACTIONS_SPAN_MAP.set(interactionId, {
            span: activeRootSpan,
            elementName
          });
        });
      };
      addPerformanceInstrumentationHandler("event", handleEntries);
      addPerformanceInstrumentationHandler("first-input", handleEntries);
    }

    function _emitWebVitalSpan(options) {
      const {
        name,
        op,
        origin,
        metricName,
        value,
        attributes: passedAttributes,
        parentSpan,
        reportEvent,
        startTime,
        endTime
      } = options;
      const routeName = getCurrentScope().getScopeData().transactionName;
      const attributes = {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: origin,
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
        [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: 0,
        [`browser.web_vital.${metricName}.value`]: value,
        // oxlint-disable-next-line typescript-eslint/no-deprecated
        [Xc]: routeName,
        [Lc]: routeName,
        // Web vital score calculation relies on the user agent
        "user_agent.original": WINDOW.navigator?.userAgent,
        ...passedAttributes
      };
      if (parentSpan && spanToStreamedSpanJSON(parentSpan).attributes?.[SEMANTIC_ATTRIBUTE_SENTRY_OP] === "pageload") {
        attributes["sentry.pageload.span_id"] = parentSpan.spanContext().spanId;
      }
      if (reportEvent) {
        attributes[`browser.web_vital.${metricName}.report_event`] = reportEvent;
      }
      const span = startInactiveSpan({
        name,
        attributes,
        startTime,
        // if we have a pageload span, we let the web vital span start as its parent. This ensures that
        // it is not started as a segment span, without having to manually set it to a "standalone" v2 span
        // that has `segment: false` but no actual parent span.
        parentSpan
      });
      if (span) {
        span.end(endTime ?? startTime);
      }
    }
    function trackLcpAsSpan(client) {
      let lcpValue = 0;
      let lcpEntry;
      if (!supportsWebVital("largest-contentful-paint")) {
        return;
      }
      const cleanupLcpHandler = addLcpInstrumentationHandler(({ metric }) => {
        const entry = metric.entries[metric.entries.length - 1];
        if (!entry || !isValidLcpMetric(metric.value)) {
          return;
        }
        lcpValue = metric.value;
        lcpEntry = entry;
      }, true);
      listenForWebVitalReportEvents(client, (reportEvent, _, pageloadSpan) => {
        _sendLcpSpan(lcpValue, lcpEntry, pageloadSpan, reportEvent);
        cleanupLcpHandler();
      });
    }
    function _sendLcpSpan(lcpValue, entry, pageloadSpan, reportEvent) {
      if (!isValidLcpMetric(lcpValue)) {
        return;
      }
      DEBUG_BUILD$1 && debug.log(`Sending LCP span (${lcpValue})`);
      const performanceTimeOrigin = browserPerformanceTimeOrigin() || 0;
      const timeOrigin = msToSec(performanceTimeOrigin);
      const endTime = msToSec(performanceTimeOrigin + (entry?.startTime || 0));
      const name = entry ? htmlTreeAsString(entry.element) : "Largest contentful paint";
      const attributes = {};
      entry?.element && (attributes["browser.web_vital.lcp.element"] = htmlTreeAsString(entry.element));
      entry?.id && (attributes["browser.web_vital.lcp.id"] = entry.id);
      entry?.url && (attributes["browser.web_vital.lcp.url"] = entry.url);
      entry?.loadTime != null && (attributes["browser.web_vital.lcp.load_time"] = entry.loadTime);
      entry?.renderTime != null && (attributes["browser.web_vital.lcp.render_time"] = entry.renderTime);
      entry?.size != null && (attributes["browser.web_vital.lcp.size"] = entry.size);
      _emitWebVitalSpan({
        name,
        op: "ui.webvital.lcp",
        origin: "auto.http.browser.lcp",
        metricName: "lcp",
        value: lcpValue,
        attributes,
        parentSpan: pageloadSpan,
        reportEvent,
        startTime: timeOrigin,
        endTime
      });
    }
    function trackClsAsSpan(client) {
      let clsValue = 0;
      let clsEntry;
      if (!supportsWebVital("layout-shift")) {
        return;
      }
      const cleanupClsHandler = addClsInstrumentationHandler(({ metric }) => {
        const entry = metric.entries[metric.entries.length - 1];
        if (!entry) {
          return;
        }
        clsValue = metric.value;
        clsEntry = entry;
      }, true);
      listenForWebVitalReportEvents(client, (reportEvent, _, pageloadSpan) => {
        _sendClsSpan(clsValue, clsEntry, pageloadSpan, reportEvent);
        cleanupClsHandler();
      });
    }
    function _sendClsSpan(clsValue, entry, pageloadSpan, reportEvent) {
      DEBUG_BUILD$1 && debug.log(`Sending CLS span (${clsValue})`);
      const startTime = entry ? msToSec((browserPerformanceTimeOrigin() || 0) + entry.startTime) : timestampInSeconds();
      const name = entry ? htmlTreeAsString(entry.sources[0]?.node) : "Layout shift";
      const attributes = {};
      if (entry?.sources) {
        entry.sources.forEach((source, index) => {
          attributes[`browser.web_vital.cls.source.${index + 1}`] = htmlTreeAsString(source.node);
        });
      }
      _emitWebVitalSpan({
        name,
        op: "ui.webvital.cls",
        origin: "auto.http.browser.cls",
        metricName: "cls",
        value: clsValue,
        attributes,
        parentSpan: pageloadSpan,
        reportEvent,
        startTime
      });
    }
    function trackInpAsSpan() {
      const performance = getBrowserPerformanceAPI();
      if (!performance || !browserPerformanceTimeOrigin()) {
        return;
      }
      const onInp = ({ metric }) => {
        if (metric.value == null) {
          return;
        }
        const duration = msToSec(metric.value);
        if (duration > MAX_PLAUSIBLE_INP_DURATION) {
          return;
        }
        const entry = metric.entries.find((e) => e.duration === metric.value && INP_ENTRY_MAP[e.name]);
        if (!entry) {
          return;
        }
        _sendInpSpan(metric.value, entry);
      };
      addInpInstrumentationHandler(onInp);
    }
    function _sendInpSpan(inpValue, entry) {
      DEBUG_BUILD$1 && debug.log(`Sending INP span (${inpValue})`);
      const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
      const duration = msToSec(inpValue);
      const interactionType = INP_ENTRY_MAP[entry.name];
      const cachedContext = getCachedInteractionContext(entry.interactionId);
      const activeSpan = getActiveSpan();
      const rootSpan = activeSpan ? getRootSpan(activeSpan) : void 0;
      const spanToUse = cachedContext?.span || rootSpan;
      const routeName = spanToUse ? spanToStreamedSpanJSON(spanToUse).name : getCurrentScope().getScopeData().transactionName;
      const name = cachedContext?.elementName || htmlTreeAsString(entry.target);
      _emitWebVitalSpan({
        name,
        op: `ui.interaction.${interactionType}`,
        origin: "auto.http.browser.inp",
        metricName: "inp",
        value: inpValue,
        attributes: {
          [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: entry.duration,
          // oxlint-disable-next-line typescript-eslint/no-deprecated
          [Xc]: routeName,
          [Lc]: routeName
        },
        startTime,
        endTime: startTime + duration,
        parentSpan: spanToUse
      });
    }

    const DEBOUNCE_DURATION = 1e3;
    let debounceTimerID;
    let lastCapturedEventType;
    let lastCapturedEventTargetId;
    function addClickKeypressInstrumentationHandler(handler) {
      const type = "dom";
      addHandler$1(type, handler);
      maybeInstrument(type, instrumentDOM);
    }
    function instrumentDOM() {
      if (!WINDOW.document) {
        return;
      }
      const triggerDOMHandler = triggerHandlers$1.bind(null, "dom");
      const globalDOMEventHandler = makeDOMEventHandler(triggerDOMHandler, true);
      WINDOW.document.addEventListener("click", globalDOMEventHandler, false);
      WINDOW.document.addEventListener("keypress", globalDOMEventHandler, false);
      ["EventTarget", "Node"].forEach((target) => {
        const globalObject = WINDOW;
        const proto = globalObject[target]?.prototype;
        if (!proto?.hasOwnProperty?.("addEventListener")) {
          return;
        }
        fill(proto, "addEventListener", function(originalAddEventListener) {
          return function(type, listener, options) {
            if (type === "click" || type == "keypress") {
              try {
                const handlers = this.__sentry_instrumentation_handlers__ = this.__sentry_instrumentation_handlers__ || {};
                const handlerForType = handlers[type] = handlers[type] || { refCount: 0 };
                if (!handlerForType.handler) {
                  const handler = makeDOMEventHandler(triggerDOMHandler);
                  handlerForType.handler = handler;
                  originalAddEventListener.call(this, type, handler, options);
                }
                handlerForType.refCount++;
              } catch {
              }
            }
            return originalAddEventListener.call(this, type, listener, options);
          };
        });
        fill(
          proto,
          "removeEventListener",
          function(originalRemoveEventListener) {
            return function(type, listener, options) {
              if (type === "click" || type == "keypress") {
                try {
                  const handlers = this.__sentry_instrumentation_handlers__ || {};
                  const handlerForType = handlers[type];
                  if (handlerForType) {
                    handlerForType.refCount--;
                    if (handlerForType.refCount <= 0) {
                      originalRemoveEventListener.call(this, type, handlerForType.handler, options);
                      handlerForType.handler = void 0;
                      delete handlers[type];
                    }
                    if (Object.keys(handlers).length === 0) {
                      delete this.__sentry_instrumentation_handlers__;
                    }
                  }
                } catch {
                }
              }
              return originalRemoveEventListener.call(this, type, listener, options);
            };
          }
        );
      });
    }
    function isSimilarToLastCapturedEvent(event) {
      if (event.type !== lastCapturedEventType) {
        return false;
      }
      try {
        if (!event.target || event.target._sentryId !== lastCapturedEventTargetId) {
          return false;
        }
      } catch {
      }
      return true;
    }
    function shouldSkipDOMEvent(eventType, target) {
      if (eventType !== "keypress") {
        return false;
      }
      if (!target?.tagName) {
        return true;
      }
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return false;
      }
      return true;
    }
    function makeDOMEventHandler(handler, globalListener = false) {
      return (event) => {
        if (!event || event["_sentryCaptured"]) {
          return;
        }
        const target = getEventTarget(event);
        if (shouldSkipDOMEvent(event.type, target)) {
          return;
        }
        addNonEnumerableProperty(event, "_sentryCaptured", true);
        if (target && !target._sentryId) {
          addNonEnumerableProperty(target, "_sentryId", uuid4());
        }
        const name = event.type === "keypress" ? "input" : event.type;
        if (!isSimilarToLastCapturedEvent(event)) {
          const handlerData = { event, name, global: globalListener };
          handler(handlerData);
          lastCapturedEventType = event.type;
          lastCapturedEventTargetId = target ? target._sentryId : void 0;
        }
        clearTimeout(debounceTimerID);
        debounceTimerID = WINDOW.setTimeout(() => {
          lastCapturedEventTargetId = void 0;
          lastCapturedEventType = void 0;
        }, DEBOUNCE_DURATION);
      };
    }
    function getEventTarget(event) {
      try {
        return event.target;
      } catch {
        return null;
      }
    }

    let lastHref;
    function addHistoryInstrumentationHandler(handler) {
      const type = "history";
      addHandler$1(type, handler);
      maybeInstrument(type, instrumentHistory);
    }
    function instrumentHistory() {
      WINDOW.addEventListener("popstate", () => {
        const to = WINDOW.location.href;
        const from = lastHref;
        lastHref = to;
        if (from === to) {
          return;
        }
        const handlerData = { from, to };
        triggerHandlers$1("history", handlerData);
      });
      if (!supportsHistory()) {
        return;
      }
      function historyReplacementFunction(originalHistoryFunction) {
        return function(...args) {
          const url = args.length > 2 ? args[2] : void 0;
          if (url) {
            const from = lastHref;
            const to = getAbsoluteUrl(String(url));
            lastHref = to;
            if (from === to) {
              return originalHistoryFunction.apply(this, args);
            }
            const handlerData = { from, to };
            triggerHandlers$1("history", handlerData);
          }
          return originalHistoryFunction.apply(this, args);
        };
      }
      fill(WINDOW.history, "pushState", historyReplacementFunction);
      fill(WINDOW.history, "replaceState", historyReplacementFunction);
    }
    function getAbsoluteUrl(urlOrPath) {
      try {
        const url = new URL(urlOrPath, WINDOW.location.origin);
        return url.toString();
      } catch {
        return urlOrPath;
      }
    }

    const cachedImplementations = {};
    function getNativeImplementation(name) {
      const cached = cachedImplementations[name];
      if (cached) {
        return cached;
      }
      let impl = WINDOW[name];
      if (isNativeFunction(impl)) {
        return cachedImplementations[name] = impl.bind(WINDOW);
      }
      const document = WINDOW.document;
      if (document && typeof document.createElement === "function") {
        try {
          const sandbox = document.createElement("iframe");
          sandbox.hidden = true;
          document.head.appendChild(sandbox);
          const contentWindow = sandbox.contentWindow;
          if (contentWindow?.[name]) {
            impl = contentWindow[name];
          }
          document.head.removeChild(sandbox);
        } catch (e) {
          DEBUG_BUILD$1 && debug.warn(`Could not create sandbox iframe for ${name} check, bailing to window.${name}: `, e);
        }
      }
      if (!impl) {
        return impl;
      }
      return cachedImplementations[name] = impl.bind(WINDOW);
    }
    function clearCachedImplementation(name) {
      cachedImplementations[name] = void 0;
    }

    const SENTRY_XHR_DATA_KEY = "__sentry_xhr_v3__";
    function addXhrInstrumentationHandler(handler) {
      const type = "xhr";
      addHandler$1(type, handler);
      maybeInstrument(type, instrumentXHR);
    }
    function instrumentXHR() {
      if (!WINDOW.XMLHttpRequest) {
        return;
      }
      const xhrproto = XMLHttpRequest.prototype;
      xhrproto.open = new Proxy(xhrproto.open, {
        apply(originalOpen, xhrOpenThisArg, xhrOpenArgArray) {
          const virtualError = new Error();
          const startTimestamp = timestampInSeconds() * 1e3;
          const method = isString(xhrOpenArgArray[0]) ? xhrOpenArgArray[0].toUpperCase() : void 0;
          const url = parseXhrUrlArg(xhrOpenArgArray[1]);
          if (!method || !url) {
            return originalOpen.apply(xhrOpenThisArg, xhrOpenArgArray);
          }
          xhrOpenThisArg[SENTRY_XHR_DATA_KEY] = {
            method,
            url,
            request_headers: {}
          };
          if (method === "POST" && url.match(/sentry_key/)) {
            xhrOpenThisArg.__sentry_own_request__ = true;
          }
          const onreadystatechangeHandler = () => {
            const xhrInfo = xhrOpenThisArg[SENTRY_XHR_DATA_KEY];
            if (!xhrInfo) {
              return;
            }
            if (xhrOpenThisArg.readyState === 4) {
              try {
                xhrInfo.status_code = xhrOpenThisArg.status;
              } catch {
              }
              const handlerData = {
                endTimestamp: timestampInSeconds() * 1e3,
                startTimestamp,
                xhr: xhrOpenThisArg,
                virtualError
              };
              triggerHandlers$1("xhr", handlerData);
              xhrOpenThisArg.removeEventListener("readystatechange", onreadystatechangeHandler);
            }
          };
          if ("onreadystatechange" in xhrOpenThisArg && typeof xhrOpenThisArg.onreadystatechange === "function") {
            xhrOpenThisArg.onreadystatechange = new Proxy(xhrOpenThisArg.onreadystatechange, {
              apply(originalOnreadystatechange, onreadystatechangeThisArg, onreadystatechangeArgArray) {
                onreadystatechangeHandler();
                return originalOnreadystatechange.apply(onreadystatechangeThisArg, onreadystatechangeArgArray);
              }
            });
          } else {
            xhrOpenThisArg.addEventListener("readystatechange", onreadystatechangeHandler);
          }
          xhrOpenThisArg.setRequestHeader = new Proxy(xhrOpenThisArg.setRequestHeader, {
            apply(originalSetRequestHeader, setRequestHeaderThisArg, setRequestHeaderArgArray) {
              const [header, value] = setRequestHeaderArgArray;
              const xhrInfo = setRequestHeaderThisArg[SENTRY_XHR_DATA_KEY];
              if (xhrInfo && isString(header) && isString(value)) {
                xhrInfo.request_headers[header.toLowerCase()] = value;
              }
              return originalSetRequestHeader.apply(setRequestHeaderThisArg, setRequestHeaderArgArray);
            }
          });
          return originalOpen.apply(xhrOpenThisArg, xhrOpenArgArray);
        }
      });
      xhrproto.send = new Proxy(xhrproto.send, {
        apply(originalSend, sendThisArg, sendArgArray) {
          const sentryXhrData = sendThisArg[SENTRY_XHR_DATA_KEY];
          if (!sentryXhrData) {
            return originalSend.apply(sendThisArg, sendArgArray);
          }
          if (sendArgArray[0] !== void 0) {
            sentryXhrData.body = sendArgArray[0];
          }
          const handlerData = {
            startTimestamp: timestampInSeconds() * 1e3,
            xhr: sendThisArg
          };
          triggerHandlers$1("xhr", handlerData);
          return originalSend.apply(sendThisArg, sendArgArray);
        }
      });
    }
    function parseXhrUrlArg(url) {
      if (isString(url)) {
        return url;
      }
      try {
        return url.toString();
      } catch {
      }
      return void 0;
    }

    function parseXhrResponseHeaders(xhr) {
      let headers;
      try {
        headers = xhr.getAllResponseHeaders();
      } catch (error) {
        DEBUG_BUILD$1 && debug.error(error, "Failed to get xhr response headers", xhr);
        return {};
      }
      if (!headers) {
        return {};
      }
      return headers.split("\r\n").reduce((acc, line) => {
        const [key, value] = line.split(": ");
        if (value) {
          acc[key.toLowerCase()] = value;
        }
        return acc;
      }, {});
    }

    function isElement(wat) {
      if (typeof Element === "undefined") {
        return false;
      }
      try {
        return wat instanceof Element;
      } catch {
        return false;
      }
    }

    const DEFAULT_BROWSER_TRANSPORT_BUFFER_SIZE = 40;
    function makeFetchTransport(options, nativeFetch = getNativeImplementation("fetch")) {
      let pendingBodySize = 0;
      let pendingCount = 0;
      async function makeRequest(request) {
        const requestSize = request.body.length;
        pendingBodySize += requestSize;
        pendingCount++;
        const requestOptions = {
          body: request.body,
          method: "POST",
          referrerPolicy: "strict-origin",
          headers: options.headers,
          // Outgoing requests are usually cancelled when navigating to a different page, causing a "TypeError: Failed to
          // fetch" error and sending a "network_error" client-outcome - in Chrome, the request status shows "(cancelled)".
          // The `keepalive` flag keeps outgoing requests alive, even when switching pages. We want this since we're
          // frequently sending events right before the user is switching pages (eg. when finishing navigation transactions).
          // Gotchas:
          // - `keepalive` isn't supported by Firefox
          // - As per spec (https://fetch.spec.whatwg.org/#http-network-or-cache-fetch):
          //   If the sum of contentLength and inflightKeepaliveBytes is greater than 64 kibibytes, then return a network error.
          //   We will therefore only activate the flag when we're below that limit.
          // There is also a limit of requests that can be open at the same time, so we also limit this to 15
          // See https://github.com/getsentry/sentry-javascript/pull/7553 for details
          keepalive: pendingBodySize <= 6e4 && pendingCount < 15,
          ...options.fetchOptions
        };
        try {
          const response = await nativeFetch(options.url, requestOptions);
          return {
            statusCode: response.status,
            headers: {
              "x-sentry-rate-limits": response.headers.get("X-Sentry-Rate-Limits"),
              "retry-after": response.headers.get("Retry-After")
            }
          };
        } catch (e) {
          clearCachedImplementation("fetch");
          throw e;
        } finally {
          pendingBodySize -= requestSize;
          pendingCount--;
        }
      }
      return createTransport(
        options,
        makeRequest,
        makePromiseBuffer(options.bufferSize || DEFAULT_BROWSER_TRANSPORT_BUFFER_SIZE)
      );
    }

    const DEBUG_BUILD = (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__);

    const CHROME_PRIORITY = 30;
    const GECKO_PRIORITY = 50;
    function createFrame(filename, func, lineno, colno) {
      const frame = {
        filename,
        function: func === "<anonymous>" ? UNKNOWN_FUNCTION : func,
        in_app: true
        // All browser frames are considered in_app
      };
      if (lineno !== void 0) {
        frame.lineno = lineno;
      }
      if (colno !== void 0) {
        frame.colno = colno;
      }
      return frame;
    }
    const chromeRegexNoFnName = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i;
    const chromeRegex = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
    const chromeEvalRegex = /\((\S*)(?::(\d+))(?::(\d+))\)/;
    const chromeDataUriRegex = /at (.+?) ?\(data:(.+?),/;
    const chromeStackParserFn = (line) => {
      const dataUriMatch = line.match(chromeDataUriRegex);
      if (dataUriMatch) {
        return {
          filename: `<data:${dataUriMatch[2]}>`,
          function: dataUriMatch[1]
        };
      }
      const noFnParts = chromeRegexNoFnName.exec(line);
      if (noFnParts) {
        const [, filename, line2, col] = noFnParts;
        return createFrame(filename, UNKNOWN_FUNCTION, +line2, +col);
      }
      const parts = chromeRegex.exec(line);
      if (parts) {
        const isEval = parts[2]?.indexOf("eval") === 0;
        if (isEval) {
          const subMatch = chromeEvalRegex.exec(parts[2]);
          if (subMatch) {
            parts[2] = subMatch[1];
            parts[3] = subMatch[2];
            parts[4] = subMatch[3];
          }
        }
        const [func, filename] = extractSafariExtensionDetails(parts[1] || UNKNOWN_FUNCTION, parts[2]);
        return createFrame(filename, func, parts[3] ? +parts[3] : void 0, parts[4] ? +parts[4] : void 0);
      }
      return;
    };
    const chromeStackLineParser = [CHROME_PRIORITY, chromeStackParserFn];
    const geckoREgex = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
    const geckoEvalRegex = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
    const gecko = (line) => {
      const parts = geckoREgex.exec(line);
      if (parts) {
        const isEval = parts[3] && parts[3].indexOf(" > eval") > -1;
        if (isEval) {
          const subMatch = geckoEvalRegex.exec(parts[3]);
          if (subMatch) {
            parts[1] = parts[1] || "eval";
            parts[3] = subMatch[1];
            parts[4] = subMatch[2];
            parts[5] = "";
          }
        }
        let filename = parts[3];
        let func = parts[1] || UNKNOWN_FUNCTION;
        [func, filename] = extractSafariExtensionDetails(func, filename);
        return createFrame(filename, func, parts[4] ? +parts[4] : void 0, parts[5] ? +parts[5] : void 0);
      }
      return;
    };
    const geckoStackLineParser = [GECKO_PRIORITY, gecko];
    const defaultStackLineParsers = [chromeStackLineParser, geckoStackLineParser];
    const defaultStackParser = createStackParser(...defaultStackLineParsers);
    const extractSafariExtensionDetails = (func, filename) => {
      const isSafariExtension = func.indexOf("safari-extension") !== -1;
      const isSafariWebExtension = func.indexOf("safari-web-extension") !== -1;
      return isSafariExtension || isSafariWebExtension ? [
        func.indexOf("@") !== -1 ? func.split("@")[0] : UNKNOWN_FUNCTION,
        isSafariExtension ? `safari-extension:${filename}` : `safari-web-extension:${filename}`
      ] : [func, filename];
    };

    const MAX_ALLOWED_STRING_LENGTH = 1024;
    const INTEGRATION_NAME$4 = "Breadcrumbs";
    const _breadcrumbsIntegration = ((options = {}) => {
      const _options = {
        console: true,
        dom: true,
        fetch: true,
        history: true,
        sentry: true,
        xhr: true,
        ...options
      };
      return {
        name: INTEGRATION_NAME$4,
        setup(client) {
          if (_options.console) {
            addConsoleInstrumentationHandler(_getConsoleBreadcrumbHandler(client));
          }
          if (_options.dom) {
            addClickKeypressInstrumentationHandler(_getDomBreadcrumbHandler(client, _options.dom));
          }
          if (_options.xhr) {
            addXhrInstrumentationHandler(_getXhrBreadcrumbHandler(client));
          }
          if (_options.fetch) {
            addFetchInstrumentationHandler(_getFetchBreadcrumbHandler(client));
          }
          if (_options.history) {
            addHistoryInstrumentationHandler(_getHistoryBreadcrumbHandler(client));
          }
          if (_options.sentry) {
            client.on("beforeSendEvent", _getSentryBreadcrumbHandler(client));
          }
        }
      };
    });
    const breadcrumbsIntegration = defineIntegration(_breadcrumbsIntegration);
    function _getSentryBreadcrumbHandler(client) {
      return function addSentryBreadcrumb(event) {
        if (getClient() !== client) {
          return;
        }
        addBreadcrumb(
          {
            category: `sentry.${event.type === "transaction" ? "transaction" : "event"}`,
            event_id: event.event_id,
            level: event.level,
            message: getEventDescription(event)
          },
          {
            event
          }
        );
      };
    }
    function _getDomBreadcrumbHandler(client, dom) {
      return function _innerDomBreadcrumb(handlerData) {
        if (getClient() !== client) {
          return;
        }
        let target;
        let componentName;
        let keyAttrs = typeof dom === "object" ? dom.serializeAttribute : void 0;
        let maxStringLength = typeof dom === "object" && typeof dom.maxStringLength === "number" ? dom.maxStringLength : void 0;
        if (maxStringLength && maxStringLength > MAX_ALLOWED_STRING_LENGTH) {
          DEBUG_BUILD && debug.warn(
            `\`dom.maxStringLength\` cannot exceed ${MAX_ALLOWED_STRING_LENGTH}, but a value of ${maxStringLength} was configured. Sentry will use ${MAX_ALLOWED_STRING_LENGTH} instead.`
          );
          maxStringLength = MAX_ALLOWED_STRING_LENGTH;
        }
        if (typeof keyAttrs === "string") {
          keyAttrs = [keyAttrs];
        }
        try {
          const event = handlerData.event;
          const element = _isEvent(event) ? event.target : event;
          target = htmlTreeAsString(element, { keyAttrs, maxStringLength });
          componentName = getComponentName(element);
        } catch {
          target = "<unknown>";
        }
        if (target.length === 0) {
          return;
        }
        const breadcrumb = {
          category: `ui.${handlerData.name}`,
          message: target
        };
        if (componentName) {
          breadcrumb.data = { "ui.component_name": componentName };
        }
        addBreadcrumb(breadcrumb, {
          event: handlerData.event,
          name: handlerData.name,
          global: handlerData.global
        });
      };
    }
    function _getConsoleBreadcrumbHandler(client) {
      return function _consoleBreadcrumb(handlerData) {
        if (getClient() !== client) {
          return;
        }
        const breadcrumb = {
          category: "console",
          data: {
            arguments: handlerData.args,
            logger: "console"
          },
          level: severityLevelFromString(handlerData.level),
          message: safeJoin(handlerData.args, " ")
        };
        if (handlerData.level === "assert") {
          if (handlerData.args[0] === false) {
            breadcrumb.message = `Assertion failed: ${safeJoin(handlerData.args.slice(1), " ") || "console.assert"}`;
            breadcrumb.data.arguments = handlerData.args.slice(1);
          } else {
            return;
          }
        }
        addBreadcrumb(breadcrumb, {
          input: handlerData.args,
          level: handlerData.level
        });
      };
    }
    function _getXhrBreadcrumbHandler(client) {
      return function _xhrBreadcrumb(handlerData) {
        if (getClient() !== client) {
          return;
        }
        const { startTimestamp, endTimestamp } = handlerData;
        const sentryXhrData = handlerData.xhr[SENTRY_XHR_DATA_KEY];
        if (!startTimestamp || !endTimestamp || !sentryXhrData) {
          return;
        }
        const { method, url, status_code, body } = sentryXhrData;
        const data = {
          method,
          url,
          status_code
        };
        const hint = {
          xhr: handlerData.xhr,
          input: body,
          startTimestamp,
          endTimestamp
        };
        const breadcrumb = {
          category: "xhr",
          data,
          type: "http",
          level: getBreadcrumbLogLevelFromHttpStatusCode(status_code)
        };
        client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
        addBreadcrumb(breadcrumb, hint);
      };
    }
    function _getFetchBreadcrumbHandler(client) {
      return function _fetchBreadcrumb(handlerData) {
        if (getClient() !== client) {
          return;
        }
        const { startTimestamp, endTimestamp } = handlerData;
        if (!endTimestamp) {
          return;
        }
        if (handlerData.fetchData.url.match(/sentry_key/) && handlerData.fetchData.method === "POST") {
          return;
        }
        if (handlerData.error) {
          const hint = {
            data: handlerData.error,
            input: handlerData.args,
            startTimestamp,
            endTimestamp
          };
          const breadcrumb = {
            category: "fetch",
            data: handlerData.fetchData,
            level: "error",
            type: "http"
          };
          client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
          addBreadcrumb(breadcrumb, hint);
        } else {
          const response = handlerData.response;
          const data = {
            ...handlerData.fetchData,
            status_code: response?.status
          };
          const hint = {
            input: handlerData.args,
            response,
            startTimestamp,
            endTimestamp
          };
          const breadcrumb = {
            category: "fetch",
            data,
            type: "http",
            level: getBreadcrumbLogLevelFromHttpStatusCode(data.status_code)
          };
          client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
          addBreadcrumb(breadcrumb, hint);
        }
      };
    }
    function _getHistoryBreadcrumbHandler(client) {
      return function _historyBreadcrumb(handlerData) {
        if (getClient() !== client) {
          return;
        }
        let from = handlerData.from;
        let to = handlerData.to;
        const parsedLoc = parseUrl(WINDOW$1.location.href);
        let parsedFrom = from ? parseUrl(from) : void 0;
        const parsedTo = parseUrl(to);
        if (!parsedFrom?.path) {
          parsedFrom = parsedLoc;
        }
        if (parsedLoc.protocol === parsedTo.protocol && parsedLoc.host === parsedTo.host) {
          to = parsedTo.relative;
        }
        if (parsedLoc.protocol === parsedFrom.protocol && parsedLoc.host === parsedFrom.host) {
          from = parsedFrom.relative;
        }
        addBreadcrumb({
          category: "navigation",
          data: {
            from,
            to
          }
        });
      };
    }
    function _isEvent(event) {
      return !!event && !!event.target;
    }

    const DEFAULT_EVENT_TARGET = "EventTarget,Window,Node,ApplicationCache,AudioTrackList,BroadcastChannel,ChannelMergerNode,CryptoOperation,EventSource,FileReader,HTMLUnknownElement,IDBDatabase,IDBRequest,IDBTransaction,KeyOperation,MediaController,MessagePort,ModalWindow,Notification,SVGElementInstance,Screen,SharedWorker,TextTrack,TextTrackCue,TextTrackList,WebSocket,WebSocketWorker,Worker,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload".split(
      ","
    );
    const INTEGRATION_NAME$3 = "BrowserApiErrors";
    const _browserApiErrorsIntegration = ((options = {}) => {
      const _options = {
        XMLHttpRequest: true,
        eventTarget: true,
        requestAnimationFrame: true,
        setInterval: true,
        setTimeout: true,
        unregisterOriginalCallbacks: false,
        ...options
      };
      return {
        name: INTEGRATION_NAME$3,
        // TODO: This currently only works for the first client this is setup
        // We may want to adjust this to check for client etc.
        setupOnce() {
          if (_options.setTimeout) {
            fill(WINDOW$1, "setTimeout", _wrapTimeFunction);
          }
          if (_options.setInterval) {
            fill(WINDOW$1, "setInterval", _wrapTimeFunction);
          }
          if (_options.requestAnimationFrame) {
            fill(WINDOW$1, "requestAnimationFrame", _wrapRAF);
          }
          if (_options.XMLHttpRequest && "XMLHttpRequest" in WINDOW$1) {
            fill(XMLHttpRequest.prototype, "send", _wrapXHR);
          }
          const eventTargetOption = _options.eventTarget;
          if (eventTargetOption) {
            const eventTarget = Array.isArray(eventTargetOption) ? eventTargetOption : DEFAULT_EVENT_TARGET;
            eventTarget.forEach((target) => _wrapEventTarget(target, _options));
          }
        }
      };
    });
    const browserApiErrorsIntegration = defineIntegration(_browserApiErrorsIntegration);
    function _wrapTimeFunction(original) {
      return function(...args) {
        const originalCallback = args[0];
        args[0] = wrap(originalCallback, {
          mechanism: {
            handled: false,
            type: `auto.browser.browserapierrors.${getFunctionName(original)}`
          }
        });
        return original.apply(this, args);
      };
    }
    function _wrapRAF(original) {
      return function(callback) {
        return original.apply(this, [
          wrap(callback, {
            mechanism: {
              data: {
                handler: getFunctionName(original)
              },
              handled: false,
              type: "auto.browser.browserapierrors.requestAnimationFrame"
            }
          })
        ]);
      };
    }
    function _wrapXHR(originalSend) {
      return function(...args) {
        const xhr = this;
        const xmlHttpRequestProps = ["onload", "onerror", "onprogress", "onreadystatechange"];
        xmlHttpRequestProps.forEach((prop) => {
          if (prop in xhr && typeof xhr[prop] === "function") {
            fill(xhr, prop, function(original) {
              const wrapOptions = {
                mechanism: {
                  data: {
                    handler: getFunctionName(original)
                  },
                  handled: false,
                  type: `auto.browser.browserapierrors.xhr.${prop}`
                }
              };
              const originalFunction = getOriginalFunction(original);
              if (originalFunction) {
                wrapOptions.mechanism.data.handler = getFunctionName(originalFunction);
              }
              return wrap(original, wrapOptions);
            });
          }
        });
        return originalSend.apply(this, args);
      };
    }
    function _wrapEventTarget(target, integrationOptions) {
      const globalObject = WINDOW$1;
      const proto = globalObject[target]?.prototype;
      if (!proto?.hasOwnProperty?.("addEventListener")) {
        return;
      }
      fill(proto, "addEventListener", function(original) {
        return function(eventName, fn, options) {
          try {
            if (isEventListenerObject(fn)) {
              fn.handleEvent = wrap(fn.handleEvent, {
                mechanism: {
                  data: {
                    handler: getFunctionName(fn),
                    target
                  },
                  handled: false,
                  type: "auto.browser.browserapierrors.handleEvent"
                }
              });
            }
          } catch {
          }
          if (integrationOptions.unregisterOriginalCallbacks) {
            unregisterOriginalCallback(this, eventName, fn);
          }
          return original.apply(this, [
            eventName,
            wrap(fn, {
              mechanism: {
                data: {
                  handler: getFunctionName(fn),
                  target
                },
                handled: false,
                type: "auto.browser.browserapierrors.addEventListener"
              }
            }),
            options
          ]);
        };
      });
      fill(proto, "removeEventListener", function(originalRemoveEventListener) {
        return function(eventName, fn, options) {
          try {
            if (Object.prototype.hasOwnProperty.call(fn, "__sentry_wrapped__")) {
              const originalEventHandler = fn.__sentry_wrapped__;
              if (originalEventHandler) {
                originalRemoveEventListener.call(this, eventName, originalEventHandler, options);
              }
            }
          } catch {
          }
          return originalRemoveEventListener.call(this, eventName, fn, options);
        };
      });
    }
    function isEventListenerObject(obj) {
      return typeof obj.handleEvent === "function";
    }
    function unregisterOriginalCallback(target, eventName, fn) {
      if (target && typeof target === "object" && "removeEventListener" in target && typeof target.removeEventListener === "function") {
        target.removeEventListener(eventName, fn);
      }
    }

    const browserSessionIntegration = defineIntegration((options = {}) => {
      const lifecycle = options.lifecycle ?? "route";
      return {
        name: "BrowserSession",
        setupOnce() {
          if (typeof WINDOW$1.document === "undefined") {
            DEBUG_BUILD && debug.warn("Using the `browserSessionIntegration` in non-browser environments is not supported.");
            return;
          }
          startSession({ ignoreDuration: true });
          let initialSessionSent = false;
          whenIdleOrHidden(() => {
            if (!initialSessionSent) {
              captureSession();
              initialSessionSent = true;
            }
          });
          const isolationScope = getIsolationScope();
          let previousUser = isolationScope.getUser();
          isolationScope.addScopeListener((scope) => {
            const maybeNewUser = scope.getUser();
            if (previousUser?.id !== maybeNewUser?.id || previousUser?.ip_address !== maybeNewUser?.ip_address) {
              previousUser = maybeNewUser;
              if (initialSessionSent) {
                captureSession();
              }
            }
          });
          if (lifecycle === "route") {
            addHistoryInstrumentationHandler(({ from, to }) => {
              if (from !== to) {
                startSession({ ignoreDuration: true });
                captureSession();
                initialSessionSent = true;
              }
            });
          }
        }
      };
    });

    const INTEGRATION_NAME$2 = "CultureContext";
    const _cultureContextIntegration = (() => {
      return {
        name: INTEGRATION_NAME$2,
        preprocessEvent(event) {
          const culture = getCultureContext();
          if (culture) {
            event.contexts = {
              ...event.contexts,
              culture: { ...culture, ...event.contexts?.culture }
            };
          }
        },
        processSegmentSpan(span) {
          const culture = getCultureContext();
          if (culture) {
            safeSetSpanJSONAttributes(span, {
              "culture.locale": culture.locale,
              "culture.timezone": culture.timezone,
              "culture.calendar": culture.calendar
            });
          }
        }
      };
    });
    const cultureContextIntegration = defineIntegration(_cultureContextIntegration);
    function getCultureContext() {
      try {
        const intl = WINDOW$1.Intl;
        if (!intl) {
          return void 0;
        }
        const options = intl.DateTimeFormat().resolvedOptions();
        return {
          locale: options.locale,
          timezone: options.timeZone,
          calendar: options.calendar
        };
      } catch {
        return void 0;
      }
    }

    const INTEGRATION_NAME$1 = "GlobalHandlers";
    const _globalHandlersIntegration = ((options = {}) => {
      const _options = {
        onerror: true,
        onunhandledrejection: true,
        ...options
      };
      return {
        name: INTEGRATION_NAME$1,
        setupOnce() {
          Error.stackTraceLimit = 50;
        },
        setup(client) {
          if (_options.onerror) {
            _installGlobalOnErrorHandler(client);
            globalHandlerLog("onerror");
          }
          if (_options.onunhandledrejection) {
            _installGlobalOnUnhandledRejectionHandler(client);
            globalHandlerLog("onunhandledrejection");
          }
        }
      };
    });
    const globalHandlersIntegration = defineIntegration(_globalHandlersIntegration);
    function _installGlobalOnErrorHandler(client) {
      addGlobalErrorInstrumentationHandler((data) => {
        const { stackParser, attachStacktrace } = getOptions();
        if (getClient() !== client || shouldIgnoreOnError()) {
          return;
        }
        const { msg, url, line, column, error } = data;
        const event = _enhanceEventWithInitialFrame(
          eventFromUnknownInput(stackParser, error || msg, void 0, attachStacktrace, false),
          url,
          line,
          column
        );
        event.level = "error";
        captureEvent(event, {
          originalException: error,
          mechanism: {
            handled: false,
            type: "auto.browser.global_handlers.onerror"
          }
        });
      });
    }
    function _installGlobalOnUnhandledRejectionHandler(client) {
      addGlobalUnhandledRejectionInstrumentationHandler((e) => {
        const { stackParser, attachStacktrace } = getOptions();
        if (getClient() !== client || shouldIgnoreOnError()) {
          return;
        }
        const error = _getUnhandledRejectionError(e);
        const event = isPrimitive(error) ? _eventFromRejectionWithPrimitive(error) : eventFromUnknownInput(stackParser, error, void 0, attachStacktrace, true);
        event.level = "error";
        captureEvent(event, {
          originalException: error,
          mechanism: {
            handled: false,
            type: "auto.browser.global_handlers.onunhandledrejection"
          }
        });
      });
    }
    function _getUnhandledRejectionError(error) {
      if (isPrimitive(error)) {
        return error;
      }
      try {
        if ("reason" in error) {
          return error.reason;
        }
        if ("detail" in error && "reason" in error.detail) {
          return error.detail.reason;
        }
      } catch {
      }
      return error;
    }
    function _eventFromRejectionWithPrimitive(reason) {
      return {
        exception: {
          values: [
            {
              type: "UnhandledRejection",
              // String() is needed because the Primitive type includes symbols (which can't be automatically stringified)
              value: `Non-Error promise rejection captured with value: ${String(reason)}`
            }
          ]
        }
      };
    }
    function _enhanceEventWithInitialFrame(event, url, lineno, colno) {
      const e = event.exception = event.exception || {};
      const ev = e.values = e.values || [];
      const ev0 = ev[0] = ev[0] || {};
      const ev0s = ev0.stacktrace = ev0.stacktrace || {};
      const ev0sf = ev0s.frames = ev0s.frames || [];
      if (ev0sf.length === 0) {
        ev0sf.push({
          colno,
          lineno,
          filename: getFilenameFromUrl(url) ?? getLocationHref(),
          function: UNKNOWN_FUNCTION,
          in_app: true
        });
      }
      return event;
    }
    function globalHandlerLog(type) {
      DEBUG_BUILD && debug.log(`Global Handler attached: ${type}`);
    }
    function getOptions() {
      const client = getClient();
      const options = client?.getOptions() || {
        stackParser: () => [],
        attachStacktrace: false
      };
      return options;
    }
    function getFilenameFromUrl(url) {
      if (!isString(url) || url.length === 0) {
        return void 0;
      }
      if (url.startsWith("data:")) {
        return `<${stripDataUrlContent(url, false)}>`;
      }
      return url;
    }

    const httpContextIntegration = defineIntegration(() => {
      return {
        name: "HttpContext",
        preprocessEvent(event) {
          if (!WINDOW$1.navigator && !WINDOW$1.location && !WINDOW$1.document) {
            return;
          }
          const reqData = getHttpRequestData();
          const headers = {
            ...reqData.headers,
            ...event.request?.headers
          };
          event.request = {
            ...reqData,
            ...event.request,
            headers
          };
        },
        processSpan(span) {
          if (!WINDOW$1.navigator && !WINDOW$1.location && !WINDOW$1.document) {
            return;
          }
          const reqData = getHttpRequestData();
          safeSetSpanJSONAttributes(span, {
            // This attribute is used by the "Filter out events from legacy browsers and crawlers" features on the Sentry backend.
            // Therefore, it's set on every span.
            [Qu]: reqData.headers["User-Agent"],
            // These attributes, we only need on the segment span (analogous to the `request` context for events)
            ...span.is_segment && {
              // Coerce empty string to undefined so the helper's nullish check drops it,
              // rather than writing an empty `url.full` attribute onto the span.
              [Yu]: span.attributes?.[Sc] !== "http.client" ? reqData.url : void 0,
              [`${ts}.referer`]: reqData.headers["Referer"]
            }
          });
        }
      };
    });

    const DEFAULT_KEY = "cause";
    const DEFAULT_LIMIT = 5;
    const INTEGRATION_NAME = "LinkedErrors";
    const _linkedErrorsIntegration = ((options = {}) => {
      const limit = options.limit || DEFAULT_LIMIT;
      const key = options.key || DEFAULT_KEY;
      return {
        name: INTEGRATION_NAME,
        preprocessEvent(event, hint, client) {
          const options2 = client.getOptions();
          applyAggregateErrorsToEvent(
            // This differs from the LinkedErrors integration in core by using a different exceptionFromError function
            exceptionFromError,
            options2.stackParser,
            key,
            limit,
            event,
            hint
          );
        }
      };
    });
    const linkedErrorsIntegration = defineIntegration(_linkedErrorsIntegration);

    const HTML_ELEMENT_CONSTRUCTOR_NAME_REGEX = /^HTML(\w*)Element$/;
    function normalizeStringifyValue(value) {
      if (typeof window !== "undefined" && value === window) {
        return "[Window]";
      }
      if (typeof document !== "undefined" && value === document) {
        return "[Document]";
      }
      if (isElement(value)) {
        const objName = getConstructorName(value);
        if (HTML_ELEMENT_CONSTRUCTOR_NAME_REGEX.test(objName)) {
          return `[HTMLElement: ${htmlTreeAsString(value)}]`;
        }
      }
      return void 0;
    }
    function getConstructorName(value) {
      const prototype = Object.getPrototypeOf(value);
      return prototype?.constructor ? prototype.constructor.name : "null prototype";
    }

    function checkAndWarnIfIsEmbeddedBrowserExtension() {
      if (_isEmbeddedBrowserExtension()) {
        if (DEBUG_BUILD) {
          consoleSandbox(() => {
            console.error(
              "[Sentry] You cannot use Sentry.init() in a browser extension, see: https://docs.sentry.io/platforms/javascript/best-practices/browser-extensions/"
            );
          });
        }
        return true;
      }
      return false;
    }
    function _isEmbeddedBrowserExtension() {
      if (typeof WINDOW$1.window === "undefined") {
        return false;
      }
      const _window = WINDOW$1;
      if (_window.nw) {
        return false;
      }
      const extensionObject = _window["chrome"] || _window["browser"];
      if (!extensionObject?.runtime?.id) {
        return false;
      }
      const href = getLocationHref();
      const isDedicatedExtensionPage = WINDOW$1 === WINDOW$1.top && /^(?:chrome-extension|moz-extension|ms-browser-extension|safari-web-extension):\/\//.test(href);
      return !isDedicatedExtensionPage;
    }

    function getDefaultIntegrations(_options) {
      return [
        // TODO(v11): Replace with `eventFiltersIntegration` once we remove the deprecated `inboundFiltersIntegration`
        // eslint-disable-next-line typescript/no-deprecated
        inboundFiltersIntegration(),
        functionToStringIntegration(),
        conversationIdIntegration(),
        browserApiErrorsIntegration(),
        breadcrumbsIntegration(),
        globalHandlersIntegration(),
        linkedErrorsIntegration(),
        dedupeIntegration(),
        httpContextIntegration(),
        cultureContextIntegration(),
        browserSessionIntegration()
      ];
    }
    function init(options = {}) {
      const shouldDisableBecauseIsBrowserExtenstion = !options.skipBrowserExtensionCheck && checkAndWarnIfIsEmbeddedBrowserExtension();
      let defaultIntegrations = options.defaultIntegrations == null ? getDefaultIntegrations() : options.defaultIntegrations;
      const clientOptions = {
        ...options,
        enabled: shouldDisableBecauseIsBrowserExtenstion ? false : options.enabled,
        stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
        integrations: getIntegrationsToSetup({
          integrations: options.integrations,
          defaultIntegrations
        }),
        transport: options.transport || makeFetchTransport
      };
      setNormalizeStringifier(normalizeStringifyValue);
      return initAndBind(BrowserClient, clientOptions);
    }

    function baggageHeaderHasSentryValues(baggageHeader) {
      return baggageHeader.split(",").some((value) => value.trim().startsWith("sentry-"));
    }
    function getFullURL(url) {
      try {
        const parsed = new URL(url, WINDOW$1.location.origin);
        return parsed.href;
      } catch {
        return void 0;
      }
    }
    function isPerformanceResourceTiming(entry) {
      return entry.entryType === "resource" && "initiatorType" in entry && typeof entry.nextHopProtocol === "string" && (entry.initiatorType === "fetch" || entry.initiatorType === "xmlhttprequest");
    }
    function createHeadersSafely(headers) {
      try {
        return new Headers(headers);
      } catch {
        return void 0;
      }
    }

    const defaultRequestInstrumentationOptions = {
      traceFetch: true,
      traceXHR: true,
      enableHTTPTimings: true,
      trackFetchStreamPerformance: false
    };
    function instrumentOutgoingRequests(client, _options) {
      const {
        traceFetch,
        traceXHR,
        shouldCreateSpanForRequest,
        enableHTTPTimings,
        tracePropagationTargets,
        onRequestSpanStart,
        onRequestSpanEnd
      } = {
        ...defaultRequestInstrumentationOptions,
        ..._options
      };
      const shouldCreateSpan = typeof shouldCreateSpanForRequest === "function" ? shouldCreateSpanForRequest : (_) => true;
      const shouldAttachHeadersWithTargets = (url) => shouldAttachHeaders(url, tracePropagationTargets);
      const spans = {};
      const propagateTraceparent = client.getOptions().propagateTraceparent;
      if (traceFetch) {
        addFetchInstrumentationHandler((handlerData) => {
          const createdSpan = instrumentFetchRequest(handlerData, shouldCreateSpan, shouldAttachHeadersWithTargets, spans, {
            propagateTraceparent,
            onRequestSpanEnd
          });
          if (createdSpan) {
            const fullUrl = getFullURL(handlerData.fetchData.url);
            const host = fullUrl ? parseUrl(fullUrl).host : void 0;
            const sanitizedFullUrl = fullUrl ? stripDataUrlContent(fullUrl) : void 0;
            createdSpan.setAttributes({
              // oxlint-disable-next-line typescript/no-deprecated
              [ws]: sanitizedFullUrl,
              // `url.full` must match `http.url`. Setting it here ensures parentless `http.client`
              // segment spans don't get `url.full` backfilled with the host page URL (see httpContextIntegration).
              [Yu]: sanitizedFullUrl,
              "server.address": host
            });
            if (enableHTTPTimings) {
              addHTTPTimings(createdSpan, client);
            }
            onRequestSpanStart?.(createdSpan, { headers: handlerData.headers });
          }
        });
      }
      if (traceXHR) {
        addXhrInstrumentationHandler((handlerData) => {
          const createdSpan = xhrCallback(
            handlerData,
            shouldCreateSpan,
            shouldAttachHeadersWithTargets,
            spans,
            propagateTraceparent,
            onRequestSpanEnd
          );
          if (createdSpan) {
            if (enableHTTPTimings) {
              addHTTPTimings(createdSpan, client);
            }
            onRequestSpanStart?.(createdSpan, {
              headers: createHeadersSafely(handlerData.xhr.__sentry_xhr_v3__?.request_headers)
            });
          }
        });
      }
    }
    const HTTP_TIMING_WAIT_MS = 300;
    function addHTTPTimings(span, client) {
      const { url } = spanToJSON(span).data;
      if (!url || typeof url !== "string") {
        return;
      }
      let onEntryFound = () => void setTimeout(unsubscribePerformanceObsever);
      if (hasSpanStreamingEnabled(client)) {
        const originalEnd = span.end.bind(span);
        span.end = (endTimestamp) => {
          const capturedEndTimestamp = endTimestamp ?? timestampInSeconds();
          let isEnded = false;
          const endSpanAndCleanup = () => {
            if (isEnded) {
              return;
            }
            isEnded = true;
            setTimeout(unsubscribePerformanceObsever);
            originalEnd(capturedEndTimestamp);
            clearTimeout(fallbackTimeout);
          };
          onEntryFound = endSpanAndCleanup;
          const fallbackTimeout = setTimeout(endSpanAndCleanup, HTTP_TIMING_WAIT_MS);
        };
      }
      const unsubscribePerformanceObsever = addPerformanceInstrumentationHandler("resource", ({ entries }) => {
        entries.forEach((entry) => {
          if (isPerformanceResourceTiming(entry) && entry.name.endsWith(url)) {
            span.setAttributes(resourceTimingToSpanAttributes(entry));
            onEntryFound();
          }
        });
      });
    }
    function shouldAttachHeaders(targetUrl, tracePropagationTargets) {
      const href = getLocationHref();
      if (!href) {
        const isRelativeSameOriginRequest = !!targetUrl.match(/^\/(?!\/)/);
        if (!tracePropagationTargets) {
          return isRelativeSameOriginRequest;
        } else {
          return stringMatchesSomePattern(targetUrl, tracePropagationTargets);
        }
      } else {
        let resolvedUrl;
        let currentOrigin;
        try {
          resolvedUrl = new URL(targetUrl, href);
          currentOrigin = new URL(href).origin;
        } catch {
          return false;
        }
        const isSameOriginRequest = resolvedUrl.origin === currentOrigin;
        if (!tracePropagationTargets) {
          return isSameOriginRequest;
        } else {
          return stringMatchesSomePattern(resolvedUrl.toString(), tracePropagationTargets) || isSameOriginRequest && stringMatchesSomePattern(resolvedUrl.pathname, tracePropagationTargets);
        }
      }
    }
    function xhrCallback(handlerData, shouldCreateSpan, shouldAttachHeaders2, spans, propagateTraceparent, onRequestSpanEnd) {
      const xhr = handlerData.xhr;
      const sentryXhrData = xhr?.[SENTRY_XHR_DATA_KEY];
      if (!xhr || xhr.__sentry_own_request__ || !sentryXhrData) {
        return void 0;
      }
      const { url, method } = sentryXhrData;
      const shouldCreateSpanResult = hasSpansEnabled() && shouldCreateSpan(url);
      if (handlerData.endTimestamp) {
        const spanId = xhr.__sentry_xhr_span_id__;
        if (!spanId) return;
        const span2 = spans[spanId];
        if (span2) {
          if (shouldCreateSpanResult && sentryXhrData.status_code !== void 0) {
            setHttpStatus(span2, sentryXhrData.status_code);
            span2.end();
            onRequestSpanEnd?.(span2, {
              headers: createHeadersSafely(parseXhrResponseHeaders(xhr)),
              error: handlerData.error
            });
          }
          delete spans[spanId];
        }
        return void 0;
      }
      const fullUrl = getFullURL(url);
      const parsedUrl = fullUrl ? parseUrl(fullUrl) : parseUrl(url);
      const sanitizedFullUrl = fullUrl ? stripDataUrlContent(fullUrl) : void 0;
      const urlForSpanName = stripDataUrlContent(stripUrlQueryAndFragment(url));
      const client = getClient();
      const hasParent = !!getActiveSpan();
      const shouldEmitSpan = hasParent || !!client && hasSpanStreamingEnabled(client);
      const span = shouldCreateSpanResult && shouldEmitSpan ? startInactiveSpan({
        name: `${method} ${urlForSpanName}`,
        attributes: {
          url: stripDataUrlContent(url),
          type: "xhr",
          "http.method": method,
          "http.url": sanitizedFullUrl,
          // `url.full` must match `http.url`. Setting it here ensures parentless `http.client`
          // segment spans don't get `url.full` backfilled with the host page URL (see httpContextIntegration).
          [Yu]: sanitizedFullUrl,
          "server.address": parsedUrl?.host,
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser",
          [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "http.client",
          ...parsedUrl?.search && { "http.query": parsedUrl?.search },
          ...parsedUrl?.hash && { "http.fragment": parsedUrl?.hash }
        }
      }) : new SentryNonRecordingSpan();
      const spanForTraceHeaders = spanIsIgnored(span) && hasParent ? void 0 : span;
      if (shouldCreateSpanResult && !shouldEmitSpan) {
        client?.recordDroppedEvent("no_parent_span", "span");
      }
      xhr.__sentry_xhr_span_id__ = span.spanContext().spanId;
      spans[xhr.__sentry_xhr_span_id__] = span;
      if (shouldAttachHeaders2(url)) {
        addTracingHeadersToXhrRequest(
          xhr,
          // If performance is disabled (TWP) or there's no active root span (pageload/navigation/interaction),
          // we do not want to use the span as base for the trace headers,
          // which means that the headers will be generated from the scope and the sampling decision is deferred
          hasSpansEnabled() && shouldEmitSpan ? spanForTraceHeaders : void 0,
          propagateTraceparent
        );
      }
      if (client) {
        client.emit("beforeOutgoingRequestSpan", span, handlerData);
      }
      return span;
    }
    function addTracingHeadersToXhrRequest(xhr, span, propagateTraceparent) {
      const { "sentry-trace": sentryTrace, baggage, traceparent } = getTraceData({ span, propagateTraceparent });
      if (sentryTrace) {
        setHeaderOnXhr(xhr, sentryTrace, baggage, traceparent);
      }
    }
    function setHeaderOnXhr(xhr, sentryTraceHeader, sentryBaggageHeader, traceparentHeader) {
      const originalHeaders = xhr.__sentry_xhr_v3__?.request_headers;
      if (originalHeaders?.["sentry-trace"] || !xhr.setRequestHeader) {
        return;
      }
      try {
        xhr.setRequestHeader("sentry-trace", sentryTraceHeader);
        if (traceparentHeader && !originalHeaders?.["traceparent"]) {
          xhr.setRequestHeader("traceparent", traceparentHeader);
        }
        if (sentryBaggageHeader) {
          const originalBaggageHeader = originalHeaders?.["baggage"];
          if (!originalBaggageHeader || !baggageHeaderHasSentryValues(originalBaggageHeader)) {
            xhr.setRequestHeader("baggage", sentryBaggageHeader);
          }
        }
      } catch {
      }
    }

    const responseToStreamSpan = /* @__PURE__ */ new WeakMap();
    const responseToFallbackTimeout = /* @__PURE__ */ new WeakMap();
    const STREAM_RESOLVE_FALLBACK_MS = 9e4;
    const STREAMING_CONTENT_TYPES = ["text/event-stream", "application/x-ndjson", "application/stream+json"];
    const fetchStreamPerformanceIntegration = defineIntegration(() => {
      return {
        name: "FetchStreamPerformance",
        setup() {
          addFetchEndInstrumentationHandler((handlerData) => {
            if (handlerData.response) {
              const streamSpan = responseToStreamSpan.get(handlerData.response);
              if (streamSpan && handlerData.endTimestamp) {
                streamSpan.end(handlerData.endTimestamp);
                const fallbackTimeout = responseToFallbackTimeout.get(handlerData.response);
                if (fallbackTimeout) {
                  clearTimeout(fallbackTimeout);
                }
              }
            }
          });
          addFetchInstrumentationHandler((handlerData) => {
            if (handlerData.endTimestamp && handlerData.response) {
              const contentType = handlerData.response.headers?.get("content-type") || "";
              if (handlerData.response.headers?.get("content-length") || !STREAMING_CONTENT_TYPES.some((t) => contentType.startsWith(t))) {
                return;
              }
              const url = handlerData.fetchData?.url || "";
              const method = handlerData.fetchData?.method || "GET";
              const parsedUrl = parseStringToURLObject(url);
              const sanitizedUrl = url.startsWith("data:") ? stripDataUrlContent(url) : parsedUrl ? getSanitizedUrlStringFromUrlObject(parsedUrl) : url;
              const streamSpan = startInactiveSpan({
                name: `${method} ${sanitizedUrl}`,
                startTime: handlerData.endTimestamp,
                attributes: {
                  url: stripDataUrlContent(url),
                  "http.method": method,
                  type: "fetch",
                  [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "http.client.stream",
                  [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.stream"
                }
              });
              responseToStreamSpan.set(handlerData.response, streamSpan);
              const fallbackTimeout = setTimeout(() => {
                if (streamSpan.isRecording()) {
                  streamSpan.end();
                }
              }, STREAM_RESOLVE_FALLBACK_MS);
              responseToFallbackTimeout.set(handlerData.response, fallbackTimeout);
            }
          });
        }
      };
    });

    const WEB_VITALS_INTEGRATION_NAME = "WebVitals";
    const webVitalsIntegration = defineIntegration((options = {}) => {
      const ignored = new Set(options.ignore ?? []);
      return {
        name: WEB_VITALS_INTEGRATION_NAME,
        setup(client) {
          const spanStreamingEnabled = hasSpanStreamingEnabled(client);
          const { enableStandaloneClsSpans, enableStandaloneLcpSpans } = options._experiments ?? {};
          const recordClsStandaloneSpans = spanStreamingEnabled || ignored.has("cls") ? void 0 : enableStandaloneClsSpans || false;
          const recordLcpStandaloneSpans = spanStreamingEnabled || ignored.has("lcp") ? void 0 : enableStandaloneLcpSpans || false;
          const finalizeWebVitals = startTrackingWebVitals({
            recordClsStandaloneSpans,
            recordLcpStandaloneSpans,
            client
          });
          const pageloadSpans = /* @__PURE__ */ new WeakSet();
          client.on("afterStartPageLoadSpan", (span) => {
            pageloadSpans.add(span);
          });
          client.on("spanEnd", (span) => {
            if (!pageloadSpans.delete(span)) {
              return;
            }
            finalizeWebVitals();
            addWebVitalsToSpan(span, {
              // CLS/LCP are recorded as pageload span measurements only when they're neither
              // tracked as standalone spans nor handled by span streaming (and not ignored).
              recordClsOnPageloadSpan: recordClsStandaloneSpans === false,
              recordLcpOnPageloadSpan: recordLcpStandaloneSpans === false,
              spanStreamingEnabled
            });
          });
          if (spanStreamingEnabled) {
            if (!ignored.has("lcp")) {
              trackLcpAsSpan(client);
            }
            if (!ignored.has("cls")) {
              trackClsAsSpan(client);
            }
            if (!ignored.has("inp")) {
              trackInpAsSpan();
            }
          } else if (!ignored.has("inp")) {
            startTrackingINP();
          }
        },
        afterAllSetup() {
          if (!ignored.has("inp")) {
            registerInpInteractionListener();
          }
        }
      };
    });

    function registerBackgroundTabDetection() {
      if (WINDOW$1.document) {
        WINDOW$1.document.addEventListener("visibilitychange", () => {
          const activeSpan = getActiveSpan();
          if (!activeSpan) {
            return;
          }
          const rootSpan = getRootSpan(activeSpan);
          if (WINDOW$1.document.hidden && rootSpan) {
            const cancelledStatus = "cancelled";
            const { op, status } = spanToJSON(rootSpan);
            if (DEBUG_BUILD) {
              debug.log(`[Tracing] Transaction: ${cancelledStatus} -> since tab moved to the background, op: ${op}`);
            }
            if (!status) {
              rootSpan.setStatus({ code: SPAN_STATUS_ERROR, message: cancelledStatus });
            }
            rootSpan.setAttribute("sentry.cancellation_reason", "document.hidden");
            rootSpan.end();
          }
        });
      } else {
        DEBUG_BUILD && debug.warn("[Tracing] Could not set up background tab detection due to lack of global document");
      }
    }

    const PREVIOUS_TRACE_MAX_DURATION = 3600;
    const PREVIOUS_TRACE_KEY = "sentry_previous_trace";
    const PREVIOUS_TRACE_TMP_SPAN_ATTRIBUTE = "sentry.previous_trace";
    function linkTraces(client, {
      linkPreviousTrace,
      consistentTraceSampling
    }) {
      const useSessionStorage = linkPreviousTrace === "session-storage";
      let inMemoryPreviousTraceInfo = useSessionStorage ? getPreviousTraceFromSessionStorage() : void 0;
      client.on("spanStart", (span) => {
        if (getRootSpan(span) !== span) {
          return;
        }
        const oldPropagationContext = getCurrentScope().getPropagationContext();
        inMemoryPreviousTraceInfo = addPreviousTraceSpanLink(inMemoryPreviousTraceInfo, span, oldPropagationContext);
        if (useSessionStorage) {
          storePreviousTraceInSessionStorage(inMemoryPreviousTraceInfo);
        }
      });
      let isFirstTraceOnPageload = true;
      if (consistentTraceSampling) {
        client.on("beforeSampling", (mutableSamplingContextData) => {
          if (!inMemoryPreviousTraceInfo) {
            return;
          }
          const scope = getCurrentScope();
          const currentPropagationContext = scope.getPropagationContext();
          if (isFirstTraceOnPageload && currentPropagationContext.parentSpanId) {
            isFirstTraceOnPageload = false;
            return;
          }
          scope.setPropagationContext({
            ...currentPropagationContext,
            dsc: {
              ...currentPropagationContext.dsc,
              sample_rate: String(inMemoryPreviousTraceInfo.sampleRate),
              sampled: String(spanContextSampled(inMemoryPreviousTraceInfo.spanContext))
            },
            sampleRand: inMemoryPreviousTraceInfo.sampleRand
          });
          mutableSamplingContextData.parentSampled = spanContextSampled(inMemoryPreviousTraceInfo.spanContext);
          mutableSamplingContextData.parentSampleRate = inMemoryPreviousTraceInfo.sampleRate;
          mutableSamplingContextData.spanAttributes = {
            ...mutableSamplingContextData.spanAttributes,
            [SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE]: inMemoryPreviousTraceInfo.sampleRate
          };
        });
      }
    }
    function addPreviousTraceSpanLink(previousTraceInfo, span, oldPropagationContext) {
      const spanJson = spanToJSON(span);
      function getSampleRate() {
        try {
          const oldSampleRate = Number(
            spanJson.data?.[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE] ?? oldPropagationContext.dsc?.sample_rate
          );
          return Number.isNaN(oldSampleRate) ? 0 : oldSampleRate;
        } catch {
          return 0;
        }
      }
      const updatedPreviousTraceInfo = {
        spanContext: span.spanContext(),
        startTimestamp: spanJson.start_timestamp,
        sampleRate: getSampleRate(),
        sampleRand: oldPropagationContext.sampleRand
      };
      if (!previousTraceInfo) {
        return updatedPreviousTraceInfo;
      }
      const previousTraceSpanCtx = previousTraceInfo.spanContext;
      if (previousTraceSpanCtx.traceId === spanJson.trace_id) {
        return previousTraceInfo;
      }
      if (Date.now() / 1e3 - previousTraceInfo.startTimestamp <= PREVIOUS_TRACE_MAX_DURATION) {
        if (DEBUG_BUILD) {
          debug.log(
            `Adding previous_trace \`${JSON.stringify(previousTraceSpanCtx)}\` link to span \`${JSON.stringify({
          op: spanJson.op,
          ...span.spanContext()
        })}\``
          );
        }
        span.addLink({
          context: previousTraceSpanCtx,
          attributes: {
            [SEMANTIC_LINK_ATTRIBUTE_LINK_TYPE]: "previous_trace"
          }
        });
        span.setAttribute(
          PREVIOUS_TRACE_TMP_SPAN_ATTRIBUTE,
          `${previousTraceSpanCtx.traceId}-${previousTraceSpanCtx.spanId}-${spanContextSampled(previousTraceSpanCtx) ? 1 : 0}`
        );
      }
      return updatedPreviousTraceInfo;
    }
    function storePreviousTraceInSessionStorage(previousTraceInfo) {
      try {
        WINDOW$1.sessionStorage.setItem(PREVIOUS_TRACE_KEY, JSON.stringify(previousTraceInfo));
      } catch (e) {
        DEBUG_BUILD && debug.warn("Could not store previous trace in sessionStorage", e);
      }
    }
    function getPreviousTraceFromSessionStorage() {
      try {
        const previousTraceInfo = WINDOW$1.sessionStorage?.getItem(PREVIOUS_TRACE_KEY);
        return JSON.parse(previousTraceInfo);
      } catch {
        return void 0;
      }
    }
    function spanContextSampled(ctx) {
      return ctx.traceFlags === 1;
    }

    const BROWSER_TRACING_INTEGRATION_ID = "BrowserTracing";
    const BOT_USER_AGENT_RE = /Googlebot|Google-InspectionTool|Storebot-Google|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Facebot|facebookexternalhit|LinkedInBot|Twitterbot|Applebot/i;
    function isBotUserAgent() {
      const nav = WINDOW$1.navigator;
      if (!nav?.userAgent) {
        return false;
      }
      return BOT_USER_AGENT_RE.test(nav.userAgent);
    }
    const DEFAULT_BROWSER_TRACING_OPTIONS = {
      ...TRACING_DEFAULTS,
      instrumentNavigation: true,
      instrumentPageLoad: true,
      markBackgroundSpan: true,
      enableLongTask: true,
      enableLongAnimationFrame: true,
      enableInp: true,
      ignoreResourceSpans: [],
      ignorePerformanceApiSpans: [],
      detectRedirects: true,
      linkPreviousTrace: "in-memory",
      consistentTraceSampling: false,
      enableReportPageLoaded: false,
      _experiments: {},
      ...defaultRequestInstrumentationOptions
    };
    const browserTracingIntegration = ((options = {}) => {
      if ("enableElementTiming" in options) {
        consoleSandbox(() => {
          console.warn(
            "[Sentry] `enableElementTiming` is deprecated and no longer has any effect. Use the standalone `elementTimingIntegration` instead."
          );
        });
      }
      const latestRoute = {
        name: void 0,
        source: void 0
      };
      const optionalWindowDocument = WINDOW$1.document;
      const {
        enableInp,
        enableLongTask,
        enableLongAnimationFrame,
        _experiments: { enableInteractions, enableStandaloneClsSpans, enableStandaloneLcpSpans },
        beforeStartSpan,
        idleTimeout,
        finalTimeout,
        childSpanTimeout,
        markBackgroundSpan,
        traceFetch,
        traceXHR,
        // eslint-disable-next-line typescript/no-deprecated
        trackFetchStreamPerformance,
        shouldCreateSpanForRequest,
        enableHTTPTimings,
        ignoreResourceSpans,
        ignorePerformanceApiSpans,
        instrumentPageLoad,
        instrumentNavigation,
        detectRedirects,
        linkPreviousTrace,
        consistentTraceSampling,
        enableReportPageLoaded,
        onRequestSpanStart,
        onRequestSpanEnd
      } = {
        ...DEFAULT_BROWSER_TRACING_OPTIONS,
        ...options
      };
      const _isBot = isBotUserAgent();
      let lastInteractionTimestamp;
      let _pageloadSpan;
      function _createRouteSpan(client, startSpanOptions, makeActive = true, url) {
        const isPageloadSpan = startSpanOptions.op === "pageload";
        const initialSpanName = startSpanOptions.name;
        const finalStartSpanOptions = beforeStartSpan ? beforeStartSpan(startSpanOptions) : startSpanOptions;
        const urlObject = parseStringToURLObject(url || getLocationHref());
        const attributes = {
          ...urlObject?.pathname && { [Vu]: urlObject.pathname },
          ...urlObject && !isURLObjectRelative(urlObject) && { [Yu]: urlObject.href },
          ...finalStartSpanOptions.attributes
        };
        if (initialSpanName !== finalStartSpanOptions.name) {
          attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] = "custom";
        }
        finalStartSpanOptions.attributes = attributes;
        if (!makeActive) {
          const now = dateTimestampInSeconds();
          startInactiveSpan({
            ...finalStartSpanOptions,
            startTime: now
          }).end(now);
          return;
        }
        latestRoute.name = finalStartSpanOptions.name;
        latestRoute.source = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
        const idleSpan = startIdleSpan(finalStartSpanOptions, {
          idleTimeout,
          finalTimeout,
          childSpanTimeout,
          // should wait for finish signal if it's a pageload transaction
          disableAutoFinish: isPageloadSpan,
          beforeSpanEnd: (span) => {
            addPerformanceEntries(span, {
              ignoreResourceSpans,
              ignorePerformanceApiSpans,
              spanStreamingEnabled: hasSpanStreamingEnabled(client)
            });
            setActiveIdleSpan(client, void 0);
            const scope = getCurrentScope();
            const oldPropagationContext = scope.getPropagationContext();
            scope.setPropagationContext({
              ...oldPropagationContext,
              traceId: idleSpan.spanContext().traceId,
              sampled: spanIsSampled(idleSpan),
              dsc: getDynamicSamplingContextFromSpan(span)
            });
            if (isPageloadSpan) {
              _pageloadSpan = void 0;
            }
          },
          trimIdleSpanEndTimestamp: !enableReportPageLoaded
        });
        if (isPageloadSpan && enableReportPageLoaded) {
          _pageloadSpan = idleSpan;
        }
        setActiveIdleSpan(client, idleSpan);
        function emitFinish() {
          if (optionalWindowDocument && ["interactive", "complete"].includes(optionalWindowDocument.readyState)) {
            client.emit("idleSpanEnableAutoFinish", idleSpan);
            optionalWindowDocument.removeEventListener("readystatechange", emitFinish);
          }
        }
        if (isPageloadSpan && !enableReportPageLoaded && optionalWindowDocument) {
          optionalWindowDocument.addEventListener("readystatechange", emitFinish);
          emitFinish();
        }
      }
      return {
        name: BROWSER_TRACING_INTEGRATION_ID,
        setup(client) {
          if (_isBot) {
            DEBUG_BUILD && debug.log("[Tracing] Skipping browserTracingIntegration setup for bot user agent.");
            return;
          }
          registerSpanErrorInstrumentation();
          if (enableLongAnimationFrame && GLOBAL_OBJ.PerformanceObserver && PerformanceObserver.supportedEntryTypes?.includes("long-animation-frame")) {
            startTrackingLongAnimationFrames();
          } else if (enableLongTask) {
            startTrackingLongTasks();
          }
          if (enableInteractions) {
            startTrackingInteractions();
          }
          if (detectRedirects && optionalWindowDocument) {
            const interactionHandler = () => {
              lastInteractionTimestamp = timestampInSeconds();
            };
            addEventListener("click", interactionHandler, { capture: true });
            addEventListener("keydown", interactionHandler, { capture: true, passive: true });
          }
          function maybeEndActiveSpan() {
            const activeSpan = getActiveIdleSpan(client);
            if (activeSpan && !spanToJSON(activeSpan).timestamp) {
              DEBUG_BUILD && debug.log(`[Tracing] Finishing current active span with op: ${spanToJSON(activeSpan).op}`);
              activeSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, "cancelled");
              activeSpan.end();
            }
          }
          client.on("startNavigationSpan", (startSpanOptions, navigationOptions) => {
            if (getClient() !== client) {
              return;
            }
            if (navigationOptions?.isRedirect) {
              DEBUG_BUILD && debug.warn("[Tracing] Detected redirect, navigation span will not be the root span, but a child span.");
              _createRouteSpan(
                client,
                {
                  op: "navigation.redirect",
                  ...startSpanOptions
                },
                false,
                navigationOptions.url
              );
              return;
            }
            lastInteractionTimestamp = void 0;
            maybeEndActiveSpan();
            const scope = getCurrentScope();
            scope.setPropagationContext({
              traceId: generateTraceId(),
              sampleRand: Math.random(),
              propagationSpanId: hasSpansEnabled() ? void 0 : generateSpanId()
            });
            scope.setSDKProcessingMetadata({
              normalizedRequest: void 0
            });
            _createRouteSpan(
              client,
              {
                op: "navigation",
                ...startSpanOptions,
                // Navigation starts a new trace and is NOT parented under any active interaction (e.g. ui.action.click)
                parentSpan: null,
                forceTransaction: true
              },
              true,
              navigationOptions?.url
            );
          });
          client.on("startPageLoadSpan", (startSpanOptions, traceOptions = {}) => {
            if (getClient() !== client) {
              return;
            }
            maybeEndActiveSpan();
            const sentryTrace = traceOptions.sentryTrace || getMetaContent("sentry-trace") || getServerTiming("sentry-trace");
            const baggage = traceOptions.baggage || getMetaContent("baggage") || getServerTiming("baggage");
            const propagationContext = propagationContextFromHeaders(sentryTrace, baggage);
            const scope = getCurrentScope();
            scope.setPropagationContext(propagationContext);
            if (!hasSpansEnabled()) {
              scope.getPropagationContext().propagationSpanId = generateSpanId();
            }
            scope.setSDKProcessingMetadata({
              normalizedRequest: getHttpRequestData()
            });
            _createRouteSpan(client, {
              op: "pageload",
              ...startSpanOptions
            });
          });
          client.on("endPageloadSpan", () => {
            if (enableReportPageLoaded && _pageloadSpan) {
              _pageloadSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, "reportPageLoaded");
              _pageloadSpan.end();
            }
          });
        },
        afterAllSetup(client) {
          if (_isBot) {
            return;
          }
          if (client.addIntegration && !client.getIntegrationByName?.(WEB_VITALS_INTEGRATION_NAME)) {
            client.addIntegration(
              webVitalsIntegration({
                ignore: enableInp ? [] : ["inp"],
                _experiments: {
                  enableStandaloneClsSpans,
                  enableStandaloneLcpSpans
                }
              })
            );
          }
          let startingUrl = getLocationHref();
          if (linkPreviousTrace !== "off") {
            linkTraces(client, { linkPreviousTrace, consistentTraceSampling });
          }
          if (WINDOW$1.location) {
            if (instrumentPageLoad) {
              const origin = browserPerformanceTimeOrigin();
              startBrowserTracingPageLoadSpan(client, {
                name: WINDOW$1.location.pathname,
                // pageload should always start at timeOrigin (and needs to be in s, not ms)
                startTime: origin ? origin / 1e3 : void 0,
                attributes: {
                  [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
                  [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.pageload.browser"
                }
              });
            }
            if (instrumentNavigation) {
              addHistoryInstrumentationHandler(({ to, from }) => {
                if (from === void 0 && startingUrl?.indexOf(to) !== -1) {
                  startingUrl = void 0;
                  return;
                }
                startingUrl = void 0;
                const parsed = parseStringToURLObject(to);
                const activeSpan = getActiveIdleSpan(client);
                const navigationIsRedirect = activeSpan && detectRedirects && isRedirect(activeSpan, lastInteractionTimestamp);
                startBrowserTracingNavigationSpan(
                  client,
                  {
                    name: parsed?.pathname || WINDOW$1.location.pathname,
                    attributes: {
                      [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
                      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.browser"
                    }
                  },
                  { url: to, isRedirect: navigationIsRedirect }
                );
              });
            }
          }
          if (markBackgroundSpan) {
            registerBackgroundTabDetection();
          }
          if (enableInteractions) {
            registerInteractionListener(client, idleTimeout, finalTimeout, childSpanTimeout, latestRoute);
          }
          instrumentOutgoingRequests(client, {
            traceFetch,
            traceXHR,
            tracePropagationTargets: client.getOptions().tracePropagationTargets,
            shouldCreateSpanForRequest,
            enableHTTPTimings,
            onRequestSpanStart,
            onRequestSpanEnd
          });
          if (trackFetchStreamPerformance) {
            client.addIntegration(fetchStreamPerformanceIntegration());
          }
        }
      };
    });
    function startBrowserTracingPageLoadSpan(client, spanOptions, traceOptions) {
      client.emit("startPageLoadSpan", spanOptions, traceOptions);
      getCurrentScope().setTransactionName(spanOptions.name);
      const pageloadSpan = getActiveIdleSpan(client);
      if (pageloadSpan) {
        client.emit("afterStartPageLoadSpan", pageloadSpan);
      }
      return pageloadSpan;
    }
    function startBrowserTracingNavigationSpan(client, spanOptions, options) {
      const { url, isRedirect: isRedirect2 } = options || {};
      client.emit("beforeStartNavigationSpan", spanOptions, { isRedirect: isRedirect2, url });
      client.emit("startNavigationSpan", spanOptions, { isRedirect: isRedirect2, url });
      const scope = getCurrentScope();
      scope.setTransactionName(spanOptions.name);
      if (url && !isRedirect2) {
        scope.setSDKProcessingMetadata({
          normalizedRequest: {
            ...getHttpRequestData(),
            url
          }
        });
      }
      return getActiveIdleSpan(client);
    }
    function getMetaContent(metaName) {
      const optionalWindowDocument = WINDOW$1.document;
      const metaTag = optionalWindowDocument?.querySelector(`meta[name=${metaName}]`);
      return metaTag?.getAttribute("content") || void 0;
    }
    function getServerTiming(name) {
      const navigation = WINDOW$1.performance?.getEntriesByType?.("navigation")[0];
      const entry = navigation?.serverTiming?.find((entry2) => entry2.name === name);
      return entry?.description;
    }
    function registerInteractionListener(client, idleTimeout, finalTimeout, childSpanTimeout, latestRoute) {
      const optionalWindowDocument = WINDOW$1.document;
      let inflightInteractionSpan;
      const registerInteractionTransaction = () => {
        const op = "ui.action.click";
        const activeIdleSpan = getActiveIdleSpan(client);
        if (activeIdleSpan) {
          const currentRootSpanOp = spanToJSON(activeIdleSpan).op;
          if (["navigation", "pageload"].includes(currentRootSpanOp)) {
            DEBUG_BUILD && debug.warn(`[Tracing] Did not create ${op} span because a pageload or navigation span is in progress.`);
            return void 0;
          }
        }
        if (inflightInteractionSpan) {
          inflightInteractionSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, "interactionInterrupted");
          inflightInteractionSpan.end();
          inflightInteractionSpan = void 0;
        }
        if (!latestRoute.name) {
          DEBUG_BUILD && debug.warn(`[Tracing] Did not create ${op} transaction because _latestRouteName is missing.`);
          return void 0;
        }
        inflightInteractionSpan = startIdleSpan(
          {
            name: latestRoute.name,
            op,
            attributes: {
              [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: latestRoute.source || "url"
            }
          },
          {
            idleTimeout,
            finalTimeout,
            childSpanTimeout
          }
        );
      };
      if (optionalWindowDocument) {
        addEventListener("click", registerInteractionTransaction, { capture: true });
      }
    }
    const ACTIVE_IDLE_SPAN_PROPERTY = "_sentry_idleSpan";
    function getActiveIdleSpan(client) {
      return client[ACTIVE_IDLE_SPAN_PROPERTY];
    }
    function setActiveIdleSpan(client, span) {
      addNonEnumerableProperty(client, ACTIVE_IDLE_SPAN_PROPERTY, span);
    }
    const REDIRECT_THRESHOLD = 1.5;
    function isRedirect(activeSpan, lastInteractionTimestamp) {
      const spanData = spanToJSON(activeSpan);
      const now = dateTimestampInSeconds();
      const startTimestamp = spanData.start_timestamp;
      if (now - startTimestamp > REDIRECT_THRESHOLD) {
        return false;
      }
      if (lastInteractionTimestamp && now - lastInteractionTimestamp <= REDIRECT_THRESHOLD) {
        return false;
      }
      return true;
    }

    /**
     * Point d'entrée d'initialisation côté navigateur.
     *
     * Ce module démarre le client `@sentry/browser` en lisant sa configuration
     * (DSN, environnement, activation des logs) depuis `window.rcmail.env`,
     * valeurs injectées côté serveur par le plugin PHP (voir `php/init/init.php`).
     */
    // eslint-disable-next-line no-var
    var rcmail$1 = window.rcmail || {};
    /**
     * Initialise le client Sentry/GlitchTip côté navigateur.
     *
     * L'instance est créée puis exposée sur `window.sentry` via la fonction
     * exportée par défaut de ce module.
     */
    class SentryInit extends AStartObject {
        constructor() {
            super();
            this.#_init();
        }
        /**
         * Configure et démarre le SDK Sentry avec les paramètres exposés par Roundcube (`rcmail.env`).
         */
        #_init() {
            init({
                dsn: rcmail$1.env["js_dsn"],
                environment: rcmail$1.env["env"],
                enableLogs: !!rcmail$1.env["enable_logs"],
                integrations: [browserTracingIntegration()],
                tracesSampleRate: 0.01, // 1% des transactions — à ajuster selon les besoins
                autoSessionTracking: false, // GlitchTip ne prend pas en charge les sessions
            });
        }
    }
    /**
     * Bootstrap du module : crée l'instance {@link SentryInit} et l'expose sur `window.sentry`.
     *
     * @returns Rien.
     */
    function mainBody () {
        window.sentry = new SentryInit();
    }

    mainBody();
    if (typeof rcmail !== 'undefined') {
        rcmail.addEventListener('init', function (evt) {
            const missingEnvVars = ["js_dsn", "enable_logs", "env"].filter((key) => rcmail.env[key] === undefined);
            if (missingEnvVars.length > 0) {
                const message = `[bnum_glitchtip] variable(s) d'environnement manquante(s) dans rcmail.env : ${missingEnvVars.join(', ')}`;
                console.error(message);
                throw new Error(message);
            }
        });
    }

})();
//# sourceMappingURL=index.js.map
