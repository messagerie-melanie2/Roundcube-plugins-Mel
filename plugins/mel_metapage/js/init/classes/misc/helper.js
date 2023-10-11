var module_helper_mel = module_helper_mel || (() => {
    async function load_mel_object() {
        const {MelObject} = await loadJsModule('mel_metapage', 'mel_object.js');

        return MelObject;
    }

    function load_calendar_events() {
        const events = mel_metapage.Storage.get('all_events_2');
        try {
            return JSON.parse(events);
        } catch (error) {
            return events;
        }
    }

    async function BnumConnector() {
        const loadJsModule = window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;

        if (!!loadJsModule) {
            const {BnumConnector} = await loadJsModule('mel_metapage', 'bnum_connections.js', '/js/lib/helpers/bnum_connections/');

            return BnumConnector;
        }

        throw new Error('loadJsModule not found');
    }

    return {
        load_mel_object,
        load_calendar_events,
        BnumConnector
    }
})();