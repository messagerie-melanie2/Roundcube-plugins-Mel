import { MelEnumerable } from "../../classes/enum.js";
import { JsHtml } from "../../html/JsHtml/JsHtml.js";
import { MailModule } from "./mail_modules.js";

export class UIMailHeaderManager extends MailModule {
    constructor() {
        super();
    }

    main() {
        super.main();
        const lc_selector = '#layout-content .header ul#toolbar-menu li a';
        const ll_selector = '#layout-list .header';
        const ll_search_selector = `${ll_selector} #mailsearchlist`;
        const selected_action_list_id = this.list_id();

        const header_actions = MelEnumerable.from(this.select(lc_selector)).where(x => $(x).css('display') !== 'none').where(
            x => {
                return MelEnumerable.from(x.classList).any(a => ['tb_noclass', 'move', 'delete'].includes(a));
            }
        ).reverse();

        $(ll_search_selector).before(JsHtml.start.div({id:selected_action_list_id, style:'display:none'}).ul({class:'menu toolbar listing iconized'}).end().end().generate_html({}));

        let $list = $(`#${selected_action_list_id} ul`);
        for (const iterator of header_actions) {
            $list.append($('<li>').append($(iterator).clone().removeClass('disabled').removeAttr('aria-disabled').removeAttr('id')));
        }

        //generate clone popup
        let $clone_popup = JsHtml.start.div({id:'clone-label'}).end().generate().appendTo($('body'));
        for (const iterator of $('#tb_label_popup div, #tb_label_popup ul')) {
            $clone_popup.append($(iterator).clone());
        }

        $clone_popup.find('li a').addClass('active').removeAttr('href');

        rcm_tb_label_init_onclick('#clone-label li a');

        $list = $list.find('.tb_noclass').attr('data-popup', 'clone-label');

        UI.popup_init($list[0]);

        this.set_listeners();

        this.on_ui_close_mail_visu();
    }

    set_listeners() {
        const listeners = ['ui.close-mail-visu', 'ui.open-mail-visu'];

        for (const iterator of listeners) {
            this.rcmail().addEventListener(iterator, this[`on_${iterator.replaceAll('.', '_').replaceAll('-', '_')}`].bind(this));
        }

        rcmail.message_list.addEventListener('select', () => {
            let $list = this.get_list();
            if (!this.has_previsu() && this.has_mail_selected()) {
                if (!$list.hasClass('elements-enabled')) $list.addClass('elements-enabled').find('li a').removeClass('disabled').removeAttr('aria-disabled').removeAttr('disabled');
            }
            else if ($list.hasClass('elements-enabled')) $list.removeClass('elements-enabled').find('li a').addClass('disabled').attr('aria-disabled', true).attr('disabled', 'disabled');

            $list = null;
        });

        return this;
    }

    on_ui_close_mail_visu() {
        let $list = this.get_list();

        if ('none' === $list.css('display')) $list.show();

        if (this.has_mail_selected()) {
            $list.addClass('elements-enabled').find('li a').removeClass('disabled').removeAttr('aria-disabled').removeAttr('disabled');
        }
        else $list.removeClass('elements-enabled').find('li a').addClass('disabled').attr('aria-disabled', true).attr('disabled', 'disabled');
    }

    on_ui_open_mail_visu() {
        if ('none' !== this.get_list().css('display')) this.get_list().hide();
    }

    has_previsu() {
        const $layout = $('#layout-list');
        return !($layout.hasClass('initial') || $layout.hasClass('full'));
    }

    list_id() {
        return 'selected-action-list';
    }

    get_list() {
        return $(`#${this.list_id()}`);
    }
}