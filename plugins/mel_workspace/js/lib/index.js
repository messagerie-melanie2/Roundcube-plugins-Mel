import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { isNullOrUndefined } from '../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../../mel_metapage/js/lib/mel_promise.js';
import { connectors } from './connectors.js';

const mode = {
  subscribed: 'subscribed',
  archived: 'archived',
  publics: 'publics',
};

const subscribed = MelObject.Empty().gettext(mode.subscribed, 'mel_workspace');
const archived = MelObject.Empty().gettext(mode.archived, 'mel_workspace');
const publics = MelObject.Empty().gettext(mode.publics, 'mel_workspace');

export class IndexWorkspace extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this._set_listeners();

    $('#mode-block').on('api:pressed', (e) => {
      $(e.currentTarget).attr('tabindex', -1);
      document
        .querySelector('#mode-list')
        .unpress()
        .setAttribute('tabindex', 0);
      let control = $('bnum-tabs')
        .removeClass('mode-list')
        .find('button.mel-tabheader.active')
        .attr('aria-controls');

      $(`#${control}`).focus();
    });

    new Mel_Promise(async () => {
      await Mel_Promise.wait(
        () =>
          $('#mode-block').parent().find('[aria-pressed="true"]').length > 0,
      );

      $('#mode-block')
        .parent()
        .find('[aria-pressed="true"]')
        .attr('tabindex', -1);
    });

    $('#mode-list').on('api:pressed', (e) => {
      $(e.currentTarget).attr('tabindex', -1);
      document
        .querySelector('#mode-block')
        .unpress()
        .setAttribute('tabindex', 0);
      let control = $('bnum-tabs')
        .addClass('mode-list')
        .find('button.mel-tabheader.active')
        .attr('aria-controls');

      $(`#${control}`).focus();
    });

    $('.workspace-list')
      .parent()
      .css('display', 'block')
      .css('overflow', 'auto');

    $(window).resize(this._on_resize.bind(this));

    this._on_resize();

    $('#wsp-search-input').on('change', this._search.bind(this));
    $('.reset-search').click(() => {
      $('#wsp-search-input').val(EMPTY_STRING).change().focus();
    });
  }

  _set_listeners() {
    $('bnum-workspace-block-item').on('api:favorite', () => {
      this._reorder();
      this._set_listeners();
    });
  }

  _on_resize() {
    $('.body').css(
      'height',
      `${$('#layout-content').height() - $('.wsp-header').height()}px`,
    );

    this._container_resize();
  }

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
        mainTabs.selectTab(mode.subscribed);

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

  _mine_search(mainTabs, searchValue) {
    let arr = MelEnumerable.from(
      mainTabs.currentPannel().find('bnum-workspace-block-item'),
    )
      .aggregate(
        mainTabs.currentPannel('archived').find('bnum-workspace-block-item'),
      )
      .where((x) =>
        x.title().toUpperCase().includes(searchValue.toUpperCase()),
      );

    let $dest = $('#search-pannel')[0].currentPannel();
    for (const element of arr) {
      element.getClone().appendTo($dest);
    }

    $dest.find('bnum-icon').each((i, e) => {
      e = $(e);

      if (e.text().includes('keep')) e.remove();
    });

    arr = null;
    $dest = null;
  }

  _search_busy() {
    $('#wsp-search-input').addClass('disabled').attr('disabled', 'disabled');
    $('.reset-search').addClass('disabled').attr('disabled', 'disabled');
  }

  _search_not_busy() {
    $('#wsp-search-input').removeClass('disabled').removeAttr('disabled');
    $('.reset-search').removeClass('disabled').removeAttr('disabled');
  }

  async _public_search(searchValue) {
    this._container = true;

    let $dest = $('#search-pannel')[0].currentPannel();

    $dest.html(this.generate_loader('generatedsearchwsp', true).generate());

    const promiseArr = await Promise.allSettled([
      this._public_search_data(searchValue),
      this._get_count_max(searchValue),
    ]);
    const [result, count] = promiseArr.map((x) => x.value);

    $dest.html(result);

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

    $dest = null;
    scroll = null;
  }

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

  _reorder() {
    const data = MelEnumerable.from(
      $(
        `[data-pannel-namespace="${mode.subscribed}"] bnum-workspace-block-item`,
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
      `[data-pannel-namespace="${mode.subscribed}"] .workspace-list`,
    );

    const html = MelEnumerable.from(data)
      .orderBy((x) =>
        x.isFavorite ? Number.POSITIVE_INFINITY : x.date.valueOf(),
      )
      .then((x) => x.title)
      .select((x) => x.html)
      .join('');

    $dest.html(html);
  }
}
