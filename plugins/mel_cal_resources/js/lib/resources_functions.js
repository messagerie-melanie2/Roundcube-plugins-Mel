import { FreeBusyLoader } from '../../../mel_metapage/js/lib/calendar/free_busy_loader.js';
import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { DATE_TIME_FORMAT } from '../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../../mel_metapage/js/lib/mel_promise.js';
import { ResourcesBase } from './resource_base.js';

export { ResourceBaseFunctions };

/**
 * @class
 * @classdesc Change le "this" du callback associé
 * @package
 * @template {F}
 */
class FunctionFrom {
  /**
   * Constructeur de la classe
   * @param {function} callback Fonction qui nous intéresse
   * @param {F} thisArgs Nouveau "this" de la fonction
   */
  constructor(callback, thisArgs) {
    this._callback = callback;
    this._this = thisArgs;
  }

  /**
   * Appèle la fonction
   * @param  {...any} args Arguments de la fonction
   * @returns {*}
   */
  call(...args) {
    return this._callback.call(this._this, ...args);
  }

  /**
   * Récupère la fonction avec le nouveau "this"
   * @param  {...any} args
   * @returns
   */
  get(...args) {
    return this._callback.bind(this._this, ...args);
  }
}

/**
 * @class
 * @classdesc Contient les fonctions pour les différents appèles de la classe {@link ResourcesBase}
 */
class ResourceBaseFunctions {
  /**
   * Constructeur de la classe.
   *
   * Demande un objet de type {@link ResourcesBase} qui sera le "this" des fonctions membres de l'instance.
   * @param {ResourcesBase} resourceBase
   * @override
   */
  constructor(resourceBase) {
    this.main(resourceBase);
  }

  /**
   * Change le "this" des fonctions de cette instance de classe.
   * @package
   * @param {ResourcesBase} resourceBase
   * @override
   */
  main(resourceBase) {
    this._resourceBase = resourceBase;

    //const mobj_functions = Object.getOwnPropertyNames(MelObject.prototype);

    for (const iterator of Object.getOwnPropertyNames(this.__proto__)) {
      //if (!mobj_functions.includes(iterator))
      this[iterator] = new FunctionFrom(
        this[iterator],
        this._resourceBase,
      ).get();
    }
  }

  /**
   * Action lorsque l'on clique sur le bouton étoile d'une ressource, ce qui permet de la mettre en favoris ou non.
   * @param {Event} e
   * @this {ResourcesBase}
   * @see {@link ResourceBaseFunctions.resource_render}
   */
  on_star_clicked(e) {
    BnumMessage.SetBusyLoading();

    const id = $(e.currentTarget).data('email');
    const favorite = !JSON.parse(
      $(e.currentTarget).attr('data-favorite') ?? 'false',
    );

    $(e.currentTarget)
      .attr('data-favorite', favorite)
      .addClass('disabled')
      .attr('disabled', 'disabled');

    this.http_internal_post({
      task: 'mel_cal_resources',
      action: 'set_favorite',
      params: {
        _favorite: favorite,
        _uid: id,
      },
      on_success: (data) => {
        if (!this.get_env('fav_resources'))
          this.rcmail().env.fav_resources = [];

        this.rcmail().env.fav_resources[id] = favorite;
        this._on_data_changed();
        return data;
      },
    }).always(BnumMessage.StopBusyLoading.bind(BnumMessage));
  }

  /**
   * Action lorsqu'une date est séléctionné au clique
   * @this ResourcesBase
   * @param {external:moment} start Date de début
   * @param {external:moment} end Date de fin
   * @see {@link ResourcesBase._generate_ui}
   */
  on_selected_date(start, end, jsEvent, view, resource) {
    this.start = start;
    this.end = end;

    $(`#radio-${resource.data.uid}`).click();

    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Action lorsqu'une ressource est séléctionné
   * @param {Event} e
   * @this {ResourcesBase}
   * @see {@link ResourceBaseFunctions.resource_render}
   */
  on_resource_selected(e) {
    e = $(e.currentTarget);

    const id = e.attr('id').replace('radio-', EMPTY_STRING);

    this.selected_resource = MelEnumerable.from(this._p_resources)
      .where((x) => x.data.uid === id)
      .firstOrDefault()?.data;

    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Action lorsqu'un label de ressource est cliqué
   * @param {Event} e
   * @this {ResourcesBase}
   * @see {@link ResourceBaseFunctions.resource_render}
   */
  on_resource_label_clicked(e) {
    for (let i = 0; i < this._p_resources.length; ++i) {
      this._p_resources[i].data.selected = false;
    }

    e = $(e.currentTarget);
    if (!e.attr('for'))
      e = $(`label[for="${e.attr('id').replace('radio', EMPTY_STRING)}"`);

    const id = e.data('id');
    const index = MelEnumerable.from(this._p_resources)
      .select((x, i) => ({ x, i }))
      .where((x) => x.x.id === id)
      .first().i;
    this._p_resources[index].data.selected = true;
  }

  /**
   * Action à faire lors du rendu de la ressource
   * @param {{data:import('./resource_base.js').ResourceData}} resourceObj
   * @param {external:jQuery} labelTds
   * @this {ResourcesBase}
   * @see {@link ResourcesBase._generate_ui}
   */
  resource_render(resourceObj, labelTds) {
    if (resourceObj.id !== 'resources') {
      labelTds
        .css('display', 'flex')
        .prepend(
          MelHtml.start
            .icon('', {
              id: `loader-${resourceObj.data.ui}`,
              class: 'clock-loader animate',
              style: 'align-self:center',
              'data-email': resourceObj.data.email,
            })
            .end()
            .generate(),
        )
        .prepend(
          $(
            `<input type="radio" class="resource-radio" data-email="${resourceObj.data.email}" id="radio-${resourceObj.data.uid}" value="${resourceObj.data.email}" name="resa" ${resourceObj.data.selected ? 'checked' : EMPTY_STRING} />`,
          )
            .click(this._functions.on_resource_selected)
            .css('display', 'none'),
        )
        .append(
          MelHtml.start
            .div({ class: 'star-button-parent' })
            .button({
              class: 'star-button',
              id: `button-${resourceObj.data.uid}`,
              onclick: this._functions.on_star_clicked,
              'data-favorite':
                this.get_env('fav_resources')[resourceObj.data.email] ?? false,
              'data-email': resourceObj.data.email,
            })
            .icon('star')
            .end()
            .end()
            .end()
            .generate(),
        );

      labelTds = labelTds.find('.fc-cell-text');
      let parent = labelTds.parent();
      let text = labelTds.text();
      labelTds.remove();
      parent
        .html(
          $(`<label for="radio-${resourceObj.data.uid}"></label>`)
            .data('id', resourceObj.data.uid)
            .text(text)
            .css('margin', '0 0 0 5px')
            .css('padding', 0)
            .click(this._functions.on_resource_label_clicked),
        )
        .css({
          height: '100%',
          display: 'flex',
          'align-items': 'center',
          padding: 0,
        });

      if (
        this._rcs &&
        MelEnumerable.from(this._rcs)
          .where((x) => x === resourceObj.data.email)
          .any()
      ) {
        $(`.clock-loader[data-email="${resourceObj.data.email}"]`).remove();
        $(`.resource-radio[data-email="${resourceObj.data.email}"]`).css(
          'display',
          EMPTY_STRING,
        );
      }
    }
  }

  /**
   * @this {ResourcesBase}
   * @param {*} start
   * @param {*} end
   * @param {*} timezone
   * @param {*} callback
   */
  event_loader(start, end, timezone, callback) {
    this._functions.event_loader_async(start, end, timezone, callback);
  }

  /**
   * @this {ResourcesBase}
   * @param {*} start
   * @param {*} end
   * @param {*} timezone
   * @param {*} callback
   */
  async event_loader_async(start, end, timezone, callback) {
    const cache_key = this._get_key_format(start, end);
    let return_data = [];
    if (this._cache[cache_key]) {
      return_data = MaBoy.Deserialize(this._cache[cache_key]);
      $('.clock-loader').remove();
      $('.resource-radio').css('display', EMPTY_STRING);
    } else if (this._p_resources && this._p_resources.length) {
      if (!this._first_loaded) await Mel_Promise.wait(() => this._first_loaded);

      let rcs = FreeBusyLoader.Instance.generate(
        this._p_resources.map((x) => x.data.email),
        {
          start,
          end,
          interval: FreeBusyLoader.Instance.interval,
        },
      );

      let emails = [];
      for await (const slots of rcs) {
        for (const slot of slots) {
          if (!slot.isFree) {
            return_data.push(new MaBoy(slot, slots.email));
          }
        }
        emails.push(slots.email);
      }

      this._rcs = this._rcs || [];

      this._rcs = MelEnumerable.from(this._p_resources)
        .select((x) => x.data.email)
        .aggregate(this._rcs)
        .distinct((x) => x)
        .toArray();

      this._cache[cache_key] = MaBoy.Serialise(return_data);

      // for (const email of emails) {
      //   $(`.clock-loader[data-email="${email}"]`).remove();
      //   $(`.resource-radio[data-email="${email}"]`).css(
      //     'display',
      //     EMPTY_STRING,
      //   );
      // }
    }

    if (this.selected_resource) {
      if (!this.start) await Mel_Promise.wait(() => !!this.start);
      return_data.push({
        title: 'Moi',
        start: this.start,
        end: this.end,
        allDay: this.all_day,
        resourceId: this.selected_resource?.email,
        color: 'green',
      });
    }

    $('.clock-loader').remove();
    $('.resource-radio').css('display', EMPTY_STRING);
    callback(return_data);
  }

  /**
   * @this {ResourcesBase}
   */
  on_date_changed($e, html_class) {
    const val = $e.val();
    $(html_class).each((i, e) => {
      $(e).val(val);
    });

    const start = `${$('.input-date-start').val()} ${$('.input-time-start').val()}`;
    const end = `${$('.input-date-end').val()} ${$('.input-time-end').val()}`;
    this.start = moment(start, DATE_TIME_FORMAT);
    this.end = moment(end, DATE_TIME_FORMAT);

    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * @this {ResourcesBase}
   */
  on_date_start_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-date-start');
  }
  on_date_end_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-date-end');
  }
  on_time_start_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-time-start');
  }
  on_time_end_changed(e) {
    this._functions.on_date_changed($(e.currentTarget), '.input-time-end');
  }
}

class MaBoy {
  constructor(slot, email) {
    this.title = 'Occupé';
    this.start = slot.start;
    this.end = slot.end;
    this.resourceId = email;
  }

  for_seralize() {
    return new MaBoy(
      {
        start: this.start.format(DATE_TIME_FORMAT),
        end: this.end.format(DATE_TIME_FORMAT),
      },
      this.resourceId,
    );
  }

  static _Deserialize(item) {
    item.start = moment(item.start, DATE_TIME_FORMAT);
    item.end = moment(item.end, DATE_TIME_FORMAT);
    return new MaBoy({ start: item.start, end: item.end }, item.resourceId);
  }

  static Deserialize(str) {
    const items = JSON.parse(str);

    return items.map((x) => MaBoy._Deserialize(x));
  }

  static Serialise(maboys) {
    return JSON.stringify(maboys.map((x) => x.for_seralize()));
  }
}
