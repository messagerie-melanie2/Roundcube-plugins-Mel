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

    window.loadJsModule = loadJsModule;
    window.unloadModule = unloadModule;
})();