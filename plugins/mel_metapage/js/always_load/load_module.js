(() => {
    const UNLOAD_TIME_MS = 60 * 5 * 1000;

    let modules = {};
    let promises = {};

    function getKey(plugin, name) {
        return plugin+'/'+name;
    }

    async function loadJsModule(plugin, name) {
        const key = getKey(plugin, name);
        if (!modules[key]) {
            console.info('Load module', key);
            try {
                modules[key] = await import(`../../../${plugin}/js/lib/${name}`);
            } catch (error) {
                console.error(`###[loadJsModule]Impossible de charger le module ${key}`, error);
                throw error;
            }
        }

        if (!!modules[key]?.timeout) clearTimeout(modules[key].timeout);

        modules[key].timeout = setTimeout((key) => {
            unloadModuleFromKey(key);
        }, UNLOAD_TIME_MS, key);
        return modules[key];
    }

    function unloadModule(plugin, name) {
        unloadModuleFromKey(getKey(plugin, name));
        
    }

    function unloadModuleFromKey(key) {
        console.info('unload module : ', key);
        clearTimeout(modules[key].timeout);
        modules[key] = null;
        delete promises[key];
    }

    async function runModule(plugin, name = 'main') {
        promises[getKey(plugin, name)] = loadJsModule(plugin, name);
        const module = getMainModule(await promises[getKey(plugin, name)]);
        // const Main = (await loadJsModule('mel_metapage', 'main'))?.['Main'];
        // Main.call();
        return module;
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

    window.loadJsModule = loadJsModule;
    window.unloadModule = unloadModule;
    window.runModule = runModule;
    window.awaitModules = await_modules;

})();