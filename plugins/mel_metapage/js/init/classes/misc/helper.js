var module_helper_mel =
  module_helper_mel ||
  (() => {
    class Look {
      static async _LoadModule() {
        const loadJsModule =
          window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;

        if (loadJsModule) {
          const { Look } = await loadJsModule(
            'mel_metapage',
            'metrics.js',
            '/js/lib/classes/',
          );

          return Look;
        }

        throw new Error('loadJsModule not found');
      }

      static async SendTask(task) {
        const Look = await this._LoadModule();

        return await Look.SendTask(task);
      }

      static async Send(name, value) {
        const Look = await this._LoadModule();

        return await Look.Send(name, value);
      }
    }

    async function load_mel_object() {
      const { MelObject } = await loadJsModule('mel_metapage', 'mel_object.js');

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
      const loadJsModule =
        window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;

      if (loadJsModule) {
        const { BnumConnector } = await loadJsModule(
          'mel_metapage',
          'bnum_connections.js',
          '/js/lib/helpers/bnum_connections/',
        );

        return BnumConnector;
      }

      throw new Error('loadJsModule not found');
    }

    async function JsHtml() {
      const loadJsModule =
        window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;

      if (loadJsModule) {
        const { MelJsHtml } = await loadJsModule(
          'mel_metapage',
          'JsMelHtml.js',
          '/js/lib/html/JsHtml/',
        );

        return MelJsHtml;
      }

      throw new Error('loadJsModule not found');
    }

    return {
      load_mel_object,
      load_calendar_events,
      BnumConnector,
      JsHtml,
      Look,
    };
  })();
