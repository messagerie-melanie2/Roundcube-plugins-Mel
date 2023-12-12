import { WaitSomething } from "../../mel_promise.js";
import { MailModule } from "./mail_modules.js";

export class AFolderModifier extends MailModule
{
    constructor() {
        super();
    }

    main() {
        this.data = null;
        Object.defineProperty(this, 'data', {
            get: () => {               
                return this._get_data();
            }
        });

        this._setup_listeners();
        this.generate_context_menu();
        this.after_init();
    }

    async generate_context_menu() {
        (await this.await_folder_list_content()).find('#mailboxlist a').on('contextmenu', (...args) => {
            const [event] = args;
            const folder = $(event.currentTarget).attr('rel');
            this.update_context_menu(folder);
        });
    }

    update_context_menu(folder) {}

    after_init() {
        this.update_visuel();
    }

    update_visuel() {}

    async get_from_server() {}
    async set_to_server() {}

    async on_refresh() {
        await this.get_from_server();
        this.update_visuel();
    }

    _setup_listeners() {
        this.rcmail().addEventListener('mel_metapage_refresh', async () => {
            await this.on_refresh();
        });
    }

    _get_data() {}

    async await_folder_list_content() {
        await new WaitSomething(() => {
            return this.folder_list_content().length > 0;
        });

        if (this.folder_list_content().length === 0) {
            throw new Error('Folder list content not found');
        }
        else return this.folder_list_content();
    }

    static Start() {
        return new this();
    }
}