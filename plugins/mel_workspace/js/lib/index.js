import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { isNullOrUndefined } from '../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../../mel_metapage/js/lib/mel_promise.js';
import { connectors } from './connectors.js';

export { IndexWorkspace };

/**
 * Contient les classes, énumérations et constantes utile pour l'affichage et le fonctionnement de la page d'index des espaces de travail.
 * @module Workspace/Index
 * @local EVisuMode
 * @local EMode
 * @local IndexWorkspace
 */

//#region enums
/**
 * Liste des modes de visualisations
 * @enum {string}
 * @package
 */
const EVisuMode = {
  /**
   * Les espaces seront représenter sous forme de cards
   * @type {string}
   * @constant
   * @default 'cards'
   */
  cards: 'cards',
  /**
   * Les espaces seront représenter sous forme de liste
   * @type {string}
   * @constant
   * @default 'list'
   */
  list: 'list',
};

/**
 * Liste des différents type de d'onglets
 * @enum {string}
 * @package
 */
const EMode = {
  /**
   * Onglet qui contient les espaces de l'utilisateur
   * @type {string}
   * @constant
   * @default 'subscribed'
   */
  subscribed: 'subscribed',
  /**
   * Onglet qui contient les espaces archivés de l'utilisateur
   * @type {string}
   * @constant
   * @default 'archived'
   */
  archived: 'archived',
  /**
   * Onglet qui contient les espaces publics
   * @type {string}
   * @constant
   * @default 'publics'
   */
  publics: 'publics',
};
//#endregion
//#region constants
/**
 * Texte de l'onglet "Mes espaces"
 * @type {string}
 * @constant
 * @package
 */
const subscribed = MelObject.Empty().gettext(EMode.subscribed, 'mel_workspace');
/**
 * Texte de l'onglet "Publics"
 * @type {string}
 * @constant
 * @package
 */
const archived = MelObject.Empty().gettext(EMode.archived, 'mel_workspace');
/**
 * Texte de l'onglet "Archivés"
 * @type {string}
 * @constant
 * @package
 */
const publics = MelObject.Empty().gettext(EMode.publics, 'mel_workspace');
/**
 * Si le système d'overflow est actif ou non pour les paneaux
 * @default true
 * @type {boolean}
 * @constant
 * @package
 */
const OVERFLOW_ENABLED = true;
/**
 * Valeur du display de la div qui contient le panel
 * @default 'var(--workspace-panel-overflow-system-display, block)'
 * @type {string}
 * @constant
 * @package
 */
const OVERFLOW_CSS_DISPLAY =
  'var(--workspace-panel-overflow-system-display, block)';
/**
 * Valeur de la prop' overflow de la div qui contient le panel
 * @default 'var(--workspace-panel-overflow-system, auto)'
 * @type {string}
 * @constant
 * @package
 */
const OVERFLOW_CSS_PROP = 'var(--workspace-panel-overflow-system, auto)';
//#endregion

/**
 * @class
 * @classdesc Actions de l'index de la tâche "workspace"
 * @extends MelObject
 */
class IndexWorkspace extends MelObject {
  /**
   * Constructeur de la classe.
   * Doit être appeler par le php.
   */
  constructor() {
    super();
    this.#_main();
  }

  //#region init and setup
  /**
   * Button de passage en mode "cards"
   * @private
   * @returns {external:jQuery}
   */
  get #$btnBlock() {
    return $('#mode-block');
  }

  /**
   * Bouton de passage en mode "liste"
   * @private
   * @returns {external:jQuery}
   */
  get #$btnList() {
    return $('#mode-list');
  }

  /**
   * Input de recherche
   * @private
   * @returns {external:jQuery}
   */
  get #$inputSearch() {
    return $('#wsp-search-input');
  }

  /**
   * Bouton qui réinitialise la recherche
   * @private
   * @returns {external:jQuery}
   */
  get #$btnResetSearch() {
    return $('.reset-search');
  }

  /**
   * Bouton de création d'un espace
   * @private
   * @returns {external:jQuery}
   */
  get #$btnCreate() {
    return $('.create-wsp-button');
  }

  /**
   * Fonction qui contient les instructions principales
   * @private
   */
  #_main() {
    this._init_buttons_data();

    this._set_listeners();
    this._set_blocks_listeners();

    //Gestion de l'overflow
    if (OVERFLOW_ENABLED) {
      $('.workspace-list')
        .parent()
        .css('display', OVERFLOW_CSS_DISPLAY)
        .css('overflow', OVERFLOW_CSS_PROP);

      $(window).resize(this._on_resize.bind(this));

      this._on_resize();
    }
  }

  /**
   * Assigne les listeners
   * @package
   */
  _set_listeners() {
    this.#$btnBlock.on(
      'api:pressed',
      this._event_button_pressed.bind(this, EVisuMode.cards),
    );
    this.#$btnList.on(
      'api:pressed',
      this._event_button_pressed.bind(this, EVisuMode.list),
    );

    this.#$inputSearch.on('change', this._search.bind(this));
    this.#$btnResetSearch.click(this._event_search_reset.bind(this));
    this.#$btnCreate.click(() => {
      top.m_mp_Create();
      top.m_mp_createworkspace();
    });
  }

  /**
   * Initialise les boutons
   * @returns {Promise<void>}
   * @package
   * @async
   */
  async _init_buttons_data() {
    await Mel_Promise.wait(
      () => this.#$btnBlock.parent().find('[aria-pressed="true"]').length > 0,
    );

    this.#$btnBlock.parent().find('[aria-pressed="true"]').attr('tabindex', -1);

    if (this.get_env('visu-mode') === EVisuMode.list) {
      this.#$btnList.click();
    }
  }

  /**
   * Assigne le listener lié au changement de favoris aux bnum-workspace-block-item
   * @package
   */
  _set_blocks_listeners() {
    $('bnum-workspace-block-item').on('api:favorite', () => {
      this._reorder();
      this._set_blocks_listeners();

      if (FramesManager.Instance.has_frame('bureau')) {
        FramesManager.Instance.get_frame('bureau', {
          jquery: false,
        }).contentWindow.location.reload();
      }
    });
  }

  /**
   * Met la bonne taille aux div qui contiennent les espaces.
   * @package
   */
  _container_resize() {
    const constant = 50;

    let tab = null;
    for (tab of $('bnum-tabs')) {
      tab = $(tab);
      const tabs = tab.find('[role="tablist"]').height(); //$('bnum-tabs [role="tablist"]').height();
      const baseHeaderPannel = tab.find('.header-pannel').height(); //$('bnum-tabs .header-pannel').height();
      const headerPannel = isNaN(baseHeaderPannel) ? 0 : baseHeaderPannel + 15;
      const total = tab.height();

      const result = total - tabs - headerPannel - constant;

      if (this._container === true)
        tab.find('.workspace-list').css('height', `${result}px`);
      else
        tab
          .find('.workspace-list')
          .css('height', EMPTY_STRING)
          .parent()
          .css('height', `${result}px`);
    }
    tab = null;
  }
  //#endregion
  //#region base private functions
  /**
   * Réordonne les cards.<br/>
   *
   * /!\Uniquement pour les espaces de l'utilisateur.
   * @package
   */
  _reorder() {
    const data = MelEnumerable.from(
      $(
        `[data-pannel-namespace="${EMode.subscribed}"] bnum-workspace-block-item`,
      ),
    ).select((x) => {
      return {
        html: x
          .getInitHtml()
          .replace(
            'data-favorite',
            `data-favorite="${x.isFavorite()}" data-old-favorite`,
          ),
        isFavorite: x.isFavorite(),
        date: x.edited(),
        title: x.title(),
      };
    });

    let $dest = $(
      `[data-pannel-namespace="${EMode.subscribed}"] .workspace-list`,
    );

    const html = MelEnumerable.from(data)
      .orderByDescending((x) => (x.isFavorite ? Infinity : x.date.valueOf()))
      .then((x) => x.title)
      .select((x) => x.html)
      .join(EMPTY_STRING);

    $dest.html(html);

    $dest = null;
  }
  //#endregion
  //#region search functions
  /**
   * Recherche dans les espaces de l'utilisateur
   * @param {TabsElement} mainTabs Element principal
   * @param {string} searchValue Valeur de la recherche
   * @package
   */
  _mine_search(mainTabs, searchValue) {
    //Récuparéation des blocks
    let arr = MelEnumerable.from(
      mainTabs.currentPannel().find('bnum-workspace-block-item'),
    )
      .aggregate(
        mainTabs.currentPannel('archived').find('bnum-workspace-block-item'),
      )
      .where((x) =>
        x.title().toUpperCase().includes(searchValue.toUpperCase()),
      );

    /**
     * Div de destination qui contient les clones des espaces
     * @package
     * @type {external:jQuery}
     */
    let $dest = $('#search-pannel')[0].currentPannel();
    for (const element of arr) {
      element.getClone().appendTo($dest);
    }

    //Suppression des indésirables
    $dest.find('bnum-icon').each((i, e) => {
      e = $(e);

      if (e.text().includes('keep')) e.remove();
    });

    //Libération de la mémoire
    arr = null;
    $dest = null;
  }

  /**
   * Désactive la recherche et le bouton de réinitialisement de la recherche
   * @package
   */
  _search_busy() {
    this._p_$disable(this.#$inputSearch);
    this._p_$disable(this.#$btnResetSearch);
  }

  /**
   * Active la recherche et le bouton de réinitialisement de la recherche
   * @package
   */
  _search_not_busy() {
    this._p_$enable(this.#$inputSearch);
    this._p_$enable(this.#$btnResetSearch);
  }

  /**
   * Recherche dans les espaces publiques
   * @param {string} searchValue Valeur de la recherche
   * @async
   * @return {Promise<void>}
   * @package
   */
  async _public_search(searchValue) {
    /**
     * Gestion du redimentionnement
     * @type {boolean}
     * @package
     */
    this._container = true;

    /**
     * Div de destination des résultats
     * @package
     * @type {external:jQuery}
     */
    let $dest = $('#search-pannel')[0].currentPannel();

    //Ajout d'un loading
    $dest.html(this.generate_loader('generatedsearchwsp', true).generate());

    //On récupère les données ainsi que le nombre de page max
    const promiseArr = await Promise.allSettled([
      this._public_search_data(searchValue),
      this._get_count_max(searchValue),
    ]);
    const [result, count] = promiseArr.map((x) => x.value);

    //Ajout des résultats
    $dest.html(result);

    //Gestion du scroll
    let scroll = $('#search-pannel bnum-infinite-scroll-container')[0];
    scroll.onscrolledtoend.push(async (e) => {
      this._search_busy();
      const data = await this._public_search_data(
        searchValue,
        e.post_data._page,
      );
      $(e.caller).append($(data));
      this._search_not_busy();
    });
    scroll.setPageCountMax(count);

    //Libération de la mémoire
    $dest = null;
    scroll = null;
  }

  /**
   * Récupère le nombre de page max pour le scroll container
   * @param {string} searchValue Valeur de la recherche
   * @returns {Promise<number>}
   * @async
   * @package
   */
  async _get_count_max(searchValue) {
    const connector = connectors.publics_search_count;

    let params = connector.needed;
    params._search = searchValue;

    return (
      await BnumConnector.force_connect(connector, {
        params,
        default_return: 0,
      })
    ).datas;
  }

  /**
   * Récupère les données, par page, d'un résultat de recherche.
   * @param {string} searchValue Valeur de la recherche
   * @param {number} [page=1] Page que l'on souhaite charger
   * @returns {Promise<string>} html
   * @throws {Error} Si l'appèle au serveur crash
   * @package
   */
  async _public_search_data(searchValue, page = 1) {
    const connector = connectors.publics_search;

    let params = connector.needed;
    params._search = searchValue;
    params._page = page;

    const data = await BnumConnector.connect(connector, {
      params,
    });

    if (!data.has_error) {
      return data.datas;
    } else throw new Error(data.error);
  }
  //#endregion
  //#region protected functions
  /**
   * Désactive un élément et le retourne
   * @param {external:jQuery} $item Elément à désactiver
   * @returns {external:jQuery}
   * @protected
   */
  _p_$disable($item) {
    return $item.addClass('disabled').attr('disabled', 'disabled');
  }

  /**
   * Active un élément et le retourne
   * @param {external:jQuery} $item Elément à désactiver
   * @returns {external:jQuery}
   * @protected
   */
  _p_$enable($item) {
    return $item.removeClass('disabled').removeAttr('disabled');
  }
  //#endregion
  //#region events functions
  /**
   * Appeller par le bouton de réinitialisation de la recherche.
   * Vide la recherche puis focus celle-ci.
   * @package
   */
  _event_search_reset() {
    this.#$inputSearch.val(EMPTY_STRING).change().focus();
  }

  /**
   * Appeller par les boutons de changement de mode de visualisation.
   * @param {EVisuMode} mode Nouveau mode de visualisation
   * @param {Event} e Evènement
   * @package
   */
  _event_button_pressed(mode, e) {
    var control = $('bnum-tabs');
    const CLASS_MODE_LIST = 'mode-list';

    BnumConnector.connect(connectors.set_visu_mode, {
      params: { _mode: mode },
    });

    $(e.currentTarget).attr('tabindex', -1);

    document
      .querySelector(`#mode-${mode === EVisuMode.cards ? 'list' : 'block'}`)
      .unpress()
      .setAttribute('tabindex', 0);

    if (mode === EVisuMode.cards) control.removeClass(CLASS_MODE_LIST);
    else control.addClass(CLASS_MODE_LIST);

    control = control.find('button.mel-tabheader.active').attr('aria-controls');

    $(`#${control}`).focus();

    control = null;
  }

  /**
   * Appeller lorsque la fenêtre est redimensionnée
   * @package
   */
  _on_resize() {
    $('.body').css(
      'height',
      `${$('#layout-content').height() - $('.wsp-header').height()}px`,
    );

    this._container_resize();
  }

  /**
   * Est appeller par la recherche
   * @async
   * @returns {Promise<void>}
   * @package
   */
  async _search() {
    this._search_busy();
    this._container = false;
    const searchValue = $('#wsp-search-input').val();

    if ($('#search-pannel').length > 0) $('#search-pannel').remove();

    if (isNullOrUndefined(searchValue) || searchValue === EMPTY_STRING) {
      $('#main-pannel').css('display', EMPTY_STRING);
      $('.reset-search')
        .attr('title', 'Entrez un texte dans la recherche')
        .attr('disabled', 'disabled')
        .addClass('disabled')
        .children()
        .first()
        .text('search');
    } else {
      $('.reset-search')
        .attr('title', 'Quitter la recherche')
        .removeAttr('disabled')
        .removeClass('disabled')
        .children()
        .first()
        .text('close');
      let mainTabs = $('bnum-tabs')[0];

      if (mainTabs.currentTabText() === archived)
        mainTabs.selectTab(EMode.subscribed);

      $('#main-pannel').css('display', 'none');

      if (!$('#search-pannel').length) {
        let tab = document.createElement('bnum-tabs');

        tab.setAttribute('data-navs', mainTabs.getCurrentTabId());
        tab.setAttribute('data-ex-label', 'mel_workspace');
        tab.setAttribute(
          'data-description',
          'Contient le résultat de la recherche',
        );
        tab.setAttribute('data-shadow', false);
        tab.setAttribute('id', 'search-pannel');

        let div = document.createElement(
          mainTabs.currentTabText() === publics
            ? 'bnum-infinite-scroll-container'
            : 'div',
        );
        div.classList.add('workspace-list', 'mel-focus');
        div.setAttribute('data-linked-to', mainTabs.getCurrentTabId());

        if (mainTabs.currentTabText() === publics)
          div.setAttribute('data-pagecount', 0);

        tab.appendChild(div);

        $(mainTabs).parent().append(tab);

        div = null;
        tab = null;
      }

      $('#search-pannel .mel-tab-content').focus();

      switch (mainTabs.currentTabText()) {
        case subscribed:
        case archived:
          this._mine_search(mainTabs, searchValue);
          break;

        default:
          this._public_search(searchValue);
          break;
      }

      $('#search-pannel')
        .find('.workspace-list')
        .parent()
        .css('overflow', 'auto');
    }

    this._container_resize();
    this._search_not_busy();
  }
  //#endregion
}
