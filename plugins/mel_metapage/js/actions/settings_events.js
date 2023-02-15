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
            if (!!rcmail.env.customUid) $('#settings-suggest-frame')[0].src = $('#settings-suggest-frame')[0].src + `#${rcmail.env.customUid}`;
        }
    });
});