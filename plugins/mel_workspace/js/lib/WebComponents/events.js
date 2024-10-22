import { ABaseMelEvent } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/events.js';

/**
 * @callback EventSourceCallback
 * @param {external:moment} start
 * @param {external:moment} end
 * @param {string} timezone
 * @param {function} callback
 */

export class SourceEvent extends ABaseMelEvent {
  #events = [];
  constructor(args) {
    super('fc.loading.source', args.caller);

    this.sourceID = args.id;
    this.start = args.start;
    this.end = args.end;
    this.timezone = args.timezone;
  }

  addEvent(data) {
    return this.addEvents(data);
  }

  addEvents(...events) {
    return this.#events.push(...events);
  }

  get events() {
    return this.#events;
  }
}
//api:fc.render.event
//api:fc.render.resource
export class RenderEvent extends ABaseMelEvent {
  constructor(type, caller, obj, node) {
    super(`fc.render.${type}`, caller);
    this.itemData = obj;
    this.itemNode = node;
  }
}

export class ViewRender extends ABaseMelEvent {
  #view = null;
  #element = null;
  constructor(view, element, caller) {
    super('view.render', caller);

    this.#view = view;
    this.#element = element;
  }

  get view() {
    return this.#view;
  }

  get viewNode() {
    return this.#element;
  }

  get viewTitle() {
    return this.view.title;
  }

  get start() {
    return this.view.start;
  }

  get end() {
    return this.view.end;
  }

  static get EventType() {
    return 'api:view.render';
  }
}
