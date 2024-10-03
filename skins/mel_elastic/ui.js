/**
 * @module MEL_ELASTIC_UI
 */

$(document).ready(() => {
  const CONST_CLASS_THEME_BADGE_SELECTED = 'green-badge';
  //const CONST_THEME_CLASSE_CAN_RESIZE = 'mel-resize-ok';
  const CONST_SELECTOR_THEME_BADGE_SELECTED = `${CONST_JQUERY_SELECTOR_CLASS}${CONST_CLASS_THEME_BADGE_SELECTED}`;
  const CONST_THEME_PANEL_ID = 'theme-panel';
  const CONST_THEME_PANEL_CONTENTS_CLASS = 'contents';
  const CONST_SELECTOR_THEME_PANEL_CONTENT_DEFAULT = `${CONST_JQUERY_SELECTOR_ID}${CONST_THEME_PANEL_ID} ${CONST_JQUERY_SELECTOR_CLASS}${CONST_THEME_PANEL_CONTENTS_CLASS}`;
  const CONST_SELECTOR_THEME_PANEL_TAB_DIV = `${CONST_JQUERY_SELECTOR_ID}${CONST_THEME_PANEL_ID} ${CONST_JQUERY_SELECTOR_CLASS}title`;
  const CONST_THEME_BUTTON_ID = 'theme-switch-button';
  const CONST_THEME_ICON_PREFIX = 'icon-theme-';
  const CONST_CLASS_MEL_RESIZE_OK = 'mel-resize-ok';
  //const CONST_FORMAT_THEME_TITLE = '%1?/( -?(%1?&&%2?||!%1?)? )/%2?';
  const CONST_TAB_THEME_ID = 'theme-pannel-tab-theme';
  const CONST_TAB_PICTURE_ID = 'theme-pannel-tab-pictures';
  const CONST_TABS_LIST = [
    {
      display: 'Thèmes',
      id: CONST_TAB_THEME_ID,
      already: true,
    },
    {
      display: 'Images',
      id: CONST_TAB_PICTURE_ID,
      already: false,
    },
  ];

  try {
    Enumerable.from([]);
  } catch (error) {
    window.Enumerable = null;
  }

  /**
   * Classe qui gère une règle css. Elle pourra être ajouter ou supprimer.
   * @class
   * @classdesc Représente une règle CSS et est utilisé par `Mel_CSS_Style_Sheet`
   * @example new Mel_CSS_Rule('p{color:red;}')
   * @see {@link Mel_CSS_Style_Sheet}
   * @package
   */
  class Mel_CSS_Rule {
    /**
     *
     * @param {!string} rule Règle css style `p{color:red;}`
     */
    constructor(rule) {
      /**
       * Règle css
       * @type {!string}
       */
      this.rule = rule;
      /**
       * Lien de la règle dans le stylesheet associé
       * @type {?CSSStyleRule}
       */
      this.styleRule = null;
    }

    /**
     * Récupère l'id de la règle dans la stylesheet
     * @returns {number}
     */
    id() {
      return Enumerable.from(Mel_CSS_Rule.component().cssRules)
        .select((x, i) => [x, i])
        .where((x) => x[0] === this.styleRule)
        .firstOrDefault()[1];
    }

    /**
     * Intègre le style à la page web
     * @returns {Mel_CSS_Rule} Chaînage
     */
    set() {
      let id = Mel_CSS_Rule.component().insertRule(
        this.toString(),
        Mel_CSS_Rule.lastIndex(),
      );
      this.styleRule = Mel_CSS_Rule.component().cssRules[id];
      return this;
    }

    /**
     * Supprime le style de la page web
     * @returns {Mel_CSS_Rule} Chaînage
     */
    delete() {
      let id = this.id();

      if (id === 0 || !!id) Mel_CSS_Rule.component().deleteRule(id);

      return this;
    }

    /**
     * Retourne la règle css sous forme de string
     * @returns {string}
     */
    toString() {
      return this.rule;
    }

    /**
     * Récupère la feuille de style lié à cette classe.
     *
     * Si elle n'éxiste pas, elle sera créée.
     * @static
     * @returns {!CSSStyleSheet}
     */
    static component() {
      if (!Mel_CSS_Rule.component._instance) {
        let style = document.createElement('style');
        document.head.appendChild(style);
        Mel_CSS_Rule.component._instance = style.sheet;
      }
      return Mel_CSS_Rule.component._instance;
    }

    /**
     * Récupère le prochain index de la feuille de style
     * @returns {number}
     * @static
     */
    static lastIndex() {
      return Mel_CSS_Rule.component().cssRules.length;
    }

    /**
     * Génère une règle css à partir d'un tableau de règles
     * @param {Mel_CSS_Rule[]} rules
     * @returns {Mel_CSS_Rule}
     * @static
     */
    static from_array(rules = []) {
      return new Mel_CSS_Rule(rules.map((x) => x.toString()).join(''));
    }
  }

  /**
   * Classe qui gère une règle css.
   * Gère un sélécteur ainsi qu'une liste de modificateur css.
   * @class
   * @classdesc Représentation d'une règle css avec un sélecteur et c'est différentes propriétés css.
   * @extends Mel_CSS_Rule
   * @package
   * @example new Mel_CSS_Advanced_Rule('p', 'color:red', 'background-color:blue');
   */
  class Mel_CSS_Advanced_Rule extends Mel_CSS_Rule {
    /**
     *
     * @param {string} selector Selector html (exemple: p.maclass)
     * @param  {...string} rules Liste de règles html (exemple : color:red) sans les ';'
     */
    constructor(selector, ...rules) {
      super(rules);
      /**
       * Liste des propriétés css
       * @type {string[]}
       */
      // eslint-disable-next-line no-self-assign
      this.rule = this.rule;
      /**
       * Sélécteur
       * @type {string}
       */
      this.selector = selector;
    }

    /**
     * Intègre le style à la page web
     * @returns {Mel_CSS_Advanced_Rule} Chaînage
     * @override
     */
    set() {
      let id = Mel_CSS_Rule.component().insertRule(
        this.toString(),
        Mel_CSS_Rule.lastIndex(),
      );
      this.styleRule = Mel_CSS_Rule.component().cssRules[id];
      return this;
    }

    /**
     * Ajoute une propriété à la règle
     * @param {string} rule Règle à ajouter (sans les `;`)
     * @param {!boolean} force_set Si vrai, met à jour la règle dans la page web
     * @returns Chaînage
     */
    add(rule, force_set = true) {
      this.rule.push(rule);
      return this._update_rule(force_set);
    }

    /**
     * Supprime la règle.
     * @private
     * @param {!boolean} force_set Si vrai, ajoute la règle dans la page web
     * @returns {Mel_CSS_Advanced_Rule} Chaînage
     */
    _update_rule(force_set = true) {
      let id = this.id();
      if (id === 0 || !!id) {
        this.delete();

        if (force_set) this.set();
      }

      return this;
    }

    /**
     * Supprime une propriétée
     * @param {!number} index Index de la propriété à supprimer
     * @param {!boolean} force_set Si vrai, met à jour la règle dans la page web
     * @returns Chaînage
     */
    remove(index, force_set = true) {
      this.rule.splice(index, 1);
      return this._update_rule(force_set);
    }

    /**
     * Met Ã  jour une règle
     * @param {number} index Index de la règle Ã  modifier
     * @param {string} new_rule Nouvelle règle
     * @param {boolean} force_set Si vrai, met Ã  jour la règle dans la page web
     * @returns ChaÃ®nage
     */
    update(index, new_rule, force_set = true) {
      this.rule[index] = new_rule;
      return this._update_rule(force_set);
    }

    /**
     * Récupère les règles
     * @returns {string} Règles
     */
    rules() {
      return this.rule;
    }

    /**
     * Retourne la règle css sous forme de string
     * @returns {string}
     * @override
     */
    toString() {
      return `${this.selector}{${this.rule.join(';\r\n')}}`;
    }
  }

  /**
   * Classe qui représente une liste de règle css
   * @extends Mel_CSS_Rule
   * @class
   * @classdesc Représente une liste de règle css
   * @package
   */
  class Mel_CSS_Array_Rule extends Mel_CSS_Rule {
    constructor(rules) {
      super(rules);

      /**
       * Liste des ids des règles par rapport à leurs stylesheet
       * @type {number[]}
       */
      this.ids = [];
      /**
       * Liste des règles css
       * @type {CSSStyleRule[]}
       */
      this.styleRule = {};
    }

    /**
     * Ajoute les règles à la liste de règles
     * @override
     * @returns {Mel_CSS_Array_Rule} Chaînage
     */
    set() {
      for (let index = 0, len = this.rule.length, id; index < len; ++index) {
        const element = this.rule[index];
        id = Mel_CSS_Rule.component().insertRule(
          element.toString(),
          Mel_CSS_Rule.lastIndex(),
        );
        this.ids.push(id);
        this.styleRule[id] = Mel_CSS_Rule.component().cssRules[id];
      }
      return this;
    }

    /**
     * Récupère l'id de la règle dans la stylesheet à partir de son id dans ce tableau
     * @param {!number} id
     * @returns {number}
     */
    rule_id(id) {
      return Enumerable.from(Mel_CSS_Rule.component().cssRules)
        .select((x, i) => [x, i])
        .where((x) => x[0] === this.styleRule[id])
        .firstOrDefault()[1];
    }

    /**
     * Supprime la règle
     * @overload
     * @returns {Mel_CSS_Array_Rule} Chaînage
     */
    delete() {
      for (const iterator of this.ids) {
        Mel_CSS_Rule.component().deleteRule(this.rule_id(iterator));
      }
      this.ids.length = 0;
      this.styleRule = null;
      return this;
    }

    /**
     * Convertit en string
     * @returns {string}
     * @override
     */
    toString() {
      return this.rule.map((x) => x.toString()).join(';\r\n');
    }
  }

  /**
   * Gère les différentes règles d'une feuille de style.
   * @class
   * @classdesc Représente une feuille de style et gère les règles qui se trouvent à l'intérieur.
   * @package
   */
  class Mel_CSS_Style_Sheet {
    constructor() {
      /**
       * Dictionnaire de règle css
       * @type {Object.<string, Mel_CSS_Rule>}
       */
      this.css = {};
    }

    /**
     * Ajoute une règle Ã  la liste de règles
     * @private
     * @param {string} key Clé qui permettra de récupérer la règle ajouté
     * @param {Mel_CSS_Rule} rule Règle qui sera ajouté
     * @returns {Mel_CSS_Style_Sheet} ChaÃ®nage
     */
    _add(key, rule) {
      if (!this.ruleExist(key)) this.css[key] = rule.set();
      else {
        throw Mel_CSS_Style_Sheet.exception(
          `###[Mel_CSS_Style_Sheet] ${key} existe déjÃ  !`,
        );
      }
      return this;
    }

    /**
     * Ajoute une règle à la liste
     * @param {!string} key Clé qui permettra de récupérer la règle ajouté
     * @param {!string} rule Règle qui sera ajouté (ex : p{color:red;})
     * @returns {Mel_CSS_Style_Sheet} Chaînage
     */
    add(key, rule) {
      return this._add(key, new Mel_CSS_Rule(rule));
    }

    /**
     * Ajoute une règle à la liste
     *
     * Cette fonction permet d'ajouter une règle avec un sélécteur et une liste de propriétés.
     * @param {string} key  Clé qui permettra de récupérer la règle ajouté
     * @param {string} selector Sélécteur html
     * @param  {...string} rules Liste de propriétés (ex : 'color:red', 'background-color:blue')
     * @returns {Mel_CSS_Style_Sheet} Chaînage
     */
    addAdvanced(key, selector, ...rules) {
      return this._add(key, new Mel_CSS_Advanced_Rule(selector, ...rules));
    }

    /**
     * @typedef RuleKeyValuePair
     * @property {string} key
     * @property {string} rule
     */

    /**
     * Ajoute plusieurs règles
     * @param  {...RuleKeyValuePair} rules Règles à ajouter
     * @returns {Mel_CSS_Style_Sheet} Chaînage
     * @see {@link RuleKeyValuePair}
     */
    addRules(...rules) {
      for (const key in rules) {
        if (Object.hasOwnProperty.call(rules, key)) {
          const element = rules[key];
          this.add(element.key, element.rule);
        }
      }

      return this;
    }

    /**
     * Supprime une règle
     * @param {!string} key
     * @returns {Mel_CSS_Style_Sheet} Chaînage
     */
    remove(key) {
      if (this.ruleExist(key)) {
        this.css[key].delete();
        delete this.css[key];
      }

      return this;
    }

    /**
     * Supprime plusieurs règles
     * @param  {...string} keys
     * @returns {Mel_CSS_Style_Sheet} Chaînage
     */
    removeRules(...keys) {
      for (const key in keys) {
        if (Object.hasOwnProperty.call(keys, key)) {
          const element = keys[key];
          this.remove(element);
        }
      }

      return this;
    }

    /**
     * Vérifie si une règle éxiste
     * @param {string} key
     * @returns {boolean}
     */
    ruleExist(key) {
      return !!this.css[key];
    }

    /**
     * Récupère les clés de la classe
     * @returns {string[]}
     */
    getKeys() {
      return (
        Enumerable.from(this.css)
          .select((x) => x.key)
          .toArray() || []
      );
    }

    /**
     * Récupère la feuille de style
     * @returns {string}
     */
    getStyleSheet() {
      return (
        Enumerable.from(this.css)
          .select((x) => x.value)
          .toArray()
          .join('\r\n') || ''
      );
    }

    /**
     * Vide la feuille de style
     * @returns {Mel_CSS_Style_Sheet} Chaînage
     */
    reset() {
      for (const key in this.css) {
        if (Object.hasOwnProperty.call(this.css, key)) {
          const element = this.css[key];
          element.delete();
        }
      }

      this.css = {};
      return this;
    }

    static exception(message, ...datas) {
      return {
        message,
        datas,
      };
    }
  }

  /**
   * @class
   * @classdesc Gère la sauvegarde de données dans le stockage local pour ce fichier js
   * @static
   * @package
   * @hideconstructor
   */
  class Mel_Elastic_Storage {
    /**
     * Sauvegarde dans le stockage local
     * @param {!string} key Clé qui permettra de retrouver la données plus tard
     * @param {*} item Item à sauvegarder, si ce n'est pas un `string` il sera serialiser.
     */
    static save(key, item) {
      localStorage.setItem(
        `${Mel_Elastic_Storage.KEY}_${key}`,
        JSON.stringify(item),
      );
    }

    /**
     * Charge une donnée sauvegardé dans le stockage local
     * @param {!string} key Clé qui permet de retrouver la données
     * @param {?any} _default Si la données n'éxiste pas, cette valeur sera retournée.
     * @returns {?any}
     */
    static load(key, _default = null) {
      return (
        JSON.parse(localStorage.getItem(`${Mel_Elastic_Storage.KEY}_${key}`)) ??
        _default
      );
    }

    /**
     * Supprime une donnée dans le stockage local
     * @param {!string} key Clé qui permet de retrouver la données
     */
    static remove(key) {
      localStorage.removeItem(`${Mel_Elastic_Storage.KEY}_${key}`);
    }
  }

  /**
   * Texte qui sera ajouté devant chaque clé dans le stockage local de la classe `Mel_Elastic_Storage`
   * @static
   * @readonly
   * @type {string}
   */
  Mel_Elastic_Storage.KEY = 'MEL_ELASTIC';

  /**
   * Classe qui sert à gérer les différentes interfaces
   * @class
   * @classdesc Gère le visuel du bnum. Donne aussi des fonctions utiles lié au visuel du Bnum.
   * @package
   */
  class Mel_Elastic {
    constructor() {
      this.init().setup().update();

      $('#theme-panel #theme-pannel-tab-pictures').on('click', () => {
        this._resize_themes();
      });

      $('.tab-meltheme.mel-tab.mel-tabheader').click(() => {
        this._resize_themes();
      });
    }

    ////////////************* Inits and setups functions *************///////////

    /**
     * Initialise les différentes variables et constantes de la classe.
     * @returns {Mel_Elastic} Chaînage
     * @package
     */
    init() {
      this.set_font_size();
      const ID_THEME_CONTENT = 0;
      const ID_PICTURES_CONTENT = 1;
      /**
       * Type d'écran
       * @type {string}
       */
      this.screen_type = null;
      /**
       * Si on cache les menu ou non
       * @type {boolean}
       * @package
       */
      this._hide_main_menu =
        rcmail.env.mel_metapage_is_from_iframe || rcmail.env.extwin;
      /**
       * Feuille du style css
       * @type {Mel_CSS_Style_Sheet}
       */
      this.css_rules = new Mel_CSS_Style_Sheet();
      const tabs = this.init_theme_tabs({});
      return this.init_const()
        .init_theme($(`#theme-panel .${tabs[ID_THEME_CONTENT].id}`))
        .init_theme_pictures({
          picturePannel: `#theme-panel .${tabs[ID_PICTURES_CONTENT].id}`,
        });
    }

    /**
     * Initialise les différentes constantes de la classe.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    init_const() {
      /**
       * @type {string}
       * @constant
       * @default '¤¤¤'
       */
      this.JSON_CHAR_REPLACE;
      /**
       * @type {string}
       * @constant
       * @default '<value/>'
       */
      this.SELECT_VALUE_REPLACE;
      /**
       * Si l'url contient extwin
       * @type {boolean}
       * @constant
       */
      this.IS_EXTERNE;
      /**
       * Si l'url contient _is_from
       * @type {boolean}
       * @constant
       */
      this.FROM_INFOS;
      /**
       * @type {number}
       * @constant
       * @package
       * @default 8
       */
      this._integer;

      /**
       * @typedef Keys
       * @property {35} end
       * @property {36} home
       * @property {37} left
       * @property {38} up
       * @property {39} right
       * @property {40} down
       * @property {41} delete
       * @package
       */

      /**
       * @type {Keys}
       * @readonly
       * @package
       * @see {@link Keys}
       */
      this.keys;

      Object.defineProperty(this, 'JSON_CHAR_REPLACE', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: '¤¤¤',
      });

      Object.defineProperty(this, 'SELECT_VALUE_REPLACE', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: '<value/>',
      });

      Object.defineProperty(this, '_integer', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: 8,
      });

      Object.defineProperty(this, 'IS_EXTERNE', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: window.location.href.includes('_extwin'),
      });

      Object.defineProperty(this, 'FROM_INFOS', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: {
          key: '_is_from',
          value: 'iframe',
        },
      });

      Object.defineProperty(this, 'keys', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: {
          end: 35,
          home: 36,
          left: 37,
          up: 38,
          right: 39,
          down: 40,
          delete: 46,
        },
      });

      return this;
    }

    onthemeclick($parent) {
      let $green = $parent.find(CONST_SELECTOR_THEME_BADGE_SELECTED);

      if ($green.length === 0) {
        new mel_html2(CONST_HTML_DIV, {
          attribs: {
            class: CONST_CLASS_THEME_BADGE_SELECTED,
            title: $parent.children().attr('title'),
          },
          contents: [
            new mel_html(CONST_HTML_SPAN, {
              class: `${CONST_ICON_CHECK} ${CONST_CLASS_ABSOLUTE_CENTER}`,
            }),
          ],
        }).create($parent.css(CONST_CSS_POSITION, CONST_CSS_POSITION_RELATIVE));
      } else $green.css(CONST_CSS_DISPLAY, EMPTY_STRING);
    }

    format_text(format, ...values) {
      for (
        let index = 0,
          len = values.length,
          trueIndex = index + 1,
          exist,
          formatted = {
            index: EMPTY_STRING,
            conditional_index: EMPTY_STRING,
            conditional_item: EMPTY_STRING,
          };
        index < len;
        ++index, ++trueIndex
      ) {
        const element = values[index];
        formatted.index = `%${trueIndex}`;
        formatted.conditional_index = `${formatted.index}?`;
        formatted.conditional_item = `(${formatted.conditional_index})`;
        exist = element === 0 || !!element;

        if (format.includes(formatted.conditional_item)) {
          for (let iterator of this._find_conditionnal_text(
            format,
            formatted.conditional_item,
          )) {
            format = format.replace(
              iterator.get(),
              exist ? iterator.getFormated() : EMPTY_STRING,
            );
          }
        } else if (format.includes(formatted.conditional_index)) {
          format = format.replaceAll(
            formatted.conditional_index,
            exist ? element : EMPTY_STRING,
          );
        } else format = format.replaceAll(formatted.index, element);
      }

      return format;
    }

    *_find_conditionnal_text(format, conditionnal) {
      let splited = format.split(conditionnal);
      let text = [];
      for (let index = 0, len = splited.length; index < len; ++index) {
        const element = splited[index];
        if (element.includes('/(')) text.push(element.split('/(')[1]);
        else if (element.includes(')/')) {
          text.push(element.split(')/')[0]);

          yield {
            format: conditionnal,
            array: text,
            joined: EMPTY_STRING,
            get() {
              if (EMPTY_STRING === this.joined)
                this.joined = this.array.join(this.format);
              return this.joined;
            },
            getFormated() {
              return this.get()
                .replace('/(', EMPTY_STRING)
                .replace('/)', EMPTY_STRING)
                .replace(this.format, EMPTY_STRING);
            },
          };

          text.length = 0;
        }
      }

      splited = ((text = null), null);
    }

    /**
     * TODO FINIR
     * @param {*} format
     * @param {*} values
     */
    _format_replace_conditions(format, values) {
      const regex = /\?\(([^)]+)\)\?/gm;

      if (regex.test(format)) {
        let matches = format.match(regex);

        for (
          let index = 0,
            len = matches.length,
            element,
            break_first_loop = false;
          index < len;
          ++index
        ) {
          element = matches[index]
            .replace('?(', EMPTY_STRING)
            .replace(')?', '');
          for (let j = 0, values_len = values.length; j < values_len; ++j) {
            const value = values[j];
            const index_condition = `%${j + 1}?`;
          }

          if (break_first_loop) break;
        }
      }
    }

    /**
     * Initialise la liste des thèles
     * @param {$} $panel
     * @param {boolean} $force
     * @param {Function} callback_click
     * @param {Function[]} callback_add
     * @returns Chaîne
     */
    init_theme(
      $panel = $(CONST_SELECTOR_THEME_PANEL_CONTENT_DEFAULT),
      $force = false,
      callback_click = null,
      callback_add = null,
    ) {
      //CONSTANTES
      const THEME_BUTTON_CLASS_ACTIVE = 'activated';
      const THEME_BUTTON_ICON_INACTIVE = 'palette';
      const THEME_BUTTON_ICON_ACTIVE = 'arrow_back';
      const STYLE_MAIN_DIV_THEME = 'margin:0;padding:0 5px;';
      const STYLE_THEME_BUTTON = 'margin:0;margin-bottom:5px;';
      const STYLE_THEME_BUTTON_PARENT = 'padding:0 5px;';
      const THEME_CLASS_COL_NUMBER = 6;
      const THEME_MAIN_CLASS_COL = `${CONST_CLASS_COL}-${THEME_CLASS_COL_NUMBER}`;
      const SELECTOR_NOTIFICATION_PANEL = `${CONST_JQUERY_SELECTOR_ID}notifications-panel`;
      const SELECTOR_THEME_PANEL = `${CONST_JQUERY_SELECTOR_ID}${CONST_THEME_PANEL_ID}`;

      const DEFAULT_THEME =
        rcmail.env.mel_themes[CONST_THEME_DEFAULT_ID]?.default_theme ??
        CONST_THEME_DEFAULT_ID;

      /**
       * Thèmes additionnels, générer par le javascript
       * @type {Function[]}
       */
      let additionnalThemes = callback_add || [];
      /**
       * Div html qui contient la liste des thèmes
       * @type {mel_html2}
       */
      let html = new mel_html2(CONST_HTML_DIV, {
        attribs: { class: CONST_CLASS_ROW, style: STYLE_MAIN_DIV_THEME },
      });
      this.theme = rcmail.env.current_theme || DEFAULT_THEME;

      if (
        rcmail.env.current_theme === CONST_THEME_DEFAULT_ID &&
        DEFAULT_THEME !== CONST_THEME_DEFAULT_ID
      )
        rcmail.env.current_theme = DEFAULT_THEME;

      //Si il y a un thème courant, on l'applique à la page
      if (rcmail.env.current_theme) {
        let $html = mel_html.select_html();

        if (!rcmail.env.mel_themes[rcmail.env.current_theme]) {
          rcmail.env.current_theme = DEFAULT_THEME;
          this.theme = rcmail.env.current_theme;
        }

        let current = rcmail.env.mel_themes[rcmail.env.current_theme];

        do {
          //Gestion du multi-thème
          $html.addClass(current.class);
          current = rcmail.env.mel_themes[current.parent];
        } while (current);
      }

      //Si il y a des thèmes ou que l'on souhaite forcer une génération de thème
      if (!!rcmail.env.mel_themes || $force) {
        const themes = rcmail.env.mel_themes;
        rcmail.env.mel_themes = null; //Ne plus le rendre disponible via rcmail.env.mel_themes pour éviter les doublons
        this.themes = themes || this.themes;

        if ($panel.length !== 0) {
          /**
           * Thème traité
           * @type {mel_html}
           */
          let html_theme;
          /**
           * Thème selectionné ou non
           * @type {boolean}
           */
          let is_selected;
          let html_main_div;
          for (const iterator of Enumerable.from(this.themes)
            .concat(additionnalThemes)
            .where((x) => x.value.showed)
            .orderBy((x) => x.value.order ?? Infinity)) {
            if (
              iterator.value.id === CONST_THEME_DEFAULT_ID &&
              CONST_THEME_DEFAULT_ID !== DEFAULT_THEME
            )
              continue;

            is_selected = iterator.value.id === this.theme;
            //Création du "bouton" du thème
            html_theme = new mel_html(CONST_HTML_DIV, {
              class: `${CONST_THEME_ICON_PREFIX}${iterator.value.id} ${CONST_CLASS_SELECTABLE} ${CONST_CLASS_SELECTABLE_PICTURE_ONLY} ${CONST_CLASS_SELECTABLE_PICTURE_ONLY_WITH_BORDER} ${CONST_CLASS_MEL_RESIZE_OK} ${is_selected ? CONST_CLASS_SELECTED : EMPTY_STRING}`,
              style: `${CONST_CSS_BACKGROUND}${CONST_CSS_ASSIGN}${CONST_CSS_BACKGROUND_URL}(${iterator.value.icon})${CONST_CSS_SEPARATOR}${STYLE_THEME_BUTTON}`,
              title: `${iterator.value.displayed}${iterator.value.desc ? ` - ${iterator.value.desc}` : EMPTY_STRING}`,
              role: CONST_ATTRIB_ROLE_BUTTON,
              tabindex: 0,
              'data-name': iterator.value.id,
              'aria-pressed': iterator.value.id === this.theme,
            });
            //Action à faire au clique
            html_theme.onclick.push((e) => {
              let dosomething = callback_click ? callback_click(e) : true;
              if (!dosomething) return;

              e = $(e.currentTarget);
              $panel
                .find(CONST_SELECTOR_THEME_BADGE_SELECTED)
                .css(CONST_CSS_DISPLAY, CONST_CSS_NONE);
              $panel
                .find(`${CONST_JQUERY_SELECTOR_CLASS}${CONST_CLASS_SELECTABLE}`)
                .removeClass(CONST_CLASS_SELECTED)
                .attr(CONST_ATTRIB_ARIA_PRESSED, false);
              e.addClass(CONST_CLASS_SELECTED).attr(
                CONST_ATTRIB_ARIA_PRESSED,
                true,
              );

              this.onthemeclick(e.parent());

              this.update_theme(e.data('name'));
              this._update_theme_color();
            });
            html_main_div = new mel_html2(CONST_HTML_DIV, {
              attribs: {
                class: THEME_MAIN_CLASS_COL,
                style: STYLE_THEME_BUTTON_PARENT,
              },
              contents: [html_theme],
            });
            html_main_div.css('position', 'flex');

            if (iterator.value.saison) {
              html_main_div.addContent(
                new mel_html(
                  CONST_HTML_SPAN,
                  { class: 'theme-saison-date' },
                  `${iterator.value.saison.start} - ${iterator.value.saison.end}`,
                ),
              );
            }

            //Ajouter à la DIV des thèmes, le bouton de thème dans une div "col-6"
            html.addContent(html_main_div);
          }

          //Après la génération de la liste des thèmes, appliquer les effets visuels sur le thème selectionné.
          html.aftergenerate.push((generated) => {
            if ($panel.length !== 0)
              this.onthemeclick(
                generated
                  .find(`${CONST_JQUERY_SELECTOR_CLASS}${CONST_CLASS_SELECTED}`)
                  .parent(),
              );
          });
        }
      }

      let $theme_button = $(
        `${CONST_JQUERY_SELECTOR_ID}${CONST_THEME_BUTTON_ID}`,
      );

      if (top === window) {
        //Si on est en Top & que le bouton de thème existe
        if (html.count() > 1) {
          //Si il y + d'un thème, on active les propriétés du bouton
          if (!this.theme_button_activated) {
            this.theme_button_activated = true;
            $theme_button.click(($e) => {
              $e = $($e.currentTarget);

              if (!$e.hasClass(THEME_BUTTON_CLASS_ACTIVE)) {
                $e.addClass(THEME_BUTTON_CLASS_ACTIVE).html(
                  THEME_BUTTON_ICON_ACTIVE,
                );
                $e.attr({
                  title: rcmail.gettext(
                    'back_to_notifications',
                    'mel_metapage',
                  ),
                });
                $(SELECTOR_NOTIFICATION_PANEL).css(
                  CONST_CSS_DISPLAY,
                  CONST_CSS_NONE,
                );
                $(SELECTOR_THEME_PANEL).css(CONST_CSS_DISPLAY, EMPTY_STRING);
                this._resize_themes();
              } else {
                $e.removeClass(THEME_BUTTON_CLASS_ACTIVE).html(
                  THEME_BUTTON_ICON_INACTIVE,
                );
                $e.attr({
                  title: rcmail.gettext('change_theme', 'mel_metapage'),
                });
                $(SELECTOR_NOTIFICATION_PANEL).css(
                  CONST_CSS_DISPLAY,
                  EMPTY_STRING,
                );
                $(SELECTOR_THEME_PANEL).css(CONST_CSS_DISPLAY, CONST_CSS_NONE);
              }
            });
          }

          if ($panel.length !== 0) html.create($panel);
        } else {
          //Sinon, on le désactive
          $theme_button
            .addClass(CONST_ATTRIB_DISABLED)
            .attr(CONST_ATTRIB_DISABLED, CONST_ATTRIB_DISABLED);
        }
      } else if (
        rcmail.env.task === 'settings' &&
        parent.MEL_ELASTIC_UI.color_mode() !== this.color_mode()
      ) {
        if (parent.MEL_ELASTIC_UI.color_mode() === 'dark') {
          if (this.themes[this.theme]?.custom_dark_mode)
            $('html').addClass('dark-mode-custom');
          else $('html').addClass('dark-mode');
        } else
          $('html').removeClass('dark-mode-custom').removeClass('dark-mode');
      }

      if ($('#rcmfd-toggle-anims').length > 0) {
        //Affichage du bouton de thème
        if (!this.themes[this.theme].animation_class) {
          $('#rcmfd-toggle-anims')
            .addClass('disabled')
            .attr('disabled', 'disabled')
            .parent()
            .parent()
            .css({ opacity: 0, position: 'absolute' });
        } else {
          $('#rcmfd-toggle-anims')
            .removeClass('disabled')
            .removeAttr('disabled')
            .parent()
            .parent()
            .css({ opacity: '', position: '' });
        }

        let current = this.themes[this.theme];

        if (current.animation_class) {
          if (
            rcmail.env.animation_enabled ??
            current.animation_enabled_by_default
          ) {
            $('body').addClass(current.animation_class);
            $('#rcmfd-toggle-anims')[0].checked = false;
          } else $('#rcmfd-toggle-anims')[0].checked = true;
        }
      }

      return this._update_theme_color();
    }

    init_theme_tabs({
      tabs_div_selector = CONST_SELECTOR_THEME_PANEL_TAB_DIV,
      $themePannel = $(CONST_SELECTOR_THEME_PANEL_CONTENT_DEFAULT),
      tabs = CONST_TABS_LIST,
    }) {
      const CLASS_TAB = 'mel-tab';
      const NAMESPACE = 'tab-meltheme';
      const CLASS_TAB_HEADER = 'mel-tabheader';
      const CLASS_TAB_CONTENT = 'mel-tab-content';
      const TAB_ACTIVE = 'active';
      const TAB_LAST = 'last';
      const CLASS_CONTENTS = 'themescontents';

      let themeIndex = null;
      let $tabs = $(tabs_div_selector).html(EMPTY_STRING);

      if ($tabs.length === 0) return tabs;

      for (let index = 0, len = tabs.length; index < len; ++index) {
        //On génère les onglets
        const element = tabs[index];
        new mel_html(
          CONST_HTML_DIV,
          {
            id: element.id,
            class: `${NAMESPACE} ${CLASS_TAB} ${CLASS_TAB_HEADER} ${index === 0 ? TAB_ACTIVE : len - 1 === index ? TAB_LAST : EMPTY_STRING}`,
          },
          element.display,
        ).create($tabs);

        if (CONST_TAB_THEME_ID === element.id) themeIndex = index;
      }

      let $pannelParent = $themePannel.parent();
      let $contents = new mel_html2(CONST_HTML_DIV, {
        attribs: {
          class: CLASS_CONTENTS,
          tabindex: 0,
        },
      });

      //Passer les thèmes dans le panel des thèmes
      if (themeIndex !== null) {
        let $divThemes = new mel_html(CONST_HTML_DIV, {
          class: `${tabs[themeIndex].id} ${NAMESPACE} ${CLASS_TAB_CONTENT}`,
        });
        $contents.addContent($divThemes);
        $divThemes.aftergenerate.push(($generated) => {
          $themePannel.appendTo($generated);
        });
      }

      //Ajout des onglets et apnneaux supplémentaires
      for (let index = 0, len = tabs.length; index < len; ++index) {
        const element = tabs[index];
        if (!element.already) {
          $contents.addContent(
            new mel_html(CONST_HTML_DIV, {
              class: `${element.id} ${NAMESPACE} ${CLASS_TAB_CONTENT}`,
              style: `${CONST_CSS_DISPLAY}${CONST_CSS_ASSIGN}${CONST_CSS_NONE}${CONST_CSS_SEPARATOR}`,
            }),
          );
        }
      }

      $contents.create($pannelParent);

      return tabs;
    }

    init_theme_pictures({
      picturePannel = '#theme-panel .theme-pannel-tab-pictures',
      picturesToIgnore = [],
      picturesToAdd = [],
    }) {
      const CLASS_PARENT_DIV = `${CONST_CLASS_COL}-4`;
      const CLASS_PARENT_HOVER = 'hovered';
      const CUSTOM_THEME_CLASSES =
        'input-top-selectable mel-resize-ok half-resize';
      const CUSTOM_THEME_PARENT_DIV_CLASS = 'div-custom-picture px-1';
      const CUSTOM_THEME_CLASSES_PIC = 'half-resize';
      const INPUT_CLASS = 'hidden';
      const INPUT_ACCEPT = ['.png', '.jpg', '.svg', '.gif'].join(',');
      const THEME_ATTRIB_DATA_USER_PREF_ID = 'prefid';
      const THEME_ATTRIB_DATA_PATH = 'picpath';
      const THEME_ATTRIB_DATA_ID = 'picid';
      const THEME_ATTRIB_DATA_IS_CUSTOM = 'iscustom';
      const THEME_DEFAULT_CLASS = 'barup-background-color';
      const THEME_CLASSES = 'mel-selectable picture mel-resize-ok';
      const RULE_KEY = 'barup-background';
      const DATA_PIC_ID = `${CONST_ATTRIB_DATA}-${THEME_ATTRIB_DATA_ID}`;
      const DATA_PIC_PATH = `${CONST_ATTRIB_DATA}-${THEME_ATTRIB_DATA_PATH}`;
      const DATA_IS_CUSTOM = `${CONST_ATTRIB_DATA}-${THEME_ATTRIB_DATA_IS_CUSTOM}`;
      const CONST_SELECTOR_SELECTED = `${CONST_JQUERY_SELECTOR_CLASS}${CONST_CLASS_SELECTED}`;
      const STYLE = 'padding:0 5px;';
      let $pannel = $(picturePannel);

      if ($pannel.length === 0) return this;
      const pictures = rcmail.env.mel_themes_pictures;
      let $item;
      /**
       * Contient la liste des images
       * @type {mel_html2}
       */
      let $mainrow = new mel_html2(CONST_HTML_DIV, {
        attribs: {
          class: CONST_CLASS_ROW,
          style: STYLE,
        },
      });
      this.theme_selected_picture = rcmail.env.theme_selected_picture || null;

      for (const iterator of Enumerable.from(pictures)
        .where((x) => !picturesToIgnore.includes(x.key))
        .concat(picturesToAdd)
        .orderBy((x) =>
          x.value.isFirst === true
            ? Number.NEGATIVE_INFINITY
            : x.value.customOrder || Number.POSITIVE_INFINITY,
        )) {
        //Div de position
        $item = new mel_html2(CONST_HTML_DIV, {
          attribs: {
            class: CLASS_PARENT_DIV,
            style: STYLE,
          },
        }).appendTo($mainrow);
        //Vrai DIV
        $item = new mel_html2(CONST_HTML_DIV, {}).appendTo($item);

        //Si c'est on peux choisir une image custom
        if (iterator.value.userprefid) {
          /**
           * Input caché
           * @type {mel_input}
           */
          var $input = new mel_input({
            class: INPUT_CLASS,
            type: CONST_ATTRIB_TYPE_FILE,
            accept: INPUT_ACCEPT,
            'data-prefid': iterator.value.userprefid,
          });

          //MAJ de l'image
          $input.onchange.push((ev) => {
            ev = $(ev.currentTarget);
            const prefid = ev.data(THEME_ATTRIB_DATA_USER_PREF_ID);
            const file = ev[0].files[0];
            var reader = new FileReader();
            reader.onload = (e) => {
              const picture = e.target.result;
              const size =
                mel_metapage.Functions.calculateObjectSizeInMo(picture);

              if (size < 2) {
                this.update_custom_picture(picture, prefid);
                let $selectable = ev
                  .parent()
                  .parent()
                  .find(
                    `${CONST_JQUERY_SELECTOR_CLASS}${CONST_CLASS_SELECTABLE}`,
                  )
                  .removeClass(THEME_DEFAULT_CLASS)
                  .css(
                    CONST_CSS_BACKGROUND_IMAGE,
                    `${CONST_CSS_BACKGROUND_URL}(${picture})`,
                  )
                  .css(
                    CONST_CSS_BACKGROUND_SIZE,
                    CONST_CSS_BACKGROUND_SIZE_COVER,
                  )
                  .data(THEME_ATTRIB_DATA_PATH, picture)
                  .data(THEME_ATTRIB_DATA_IS_CUSTOM, true);

                if (
                  $selectable.data(THEME_ATTRIB_DATA_ID) ===
                  this.get_theme_picture()
                ) {
                  this.css_rules.remove(RULE_KEY);
                  this._add_background(picture, true);
                }
              } else {
                rcmail.display_message(
                  'Votre image est trop lourde !',
                  'error',
                );
              }
            };
            reader.readAsDataURL(file);
          });
          //Bouton qui sert à cliquer sur l'input
          var $icon = new mel_html(
            'span',
            { class: 'material-symbols-outlined' },
            'upload',
          );
          var $button = new mel_button({}, $icon.toString());
          $button.onmouseover.push((e) => {
            $(e.currentTarget).parent().addClass(CLASS_PARENT_HOVER);
          });
          $button.onmouseout.push((e) => {
            $(e.currentTarget).parent().removeClass(CLASS_PARENT_HOVER);
          });
          $button.onclick.push((e) => {
            $(e.currentTarget).parent().find(CONST_HTML_INPUT).click();
          });

          if (iterator.value.title)
            $button.setAttr('title', iterator.value.title);

          //Mise en forme
          $item.addContent(
            new mel_html2(CONST_HTML_DIV, {
              attribs: {
                class: CUSTOM_THEME_CLASSES,
              },
              contents: [$input, $button],
            }),
          );
          $item.css(CONST_CSS_DISPLAY, CONST_CSS_DISPLAY_FLEX).attribs[
            CONST_ATTRIB_CLASS
          ] =
            ($item.attribs[CONST_ATTRIB_CLASS] || EMPTY_STRING) +
            ` ${CUSTOM_THEME_PARENT_DIV_CLASS}`;
          $item = new mel_html2(CONST_HTML_DIV, {
            attribs: {
              style: `${CONST_CSS_DISPLAY}${CONST_CSS_ASSIGN}${CONST_CSS_DISPLAY_FLEX}`,
            },
          })
            .addClass(CUSTOM_THEME_CLASSES_PIC)
            .appendTo($item);
        } else if (iterator.value.title) {
          $item.setAttr('title', iterator.value.title);
        }

        //Ajout des classes et du fonctionnement des boutons
        $item.addClass(THEME_CLASSES);
        $item.attribs[DATA_PIC_ID] = iterator.key;

        const isCustom =
          !!iterator.value.userprefid && !!iterator.value.background;
        if (iterator.value.isThemeColor === true) {
          $item.addClass(THEME_DEFAULT_CLASS);
        } else {
          $item.attribs[DATA_PIC_PATH] = iterator.value.background;
          $item
            .css(
              CONST_CSS_BACKGROUND_IMAGE,
              `${CONST_CSS_BACKGROUND_URL}(${isCustom ? iterator.value.background : iterator.value.view})`,
            )
            .css(CONST_CSS_BACKGROUND_SIZE, CONST_CSS_BACKGROUND_SIZE_COVER)
            .css(
              CONST_CSS_BACKGROUND_POSITION,
              CONST_CSS_BACKGROUND_POSITION_CENTER,
            );
          if (isCustom) $item.attribs[DATA_IS_CUSTOM] = true;
        }

        $item.onclick.push((e) => {
          e = $(e.currentTarget);
          $pannel
            .find(CONST_SELECTOR_THEME_BADGE_SELECTED)
            .css(CONST_CSS_DISPLAY, CONST_CSS_NONE);
          $pannel
            .find(CONST_SELECTOR_SELECTED)
            .removeClass(CONST_CLASS_SELECTED);
          e.addClass(CONST_CLASS_SELECTED);
          const data = e.data(THEME_ATTRIB_DATA_PATH);
          const isCustom = e.data(THEME_ATTRIB_DATA_IS_CUSTOM);

          try {
            this.css_rules.remove(RULE_KEY);
          } catch (error) {}

          if (data) {
            this._add_background(data, isCustom);
            $(CONST_HTML_HTML).addClass(CONST_CLASS_HTML_HAS_PICTURE);
          } else {
            $(CONST_HTML_HTML).removeClass(CONST_CLASS_HTML_HAS_PICTURE);
          }

          this.onthemeclick(e.parent());

          this.set_theme_picture(e.data(THEME_ATTRIB_DATA_ID));
        });

        //Effectuer les actions de séléction si il s'agit du thèmes en cours
        if (
          this.theme_selected_picture === null ||
          iterator.key === this.theme_selected_picture
        ) {
          $item.addClass(CONST_CLASS_SELECTED);
          $item.parent.aftergenerate.push(($generated) => {
            this.onthemeclick($generated);
          });

          if (
            this.theme_selected_picture === null ||
            !iterator.value.background
          ) {
            this.theme_selected_picture = iterator.key;
            this.css_rules.remove(RULE_KEY);
          } else {
            this._add_background(iterator.value.background, isCustom);
            $(CONST_HTML_HTML).addClass(CONST_CLASS_HTML_HAS_PICTURE);
          }
        }
      } //FIN FOR

      $mainrow.create($pannel);

      return this;
    }

    _resize_themes() {
      const size =
        $('#theme-panel .container').height() +
        $('#groupoptions-user .container.menu').height() +
        60 +
        30;
      $('#theme-panel .themescontents').css(
        'max-height',
        `${window.innerHeight - size}px`,
      );
    }

    _add_background(path, isRule) {
      this.css_rules.addAdvanced(
        'barup-background',
        '.barup',
        `background-image:url(${isRule ? path : (window.location.origin + window.location.pathname + path.replace('./', '/')).replaceAll('://', '¤').replaceAll('//', '/').replaceAll('¤', '://')})!important`,
        'background-size: cover !important',
        'background-position: center !important',
      );
      return this;
    }

    async update_custom_picture(datas, pref) {
      await mel_metapage.Functions.post(
        mel_metapage.Functions.url(
          'mel_metapage',
          'plugin.update_custom_picture',
        ),
        {
          _datas: datas,
          _prefid: pref,
        },
        (datas) => {
          const VALIDATION = 'ok';
          if (VALIDATION === datas) {
            rcmail.display_message(
              'Image chargée avec succès !',
              'confirmation',
            );
          }
        },
      );
    }

    async set_theme_picture(id) {
      this.theme_selected_picture = id || null;

      if (this.theme_selected_picture !== null) {
        await mel_metapage.Functions.post(
          mel_metapage.Functions.url(
            'mel_metapage',
            'plugin.update_theme_picture',
          ),
          {
            _id: id,
          },
          (datas) => {
            const VALIDATION = 'ok';
            if (VALIDATION === datas) {
              rcmail.display_message(
                'Image changée avec succès !',
                'confirmation',
              );
            }
          },
        );
      }
    }

    get_theme_picture() {
      return this.theme_selected_picture;
    }

    /**
     * Différentes actions Ã  faire après l'initialisation.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setup() {
      if (rcmail === undefined) return this;

      return this.setup_html()
        .setup_nav()
        .setup_tasks()
        .setup_search()
        .setup_other_apps()
        .setup_calendar()
        .setup_settings();
    }

    /**
     * Met en place l'apparence et le fonctionnel de la barre de navigation principale
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setup_nav() {
      if (parent === window) {
        //La sidebar étant en position absolue, on décale certaines divs pour que l'affichage soit correct.
        const width = '60px';

        if (!this.IS_EXTERNE && $('#layout-sidebar').length > 0)
          $('#layout-sidebar').css('margin-left', width);
        else if (!this.IS_EXTERNE && $('#layout-content').length > 0)
          $('#layout-content').css('margin-left', width);
      }

      let $taskmenu = $('#taskmenu');
      if ($taskmenu.length > 0) {
        if (this._hide_main_menu) {
          $('#layout-menu').remove();
        } else {
          //On met dans l'ordre les différents boutons de la barre de navigation principale
          let array = [];
          $taskmenu.find('a').each((i, e) => {
            e = $(e);

            if (e.parent().hasClass('special-buttons')) return;

            // if (e.hasClass('settings')) {
            //     e.css('display', 'none');
            //     return;
            // }

            const order = e.css('order');
            const tmp = e.removeAttr('title')[0].outerHTML;
            e.remove();
            e = null;
            array.push({
              order: order,
              item: $(tmp).keypress((event) => {
                if (event.originalEvent.keyCode === 32)
                  $(event.currentTarget).click();
              }),
            });
          });

          $taskmenu.append('<ul class="list-unstyled"></ul>');

          let li;
          Enumerable.from(array)
            .orderBy((x) => parseInt(x.order))
            .forEach((e) => {
              li = $(
                `<li style="display:block" data-order="${e.order}" class="button-${this.get_nav_button_main_class(e.item[0])}"></li>`,
              );
              e.item.attr('data-order', e.order);
              e = e.item;
              if (
                e.css('display') === 'none' ||
                e.hasClass('hidden') ||
                e.hasClass('compose')
              )
                li.css('display', 'none');

              e.appendTo(li);
              li.appendTo($('#taskmenu ul'));
            });

          li = null;

          let $taskMenu = $('#taskmenu .menu-last-frame').attr(
            'tabIndex',
            '-1',
          );

          if (rcmail.env.menu_last_frame_enabled !== true)
            $taskMenu.parent().css(CONST_CSS_DISPLAY, CONST_CSS_NONE);

          //On supprime le stockage si on y a pas accès.
          if (!mel_metapage.Functions.stockage.is_stockage_active())
            $('#taskmenu .stockage').parent().remove();
        }
      }

      return this.update_main_nav_meca();
    }

    update_main_nav_meca() {
      let $menu = $('#layout-menu');
      if ($menu.length > 0) {
        if (!rcmail.env.main_nav_can_deploy) {
          $menu
            .addClass('main-nav-cannot-deploy')
            .find('a')
            .each((index, element) => {
              element = $(element);
              element.attr('title', element.find('span').first().text());
            });
        } else {
          $menu
            .removeClass('main-nav-cannot-deploy')
            .find('a')
            .each((index, element) => {
              element = $(element);
              element.removeAttr('title');
            });
        }
      }

      $menu = $('#otherapps');
      if ($menu.length > 0) {
        if (!rcmail.env.main_nav_can_deploy) {
          $menu.find('a').each((index, element) => {
            element = $(element);
            element.attr('title', element.find('span').first().text());
          });
        } else {
          $menu.find('a').each((index, element) => {
            element = $(element);
            element.removeAttr('title');
          });
        }
      }

      $menu = null;

      return this;
    }

    /**
     * Met en place les actions pour les tÃ¢ches qui en ont besoins.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setup_tasks() {
      try {
        //Gérer le texte du bouton de login.
        if (rcmail.env.task == 'login' || rcmail.env.task == 'logout')
          $('#rcmloginsubmit').val('Se connecter').html('Se connecter');

        //Revenir Ã  la liste des mails sans rafraÃ®chir la page.
        if (
          rcmail.env.task === 'mail' &&
          rcmail.env.action === 'show' &&
          !this.IS_EXTERNE
        ) {
          $(
            '<li role="menuitem"><a class="icon-mel-close" href="#back" title="Revenir aux mails"><span style="font-family:Roboto,sans-serif" class="inner">Retour</span></a></li>',
          )
            .on('click', () => {
              window.location.href = this.url('mail');
            })
            .prependTo($('#toolbar-menu'));
        }
      } catch (error) {}

      try {
        //Gérer le changement de mot de passe dans le login.
        $('#login-form p.formbuttons a').click(() => {
          event.preventDefault();
          window.location.href = window.location.href.replaceAll(
            '/changepassword/index.php',
            '',
          );
        });
      } catch (error) {
        console.error(error);
      }

      return this.setup_mails().setup_adressbook();
    }

    /**
     * Met en place les mails.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setup_mails() {
      if (rcmail.env.task === 'mail' && $('#mailsearchform').length > 0) {
        $('#mailsearchform')
          .parent()
          .parent()
          .find('.unread')
          .on('click', (e) => {
            if (!$(e.target).hasClass('selected'))
              $(e.target).attr('title', 'Afficher tout les courriels');
            else $(e.target).attr('title', rcmail.gettext('showunread'));
          });
      }

      if (rcmail.env.task === 'mail') {
        $('.header-content a.headers').remove();

        $('.task-mail #quotadisplay')
          .prepend(`<span id='stockage-space-text'>Espace de stockage</span><p style="flex-basis: 100%;
                height: 0;
                margin: 0;"></p>`);

        //Gérer la prévisu des mails.
        rcmail.show_contentframe_parent = rcmail.show_contentframe;
        rcmail.show_contentframe = function (show) {
          //On ne fait rien si en mode small ou phone
          if (
            show &&
            ($('html').hasClass('layout-small') ||
              $('html').hasClass('layout-phone'))
          ) {
            rcmail.show_contentframe_parent(show);
            $('#layout-content')
              .css('display', '')
              .removeClass('layout-hidden');
            return;
          }

          if (rcmail.env.is_from_scroll === true)
            delete rcmail.env.is_from_scroll;
          else if ($('#layout-list').hasClass('initial') && show) {
            rcmail.triggerEvent('ui.open-mail-visu');
            //Mise en place du système
            $('#layout-content')
              .css('display', '')
              .removeClass('hidden layout-hidden');
            $('#layout-list').removeClass('initial');

            //On réduit la recherche au besoin
            $('#mailsearchlist')
              .addClass('hoverable')
              .on('mouseover focusin', () => {
                if (
                  $('#mailsearchlist').hasClass('hoverable') &&
                  !$('#layout-list').hasClass('full')
                )
                  $('#mailsearchlist').removeClass('hoverable');
              })
              .on('mouseleave focusout', () => {
                if (document.activeElement === $('#mailsearchform')[0]) return;

                if (
                  !$('#mailsearchlist').hasClass('hoverable') &&
                  !$('#layout-list').hasClass('full')
                )
                  $('#mailsearchlist').addClass('hoverable');
              })
              .find('#mailsearchform')
              .on('focusout', (e) => {
                if (e.relatedTarget === $('#mailsearchlist .reset')[0]) return;

                if (
                  !$('#mailsearchlist').hasClass('hoverable') &&
                  !$('#layout-list').hasClass('full')
                )
                  $('#mailsearchlist').addClass('hoverable');
              });

            let $back = `<li role="menuitem" class="parent-close-visu">
                            <a  onclick="return rcmail.command('close-mail-visu','',this,event)"  class="close-visu"  role="button" href="#" ><span class="inner">Fermer</span></a>
                        </li>`;

            $('#layout-content ul#toolbar-menu').prepend($back);

            $('#layout-content .header .move.simplified').css(
              'display',
              'none',
            );

            //Fermer la prévisu
            rcmail.register_command(
              'close-mail-visu',
              (args) => {
                const { ignore_select } = args;

                if (!ignore_select)
                  $('#messagelist-content .selected')
                    .removeClass('selected')
                    .removeClass('focused')
                    .removeAttr('aria-selected')
                    .find('.selection input')
                    .click();

                $('#layout-content')
                  .css('display', 'none')
                  .addClass('hidden layout-hidden');
                $('#layout-list').addClass('full');

                $('#mailsearchlist').removeClass('hoverable');

                rcmail.triggerEvent('ui.close-mail-visu');
              },
              true,
            );
          } else if ($('#layout-list').hasClass('full') && show) {
            //Afficher ou fermer
            $('#layout-content')
              .css('display', '')
              .removeClass('hidden')
              .removeClass('layout-hidden');
            $('#layout-list').removeClass('full');

            $('#mailsearchlist').addClass('hoverable');

            rcmail.triggerEvent('ui.open-mail-visu');
          }

          rcmail.show_contentframe_parent(show);

          let hidden = $(
            '#layout-content .header #toolbar-menu .hidden-item-mt a',
          );
          if (hidden.length > 0) {
            hidden.each(async (i, e) => {
              let a = $(`#message-menu #${e.id}`);
              if (a.hasClass('disabled') && !$(e).hasClass('disabled'))
                a.removeClass('disabled');
              else if (!a.hasClass('disabled') && $(e).hasClass('disabled'))
                a.addClass('disabled');
            });
          }
        }; /////////

        if (rcmail.env.action === 'compose') {
          //Ajouter "Envoyer" en haut.
          $('.btn.btn-primary.send').remove();
          $('#toolbar-menu').prepend(`
                        <li role="menuitem">
                            <a class="send" href=# onclick="return rcmail.command('send','',this,event)"><span class="inner">Envoyer</span></a>
                        </li>
                    `);
        } else if (rcmail.env.action === '' || rcmail.env.action === 'index') {
          rcmail.addEventListener('init', () => {
            let i = 7;
            let $aria = null;

            for (i; ($aria = $(`li[aria-level="${i}"] a`)).length > 0; ++i) {
              $aria.css('padding-left', `${i * 1.5 - 2}em`);
            }
          });

          //Gestion de l'apparence et de l'affichage des mails.
          // add roundcube events
          rcmail.addEventListener('insertrow', function (event) {
            var rowobj = $(event.row.obj);
            rowobj.find('.selection input').on('change', () => {
              let hidden = $(
                '#layout-content .header #toolbar-menu .hidden-item-mt a',
              );
              if (hidden.length > 0) {
                hidden.each(async (i, e) => {
                  let a = $(`#message-menu #${e.id}`);
                  if (a.hasClass('disabled') && !$(e).hasClass('disabled'))
                    a.removeClass('disabled');
                  else if (!a.hasClass('disabled') && $(e).hasClass('disabled'))
                    a.addClass('disabled');
                });
              }
            });
          });

          $('#mailsearchlist .searchbar .reset').click(() => {
            $('#mailsearchlist .searchbar .flag').removeClass('selected');
          });
          $('#mailsearchlist .searchbar .unread')
            .click(() => {
              $('#mailsearchlist .searchbar .flag').removeClass('selected');
            })
            .before(
              $(
                '<a class="button flag" href="#" role="button" title="Afficher les courriels suivis"></a>',
              ).click((e) => {
                const item = $(e.target);

                if (item.hasClass('selected')) item.removeClass('selected');
                else item.addClass('selected');

                $(rcmail.gui_objects.search_filter).val(
                  !item.is('.selected') ? 'ALL' : 'FLAGGED',
                );
                rcmail.command('search');
              }),
            );

          $('#toolbar-list-menu .compose')
            .parent()
            .prependTo($('#toolbar-list-menu .compose').parent().parent());

          //Ajout de "plus"
          $('#toolbar-list-menu').append(
            $(`
                        <li id="limelmailplusmenu" class="marked" style="display:none" role="menuitem">
                        
                        </li>
                    `).append($('#melplusmails').css('display', '')),
          );

          let test = new ResizeObserver(() => {
            let value = 0;
            {
              let iterator;
              for (iterator of $('#toolbar-list-menu li')) {
                iterator = $(iterator);
                if (!iterator.hasClass('marked')) {
                  value += iterator.width();
                }
              }
              iterator = null;
              const additional_width = $(
                '.header .toolbar-button.refresh',
              ).width();
              value += additional_width + additional_width / 2.0;
            }
            const max =
              $('#layout-list').width() - $('#mail-search-border').width(); //mailConfig === null || mailConfig["mel-icon-size"] === rcmail.gettext("normal", "mel_metapage") ? 370 : 347; //370;

            if (value > max) {
              $('#toolbar-list-menu li')
                .css('display', 'none')
                .find('.compose')
                .parent()
                .css('display', '');
              $('#limelmailplusmenu').css('display', '');
            } else {
              $('#toolbar-list-menu li').css('display', '');
              $('#limelmailplusmenu').css('display', 'none');
            }

            if (
              !$('html').hasClass('touch') &&
              $('#toolbar-list-menu').hasClass('hidden')
            ) {
              $('#toolbar-list-menu')
                .removeClass('hidden')
                .removeAttr('aria-hidden');
            }

            if (
              rcmail.env.search_initialized !== true &&
              window.innerWidth < 410 &&
              window.innerWidth > 0
            ) {
              console.log(
                'hoverable observer',
                rcmail.env.search_initialized,
                window.innerWidth,
              );
              rcmail.env.search_initialized = true;
              $('#mailsearchlist')
                .addClass('hoverable')
                .click((e) => {
                  //console.log("e", $("#mailsearchlist").hasClass("stopclick"));
                  if ($('#mailsearchlist').hasClass('stopclick')) {
                    $('#mailsearchlist').removeClass('stopclick');

                    if (!$('#mailsearchlist').hasClass('hoverable')) {
                      $('#mailsearchlist').addClass('hoverable');
                      return;
                    }
                  }

                  if (window.innerWidth < 410) {
                    $('#mailsearchlist').removeClass('hoverable');
                    $('#mailsearchlist input').focus();
                  }
                })
                .find('input')
                .on('focusout', (e) => {
                  if (window.innerWidth < 410) {
                    console.log('hoverable observer', e, window.innerWidth);
                    let parent =
                      e.relatedTarget === null ? null : $(e.relatedTarget); //e.originalEvent === null || e.originalEvent.explicitOriginalTarget === null ? null : $(e.originalEvent.explicitOriginalTarget);
                    while (
                      parent !== null &&
                      parent.attr('id') != 'mailsearchlist' &&
                      parent[0].nodeName != 'BODY' &&
                      !parent.hasClass('icon-mel-search')
                    ) {
                      parent = parent.parent();
                    }

                    if (
                      parent === null ||
                      parent.hasClass('icon-mel-search') ||
                      parent[0].nodeName === 'BODY'
                    ) {
                      if (!!parent && parent.hasClass('icon-mel-search'))
                        $('#mailsearchlist').addClass('stopclick');
                      else {
                        $('#mailsearchlist').addClass('hoverable');
                      }
                      document.activeElement.blur();
                    }
                  }
                });
            }
          });
          test.observe($('#layout-list')[0]);

          this.update_mail_css({});

          //message_extwin @Rotomeca
          const alias_mel_rcmail_show_message = rcmail.show_message;
          rcmail.show_message = function (id, safe, preview) {
            const openInPopUp =
              !preview && !this.env.message_extwin && !this.env.extwin;

            if (openInPopUp) {
              let url = this.params_from_uid(id, {
                _caps: this.browser_capabilities(),
              });

              if (safe) url._safe = 1;
              url._extwin = 1;
              url = this.url('show', url);
              new Windows_Like_PopUp(top.$('body'), {
                title: "Ouverture d'un mail...",
                content: `${MEL_ELASTIC_UI.create_loader('rotomecamelloader', true)[0].outerHTML}<iframe title="Ouverture d'un mail" src="${url + '&_is_from=iframe'}" style="width:100%;height:calc(100%);display:none;"/>`,
                afterCreatingContent($html, box, popup) {
                  box.content.find('iframe').on('load', () => {
                    let $iframe = box.content.find('iframe');
                    const title = $iframe[0].contentDocument.title;
                    const delete_action = function delete_action() {
                      try {
                        rcmail.command('checkmail');
                      } catch (error) {}
                      box.close.click();
                    };

                    box.title.find('h3').html(title);
                    box.content.find('#rotomecamelloader').remove();
                    $iframe.css('display', '');
                    $iframe[0].contentWindow.Windows_Like_PopUp =
                      Windows_Like_PopUp;
                    $iframe[0].contentWindow.rcmail.env.is_in_popup_mail = true;
                    $iframe[0].contentWindow.rcmail.addEventListener(
                      'message.deleted',
                      async (event) => {
                        delete_action();
                      },
                    );
                    $iframe[0].contentWindow.rcmail.addEventListener(
                      'message.moved',
                      async (event) => {
                        delete_action();
                      },
                    );
                    $iframe[0].contentWindow.rcmail.addEventListener(
                      'message.junk',
                      async (event) => {
                        delete_action();
                      },
                    );

                    if (popup._minified_header) {
                      popup._minified_header
                        .find('h3')
                        .html(
                          title.length > 20
                            ? title.slice(0, 20) + '...'
                            : title,
                        );
                    }
                  });

                  // let spinner = box.content.find(".spinner-border").css("width", '30%');
                  // let spinner_size = Math.round(spinner.width());
                  // spinner.css("width", `${spinner_size}px`)
                  // .css('height', `${spinner_size}px`).css('margin', '15px');
                },
                width: 'calc(100% - 60px)',
                height: 'calc(100% - 60px)',
                context: top,
                fullscreen: true,
              });
            } else alias_mel_rcmail_show_message.call(this, id, safe, preview);
          };
        } else if (
          rcmail.env.action === 'preview' ||
          rcmail.env.action === 'show'
        ) {
          $('#message-header .headers-table td').each((i, e) => {
            switch ($(e).html()) {
              case 'De':
                $(e).parent().addClass('mel-header-from');
                break;
              case 'Date':
                $(e).parent().addClass('mel-header-date');
                break;

              default:
                break;
            }
          });

          $('#mel-message-details').click(() => {
            const plus = 'icon-mel-plus';
            const minus = 'icon-mel-minus';
            let querry = $('#mel-message-details .mel-d-icon');

            if (querry.hasClass(minus)) {
              querry.removeClass(minus).addClass(plus);
              $('.message-partheaders').hide();
            } else {
              querry.removeClass(plus).addClass(minus);
              $('.message-partheaders').show();
            }
          });
        }

        const alias_mel_rcmail_permanently_remove_messages =
          rcmail.permanently_remove_messages;
        rcmail.permanently_remove_messages = function () {
          alias_mel_rcmail_permanently_remove_messages.call(this);
          rcmail.triggerEvent('message.deleted');
        };

        const alias_mel_rcmail_move_messages = rcmail.move_messages;
        rcmail.move_messages = function (mbox, event, uids) {
          alias_mel_rcmail_move_messages.call(this, mbox, event, uids);
          rcmail.triggerEvent('message.moved', { mbox, uids, e: event });
        };

        rcmail.addEventListener('responsebeforeplugin.markasjunk.junk', () => {
          rcmail.triggerEvent('message.junk', { junk: true });
        });

        rcmail.addEventListener(
          'responsebeforeplugin.markasjunk.not_junk',
          () => {
            rcmail.triggerEvent('message.junk', { junk: false });
          },
        );
      }

      return this.setup_mails_classes().setup_compose();
    }

    /**
     * Met en place les actions relative aux mails
     * @returns
     */
    setup_mails_classes() {
      if (rcmail.env.task === 'mail') {
        let action = ($querry, _class) => {
          if (!$querry.attr('id').includes('clone')) {
            $querry.addClass('mel').parent().addClass(`mel-li-${_class}`);
          }
        };

        let testing = (e, _class) => {
          const array = Enumerable.from(e.classList).toArray() || [];
          const count = array.length;
          if (count === 1) action($(e), _class);
          else if (
            count === 2 &&
            array.includes(_class) &&
            (array.includes('disabled') || array.includes('active'))
          ) {
            action($(e), _class);
          }
        };

        //Répondre
        $('#toolbar-menu .reply').each((i, e) => {
          testing(e, 'reply');
        });

        //transfert
        $('#toolbar-menu .forward').each((i, e) => {
          testing(e, 'forward');
        });
      }

      return this;
    }

    /**
     * Met en place la rédaction d'un mail.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setup_compose() {
      //Si on se trouve au bon endroit.
      if (rcmail.env.task === 'mail' && rcmail.env.action === 'compose') {
        const key = 'bureau_num_last_fields';
        //Sauvegarder le champs
        $('a.input-group-text.icon.add').click(() => {
          $('#headers-menu ul.menu a.recipient.active').each((i, e) => {
            e = $(e);
            e.click(() => {
              let storage = Mel_Elastic_Storage.load(key, []);

              const field = e.data('target');
              if (!storage.includes(field)) {
                storage.push(field);
                Mel_Elastic_Storage.save(key, storage);
              }
            });
          });
        });

        //Supprimer le champ
        $('a.input-group-text.icon.delete').each((i, e) => {
          e = $(e);
          e.click(() => {
            let $input = e.parent().parent().find('textarea');

            if ($input.length === 0) $input = e.parent().parent().find('input');

            const field = $input.attr('id').replace('_', '');
            let storage = Mel_Elastic_Storage.load(key, []);

            if (storage.includes(field)) {
              storage =
                Enumerable.from(storage)
                  .where((x) => x !== field)
                  .toArray() || [];

              if (storage.length === 0) Mel_Elastic_Storage.remove(key);
              else Mel_Elastic_Storage.save(key, storage);
            }
          });
        });

        const storage = Mel_Elastic_Storage.load(key, []);

        //Afficher les champs
        if (storage !== null && storage.length > 0) {
          for (let index = 0; index < storage.length; ++index) {
            const element = storage[index];
            $(`#compose_${element}`).removeClass('hidden');
          }
        }

        //Suppression du "commenter"
        $('#mel-comment-mail').css('display', 'none');

        //Gestion des options
        if (
          rcmail.env.compose_option !== undefined &&
          rcmail.env.compose_option !== null &&
          rcmail.env.compose_option !== ''
        ) {
          switch (rcmail.env.compose_option) {
            case 'empty':
              $('#compose-subject').val('');
              try {
                $('#compose-subject').change();
              } catch (error) {}

              // rcmail.addEventListener('editor-load', () => {
              //     if (rcmail.env.editor_emptied !== true)
              //     {
              //         rcmail.editor.set_content("");
              //         rcmail.env.editor_emptied = true;
              //     }
              // });

              break;

            default:
              break;
          }
        }

        if (top !== window) {
          $('#toolbar-menu a.send').removeAttr('href');
        }

        if (window === top && rcmail.env.extwin !== 1) {
          let $tmp_quit = $(
            '<a style="margin-right:15px" class="back" href="#" >Messages</a>',
          ).click(() => {
            rcmail.env.action = 'index';
            rcmail.action = 'index';
            rcmail.compose_skip_unsavedcheck = true;
            const _$ = top.$;

            _$('.task-mail.action-compose #taskmenu li a')
              .removeClass('disabled')
              .removeAttr('disabled');
            _$('.barup button').removeClass('disabled').removeAttr('disabled');
            _$('#barup-search-input')
              .removeClass('disabled')
              .removeAttr('disabled');
            _$('#user-up-popup').css('pointer-events', 'all');
            _$('.tiny-rocket-chat')
              .removeClass('disabled')
              .removeAttr('disabled');
            _$('.task-mail.action-compose #taskmenu li a.menu-last-frame')
              .addClass('disabled')
              .attr('disabled', 'disabled');

            if (_$('iframe.mail-frame').length > 0)
              mel_metapage.Functions.change_frame('mail', true, true);
            else if (_$('.mail-frame').length > 0) {
              _$('.mail-frame').remove();
              mel_metapage.Functions.change_frame('mail', true, true);
            } else mel_metapage.Functions.change_frame('mail', true, true);

            _$('body').removeClass('action-compose').addClass('action-none');
          });

          $('ul#toolbar-menu').prepend(
            $(`<li role="menuitem">
                    
                    </li>`).append($tmp_quit),
          );

          $('.task-mail.action-compose #taskmenu li a');
          z.addClass('disabled').attr('disabled', 'disabled');
          $('.barup button').addClass('disabled').attr('disabled', 'disabled');
          $('#barup-search-input')
            .addClass('disabled')
            .attr('disabled', 'disabled');
          $('#user-up-popup').css('pointer-events', 'none');
          const interval = setInterval(() => {
            if (!$('.tiny-rocket-chat').hasClass('disabled')) {
              $('.tiny-rocket-chat')
                .addClass('disabled')
                .attr('disabled', 'disabled');
            } else clearInterval(interval);
          }, 100);

          $('#layout-content').css('margin-left', '60px');
        }
      }

      rcmail.addEventListener('fileappended', (file) => {
        //console.log("file", file);
        if (file.attachment.html.includes('class="delete"')) {
          $('a.delete').html('');
        }
      });

      const alias_mel_rcmail_open_compose_step = rcmail.open_compose_step;
      rcmail.open_compose_step = function (p) {
        if (parent !== window) return parent.rcmail.open_compose_step(p);

        if (window.create_popUp !== undefined) create_popUp.close();

        if (
          (rcmail.env.compose_extwin && !rcmail.env.extwin) ||
          rcmail.env.extwin
        ) {
          if (rcmail.env.extwin && rcmail.env.is_in_popup_mail === true) {
            var last_ext_win = rcmail.env.extwin;
            rcmail.env.extwin = 0;

            if (!rcmail.env.compose_extwin) {
              rcmail.open_compose_step(p);
              rcmail.env.extwin = last_ext_win;
              return;
            }
          }

          alias_mel_rcmail_open_compose_step.call(this, p);

          if (last_ext_win !== undefined) rcmail.env.extwin = last_ext_win;
        } else {
          p['_extwin'] = 1;
          const url = rcmail.url('mail/compose', p);
          let config = {
            title: 'Rédaction',
            content: `${MEL_ELASTIC_UI.create_loader('rotomecamelloader', true)[0].outerHTML}<iframe class="sr-only" title="Rédaction d'un mail" src="${url + '&_is_from=iframe'}" style="width:100%;height:calc(100%);"/>`,
            onclose(popup) {
              if (popup.box.close.data('force') == '1') return;
              if (
                popup.waiting_save !== true &&
                confirm('Voulez-vous sauvegarder le message comme brouillon ?')
              ) {
                popup.waiting_save = true;
                popup.box.close
                  .addClass('disabled')
                  .attr('disabled', 'disabled');
                popup.box.minifier
                  .addClass('disabled')
                  .attr('disabled', 'disabled');
                popup.box.title
                  .find('h3')
                  .html(
                    popup.box.title
                      .find('h3')
                      .html()
                      .replace('Rédaction : ', 'Sauvegarde de : '),
                  );

                if (
                  popup.box.minifier
                    .find('span')
                    .hasClass(popup.settings.icon_minify)
                )
                  popup.minify();

                let frame_context =
                  popup.box.content.find('iframe')[0].contentWindow;

                const alias_mel_rcmail_compose_field_hash =
                  frame_context.rcmail.compose_field_hash;
                frame_context.rcmail.compose_field_hash = function (save) {
                  alias_mel_rcmail_compose_field_hash.call(this, save);
                  popup.close();
                };

                frame_context.rcmail.command('savedraft');

                return 'break';
              }
            },
            afterCreatingContent($html, box, popup) {
              box.close.data('force', '1');
              box.content.find('iframe').on('load', () => {
                box.close.data('force', '');
                let frame_context = box.content.find('iframe')[0].contentWindow;

                frame_context.popup_action = (callback) => {
                  callback($html, box);
                };

                frame_context
                  .$('#layout-sidebar .scroller')
                  .css('max-height', '100%');

                frame_context
                  .$('#compose-subject')
                  .on('input', (e) => {
                    box.title
                      .find('h3')
                      .html('Rédaction : ' + $(e.currentTarget).val());
                  })
                  .on('change', (e) => {
                    box.title
                      .find('h3')
                      .html('Rédaction : ' + $(e.currentTarget).val());
                  });

                box.content.find('#rotomecamelloader').css('display', 'none');
                box.content.find('iframe').removeClass('sr-only');
                const obj = frame_context.$('#compose-subject').val();

                if ((obj || '') !== '')
                  box.title.find('h3').html('Rédaction : ' + obj);

                frame_context.rcmail.addEventListener(
                  'message_submited',
                  async (args) => {
                    if (args.draft !== true) {
                      box.get.find('iframe').css('display', 'none');
                      box.close
                        .addClass('disabled')
                        .attr('disabled', 'disabled');
                      box.title
                        .find('h3')
                        .html(
                          box.title
                            .find('h3')
                            .html()
                            .replace('Rédaction : ', 'Envoi de : '),
                        );
                      box.content.find('#rotomecamelloader').css('display', '');
                    }
                  },
                );

                frame_context.rcmail.addEventListener(
                  'message_sent',
                  async (args) => {
                    rcmail.display_message(args.msg, args.type);
                    box.close.data('force', '1');
                    box.close.removeClass('disabled').removeAttr('disabled');
                    const interval = setInterval(() => {
                      if (rcmail.busy === false) {
                        let frame = top.$('iframe.mail-frame');
                        if (frame.length > 0) {
                          frame[0].contentWindow.rcmail.command(
                            'checkmail',
                            '',
                          );
                        }
                        frame = null;

                        rcmail.command('checkmail', '');
                        clearTimeout(interval);
                      }
                    }, 100);
                    box.close.click();
                  },
                );

                frame_context.rcmail.addEventListener(
                  'plugin.message_send_error',
                  ($args) => {
                    console.error('###[plugin.message_send_error]', $args);
                    rcmail.display_message(
                      "Impossible d'envoyer le mail !",
                      'error',
                    );
                    if (
                      popup.box.minifier
                        .find('span')
                        .hasClass(popup.settings.icon_expend)
                    )
                      popup.expand();

                    box.close.removeClass('disabled').removeAttr('disabled');
                    box.get.find('iframe').css('display', '');
                    box.title
                      .find('h3')
                      .html(
                        box.title
                          .find('h3')
                          .html()
                          .replace('Envoi de : ', 'Rédaction : '),
                      );
                    box.content
                      .find('#rotomecamelloader')
                      .css('display', 'none');

                    if (frame_context.$('#mail-send-loader').length > 0) {
                      frame_context.$('#mail-send-loader').remove();
                      frame_context
                        .$('#layout-sidebar, #layout-content')
                        .css('display', '');
                      setTimeout(() => {
                        if (frame_context.$('#mail-send-loader').length > 0) {
                          frame_context.$('#mail-send-loader').remove();
                        }
                      }, 10);
                    }
                  },
                );

                frame_context.$('#toolbar-menu a.send').removeAttr('href');

                if (frame_context.rcmail.env.is_model)
                  box.close.data('force', '1');
              });

              // let spinner = box.content.find(".spinner-border").css("width", '30%');

              // let spinner_size = Math.round(box.content.find(".spinner-border").width());

              // spinner.css("width", `${spinner_size}px`)
              // .css('height', `${spinner_size}px`).css('margin', '15px');
            },
            width: 'calc(100% - 60px)',
            height: 'calc(100% - 60px)',
            context: top,
            fullscreen: true,
          };

          const popup_class =
            window.Windows_Like_PopUp || top.Windows_Like_PopUp;
          return new popup_class(top.$('body'), config);
        }
      };

      const alias_mel_rcmail_submit_messageform = rcmail.submit_messageform;
      rcmail.submit_messageform = function (draft, saveonly) {
        alias_mel_rcmail_submit_messageform.call(this, draft, saveonly);

        rcmail.triggerEvent('message_submited', {
          draft,
          saveonly,
        });
      };

      const alias_mel_rcmail_sent_successfully = rcmail.sent_successfully;
      rcmail.sent_successfully = function (type, msg, folders, save_error) {
        alias_mel_rcmail_sent_successfully.call(
          this,
          type,
          msg,
          folders,
          save_error,
        );

        rcmail.triggerEvent('message_sent', {
          type,
          msg,
          folders,
          save_error,
        });
      };

      return this;
    }

    /**
     * Met en place certaines actions pour les contacts
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setup_adressbook() {
      if (
        rcmail.env.task === 'addressbook' &&
        rcmail.env.action === 'show' &&
        window != parent &&
        rcmail.env.accept_back === true
      ) {
        let $tmp = $(
          '<button type="button" class="btn btn-secondary mel-button create mel-before-remover">Retour <span class="plus icon-mel-undo "></span></button>',
        ).on('click', () => {
          return top.rcmail.command('mel.metapage.contacts.back');
          // let $args = {
          //     _source:rcmail.env.annuaire_source
          // };

          // parent.postMessage({
          //     exec:"searchToAddressbook",
          //     _integrated:true,
          //     child:false
          // }, '*');

          // rcmail.set_busy(true, "loading");
          // window.location.href = this.url("addressbook", "plugin.annuaire", $args);
        });
        $('#contacthead').append($tmp);
      }

      return this;
    }

    /**
     * Met en place la recherche
     * @returns
     */
    setup_search() {
      let $sbox = $('#quicksearchbox');

      if ($sbox.length === 0) $sbox = $('#searchform');

      if ($sbox.length > 0)
        $sbox.on('change', () => {
          $sbox.parent().submit();
        });

      return this;
    }

    is_hidden(e) {
      e = $(e);

      return (
        e.css('display') === 'none' || e.parent().css('display') === 'none'
      );
    }

    setup_settings() {
      if (rcmail.env.task === 'settings') {
        let $list = $('#settings-menu');

        if ($list.length) {
          $(document).ready(() => {
            let switch_a = false;
            $list = $('ul#settings-menu li a');
            for (const a of $list) {
              if (switch_a) $(a).attr('tabindex', -1);
              else switch_a = true;
            }

            $list.on('keydown', (e) => {
              let it = 1;
              let $all_a = $('ul#settings-menu li a');
              const index = $('ul#settings-menu li a').index(e.currentTarget);
              switch (e.originalEvent.code) {
                case 'ArrowDown':
                  while (this.is_hidden($all_a[index + it])) {
                    ++it;
                  }

                  if (index + it < $all_a.length) {
                    $($all_a[index + it])
                      .attr('tabindex', 0)
                      .focus();

                    $all_a = true;
                  }
                  break;

                case 'ArrowUp':
                  while (this.is_hidden($all_a[index - it])) {
                    ++it;
                  }
                  if (index - it >= 0) {
                    $($all_a[index - it])
                      .attr('tabindex', 0)
                      .focus();

                    $all_a = true;
                  }

                default:
                  break;
              }

              if ($all_a === true) $(e.currentTarget).attr('tabindex', -1);
            });
          });
        }
      }

      return this;
    }

    /**
     * Met en place la barre de navigation pour les autres applis.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setup_other_apps(ignoreStart = false) {
      if (!ignoreStart) {
        const CLASS_FOR_LI_PREFIX = 'li-';
        //Enrobe les "a" par des "li".
        let tmp;
        for (let e of $('#otherapps a')) {
          tmp = new mel_html('li', {
            style: 'width:100%',
            class: Enumerable.from(e.classList)
              .where((x) => x.includes(CLASS_FOR_LI_PREFIX))
              .select((x) => x.replace(CLASS_FOR_LI_PREFIX, EMPTY_STRING))
              .toArray(),
          });
          $(e)
            .addClass('mel-focus')
            .appendTo(tmp.create($(e).parent()));
        }
      }

      //Gestion de la barre.
      $('#otherapps')
        .find('a')
        .on('focusout', (e) => {
          $('#menu-overlay').remove();
          let $parent = $(e.relatedTarget);

          if ($parent.length > 0) {
            while (
              !$parent.hasClass('otherapps') &&
              $parent.length > 0 &&
              $parent[0].nodeName !== 'BODY'
            ) {
              $parent = $parent.parent();
            }
          }

          if (!$parent.hasClass('otherapps')) {
            if (
              !$(e.relatedTarget).hasClass('more-options') &&
              $('#otherapps').css('display') !== 'none'
            ) {
              $('a.more-options').click();
              if ($('html').hasClass('touch')) {
                $('#touchmelmenu').click();
              }
            }
          }
        });

      return this;
    }

    /**
     * Met en place diverses choses qui concerne les choses invisibles.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setup_html() {
      const ff_check_parent = true;
      try {
        $('meta[name=viewport]').attr(
          'content',
          $('meta[name=viewport]')
            .attr('content')
            .replace(', maximum-scale=1.0', ''),
        );
      } catch (error) {}

      if (
        (ff_check_parent ? window === parent : true) &&
        typeof InstallTrigger !== 'undefined'
      ) {
        $('html').addClass('navigator-firefox');
      }

      return this;
    }

    /**
     * Met en place le calendrier
     * @returns
     */
    setup_calendar() {
      if (rcmail.env.task === 'calendar') {
        let $waiting_events = $('#layout-sidebar .waiting-events-number');

        if ($waiting_events.length > 0) {
          $waiting_events
            .on('mouseenter', () => {
              const id = 'waiting-events-list';
              const id_child = 'waiting-events-list-items';
              const id_selector = `#${id}`;
              if ($(id_selector).length > 0) {
                return;
              }

              const events = rcube_calendar.get_number_waiting_events(false);

              if (!!events && events.length > 0) {
                let $we_list = $(
                  `<div id="${id}"><div id="${id_child}"></div></div>`,
                );

                let $wel_items = $we_list.find(`#${id_child}`);

                const format = 'DD/MM/YYYY HH:mm';
                const size = events.length;
                for (let index = 0; index < size; ++index) {
                  const element = events[index];
                  $wel_items.append(
                    $(`
                                <button title="Evènement ${element.title}, cliquez pour afficher l'évènement" class="waiting-event-button mel-button">
                                    <span class="waiting-event-title">${element.title}</span>
                                    <span class="waiting-event-horodate">${moment(element.start).format(format)} - ${moment(element.end).format(format)}</span>
                                </button>
                                `).click(() => {
                      top.SearchResultCalendar.CreateOrOpen(
                        JSON.stringify(element),
                      );
                    }),
                  );
                }

                $waiting_events.append($we_list);
              }
            })
            .on('mouseleave', (e) => {
              const id = 'waiting-events-list';
              const id_selector = `#${id}`;

              if ($(id_selector).length > 0) $(id_selector).remove();
            });
        }
      }

      return this;
    }

    update_mail_css({ key = null, value = null }) {
      if (
        !!key &&
        !!value &&
        !!value[key] &&
        rcmail.env.mel_metapage_mail_configs[key] !== value[key]
      ) {
        rcmail.env.mel_metapage_mail_configs[key] = value[key];
      }

      if (rcmail.env.task !== 'mail') return;

      const mailConfig = rcmail.env.mel_metapage_mail_configs;

      if (mailConfig !== null) {
        let _css = [];

        const mel_icon_size = 'mel-icon-size';
        if (this.css_rules.ruleExist(mel_icon_size))
          this.css_rules.remove(mel_icon_size);

        //Taille des icÃ´nes
        if (
          mailConfig[mel_icon_size] !== rcmail.gettext('normal', 'mel_metapage')
        ) {
          this.css_rules.addAdvanced(
            mel_icon_size,
            '#toolbar-menu li a,#messagelist-header a.refresh,#toolbar-list-menu li a',
            'font-size: 0.9rem;',
          );
        }

        const mel_folder_space = 'mel-folder-space';
        if (this.css_rules.ruleExist(mel_folder_space))
          this.css_rules.remove(mel_folder_space);

        //Espacement des dossiers
        if (
          mailConfig[mel_folder_space] ===
          rcmail.gettext('larger', 'mel_metapage')
        )
          this.css_rules.addAdvanced(
            mel_folder_space,
            '#folderlist-content li',
            '--settings-mail-folder-margin-top: 30px;',
            '--settings-mail-subfolder-margin-top: 5px;',
            ' --settings-mail-opened-folder-margin-top: 30px;',
          );
        else if (
          mailConfig[mel_folder_space] ===
          rcmail.gettext('smaller', 'mel_metapage')
        ) {
          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#folderlist-content li',
              '--settings-mail-folder-margin-top: 0px;',
              '--settings-mail-subfolder-margin-top: -5px;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#folderlist-content .unified li',
              '--settings-mail-folder-margin-top: 0px;',
              '--settings-mail-subfolder-margin-top: -5px;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#folderlist-content li.mailbox.boite[aria-expanded="true"]',
              '--settings-mail-opened-folder-margin-bottom: 20px;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#folderlist-content .unified li.mailbox.boite[aria-expanded="true"]',
              '--settings-mail-opened-folder-margin-top: 5px!important;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#folderlist-content .unified li.mailbox[aria-expanded="true"]',
              '--settings-mail-folder-margin-bottom: 20px!important;',
              '--settings-mail-folder-margin-top: 5px!important;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#folderlist-content ul#mailboxlist > li > ul li[aria-level="2"]:first-of-type',
              'border: none;',
              'margin-top: 0;',
              'padding-top: 0;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#folderlist-content ul#mailboxlist > li > ul li[aria-level="2"]:first-of-type div.treetoggle,#folderlist-content ul#mailboxlist > li > ul li[aria-level="2"]:first-of-type .unreadcount',
              'top:0;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#mailboxlist li ul:first-of-type',
              'padding-left: 1.5em;',
            ),
          );

          const rule = new Mel_CSS_Array_Rule(_css);

          this.css_rules._add(mel_folder_space, rule);
          _css = [];
        }

        const mel_message_space = 'mel-message-space';
        if (this.css_rules.ruleExist(mel_message_space))
          this.css_rules.remove(mel_message_space);

        //Espacement des messages
        if (
          mailConfig[mel_message_space] ===
          rcmail.gettext('larger', 'mel_metapage')
        )
          this.css_rules.addAdvanced(
            mel_message_space,
            '#messagelist tr.message td',
            'padding-top: 1rem;',
            'padding-bottom: 1rem;',
          );
        else if (
          mailConfig[mel_message_space] ===
          rcmail.gettext('smaller', 'mel_metapage')
        ) {
          _css.push(
            new Mel_CSS_Advanced_Rule(
              '#messagelist tr.message td',
              'padding-top: 0;',
              'padding-bottom:0;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              'table.messagelist td.subject span.subject',
              'margin-top: -10px;',
            ),
          );

          _css.push(
            new Mel_CSS_Advanced_Rule(
              'table.messagelist tr.message td.flags span.attachment',
              'margin-top: -7px;',
              'pointer-events: none',
            ),
          );

          const rule = new Mel_CSS_Array_Rule(_css);

          this.css_rules._add(mel_message_space, rule);

          _css = [];
        }

        // var style=document.createElement('style');
        // style.type='text/css';

        // if(style.styleSheet){
        //     style.styleSheet.cssText = _css;
        // }else{
        //     style.appendChild(document.createTextNode(_css));
        // }
        // document.getElementsByTagName('head')[0].appendChild(style);
      }
    }

    async update_mail_css_async({ key = null, value = null }) {
      return this.update_mail_css({ key, value });
    }

    set_font_size() {
      const size = `${rcmail.env['font-size']}-text`;
      const other_size = `${size === 'sm' ? 'lg' : 'sm'}-text`;
      let $html = $('html');

      if (!$html.hasClass(size)) $html.removeClass(other_size).addClass(size);

      return this;
    }

    /**
     * Renvoie vrai si les barre de défilements sont en mode automatique
     * @returns
     */
    isScollBarAuto() {
      if (!this.auto_text)
        this.auto_text = rcmail.gettext('auto', 'mel_metapage');

      return (
        rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] ===
        this.auto_text
      );
    }

    updateScollBarMode() {
      const css_key = 'scroll_bar_size';
      if (this.css_rules.ruleExist(css_key)) {
        this.css_rules.remove(css_key);
      }

      if (this.isScollBarAuto()) {
        //Le mode automatique n'existe plus
        rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] =
          rcmail.gettext('default', 'mel_metapage');
      }

      if (this.isScollBarAuto() && !this.updateScollBarMode.initialized) {
        let ele;
        let distance;
        let last_target = null;
        document.addEventListener('mousemove', function (e) {
          if (UI.is_touch() === false && MEL_ELASTIC_UI.isScollBarAuto()) {
            ele = e.target;

            if (last_target) {
              if (ele !== last_target) {
                $('.more-width').removeClass('more-width');
                last_target = ele;
              }
            } else last_target = ele;

            distance = ele.offsetLeft + ele.offsetWidth - e.pageX;
            distance < 15 && distance > -15
              ? ele.classList.add('more-width')
              : ele.classList.remove('more-width');
          }
        });

        this.updateScollBarMode.initialized = true;
      } else if (
        rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] ===
        rcmail.gettext('normal', 'mel_metapage')
      ) {
        this.css_rules.addAdvanced(
          css_key,
          ':root',
          '--scrollbar-width-moz:var(--scrollbar-width-moz-normal)!important',
          '--scrollbar-width-webkit:var(--scrollbar-width-webkit-normal)!important',
        );
      } else if (
        rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] ===
        rcmail.gettext('large', 'mel_metapage')
      ) {
        this.css_rules.addAdvanced(
          css_key,
          ':root',
          '--scrollbar-width-webkit:var(--scrollbar-width-webkit-large)!important',
          '--scrollbar-width-moz:var(--scrollbar-width-moz-large)!important',
        );
      }

      return this;
    }

    /**
     * Met Ã  jours la page.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    update() {
      return this.update_tabs()
        .update_pagination()
        .updateScollBarMode()
        .redStars();
    }

    /**
     * Met Ã  jours le système d'onglet
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    update_tabs() {
      let querry = $('.mel-tabheader');

      if (querry.length > 0) {
        querry.unbind('click');
        querry.on('click', (e) => {
          //console.log("MEL_ELASTIC", this, e);
          this.switchTab(e.currentTarget);
        });
        querry.each((i, e) => {
          let parent = $(e).parent();

          if (!parent.hasClass('mel-ui-tab-system')) {
            this.gestionTabs(parent);

            for (let index = 0; index < e.classList.length; ++index) {
              const element = e.classList[index];

              if (element.includes('tab-')) {
                $(`.${element}.mel-tabheader`).each((index, element) => {
                  if (index !== 0) $(element).attr('tabindex', -1);
                });
                break;
              }
            }
          }
        });
      }

      querry = $('.select-button-mel');

      if (querry.length > 0) {
        querry.unbind('click');
        querry.on('click', (e) => {
          this.generateSelect(e.currentTarget);
        });
      }

      return this;
    }

    /**
     * Met Ã  jours le système de pagination.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    update_pagination() {
      let querry = $('.pagination');

      if (querry.length > 0) {
        querry.each((i, e) => {
          e = $(e);
          this.set_pagination(
            e,
            e.data('count'),
            e.data('current') === undefined ? null : e.data('current'),
          );
          return this;
        });
      }

      return this;
    }

    ////////////************* Main functions *************///////////

    /**
     * Gère les étoiles rouges.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    redStars() {
      let querry = $('.red-star-after');

      if (querry.length > 0) {
        $('.red-star-after').each((i, e) => {
          e = $(e);

          if (!e.hasClass('mel-after-remover'))
            e.append(
              '<star class="red-star mel-before-remover">*</star>',
            ).addClass('mel-after-remover');
        });
      }

      querry = $('.red-star');

      if (querry.length > 0) {
        querry.each((i, e) => {
          e = $(e);

          if (!e.hasClass('mel-before-remover'))
            e.prepend('<star class="red-star mel-before-remover">*</star>')
              .removeClass('red-star')
              .addClass('red-star-removed');
        });
      }

      return this;
    }

    /**
     * Switch de thème (sombre/light)
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    switch_color() {
      let $html = $('html');
      if ($html.hasClass('dark-mode-custom'))
        $html.removeClass('dark-mode-custom');

      $html = null;

      $('iframe.mm-frame').each((i, e) => {
        if (!e.classList.contains('discussion-frame')) {
          $html = e.contentWindow.$('html');

          if ($html.hasClass('dark-mode-custom'))
            $html.removeClass('dark-mode-custom');
        }
      });

      rcmail.triggerEvent('switch_color_theme');

      return this._update_theme_color();
    }

    /**
     * Retourne le thème en cours
     * @returns {string} dark/light
     */
    color_mode() {
      return $('html').hasClass('dark-mode') ||
        $('html').hasClass('dark-mode-custom')
        ? 'dark'
        : 'light';
    }

    _update_theme_color() {
      let $html = $('html');

      if (this.color_mode() === 'dark') {
        if (this.themes[this.theme]?.custom_dark_mode) {
          if ($html.hasClass('dark-mode')) $html.removeClass('dark-mode');
          if (!$html.hasClass('dark-mode-custom'))
            $html.addClass('dark-mode-custom');
        } else {
          if (!$html.hasClass('dark-mode')) $html.addClass('dark-mode');
          if ($html.hasClass('dark-mode-custom'))
            $html.removeClass('dark-mode-custom');
        }
      } else if ($html.hasClass('dark-mode-custom'))
        $html.removeClass('dark-mode-custom');

      if (
        this.color_mode() === 'dark' &&
        !this.themes[this.theme]?.custom_dark_mode
      ) {
        let current = this.themes[this.get_current_theme()];
        do {
          $html.removeClass(current.class);
          current = this.themes[current.parent];
        } while (current);
      } else if (this.get_current_theme() !== 'default') {
        let current = this.themes[this.get_current_theme()];
        do {
          $html.addClass(current.class);
          current = this.themes[current.parent];
        } while (current);
      }

      $('iframe.mm-frame').each((i, e) => {
        if (
          !e.classList.contains('discussion-frame') &&
          !!e.contentWindow.MEL_ELASTIC_UI
        ) {
          e.contentWindow.MEL_ELASTIC_UI._update_theme_color();
        }
      });

      return this;
    }

    ////////////************* Other functions *************///////////
    /**
     * Récupère la classe principale d'un bouton de la barre de navigation
     * @param {DomElement} button - Ne doit pas Ãªtre du JQUERY
     * @returns {string} - Classe principale ou "no-class-found" si aucune classe principale trouvé.
     */
    get_nav_button_main_class(button) {
      const list = button.classList;
      for (const key in list) {
        if (Object.hasOwnProperty.call(list, key)) {
          const element = list[key];
          switch (element) {
            case 'mel-focus':
            case 'selected':
            case 'order1':
            case 'mel':
            case 'disabled':
            case 'hidden':
              continue;

            default:
              if (element.includes('icofont')) continue;
              if (element.includes('icon-mel-')) continue;
              if (element.includes('button')) continue;

              return element;
          }
        }
      }

      return 'no-class-found';
    }

    /**
     * Génère une couleur au hasard.
     * @returns {string} Couleur héxadécimale
     */
    getRandomColor() {
      var letters = '0123456789ABCDEF';
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    /**
     * Récupère la différence de 2 réctangles.
     * @param {DOMRect} rect1 Rectangle Ã  soustraire
     * @param {DOMRect} rect2 Rectangle de soustraction
     * @returns {{top:number, left:number, right:number, bottom:number, rect1:DOMRect, rect2:DOMRect}} Résultats
     */
    getRect(rect1, rect2) {
      return {
        top: rect1.top - rect2.top,
        left: rect1.left - rect2.left,
        right: rect1.right - rect2.right,
        bottom: rect1.bottom - rect2.bottom,
        rect1,
        rect2,
      };
    }

    /**
     * Récupère une url correcte
     * @param {string} task TÃ¢che que l'on souhaite
     * @param {string} action Action que l'on souhaite
     * @param {JSON} args Arguments supplémentaires
     * @returns {string} Url fonctionnel
     */
    url(task, action = '', args = null) {
      if (window.mel_metapage !== undefined)
        return mel_metapage.Functions.url(task, action, args);
      else {
        let tmp = '';

        if (action !== '') tmp += '&_action=' + action;

        if (
          window.location.href.includes(this.FROM_INFOS.key) &&
          window.location.href.includes(this.FROM_INFOS.value)
        ) {
          if (args === null || args === undefined) args = {};

          args[this.FROM_INFOS.key] = this.FROM_INFOS.value;
        }

        for (const key in args) {
          if (Object.hasOwnProperty.call(args, key)) {
            const element = args[key];
            tmp += '&' + key + '=' + element;
          }
        }
        return rcmail.get_task_url(
          task + tmp,
          window.location.origin + window.location.pathname,
        );
      }
    }

    /**
     * Récupère une recherche de contact avec autocompletion.
     * @param {string} id Id de l'input
     * @returns {string} html
     */
    get_input_mail_search(id = '') {
      let html = 'Participants<span class=red-star></span>';
      html += '<div class="input-group">';
      html +=
        '<textarea name="_to_workspace" spellcheck="false" id="to-workspace" tabindex="-1" data-recipient-input="true" style="position: absolute; opacity: 0; left: -5000px; width: 10px;" autocomplete="off" aria-autocomplete="list" aria-expanded="false" role="combobox"></textarea>';
      html +=
        '<ul id="wspf" class="form-control recipient-input ac-input rounded-left">';
      /* <li class="recipient">
                                    <span class="name">delphin.tommy@gmail.com</span>
                                    <span class="email">,</span>
                                    <a class="button icon remove"></a></li> */
      html +=
        '<li class="input"><input id="' +
        id +
        '" onchange="m_mp_autocoplete(this)" oninput="m_mp_autocoplete(this)" type="text" tabindex="1" autocomplete="off" aria-autocomplete="list" aria-expanded="false" role="combobox"></li></ul>';
      html += '<span class="input-group-append">';
      html += `<a href="#add-contact" onclick="m_mp_openTo(this, '${id}')" class="input-group-text icon add recipient" title="Ajouter un contact" tabindex="1"><span class="inner">Ajouter un contact</span></a>`;
      html += '			</span>';
      html += '			</div>';
      return html;
    }

    ////////////************* Select box functions *************///////////
    /**
     * Créer une selectbox stylisé via un élément
     * @param {JQUERY} event Jquery élément
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    generateSelect(event) {
      event = $(event);
      const rc =
        typeof event.data('rcmail') === 'string'
          ? event.data('rcmail') === 'true'
          : event.data('rcmail');

      if (rc) {
        if (rcmail.is_busy) return;
      }

      //console.log("generateSelect", event.data("options"), typeof event.data("options"), event);
      const options =
        typeof event.data('options') === 'string'
          ? JSON.parse(
              event.data('options').includes('¤¤¤')
                ? event.data('options').replaceAll('¤¤¤', '"')
                : event.data('options'),
            )
          : event.data('options');
      const options_class =
        typeof event.data('options_class') === 'string'
          ? JSON.parse(
              event.data('options_class').includes('¤¤¤')
                ? event.data('options_class').replaceAll('¤¤¤', '"')
                : event.data('options_class'),
            )
          : event.data('options_class');
      const options_title =
        typeof event.data('option-title') === 'string'
          ? JSON.parse(
              event.data('option-title').includes('¤¤¤')
                ? event.data('option-title').replaceAll('¤¤¤', '"')
                : event.data('option-title'),
            )
          : event.data('option-title');
      const options_current_title =
        typeof event.data('option-title-current') === 'string'
          ? JSON.parse(
              event.data('option-title-current').includes('¤¤¤')
                ? event.data('option-title-current').replaceAll('¤¤¤', '"')
                : event.data('option-title-current'),
            )
          : event.data('option-title-current');
      const update = event.data('event');
      const is_icon =
        typeof event.data('is_icon') === 'string'
          ? event.data('is_icon') === 'true'
          : event.data('is_icon');
      const value = event.data('value');
      const onchange = event.data('onchange'); // = typeof event.data("on") === "string" ? JSON.parse(event.data("on").includes("¤¤¤") ? event.data("on").replaceAll('¤¤¤', '"') : event.data("on")) : event.data("on");
      //Create selectbox
      if (event.parent().css('position') !== 'relative')
        event.parent().css('position', 'relative');

      let html = '<div class="btn-group-vertical">';

      for (const key in options) {
        if (Object.hasOwnProperty.call(options, key)) {
          const element = options[key];
          const current_option_class =
            options_class !== null &&
            options_class !== undefined &&
            options_class[key] !== undefined
              ? options_class[key]
              : '';
          const current_option_title =
            options_title !== null &&
            options_title !== undefined &&
            options_title[key] !== undefined
              ? options_title[key]
              : '';
          const new_option_title =
            options_current_title !== null &&
            options_current_title !== undefined &&
            options_current_title[key] !== undefined
              ? options_current_title[key]
              : '';
          html +=
            '<button title="' +
            current_option_title +
            '" onclick="MEL_ELASTIC_UI.updateSelectValue(`' +
            key +
            '`, `' +
            new_option_title +
            '`)" class="' +
            current_option_class +
            ' mel-selected-content-button btn btn-primary ' +
            (value === key ? 'active' : '') +
            '">' +
            (is_icon ? '<span class=' + element + '></span>' : element) +
            '</button>';
        }
      }

      html += '</div>';
      const rect = this.getRect(
        event[0].getBoundingClientRect(),
        event.parent()[0].getBoundingClientRect(),
      );
      html = $(html)
        .css('position', 'absolute')
        .css('top', rect.top + rect.rect1.height)
        .css('left', rect.left)
        .css('z-index', 50)
        .addClass('mel-select-popup');
      event.parent().append(html);
      event.on('focusout', (e) => {
        if ($(e.relatedTarget).hasClass('mel-selected-content-button')) {
          $(e.relatedTarget).click();
          event.focus();
        } else $('.mel-select-popup').remove();
      });

      this.tmp_popup = {
        options: options,
        options_class: options_class,
        event: event,
        is_icon: is_icon,
        onchange: onchange,
      };

      return this;
    }

    /**
     * Met Ã  jour la valeur du select
     * @param {string} value Nouvelle valeur
     * @param {string} newTitle Nouveau titre associé
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    updateSelectValue(value, newTitle = '') {
      //console.log("generateSelect", value);
      if (this.tmp_popup !== undefined) {
        if (this.tmp_popup.event.data('value') === value) {
          $('.mel-select-popup').remove();
          delete this.tmp_popup;
          return;
        }

        this.tmp_popup.event
          .data('value', value)
          .attr('title', newTitle)
          .html(
            this.tmp_popup.is_icon
              ? '<span class=' + this.tmp_popup.options[value] + '></span>'
              : this.tmp_popup.options[value],
          );
        const options_class = this.tmp_popup.options_class;

        if (options_class !== null && options_class !== undefined) {
          const current_option_class =
            options_class[value] !== undefined ? options_class[value] : null;
          for (const key in options_class) {
            if (Object.hasOwnProperty.call(options_class, key)) {
              const element = options_class[key];
              this.tmp_popup.event.removeClass(element);
            }
          }
          if (current_option_class !== null)
            this.tmp_popup.event.addClass(current_option_class);
        }

        $('.mel-select-popup').remove();

        if (
          this.tmp_popup.onchange !== null &&
          this.tmp_popup.onchange !== undefined
        ) {
          if (this.tmp_popup.onchange.includes('<value/>'))
            this.tmp_popup.onchange = this.tmp_popup.onchange.replaceAll(
              '<value/>',
              value,
            );

          if (
            this.tmp_popup.onchange.includes(
              'MEL_ELASTIC_UI.SELECT_VALUE_REPLACE',
            )
          )
            this.tmp_popup.onchange = this.tmp_popup.onchange.replaceAll(
              'MEL_ELASTIC_UI.SELECT_VALUE_REPLACE',
              '`' + value + '`',
            );

          eval(this.tmp_popup.onchange);
        }

        delete this.tmp_popup;
      }

      return this;
    }

    /**
     * Modifie la valeur d'un select
     * @param {string} new_value Nouvelle valeur
     * @param {JQUERY} event Ã‰lément JQUERY
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    setValue(new_value, event) {
      const options =
        typeof event.data('options') === 'string'
          ? JSON.parse(
              event.data('options').includes('¤¤¤')
                ? event.data('options').replaceAll('¤¤¤', '"')
                : event.data('options'),
            )
          : event.data('options');
      const options_class =
        typeof event.data('options_class') === 'string'
          ? JSON.parse(
              event.data('options_class').includes('¤¤¤')
                ? event.data('options_class').replaceAll('¤¤¤', '"')
                : event.data('options_class'),
            )
          : event.data('options_class');
      const update = event.data('event');
      const is_icon =
        typeof event.data('is_icon') === 'string'
          ? event.data('is_icon') === 'true'
          : event.data('is_icon');
      const value = event.data('value');
      const onchange = event.data('onchange');

      this.tmp_popup = {
        options: options,
        options_class: options_class,
        event: event,
        is_icon: is_icon,
        onchange: onchange,
      };
      this.updateSelectValue(new_value);

      return this;
    }

    ////////////************* Tab functions *************///////////
    /**
     * Change d'onglet
     * @param {DOMElement} event
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    switchTab(event) {
      //get id
      const id = event.id;
      //get namespace (tab-)
      let namespace = null;

      $(event).each((i, e) => {
        for (let index = 0; index < e.classList.length; ++index) {
          const element = e.classList[index];
          if (element.includes('tab-')) {
            namespace = element;
            break;
          }
        }
      });

      if (namespace === null) return this;

      //Désactivation des autres tabs et objets
      $('.' + namespace + '.mel-tab')
        .removeClass('active')
        .attr('aria-selected', false)
        .attr('tabindex', -1);
      $('.' + namespace + '.mel-tab-content').css('display', 'none');

      //Activation de la tab
      $(event)
        .addClass('active')
        .attr('aria-selected', true)
        .attr('tabindex', 0);

      //activation des objets lié Ã  la tab
      $('.' + id + '.' + namespace).css('display', '');
      const onclick = $(event).data('onclick');

      if (onclick !== null && onclick !== undefined && onclick !== '') {
        new Promise((a, b) => {
          try {
            eval(onclick);
          } catch (error) {
            console.error(error);
          }

          if ($(event).data('delete-after-click') === true)
            $(event).data('onclick', '');
        });
      }

      return this;
    }

    /**
     * Gère les différents onglets
     * @param {JQUERY | DOMElement} $item Si null, gère la page entière
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    gestionTabs($item = null) {
      if ($item === null) {
        const items = document.querySelectorAll('[role="tablist"]');
        for (let index = 0; index < items.length; ++index) {
          const element = items[index];
          this.gestionTabs(element);
        }
      } else {
        const determineDelay = function () {
          var hasDelay = tablist.hasAttribute('data-delay');
          var delay = 0;

          if (hasDelay) {
            var delayValue = tablist.getAttribute('data-delay');
            if (delayValue) {
              delay = delayValue;
            } else {
              // If no value is specified, default to 300ms
              delay = 300;
            }
          }

          return delay;
        };

        let item = $($item);

        if (item.hasClass('mel-ui-tab-system')) return this;
        else item.addClass('mel-ui-tab-system');

        let tabs = item.find('button');

        if (tabs.length === 0) {
          tabs = item.children();
          tabs.attr('tabindex', 0);
        }

        tabs.keydown((event) => {
          const key = event.keyCode;

          let direction = 0;
          switch (key) {
            case this.keys.left:
              direction = -1;
              break;
            case this.keys.right:
              direction = 1;
              break;

            case this.keys.home:
              $(tabs[0]).focus().click();
              break;
            case this.keys.end:
              $(tabs[tabs.length - 1])
                .focus()
                .click();
              break;

            default:
              break;
          }

          if (direction !== 0) {
            for (let index = 0; index < tabs.length; ++index) {
              const element = $(tabs[index]);

              if (element.hasClass('selected') || element.hasClass('active')) {
                let id;
                if (index + direction < 0) id = tabs.length - 1;
                else if (index + direction >= tabs.length) id = 0;
                else id = index + direction;

                $(tabs[id]).focus().click();

                break;
              }
            }
          }
        });
      }

      return this;
    }

    create_loader(id, absoluteCentered = true, generate = true) {
      let loading = new mel_html2(CONST_HTML_DIV, {
        attribs: {
          class: 'loader-base',
        },
        contents: [new mel_html(CONST_HTML_DIV, { class: 'loader-looping' })],
      });

      if (absoluteCentered) {
        loading = new mel_html2(CONST_HTML_DIV, {
          attribs: { class: CONST_CLASS_ABSOLUTE_CENTER },
          contents: [loading],
        });
      }

      loading = new mel_html2(CONST_HTML_DIV, {
        attribs: { id },
        contents: [loading],
      });

      return generate ? loading.generate() : loading;
    }

    ////////////************* Pagination functions *************///////////
    /**
     * Créer un html pour le nombre de la pagination
     * @param {number} number Nombre
     * @param {boolean} isClickable Si le nombre est clickable
     * @param {boolean} active Si le nombre est actif
     * @returns {string} HTML
     */
    create_number(number, isClickable = true, active = false) {
      return (
        '<span class="pagination-number pagination-number-' +
        number.toString().replaceAll('.', 'a') +
        (active ? ' active ' : '') +
        (isClickable ? '' : 'disabled') +
        '" onclick="MEL_ELASTIC_UI.pagination_page(this, ' +
        number +
        ')">' +
        number +
        '</span>'
      );
    }

    /**
     * Créer une barre de pagination
     * @param {DomElement} e Element qui contiendra la pagination
     * @param {number} count Nombre d'éléments
     * @param {number} current Elément courant
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    set_pagination(e, count, current = null) {
      const _integer = this._integer;
      //debugger;
      //console.log("count", count);
      count = Math.ceil(count / 7.0);
      e.html(
        '<button class="pagination_prev pagination-button" onclick="MEL_ELASTIC_UI.pagination_prev(this)">Précédent</button>',
      );
      e.append('<div class=pagination-elements></div>');
      let pagination_elements = e.find('.pagination-elements');
      for (let index = (current ?? 1) - 1; index < count; ++index) {
        pagination_elements.append(
          this.create_number(index + 1, true, index === 0),
        );
      }

      e.append(
        '<button class="pagination_next pagination-button" onclick="MEL_ELASTIC_UI.pagination_next(this)">Suivant</button>',
      );
      //console.log("current", current);
      if (current !== null)
        this.pagination_page(
          $('.pagination-number-' + current)[0],
          current,
          false,
        );

      return this;
    }

    /**
     * Change de page spécifiquement
     * @param {JQUERY} e Elément cliqué
     * @param {number} number Page
     * @param {boolean} doAction Si on effectue l'action ou non.
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    pagination_page(e, number, doAction = true) {
      const _integer = this._integer;
      e = $(e).parent();
      const count = Math.ceil(e.parent().data('count') / 7.0);
      let html = '';

      if (count > _integer) {
        let before = false;
        let after = false;

        for (let index = 0; index < count; ++index) {
          if (index === 0 || index === count - 1) {
            html += this.create_number(index + 1, true, index + 1 === number);
          } else if (index >= number - _integer && index <= number + _integer) {
            html += this.create_number(index + 1, true, index + 1 === number);
          } else {
            if (!before && index < number - _integer) {
              html += this.create_number('...', false);
              before = true;
            } else if (!after && index > number + _integer) {
              html += this.create_number('...', false);
              after = true;
            }
          }
        }

        // for (let index = 0; index < count; ++index) {
        //   //affichage du premier
        //   if (index === 0)
        //     html += this.create_number(index + 1, true, index + 1 === number);
        //   //affichage du dernier
        //   else if (index === count - 1)
        //     html += this.create_number(count, true, number === count);
        //   //si loin premier et loin dernier
        //   else if (index > _integer && index > count - _integer) {
        //     if (index < number - _integer / 2.0) {
        //       // || index > number + _integer / 2.0)
        //       if (!before) {
        //         html += this.create_number('...', false);
        //         before = true;
        //       }
        //     } else if (index > number + _integer / 2.0) {
        //       if (!after) {
        //         html += this.create_number('...', false);
        //         after = true;
        //       }
        //     } else
        //       html += this.create_number(index + 1, true, index + 1 === number);
        //   }
        //   //si proche premier
        //   else if (index < _integer) {
        //     if (index === _integer) {
        //       html += this.create_number('...', false);
        //       html += this.create_number(count);
        //       break;
        //     } else
        //       html += this.create_number(index + 1, true, index + 1 === number);
        //   }
        //   //si proche dernier
        //   else {
        //     if (index > count - _integer)
        //       html += this.create_number(index + 1, true, index + 1 === number);
        //     else {
        //       if (!before) {
        //         html += this.create_number('...', false);
        //         before = true;
        //       }
        //     }
        //   }
        // }
      } else {
        for (let index = 0; index < count; ++index) {
          //console.log("test", index+1 === number);
          html += this.create_number(index + 1, true, index + 1 === number);
        }
      }
      e.html(html);
      e.parent().data('current', number);

      if (doAction) eval(e.parent().data('page').replaceAll('¤page¤', number));

      return this;
    }

    /**
     * On affiche la page suivante
     * @param {DOMElement} e Element cliqué
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    pagination_next(e) {
      const count = $(e).parent().data('count');
      let current = $(e).parent().data('current');
      current = current === null || current === undefined ? 2 : current + 1;

      if (count + 1 != current)
        this.pagination_page($('.pagination-number-' + current)[0], current);

      return this;
    }

    /**
     * On affiche la page précédente
     * @param {DOMElement} e Element cliqué
     * @returns {Mel_Elastic} ChaÃ®nage
     */
    pagination_prev(e) {
      const current = $(e).parent().data('current');

      if (current !== undefined || current !== 1)
        this.pagination_page(
          $('.pagination-number-' + (current - 1))[0],
          current - 1,
        );

      return this;
    }

    initResponsive(key = null, changeReturn = false) {
      const each = ($tn, tn, t, d, ptl, namespace) => {
        const $tabName = $tn; //$(e).find('.rTabName');
        const tabName = tn; //$(e).data('tab-name');
        const tab = t; //$(e).data('selector-tab');
        const _default = d; //$(e).data('is-default-tab');
        const parentTabList = ptl; //$(e).data('parent-tabs');

        const item = {
          $tabName: $tabName.length === 0 ? tabName : $tabName,
          $tab: $(tab),
          default: _default,
          $parentTabList: $(parentTabList),
          isTabNameString() {
            return typeof this.$tabName === 'string';
          },
        };

        return this.initTabResponsive(namespace, item);
      };

      const tab_class = 'mel-responsive-tab';
      const tab_header_class = 'mel-responsive-tabheader';
      const tab_content = 'mel-responsive-tab-content';

      if (!key) {
        let namespace;
        switch (rcmail.env.task) {
          case 'bureau':
            namespace = 'namespace-reponsive-tab-desk';
            break;
          case 'news':
            namespace = 'namespace-reponsive-tab-news';
            break;

          default:
            break;
        }

        if ($(`.${namespace}`).length === 0) {
          $('.module_parent').each((i, e) => {
            e = $(e);
            each(e.find('h2').first(), '', e, i === 0, '#contents', namespace);
          });
          $('#contents')
            .find(`.${tab_class}.${tab_header_class}`)
            .last()
            .addClass('last');
        }
      } else {
        let namespace = null;

        switch (key) {
          case 'shortcut':
            namespace = 'namespace-reponsive-tab-' + key;
            break;

          default:
            break;
        }

        let $querry = $(`.${tab_content}${namespace ? `.${namespace}` : ''}`);

        if ($querry.length === 0) $querry = $(`.${tab_content}.no-namespace`);

        const size = $querry.length - 1;

        $(`.${tab_content}${namespace ? `.${namespace}` : ''}`).each((i, e) => {
          let $tab = each(
            $(e).find('.responsive-tab-name'),
            $(e).data('tab-name'),
            $(e).data('selector-tab'),
            $(e).data('is-default-tab'),
            $(e).data('parent-tabs'),
            namespace || $(e).parent().data('namespace') || 'no-namespace',
          );

          if (!!$tab && $tab.length > 0 && i === size) $tab.addClass('last');
        });
      }

      rcmail.addEventListener('skin-resize', (datas) => {
        const small = 'small';
        const phone = 'phone';
        //const header_to_hide = 'mel-header-to-hidden';
        const hide_button = 'responsive-hide-button';
        const tab_list = 'responsiveTabList';
        const selected_item_class = 'selected';
        // const tab_content = 'mel-responsive-tab-content';
        datas = datas.mode;

        if (datas === small) datas = phone;

        if (this.screen_type !== (datas || this.screen_type)) {
          if (
            this.screen_type !== phone &&
            this.screen_type !== small &&
            (datas === phone || datas === small)
          ) {
            //On passe en mode phone
            $(`.${tab_list}`)
              .css('display', '')
              .find(`.${selected_item_class}`)
              .click();

            if (rcmail.env.task === 'bureau') {
              $('#welcome-text')
                .find('.col-3')
                .css('display', 'none')
                .parent()
                .find('.col-6')
                .first()
                .removeClass('col-6')
                .addClass('col-12')
                .children()
                .css('font-size', '30px')
                .css('margin-top', 0);
            }
          } else {
            $(`.${tab_list}`)
              .css('display', 'none')
              .find(`.${hide_button}`)
              .click();

            if (rcmail.env.task === 'bureau') {
              $('#welcome-text')
                .find('.col-3')
                .css('display', '')
                .parent()
                .find('.col-12')
                .first()
                .removeClass('col-12')
                .addClass('col-6')
                .children()
                .css('font-size', '40px')
                .css('margin-top', '55px');
            }
          }

          this.screen_type = datas || this.screen_type;
        }
      });

      if (!changeReturn) return this;
      else {
        const screen_type = this.screen_type;
        const update_screen_type = (x) => {
          this.screen_type = x;
        };
        return {
          update() {
            const tab_list = 'responsiveTabList';
            const selected_item_class = 'selected';
            const last = screen_type;
            update_screen_type(null);
            rcmail.triggerEvent('skin-resize', { mode: last });

            if (last === 'small' || last === 'phone')
              $(`.${tab_list}`)
                .css('display', '')
                .find(`.${selected_item_class}`)
                .click();
          },
        };
      }
    }

    initTabResponsive(
      namespace,
      item = {
        isTabNameString: () => {
          return true;
        },
        $parentTabList: $(),
        $tabName: $(),
        $tab: $(),
        default: false,
      },
    ) {
      const header_to_hide = 'mel-header-to-hidden';
      const hide_button = 'responsive-hide-button';
      const tab_list = 'responsiveTabList';
      const selected_item_class = 'selected';
      const tab_class = 'mel-responsive-tab';
      const tab_header_class = 'mel-responsive-tabheader';
      const tab_content = 'mel-responsive-tab-content';

      let tabName = '';
      let $tab = null;

      //Gestion de l'onglet
      if (!item.isTabNameString() && item.$tab.find(item.$tabName).length > 0) {
        //Si est Ã  l'intérieur du corps
        tabName = item.$tabName[0].innerText;
        item.$tabName.addClass(header_to_hide);
      } else tabName = item.$tabName; //Si c'est juste le nom

      //Id généré depuis son nom
      const tab_id =
        'responsive-generated-' +
        tabName.replace(/[^0-9a-z]/gi, '').toLowerCase();

      let $tabList = item.$parentTabList.find(`.${tab_list}.${namespace}`);

      //Création de la liste d'onglet si elle n'éxiste pas
      if ($tabList.length === 0) {
        $tabList = item.$parentTabList
          .prepend(
            `<div class='row ${tab_list} ${namespace}' data-namespace="${namespace}" style="flex-wrap: nowrap;"></div>`,
          )
          .find(`.${tab_list}.${namespace}`);
      }

      //Ajout du bouton si il n'éxiste pas
      $tab = $tabList.find(`#${tab_id}`);
      if ($tab.length === 0) {
        $tab = $tabList
          .append(
            $(`
                    <button id="${tab_id}" class="${item.default ? selected_item_class : ''} ${tab_class} ${tab_header_class} ${namespace}">${tabName}</button>
                `).click(() => {
              $(`.${header_to_hide}`).css('display', 'none');
              $(`.${tab_content}.${namespace}`).css('display', 'none');
              $(
                `.${tab_class}.${tab_header_class}.${selected_item_class}.${namespace}`,
              ).removeClass(selected_item_class);
              item.$tab.css('display', '');
              $(`#${tab_id}`).addClass(selected_item_class);
            }),
          )
          .find(`#${tab_id}`);
      }

      //Création du bouton de "désaffichage"
      if ($tabList.find(`.${hide_button}`).length === 0) {
        $tabList.append(
          `<button class="${hide_button} ${namespace} hidden"></button>`,
        );
      }

      $tabList.find(`.${hide_button}.${namespace}`).click(() => {
        item.$tab.css('display', '');

        //if (!item.isTabNameString() && item.$tab.find(item.$tabName).length > 0) item.$tabName.css('display', '');
        $(`.${header_to_hide}`).css('display', '');
      });

      item.$tab.addClass(tab_content).addClass(namespace);

      return $tab;
    }

    get_current_theme() {
      return this.theme || 'default';
    }

    get_current_theme_picture() {
      return this.get_themes()[this.get_current_theme()];
    }

    update_theme(theme, post = true) {
      theme = theme || 'default';
      if (theme !== this.theme) {
        const newThemeDatas = this.themes[theme];
        const oldThemeDatas = this.themes[this.theme];
        let $html = $('html');

        if (this.theme !== 'default') {
          let current = oldThemeDatas;

          do {
            $html.removeClass(current.class);
            current = this.themes[current.parent];
          } while (current);
        }
        if (theme !== 'default') {
          let current = newThemeDatas;

          do {
            $html.addClass(current.class);
            current = this.themes[current.parent];
          } while (current);
        }

        this.theme = theme;

        //Désactiver les autres animations
        for (const key in this.themes) {
          if (Object.hasOwnProperty.call(this.themes, key)) {
            const element = this.themes[key];

            if (element.animation_class)
              $('body').removeClass(element.animation_class);
          }
        }

        if ($('#rcmfd-toggle-anims').length > 0) {
          //Afficher ou non un bouton pour activer les animations
          if (!this.themes[this.theme].animation_class) {
            $('#rcmfd-toggle-anims')
              .addClass('disabled')
              .attr('disabled', 'disabled')
              .parent()
              .parent()
              .css({ opacity: 0, position: 'absolute' });
          } else {
            $('#rcmfd-toggle-anims')
              .removeClass('disabled')
              .removeAttr('disabled')
              .parent()
              .parent()
              .css({ opacity: '', position: '' });
          }

          //Activer ou non les animations du thème
          let current = this.themes[this.theme];

          if (current.animation_class) {
            if (
              rcmail.env.animation_enabled ??
              current.animation_enabled_by_default
            ) {
              $('body').addClass(current.animation_class);
              $('#rcmfd-toggle-anims')[0].checked = false;
            } else $('#rcmfd-toggle-anims')[0].checked = true;
          }
        }
      }

      $('iframe.mm-frame').each((i, e) => {
        try {
          if (!$(e).hasClass('discussion-frame'))
            e.contentWindow.MEL_ELASTIC_UI.update_theme(theme, false);
        } catch (error) {}
      });

      if (rcmail.env.task === 'settings') {
        try {
          let $settings_frames = $('iframe');
          for (const iterator of $settings_frames) {
            iterator.contentWindow.MEL_ELASTIC_UI.update_theme(theme, false);
          }
        } catch (error) {}
      }

      if (post) {
        mel_metapage.Functions.post(
          mel_metapage.Functions.url('mel_metapage', 'plugin.update_theme'),
          { _t: theme },
          (f) => {},
        );
      }

      rcmail.triggerEvent('theme.changed', theme);

      return this;
    }

    get_themes() {
      return this.themes || [];
    }
  }

  try {
    /**
     * Contient les fonctions de la classe Mel_Elastic
     */
    window.MEL_ELASTIC_UI = new Mel_Elastic();
    window.mel_deploy_undeploy = (e, selector) => {
      e = $(e);
      if (e.css('display') !== 'none') {
        e.css('display', 'none');
        $(selector).css('display', '');
      } else {
        e.css('display', '');
        $(selector).css('display', 'none');
      }
    };
  } catch (error) {
    console.error('### [BNUM]MEL_ELASTIC_UI : ', error);
  }
});
