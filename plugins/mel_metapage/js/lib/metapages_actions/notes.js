import { MelEnumerable } from "../classes/enum.js";
import { MelFullScreenItem } from "../classes/fullscreen.js";
import { Random } from "../classes/random.js";
import { MainIconHtml, MaterialSymbolHtml } from "../html/html_icon.js";
import { Point } from "../mel_maths.js";
import { MetapageModule } from "./metapage_module.js";
import { PinSticker } from "./notes/pined_sticker.js";
import { Sticker, default_note_uid } from "./notes/sticker.js";

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

                    if (!MelEnumerable.from(raw_notes ?? []).any())
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

                this.add_event_listener('notes.apps.updated.breaked', () => {
                    this._generate_pined_notes();
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

        this.add_event_listener('notes.apps.start-pin', (val) => {
            this.begin_pin = true;
        }, {callback_key:'notes_modules'});

        this.add_event_listener('notes.apps.tak', async (taked) => {
            this.begin_pin = false;
            const after = taked.after;
            taked.uid = taked.uid.replace('pin-', '')

            if (taked.pin) {
                if (this.is_show()) this.hide();

                if (0 === $(`#note-pin-${taked.uid.replace('pin-', '').replace('note-', '')}`).length)
                {
                    const init_pos = rcmail.env.mel_metapages_notes[taked.uid.replace('pin-', '').replace('note-', '')].pin_pos;
                    const has_pos = !!init_pos?.[0] && !!init_pos?.[1];
                    const x = init_pos?.[0] ?? Random.intRange(75, (window.innerWidth - 315));
                    const y = init_pos?.[1] ?? Random.intRange(60, (window.innerHeight / 4));
                    const pos = new Point(x, y);

                    taked = PinSticker.fromSticker(taked);

                    taked.generate({pos}).appendTo($('body'));
                    taked.set_handlers();

                    if (!has_pos)
                    {
                        rcmail.env.mel_metapages_notes[taked.uid.replace('pin-', '').replace('note-', '')].pin_pos = [pos.x, pos.y];
                        rcmail.env.mel_metapages_notes[taked.uid.replace('pin-', '').replace('note-', '')].pin_pos_init = [window.outerWidth, pos.y];
                        await taked.post('pin_move', {
                            _uid:taked.uid.replace('pin-', ''),
                            _x:pos.x,
                            _y:pos.y,
                            _initX:window.outerWidth
                        }, true);
                    }
                }

            }else {
                taked = PinSticker.fromSticker(taked);
                taked.get_html().remove();
            }

            if (!!after) {
                after();
            }

        }, {callback_key:'notes_modules'});

        this.rcmail().addEventListener('skin-resize', () => {
            this._on_resize();
        });

        this._generate_pined_notes();

        if ($('.mel-note.pined').length > 0) {
            this._on_resize();   
        }
    }

    _on_resize() {
        $('.mel-note.pined').each((i, e) => {
            e = $(e);
            const note = rcmail.env.mel_metapages_notes[$(e).attr('id').replace('pin-', '').replace('note-', '')];
            const x = parseInt(note.pin_pos?.[0] ?? 0);
            const wx = parseInt(note.pin_pos_init?.[0] ?? window.outerWidth);
            const right = wx - x;

            let calc = window.outerWidth - right;

            if (calc < 60) calc = 60;

            $(e).css('left', `${calc}px`);
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
        this._generate_plus_button().create($app);

        this._fullscreen.add('app-notes', $app);

        let len;
        let it = 0;
        let stickers = [];
        let current_sticker;
        for (const iterator of MelEnumerable.from(this.notes).where(x => !!x.value.uid).orderBy(x => x.value.order)) {
            const {key, value:note} = iterator;
            current_sticker = Sticker.from(note);
            $app.append($(current_sticker.html()));
            stickers.push(current_sticker);
            current_sticker = null;
            ++it;
        }

        if (it <= 1) {
            $app.find('.downb').addClass('disabled').attr('disabled', 'disabled');
        }

        for (it = 0, len = stickers.length; it < len; ++it) {
            stickers[it].set_handlers();
        }

        if (!!focused_sticker) focused_sticker.get_html().find('button.eye').click();

        return this._generate_pined_notes();
    }

    _generate_plus_button() {
        const create_icon = 'add_circle';
        const icon = new MainIconHtml(create_icon, {class: 'new-note-icon'}, {});
        const text = new mel_html('span', {class:'new-note-text'}, this.gettext('new-note', 'mel_metapage'));
        let html_button = new mel_html2('button', {
            attribs:{class:`new-note-button ${MaterialSymbolHtml.get_class_fill_on_hover()}`, title:this.gettext('note-create-title', 'mel_metapage')},
            contents:[icon, text]
        });

        html_button.onclick.push(() => {
            Sticker.new();
        });

        return html_button;
    }

    _generate_pined_notes() {
        if (this.begin_pin) return;

        $('.mel-note.pined').remove();

        let current_sticker;
        for (const iterator of MelEnumerable.from(this.notes).where(x => x.value.pin === true || x.value.pin === 'true')) {
            const {key, value:note} = iterator;
            current_sticker = Sticker.from(note);
            current_sticker = PinSticker.fromSticker(current_sticker);
            current_sticker.generate({pos:new Point(parseInt(note.pin_pos?.[0] ?? 60), parseInt(note.pin_pos?.[1] ?? 60))}).appendTo($('body'));
            current_sticker.set_handlers();
        }

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