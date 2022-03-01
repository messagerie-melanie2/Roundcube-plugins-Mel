Array.AddIfExist = function(array,test, item)
{
    //console.log("AddIfExist", !Enumerable.from(this).where(x => test(x, item)).any(), item);
    try {
        if(!Enumerable.from(this).where(x => test(x, item)).any())
        array.push(item);
        return array;
    } catch (error) {
        
    }
}

$(document).ready(() => {
    Enumerable.prototype.toJsonDictionnary = function toJsonDictionnary (keySelector, valueSelector) {

        var object = {};
        var alreadyExist = [];
        var source = this.getEnumerator();
    
        while(source.moveNext())
        {
            const current = source.current();
            const key = keySelector(current);
            const value = valueSelector(current);
    
            if (object[key] === undefined)
            {
                object[key] = value;
            }
            else {
                if (alreadyExist.includes(key))
                    object[key].push(value);
                else
                {
                    object[key] = [object[key], value];
                }
            }
        }
    
        return object;
    
    };

    Enumerable.prototype[Symbol.iterator] = function* () {
        var source = this.getEnumerator();
    
        while(source.moveNext())
        {
            yield source.current();
        }
    };
});

// (function($) {
//     $.fn.hasScrollBar = function() {
//         return this.get(0).scrollHeight > this.height();
//     }
// })(jQuery);