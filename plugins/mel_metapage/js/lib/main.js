export { main as Main, AMain };

class AMain {
    constructor() {
        this.main = [];
    }

    add(callback, ...args) {
        this.main.push({callback, args});
        return this;
    }

    call() {
        const main = this.main;
        this.main = [];

        for (let index = 0, len = main.length; index < len; ++index) {
            const element = main[index];
            element.callback(...element.args);   
        }

        return main;
    }
}

class Main extends AMain {
    constructor() {
        super();
    }
}

let main = new Main();