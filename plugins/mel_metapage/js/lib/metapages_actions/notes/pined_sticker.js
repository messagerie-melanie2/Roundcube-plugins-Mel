import { Point } from "../../mel_maths.js";
import { Sticker } from "./sticker.js";

export class PinSticker extends Sticker {
    constructor(uid, order, title, text, color, text_color, height = null) {
        super(`pin-${uid}`, order, title, text, color, text_color, true);
        this.pos = Point.Zero();
        this.height = height;
    }

    generate({pos = null}) {
        if (!pos) pos = Point.Zero();

        let $generated = $(super.html());

        $generated.addClass('pined').appendTo($('body'))
        .css('position', 'absolute')
        .css('top', `${pos.y}px`)
        .css('left', `${pos.x}px`)
        .css('z-index', 2);

        let $table = $generated.find('.takb').parent().parent();

        $generated.find('.eye').parent().remove();
        $generated.find('.pb').parent().remove();
        $generated.find('.db').parent().remove();
        $generated.find('.downb').removeClass('downb')
                                 .addClass('moveb')
                                 .css('border-radius', 0)
                                 .css('border-top-left-radius', '5px')
                                 .appendTo($('<td></td>').prependTo($table));
        $generated.find('.takb')
                  .css('border-radius', 0)
                  .css('border-top-right-radius', '5px').parent().appendTo($table);
        $generated.find('.note-header-params').remove();

        this.pos = pos;

        return $generated;
    }

    html(hidden = false) {
        let $generated =  this.generate({});

        if (hidden) $generated.css('display', 'none');

        return $generated[0].outerHTML;
    }

    /**
     * 
     * @param {Sticker} sticker 
     */
    static fromSticker(sticker) {
        return new PinSticker(sticker.uid, sticker.order, sticker.title, sticker.text, sticker.color, sticker.textcolor, sticker.height);
    }

    set_handlers()
    {
        super.set_handlers();

        let $element = this.get_html();

        let droped;
        let init_pos;
        let $move = $element.find('.moveb').attr('draggable', true).removeClass('disabled').removeAttr('disabled');
        $move[0].addEventListener("dragstart", (ev) => {
            if (!!Sticker.lock) {
                ev.preventDefault();
                rcmail.display_message('Une action est déjà en cours !');
                return;
            }
            ev.dataTransfer.dropEffect = "move";

            droped = false;
            init_pos = this.pos;

            var img = new Image();
            img.src = '';
            ev.dataTransfer.setDragImage(img, 10, 10);
            
            ev.dataTransfer.setData("text/plain", this.uid);

            if ($('.drag-zone').length > 0) $('.drag-zone').remove();
            
            let $drag = $('<div class="drag-zone"></div>').appendTo($('body'));
            $drag[0].addEventListener('dragover', (ev) => {
                ev.preventDefault();

                this.update_pos(new Point(ev.clientX, ev.clientY));
            });

            $drag[0].addEventListener('drop', (ev) => {
                ev.preventDefault();

                console.log('ev', ev);
                droped = true; 
            });
        });

        $move[0].addEventListener("dragend", (ev) => {
            console.log('evend', ev);

            if (!droped) {
                this.update_pos(init_pos);
            }
            else {
                this.post('pin_move', {
                    _uid:this.uid.replace('pin-', ''),
                    _x:this.pos.x,
                    _y:this.pos.y,
                    _initX:window.outerWidth
                }, true);
                rcmail.env.mel_metapages_notes[this.uid.replace('pin-', '')].pin_pos = [this.pos.x, this.pos.y];
                rcmail.env.mel_metapages_notes[this.uid.replace('pin-', '')].pin_pos_init = [window.outerWidth];
            }

            if ($('.drag-zone').length > 0) $('.drag-zone').remove();

            droped = null;
            init_pos = null;
        });
    }

    /**
     * 
     * @param {Point} pos 
     */
    update_pos(pos) {
        this.pos = pos;

        let $element = this.get_html();

        if ($element.length  > 0) {
            $element.css('top', `${pos.y}px`)
                    .css('left', `${pos.x}px`)
        }

        return this;
    }

}