$(document).ready(() => {

    function set_on_change(selector, table_selector)
    {
        $(selector).on('change', () => {
            const checked = $(selector)[0].checked;
    
            if (checked) $(table_selector).css('display', 'none');
            else $(table_selector).css('display', '');
        });

        return {
            set_on_change
        }
    }

    set_on_change('#search_on_all_bal', '#balp-select').set_on_change('#search_on_all_bali_folders', '#bali-select');
});