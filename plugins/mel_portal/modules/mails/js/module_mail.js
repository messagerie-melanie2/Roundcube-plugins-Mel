export { ModuleMail }
import { BaseStorage } from "../../../../mel_metapage/js/lib/classes/base_storage";
import { BnumLog } from "../../../../mel_metapage/js/lib/classes/bnum_log";
import { mail_html } from "../../../../mel_metapage/js/lib/mails/html_mail";
import { MailBaseModel } from "../../../../mel_metapage/js/lib/mails/mail_base_model";
import { Top } from "../../../../mel_metapage/js/lib/top";
import { BaseModule } from "../../../js/lib/module"

const MODULE_ID = 'mails';
class ModuleMail extends BaseModule{
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        super.start();
        this._init()._set_listeners();
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
        this.trigger_event('portal.mails.before', {module:this});
        this.show_last_mails().then(() => {
            loaded = true;
            this.trigger_event('portal.mails.after', {module:this});
        });
    }

    _init() {
        this.html_elements = [];

        let $contents = this.select_module_content().html('');

        for (let index = 0, html_element; index < ModuleMail.MAX; ++index) {
            html_element = new mail_html(null).setId(`melv2-email-id-${index}`);
            html_element.create($contents).css('display', 'none');
            this.html_elements.push(html_element);
        }

        return this;
    }

    _set_listeners() {
        const KEY = 'portal_mails_listeners';
        if (!Top.has(KEY)){
            this.add_event_listener('mel_metapage_refresh', () => {
                this.show_last_mails({force_refresh:true});
            }, {top:true});
            Top.add(KEY, true);
        }

        return this;
    }

    async show_last_mails({
        mails = null,
        force_refresh = false
    }) {
        if (force_refresh) this.mail_loader.force_refresh();

        if (!mails) mails = await this.mail_loader.load_mails();

        for (let index = 0, len = mails.length; index < len; ++index) {
            const mail = mails[index];
            
            if (!!this.html_elements[index]) this.html_elements[index].mail = mail;
        }

        return this;
    }

    module_id() {
        let id = super.module_id();

        if (!!id) id += `_${MODULE_ID}`;
        else id = MODULE_ID;

        return id;
    }
}

ModuleMail.MAX = 3;

class MailLoaderBase extends BaseModule {
    constructor() {
        super();
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
        const KEY = 'mails';
        const raw_datas = this.load(KEY);
        
        let datas = null;

        if (!!raw_datas) datas = MailBaseModel.import_from_array(raw_datas);

        return datas;
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
                task:'mel_portal',
                action:'mails_get',
                on_success:(datas) => {
                    if ('string' === typeof datas) datas = JSON.parse(datas);

                    mails = MailBaseModel.import_from_array(datas);
                },
                on_error:(...args) => {
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
        this.addLoader(new MailLoaderStockage())
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