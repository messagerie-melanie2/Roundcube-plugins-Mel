(() => {
$(document).ready(function() {
    rcmail.addEventListener('create_modal.init', function(args) {
        args.config.bottom_left = args.manager.create_button('folder_open', 'Un document', () => {
            m_mp_InitializeDocument();
            args.manager.hide();
        });

        return args;
    });
});

})();