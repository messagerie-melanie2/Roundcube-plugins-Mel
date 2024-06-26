//=============================================================================
// ** rcube_libcalendaring
//=============================================================================
if (window.rcube_libcalendaring)
{
    const alias_mel_rcube_libcalendaring_prototype_constructor = rcube_libcalendaring;
    rcube_libcalendaring = function (settings) {
        alias_mel_rcube_libcalendaring_prototype_constructor.call(this, settings);

        const alias_mel_this_snooze_dropdown = this.snooze_dropdown;
        this.snooze_dropdown = function(link, event)
        {
            if (this.snooze_popup && !document.contains(this.snooze_popup[0])) this.snooze_popup = null;
            
            alias_mel_this_snooze_dropdown.call(this, link, event);
        };
    };

    //setup static
    for (const key in alias_mel_rcube_libcalendaring_prototype_constructor) {
        if (Object.hasOwnProperty.call(alias_mel_rcube_libcalendaring_prototype_constructor, key)) {
            const element = alias_mel_rcube_libcalendaring_prototype_constructor[key];
            rcube_libcalendaring[key] = element;
            
        }
    }
}