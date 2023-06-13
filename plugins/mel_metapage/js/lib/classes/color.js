export {Color, ColorRGBA};

class Color {
    constructor(r, g, b) {
        return this._init()._setup(r, g, b);
    }

    _init() {
        this.r = Color.MIN;
        this.g = Color.MIN;
        this.b = Color.MIN;

        return this;
    }

    _setup(r, g, b) {
        this.r = this._set_color_value(r);
        this.g = this._set_color_value(g);
        this.b = this._set_color_value(b);

        return this;
    }

    _set_color_value(color) {
        if (color < Color.MIN) return Color.MIN;
        else if (color > Color.MAX) return Color.MAX;

        return color;
    }

    toHexa() {
        return "#" + componentToHex(this.r) + componentToHex(this.g) + componentToHex(this.b);
    }

    toRGB() {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }

    /**
    * Change une valeur en hexadécimal
    * @param {number} c Valeur décimale
    * @returns Valeur hexadécimal
    */
    _componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    static fromHexa(hexa) {
        throw 'TODO';
    }
}

Object.defineProperty(Color, 'MIN', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:0
});

  Object.defineProperty(Color, 'MAX', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:255
});

class ColorRGBA extends Color {
    constructor(r, g, b, a) {
        super(r, g, b);
        this.__init().__setup(a);
    }

    __init() {
        this.a = ColorRGBA.MIN;

        return this;
    }

    __setup(alpha) {
        this.a = this._set_alpha_value(alpha);

        return this;
    }

    _set_alpha_value(alpha) {
        if (alpha < ColorRGBA.MIN) return ColorRGBA.MIN;
        else if (alpha > ColorRGBA.MAX) return ColorRGBA.MAX;

        return alpha;
    }

    toHexa() {
       return super.toHexa() +this._componentToHex(~~(this.a * 255));
    }

    toRGBA() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
}

Object.defineProperty(ColorRGBA, 'MIN', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:0
});

  Object.defineProperty(ColorRGBA, 'MAX', {
    enumerable: false,
    configurable: false,
    writable: false,
    value:1
});