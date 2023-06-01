import { BaseModule } from "../../../js/lib/module";

const KEY = 'user_name';
export class ModuleLayout extends BaseModule {
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        this._create_hello();

        const user_name = this.load(KEY);

        if (!user_name) {
            const name = this.rcmail().env.current_user?.name;

            if (!!name) this.save(KEY, name);
        }
    }

    select_contents() {
        return this.select('#layout-content #contents');
    }

    get_name() {
        return this.load(KEY) ?? this.rcmail().env.current_user.name; 
    }

    get_hello() {
        const name = this.get_name();
        const extra_space = !!name ? ' ' : EMPTY_STRING;
        return `Bonjour${extra_space}${name},`;
    }

    _create_hello() {
        let $html = new mel_html('h2', {class:'melv2-hello'}, this.get_hello()).generate();
        this.select_contents().prepend($html);
        $html = null;
        return this;
    }
}