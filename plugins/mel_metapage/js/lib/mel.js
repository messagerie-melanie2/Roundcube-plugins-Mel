export {isNullOrUndefined, isArrayLike, Classes, toHex};

/**
 * Renvoie vrai si la variable vaut `null` ou `undefined`.
 * @param {*} item Variable à tester
 * @returns {boolean}
 */
function isNullOrUndefined(item)
{
	return item === null || item === undefined;
}


/**
 * Vérifie si une varible est un tableau ou quelque chose qui y ressemble
 * @param {*} item 
 * @returns {bool}
 */
function isArrayLike(item) {
    return (
        (!!item &&
          typeof item === "object" &&
          item.hasOwnProperty("length") && 
          typeof item.length === "number" && 
          item.length > 0 && 
          (item.length - 1) in item
        )
    );
}

/**
 * Change un nombre en base 10 en hexadécimal
 * @param {number} number 
 * @returns {string} Hexadecimal number
 */
function toHex(number) {
    return number.toString(16);
}

var Classes = (baseClass, ...mixins) => {
  class base extends baseClass {
      constructor (...args) {
          super(...args);
          mixins.forEach((mixin) => {
              copyProps(this,(new mixin));
          });
      }
  }
  let copyProps = (target, source) => {  // this function copies all properties and symbols, filtering out some special ones
      Object.getOwnPropertyNames(source)
            .concat(Object.getOwnPropertySymbols(source))
            .forEach((prop) => {
               if (!prop.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/))
                  Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
             })
  }
  mixins.forEach((mixin) => { // outside contructor() to allow aggregation(A,B,C).staticFunction() to be called etc.
      copyProps(base.prototype, mixin.prototype);
      copyProps(base, mixin);
  });
  return base;
}