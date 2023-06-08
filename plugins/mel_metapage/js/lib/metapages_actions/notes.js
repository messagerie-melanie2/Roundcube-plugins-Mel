import { MelFullScreenItem } from "../classes/fullscreen";
import { MetapageModule } from "./metapage_module";
import { Sticker, default_note_uid } from "./notes/sticker";

export class MetapageNotesModule extends MetapageModule {
    constructor() {
        super();
    }

    main() {
        super.main();

        this._fullscreen = null;
        this.state = false;

        this.notes = null;
        Object.defineProperties(this, {
            notes: {
                get: () => {
                    let notes;
                    const raw_notes = this.get_env('mel_metapages_notes');

                    if (!Enumerable.from(raw_notes ?? []).any())
                    {
                        notes = {};
                        notes[default_note_uid] = new Sticker(default_note_uid, 0, "", "");
                    }
                    else notes = raw_notes;

                    return notes;
                },
                configurable: true
            },          
        });

        this.select_note_button().click(() => {
            if (!this._fullscreen) {
                this.add_event_listener('notes.apps.updated', () => {
                    this._generate_notes();
                }, {callback_key:'notes_modules'});

                this._create_fullscreen_item()
                ._generate_notes()
                .show();
            }
            else this.toggle();
        });

        this.select('#barup-wrapper-row').click((ev) => {
            if (this.is_show()) {
                
                let $parent = $(ev.target);
                
                while ($parent.attr('id') !== 'button-notes' && $parent[0].nodeName !== 'BODY') {
                    $parent = $parent.parent();
                }

                if ($parent.attr('id') !== 'button-notes') this.hide();
            }
        });

        this.select('#layout-menu').click(() => {
            if (this.is_show()) {
                this.hide();
            }
        });
    }

    is_show() {
        return this.state;
    }

    select_note_button() {
        return this.select('#button-notes');
    }

    _create_fullscreen_item() {
        this._fullscreen = new MelFullScreenItem('app-notes', 'body', {close_on_click:false});

        this._fullscreen.onclose.push(() => {
            this.state = false;
            this.select_note_button().removeClass('on-focus');
        });

        this._fullscreen.onshow.push(() => {
            this.state = true;
            this.select_note_button().addClass('on-focus');
        });

        this._fullscreen.$apps[0].addEventListener('dragover', (ev) => {
            ev.preventDefault();
            ev.dataTransfer.dropEffect = "move";

            if (!$(ev.target).hasClass('fullscreen_container')) {
                let $parent = $(ev.target);

                while(!$parent.hasClass('mel-note') && $parent[0].nodeName !== 'BODY') {
                    $parent = $parent.parent();
                }

                if ($parent.hasClass('mel-note')) {

                    if (!$parent.hasClass('dragover')) {
                        $('.mel-note.dragover').removeClass('dragover');
                        $('.mel-note.dragover-right').removeClass('dragover-right');
                        $('.mel-note.dragover-left').removeClass('dragover-left');
                        $parent.addClass('dragover');
                    }

                    const rect = $parent[0].getBoundingClientRect();
                    const x = ev.clientX - rect.left;
                    const y = ev.clientY - rect.left;

                    if (x >= ($parent.width() / 2)) $parent.addClass('dragover-right').removeClass('dragover-left');
                    else $parent.addClass('dragover-left').removeClass('dragover-right');
                }
            }
            else {
                $('.mel-note.dragover').removeClass('dragover');
                $('.mel-note.dragover-right').removeClass('dragover-right');
                $('.mel-note.dragover-left').removeClass('dragover-left');
            }
        });

        this._fullscreen.$apps[0].addEventListener('drop', (ev) => {
            ev.preventDefault();
            const uid = ev.dataTransfer.getData("text/plain");

            let $target = $('.mel-note.dragover');
            if ($target.length > 0) {
                let sticker_target = Sticker.fromHtml($target.attr('id').replace('note-', EMPTY_STRING));

                if (sticker_target.uid !== uid) {
                    let order = +sticker_target.order;

                    if ($target.hasClass('dragover-left')) order -= 1;

                    Sticker.fromHtml(uid).drop(uid, order);
                }
            }

            $('.mel-note.dragover').removeClass('dragover');
            $('.mel-note.dragover-right').removeClass('dragover-right');
            $('.mel-note.dragover-left').removeClass('dragover-left');
        });

        return this;
    }

    _generate_notes() {
        let focused_sticker = this.in_focus_mode() ? this.get_note_focused() : null;

        this._fullscreen.clear();

        let $app = new mel_html('div', {class:'app-notes'}).generate();
        this._fullscreen.add('app-notes', $app);

        let stickers = [];
        let current_sticker;
        for (const iterator of Enumerable.from(this.notes).orderBy(x => x.value.order)) {
            const {key, value:note} = iterator;
            current_sticker = Sticker.from(note);
            $app.append($(current_sticker.html()));
            stickers.push(current_sticker);
            current_sticker = null;
        }

        for (let index = 0, len = stickers.length; index < len; ++index) {
            stickers[index].set_handlers();
        }

        if (!!focused_sticker) focused_sticker.get_html().find('button.eye').click();

        return this;
    }

    in_focus_mode() {
        return this._fullscreen.$element.find('.mel-note .eye.crossed').length > 0;
    }

    get_note_focused() {
        let $parent = this._fullscreen.$element.find('.mel-note .eye.crossed');

        do {
            $parent = $parent.parent();
        } while (!$parent.hasClass('mel-note'));

        return Sticker.fromHtml($parent.attr('id').replace('note-', EMPTY_STRING));
    }

    hide() {
        this._fullscreen.hide();
        return this;
    }

    show() {
        if (!this._fullscreen) {
            this.select_note_button().click();
        }
        else this._fullscreen.show();
        return this;
    }

    toggle() {
        if (this.state)  this.hide();
        else this.show();

        return this;
    }
}