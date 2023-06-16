export {RotomecaEnumerable as MelEnumerable};

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

class RotomecaKeyValuePair {
    constructor(key, value)
    {
        let _key = key;
        let _value = value;

        Object.defineProperties(this, {
            key: {
                get: () => {
                    return _key;
                },
                configurable: false
            },    
            value: {
                get: () => {
                    return _value;
                },
                configurable: false
            },        
        });
    }
}

class RotomecaGenerator 
{
    constructor(iterable)
    {
        this.iterable = iterable;
    }

    *[Symbol.iterator]() {
        for (const iterator of this.next()) {
            yield iterator;
        }
    }

    where(callback) {
        return new RotomecaWhereGenerator(this, callback);
    }

    select(callback)
    {
        return new RotomecaSelectGenerator(this, callback);
    }

    groupBy(key_selector, value_selector = null)
    {
        return new RotomecaGroupByGenerator(this, key_selector, value_selector);
    }

    orderBy(selector) {
        return new RotomecaOrderGenerator(this, selector);
    }

    orderByDescending(selector)
    {
        return new RotomecaOrderByDesendingGenerator(this, selector);
    }

    then(selector)
    {
        return new RotomecaThenGenerator(this, selector);
    }

    thenDescending(selector)
    {
        return new RotomecaThenDescendingGenerator(this, selector);
    }

    reverse() {
        return new RotomecaReverseGenerator(this);
    }

    take(howMany)
    {
        return new RotomecaTakeGenerator(this, howMany);
    }

    add(item) {
        return this.aggregate(item);
    }

    aggregate(iterable) {
        return new RotomecaAggegateGenerator(this, iterable);
    }

    remove(item) {
        return new RotomecaRemoveGenerator(this, item);
    }

    removeAt(index) {
        return new RotomecaRemoveAtIndexGenerator(this, index);
    }

    distinct(selector = null) {
        return new RotomecaDistinctGenerator(this, selector);
    }

    except(array){
        return new RotomecaExceptGenerator(this, array);
    }

    intersect(array) {
        return new RotomecaIntersectGenerator(this, array);
    }

    union(array, c = null) {
        return new RotomecaUnionGenerator(this, array, c);
    }

    any(callback = null)
    {
        let it = 0;
        for (const iterator of this) {
            if (!callback) return true;
            else if (callback(iterator, it++)) return true; 
        }

        return false;
    }

    all(callback = null)
    {
        return !this.any((value, index) => {
            return !callback(value, index);
        });
    } 

    contains(item) {
        return this.any((value, index) => {
            return value === item;
        });
    }

    first(callback = null)
    {
        const not_exist = Symbol();
        const value = this.firstOrDefault(not_exist, callback);

        if (value === not_exist) throw 'Item not exist';
        else return value;
    }

    firstOrDefault(default_value = null, callback = null)
    {
        let generator = callback ? this.where(callback) : this;

        for (const iterator of generator) {
            return iterator;
        }

        return default_value;
    }

    flat() {
        return new RotomecaFlatGenerator(this);
    }

    *next() {
        for (const iterator of this.iterable) {
            yield iterator;
        }
    }

    count() {
        if (!this.length){
            this.length = 0;
            for (const iterator of this) {
                ++this.length;
            }
        }

        return this.length;
    }

    toArray()
    {
        let arr = [];
        for (const iterator of this) {
            arr.push(iterator);
        }

        return arr;
    }

    toJsonObject(key_selector, value_selector)
    {
        let i = 0;
        let obj = {};
        for (const iterator of this) {
            obj[key_selector(iterator, i)] = value_selector(iterator, i);
            ++i;
        }

        return obj;
    }
}

class ARotomecaCallbackGenerator extends RotomecaGenerator
{
    constructor(iterable, callback)
    {
        super(iterable);
        this.callback = callback;
    }
}

class RotomecaWhereGenerator extends ARotomecaCallbackGenerator
{
    constructor(iterable, callback)
    {
        super(iterable, callback);
    }

    *next() {
        let star_parent = super.next();

        let i = 0;
        for (const iterator of star_parent) {
            if (this.callback(iterator, i++)) yield iterator;
        }
    }
}

class RotomecaSelectGenerator extends ARotomecaCallbackGenerator
{
    constructor(iterable, callback)
    {
        super(iterable, callback)
    }

    *next() {
        let star_parent = super.next();

        let i = 0;
        for (const iterator of star_parent) {
            yield this.callback(iterator, i++);
        }
    }
}

class ARotomecaKeyValueSelector extends ARotomecaCallbackGenerator
{
    constructor(iterable, key_selector, value_selector = null)
    {
        super(iterable, value_selector);
        this.key_selector = key_selector;
    }
}

class RotomecaGroupedItems {
    constructor(key, iterable)
    {
        this.iterable = iterable;
        this.key = key;
    }

    *next() {
        let star_parent = this.iterable;

        for (const iterator of star_parent) {
            yield new RotomecaKeyValuePair(this.key, iterator);
        }
    }

    get_values(try_get_array = true)
    {
        if (try_get_array && this.iterable instanceof RotomecaEnumerable)
        {
            if (Array.isArray(this.iterable.generator())) return this.iterable.generator();
            else if (this.iterable.generator() instanceof RotomecaGenerator && Array.isArray(this.iterable.generator().iterable)) return this.iterable.generator().iterable;
        }

        return this.iterable;
    }
}

class RotomecaGroupByGenerator extends ARotomecaKeyValueSelector {
    constructor(iterable, key_selector, value_selector = null)
    {
        super(iterable, key_selector, value_selector);
    }

    *next() {
        let star_parent = super.next();

        let key;
        let datas = {};
        for (const item of star_parent) {
            key = this.key_selector(item);

            if (!datas[key]) datas[key] = [];

            datas[key].push(!!this.callback ? this.callback(item) : item);
        }

        for (const key in datas) {
            if (Object.hasOwnProperty.call(datas, key)) {
                const element = datas[key];
                yield new RotomecaGroupedItems(key, RotomecaEnumerable.from(element));
            }
        }
    }
}

class ARotomecaOrderGenerator extends ARotomecaCallbackGenerator{
    constructor(iterable, selector)
    {
        super(iterable, selector);
    }

    sort(a, b) {
        return 0;
    }

    *next() {
        let star_parent = super.next();

        let array = [];

        for (const iterator of star_parent) {
            array.push(iterator);
        }

        array = array.sort((a, b) => {
            return this.sort(a, b);
        });

        for (const iterator of array) {
            yield iterator;
        }

        array = null;
    }
}

class RotomecaOrderGenerator extends ARotomecaOrderGenerator {
    constructor(iterable, selector)
    {
        super(iterable, selector);
    }

    sort(a, b)
    {
        super.sort(a, b);
        a = this.callback(a);
        b = this.callback(b);
        if (a > b) return 1;
        else if (b > a) return -1;
        return 0;
    }
}

class RotomecaOrderByDesendingGenerator extends RotomecaOrderGenerator{
    constructor(iterable, selector)
    {
        super(iterable, selector);
    }

    sort(a, b)
    {
        return -super.sort(a, b);
    }
}

class RotomecaThenGenerator extends ARotomecaOrderGenerator
{
    constructor(iterable, selector)
    {
        super(iterable, selector);
    }

    sort(a, b)
    {
        super.sort(a, b);
        if (a === b)
        {
            a = this.callback(a);
            b = this.callback(b);

            if (a > b) return 1;
            else if (b > a) return -1;
        }

        return 0;
    }
}

class RotomecaThenDescendingGenerator extends RotomecaThenGenerator
{
    constructor(iterable, selector)
    {
        super(iterable, selector);
    }

    sort(a, b)
    {
        return -super.sort(a,b);
    }
}

class ARotomecaItemModifierGenerator extends RotomecaGenerator
{
    constructor(iterable, item)
    {
        super(iterable);
        this.item = item;
    }
}

class RotomecaAggegateGenerator extends ARotomecaItemModifierGenerator
{
    constructor(iterable, item)
    {
        super(iterable, item);
    }

    *next() {
        let star_parent = super.next();

        for (const iterator of star_parent) {
            yield iterator;
        }

        if (Array.isArray(this.item) || typeof this.item[Symbol.iterator] === 'function')
        {
            for (const iterator of this.item) {
                yield iterator;
            }
        }
        else yield this.item;
    }
}

class ARotomecaRemoverGenerator extends ARotomecaItemModifierGenerator
{
    constructor(iterable, item)
    {
        super(iterable, item);
    }

    *next() {
        let star_parent = super.next();
        this.before();

        for (const iterator of star_parent) {
            if (this.compare(iterator) !== this.item) yield iterator;
        }

        this.after();
    }

    compare(item) {
        return item;
    }

    before() {}
    after() {}
}

class RotomecaRemoveGenerator extends ARotomecaRemoverGenerator
{
    constructor(iterable, item)
    {
        super(iterable, item);
    }

}

class RotomecaRemoveAtIndexGenerator extends ARotomecaRemoverGenerator
{
    constructor(iterable, item)
    {
        super(iterable, item);
        this.it = 0;
    }

    compare(item) {
        super.compare(item);
        return this.it++;
    }

    before() {
        super.before();
        this.it = 0;
    }
}

class RotomecaFlatGenerator extends RotomecaGenerator
{
    constructor(iterable)
    {
        super(iterable);
    }

    *next() {
        let star_parent = super.next();

        for (const iterator of star_parent) {
            yield* this.generate(iterator)
        }
    }

    *generate(iterator){
        if (this.check(iterator)){
            for (const item of iterator) {
                if (this.check(item)) {
                    yield* this.generate(item);
                }
                else yield item;
            }
        }
        else yield iterator;
    }

    check(iterator) {
        return typeof iterator !== 'string' && (Array.isArray(iterator) || isArrayLike(iterator) || typeof iterator[Symbol.iterator] === 'function');
    }

}

//TO ADD
class RotomecaDistinctGenerator extends ARotomecaCallbackGenerator
{
    constructor(iterable, selector) {
        super(iterable, selector);
    }

    *next() {
        let star_parent = super.next();
        let things = [];
        const have_selector = !!this.callback;

        let item;
        for (const iterator of star_parent) {
            item = have_selector ? this.callback(iterator) : iterator;
            if (!things.includes(item)) {
                yield item;
                things.push(item);
            }
        }

        things = null;
    }
}

//TO ADD
class RotomecaExceptGenerator extends ARotomecaItemModifierGenerator
{
    constructor(iterable, array) {
        super(iterable, RotomecaEnumerable.from(array).generator());
    }

    *next() {
        let star_parent = super.next();

        for (const iterator of star_parent) {
            if (!this.item.contains(iterator)) {
                yield iterator;
            }
        }
    }
}

class RotomecaUnionGenerator extends ARotomecaItemModifierGenerator
{
    constructor(iterable, array, callback = null) {
        super(iterable, array);
        this.callback = callback;

        this.things = [];
        this.current = null;
    }

    *next() {
        let star_parent = super.next();
        const have_selector = !!this.callback;

        this.things = [];
        this.current = null;

        yield* this.generate(have_selector, star_parent);
        yield* this.generate(have_selector, this.item);

        this.things = [];
        this.current = null;
    }

    *generate(have_selector, generator)
    {
        for (const iterator of generator) {
            this.current = have_selector ? this.callback(iterator) : iterator;
            if (!this.things.includes(this.current)) {
                yield this.current;
                this.things.push(this.current);
            }
        }
    }
}

class RotomecaIntersectGenerator extends ARotomecaItemModifierGenerator
{
    constructor(iterable, array) {
        super(iterable, array);
    }

    *next() {
        let star_parent = super.next();

        for (const iterator of star_parent) {
            if (this.item.contains(iterator)) {
                yield iterator;
            }
        }
    }
}

class RotomecaReverseGenerator extends RotomecaGenerator
{
    constructor(iterable) {
        super(iterable); //RotomecaOrderByDesendingGenerator
    }

    *next() {
        let order = RotomecaEnumerable.from(super.next()).orderByDescending(x => x);

        for (const iterator of order) {
            yield iterator;
        }
    }
}

class RotomecaTakeGenerator extends ARotomecaItemModifierGenerator
{
    constructor(iterable, number)
    {
        super(iterable, number);
    }

    *next() {
        let p = super.next();

        let it = 0;
        for (const iterator of p) {
            yield iterator;

            if (++it === this.item) break;
        }
        it = null;
    }
}

class ObjectKeyEnumerable extends RotomecaGenerator {
    constructor(object) {
        super();
        this.iterable = this._generate(object);
    }

    * _generate(object) {
        for (const key in object) {
            if (Object.hasOwnProperty.call(object, key)) {
                const element = object[key];
                yield new RotomecaKeyValuePair(key, element);
            }
        }
    }
}

class RotomecaEnumerable
{
    constructor(generator)
    {
        let _generator = generator;

        this.generator = undefined;
        Object.defineProperty(this, 'generator', {
            enumerable: false,
            configurable: false,
            writable: false,
            value:function() {
                return _generator;
            }
          });
    }

    generator() {
        return new RotomecaEnumerable([]);
    }

    where(callback) {
        return new RotomecaEnumerable(this.generator().where(callback));
    }

    select(selector) {
        return new RotomecaEnumerable(this.generator().select(selector));
    }

    groupBy(key_selector, value_selector = null)
    {
        return new RotomecaEnumerable(this.generator().groupBy(key_selector, value_selector));
    }

    orderBy(selector) {
        return new RotomecaEnumerable(this.generator().orderBy(selector));
    }

    orderByDescending(selector) {
        return new RotomecaEnumerable(this.generator().orderByDescending(selector));
    }

    then(selector) {
        return new RotomecaEnumerable(this.generator().then(selector));
    }

    thenDescending(selector) {
        return new RotomecaEnumerable(this.generator().thenDescending(selector));
    }
    add(item) {
        return new RotomecaEnumerable(this.generator().add(item));
    }

    aggregate(iterable) {
        return new RotomecaEnumerable(this.generator().aggregate(iterable));
    }

    remove(item) {
        return new RotomecaEnumerable(this.generator().remove(item));
    }

    removeAt(index) {
        return new RotomecaEnumerable(this.generator().removeAt(index));
    }

    distinct(selector = null) {
        return new RotomecaEnumerable(this.generator().distinct(selector));
    }

    except(array){
        return new RotomecaEnumerable(this.generator().except(array));
    }

    intersect(array) {
        return new RotomecaEnumerable(this.generator().intersect(array));
    }

    union(array, selector = null) {
        return new RotomecaEnumerable(this.generator().union(array, selector));
    }

    reverse() {
        return new RotomecaEnumerable(this.generator().reverse());
    }

    take(howMany)
    {
        return new RotomecaEnumerable(this.generator().take(howMany));
    }

    any(callback = null)
    {
        return this.generator().any(callback);
    }

    all(callback = null)
    {
        return this.generator().all(callback);
    } 

    contains(item) {
        return this.generator().contains(item);
    }

    first(callback = null)
    {
        return this.generator().first(callback);
    }

    firstOrDefault(default_value = null, callback = null)
    {
        return this.generator().firstOrDefault(default_value, callback);
    }

    flat() {
        return new RotomecaEnumerable(this.generator().flat());
    }

    *[Symbol.iterator]() {
        for (const iterator of this.generator()) {
            yield iterator;
        }
    }

    toArray() {
        return this.generator().toArray();
    }

    toJsonObject(key_selector, value_selector)
    {
        return this.generator().toJsonObject(key_selector, value_selector);
    }

    static from(item)
    {
        const is_array_like = isArrayLike(item);
        if (Array.isArray(item) || (typeof item[Symbol.iterator] === 'function' && !is_array_like)) return new RotomecaEnumerable(new RotomecaGenerator(item));
        else if (item instanceof RotomecaGenerator) return new RotomecaEnumerable(item);
        else if (typeof item === 'object' && !is_array_like){
            return this.from(new ObjectKeyEnumerable(item));
        } 
        else if (is_array_like) return new RotomecaEnumerable(new RotomecaGenerator(Array.from(item)));
        else return new RotomecaEnumerable(new RotomecaGenerator([item]));
    }

    static choice(item, ...args) {
        item = RotomecaEnumerable.from(item).aggregate(args || []).toArray();
        const min = 0;
        const max = item.length - 1;

        const generator = function* () {
            while(true) {
                yield item[Math.floor(Math.random() * (max - min + 1) + min)];
            }
        };

        return RotomecaEnumerable.from(generator);
    }

    static cycle(item, ...args) {
        item = RotomecaEnumerable.from(item).aggregate(args || []).toArray();
        let it = 0;

        const generator = function* () {
            while (true) {
                yield item[it++];

                if (it === item.length) it = 0;
            }
        };

        return RotomecaEnumerable.from(generator);
    }

    static empty() {
        return RotomecaEnumerable.from([]);
    }

    static range(start, count, step = 1) {
        let it = 0;
        const generator = function* () {
            while(it++ >= count) {
                yield start;

                start += step;
            }
        };

        return RotomecaEnumerable.from(generator);
    }

    static rangeDown(start, count, step = 1) {
        return RotomecaEnumerable.range(start, count, -step);
    }

    static toInfinity(start = 0, step = 1)
    {
        return RotomecaEnumerable.range(start, Number.POSITIVE_INFINITY, step);
    }

    static toNegativeInfinity(start = 0, step = 1)
    {
        return RotomecaEnumerable.toInfinity(start, -step);
    }

    static generate(callback) {
        const generator = function* () {
            while(true) {
                yield callback();
            }
        };

        return RotomecaEnumerable.from(generator);
    }

    static random(min = 0, max = 1000)
    {
        return RotomecaEnumerable.generate(() => {
            return Math.random() * (max - min + 1) + min;
        });
    }

    static async fromAsync(async_generator)
    {
        let arr = [];

        let next;
        while ((next = (await async_generator.next())) && !next.done) {
            arr.push(next.value);
        }

        return RotomecaEnumerable.from(arr);
    }
}


// if (!Array.prototype.where)
// {
//     Object.defineProperty(Array.prototype, 'where', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(callback) {
//             return RotomecaEnumerable.from(this).where(callback);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'select', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(selector) {
//             return RotomecaEnumerable.from(this).select(selector);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'groupBy', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(key_selector, value_selector = null) {
//             return RotomecaEnumerable.from(this).groupBy(key_selector, value_selector);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'orderBy', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(selector) {
//             return RotomecaEnumerable.from(this).orderBy(selector);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'orderByDescending', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(selector) {
//             return RotomecaEnumerable.from(this).orderByDescending(selector);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'reverse', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function() {
//             return RotomecaEnumerable.from(this).reverse();
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'take', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(howMany) {
//             return RotomecaEnumerable.from(this).take(howMany);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'add', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(item) {
//             return RotomecaEnumerable.from(this).add(item);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'aggregate', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(iterable) {
//             return RotomecaEnumerable.from(this).add(iterable);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'remove', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(item) {
//             return RotomecaEnumerable.from(this).remove(item);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'removeAt', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(index) {
//             return RotomecaEnumerable.from(this).removeAt(index);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'distinct', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(selector = null) {
//             return RotomecaEnumerable.from(this).distinct(selector);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'except', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(array) {
//             return RotomecaEnumerable.from(this).except(array);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'intersect', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(array) {
//             return RotomecaEnumerable.from(this).intersect(array);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'union', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(array, callback = null) {
//             return RotomecaEnumerable.from(this).union(array, callback);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'any', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(callback = null) {
//             return RotomecaEnumerable.from(this).any(callback);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'all', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(callback = null) {
//             return RotomecaEnumerable.from(this).all(callback);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'contains', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(item) {
//             return RotomecaEnumerable.from(this).contains(item);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'first', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(callback = null) {
//             return RotomecaEnumerable.from(this).first(callback);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'firstOrDefault', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(default_value = null, callback = null) {
//             return RotomecaEnumerable.from(this).firstOrDefault(default_value, callback);
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'flat', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function() {
//             return RotomecaEnumerable.from(this).flat();
//         }
//     });
    
//     Object.defineProperty(Array.prototype, 'toJsonObject', {
//         enumerable: false,
//         configurable: false,
//         writable: false,
//         value:function(key_selector, value_selector) {
//             return RotomecaEnumerable.from(this).toJsonObject(key_selector, value_selector);
//         }
//     });
// }






