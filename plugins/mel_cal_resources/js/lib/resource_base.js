import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import {
  DialogPage,
  RcmailDialogButton,
} from '../../../mel_metapage/js/lib/classes/modal.js';
import {
  DATE_FORMAT,
  DATE_HOUR_FORMAT,
  DATE_TIME_FORMAT,
} from '../../../mel_metapage/js/lib/constants/constants.dates.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { template_resource } from '../../skins/mel_elastic/js_template/resource.js';
import { FavoriteLoader } from './favorite_loader.js';
import { FilterBase, eInputType } from './filter_base.js';
import { ResourceBaseFunctions } from './resources_functions.js';

export { ResourcesBase, ResourceSettings };

/**
 * Contient les classes qui permet de gérer et afficher les ressources
 * @module Resources
 * @property {module:Resources/Filters} Filters
 * @property {module:Resources/Favorites/Loaders} FavoriteLoader
 * @property {module:Resources/Location} Location
 * @property {module:Resources/ResourceBaseFunctions/Functions} Functions
 * @local ResourceData
 * @local ResourcesBase
 * @local ResourceObject
 */

/**
 * @typedef ResourceData
 * @property {string} bal
 * @property {string} batiment
 * @property {?number} capacite
 * @property {?string} caracteristiques
 * @property {?string} description
 * @property {string} dn
 * @property {string} email
 * @property {string[]} email_list
 * @property {string} etage
 * @property {string} fullname
 * @property {string} locality
 * @property {string} name
 * @property {string} postal_code
 * @property {string} room_number
 * @property {?string} service
 * @property {string} street
 * @property {?string} title
 * @property {string} type
 * @property {string} uid
 */

/**
 * @typedef ResourceObject
 * @property {ResourceData} data
 */

/**
 * @class
 * @classdesc Représente une ressource et gère l'affichage et la sélection dans le calendrier.
 * Cette classe permet de filtrer, d'afficher et de manipuler les ressources (salles, équipements, etc.)
 * dans une interface de type calendrier. Elle gère également la logique de sélection, de filtrage dynamique,
 * et d'interaction utilisateur.
 * @extends MelObject
 */
class ResourcesBase extends MelObject {
  #_startRender;
  /**
   * Constructeur de la classe
   * @param {string} name Id de la ressource
   * @param {FilterConfig[]} filters Liste des filtres de la ressource. Ils seront convertit en {@link FilterBase}
   */
  constructor(name, filters, { startRender = true } = {}) {
    super(name, filters);
    this.#_startRender = startRender;
  }

  /**
   * Vérifie si la date sélectionnée est valide.
   * Retourne true si les champs de date et heure sont valides, false sinon.
   * @type {boolean}
   * @readonly
   */
  get isDateValid() {
    return !this._has_invalid();
  }

  /**
   * Fonction principale d'initialisation et de configuration.
   * Initialise les variables et configure les filtres.
   * @override
   * @private
   * @param  {...any} args Arguments d'initialisation (nom, filtres, etc.)
   */
  main(...args) {
    this._init()._setup(...args);
  }

  /**
   * Initialise les variables internes de la classe.
   * Prépare les listes de ressources, filtres, événements et autres paramètres.
   * @private
   * @returns {ResourcesBase} Chaînage de l'objet courant
   */
  _init() {
    /**
     * @protected
     * @type {Array<FilterBase>}
     * @description Contient la liste des filtres qui est possible d'appliquer
     * @frommodule Resources/Filters {@linkto FilterBase}
     */
    this._p_filters = [];
    /**
     * @protected
     * @type {Array<ResourceObject>}
     * @description Ressources à afficher dans le tableau
     * @frommodule Resources {@linkto ResourceObject}
     * */
    this._p_resources = [];

    /**
     * Liste des évènements afficher dans l'agenda
     * @type {import('./resources_functions.js')._ResourceEvent}
     * @frommodule Resources/ResourceBaseFunctions/Functions
     * @protected
     */
    this._p_events = [];
    /**
     * @package
     * @type {Array<ResourceObject>}
     * @description Ressources à afficher dans le tableau. Ce sont les ressources de départ.
     * @frommodule Resources {@linkto ResourceObject}
     */
    this._init_resources = [];
    /**
     * Date de départ
     * @protected
     * @type {?string}
     */
    this._p_startDate = null;
    /**
     * Date de fin
     * @protected
     * @type {?string}
     */
    this._p_endDate = null;
    /**
     * Heure de départ
     * @protected
     * @type {?string}
     */
    this._p_startTime = null;
    /**
     * Heure de fin
     * @protected
     * @type {?string}
     */
    this._p_endTime = null;
    /**
     * Données en cache
     * @protected
     * @type {Object<string, *>}
     */
    this._p_internal_data = {};

    /**
     * Calendrier
     * @type {external:jQuery}
     */
    this._$calendar = null;

    /**
     * Données en cache
     * @private
     * @type {Object<string , *>}
     */
    this._cache = {};

    /**
     * @type {ResourceBaseFunctions}
     */
    this._functions = new ResourceBaseFunctions(this);

    /**
     * Date et heure de départ de la location
     * @type {?external:moment}
     */
    this.start = null;
    /**
     * Date et heure de fin de la location
     * @type {?external:moment}
     */
    this.end = null;

    /**
     * Journée entière ou non
     * @type {boolean}
     */
    this.all_day = false;

    /**
     * Ressource sélectionnées
     * @type {ResourceData}
     */
    this.selected_resource = null;

    /**
     * Action à faire lors du clique du bouton "Sauvegarder"
     * @type {BnumEvent<Function>}
     */
    this.event_on_save = new BnumEvent();

    /**
     * Id du mode d'évènement associé
     * @type {number}
     */
    this.location_id = null;
    return this;
  }

  /**
   * Assigne les variables
   * @private
   * @param  {...any} args
   */
  _setup(...args) {
    const [name, filters] = args;

    this._name = name;
    this._p_filters = filters.map((x) =>
      new FilterBase(x.name, x.size, {
        load_data_on_change: x.load_data_on_change,
        load_data_on_start: x.load_data,
        input_type: x.type,
        icon: x.icon,
        number: x.number,
        rowname: x?.rowname,
      })
        .push_event(this._on_data_loaded.bind(this))
        .push_event_data_changed(this._on_data_changed.bind(this)),
    );

    let _allday;

    Object.defineProperties(this, {
      start: {
        get: () => {
          if (this.all_day) return moment(this._p_startDate, DATE_FORMAT);
          else
            return this._p_startDate && this._p_startTime
              ? moment(
                  `${this._p_startDate} ${this._p_startTime}`,
                  DATE_TIME_FORMAT,
                )
              : null;
        },
        set: (value) => {
          this._p_startDate = value.format(DATE_FORMAT);
          this._p_startTime = value.format(DATE_HOUR_FORMAT);

          $('.input-date-start').val(this._p_startDate);
          $('.input-time-start').val(this._p_startTime);
        },
      },
      end: {
        get: () => {
          if (this.all_day) return moment(this._p_endDate, DATE_FORMAT);
          else
            return this._p_endDate && this._p_endTime
              ? moment(
                  `${this._p_endDate} ${this._p_endTime}`,
                  DATE_TIME_FORMAT,
                )
              : null;
        },
        set: (value) => {
          this._p_endDate = value.format(DATE_FORMAT);
          this._p_endTime = value.format(DATE_HOUR_FORMAT);

          $('.input-date-end').val(this._p_endDate);
          $('.input-time-end').val(this._p_endTime);
        },
      },
      all_day: {
        get: () => $('#rc-allday')?.prop?.('checked') ?? _allday,
        set: (value) => {
          if ($('#rc-allday').length) $('#rc-allday').prop('checked', value);
          else _allday = value;

          if (this._$calendar) this._$calendar.fullCalendar('refetchEvents');
        },
      },
    });
  }

  /**
   * Renvoie une heure au format HH:mm
   * @param {number} hour
   * @returns {string} format HH:mm
   * @private
   */
  #_set_buisness_hour(hour) {
    if (hour < 10) hour = `0${hour}`;

    return `${hour}:00`;
  }

  /**
   * Génère l'agenda avec fullcalendar
   * @package
   * @param {external:jQuery} $fc Div qui contient le fullcalendar
   * @returns {external:jQuery} Div qui contient le fullcalendar
   */
  _generate_ui($fc) {
    if (this._p_resources.length) {
      this._init_resources = [...this._p_resources];
      this._p_resources.length = 0;
    }

    const settings = window.cal?.settings || top.cal.settings;
    const config = {
      resources: this._fetch_resources.bind(this),
      resourceRender: this._functions.resource_render,
      defaultView: 'timelineDay',
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
      height: () => this._$calendar.height(),
      firstHour: settings.first_hour,
      minTime: this.#_set_buisness_hour(settings.work_start),
      maxTime: this.#_set_buisness_hour(settings.work_end),
      scrollTime: { hours: settings.first_hour },
      slotDuration: { minutes: 60 },
      locale: 'fr',
      axisFormat: DATE_HOUR_FORMAT,
      slotLabelFormat: DATE_HOUR_FORMAT,
      selectable: true,
      selectHelper: true,
      slotWidth: 50,
      defaultDate: this.start,
      select: this._functions.on_selected_date,
      eventSources: [
        {
          events: this._functions.event_loader,
          id: 'resources',
        },
      ],
    };
    try {
      $fc.css('width', '100%').fullCalendar(config);

      if (this.#_startRender) $fc.fullCalendar('render');
    } catch (error) {
      console.error(error);
    }

    return $fc;
  }

  /**
   * Récupère les ressources à afficher dans le calendrier.
   * Charge les favoris et les ressources initiales, puis met à jour les filtres dynamiquement.
   * @package
   * @param {function} callback Fonction de rappel pour transmettre les ressources
   */
  _fetch_resources(callback, iterator = 0) {
    FavoriteLoader.Load(this._name).then((values) => {
      this.try_add_resources(values);

      if (this._init_resources.length) {
        this.try_add_resources(
          this._init_resources.map((x) => (x.data ? x.data : x)),
        );
        this._init_resources.length = 0;
      }

      const data = this._format_resources(this._p_resources, this._p_filters);

      const selectUpdatedResult = this.#_update_selects_options(data, iterator);
      if (selectUpdatedResult)
        return this._fetch_resources(callback, selectUpdatedResult);

      if (!this._first_loaded) this._first_loaded = true;

      if (data.length) callback(data);
      else
        callback([
          {
            id: 'resources',
            title: this.gettext('no-resources', 'mel_cal_resources'),
          },
        ]);
    });
  }

  /**
   * Met à jour dynamiquement les options des listes déroulantes des filtres
   * en fonction des ressources filtrées et du filtre modifié.
   * Permet d'assurer la cohérence des choix proposés à l'utilisateur.
   * @private
   * @param {Array<Object>} data Ressources filtrées
   * @param {number} iterator Compteur d'itérations pour éviter les boucles infinies
   * @returns {(number|false)} Nouvel indice d'itération ou false si aucune mise à jour
   */
  #_update_selects_options(data, iterator) {
    if (this._filterUpdated) {
      const name = this._filterUpdated.name;

      let isNext = false;
      for (const currentSelect of document.querySelectorAll(
        `[data-resourcetype="${this._name}"] select[data-fname]`,
      )) {
        if (currentSelect.dataset.fname === name) isNext = true;
        else if (isNext) {
          const filterName = currentSelect.dataset.fname;
          const filterTrueName =
            currentSelect.dataset.filterid || filterName.toLowerCase();
          let needUpdated = false;

          // Réinitialisation des options
          for (const option of currentSelect.querySelectorAll('option')) {
            if (
              currentSelect.hasAttribute('multiple') &&
              this.#_reinit_multi_select(option)
            )
              needUpdated = true;
            else this.#_reinit_base_select(option);
          }

          if (
            (currentSelect.value !== EMPTY_STRING &&
              currentSelect.value !== '/') ||
            needUpdated
          ) {
            if (!needUpdated) currentSelect.value = '/';
            else $(currentSelect).val([]).multiselect('refresh');

            // On retourne l'itérateur pour éviter les boucles infinies et pour indiqué qu'il faut recharcger les données.
            if (++iterator < 50) return iterator;
            else
              currentSelect.dispatchEvent(
                new Event('change', { bubbles: true }),
              );
          }

          // On affiche les options qui correspondent aux données
          for (const rs of data) {
            if (
              rs.data[filterTrueName] &&
              rs.data[filterTrueName] !== EMPTY_STRING
            ) {
              if (
                typeof rs.data[filterTrueName] === 'string' &&
                rs.data[filterTrueName].includes('"')
              ) {
                const parsed = JSON.parse(rs.data[filterTrueName]);

                for (const key of Object.keys(parsed)) {
                  const option = currentSelect.querySelector(
                    `option[value="${key}"]`,
                  );

                  if (option) {
                    option.removeAttribute('disabled');
                    $(option.parentElement).multiselect('refresh');
                  }
                }
              } else {
                const option = currentSelect.querySelector(
                  `option[value="${rs.data[filterTrueName].replaceAll('"', '&quot;')}"]`,
                );

                if (option) option.style.display = 'block';
              }
            }
          }
        }
      }

      this._filterUpdated = null;
    }

    return false;
  }

  #_reinit_base_select(option) {
    if (option.value !== '/' && option.value !== EMPTY_STRING)
      option.style.display = 'none';

    return false;
  }

  #_reinit_multi_select(option) {
    let needUpdated = false;
    option.setAttribute('disabled', 'disabled');
    if (option.selected) {
      option.selected = false;
      needUpdated = true;
    }

    return needUpdated;
  }

  /**
   * Formatte les ressources selon les filtres actifs.
   * Retourne uniquement les ressources correspondant aux filtres.
   * @param {ResourceObject[]} resources Liste des ressources
   * @param {FilterBase[]} filters Liste des filtres
   * @returns {ResourceObject[]} Liste filtrée des ressources
   * @frommoduleparam Resources/Filters filters {@linkto FilterBase}
   * @frommodulereturn Resources {@linkto ResourceObject}
   */
  _format_resources(resources, filters) {
    return MelEnumerable.from(resources)
      .where((x) => !MelEnumerable.from(filters).any((f) => !f.filter(x)))
      .orderBy((x) =>
        this.get_env('fav_resources')?.[x.data.type.toUpperCase()]?.[
          x.data.email
        ]
          ? 0
          : 1,
      )
      .toArray();
  }

  /**
   * Met à jour la validité des champs de date et heure.
   * Ajoute ou retire la classe d'invalidité selon la validité des inputs.
   * @private
   */
  _set_validity() {
    if (!$('.input-time-end')[0].checkValidity())
      $('.input-time-end').addClass('is-invalid');
    else $('.input-time-end').removeClass('is-invalid');

    if (!$('.input-time-start')[0].checkValidity())
      $('.input-time-start').addClass('is-invalid');
    else $('.input-time-start').removeClass('is-invalid');

    if (this._has_invalid()) {
      $('.ui-dialog .save-btn')
        .addClass('disabled')
        .attr('disabled', 'disabled');
    } else {
      $('.ui-dialog .save-btn').removeClass('disabled').removeAttr('disabled');
    }
  }

  /**
   * Vérifie si les champs de temps sont valides.
   * @returns {boolean} True si invalide, false sinon
   */
  _has_invalid() {
    return (
      !this.all_day &&
      (!$('.input-time-end')[0].checkValidity() ||
        !$('.input-time-start')[0].checkValidity())
    );
  }

  /**
   * Fonction de récupération de la page de dialogue.
   * Initialise le calendrier et la validité des champs.
   * @package
   * @param {Function} old Ancienne fonction get bind
   * @returns {external:jQuery} Élément jQuery de la page
   */
  _get(old) {
    let $rtn = old();

    let $fc = $rtn.find('[fullcalendar="true"]');

    if ($fc.length) this._$calendar = this._generate_ui($fc);

    this.refresh_calendar_date();

    this.wait_something(
      () =>
        $('.input-time-end').length > 0 && $('.ui-dialog .save-btn').length > 0,
    ).then(() => {
      this._set_validity();
      $('#rc-allday').on('click', () => {
        this._set_validity();
      });
    });

    return $rtn;
  }

  /**
   * Action appelée lors du chargement des données d'un filtre.
   * Met à jour les options des filtres et les ressources affichées.
   * @package
   * @param {ResourceData[]} rcs Liste des ressources chargées
   * @param {FilterBase} filter Filtre concerné
   * @frommoduleparam Resources/Filters filter
   */
  _on_data_loaded(rcs, filter) {
    let values;
    let resources;
    for (let index = 0, len = this._p_filters.length; index < len; ++index) {
      if (this._p_filters[index].filterId !== filter.filterId) {
        //Réinitialise le filtre
        this._p_filters[index].$filter
          .html(
            $('<option value="/"></option>')
              .text(
                rcmail.gettext(
                  this._p_filters[index].filterId,
                  'mel_cal_resources',
                ),
              )
              .css('display', 'none'),
          )
          .append($('<option value=""></option>').text(EMPTY_STRING));

        if (this._p_filters[index]._input_type === eInputType.multi_select)
          this._p_filters[index].$filter.html(EMPTY_STRING);

        values = {};
        resources = rcs;

        if (this._p_filters[index]._input_type !== eInputType.multi_select) {
          resources = MelEnumerable.from(rcs);
          if (this._p_filters[index].has_only_number_values()) {
            resources = resources.orderBy(
              (x) => +x[this._p_filters[index].filterId],
            );
          } else
            resources = resources.orderBy(
              (x) => x[this._p_filters[index].filterId],
            );
        }

        for (const iterator of resources) {
          //Si la données éxiste et qu'elle n'a pas déjà été traitée
          if (
            !values[iterator[this._p_filters[index].filterId]] &&
            iterator[this._p_filters[index].filterId]
          ) {
            //En multiselect, ce sont les clés des valeurs possible qui servent de filtre
            if (this._p_filters[index].inputType === eInputType.multi_select) {
              for (const current_filter of Object.keys(
                JSON.parse(iterator[this._p_filters[index].filterId]),
              )) {
                if (!values[current_filter]) {
                  values[current_filter] = true;
                }
              }
            } else {
              values[iterator[this._p_filters[index].filterId]] = true;
              this._p_filters[index]._$filter.append(
                $(
                  `<option value="${iterator[this._p_filters[index].filterId]}">${iterator[this._p_filters[index].filterId]}</option>`,
                ),
              );
            }
          }
        }

        if (this._p_filters[index].$filter.children().length > 1)
          this._p_filters[index].$filter
            .removeAttr('disabled')
            .removeClass('disabled');
        else
          this._p_filters[index].$filter
            .attr('disabled', 'disabled')
            .removeClass('disabled');
      }

      if (this._p_filters[index].inputType === eInputType.multi_select) {
        if (Object.keys(values).length) {
          for (const current_filter of MelEnumerable.from(
            Object.keys(values),
          ).orderBy((x) => x)) {
            this._p_filters[index].$filter.append(
              $(`<option value="${current_filter}">${current_filter}</option>`),
            );
          }

          this._p_filters[index].$filter.multiselect('enable');
        } else this._p_filters[index].$filter.multiselect('disable');

        this._p_filters[index].$filter.multiselect('rebuild');
      }
    }

    this._p_resources.length = 0;
    for (const iterator of rcs) {
      this.try_add_resource(iterator, false);
    }

    this._$calendar.fullCalendar('refetchResources');
    this._$calendar.fullCalendar('refetchEvents');

    this.#_autoSelectFloor(this.filterId);
  }

  /**
   * Sélectionne automatiquement l'étage dans le filtre correspondant
   * en fonction du numéro de salle de l'utilisateur et d'une expression régulière
   * définie dans l'environnement. Si une correspondance est trouvée, le filtre "Etage"
   * est mis à jour et déclenche un événement de changement.
   *
   * @private
   * @param {?string} resource Nom de la ressource (optionnel)
   * @returns {ResourcesBase} Chaînage de l'objet courant
   */
  #_autoSelectFloor(resource = null) {
    /**
     * @type {string}
     */
    const roomnumber = this.get_env('user_roomnumber');

    if (roomnumber) {
      const regex_base =
        this.get_env('floor_regex')?.[this.get_env('user_postalcode')];

      if (regex_base) {
        const floorResult = roomnumber.match(new RegExp(regex_base));

        if (floorResult && floorResult.length > 0) {
          const floor = floorResult[0];

          let selected = document.querySelector(
            `${resource ? `[data-resourcetype="${resource}"] ` : EMPTY_STRING}select[data-fname="Etage"] option[value="${floor}"]`,
          );

          if (selected) {
            selected.parentElement.value = floor;
            selected.parentElement.dispatchEvent(new Event('change'));
          }
        }
      }
    }

    return this;
  }

  /**
   * Action à effectuer lors d'un changement de filtre.
   * Met à jour les ressources et les événements du calendrier.
   * @package
   */
  _on_data_changed(_, filter) {
    this._filterUpdated = filter;
    this._$calendar.fullCalendar('refetchResources');
    this._$calendar.fullCalendar('refetchEvents');
  }

  /**
   * Met à jour la validité des inputs.
   * @returns {void}
   */
  set_validity() {
    return this._set_validity();
  }

  /**
   * Crée une page de dialogue pour la ressource.
   * Ajoute les boutons de sauvegarde et d'annulation, et prépare l'affichage.
   * @returns {Promise<DialogPage>} Page de dialogue générée
   * @frommodulereturn Modal {@linkto DialogPage}
   * @async
   */
  async create_page() {
    const button_save = RcmailDialogButton.ButtonSave({
      click: this.event_on_save,
    });

    button_save.classes += ' save-btn';

    const button_cancel = RcmailDialogButton.ButtonCancel({
      click: () => {
        let $parent = this._$calendar;

        while ($parent && !$parent.hasClass('ui-dialog'))
          $parent = $parent.parent();

        if ($parent) {
          $parent.find('.ui-dialog-titlebar-close').click();
        } else $('.ui-dialog-titlebar-close').click();
      },
    });

    let page = new DialogPage(this._name, {
      title: this._name,
      buttons: [button_cancel, button_save],
    });

    page = await this._p_get_page(page);
    this._last_get = page.get.bind(page);
    page.get = this._get.bind(this, this._last_get);

    return page;
  }

  async _p_get_page(page) {
    return template_resource.get_page(
      page,
      (
        await Promise.allSettled(
          this._p_filters.map((x) => x.generate(this._p_filters)),
        )
      ).map((x) => x.value),
      this,
    );
  }

  /**
   * Ajoute une ressource à la liste si elle n'existe pas déjà.
   * Met à jour le calendrier si nécessaire.
   * @param {ResourceData} rc Ressource à ajouter
   * @param {boolean} [refetch=true] Si vrai, met à jour le calendrier
   * @returns {ResourcesBase} Chaînage
   */
  try_add_resource(rc, refetch = true) {
    if (!this._p_resources.filter((x) => x.data.email === rc.email).length) {
      rc.selected = rc.email === this.selected_resource?.email;
      this._p_resources.push({
        id: rc.email,
        title: rc.name,
        parentid: 'resources',
        data: rc,
      });

      if (refetch) {
        this._$calendar.fullCalendar('refetchResources');
        this._$calendar.fullCalendar('refetchEvents');
      }
    }

    return this;
  }

  /**
   * Ajoute plusieurs ressources à la liste.
   * @param {ResourceData[]} rcs Liste des ressources à ajouter
   * @returns {ResourcesBase} Chaînage
   */
  try_add_resources(rcs) {
    for (const iterator of rcs) {
      this.try_add_resource(iterator, false);
    }

    return this;
  }

  /**
   * Met à jour le texte de la date affichée dans le calendrier.
   * @returns {string} Texte de la date affichée
   */
  refresh_calendar_date() {
    let $div = this._$calendar.parent();
    const text = $div.find('.fc-left h2').text();
    $div.find('.fo-date').text(text);
    return text;
  }

  /**
   * Dessine le calendrier
   */
  render() {
    this._$calendar.fullCalendar('rerender');
  }

  /**
   * Force le redimensionnement et le réaffichage du calendrier.
   */
  rerender() {
    $(window).trigger('resize');
  }
}

/**
 * @class
 * @classdesc Représentation d'un paramètre de ressource (filtre avancé).
 * Permet de manipuler et de vérifier la correspondance des paramètres de ressource.
 */
class ResourceSettings {
  /**
   * Constructeur de la classe.
   * Initialise le paramètre à partir d'une chaîne ou d'un objet.
   * @param {string} setting Valeur du filtre
   */
  constructor(setting) {
    /**
     * @private
     * @type {string}
     * @description Valeur du paramètre
     */
    this._setting = typeof setting === 'string' ? JSON.parse(setting) : setting;
  }

  /**
   * Convertit le paramètre en chaîne lisible.
   * @returns {string} Représentation textuelle du paramètre
   */
  toString() {
    return ResourceSettings.ToString(this._setting);
  }

  /**
   * Vérifie si la ressource correspond au filtre paramétré.
   * @param {ResourceObject} ressource Ressource à vérifier
   * @returns {boolean} True si correspond, false sinon
   */
  is(ressource) {
    if (!this._setting?.length) return true;
    else if (!ressource.data.caracteristiques) return false;
    else {
      return MelEnumerable.from(this._setting)
        .select((x) =>
          // eslint-disable-next-line quotes
          ressource.data.caracteristiques.includes(x.replaceAll("'", '"')),
        )
        .all((x) => x);
    }
  }

  /**
   * Convertit le paramètre en chaîne lisible (statique).
   * @static
   * @param {string} setting Paramètre à convertir
   * @returns {string} Représentation textuelle du paramètre
   */
  static ToString(setting) {
    if (typeof setting === 'string') setting = JSON.parse(setting);

    let str = [];
    for (const key in setting) {
      if (Object.hasOwnProperty.call(setting, key)) {
        const element = setting[key];

        str.push(`${key} x${element}`);
      }
    }

    return str.join(' + ');
  }
}
