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

// (function($) {
//     $.fn.hasScrollBar = function() {
//         return this.get(0).scrollHeight > this.height();
//     }
// })(jQuery);