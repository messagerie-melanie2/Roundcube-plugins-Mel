import { MelCurrentUser } from "../../../../mel_metapage/js/lib/classes/user";
import { BaseModule } from "../../../js/lib/module";

const EMPTY_STRING = '';
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
        return MelCurrentUser.name ?? MelCurrentUser.get_name_from_fullname(); 
    }

    get_hello() {
        const name = this.get_name() ?? EMPTY_STRING;
        let have_extra_space = true;

        if (!name || name == 'null') {
            have_extra_space = false;
        }

        const extra_space = have_extra_space ? ' ' : EMPTY_STRING;
        const showed_name = have_extra_space ? name : EMPTY_STRING;

        let text = `Bonjour${extra_space}${showed_name},`;

        if (text === 'Bonjour null,') text = 'Bonjour,';

        return text;
    }

    _create_hello() {
        let $html = new mel_html('h2', {class:'melv2-hello'}, this.get_hello()).generate();
        this.select_contents().prepend($html);
        $html = null;
        return this;
    }
}