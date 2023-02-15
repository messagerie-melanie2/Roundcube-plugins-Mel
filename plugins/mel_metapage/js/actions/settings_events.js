$(document).ready(() => {
    rcmail.addEventListener('init', () => {
        if (rcmail.env.action !== 'plugin.mel_suggestion_box')
        {
            const section = rcmail.env.open_section;
            const id = `rcmrow${section}`;
            let $querry = $(`#${id}`);
        
            if ($querry.length > 0) $querry.mousedown();
        }
        else {
            const SELECTOR_ID = '#';
            const FRAME_ID = 'settings-suggest-frame';
            const FRAME_SELECTOR = SELECTOR_ID + FRAME_ID;
            const FRAME_URL_KEY = SELECTOR_ID;
            if (!!rcmail.env.customUid) {
                let src = $(FRAME_SELECTOR)[0].src;
                if (src.includes(FRAME_URL_KEY)) src.split(FRAME_URL_KEY)[0];
                $(FRAME_SELECTOR)[0].src = `${src}${FRAME_URL_KEY}${rcmail.env.customUid}`;
                src = null;
            }
        }
    });
});