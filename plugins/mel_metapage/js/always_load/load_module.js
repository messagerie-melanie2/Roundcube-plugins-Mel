(() => {
    const VERSION = 'X.X.X';
    const BASE_PATH = '/js/lib/';
    const UNLOAD_TIME_MS = 60 * 5 * 1000;

    let actions = {};
    let modules = {};
    let timeouts = {};
    let promises = {};

    function getKey(plugin, name, extra = EMPTY_STRING) {
        return plugin + '/' + name + (BASE_PATH === extra ? EMPTY_STRING : extra);
    }

    function add_js_to_name(name) {
        if (!name.includes('.js')) name += '.js';

        return name;
    }

    async function loadJsModule(plugin, name, path = BASE_PATH) {
        name = add_js_to_name(name);

        const key = getKey(plugin, name, path);
        if (!modules[key]) {
            console.info('Load module', key);
            try {
                modules[key] = await import(`../../../${plugin}${path}${name}?v=${VERSION}`);
            } catch (error) {
                console.error(`###[loadJsModule]Impossible de charger le module ${key}`, error);
                throw error;
            }
        }

        if (!!timeouts[key] && !!timeouts[key]) clearTimeout(timeouts[key]);

        timeouts[key] = setTimeout((key) => {
            unloadModuleFromKey(key);
        }, UNLOAD_TIME_MS, key);
        return modules[key];
    }

    function unloadModule(plugin, name, path) {
        name = add_js_to_name(name);
        unloadModuleFromKey(getKey(plugin, name, path));
    }

    function unloadModuleFromKey(key) {
        if (!!modules[key]) {
            console.info('unload module : ', key);
            if (!!timeouts[key]) {
                clearTimeout(timeouts[key]);
                timeouts[key] = null;
            }
            modules[key] = null;
            delete promises[key];
        }
    }

    async function runModule(plugin, name = 'main', path = BASE_PATH, save_in_memory = false) {
        name = add_js_to_name(name);
        const key = getKey(plugin, name, path);
        promises[key] = loadJsModule(plugin, name, path);
        const module = getMainModule(await promises[key]);
        
        if (save_in_memory) actions[key] = module;

        return module;
    }

    async function loadAction(plugin, name = 'main', path = BASE_PATH, waiting = 5) {
        name = add_js_to_name(name);
        const key = getKey(plugin, name, path);

        if (!actions[key]) {
            const Wait = (await loadJsModule('mel_metapage', 'mel_promise')).WaitSomething;

            await new Wait(() => !!actions[key], waiting);
        }

        return actions[key];
    }

    async function await_modules() {
        let waintings = [];

        const keys = Object.keys(promises);
        for (let index = 0, len = keys.length; index < len; ++index) {
            const key = keys[index];
            waintings.push(promises[key]);
        }

        await Promise.allSettled(waintings);
    }

    function getMainModule(modules) {
        if (!!modules['main']) return new modules['main']();
        else {
            for (const key in modules) {
                if (Object.hasOwnProperty.call(modules, key)) {
                    return new modules[key]();        
                }
            }
        }

        return null;
    }

    async function load_js_page(name, {
        plugin = 'mel_metapage',
        skin = (window?.rcmail?.env?.skin ?? '')
    }) {
        var {JsHtml} = await loadJsModule('mel_metapage', 'JsHtml.js', '/js/lib/html/JsHtml/');


        return await JsHtml.load_page(name, plugin, skin);
    }

    window.loadJsModule = loadJsModule;
    window.unloadModule = unloadModule;
    window.runModule = runModule;
    window.awaitModules = await_modules;
    window.loadAction = loadAction;
    window.loadJsPage = load_js_page;
    
    Object.defineProperties(window, {
        scriptVersion: {
            get: function() {
                return VERSION;
            },
            configurable: false
        },
        jsModulesBasePath: {
            get: function() {
                return BASE_PATH;
            },
            configurable: false
        }
    });

})();