import { MelEnumerable } from '../../classes/enum.js';
import { EMPTY_STRING } from '../../constants/constants.js';
import { mel_cancellable_html_timer } from '../../html/html_timer.js';
import { Mel_Promise } from '../../mel_promise.js';
import { Top } from '../../top.js';
import { MetapageModule } from '../metapage_module.js';

export class MetapageMailDelayedModule extends MetapageModule {
  constructor() {
    super();
  }

  /**
   * @protected
   * @async Actions principales
   */
  async main() {
    super.main();

    if (!MetapageMailDelayedModule.elements)
      MetapageMailDelayedModule.elements = new MelEvent();

    /**
     * @private
     * @type {?boolean}
     */
    this._already = null;
    this._init();

    if (!MetapageMailDelayedModule.Instance)
      MetapageMailDelayedModule.Instance = this;
  }

  /**
   * Initialise la classe
   * @private
   * @returns Chaîne
   */
  _init() {
    if (rcmail.submit_messageform) {
      const rcmail_submit_messageform = rcmail.submit_messageform;
      rcmail.submit_messageform = function (...args) {
        const [draft, saveonly] = args;
        if (this._already && !draft) return;

        if (!draft) {
          this._already = true;
        }

        const delay = this.env['mail_delay'] ?? 0;
        const have_delay = delay > 0;

        if (draft !== true && have_delay === true) {
          const navigator = Top.top();
          const current_window = window;
          let self = this;

          let html = mel_cancellable_html_timer.Success(delay, {
            cancel_icon: 'undo',
            contents: new mel_html(
              'span',
              {},
              `${this.gettext('delaytimer', 'mel_metapage')} <span class="time-number">${delay}</span>...`,
            ),
          });

          html.attribs['data-uid'] =
            MetapageMailDelayedModule.elements._generateKey();

          html.ontimerfinished.push(($element) => {
            try {
              MetapageMailDelayedModule.Instance.enable_mail_window_actions().show_loader();
            } catch (error) {
              console.error(error);
            }
            rcmail_submit_messageform.call(self, ...args);
            MetapageMailDelayedModule.elements.remove($element.data('uid'));

            if (rcmail.env.extwin === 1) {
              const interval = setInterval(() => {
                if ($('#messagestack .error').length) {
                  $('#mail-send-loader').remove();
                  $('#layout-content').show();
                  $('#layout-sidebar').attr('style', EMPTY_STRING);

                  this._already = false;
                  clearInterval(interval);
                }
              }, 10);
            }
          });

          html.oncancel.push((e) => {
            e = $(e.currentTarget).parent();
            e.break_timer();

            if (current_window.popup_action) {
              current_window.popup_action(($element, box) => {
                box.minifier.click();
                box.title
                  .find('h3')
                  .html(
                    box.title
                      .find('h3')
                      .html()
                      .replace('Envoi de : ', 'Rédaction : '),
                  );
                box.close.removeClass('disabled').removeAttr('disabled');
              });
            }

            MetapageMailDelayedModule.elements.remove(e.data('uid'));
            MetapageMailDelayedModule.Instance.enable_mail_window_actions();
            rcmail.display_message(
              'Envoi du message annulé avec succès !',
              'confirmation',
            );
            $(window).resize();

            this._already = false;
          });

          html.onstart.push((e) => {
            e = $(e.currentTarget).parent();
            e.skip_timer();
          });

          if (navigator.$('#messagestack').length <= 0) {
            new mel_html('div', { id: 'messagestack' }).create(
              navigator.$('body'),
            );
          }

          let $gen = html.create(navigator.$('#messagestack'));
          $gen.find('.mel-timer-cancel').attr('title', "Annuler l'envoi");

          MetapageMailDelayedModule.elements.add(html.attribs['data-uid'], {
            $gen,
            html,
            rcmail,
          });

          MetapageMailDelayedModule.Instance.disable_mail_window_actions();

          if (window.popup_action) {
            window.popup_action(($element, box) => {
              box.title
                .find('h3')
                .html(
                  box.title
                    .find('h3')
                    .html()
                    .replace('Rédaction : ', 'Envoi de : '),
                );
              box.close.addClass('disabled').attr('disabled', 'disabled');
              box.minifier.click();
            });
          }
        } else {
          rcmail_submit_messageform.call(this, ...args);
          this._already = false;
        }
      };
    }

    if (!window.onbeforeunload) {
      const window_onbeforeunload = window.onbeforeunload;
      window.onbeforeunload = (...args) => {
        const txt =
          window_onbeforeunload?.call?.(window, ...args) ?? EMPTY_STRING;

        if (txt) return txt;
        else return this.onBeforeUnload(...args);
      };
    } else window.onbeforeunload = this.onBeforeUnload;

    Mel_Promise.wait(() => {
      return $('#list-toggle-button').length > 0;
    }).always((value) => {
      let $toggle = $('#list-toggle-button');
      if (value.resolved && $toggle.hasClass('disabled'))
        $('#list-toggle-button')
          .addClass('active')
          .removeClass('disabled')
          .removeAttr('disabled');
    });

    return this;
  }

  onBeforeUnload(e) {
    if (
      !!MetapageMailDelayedModule.elements &&
      MetapageMailDelayedModule.elements.haveEvents()
    ) {
      const message = rcmail.gettext('quitdelayconfirmation', 'mel_metapage');
      (e || window.event).returnValue = message;
      return message;
    }
  }

  _get_elements_form_states_can_be_changed() {
    return [
      $('#layout-sidebar input'),
      $('#layout-sidebar button'),
      $('#layout-sidebar select'),
      $('#layout-content input'),
      $('#layout-content select'),
      $('#layout-content a'),
      $('#layout-content button'),
    ];
  }

  show_loader() {
    $('#layout-content').hide();
    $('#layout-sidebar').attr('style', 'display: none !important;');
    this.get_skin()
      .create_loader('mail-send-loader', true, false)
      .create($('#layout'));
  }

  disable_mail_window_actions() {
    // $('#layout-content').hide();
    // $('#layout-sidebar').attr('style', 'display: none !important;');
    // this.get_skin().create_loader('mail-send-loader', true, false).create($('#layout'));
    const elements = this._get_elements_form_states_can_be_changed();
    for (const iterator of elements) {
      MelEnumerable.from(iterator)
        .where((x) => $(x).hasClass('disabled'))
        .select((x) => $(x).attr('data-original-state', 'disabled'))
        .count();
      iterator.attr('disabled', 'disabled').addClass('disabled');
    }

    $('#compose_to ul').css({
      'pointer-events': 'none',
      'background-color': '#e9ecef',
    });

    return this;
  }

  enable_mail_window_actions() {
    // $('#layout-content').show();
    // $('#layout-sidebar').removeAttr('style');
    // $('#mail-send-loader').remove();
    const elements = this._get_elements_form_states_can_be_changed();
    for (const iterator of elements) {
      iterator.removeAttr('disabled').removeClass('disabled');
      MelEnumerable.from(iterator)
        .where((x) => $(x).attr('data-original-state') === 'disabled')
        .select((x) =>
          $(x)
            .removeAttr('data-original-state')
            .attr('disabled', 'disabled')
            .addClass('disabled'),
        )
        .count();
    }

    $('#compose_to ul').css({
      'pointer-events': '',
      'background-color': '',
    });

    return this;
  }

  static Start() {
    return new MetapageMailDelayedModule();
  }
}
