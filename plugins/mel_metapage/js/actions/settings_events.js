$(document).ready(() => {
    rcmail.addEventListener('init', () => {
        const section = rcmail.env.open_section;
        const id = `rcmrow${section}`;
        let $querry = $(`#${id}`);
    
        if ($querry.length > 0) $querry.mousedown();
    });
});