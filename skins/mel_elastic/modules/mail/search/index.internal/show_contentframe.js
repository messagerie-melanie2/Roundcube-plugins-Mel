import ABaseMelObject from '../../../../../../plugins/mel_metapage/js/lib/base_mel_object.js';

/**
 *
 * @param {(show:boolean) => unknown} original
 * @param {boolean} show
 * @this {rcube_webmail}
 */
function _show_contentframe(original, show) {
  const KEY = '$$@@show_contentframe_state@@$$';
  const returnValue = original.call(this, show);

  if (this[KEY]) return returnValue;

  this[KEY] = true;
  requestAnimationFrame(() => {
    const helper = ABaseMelObject.Empty();
    helper.trigger('bnum::on_mail_previsu', { show, helper });

    /**
     * @type {HTMLAnchorElement}
     */
    const searchButton = helper.$.search_menu_mini_switch;
    const searchBar =
      helper.$.input_search_mail ?? helper.$('input-search-mail');

    // Hard reset de l'affichage
    {
      /**
       * @type {import('../../../../design-system/ds-module-bnum.js').BnumElement}
       */
      const backButton = helper.$.input_search_back_button;
      const headerLeft = document.querySelector(
        '#messagelist-header .header-left',
      );
      const closestParentClass = 'header-container';
      const searchContainer = searchBar.closest(`.${closestParentClass}`);

      headerLeft.style.display = null;
      searchContainer.style.justifyContent = null;
      backButton.addClass('bds-hidden');
      searchButton.removeAttribute('data-show');
    }

    if (show) {
      searchButton.style.display = null;
      searchBar.style.display = 'none';
    } else {
      searchButton.style.display = 'none';
      searchBar.style.display = null;
    }

    helper.trigger('bnum::on_mail_previsu.after', {
      show,
      searchButton,
      searchBar,
      helper,
    });

    this[KEY] = false;
  });

  return returnValue;
}

export function update_show_contentframe() {
  var rcmail = window.rcmail || null;
  var rcube_webmail = window.rcube_webmail || null;

  if (!rcmail || !rcube_webmail) {
    return;
  }

  const rcmail_show_contentframe = rcmail.show_contentframe;
  const rcmail__prototype__show_contentframe =
    rcube_webmail.prototype.show_contentframe;

  const applyPatch = (original) => _show_contentframe.bind(rcmail, original);
  rcmail.show_contentframe = applyPatch(rcmail_show_contentframe);
  rcube_webmail.prototype.show_contentframe = applyPatch(
    rcmail__prototype__show_contentframe,
  );

  return rcmail;
}
