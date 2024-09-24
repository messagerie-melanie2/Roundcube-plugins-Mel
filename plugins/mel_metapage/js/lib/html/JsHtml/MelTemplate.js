/**
 * @module MelTemplate
 * @local MelTemplate
 * @tutorial js-template
 */

export { MelTemplate };

/**
 * @class
 * @classdesc Permet de générer du html en javascript à partir d'un template.
 * @package
 * @tutorial js-template
 */
class MelTemplate {
  /**
   * 
   * @param {string} templateSelector Selecteur du template à traiter
   * @param {Object} data Liste de données à injecter dans le template sous la forme { key: value, key1: value1}
   * @param {array} events Tableau d'événements à injecter dans le template sous la forme [ { target: target, type: type, listener: listener }, { target: target1, type: type1, listener: listener1 } ] avec target = selecteur
   * @param {string} regex Regex à utiliser pour remplacer les données dans le template
   */
  constructor({ templateSelector = '', data = {}, events = [], regex = /%%(\w*)%%/g } = {}) {
    this.template = templateSelector;
    this.data = data;
    this.events = events;
    this.regex = regex;
  }

  /**
   * 
   * @param {string} targetSelector Selecteur de l'élément sur lequel ajouter l'event
   * @param {string} type Type d'événement à écouter
   * @param {*} listener Callback à appeler lors de l'événement
   * @returns 
   */
  addEvent(targetSelector, type, listener) {
    this.events.push({
      target: targetSelector,
      type: type,
      listener: listener
    });
    return this;
  }

  /**
   * 
   * @param {*} events Tableau d'événements à injecter dans le template sous la forme [ { target: target, type: type, listener: listener }, { target: target1, type: type1, listener: listener1 } ] avec target = selecteur
   * @returns 
   */
  setEvents(events) {
    this.events = events;
    return this;
  }

  /**
   * 
   * @param {string} key 
   * @param {*} value 
   * @returns 
   */
  addData(key, value) {
    this.data[key] = value;
    return this;
  }

  /**
   * 
   * @param {*} data Liste de données à injecter dans le template sous la forme { key: value, key1: value1}
   * @returns 
   */
  setData(data) {
    this.data = data;
    return this;
  }

  /**
   * 
   * @param {string} templateSelector 
   * @returns 
   */
  setTemplateSelector(templateSelector) {
    this.template = templateSelector;
    return this;
  }

  /**
   * 
   * @returns {NodeListOf<ChildNode>} Liste des éléments générés
   */
  render() {
    let template = document.querySelector(this.template).innerHTML;
    let html = template.replace(this.regex, (match, p1) => {
      return this.data[p1] || '';
    });

    let div = document.createElement('div');
    div.innerHTML = html;

    this.events.forEach(event => {
      div.querySelector(event.target).addEventListener(event.type, event.listener);
    });

    return div.querySelectorAll('*');
  }
}
