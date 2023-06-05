import { MetapageModule } from "./metapage_module";

export class MetapageNotesModule extends MetapageModule {
    constructor() {
        super();
    }

    main() {
        super.main();

        this.select_note_button().click(() => {

        });
    }

    select_note_button() {
        return this.select('#button-notes');
    }

    _create_fullscreen_item() {
        
    }
}