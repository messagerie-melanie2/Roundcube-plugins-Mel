export class Roundcube_Mel_Color{

    constructor() {
        this.init().setup();
    }

    init()
    {
        this.color = '';
        return this;
    }

    setup()
    {
        this.color = mel_metapage.Storage.get(Roundcube_Mel_Color.storageKey);

        if (!this.color){
            this.color = rcmail.get_cookie(Roundcube_Mel_Color.cookieKey);
        }

        if (!this.color){
            if($('html').hasClass('dark-mode')) this.color = Roundcube_Mel_Color.dark;
            else this.color = Roundcube_Mel_Color.light;
        }
        return this;
    }

    isDarkMode()
    {
        return this.color === Roundcube_Mel_Color.dark;
    }

    isLightMode()
    {
        return this.color === Roundcube_Mel_Color.light;
    }

    switch_color()
    {
        Roundcube_Mel_Color.switch_theme_function();
        return this.setup();
    }

    setColor(color)
    {
        if (color === Roundcube_Mel_Color.light && this.isDarkMode()) this.switch_color();
        else if (color === Roundcube_Mel_Color.dark && this.isLightMode()) this.switch_color();
        else if (color !== Roundcube_Mel_Color.dark && color !== Roundcube_Mel_Color.light)
        {
            throw `###[Roundcube_Mel_Color]La couleur ${color} n'éxiste pas...`;
        }
        return this;
    }

    update()
    {
        return this.setup();
    }
}

Object.defineProperty(Roundcube_Mel_Color, 'light', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'light'
});

Object.defineProperty(Roundcube_Mel_Color, 'dark', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'dark'
});

Object.defineProperty(Roundcube_Mel_Color, 'storageKey', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'colorMode'
});

Object.defineProperty(Roundcube_Mel_Color, 'cookieKey', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'colorMode'
});

Object.defineProperty(Roundcube_Mel_Color, 'html_dark_mode_class', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:'dark-mode'
});

Object.defineProperty(Roundcube_Mel_Color, 'switch_theme_function', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:() => {
        MEL_ELASTIC_UI.switch_color();
    }
});