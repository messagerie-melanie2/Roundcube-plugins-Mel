export {Point, Shape ,Rectangle};

class Point {
    constructor(x = 0, y = 0) {
        this._init()._setup(x, y);
    }

    _init() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    _setup(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    static Zero() {
        return new Point(0, 0);
    }
}

class Shape extends Point {
    constructor(position, ...lines) {
        super(position.x, position.y);
        this.__init().__setup(...lines);
    }

    __init() {
        /**
         * @type {number[]}
         */
        this._lines = [];
        this.onrefresh = new MelEvent();
        return this;
    }

    __setup(...lines) {
        this._lines = lines;
        return this;
    }

    addLine(line) {
        this._lines.push(line);
        return this.refresh();
    }

    getLine(index) {
        return this._lines[index];
    }

    removeLine(index) {
        this._lines = this._lines.filter((x, i) => i !== index);
        return this.refresh();
    }

    updatePosition(newPos) {
        this.x = newPos.x;
        this.y = newPos.y;

        return this.refresh();
    }

    refresh() {
        
        if (this.onrefresh.haveEvents()) this.onrefresh.call(this);
        
        return this;
    }
}

class Rectangle extends Shape {
    constructor(position, width, height) {
        super(position, width, height);
    }
}

Object.defineProperties(Rectangle.prototype, {
    width: {
        get: function() {
            return this._lines[0] ?? 0;
        },
        set: function (value) {
            this._lines[0] = value;
            this.refresh();
        },
        configurable: true
    },
    height: {
        get: function() {
            return this._lines[1] ?? 0;
        },
        set: function (value) {
            this._lines[1] = value;
            this.refresh();
        },
        configurable: true
    }
});

