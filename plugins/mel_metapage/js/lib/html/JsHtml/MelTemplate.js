/**
 * @module MelTemplate
 * @local MelTemplate
 * @tutorial js-template
 */

export { MelTemplate };

/**
 * @class
 * @classdesc Permet de générer du html en javascript à partir d'un template.
 * @tutorial js-template
 */
class MelTemplate {

  /**
   * @typedef TemplateEvent
   * @property {string} target Selecteur de l'élément sur lequel ajouter l'event
   * @property {string} type Type d'événement à écouter
   * @property {function} listener Callback à appeler lors de l'événement
   */

  /**
   * Selecteur du template à traiter
   * 
   * @type {string}
   * @package
   */
  #template;

  /**
   * Liste de données à injecter dans le template sous la forme { key: value, key1: value1}
   * 
   * @type {Object}
   * @package
   */
  #data;

  /**
   * Tableau d'événements à injecter dans le template sous la forme [ { target: target, type: type, listener: listener }, { target: target1, type: type1, listener: listener1 } ] avec target = selecteur
   * 
   * @type {TemplateEvent[]}
   * @package
   */
  #events;

  /**
   * Liste de html à injecter dans le template sous la forme { selector: html, selector1: html1}
   * 
   * @type {Object}
   * @package
   */ 
  #htmlContents;

  /**
   * Regex à utiliser pour remplacer les données dans le template
   * 
   * @type {RegExp}
   * @package
   */
  #regex;
  
  /**
   * @param {Object}  [destructured={}]
   * @param {string}  [destructured.templateSelector=''] Selecteur du template à traiter
   * @param {Object}  [destructured.data={}] Liste de données à injecter dans le template sous la forme { key: value, key1: value1}
   * @param {TemplateEvent[]}   [destructured.events=[]] Tableau d'événements à injecter dans le template sous la forme [ { target: target, type: type, listener: listener }, { target: target1, type: type1, listener: listener1 } ] avec target = selecteur
   * @param {Object}  [destructured.htmlContents={}] Liste de html à injecter dans le template sous la forme { selector: html, selector1: html1}
   * @param {RegExp}  [destructured.regex=/%%(\w*)%%/g] Regex à utiliser pour remplacer les données dans le template
   * @frommoduleparam {MelTemplate} events {@linkto TemplateEvent}
   */
  constructor({ templateSelector = '', data = {}, events = [], htmlContents = {}, regex = /%%(\w*)%%/g } = {}) {
    this.#template = templateSelector;
    this.#data = data;
    this.#events = events;
    this.#htmlContents = htmlContents;
    this.#regex = regex;
  }

  /**
   * Ajoute un événement dans le template
   * 
   * @param {string} targetSelector Selecteur de l'élément sur lequel ajouter l'event
   * @param {string} type Type d'événement à écouter
   * @param {function} listener Callback à appeler lors de l'événement
   * @returns {MelTemplate}
   */
  addEvent(targetSelector, type, listener) {
    if (listener)
      this.#events.push({
        target: targetSelector,
        type: type,
        listener: listener
      });
    return this;
  }

  /**
   * Défini une liste d'événements dans le template
   * 
   * @param {TemplateEvent[]} events Tableau d'événements à injecter dans le template sous la forme [ { target: target, type: type, listener: listener }, { target: target1, type: type1, listener: listener1 } ] avec target = selecteur
   * @returns {MelTemplate}
   * @frommoduleparam {MelTemplate} events {@linkto TemplateEvent}
   */
  setEvents(events) {
    this.#events = events;
    return this;
  }

  /**
   * Ajoute une nouvelle donnée à remplacer
   * 
   * @param {string} key 
   * @param {string} value 
   * @returns {MelTemplate}
   */
  addData(key, value) {
    this.#data[key] = value;
    return this;
  }

  /**
   * Défini une liste de données à remplacer
   * 
   * @param {Object} data Liste de données à injecter dans le template sous la forme { key: value, key1: value1}
   * @returns {MelTemplate}
   */
  setData(data) {
    this.#data = data;
    return this;
  }

  /**
   * Défini le selecteur du template à traiter
   * 
   * @param {string} templateSelector 
   * @returns {MelTemplate}
   */
  setTemplateSelector(templateSelector) {
    this.#template = templateSelector;
    return this;
  }

  /**
   * Ajoute du html dans un élément du template
   * 
   * @param {string} selector Selecteur de l'élément dans lequel ajouter le html
   * @param {*} html Html à ajouter au format String, Node, NodeList, Object ou Array
   * @returns {MelTemplate}
   */
  addHtml(selector, html) {
    if (html && html !== null)
      this.#htmlContents[selector] = html;
    return this;
  }

  /**
   * Génération d'un Node à partir du template et des données
   * 
   * @package
   * @returns {HTMLElement} Element généré pour le template, encapsulé dans un div
   */
  #process() {
    let template = document.querySelector(this.#template).innerHTML;
    let html = template.replace(this.#regex, (match, p1) => {
      return this.#data[p1] || '';
    });

    let div = document.createElement('div');
    div.innerHTML = html;

    for (const selector in this.#htmlContents) {
      if (typeof this.#htmlContents[selector] === 'string' || this.#htmlContents[selector] instanceof String) {
        div.querySelector(selector)?.insertAdjacentHTML('beforeend', this.#htmlContents[selector]);
      }
      else if (typeof this.#htmlContents[selector][Symbol.iterator] === 'function') {
        div.querySelector(selector)?.append(...this.#htmlContents[selector]);
      }
      else {
        div.querySelector(selector)?.append(this.#htmlContents[selector]);
      }
    }

    this.#events.forEach(event => {
      div.querySelector(event.target)?.addEventListener(event.type, event.listener);
    });

    return div;
  }

  /**
   * Retourne le résultat du template traité au format NodeList
   * 
   * @returns {NodeListOf<ChildNode>} Liste des éléments générés
   */
  render() {
    return this.#process().childNodes;
  }

  /**
   * Retourne le résultat du template traité au format HTML
   * 
   * @returns {string} Résultat du template traité au format HTML
   */
  renderHtml() {
    return this.#process().innerHTML;
  }
}
