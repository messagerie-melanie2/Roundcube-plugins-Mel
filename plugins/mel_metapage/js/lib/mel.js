export {isNullOrUndefined};

/**
 * Renvoie vrai si la variable vaut `null` ou `undefined`.
 * @param {*} item Variable à tester
 * @returns {boolean}
 */
function isNullOrUndefined(item)
{
	return item === null || item === undefined;
}