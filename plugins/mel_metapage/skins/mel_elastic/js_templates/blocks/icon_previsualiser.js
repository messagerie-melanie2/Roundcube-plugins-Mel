import { MelEnumerable } from '../../../../js/lib/classes/enum.js';
import { MelHtml } from '../../../../js/lib/html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../../js/lib/mel_events.js';
import { MelListingPrevisualiser } from './previsualiser.js';
export { MelIconPrevisualiser };

/**
 * @module MelIconPrevisualiser
 * @local OnCreateCallback
 * @local ButtonCallback
 * @local HtmlCallback
 * @local AfterCallback
 * @local MelIconPrevisualiser
 */

/**
 * @callback OnCreateCallback
 * @param {MelIconPrevisualiser} popup
 * @return {____JsHtml}
 * @frommodulereturn {JsHtml}
 */

/**
 * @callback ButtonCallback
 * @param {string} icon
 * @param {MelIconPrevisualiser} popup
 * @return {void}
 */

/**
 * @callback HtmlCallback
 * @param {____JsHtml} html
 * @param {MelIconPrevisualiser} popup
 * @return {____JsHtml}
 * @frommodulereturn {JsHtml}
 */

/**
 * @callback AfterCallback
 * @param {MelIconPrevisualiser} popup
 * @return {____JsHtml[]}
 * @frommodulereturn {JsHtml} {@linkto ____JsHtml}
 */

/**
 * @classdesc Fourni une popup qui permet de prévisualiser et de changer l'icône d'un élément.
 * @class
 * @extends MelListingPrevisualiser
 * @tutorial icon-previsualiser-tutorial
 */
class MelIconPrevisualiser extends MelListingPrevisualiser {
  /**
   * Constrcuteur de la classe
   * @param {Object} param0 Activer ou non les actions par défauts
   * @param {boolean} param0.add_defaults_actions Activer ou non les actions par défauts
   * @param {boolean} param0.add_default_action_default_buttons Activer ou non les actions par défauts sur les boutons par défauts
   * @param {boolean} param0.generate_defaults_icons Générer ou non les boutons par défauts
   */
  constructor({
    add_defaults_actions = true,
    add_default_action_default_buttons = false,
    generate_defaults_icons = true,
  }) {
    super(
      'bnum-folder-icon',
      {
        previsu_id: 'bnum-folder-main-icon',
        list_container_id: 'bnum-folder-icons-container',
      },
      add_defaults_actions,
      generate_defaults_icons,
      add_default_action_default_buttons,
    );
  }

  /**
   * Méthode principale
   * @param  {...any} args
   */
  main(...args) {
    super.main(...args);

    /**
     * Event qui sera appelé avant la génération du html, génère les éléments qui représente l'icône par "défaut" si il y en a une.
     *
     * Le callback envoyé devra avoir la structure : (popup:MelPrevisualiser) => JsHtml
     * @type {BnumEvent<OnCreateCallback>}
     * @frommodule MelIconPrevisualiser {@linkto OnCreateCallback}
     */
    this.on_create_default_items = new BnumEvent();
    /**
     * Event qui sera appelé au click d'un bouton
     *
     * Le callback envoyé devra avoir la structure : (icon:string, popup:MelPrevisualiser) => null
     * @type {BnumEvent<ButtonCallback>}
     * @frommodule MelIconPrevisualiser {@linkto ButtonCallback}
     */
    this.on_button_click = new BnumEvent();
    /**
     * Event qui sera appelé lorsque la souris passe sur un bouton
     *
     * Le callback envoyé devra avoir la structure : (icon:string, popup:MelPrevisualiser) => null
     * @type {BnumEvent<ButtonCallback>}
     * @frommodule MelIconPrevisualiser {@linkto ButtonCallback}
     */
    this.on_button_hover = new BnumEvent();
    /**
     * Event qui sera appelé lorsque la souris quitte sur un bouton
     *
     * Le callback envoyé devra avoir la structure : (icon:string, popup:MelPrevisualiser) => null
     * @type {BnumEvent<ButtonCallback>}
     * @frommodule MelIconPrevisualiser {@linkto ButtonCallback}
     */
    this.on_button_leave = new BnumEvent();
    /**
     * Event qui sera appelé lors de la génération des boutons, séléctionne le bouton par défaut.
     *
     * Le callback envoyé devra avoir la structure : (html:JsHtml, popup:MelPrevisualiser) => JsHtml
     * @type {BnumEvent<HtmlCallback>}
     * @frommodule MelIconPrevisualiser {@linkto HtmlCallback}
     */
    this.on_create_set_selected = new BnumEvent();
    /**
     * Event qui sera appelé lors de la génération, affiche le bouton sléctionné dans la prévisu.
     *
     * Le callback envoyé devra avoir la structure : (html:JsHtml, popup:MelPrevisualiser) => JsHtml
     * @type {BnumEvent<HtmlCallback>}
     * @frommodule MelIconPrevisualiser {@linkto HtmlCallback}
     */
    this.on_create_show_selected = new BnumEvent();
    /**
     * Event qui sera appelé lors de la génération de la liste, ajoute des éléments à la fin de la liste, après les boutons par défaut
     *
     * Le callback envoyé devra avoir la structure : (popup:MelPrevisualiser) => Array<JsHtml>
     * @type {BnumEvent<AfterCallback>}
     * @frommodule MelIconPrevisualiser {@linkto AfterCallback}
     */
    this.on_after_create_items = new BnumEvent();

    const add_defaults_actions = args[3];
    const generate_defaults_icons = args[4];
    const add_default_action_default_buttons = args[5];

    /**
     * Activer ou non les actions par défauts
     * @readonly
     * @type {boolean}
     */
    this.add_defaults_actions = null;
    /**
     * Générer les icônes par défaut
     * @readonly
     * @type {boolean}
     */
    this.generate_defaults_icons = null;
    /**
     * Activer ou non les actions par défauts de certains boutons
     * @readonly
     * @type {boolean}
     */
    this.add_default_action_default_buttons = null;
    Object.defineProperties(this, {
      add_defaults_actions: {
        get() {
          return add_defaults_actions;
        },
        configurable: false,
        enumerable: false,
      },
      generate_defaults_icons: {
        get() {
          return generate_defaults_icons;
        },
        configurable: false,
        enumerable: false,
      },
      add_default_action_default_buttons: {
        get() {
          return add_default_action_default_buttons;
        },
        configurable: false,
        enumerable: false,
      },
    });

    /**
     * Icônes custom
     * @type {Array<string>}
     */
    this.custom_icons = [];
  }

  /**
   * Récupère les éléments qui seront affichés dans la popup
   * @returns {Array<____JsHtml>}
   * @override
   * @frommodulereturn {JsHtml} {@linkto ____JsHtml}
   */
  get_elements() {
    const others = super.get_elements();

    let elements = MelEnumerable.from(this._generate_defaults())
      .aggregate(others)
      .aggregate(this._generate_items());

    if (this.on_after_create_items.haveEvents()) {
      let called = this.on_after_create_items.call(this);
      called = Object.values(called);
      called = MelEnumerable.from(called)
        .flat()
        .select((x) => this._attach_default_events(x));

      elements = elements.aggregate(called);
    }

    return elements;
  }

  /**
   * Génère les éléments par défaut
   * @private
   * @returns {Array<____JsHtml>}
   * @frommodulereturn {JsHtml} {@linkto ____JsHtml}
   */
  _generate_defaults() {
    let elements = [];
    const defaults = this.on_create_default_items.call(this);

    if (Array.isArray(defaults)) {
      for (const iterator of defaults) {
        if (Array.isArray(iterator)) {
          for (const item of iterator) {
            elements.push(this._attach_default_events_to_default_button(item));
          }
        } else
          elements.push(
            this._attach_default_events_to_default_button(iterator),
          );
      }
    } else
      elements.push(this._attach_default_events_to_default_button(defaults));

    return elements;
  }

  /**
   * Attache les actions aux évènements par défauts.
   * @param {____JsHtml} element
   * @private
   * @returns {____JsHtml}
   * @frommodulereturn {JsHtml}
   * @frommoduleparam JsHtml element
   */
  _attach_default_events(element) {
    if (this.add_defaults_actions) {
      if (element.childs[0] === 'button') {
        element.childs[0] = element.childs[0]
          .attr('onmouseenter', this._on_default_hover.bind(this))
          .attr('onmouseleave', this._on_default_leave.bind(this))
          .attr('onclick', this._on_default_click.bind(this));
      }
    }

    return element;
  }

  /**
   * Attache les évènements par défaut aux boutons par défaut
   * @param {____JsHtml} element
   * @private
   * @returns {____JsHtml}
   * @frommodulereturn {JsHtml}
   * @frommoduleparam JsHtml element
   */
  _attach_default_events_to_default_button(element) {
    if (this.add_default_action_default_buttons) {
      element = this._attach_default_events(element);
    }

    return element;
  }

  /**
   * Génère les éléments de la popup
   * @returns {____JsHtml}
   * @private
   * @frommodulereturn {JsHtml}
   */
  _generate_items() {
    var html;
    let elements = [];

    let toIterate = MelEnumerable.empty();

    if (this.generate_defaults_icons)
      toIterate = toIterate.aggregate(MelIconPrevisualiser.ICONS);
    if (this.custom_icons.length > 0)
      toIterate = toIterate.aggregate(this.custom_icons);

    for (const iterator of toIterate) {
      html = MelHtml.start.button({ class: `icon-button-${iterator}` });

      if (this.add_defaults_actions) {
        html = html
          .attr('onmouseenter', this._on_default_hover.bind(this))
          .attr('onmouseleave', this._on_default_leave.bind(this))
          .attr('onclick', this._on_default_click.bind(this));
      }

      if (this.on_create_set_selected.haveEvents())
        html = this.on_create_set_selected.call(html, iterator, this);

      html = html
        .attr(
          'onmouseenter',
          this.on_button_hover.call.bind(this.on_button_hover, iterator, this),
        )
        .attr(
          'onmouseleave',
          this.on_button_leave.call.bind(this.on_button_leave, iterator, this),
        )
        .attr(
          'onclick',
          this.on_button_click.call.bind(this.on_button_click, iterator, this),
        )
        .css({
          'border-radius': '5px',
          'margin-right': '5px',
          'margin-bottom': '5px',
        })
        .icon(iterator)
        .end()
        .end();

      elements.push(html);
    }

    return elements;
  }

  /**
   * Action par défaut du survol d'un bouton
   * @param {Event} e Evènement lancer par le survol
   * @package
   */
  _on_default_hover(e) {
    let $previsu = this._save_default_icon();
    e = $(e.currentTarget);

    $previsu.html(MelHtml.start.icon(e.children().first().text()).generate());
    $previsu = null;
  }

  /**
   * Action par défaut lorsque l'on clique au survol
   * @package
   */
  _on_default_leave() {
    let $previsu = this.get_previsu();

    if ($previsu.data('starticon') || false) {
      $previsu.html(MelHtml.start.icon($previsu.data('starticon')).generate());
    } else $previsu.html('');

    $previsu.data('starticon', '');
  }

  /**
   * Action par défaut du click d'un bouton
   * @param {Event} e Evènement lancer par le click
   * @package
   */
  _on_default_click(e) {
    this._on_default_hover(e);
    e = $(e.currentTarget);
    this.unselect_item($(`#${this.list_container_id} .selected-item`));
    this.select_item(e);
    this.get_previsu().data('starticon', e.children().first().text());
  }

  /**
   * Sauvegarde l'icône par défaut
   * @returns {external:jQuery}
   * @package
   */
  _save_default_icon() {
    let $previsu = this.get_previsu();

    if (!($previsu.data('starticon') || false))
      $previsu.data('starticon', $previsu.text());

    return $previsu;
  }

  /**
   * Récupère la prévisualisation
   * @returns {external:jQuery}
   */
  get_previsu() {
    return $(`#${this.previsu_id}`);
  }

  /**
   * Sélectionne une élément
   * @param {external:jQuery} $item Elément à sélectionner
   * @returns {external:jQuery}
   */
  select_item($item) {
    return $item.addClass('selected-item');
  }

  /**
   * Déselectionne un élément
   * @param {external:jQuery} $item Elément à désélectionner
   * @returns {external:jQuery}
   */
  unselect_item($item) {
    return $item.removeClass('selected-item');
  }

  /**
   * Affiche la prévisualisation
   * @protected
   * @param {____JsHtml} html Html à modifier
   * @return {____JsHtml}
   * @override
   * @frommodulereturn {JsHtml}
   * @frommoduleparam JsHtml element
   */
  _p_show_defaut_previsu(html) {
    html = super._p_show_defaut_previsu(html);
    const icon = this.on_create_show_selected.call(html, this);

    return html.icon(icon).end();
  }

  /**
   * Récupère l'icône séléctionnée
   * @return {string}
   */
  get_selected_icon() {
    return this.get_previsu().children().first().text();
  }

  /**
   * Ajoute une icone à la liste des icônes personnalisées
   * @param {string} icon_name Icone google material
   * @returns {MelIconPrevisualiser} Chaînage
   */
  addCustomIcon(icon_name) {
    this.custom_icons.push(icon_name);
    return this;
  }

  /**
   * Ajoute des icones à la liste des icônes personnalisées
   * @param {Array<string>} icons Icones google material
   * @returns {MelIconPrevisualiser} Chaînage
   */
  addCustomIcons(icons) {
    this.custom_icons = [...this.custom_icons, ...icons];
    return this;
  }

  /**
   * Ajoute un élément à la liste des éléments qui seront affichés dans la popup
   * @param {____JsHtml} js_html
   * @returns {MelIconPrevisualiser} Chaînage
   * @override
   * @frommoduleparam JsHtml element
   */
  addElement(js_html) {
    return super.addElement(this._attach_default_events(js_html));
  }
}

/**
 * Liste des icônes par défaut
 * @static
 * @type {string[]}
 */
MelIconPrevisualiser.ICONS = [
  'home',
  'settings',
  'favorite',
  'bolt',
  'key',
  '123',
  'saved_search',
  'deployed_code',
  'person',
  'group',
  'groups',
  'public',
  'thumb_down',
  'cookie',
  'flood',
  'calendar_month',
  'lock',
  'bookmark',
  'priority_high',
  'label',
  'mail',
  'alternate_email',
  'package',
  'local_post_office',
  'attach_email',
  'markunread_mailbox',
];

window.MelIconPrevisualiser = MelIconPrevisualiser;

/* EXEMPLE : */
const start_exemple = false;
if (start_exemple) {
  let previsualiser = new MelIconPrevisualiser({
    add_default_action_default_buttons: false,
    add_defaults_actions: true,
    generate_defaults_icons: true,
  });

  previsualiser.addCustomIcon('chevron_down');

  previsualiser.on_button_click.add((icon, popup) => {
    rcmail.triggerEvent('bnum_folder_icon_change', { icon, popup });
  });

  previsualiser.on_save.push((popup, dialog) => {
    rcmail.triggerEvent('bnum_folder_icon_save', { popup, dialog });
  });

  previsualiser.create_popup('Ma popup');
}
