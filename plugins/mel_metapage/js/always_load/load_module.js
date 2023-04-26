(() => {
    const UNLOAD_TIME_MS = 60 * 5 * 1000;

    let modules = {};

    function getKey(plugin, name) {
        return plugin+'/'+name;
    }

    async function loadJsModule(plugin, name) {
        const key = getKey(plugin, name);
        if (!modules[key]) {
            modules[key] = await import(`../../../${plugin}/js/lib/${name}`);
            modules[key].timeout = setTimeout((key) => {
                unloadModuleFromKey(key);
            }, UNLOAD_TIME_MS, key);
        }
        return modules[key];
    }

    function unloadModule(plugin, name) {
        unloadModuleFromKey(getKey(plugin, name));
    }

    function unloadModuleFromKey(key) {
        console.log('unload module : ', key);
        modules[key] = null;
    }

    async function runModule(plugin) {
        const module = getMainModule(await loadJsModule(plugin, 'main'));
        const Main = (await loadJsModule('mel_metapage', 'main'))?.['Main'];
        Main.call();
        return module;
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

    window.loadJsModule = loadJsModule;
    window.unloadModule = unloadModule;
    window.runModule = runModule;


})();