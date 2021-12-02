class MetapageObject {
 
    constructor(...args) {
      if (this.constructor === MetapageObject) {
        throw new TypeError('Abstract class "MetapageObject" cannot be instantiated directly');
      }
      this.init(...args);
      this.setup(...args);
      this.define_constant("initialized", true);
    }

    init(...args)
    {
        throw new Error('You must implement this function');
    }

    setup(...args)
    {
        throw new Error('You must implement this function');
    }
   
    define_constant(key, value)
    {
        Object.defineProperty(this, key, {
            enumerable: false,
            configurable: false,
            writable: false,
            value
          });

        return this;
    }

    define_constant2(key_value)
    {
        key_value = key_value.replaceAll('"', '').split(":");
        Object.defineProperty(this, key_value[0], {
            enumerable: false,
            configurable: false,
            writable: false,
            value:key_value[1]
          });

        return this;
    }
}

class EmptyMetapageObject extends MetapageObject
{
    constructor()
    {
        super()
    }

    init() {}

    setup() {}
}

