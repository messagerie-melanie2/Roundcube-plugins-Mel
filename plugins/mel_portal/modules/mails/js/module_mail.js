export { ModuleMail }
import { BaseStorage } from "../../../../mel_metapage/js/lib/classes/base_storage";
import { BnumLog } from "../../../../mel_metapage/js/lib/classes/bnum_log";
import { html_ul } from "../../../../mel_metapage/js/lib/html/html";
import { mail_html } from "../../../../mel_metapage/js/lib/html/html_mail";
import { MailBaseModel } from "../../../../mel_metapage/js/lib/mails/mail_base_model";
import { BaseModule } from "../../../js/lib/module"

const MODULE_ID = 'Mails';
class ModuleMail extends BaseModule{
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        super.start();
        this._init().set_title_action();
        let loaded = false;
        let mail_loader = new MailLoader();
        Object.defineProperties(this, {
            mail_loader: {
                get: function() {
                    return mail_loader;
                },
                configurable: true
            },
            loaded: {
                get: function() {
                    return loaded;
                },
                configurable: true
            },
        });
        this.trigger_event('portal.mails.before', {module:this}, {top:true});
        this.show_last_mails({}).then(() => {
            loaded = true;
            this._set_listeners().trigger_event('portal.mails.after', {module:this}, {top:true});
        });
    }

    _init() {
        this.html_elements = [];

        let $contents = this.select_module_content().html(EMPTY_STRING);

        const loader = this.generate_loader('melv2-email-loader');
        mel_html2.div({attribs:{class:'melv2-email-undefined-content'}, contents:loader}).create($contents);

        let ul = new html_ul({attribs:{class:'melv2-email-ul ignore-bullet'}});

        for (let index = 0, html_element; index < ModuleMail.MAX; ++index) {
            html_element = new mail_html(null).setId(`melv2-email-id-${index}`).css('display', 'none');
            html_element.appendTo(ul.li({attribs:{class:'melv2-email-li'}}));
            this.html_elements.push(html_element);
        }

        ul.create($contents);

        return this;
    }

    _set_listeners() {
        const KEY = 'portal_mails_listeners';

        this.on_frame_refresh(() => {
            this.show_last_mails({force_refresh:true});
        }, 'bureau', {callback_key:KEY});

        return this;
    }

    set_title_action(){
        const URL = this.url('mail', {});
        this.select_module_title().attr('href', URL).click(() => {
            this.change_frame('mail', {update: false, force_update: false});
        });
        return this;
    }

    async show_last_mails({
        mails = null,
        force_refresh = false
    }) {
        if (force_refresh) this.mail_loader?.force_refresh?.();

        if (!mails) mails = await this.mail_loader.load_mails();

        let $un_contents = this.select_undefined_contents().html(EMPTY_STRING);

        if ((mails ?? []).length > 0)
        {
            for (let index = 0, len = mails.length; index < len; ++index) {
                const mail = mails[index];
                
                if (!!this.html_elements[index]) this.html_elements[index].mail = mail;
            }

            $un_contents.css('display', 'none');
        }
        else {
            mel_html2.div({attribs:{class:'melv2-mail'}, contents:"Vous n'avez pas de mails !"}).create($un_contents.css('display', EMPTY_STRING));
        }
        
        return this;
    }

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }

    select_undefined_contents() {
        return this.select_module().find('.melv2-email-undefined-content');
    }
}

ModuleMail.MAX = 3;

class MailLoaderBase extends BaseModule {
    constructor() {
        super(false);
    }

    start() {
        super.start();
        this.tags = new BaseStorage();
    }

    async load_mails() {}

    addTag(tag) {
        this.tags.add(tag, true);
        return this;
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }

    removeTag(tag) {
        this.tags.remove(tag);
        return this;
    }
}

class MailLoaderStockage extends MailLoaderBase{
    constructor() {
        super();
    }

    start() {
        super.start();
    }

    async load_mails() {
        if (this.hasTag('force_refresh')) return null;

        return this._get();
    }

    _get() {
        let datas = null;

        if (!this.need_refresh())
        {
            const KEY = 'mails';
            const raw_datas = this.load(KEY);
    
            if (!!raw_datas) datas = MailBaseModel.import_from_array(raw_datas);
        }

        return datas;
    }

    need_refresh() {
        const LAST_UPDATE_KEY = 'last_update_date';
        const LAST_UPDATE_DATE_DEFAULT_VALUE = false;
        const LAST_UPDATE_DATE = this.load(LAST_UPDATE_KEY, LAST_UPDATE_DATE_DEFAULT_VALUE);
        const IS_NEXT_DAY = !LAST_UPDATE_DATE || moment(LAST_UPDATE_DATE).startOf('day') !== moment().startOf('day');

        return IS_NEXT_DAY;
    }
}

class MailLoaderDataBase extends MailLoaderBase {
    constructor() {
        super();
    }

    async load_mails() {
        let mails = [];
        await this.http_internal_get(
            {
                task:'bureau',
                action:'mails_get',
                on_success:function (datas) {
                    try {
                        if ('string' === typeof datas) datas = JSON.parse(datas);
                    } catch (error) {
                        this.on_error(error);
                    }

                    mails = MailBaseModel.import_from_array(datas);
                },
                on_error:function (...args) {
                    BnumLog.fatal('get_last_mails', 'Impossible de récupérer les mails !', ...args);
                }
            }
        );

        return mails;
    }
}

class MailLoader extends MailLoaderBase {
    constructor() {
        super();
    }

    start() {
        super.start();
        this.loaders = [];
        this/*.addLoader(new MailLoaderStockage())*/
            .addLoader(new MailLoaderDataBase());
    }

    async load_mails() {
        let mails = null;
        for (const loader of this.loaders) {
            mails = await loader.load_mails();

            if (mails !== null) break;
        }

        this.removeTag('force_refresh');

        return mails;
    }

    addLoader(loader) {
        this.loaders.push(loader);
        return this;
    }

    addTag(tag) {
        super.addTag(tag);

        for (let index = 0, len = this.loaders.length; index < len; ++index) {
            this.loaders[index].addTag(tag);
        }

        return this;
    }

    removeTag(tag) {
        super.removeTag(tag);

        for (let index = 0, len = this.loaders.length; index < len; ++index) {
            this.loaders[index].removeTag(tag);
        }

        return this;
    }

    force_refresh() {
        return this.addTag('force_refresh');
    }
}