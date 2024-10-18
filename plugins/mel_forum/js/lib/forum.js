import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

export class Forum extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        this.initButtons();

    }


    initButtons() {
        $('#forum-button-add').click(() => {
            window.location.href = this.url('forum', {action:'create_or_edit_post'});
        });
        $('.favorite').click(() => {
            event.stopPropagation();
            if ($(this).text() === 'star_border') {
                // Si elle est vide, la remplir
                $(this).text('star');
            } else {
                // Sinon, la remettre en vide
                $(this).text('star_border');
            }
        });
    }
}