(() => {

function notes()
{
    if (top.$('.mel-note').length > 0 || window !== top) return;

    if (rcmail.env.task === 'login' || rcmail.env.task === 'logout') return;

    /**
     * Plugin qui contient la localization pour rcmail.gettext
     */
    const plugin_text = 'mel_metapage';

    /**
     * Couleur d'arrière plan de base
     */
    const base_color = "#E6B905";
    /**
     * Couleur du texte de base
     */
    const base_text_color = "#000000";
    /**
     * Id par défaut lorsqu'il n'y a pas de notes
     */
    const default_note_uid = 'create';

    /**
     * Change une valeur en hexadécimal
     * @param {number} c Valeur décimale
     * @returns Valeur hexadécimal
     */
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    /**
     * Récupère la valeur hexadécimal d'un rgb.
     * @param {number} r Valeur rouge
     * @param {number} g Valeur vert
     * @param {number} b Valeur bleu
     * @returns Hexadécimal
     */
    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    /**
     * @async Permet de créer une nouvelle note
     */
    window.create_note = async () => {
        //On ferme la popup global si il y en a une
        if (window.create_popUp !== undefined) window.create_popUp.close();

        //On ouvre "Mes raccourcis"
        $("#button-shortcut").click();
        rcmail.set_busy(true, "loading");
        
        //Si il n'y a pas de note côté stockage, on ajoute cellle par défaut
        if (rcmail.env.mel_metapages_notes[default_note_uid] !== undefined) await rcmail.env.mel_metapages_notes[default_note_uid].post_add();
        
        //On créer une nouvelle note
        new Sticker("", -1, "", "").post_add().then(() => {
            rcmail.set_busy(false);

            rcmail.clear_messages();
            rcmail.display_message(rcmail.gettext('note_created_success', plugin_text), "confirmation");
            $('.mel-note').last().find("textarea")[0].focus();
        });
    };



    //Si il n'y a pas de note, il y en a une par défaut
    if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0)
    {
        rcmail.env.mel_metapages_notes = {};
        rcmail.env.mel_metapages_notes[default_note_uid] = new Sticker(default_note_uid, 0, "", "");
    }

    //Ajout des notes au bouton "Mes raccourcis"
    top.mm_add_shortcut("notes", Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html()).toArray().join(' '), true, 'Notes');

    //Lorsque l'on appuie sur le bouton "Mes raccourcis" pour la première fois
    top.rcmail.addEventListener("apps.create", () => {
        if (top.$('.mel-note').length > 0)
        {
            top.$('.mel-note').each((i, e) => {
                Sticker.fromHtml(top.$(e).attr("id").replace('note-', '')).set_handlers();
            });
        }
        else {
            const interval = setInterval(() => {
                if (!!top.shortcuts)
                {
                    if (top.$('.mel-note').length === 0) top.mm_add_shortcut("notes", Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html()).toArray().join(' '), true, 'Notes');
                    else clearInterval(interval);
                }
            }, 100);
        }

        if (rcmail.env.mel_metapages_notes_edited === true)
        {
            rcmail.triggerEvent('notes.master.update', {datas:rcmail.env.mel_metapages_notes});
            rcmail.env.mel_metapages_notes_edited = false;
        }
    });

    top.rcmail.addEventListener('notes.master.update', (args) => {
        rcmail.env.mel_metapages_notes_edited = true;
        rcmail.env.mel_metapages_notes = args.datas;

        let $eyes = $('.shortcut-notes .icon-mel-eye-crossed');
        if ($eyes.length > 0) $eyes.click();

        if (Enumerable.from(rcmail.env.mel_metapages_notes).count() === 0)
        {
            rcmail.env.mel_metapages_notes = {};
            rcmail.env.mel_metapages_notes[default_note_uid] = new Sticker("create", 0, "", "");
        }

        $('.shortcut-notes .square-contents').html(
            Enumerable.from(rcmail.env.mel_metapages_notes).orderBy(x => x.value.order).select(x => Sticker.from(x.value).html()).toArray().join(' ')
        );

        $('.mel-note').each((i, e) => {
            Sticker.fromHtml($(e).attr("id").replace('note-', '')).set_handlers();
        });
    });

    top.rcmail.addEventListener('notes.master.edit', (args) => {
        rcmail.env.mel_metapages_notes[args.id].text = args.text;
        return Sticker.from(rcmail.env.mel_metapages_notes[args.id]).post_update().then(() => {
            rcmail.triggerEvent('notes.master.update', {datas:rcmail.env.mel_metapages_notes});
        });
    });

    top.rcmail.addEventListener('notes.apps.updated', (x) => {
        $('iframe.mm-frame').each((i, e) => {
            try {
                e.contentWindow.rcmail.env.mel_metapages_notes = x;
                e.contentWindow.rcmail.triggerEvent('notes.apps.updated');
            } catch (error) {
                
            }
        });
    });
}

$(document).ready(() => {
    try {
        notes();
    } catch (error) {
        
    }
});

})();