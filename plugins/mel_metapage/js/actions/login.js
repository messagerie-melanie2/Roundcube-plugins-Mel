if (parent != window)
{
    parent.location.reload();
}

$(document).ready(() => {
    
    let color_mode = window.matchMedia('(prefers-color-scheme: dark)');
    color_mode.addListener(function(e) {
        let _color_mode = e.matches ? 'dark' : 'light';

        if (MEL_ELASTIC_UI.color_mode() !== _color_mode) MEL_ELASTIC_UI.switch_color();

        if (_color_mode === 'dark') $(".mel-logo").attr("src", 'skins/mel_elastic/images/taskbar-logo.svg');
        else $(".mel-logo").attr("src", 'plugins/mel_portal/skins/elastic/images/logoportal.svg');
        // switch_color_mode();
        // reset_cookie();
    });

    if (MEL_ELASTIC_UI.color_mode() === 'dark') $(".mel-logo").attr("src", 'skins/mel_elastic/images/taskbar-logo.svg')
    else $(".mel-logo").attr("src", 'plugins/mel_portal/skins/elastic/images/logoportal.svg');
    
});