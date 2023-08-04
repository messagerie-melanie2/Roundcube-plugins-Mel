export {MelFor, MelForEx, MelForCallbacks};

class MelFor {
    constructor(start, end, callback, ...args) {
        this.start = start;
        this.end = end;
        this.callback = callback;
        this.args = args;
    }

    exec() {
        for (let index = this.start; index < this.end; ++index) {
            this.callback(index, this.start, this.end, ...this.args);
        }
    }

    *[Symbol.iterator]() {
        for (let index = this.start; index < this.end; ++index) {
            yield this.callback(index, this.start, this.end, ...this.args);
        }
    }

    static Start(start, end, callback, ...args) {
        return new MelFor(start, end, callback, ...args).exec();
    }

    static *Starting(start, end, callback, ...args) {
        const melFor = new MelFor(start, end, callback, ...args);
        for (const iterator of melFor) {
            yield iterator;
        }
    }
}

class MelForEx extends MelFor {
    constructor(start, callback_end, callback, {args_end = [], args_callback = []}) {
        super(start, callback_end, callback);
        this.args = {args_end, args_callback};
    }

    exec() {
        return [...this.exec_yield()];
    }

    *exec_yield() {
        for (let index = this.start, end = this.end(index, this.start, ...this.args.args_end); index < end; ++index, end = this.end(index, this.start, ...this.args.args_end)) {
            yield this.callback(index, this.start, end, ...this.args.args_callback);
        }
    }

    *[Symbol.iterator]() {
        return yield * this.exec_yield();
    }

    
    static Start(start, end, callback, {args_end = [], args_callback = []}) {
        return new MelForEx(start, end, callback, {args_end, args_callback}).exec();
    }

    static *Starting(start, end, callback, {args_end = [], args_callback = []}) {
        yield * new MelForEx(start, end, callback, {args_end, args_callback}).exec_yield();
    }
}

class MelForCallbacks extends MelForEx {
    constructor(start_callback, callback_end, callback, iterator_callback, {args_end = [], args_callback = [], args_start = [], args_iterator = []}) {
        super(start_callback, callback_end, callback, {args_end, args_callback});
        this.args.args_start = args_start;
        this.args.args_iterator = args_iterator;
        this.iterator_callback = iterator_callback;
    }

    exec() {
        return [...this.exec_yield()];
    }

    *exec_yield() {
        for (let start = this.start(...this.args.args_start),  index = start, end = this.end(index, start, ...this.args.args_end); index < end; index = this.iterator_callback(index, start, end,...this.args.args_iterator), end = this.end(index, start, ...this.args.args_end)) {
            yield this.callback(index, start, end, ...this.args);
        }
    }

    *[Symbol.iterator]() {
        return yield * this.exec_yield();
    }

    
    static Start(start_callback, callback_end, callback, iterator_callback, {args_end = [], args_callback = [], args_start = [], args_iterator = []}) {
        return new MelForCallbacks(start_callback, callback_end, callback, iterator_callback, {args_end, args_callback, args_start, args_iterator}).exec();
    }

    static *Starting(start_callback, callback_end, callback, iterator_callback, {args_end = [], args_callback = [], args_start = [], args_iterator = []}) {
        yield * new MelForCallbacks(start_callback, callback_end, callback, iterator_callback, {args_end, args_callback, args_start, args_iterator}).exec_yield();
    }
}