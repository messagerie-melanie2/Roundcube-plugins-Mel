import { MelEnumerable } from '../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { isNullOrUndefined } from '../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../../mel_metapage/js/lib/mel_promise.js';

export class IndexWorkspace extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

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
    // .on('keydown', (e) => {
    //   console.log('e', e);
    // });
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

      console.log(
        'total',
        total,
        'tabs',
        tabs,
        'header',
        headerPannel,
        'constant',
        constant,
      );
      console.log('result', result);

      $('.workspace-list').parent().css('height', `${result}px`);
    }
    tab = null;
  }

  _search() {
    const searchValue = $('#wsp-search-input').val();

    if ($('#search-pannel').length > 0) $('#search-pannel').remove();

    if (isNullOrUndefined(searchValue) || searchValue === EMPTY_STRING) {
      $('#main-pannel').css('display', EMPTY_STRING);
    } else {
      $('#main-pannel').css('display', 'none');
      let mainTabs = $('bnum-tabs')[0];

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
          mainTabs.currentTabText() === this.gettext('publics', 'mel_workspace')
            ? 'bnum-infinite-scroll-container'
            : 'div',
        );
        div.classList.add('workspace-list');
        div.setAttribute('data-linked-to', mainTabs.getCurrentTabId());

        tab.appendChild(div);

        $(mainTabs).parent().append(tab);

        div = null;
        tab = null;
      }

      switch (mainTabs.currentTabText()) {
        case this.gettext('subscribed', 'mel_workspace'):
        case this.gettext('archived', 'mel_workspace'):
          this._mine_search(mainTabs, searchValue);
          break;

        default:
          break;
      }

      $('#search-pannel')
        .find('.workspace-list')
        .parent()
        .css('overflow', 'auto');
    }

    this._container_resize();
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

  _public_search() {}
}
