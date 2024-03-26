/** 
 * @module Color
 */
import { Random } from "./random.js";

export {Color, ColorRGBA, ColorFromVariable};

/**
 * Classe représentant une couleur rgb, les valeurs vont de 0 à 255.
 */
class Color {
    /**
     * Constructeur de la classe
     * @param {number} r Rouge 
     * @param {number} g Vert
     * @param {number} b bleu 
     * @returns 
     */
    constructor(r, g, b) {
        return this._init()._setup(r, g, b);
    }

    /**
     * Initialise la classe
     * @private
     * @returns Chaînage
     */
    _init() {
        /**
         * Composante rouge
         * @type {number}
         */
        this.r = Color.MIN;
        /**
         * Composante verte
         * @type {number}
         */
        this.g = Color.MIN;
        /**
         * Composante bleu
         * @type {number}
         */
        this.b = Color.MIN;

        return this;
    }

    /**
     * Assigne les variables de la classe
     * @private
     * @param {number} r Rouge 
     * @param {number} g Vert
     * @param {number} b bleu 
     * @returns Chaînage
     */
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

    /**
     * Met la valeur de la couleur dans la bonne fourchette (0-255)
     * @private
     * @param {number} color Couleur rouge, verte ou bleue
     * @returns {number} Valeur inchangé, 0 ou 255
     */
    _set_color_value(color) {
        if (color < Color.MIN) return Color.MIN;
        else if (color > Color.MAX) return Color.MAX;

        return color;
    }

    /**
     * Renvoie la couleur sous format hexadécimal
     * @returns {string}
     */
    toHexa() {
        return "#" + this._componentToHex(this.r) + this._componentToHex(this.g) + this._componentToHex(this.b);
    }

    /**
     * Renvoie la couleur sous forme rgb 
     * @returns {string} rgb(r, g, b)
     */
    toRGB() {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }

    toString() {
        return this.toHexa();
    }

    /**
    * Change une valeur en hexadécimal
    * @private
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

    /**
     * 
     * @param {*} color 
     * @returns {null | Color}
     */
    static fromRGB(color) {
        try {
            color = mel_metapage.Functions.colors.kMel_extractRGB(color);
        } catch (error) {
            color = null;    
        }

        if (!!color) {
            color = new Color(+color[0], +color[1], +color[2]);
        }

        return color;
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


Color.random = new Color();
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

/**
 * Classe représentant une couleur rgb avec de la transparence, les valeurs vont de 0 à 255, de 0 à 1 pour l'alpha
 */
class ColorRGBA extends Color {
    /**
     * Constructeur de la classe
     * @param {number} r Rouge 
     * @param {number} g Vert
     * @param {number} b bleu 
     * @param {number} a transparence
     */
    constructor(r, g, b, a = ColorRGBA.MAX) {
        super(r, g, b);
        this.__init().__setup(a);
    }

     /**
     * Initialise la classe
     * @private
     * @returns Chaînage
     */
    __init() {
        /**
         * Composante alpha (transparence)
         * @type {number}
         */
        this.a = ColorRGBA.MIN;

        return this;
    }

    /**
     * Assigne les variables de la classe
     * @private
     * @param {number} alpha transparence
     * @returns Chaînage
     */
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

    /**
     * Renvoie la couleur sous format hexadécimal
     * @returns {string}
     */
    toHexa() {
       return super.toHexa() +this._componentToHex(~~(this.a * 255));
    }

    /**
     * Renvoie la couleur sous forme rgba
     * @returns {string} rgb(r, g, b, a)
     */
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