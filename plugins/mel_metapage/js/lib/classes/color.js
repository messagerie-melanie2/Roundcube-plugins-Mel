import { Random } from "./random.js";

export {Color, ColorRGBA, ColorFromVariable};

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
        let _r = r;
        let _g = g;
        let _b = b;
        Object.defineProperties(this, {
            r: {
                get: function() {
                    return _r;
                },
                set:(val) => {
                    _r = this._set_color_value(val);
                },
                configurable: true
            },  
            g: {
                get: function() {
                    return _g;
                },
                set:(val) => {
                    _g = this._set_color_value(val);
                },
                configurable: true
            },       
            b: {
                get: function() {
                    return _b;
                },
                set:(val) => {
                    _b = this._set_color_value(val);
                },
                configurable: true
            },                 
        });

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

    toString() {
        return this.toHexa();
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

Object.defineProperties(Color, {
    white:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new Color(Color.MAX, Color.MAX, Color.MAX)  
    },    
    black:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new Color(Color.MIN, Color.MIN, Color.MIN)  
    },
    red:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new Color(Color.MAX, Color.MIN, Color.MIN)  
    },
    green:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new Color(Color.MIN, Color.MAX, Color.MIN)  
    },
    blue:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new Color(Color.MIN, Color.MIN, Color.MAX)  
    },
    random:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new Color(Random.intRange(Color.MIN, Color.MAX), Random.intRange(Color.MIN, Color.MAX), Random.intRange(Color.MIN, Color.MAX))  
    },
});

class ColorRGBA extends Color {
    constructor(r, g, b, a = ColorRGBA.MAX) {
        super(r, g, b);
        this.__init().__setup(a);
    }

    __init() {
        this.a = ColorRGBA.MIN;

        return this;
    }

    __setup(alpha) {
        let _a = alpha;

        Object.defineProperties(this, {
            a: {
                get: function() {
                    return _a;
                },
                set:(val) => {
                    _a = this._set_alpha_value(val);
                },
                configurable: true
            }               
        });

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

Object.defineProperties(ColorRGBA, {
    white:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new ColorRGBA(Color.MAX, Color.MAX, Color.MAX)  
    },    
    black:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new ColorRGBA(Color.MIN, Color.MIN, Color.MIN)  
    },
    red:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new ColorRGBA(Color.MAX, Color.MIN, Color.MIN)  
    },
    green:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new ColorRGBA(Color.MIN, Color.MAX, Color.MIN)  
    },
    blue:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new ColorRGBA(Color.MIN, Color.MIN, Color.MAX)  
    },
    invisible:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new ColorRGBA(Color.MIN, Color.MIN, Color.MIN, ColorRGBA.MIN)  
    },
    random:{
        enumerable: false,
        configurable: false,
        writable: false,
        value:new ColorRGBA(Random.intRange(Color.MIN, Color.MAX), Random.intRange(Color.MIN, Color.MAX), Random.intRange(Color.MIN, Color.MAX), Random.range(ColorRGBA.MIN, ColorRGBA.MAX))  
    },
});

class ColorFromVariable extends ColorRGBA {
    constructor(varName){
        super(0, 0, 0, 0);

        let _var = null;
        Object.defineProperties(this, {
            var: {
                get: function() {
                    return _var;
                },
                set:(val) => {
                    _var = val;

                    if (!_var) {
                        this.r = null;
                        this.g = null;
                        this.b = null;
                        this.a = null;
                    }
                    else {
                        this.r = Color.MIN;
                        this.g = Color.MIN;
                        this.b = Color.MIN;
                        this.a = ColorRGBA.MAX;
                    }
                },
                configurable: true
            }               
        });

        _var = varName;
    }

    _set_color_value(color) {
        if (ColorFromVariable.isNullOrUndefined(color)) return null;
        else {
            color = super._set_color_value(color);
            this._set_colors();
            return color;
        }
    }

    _set_alpha_value(alpha) {
        if (ColorFromVariable.isNullOrUndefined(alpha)) return null;
        else {
            alpha = super._set_alpha_value(alpha);
            this._set_colors();
            return alpha;
        }
    }

    _set_colors() {
        if (!!this.var) this.var = null;

        if (!this.r) this.r = Color.MIN;
        if (!this.g) this.g = Color.MIN;
        if (!this.b) this.b = Color.MIN;
        if (ColorFromVariable.isNullOrUndefined(this.a)) this.a = ColorRGBA.MAX;

        return this;
    }

    is_variable() {
        return !!this.var;
    }

    toColor() {
        return new ColorRGBA(this.r ?? Color.MIN, this.g ?? Color.MIN, this.b ?? Color.MIN, this.a ?? ColorRGBA.MAX);
    }

    toHexa() {
        if (this.is_variable()) throw 'Impossible sur les variables !';

        return super.toHexa();
     }

     toRGB() {
        if (this.is_variable()) throw 'Impossible sur les variables !';

        return super.toRGB();
    }
 
    toRGBA() {
        if (this.is_variable()) throw 'Impossible sur les variables !';

        return super.toRGBA();
    }

    toString() {
        return this.is_variable() ? `var(--${this.var})` : super.toString();
    }


    static isNullOrUndefined(val) {
        return null === val || undefined === val;
    }
}