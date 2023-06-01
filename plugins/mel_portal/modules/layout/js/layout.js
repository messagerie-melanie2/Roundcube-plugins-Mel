import { MelCurrentUser } from "../../../../mel_metapage/js/lib/classes/user";
import { BaseModule } from "../../../js/lib/module";

const KEY = 'user_name';
export class ModuleLayout extends BaseModule {
    constructor(load_module = true) {
        super(load_module);
    }

    start() {
        this._create_hello();
    }

    select_contents() {
        return this.select('#layout-content #contents');
    }

    get_name() {
        debugger;
        return MelCurrentUser.name; 
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