export {isNullOrUndefined, isArrayLike};

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