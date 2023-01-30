$(document).ready(() => {
    const suspect_url_show_button = 'su-mel-default-button';
    const suspect_url_custom_show_button = 'su-mel-custom-button';
    const add_suspect_button = 'add-custom-su';

    $(`#${suspect_url_show_button}`).click(() => {
        let $e = $(`#${suspect_url_show_button}`);

        if ($e.hasClass('su-default-state'))
        {
            $e.removeClass('su-default-state').addClass('su-visu-state');
            $e.find('span').removeClass('icon-mel-chevron-right').addClass('icon-mel-chevron-down');
            $('#supects-urls-list').css('display', '');
        }
        else {
            $e.removeClass('su-visu-state').addClass('su-default-state');
            $e.find('span').removeClass('icon-mel-chevron-down').addClass('icon-mel-chevron-right');
            $('#supects-urls-list').css('display', 'none');
        }
    })
    .addClass('mel-button btn btn-secondary no-button-margin su-default-state')
    .append('<span class="icon-mel-chevron-right"></span>');

    $(`#${suspect_url_custom_show_button}`).click(() => {
        let $e = $(`#${suspect_url_custom_show_button}`);

        if ($e.hasClass('su-default-state'))
        {
            $e.removeClass('su-default-state').addClass('su-visu-state');
            $e.find('span').removeClass('icon-mel-chevron-right').addClass('icon-mel-chevron-down');
            $('#su-mel-custom_list').css('display', '');
        }
        else {
            $e.removeClass('su-visu-state').addClass('su-default-state');
            $e.find('span').removeClass('icon-mel-chevron-down').addClass('icon-mel-chevron-right');
            $('#su-mel-custom_list').css('display', 'none');
        }
    })
    .addClass('mel-button btn btn-secondary no-button-margin su-visu-state')
    .append('<span class="icon-mel-chevron-down"></span>');

    let it = 0;
    $(`#${add_suspect_button}`).click(() => {
        let $item = $(`
        <div class="row" data-row="${it}">
            <div class="col-7">
                <input class="form-control input-mel" type="text" value="" placeholder="Nouvelle url suspecte..." name="created_${it}" />
            </div>
            <div class="col-3">
                <input type="checkbox" name="bloqued_${it}" />
            </div>
            <div class="col-2">
                <button type="button" class="btn-danger mel-button btn no-button-margin">
                    <span class="icon-mel-trash"></span>
                </button>
            </div>
        </div>
        </div>
        `);
        $item.find('button').click((e) => {
            e = $(e.currentTarget);
            const data = e.data('row');
    
            if (data !== null && data !== undefined) e.parent().parent().remove();
            else e.parent().parent().css('display', 'none').find('input[type="text"]').val('');
    
        });
        $('#su-mel-custom_list').append($item);
        ++it;
    })
    .addClass('mel-button btn btn-secondary no-button-margin')
    .append('<span>Ajouter <span style="margin-left:25px" class="plus icon-mel-plus"></span></span>');

    // $('#su-save').click(() => {
    //     let config = {};

    //     $('#supects-urls-list')

    // });

    $('.su-delete-custom').click((e) => {
        e = $(e.currentTarget);
        const data = e.data('row');

        if (data !== null && data !== undefined) e.parent().parent().remove();
        else e.parent().parent().css('display', 'none').find('input[type="text"]').val('');

    }).addClass('btn-danger mel-button btn no-button-margin');


});