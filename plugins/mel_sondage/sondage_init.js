(() => {
$(document).ready(function() {
    rcmail.addEventListener('create_modal.init', function(args) {
        args.config.bottom_right_corner = args.manager.create_button('bar_chart', 'Un sondage', () => {
            m_mp_sondage()
            args.manager.hide();
        });

        return args;
    });
});

})();