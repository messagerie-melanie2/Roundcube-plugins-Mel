export class Random {
    static intRange(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); 
    }

    static range(min, max) {
        return Math.random() * (max - min) + min;
    }
}