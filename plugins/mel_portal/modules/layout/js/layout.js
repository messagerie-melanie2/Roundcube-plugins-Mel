import { BaseModule } from "../../../js/lib/module";

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
        return this.rcmail().env.current_user.name; 
    }

    get_hello() {
        return `Bonjour ${this.get_name()},`;
    }

    _create_hello() {
        this.select_contents().prepend($('<h2></h2>').html(this.get_hello()));
    }
}