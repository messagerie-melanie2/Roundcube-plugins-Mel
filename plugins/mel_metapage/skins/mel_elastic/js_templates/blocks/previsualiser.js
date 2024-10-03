import { MelHtml } from "../../../../js/lib/html/JsHtml/MelHtml.js";
import { BnumEvent } from "../../../../js/lib/mel_events.js";
import { MelObject } from "../../../../js/lib/mel_object.js";

/**
 * Class qui permet de gérer le lancement d'une popup servant à prévisualiser des choses.
 */
export class MelPrevisualiser extends MelObject {
  /**
   * 
   * @param {string} id Id de la popup 
   * @param {Object} param1 Contient les ids optionneles des autres éléments qui composent la popup.
   * @param {string} param1.previsu_id Id de l'élément qui contiendra la prévisualisation.
   * @param  {...any} args Pour l'héritage
   */
  constructor (id, { previsu_id = 'bnum-previsu' }, ...args) {
    super(id, previsu_id, ...args);
  }

  /**
   * @private
   * @param  {...any} args Envoyé par le constructeur
   */
  main(...args) {
    super.main(...args);

    const [id, previsu_id] = args;
    /**
     * Id de la popup
     * @type {string} 
     */
    this.id = '';
    /**
     * Id de l'élément qui contiendra la prévisualisation.
     * @type {string} 
     */
    this.previsu_id = '';
    Object.defineProperties(this, {
      id: {
        get() {
          return id;
        },
        configurable: false,
        enumerable: false,
      },
      previsu_id: {
        get() {
          return previsu_id;
        },
        configurable: false,
        enumerable: false,
      }
    });

    /**
     * Event qui sera appelé avant la génération du html, après la séparation mais avant la fin de la div, dans la fonction "generate"
     * 
     * Le callback envoyé devra avoir la structure : (html:JsHtml, popup:MelPrevisualiser) => JsHtml
     * @type {BnumEvent}
     */
    this.on_generate = new BnumEvent();
    /**
     * Event qui sera appelé après avoir générer le html, dans la fonction "generate"
     * 
     * Le callback envoyé devra avoir la structure : (html:JsHtml, popup:MelPrevisualiser) => JsHtml
     * @type {BnumEvent}
     */
    this.on_after_html = new BnumEvent();
    /**
     * Event qui sera appeler après avoir générer le html en Jquery dans la fonction "create_popup"
     * 
     * Le callback envoyé devra avoir la structure : ($generated:$, popup:MelPrevisualiser) => $
     * @type {BnumEvent}
     */
    this.on_after_generate_jquery = new BnumEvent();

    /**
     * Event qui sera appeler à la fermeture de la popup
     * 
     * Le callback envoyé devra avoir la structure : (popup:MelPrevisualiser, dialog:$) => null
     * 
     * La popup sera détruite
     * @type {BnumEvent}
     */
    this.on_close = new BnumEvent();
    /**
     * Event qui sera appeler lors du click sur le bouton "annuler"
     * 
     * Le callback envoyé devra avoir la structure : (popup:MelPrevisualiser, dialog:$) => null
     * 
     * La popup sera détruite
     * @type {BnumEvent}
     */
    this.on_cancel = new BnumEvent();

    /**
     * Event qui sera appeler lors du click sur le bouton "sauvegarder"
     * 
     * Le callback envoyé devra avoir la structure : (popup:MelPrevisualiser, dialog:$) => null
     * 
     * La popup NE sera PAS détruite
     * @type {BnumEvent}
     */
    this.on_save = new BnumEvent();
  }

  generate() {
    let html = MelHtml.start
      .div({ id: this.id })
      .centered_flex_container({ id: 'bnum-previsu-main-container' })
      .span({ id: this.previsu_id, class: 'square-item px25' });

    html = this._p_show_defaut_previsu(html).end('span')
      .end()
      .separate().css({ 'margin-top': '10px', 'margin-bottom': '10px' });

    if (this.on_generate.haveEvents()) html = this.on_generate.call(html, this).end();
    else html = html.end();

    if (this.on_after_html.haveEvents()) html = this.on_after_html.call(html, this);

    return html;
  }

  /**
   * Créer une dialog
   * @param {string} title Titre de la popup
   */
  create_popup(title) {
    const self = this;
    const generated_js_html = this.generate();
    let $jquery_generated_from_js_html = generated_js_html.generate();

    if (this.on_after_generate_jquery.haveEvents()) $jquery_generated_from_js_html = this.on_after_generate_jquery.call($jquery_generated_from_js_html, this);

    this.rcmail().show_popup_dialog($jquery_generated_from_js_html, title, [{
      text: 'Annuler',
      class: 'mel-button no-margin-button no-button-margin',
      click() {
        self.on_cancel.call(self, this);
        $(this).dialog('destroy');
      }
    }, {
      text: 'Sauvegarder',
      class: 'mel-button no-margin-button no-button-margin',
      click() {
        self.on_save.call(self, this);
      }
    }], {
      close() {
        self.on_close.call(self, this);
        $(this).dialog('destroy');
      }
    });
  }

  _p_show_defaut_previsu(html) {
    return html;
  }
}

/**
 * Class qui permet de gérer le lancement d'une popup servant à prévisualiser un élément parmis une liste d'éléments 
 */
export class MelListingPrevisualiser extends MelPrevisualiser {
  /**
   * Constrcuteur de la classe
   * @param {string} id Id de la modal
   * @param {Object} param1 Contient les ids optionneles des autres éléments qui composent la popup.
   * @param {string} param1.previsu_id Id de l'élément qui contiendra la prévisualisation.
   * @param {string} param1.list_container_id Id de l'élément qui contiendra la liste des éléments.  
   * @param  {...any} args Pour l'héritage
   */
  constructor (id, { previsu_id = 'bnum-previsu', list_container_id = 'bnum-previsu-list-container' }, ...args) {
    super(id, { previsu_id }, list_container_id, ...args);
  }

  main(...args) {
    super.main(...args);

    const list_container_id = args[2];
    this.list_container_id = '';
    Object.defineProperties(this, {
      list_container_id: {
        get() {
          return list_container_id;
        },
        configurable: false,
        enumerable: false,
      },
    });

    this.elements = [];

    this.on_generate.push(this._generate_listing_elements.bind(this));
  }

  _generate_listing_elements(html) {
    html = html.ul({ id: this.list_container_id, class: 'folderlist ignore-bullet' }).css({ 'flex-wrap': 'wrap', 'justify-content': 'center', 'display': 'flex' });

    let already_have_li;
    for (const element of this.get_elements()) {
      already_have_li = (element.childs.length >= 1 && 'li' === element.childs[0].balise);
      if (!already_have_li) html = html.li();

      for (const iterator of element.childs) {
        html.childs.push(iterator);
      }

      if (!already_have_li) html = html.end();
    }

    return html.end();
  }

  /**
   * Récupère les éléments qui seront affichés dans la popup
   * @returns {Array<JsHtml>}
   */
  get_elements() {
    return this.elements;
  }

  /**
   * Ajoute un élément à la liste des éléments qui seront affichés dans la popup
   * @param {JsHtml} js_html 
   * @returns Chaînage
   */
  addElement(js_html) {
    this.elements.push(js_html);
    return this;
  }
}