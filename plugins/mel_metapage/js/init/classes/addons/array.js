Array.prototype.AddIfExist = function(test, item)
{
    //console.log("AddIfExist", !Enumerable.from(this).where(x => test(x, item)).any(), item);
    if(!Enumerable.from(this).where(x => test(x, item)).any())
        this.push(item);
}