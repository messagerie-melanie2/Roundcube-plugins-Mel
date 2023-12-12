export class Random {
    static intRange(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); 
    }

    static range(min, max) {
        return Math.random() * (max - min) + min;
    }

    static rbg_color() {
        return `rgb(${Random.intRange(0, 255)}, ${Random.intRange(0, 255)}, ${Random.intRange(0, 255)})`;	
    }
}